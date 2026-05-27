import { prisma } from '../../config/prisma';

export const otpRepository = {
  /** Create a new OTP record with hashed code and expiry. */
  createOtp: (email: string, hashedCode: string, expiresAt: Date) =>
    prisma.otp.create({
      data: { email, code: hashedCode, expiresAt },
    }),

  /** Find the most recent OTP for an email (for cooldown check). */
  findLatestOtp: (email: string) =>
    prisma.otp.findFirst({
      where: { email },
      orderBy: { createdAt: 'desc' },
    }),

  /** Count OTPs created for this email in the last hour (rate limit). */
  countRecentOtps: (email: string, since: Date) =>
    prisma.otp.count({
      where: {
        email,
        createdAt: { gte: since },
      },
    }),

  /** Find all non-expired OTPs for this email (for verification). */
  findValidOtps: (email: string) =>
    prisma.otp.findMany({
      where: {
        email,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    }),

  /** Delete all OTPs for this email after successful verification. */
  deleteOtpsByEmail: (email: string) =>
    prisma.otp.deleteMany({
      where: { email },
    }),
};
