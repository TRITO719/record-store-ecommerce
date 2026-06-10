import express from 'express';
import cors from 'cors';
import { generalLimiter } from './middlewares/rateLimit';
import { authRoutes } from './modules/auth/auth.routes';
import { productRoutes } from './modules/products/product.routes';
import { orderRoutes } from './modules/orders/order.routes';
import { adminRoutes } from './modules/admin/admin.routes';
import { statisticsRoutes } from './modules/statistics/statistics.routes';
import chatRoutes from './modules/chat/chat.routes';
import { verifyAdmin } from './middlewares/auth';
import { upload } from './middlewares/upload';
import { env } from './config/env';

export const app = express();

app.set('trust proxy', 1);

app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true,
}));
app.use(express.json());
app.use(generalLimiter);

if (process.env.NODE_ENV !== 'production') {
  app.use('/uploads', express.static('uploads'));
}

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chat', chatRoutes);

// Statistics routes — protected by verifyAdmin inside the adminRoutes prefix
app.use('/api/admin/statistics', verifyAdmin, statisticsRoutes);

// Backward compatibility with previous upload endpoint.
app.post('/api/upload', verifyAdmin, upload.single('image'), (req, res) => {
  if (!req.file) {
    res.status(400).json({ message: 'No file uploaded' });
    return;
  }
  const imgUrl = req.file.path;
  res.json({ imgUrl });
});