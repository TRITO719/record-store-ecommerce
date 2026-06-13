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

// Health check endpoint for monitoring & keeping backend awake (Render free tier)
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Diagnostic endpoint to check AI keys and connectivity directly from Render
app.get('/api/test-ai', async (_req, res) => {
  const results: any = {};
  
  try {
    results.deepseekKeyLength = env.DEEPSEEK_API_KEY ? env.DEEPSEEK_API_KEY.length : 0;
    const dsRes = await fetch(env.DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: env.DEEPSEEK_MODEL,
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 10,
      }),
    });
    results.deepseekStatus = dsRes.status;
    results.deepseekBody = await dsRes.json();
  } catch (err: any) {
    results.deepseekError = err.message || err;
  }

  // Test callGemini function exactly as used in chatService
  try {
    results.geminiKeyLength = env.GEMINI_API_KEY ? env.GEMINI_API_KEY.length : 0;
    
    const systemPrompt = "Bạn là trợ lý AI của cửa hàng Classic Records (bán Vinyl, CD, Merch). Trả lời bằng tiếng Việt, ngắn gọn, thân thiện.";
    const history = [
      { role: 'assistant', content: '👋 Xin chào! Tôi là trợ lý ảo của Classic Records.' }
    ];
    const message = "Có những Merch gì?";

    const contents = [];
    for (const h of history) {
      contents.push({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.content || '' }],
      });
    }
    contents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    const gemRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemPrompt }],
          },
          contents,
          generationConfig: {
            temperature: 0.5,
            maxOutputTokens: 1024,
          },
        }),
      }
    );
    
    results.geminiStatus = gemRes.status;
    results.geminiBody = await gemRes.json();
  } catch (err: any) {
    results.geminiError = err.stack || err.message || err;
  }

  res.json(results);
});

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