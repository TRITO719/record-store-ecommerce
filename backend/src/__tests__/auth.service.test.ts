/**
 * Unit tests for authService
 * Mocks: authRepository, otpRepository, bcryptjs, jsonwebtoken, mail config
 */

// ── Mock modules BEFORE importing the service ────────────────────────────────

jest.mock('../modules/auth/auth.repository', () => ({
  authRepository: {
    findUserByEmail: jest.fn(),
    findUserById: jest.fn(),
    createUser: jest.fn(),
    updateUser: jest.fn(),
    updateUnverifiedUser: jest.fn(),
    updatePassword: jest.fn(),
    verifyUser: jest.fn(),
  },
}));

jest.mock('../modules/auth/otp.repository', () => ({
  otpRepository: {
    createOtp: jest.fn(),
    findLatestOtp: jest.fn(),
    findValidOtps: jest.fn(),
    countRecentOtps: jest.fn(),
    deleteOtpsByEmail: jest.fn(),
  },
}));

// bcryptjs is a CJS module — the default export IS the module object
jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

// jsonwebtoken is a CJS module — same pattern
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mock.jwt.token'),
  verify: jest.fn(),
}));

jest.mock('../config/mail', () => ({
  sendOtpEmail: jest.fn(),
  sendPasswordResetOtpEmail: jest.fn(),
}));

jest.mock('../config/env', () => ({
  env: { JWT_SECRET: 'test-secret' },
}));

// ── Import after mocks ────────────────────────────────────────────────────────

import { authService } from '../modules/auth/auth.service';
import { authRepository } from '../modules/auth/auth.repository';
import { otpRepository } from '../modules/auth/otp.repository';

// Under CommonJS transform, `import X from 'module'` gives the whole mock object
const bcryptMock = require('bcryptjs') as { hash: jest.Mock; compare: jest.Mock };
const jwtMock = require('jsonwebtoken') as { sign: jest.Mock; verify: jest.Mock };

const mockAuthRepo = authRepository as jest.Mocked<typeof authRepository>;
const mockOtpRepo = otpRepository as jest.Mocked<typeof otpRepository>;

// ── Shared test fixtures ──────────────────────────────────────────────────────

