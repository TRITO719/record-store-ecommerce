import { Router, Request, Response } from 'express';
import { adminController } from './admin.controller';
import { verifyAdmin } from '../../middlewares/auth';
import { upload } from '../../middlewares/upload';
import { env } from '../../config/env';

export const adminRoutes = Router();

adminRoutes.use(verifyAdmin);

adminRoutes.get('/stats', adminController.getStats);
adminRoutes.get('/users', adminController.getUsers);
adminRoutes.put('/users/:id/role', adminController.updateUserRole);
adminRoutes.get('/orders', adminController.getOrders);
adminRoutes.put('/orders/:id', adminController.updateOrderStatus);

adminRoutes.post('/upload', upload.single('image'), (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ message: 'No file uploaded' });
    return;
  }
  const imgUrl = req.file.path;
  res.json({ imgUrl });
});
