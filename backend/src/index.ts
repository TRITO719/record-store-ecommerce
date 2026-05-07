import express, { Request, Response } from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import Redis from 'ioredis';
import { rateLimit } from 'express-rate-limit';

dotenv.config();

// --- RATE LIMITERS ---
// Giới hạn chung: 100 requests / 15 phút cho mỗi IP
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau 15 phút.' }
});

// Giới hạn nghiêm ngặt cho Login và Checkout: 5 lần / 15 phút
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Phát hiện hoạt động bất thường. Vui lòng thử lại sau 15 phút.' }
});

// Validate JWT_SECRET tại startup — không cho phép chạy thiếu secret
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET is not defined in environment variables. Server cannot start.');
}

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// --- RETRY UTILITY ---
// Hàm retry với Exponential Backoff: tự động thử lại khi gặp lỗi tạm thời.
// Chỉ retry khi lỗi là transient (mạng, timeout, kết nối DB) — không retry lỗi logic (4xx).
const withRetry = async <T>(
  fn: () => Promise<T>,
  options: { maxAttempts?: number; baseDelayMs?: number; label?: string } = {}
): Promise<T> => {
  const { maxAttempts = 3, baseDelayMs = 500, label = 'operation' } = options;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      const isLastAttempt = attempt === maxAttempts;

      // Không retry lỗi logic từ ứng dụng (ví dụ: hết hàng, không tìm thấy sản phẩm)
      const isAppError = err?.message?.includes('not found') || err?.message?.includes('Not enough stock');
      if (isAppError || isLastAttempt) throw err;

      const delayMs = Math.min(baseDelayMs * Math.pow(2, attempt - 1), 8000);
      console.warn(`⚠️ [Retry] ${label} thất bại lần ${attempt}/${maxAttempts}. Thử lại sau ${delayMs}ms... Lỗi: ${err.message}`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw new Error(`[Retry] ${label} thất bại sau ${maxAttempts} lần thử.`);
};

// --- REDIS SETUP ---
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const redis = new Redis(REDIS_URL, {
  // Retry mỗi request tối đa 3 lần trước khi báo lỗi
  maxRetriesPerRequest: 3,
  // Exponential backoff khi mất kết nối: 500ms, 1000ms, 2000ms, ... tối đa 10s
  // Trả về số ms để chờ (không trả null) → ioredis sẽ tự kết nối lại vô thời hạn
  retryStrategy: (times) => {
    const delay = Math.min(500 * Math.pow(2, times - 1), 10000);
    console.warn(`⚠️ [Redis Retry] Lần ${times} — thử kết nối lại sau ${delay}ms`);
    return delay;
  },
  // Tự kết nối lại khi gặp lỗi READONLY (Redis failover) hoặc ECONNRESET
  reconnectOnError: (err) => {
    const reconnectErrors = ['READONLY', 'ECONNRESET', 'ECONNREFUSED'];
    return reconnectErrors.some((e) => err.message.includes(e));
  },
});

let redisConnected = false;
redis.on('connect', () => {
  redisConnected = true;
  console.log('✅ Redis connected successfully');
});
redis.on('ready', () => {
  redisConnected = true;
  console.log('✅ Redis ready — cache layer hoạt động');
});
redis.on('error', (err) => {
  redisConnected = false;
  console.warn('⚠️ Redis connection error (app sẽ fallback về PostgreSQL):', err.message);
});
redis.on('reconnecting', () => {
  console.warn('🔄 [Redis Retry] Đang thử kết nối lại Redis...');
});

// --- REDIS CACHE HELPERS (Product) ---
const CACHE_TTL = 3600; // 1 giờ
const CACHE_KEYS = {
  allProducts: 'products:all',
  productById: (id: number) => `products:${id}`,
};

// [CREATE] Lưu 1 product vào Redis
const cacheProduct = async (product: any) => {
  if (!redisConnected) return;
  try {
    await redis.set(CACHE_KEYS.productById(product.id), JSON.stringify(product), 'EX', CACHE_TTL);
  } catch (err) {
    console.warn('Redis cache set error:', err);
  }
};

// [READ] Đọc 1 product từ Redis
const getCachedProduct = async (id: number) => {
  if (!redisConnected) return null;
  try {
    const cached = await redis.get(CACHE_KEYS.productById(id));
    return cached ? JSON.parse(cached) : null;
  } catch (err) {
    console.warn('Redis cache get error:', err);
    return null;
  }
};

// [READ] Đọc danh sách products từ Redis
const getCachedProducts = async (cacheKey: string) => {
  if (!redisConnected) return null;
  try {
    const cached = await redis.get(cacheKey);
    return cached ? JSON.parse(cached) : null;
  } catch (err) {
    console.warn('Redis cache get error:', err);
    return null;
  }
};

// [UPDATE] Cập nhật cache sau khi thay đổi dữ liệu
const refreshProductsCache = async () => {
  if (!redisConnected) return;
  try {
    // Xóa cache danh sách cũ
    const keys = await redis.keys('products:*');
    if (keys.length > 0) await redis.del(...keys);
    // Tải lại toàn bộ từ DB và cache
    const products = await prisma.product.findMany({ orderBy: { id: 'asc' } });
    await redis.set(CACHE_KEYS.allProducts, JSON.stringify(products), 'EX', CACHE_TTL);
    for (const p of products) {
      await redis.set(CACHE_KEYS.productById(p.id), JSON.stringify(p), 'EX', CACHE_TTL);
    }
  } catch (err) {
    console.warn('Redis refresh cache error:', err);
  }
};

// [DELETE] Xóa 1 product khỏi Redis
const deleteCachedProduct = async (id: number) => {
  if (!redisConnected) return;
  try {
    await redis.del(CACHE_KEYS.productById(id));
    await redis.del(CACHE_KEYS.allProducts); // Invalidate danh sách
  } catch (err) {
    console.warn('Redis cache delete error:', err);
  }
};

const app = express();
const PORT = process.env.PORT || 3000;

// Cấu hình trust proxy để Rate Limiter nhận diện đúng IP người dùng khi chạy qua Nginx/Docker
app.set('trust proxy', 1);

app.use(cors());
app.use(express.json());
app.use(generalLimiter); // Apply general rate limit to all requests
app.use('/uploads', express.static('uploads'));

// Multer config: chỉ chấp nhận file ảnh, giới hạn 5MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file ảnh (JPEG, PNG, GIF, WebP).'));
    }
  }
});

