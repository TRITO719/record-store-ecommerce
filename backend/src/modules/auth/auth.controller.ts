import { Request, Response } from 'express';
import { authService } from './auth.service';
import { AuthenticatedRequest } from '../../types/auth';

export const authController = {
  async register(req: Request, res: Response) {
    try {
      const result = await authService.register(req.body);
      res.status(201).json(result);
    } catch (error: any) {
      if (
        error.message === 'Email and password are required' ||
        error.message === 'Email already exists' ||
        error.message.includes('ký tự')
      ) {
        res.status(400).json({ message: error.message });
        return;
      }
      console.error('Register error:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  },

  async login(req: Request, res: Response) {
    try {
      const result = await authService.login(req.body);
      res.json({
        message: 'Login successful',
        token: result.token,
        user: result.user,
      });
    } catch (error: any) {
      if (error.message === 'ACCOUNT_NOT_VERIFIED') {
        // Return a special response so frontend knows to show OTP screen
        res.status(403).json({
          message: 'Tài khoản chưa được xác thực. Vui lòng nhập mã OTP.',
          requireOtp: true,
          email: req.body.email,
        });
        return;
      }
      if (
        error.message === 'Email and password are required' ||
        error.message === 'Invalid credentials'
      ) {
        res.status(400).json({ message: error.message });
        return;
      }
      console.error('Login error:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  },

  async verifyOtp(req: Request, res: Response) {
    try {
      const result = await authService.verifyOtp(req.body);
      res.json(result);
    } catch (error: any) {
      if (
        error.message.includes('OTP') ||
        error.message.includes('bắt buộc') ||
        error.message.includes('hết hạn') ||
        error.message.includes('không tồn tại') ||
        error.message.includes('xác thực')
      ) {
        res.status(400).json({ message: error.message });
        return;
      }
      console.error('Verify OTP error:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  },

  async resendOtp(req: Request, res: Response) {
    try {
      const result = await authService.resendOtp(req.body);
      res.json(result);
    } catch (error: any) {
      if (
        error.message.includes('bắt buộc') ||
        error.message.includes('không tồn tại') ||
        error.message.includes('đã được xác thực') ||
        error.message.includes('đợi') ||
        error.message.includes('quá nhiều')
      ) {
        res.status(400).json({ message: error.message });
        return;
      }
      console.error('Resend OTP error:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  },

  async updateProfile(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const user = await authService.updateProfile(req.user.id, req.body);
      res.json({ message: 'Cập nhật thông tin thành công', user });
    } catch (error: any) {
      if (
        error.message.includes('không được') ||
        error.message.includes('không hợp lệ')
      ) {
        res.status(400).json({ message: error.message });
        return;
      }
      console.error('Update profile error:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  },

  async changePassword(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const result = await authService.changePassword(req.user.id, req.body);
      res.json(result);
    } catch (error: any) {
      if (
        error.message.includes('Vui lòng') ||
        error.message.includes('không chính xác') ||
        error.message.includes('ký tự') ||
        error.message.includes('không tồn tại')
      ) {
        res.status(400).json({ message: error.message });
        return;
      }
      console.error('Change password error:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  },
};
