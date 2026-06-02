import { rateLimit } from 'express-rate-limit';

export const generalLimiter = rateLimit({
  windowMs: 10 * 1000,
  max: 100,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau 10 giây.' },
});

export const strictLimiter = rateLimit({
  windowMs: 10 * 1000,
  max: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Phát hiện hoạt động bất thường. Vui lòng thử lại sau 10 giây.' },
});

/** Separate limiter for OTP verify/resend — more generous than login. */
export const otpLimiter = rateLimit({
  windowMs: 10 * 1000,
  max: 15,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Bạn đã thử quá nhiều lần. Vui lòng đợi 10 giây.' },
});

