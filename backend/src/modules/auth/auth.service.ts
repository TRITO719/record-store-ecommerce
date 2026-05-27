import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authRepository } from './auth.repository';
import { otpRepository } from './otp.repository';
import { env } from '../../config/env';
import { sendOtpEmail } from '../../config/mail';

// Input length limits to prevent abuse
const MAX_NAME_LENGTH = 128;
const MAX_PHONE_LENGTH = 20;
const MAX_ADDRESS_LENGTH = 500;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;

// OTP configuration
const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 5;
const OTP_COOLDOWN_SECONDS = 60;
const OTP_MAX_PER_HOUR = 5;

/** Generate a cryptographically secure 6-digit OTP. */
function generateOtp(): string {
  // Use crypto.randomInt for uniform distribution in [0, 999999]
  const num = crypto.randomInt(0, 10 ** OTP_LENGTH);
  return num.toString().padStart(OTP_LENGTH, '0');
}

export const authService = {
  /**
   * Register a new user. Creates the account with isVerified=false,
   * generates an OTP, sends it via email, and returns requireOtp flag.
   */
  async register(input: { email?: string; password?: string; fullName?: string }) {
    const { email, password, fullName } = input;

    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      throw new Error(`Mật khẩu phải có ít nhất ${MIN_PASSWORD_LENGTH} ký tự`);
    }

    if (password.length > MAX_PASSWORD_LENGTH) {
      throw new Error(`Mật khẩu không được vượt quá ${MAX_PASSWORD_LENGTH} ký tự`);
    }

    const existing = await authRepository.findUserByEmail(email);
    if (existing) {
      throw new Error('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await authRepository.createUser(email, hashedPassword, fullName);

    // Generate and send OTP
    const otp = generateOtp();
    const hashedOtp = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
    await otpRepository.createOtp(email, hashedOtp, expiresAt);

    await sendOtpEmail(email, otp);

    return {
      requireOtp: true,
      email,
      message: 'Đăng ký thành công! Vui lòng kiểm tra email để lấy mã OTP.',
    };
  },

  /**
   * Login — checks isVerified before allowing login.
   * If user is not verified, returns requireOtp so frontend can show OTP screen.
   */
  async login(input: { email?: string; password?: string }) {
    const { email, password } = input;
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    const user = await authRepository.findUserByEmail(email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error('Invalid credentials');
    }

    // Check if account is verified
    if (!user.isVerified) {
      throw new Error('ACCOUNT_NOT_VERIFIED');
    }

    const token = jwt.sign({ userId: user.id }, env.JWT_SECRET, { expiresIn: '7d' });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        address: user.address,
        role: user.role,
      },
    };
  },

  /**
   * Verify OTP — checks the code against stored hashed OTPs,
   * marks user as verified, and cleans up OTP records.
   */
  async verifyOtp(input: { email?: string; code?: string }) {
    const { email, code } = input;

    if (!email || !code) {
      throw new Error('Email và mã OTP là bắt buộc');
    }

    if (code.length !== OTP_LENGTH || !/^\d+$/.test(code)) {
      throw new Error('Mã OTP không hợp lệ');
    }

    const user = await authRepository.findUserByEmail(email);
    if (!user) {
      throw new Error('Email không tồn tại');
    }

    if (user.isVerified) {
      return { message: 'Tài khoản đã được xác thực trước đó' };
    }

    // Find valid (non-expired) OTPs for this email
    const validOtps = await otpRepository.findValidOtps(email);
    if (validOtps.length === 0) {
      throw new Error('Mã OTP đã hết hạn. Vui lòng yêu cầu gửi lại.');
    }

    // Check the code against all valid OTPs (most recent first)
    let matched = false;
    for (const otp of validOtps) {
      const isMatch = await bcrypt.compare(code, otp.code);
      if (isMatch) {
        matched = true;
        break;
      }
    }

    if (!matched) {
      throw new Error('Mã OTP không chính xác');
    }

    // Mark user as verified and clean up OTPs
    await authRepository.verifyUser(email);
    await otpRepository.deleteOtpsByEmail(email);

    // Re-fetch user to get updated isVerified status
    const verifiedUser = await authRepository.findUserByEmail(email);

    // Issue JWT token so the user is auto-logged-in after OTP verification
    const token = jwt.sign({ userId: user.id }, env.JWT_SECRET, { expiresIn: '7d' });

    return {
      message: 'Xác thực tài khoản thành công!',
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: verifiedUser?.fullName ?? user.fullName,
        phone: verifiedUser?.phone ?? null,
        address: verifiedUser?.address ?? null,
        role: user.role,
      },
    };
  },

  /**
   * Resend OTP — with cooldown (60s) and rate limiting (5/hour).
   * Only available for unverified accounts.
   */
  async resendOtp(input: { email?: string }) {
    const { email } = input;

    if (!email) {
      throw new Error('Email là bắt buộc');
    }

    const user = await authRepository.findUserByEmail(email);
    if (!user) {
      throw new Error('Email không tồn tại trong hệ thống');
    }

    if (user.isVerified) {
      throw new Error('Tài khoản đã được xác thực');
    }

    // Cooldown check: 60 seconds between sends
    const latestOtp = await otpRepository.findLatestOtp(email);
    if (latestOtp) {
      const elapsed = Date.now() - latestOtp.createdAt.getTime();
      const remaining = Math.ceil((OTP_COOLDOWN_SECONDS * 1000 - elapsed) / 1000);
      if (remaining > 0) {
        throw new Error(`Vui lòng đợi ${remaining} giây trước khi gửi lại`);
      }
    }

    // Rate limit: max 5 OTPs per email per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentCount = await otpRepository.countRecentOtps(email, oneHourAgo);
    if (recentCount >= OTP_MAX_PER_HOUR) {
      throw new Error('Bạn đã gửi quá nhiều mã OTP. Vui lòng thử lại sau 1 giờ.');
    }

    // Generate and send new OTP
    const otp = generateOtp();
    const hashedOtp = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
    await otpRepository.createOtp(email, hashedOtp, expiresAt);

    await sendOtpEmail(email, otp);

    return { message: 'Mã OTP mới đã được gửi đến email của bạn' };
  },

  async updateProfile(
    userId: string,
    input: { fullName?: string; phone?: string; address?: string },
  ) {
    const { fullName, phone, address } = input;

    if (!fullName || !fullName.trim()) {
      throw new Error('Họ tên không được để trống');
    }

    if (fullName.length > MAX_NAME_LENGTH) {
      throw new Error(`Họ tên không được vượt quá ${MAX_NAME_LENGTH} ký tự`);
    }

    // Validate phone format if provided
    if (phone && phone.trim()) {
      const cleaned = phone.replace(/\s/g, '');
      if (cleaned.length > MAX_PHONE_LENGTH) {
        throw new Error('Số điện thoại không hợp lệ');
      }
      if (!/^(0|\+84)[0-9]{9,10}$/.test(cleaned)) {
        throw new Error('Số điện thoại không hợp lệ');
      }
    }

    if (address && address.length > MAX_ADDRESS_LENGTH) {
      throw new Error(`Địa chỉ không được vượt quá ${MAX_ADDRESS_LENGTH} ký tự`);
    }

    const user = await authRepository.updateUser(userId, {
      fullName: fullName.trim(),
      phone: phone?.trim() || null as any,
      address: address?.trim() || null as any,
    });

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      address: user.address,
      role: user.role,
    };
  },

  async changePassword(
    userId: string,
    input: { currentPassword?: string; newPassword?: string },
  ) {
    const { currentPassword, newPassword } = input;

    if (!currentPassword || !newPassword) {
      throw new Error('Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới');
    }

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      throw new Error(`Mật khẩu mới phải có ít nhất ${MIN_PASSWORD_LENGTH} ký tự`);
    }

    if (newPassword.length > MAX_PASSWORD_LENGTH) {
      throw new Error(`Mật khẩu không được vượt quá ${MAX_PASSWORD_LENGTH} ký tự`);
    }

    const user = await authRepository.findUserById(userId);
    if (!user) {
      throw new Error('Người dùng không tồn tại');
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      throw new Error('Mật khẩu hiện tại không chính xác');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await authRepository.updatePassword(userId, hashedPassword);

    // TODO(security): Consider invalidating all other active sessions/tokens
    // after a password change to prevent compromised sessions from remaining active.

    return { message: 'Mật khẩu đã được thay đổi thành công' };
  },
};
