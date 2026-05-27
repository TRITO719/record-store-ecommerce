import { Router } from 'express';
import { authController } from './auth.controller';
import { strictLimiter, otpLimiter } from '../../middlewares/rateLimit';
import { verifyUser } from '../../middlewares/auth';

export const authRoutes = Router();

authRoutes.post('/register', authController.register);
authRoutes.post('/login', strictLimiter, authController.login);

// OTP verification routes — separate rate limiter to avoid conflicts with login
authRoutes.post('/verify-otp', otpLimiter, authController.verifyOtp);
authRoutes.post('/resend-otp', otpLimiter, authController.resendOtp);

// Protected routes — require valid JWT token
authRoutes.put('/profile', verifyUser, authController.updateProfile);
authRoutes.put('/password', verifyUser, strictLimiter, authController.changePassword);
