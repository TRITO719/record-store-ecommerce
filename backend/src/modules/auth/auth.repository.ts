import { prisma } from '../../config/prisma';

export const authRepository = {
  findUserByEmail: (email: string) => prisma.user.findUnique({ where: { email } }),
  findUserById: (id: string) => prisma.user.findUnique({ where: { id } }),
  createUser: (email: string, hashedPassword: string, fullName?: string) =>
    prisma.user.create({
      data: { email, password: hashedPassword, fullName },
    }),
  updateUser: (id: string, data: { fullName?: string; phone?: string; address?: string }) =>
    prisma.user.update({
      where: { id },
      data,
    }),
  updatePassword: (id: string, hashedPassword: string) =>
    prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    }),
  /** Mark user as email-verified after successful OTP confirmation. */
  verifyUser: (email: string) =>
    prisma.user.update({
      where: { email },
      data: { isVerified: true },
    }),
};
