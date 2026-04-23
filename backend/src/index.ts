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

dotenv.config();

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

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

// POST Login
app.post('/api/auth/login', async (req: Request, res: Response) => {
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

    const secret = process.env.JWT_SECRET || 'default_secret';
    const token = jwt.sign({ userId: user.id }, secret, { expiresIn: '7d' });

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

// GET all products
app.get('/api/products', async (req: Request, res: Response) => {
  try {
    const { category } = req.query;
    const filter = category ? { category: String(category) } : {};
    const products = await prisma.product.findMany({ 
      where: filter,
      orderBy: { id: 'asc' }
    });
    res.json(products);
  } catch (error) {
    console.error('GET /api/products error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// GET product by id
app.get('/api/products/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }
    res.json(product);
  } catch (error) {
    console.error('GET /api/products/:id error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// POST checkout
app.post('/api/orders/checkout', async (req: Request, res: Response) => {
  const { customerEmail, customerPhone, shippingAddr, items } = req.body;

  if (!items || !items.length) {
    res.status(400).json({ message: 'Cart is empty' });
    return;
  }

  try {
    // Start Transaction
    const order = await prisma.$transaction(async (tx) => {
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

      // Create order
      return await tx.order.create({
        data: {
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
    });

    res.status(201).json({ message: 'Order created successfully', order });
  } catch (error: any) {
    console.error('Checkout error:', error);
    res.status(400).json({ message: error.message || 'Checkout failed' });
  }
});

app.get('/api/orders/my-orders', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ message: 'No token provided' });
      return;
    }
    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'default_secret';
    const decoded: any = jwt.verify(token, secret);
    
    const orders = await prisma.order.findMany({
      where: { userId: decoded.userId },
      include: { orderItems: { include: { product: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(orders);
  } catch (error) {
    console.error('My orders error:', error);
    res.status(401).json({ message: 'Invalid or expired token' });
  }
});

// --- ADMIN MIDDLEWARE ---
const verifyAdmin = async (req: Request, res: Response, next: any) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ message: 'No token provided' });
      return;
    }
    
    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'default_secret';
    const decoded: any = jwt.verify(token, secret);
    
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user || user.role !== 'ADMIN') {
      res.status(403).json({ message: 'Access Denied: Admins Only' });
      return;
    }
    
    (req as any).user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

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
    const users = await prisma.user.findMany({
      select: { id: true, email: true, fullName: true, role: true, createdAt: true }
    });
    res.json(users);
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
    const orders = await prisma.order.findMany({
      include: { 
        user: { select: { fullName: true, email: true } }, 
        orderItems: { include: { product: true } } 
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(orders);
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

app.post('/api/products', verifyAdmin, async (req: Request, res: Response) => {
  try {
    const { title, artist, price, imgUrl, category, stock, description } = req.body;
    const product = await prisma.product.create({
      data: { 
        title, 
        artist, 
        price: parseFloat(price), 
        imgUrl, 
        category, 
        stock: parseInt(stock),
        description
      }
    });
    res.status(201).json(product);
  } catch (error) {
    console.error('POST /api/products error:', error);
    res.status(500).json({ message: 'Error creating product' });
  }
});

app.put('/api/products/:id', verifyAdmin, async (req: Request, res: Response) => {
  try {
    const { title, artist, price, imgUrl, category, stock, description } = req.body;
    const product = await prisma.product.update({
      where: { id: parseInt(req.params.id) },
      data: { 
        title, 
        artist, 
        price: parseFloat(price), 
        imgUrl, 
        category, 
        stock: parseInt(stock),
        description
      }
    });
    res.json(product);
  } catch (error) {
    console.error('PUT /api/products error:', error);
    res.status(500).json({ message: 'Error updating product' });
  }
});

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

    await prisma.product.delete({
      where: { id }
    });
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