const verifiedUser = {
  id: 'user-1',
  email: 'test@example.com',
  password: '$2b$10$hashedPassword',
  fullName: 'Test User',
  phone: null,
  address: null,
  role: 'USER' as const,
  isVerified: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const unverifiedUser = { ...verifiedUser, isVerified: false };

// ─────────────────────────────────────────────────────────────────────────────
// authService.login
// ─────────────────────────────────────────────────────────────────────────────

describe('authService.login', () => {
  // ── Happy paths ──────────────────────────────────────────────────────────

  it('✅ [HP-1] returns token + user when credentials are correct', async () => {
    mockAuthRepo.findUserByEmail.mockResolvedValue(verifiedUser);
    bcryptMock.compare.mockResolvedValue(true as never);

    const result = await authService.login({ email: 'test@example.com', password: 'password123' });

    expect(result).toMatchObject({
      token: 'mock.jwt.token',
      user: {
        id: 'user-1',
        email: 'test@example.com',
        role: 'USER',
      },
    });
    expect(jwtMock.sign).toHaveBeenCalledWith(
      { userId: 'user-1' },
      'test-secret',
      { expiresIn: '7d' },
    );
  });

  it('✅ [HP-2] returns correct user profile fields in the response', async () => {
    const userWithProfile = {
      ...verifiedUser,
      fullName: 'Nguyen Van A',
      phone: '0912345678',
      address: '123 Đường ABC',
    };
    mockAuthRepo.findUserByEmail.mockResolvedValue(userWithProfile);
    bcryptMock.compare.mockResolvedValue(true as never);

    const result = await authService.login({ email: 'test@example.com', password: 'password123' });

    expect(result.user.fullName).toBe('Nguyen Van A');
    expect(result.user.phone).toBe('0912345678');
    expect(result.user.address).toBe('123 Đường ABC');
  });

  // ── Edge cases ───────────────────────────────────────────────────────────

  it('🔴 [EC-1] throws "Invalid credentials" when user does not exist', async () => {
    mockAuthRepo.findUserByEmail.mockResolvedValue(null);

    await expect(
      authService.login({ email: 'nobody@example.com', password: 'password123' }),
    ).rejects.toThrow('Invalid credentials');
  });

  it('🔴 [EC-2] throws "Invalid credentials" when password is wrong', async () => {
    mockAuthRepo.findUserByEmail.mockResolvedValue(verifiedUser);
    bcryptMock.compare.mockResolvedValue(false as never);

    await expect(
      authService.login({ email: 'test@example.com', password: 'wrongpassword' }),
    ).rejects.toThrow('Invalid credentials');
  });

  it('🔴 [EC-3] throws "ACCOUNT_NOT_VERIFIED" when account is not verified', async () => {
    mockAuthRepo.findUserByEmail.mockResolvedValue(unverifiedUser);
    bcryptMock.compare.mockResolvedValue(true as never);

    await expect(
      authService.login({ email: 'test@example.com', password: 'password123' }),
    ).rejects.toThrow('ACCOUNT_NOT_VERIFIED');
  });

  it('🔴 [EC-4] throws when email or password fields are missing', async () => {
    await expect(authService.login({ email: '', password: 'abc' })).rejects.toThrow(
      'Email and password are required',
    );
    await expect(authService.login({ email: 'a@b.com', password: '' })).rejects.toThrow(
      'Email and password are required',
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// authService.register
// ─────────────────────────────────────────────────────────────────────────────

describe('authService.register', () => {
  beforeEach(() => {
    bcryptMock.hash.mockResolvedValue('$2b$hashed' as never);
    mockOtpRepo.createOtp.mockResolvedValue({} as any);
  });

  // ── Happy paths ──────────────────────────────────────────────────────────

  it('✅ [HP-3] registers a new user and returns requireOtp: true', async () => {
    mockAuthRepo.findUserByEmail.mockResolvedValue(null);
    mockAuthRepo.createUser.mockResolvedValue(verifiedUser);

    const result = await authService.register({
      email: 'new@example.com',
      password: 'securePass1',
      fullName: 'New User',
    });

    expect(result).toMatchObject({ requireOtp: true, email: 'new@example.com' });
    expect(mockAuthRepo.createUser).toHaveBeenCalledWith('new@example.com', '$2b$hashed', 'New User');
  });

  it('✅ [HP-4] re-uses existing unverified account and sends a fresh OTP', async () => {
    mockAuthRepo.findUserByEmail.mockResolvedValue(unverifiedUser);
    mockAuthRepo.updateUnverifiedUser.mockResolvedValue(unverifiedUser);

    const result = await authService.register({
      email: 'test@example.com',
      password: 'newPassword1',
    });

    expect(result.requireOtp).toBe(true);
    expect(mockAuthRepo.updateUnverifiedUser).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ password: '$2b$hashed' }),
    );
    expect(mockAuthRepo.createUser).not.toHaveBeenCalled();
  });

  // ── Edge cases ───────────────────────────────────────────────────────────

  it('🔴 [EC-5] throws "Email already exists" when a verified email is reused', async () => {
    mockAuthRepo.findUserByEmail.mockResolvedValue(verifiedUser); // isVerified: true

    await expect(
      authService.register({ email: 'test@example.com', password: 'password123' }),
    ).rejects.toThrow('Email already exists');
  });

  it('🔴 [EC-6] throws when password is shorter than 8 characters', async () => {
    await expect(
      authService.register({ email: 'a@b.com', password: 'short' }),
    ).rejects.toThrow(/ít nhất 8 ký tự/);
  });

  it('🔴 [EC-7] throws when email or password are missing', async () => {
    await expect(authService.register({ email: '', password: 'password123' })).rejects.toThrow(
      'Email and password are required',
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// authService.changePassword
// ─────────────────────────────────────────────────────────────────────────────

describe('authService.changePassword', () => {
  beforeEach(() => {
    bcryptMock.hash.mockResolvedValue('$2b$newHashed' as never);
  });

  // ── Happy path ───────────────────────────────────────────────────────────

  it('✅ [HP-5] changes password successfully when current password matches', async () => {
    mockAuthRepo.findUserById.mockResolvedValue(verifiedUser);
    bcryptMock.compare.mockResolvedValue(true as never);
    mockAuthRepo.updatePassword.mockResolvedValue(verifiedUser);

    const result = await authService.changePassword('user-1', {
      currentPassword: 'oldPassword1',
      newPassword: 'newPassword1',
    });

    expect(result).toEqual({ message: 'Mật khẩu đã được thay đổi thành công' });
    expect(mockAuthRepo.updatePassword).toHaveBeenCalledWith('user-1', '$2b$newHashed');
  });

  // ── Edge cases ───────────────────────────────────────────────────────────

  it('🔴 [EC-8] throws when current password is incorrect', async () => {
    mockAuthRepo.findUserById.mockResolvedValue(verifiedUser);
    bcryptMock.compare.mockResolvedValue(false as never);

    await expect(
      authService.changePassword('user-1', {
        currentPassword: 'wrongOld',
        newPassword: 'newPassword1',
      }),
    ).rejects.toThrow('Mật khẩu hiện tại không chính xác');
  });

  it('🔴 [EC-9] throws when new password is too short', async () => {
    await expect(
      authService.changePassword('user-1', {
        currentPassword: 'oldPassword1',
        newPassword: 'short',
      }),
    ).rejects.toThrow(/ít nhất 8 ký tự/);
  });
});