// --- AUTHENTICATION ROUTES ---

// POST Register
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { email, password, fullName } = req.body;
    
    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required' });
      return;
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ message: 'Email already exists' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        fullName
      }
    });

    res.status(201).json({ message: 'User registered successfully', user: { id: user.id, email: user.email, fullName: user.fullName } });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// POST Login — [STRICT RATE LIMIT] giới hạn thử sai mật khẩu
app.post('/api/auth/login', strictLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(400).json({ message: 'Invalid credentials' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(400).json({ message: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// GET all products — [REDIS READ] đọc từ cache trước, fallback PostgreSQL
app.get('/api/products', async (req: Request, res: Response) => {
  try {
    const { category } = req.query;

    // Nếu không filter category → thử đọc cache toàn bộ
    if (!category) {
      const cached = await getCachedProducts(CACHE_KEYS.allProducts);
      if (cached) {
        console.log('📦 [Redis HIT] GET /api/products — trả từ cache');
        res.json(cached);
        return;
      }
    }

    // Cache MISS hoặc có filter → query PostgreSQL
    console.log('🗄️ [Redis MISS] GET /api/products — query PostgreSQL');
    const filter = category ? { category: String(category) } : {};
    const products = await prisma.product.findMany({ 
      where: filter,
      orderBy: { id: 'asc' }
    });

    // Cache kết quả nếu không có filter
    if (!category) {
      await redis.set(CACHE_KEYS.allProducts, JSON.stringify(products), 'EX', CACHE_TTL).catch(() => {});
    }

    res.json(products);
  } catch (error) {
    console.error('GET /api/products error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// GET product by id — [REDIS READ] đọc từ cache trước
app.get('/api/products/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    // Thử đọc từ Redis cache
    const cached = await getCachedProduct(id);
    if (cached) {
      console.log(`📦 [Redis HIT] GET /api/products/${id}`);
      res.json(cached);
      return;
    }

    // Cache MISS → query PostgreSQL
    console.log(`🗄️ [Redis MISS] GET /api/products/${id} — query PostgreSQL`);
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    // Cache lại cho lần sau
    await cacheProduct(product);
    res.json(product);
  } catch (error) {
    console.error('GET /api/products/:id error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// POST checkout — [STRICT RATE LIMIT] ngăn chặn spam đơn hàng
// [RETRY] Tự động thử lại tối đa 3 lần nếu gặp lỗi kết nối DB tạm thời
app.post('/api/orders/checkout', strictLimiter, async (req: Request, res: Response) => {
  const { customerEmail, customerPhone, shippingAddr, items } = req.body;

  if (!items || !items.length) {
    res.status(400).json({ message: 'Cart is empty' });
    return;
  }

  // Nếu user đã đăng nhập (có token), lấy userId để liên kết đơn hàng
  let userId: string | null = null;
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded: any = jwt.verify(token, JWT_SECRET);
      userId = decoded.userId;
    }
  } catch {
    // Token không hợp lệ hoặc hết hạn → tiếp tục checkout như khách vãng lai
  }

  try {
    // withRetry bao quanh transaction: tự động thử lại nếu PostgreSQL bị lỗi tạm thời.
    // Prisma transaction đảm bảo tính toàn vẹn dữ liệu — nếu thất bại sẽ rollback hoàn toàn.
    const order = await withRetry(
      () => prisma.$transaction(async (tx) => {
        let totalAmount = 0;
        const orderItemsData = [];

        for (const item of items) {
          const product = await tx.product.findUnique({
            where: { id: item.id }
          });

          if (!product) {
            throw new Error(`Product ID ${item.id} not found`);
          }
          if (product.stock < item.quantity) {
            throw new Error(`Not enough stock for ${product.title}`);
          }

          // Deduct stock
          await tx.product.update({
            where: { id: product.id },
            data: { stock: { decrement: item.quantity } }
          });

          totalAmount += product.price * item.quantity;
          orderItemsData.push({
            productId: product.id,
            quantity: item.quantity,
            priceAtTime: product.price
          });
        }

        // Create order (liên kết userId nếu đã đăng nhập)
        return await tx.order.create({
          data: {
            userId,
            customerEmail,
            customerPhone,
            shippingAddr,
            totalAmount,
            status: 'PENDING',
            orderItems: {
              create: orderItemsData
            }
          },
          include: {
            orderItems: true
          }
        });
      }),
      { maxAttempts: 3, baseDelayMs: 500, label: 'checkout transaction' }
    );

    res.status(201).json({ message: 'Order created successfully', order });
  } catch (error: any) {
    console.error('Checkout error:', error);
    res.status(400).json({ message: error.message || 'Checkout failed' });
  }
});

// --- USER AUTH MIDDLEWARE ---
const verifyUser = async (req: Request, res: Response, next: any) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ message: 'No token provided' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded: any = jwt.verify(token, JWT_SECRET);

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) {
      res.status(401).json({ message: 'User not found' });
      return;
    }

    (req as any).user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// --- ADMIN MIDDLEWARE (kế thừa verifyUser) ---
const verifyAdmin = (req: Request, res: Response, next: any) => {
  verifyUser(req, res, () => {
    const user = (req as any).user;
    if (!user || user.role !== 'ADMIN') {
      res.status(403).json({ message: 'Access Denied: Admins Only' });
      return;
    }
    next();
  });
};

app.get('/api/orders/my-orders', verifyUser, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const orders = await prisma.order.findMany({
      where: { userId: user.id },
      include: { orderItems: { include: { product: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(orders);
  } catch (error) {
    console.error('My orders error:', error);
    res.status(500).json({ message: 'Error fetching orders' });
  }
});

// --- ADMIN ROUTES ---

app.get('/api/admin/stats', verifyAdmin, async (req: Request, res: Response) => {
  try {
    const usersCount = await prisma.user.count();
    const productsCount = await prisma.product.count();
    const ordersCount = await prisma.order.count();
    const orders = await prisma.order.findMany({ where: { status: 'COMPLETED' } });
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);

    res.json({
      users: usersCount,
      products: productsCount,
      orders: ordersCount,
      revenue: totalRevenue
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ message: 'Error fetching stats' });
  }
});

app.get('/api/admin/users', verifyAdmin, async (req: Request, res: Response) => {
  try {
    const page = req.query.page ? parseInt(req.query.page as string) : null;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : null;

    const queryOptions: any = {
      select: { id: true, email: true, fullName: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' as const }
    };

    if (page && limit) {
      queryOptions.skip = (page - 1) * limit;
      queryOptions.take = limit;
      const [users, total] = await Promise.all([
        prisma.user.findMany(queryOptions),
        prisma.user.count()
      ]);
      res.json({ data: users, total, page, limit, totalPages: Math.ceil(total / limit) });
    } else {
      const users = await prisma.user.findMany(queryOptions);
      res.json(users);
    }
  } catch (error) {
    console.error('Admin users error:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

app.put('/api/admin/users/:id/role', verifyAdmin, async (req: Request, res: Response) => {
  try {
    const { role } = req.body;
    const updatedUser = await prisma.user.update({
      where: { id: req.params.id },
      data: { role },
      select: { id: true, email: true, role: true }
    });
    res.json(updatedUser);
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ message: 'Error updating user role' });
  }
});

app.get('/api/admin/orders', verifyAdmin, async (req: Request, res: Response) => {
  try {
    const page = req.query.page ? parseInt(req.query.page as string) : null;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : null;

    const queryOptions: any = {
      include: { 
        user: { select: { fullName: true, email: true } }, 
        orderItems: { include: { product: true } } 
      },
      orderBy: { createdAt: 'desc' as const }
    };

    if (page && limit) {
      queryOptions.skip = (page - 1) * limit;
      queryOptions.take = limit;
      const [orders, total] = await Promise.all([
        prisma.order.findMany(queryOptions),
        prisma.order.count()
      ]);
      res.json({ data: orders, total, page, limit, totalPages: Math.ceil(total / limit) });
    } else {
      const orders = await prisma.order.findMany(queryOptions);
      res.json(orders);
    }
  } catch (error) {
    console.error('Admin orders error:', error);
    res.status(500).json({ message: 'Error fetching orders' });
  }
});

app.put('/api/admin/orders/:id', verifyAdmin, async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { status }
    });
    res.json(order);
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Error updating order' });
  }
});

app.post('/api/upload', verifyAdmin, upload.single('image'), (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ message: 'No file uploaded' });
    return;
  }
  const imgUrl = `http://localhost:${PORT}/uploads/${req.file.filename}`;
  res.json({ imgUrl });
});

// Helper: validate dữ liệu sản phẩm
const VALID_CATEGORIES = ['vinyl', 'cd', 'merch'];
const validateProductInput = (body: any): string | null => {
  const { title, artist, price, imgUrl, category, stock } = body;

  if (!title?.trim() || !artist?.trim() || !imgUrl?.trim()) {
    return 'Tên sản phẩm, nghệ sĩ và hình ảnh không được để trống.';
  }

  const parsedPrice = parseFloat(price);
  if (isNaN(parsedPrice) || parsedPrice <= 0) {
    return 'Giá phải là số dương hợp lệ.';
  }

  const parsedStock = parseInt(stock);
  if (isNaN(parsedStock) || parsedStock < 0) {
    return 'Số lượng tồn kho phải là số nguyên >= 0.';
  }

  if (!VALID_CATEGORIES.includes(category)) {
    return `Danh mục không hợp lệ. Chỉ chấp nhận: ${VALID_CATEGORIES.join(', ')}.`;
  }

  return null; // Hợp lệ
};

// [REDIS CREATE] Tạo product mới → lưu vào cache
app.post('/api/products', verifyAdmin, async (req: Request, res: Response) => {
  try {
    const validationError = validateProductInput(req.body);
    if (validationError) {
      res.status(400).json({ message: validationError });
      return;
    }

    const { title, artist, price, imgUrl, category, stock, description } = req.body;
    const product = await prisma.product.create({
      data: { 
        title: title.trim(), 
        artist: artist.trim(), 
        price: parseFloat(price), 
        imgUrl: imgUrl.trim(), 
        category, 
        stock: parseInt(stock),
        description: description?.trim() || null
      }
    });

    // Cache product mới vào Redis + refresh danh sách
    await cacheProduct(product);
    await redis.del(CACHE_KEYS.allProducts).catch(() => {});
    console.log(`📦 [Redis CREATE] Cached product #${product.id}`);

    res.status(201).json(product);
  } catch (error) {
    console.error('POST /api/products error:', error);
    res.status(500).json({ message: 'Error creating product' });
  }
});

// [REDIS UPDATE] Sửa product → cập nhật cache
app.put('/api/products/:id', verifyAdmin, async (req: Request, res: Response) => {
  try {
    const validationError = validateProductInput(req.body);
    if (validationError) {
      res.status(400).json({ message: validationError });
      return;
    }

    const { title, artist, price, imgUrl, category, stock, description } = req.body;
    const product = await prisma.product.update({
      where: { id: parseInt(req.params.id) },
      data: { 
        title: title.trim(), 
        artist: artist.trim(), 
        price: parseFloat(price), 
        imgUrl: imgUrl.trim(), 
        category, 
        stock: parseInt(stock),
        description: description?.trim() || null
      }
    });

    // Cập nhật cache Redis với dữ liệu mới
    await cacheProduct(product);
    await redis.del(CACHE_KEYS.allProducts).catch(() => {});
    console.log(`📦 [Redis UPDATE] Updated cache product #${product.id}`);

    res.json(product);
  } catch (error) {
    console.error('PUT /api/products error:', error);
    res.status(500).json({ message: 'Error updating product' });
  }
});

// [REDIS DELETE] Xóa product → xóa khỏi cache
app.delete('/api/products/:id', verifyAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    
    // Check if product is in any orders
    const orderItemsCount = await prisma.orderItem.count({
      where: { productId: id }
    });
    
    if (orderItemsCount > 0) {
      res.status(400).json({ 
        message: 'Không thể xóa sản phẩm này vì nó đã có trong đơn hàng của khách. Để ẩn sản phẩm, bạn có thể chỉnh số lượng tồn kho về 0.' 
      });
      return;
    }

    await prisma.product.delete({ where: { id } });

    // Xóa product khỏi Redis cache
    await deleteCachedProduct(id);
    console.log(`📦 [Redis DELETE] Removed product #${id} from cache`);

    res.json({ message: 'Product deleted' });
  } catch (error) {
    console.error('DELETE /api/products error:', error);
    res.status(500).json({ message: 'Error deleting product' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
// Restart trigger
