import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { redis } from './config/redis';

dotenv.config();
const connectionString = `${process.env.DATABASE_URL}`;

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const ALL_PRODUCTS = [
  { id: 1, title: 'Abbey Road', artist: 'The Beatles', price: 29.99, imgUrl: 'https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=600&h=600&fit=crop', category: 'vinyl', stock: 5 },
  { id: 2, title: 'Dark Side of the Moon', artist: 'Pink Floyd', price: 34.99, imgUrl: 'https://images.unsplash.com/photo-1542208998-f6dbbb27a72f?w=600&h=600&fit=crop', category: 'vinyl', stock: 10 },
  { id: 3, title: 'Midnights', artist: 'Taylor Swift', price: 38.50, imgUrl: 'https://images.unsplash.com/photo-1519638399535-1b036603ac77?w=600&h=600&fit=crop', category: 'vinyl', stock: 3 },
  { id: 4, title: 'Swimming', artist: 'Mac Miller', price: 35.00, imgUrl: 'https://images.unsplash.com/photo-1538370621607-4919ce7889b3?w=600&h=600&fit=crop', category: 'vinyl', stock: 8 },
  { id: 5, title: 'Blue Train', artist: 'John Coltrane', price: 28.00, imgUrl: 'https://images.unsplash.com/photo-1538370621607-4919ce7889b3?w=600&h=600&fit=crop', category: 'vinyl', stock: 0 },
  { id: 6, title: 'Kind of Blue', artist: 'Miles Davis', price: 31.00, imgUrl: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=600&h=600&fit=crop', category: 'vinyl', stock: 12 },
  { id: 201, title: 'After Hours', artist: 'The Weeknd', price: 15.99, imgUrl: 'https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=600&h=600&fit=crop', category: 'cd', stock: 7 },
  { id: 202, title: 'Future Nostalgia', artist: 'Dua Lipa', price: 14.50, imgUrl: 'https://images.unsplash.com/photo-1525362081669-2b476bb628c3?w=600&h=600&fit=crop', category: 'cd', stock: 4 },
  { id: 203, title: 'Sour', artist: 'Olivia Rodrigo', price: 13.99, imgUrl: 'https://images.unsplash.com/photo-1604085572504-a392ddf0d86a?w=600&h=600&fit=crop', category: 'cd', stock: 0 },
  { id: 204, title: 'Random Access Memories', artist: 'Daft Punk', price: 16.00, imgUrl: 'https://images.unsplash.com/photo-1496284045406-d3e0b918d7ba?w=600&h=600&fit=crop', category: 'cd', stock: 9 },
  { id: 101, title: 'Classic Logo T-Shirt', artist: 'Record Store Exclusive', price: 25.00, imgUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=600&fit=crop', category: 'merch', stock: 15 },
  { id: 102, title: 'Cotton Tote Bag', artist: 'Eco-friendly', price: 15.00, imgUrl: 'https://images.unsplash.com/photo-1525362081669-2b476bb628c3?w=600&h=600&fit=crop', category: 'merch', stock: 20 },
  { id: 103, title: 'Vinyl Cleaning Kit', artist: 'Premium Care', price: 20.00, imgUrl: 'https://images.unsplash.com/photo-1587731556938-38755b4803a6?w=600&h=600&fit=crop', category: 'merch', stock: 0 },
  { id: 104, title: 'Slipmat Set', artist: 'Turntable Essentials', price: 18.00, imgUrl: 'https://images.unsplash.com/photo-1587731556938-38755b4803a6?w=600&h=600&fit=crop', category: 'merch', stock: 10 },
  { id: 105, title: 'Logo Enamel Pin', artist: 'Accessories', price: 8.00, imgUrl: 'https://images.unsplash.com/photo-1572375992501-4b0892d50c69?w=600&h=600&fit=crop', category: 'merch', stock: 25 },
  { id: 106, title: 'Record Display Frame', artist: 'Home Decor', price: 45.00, imgUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=600&fit=crop', category: 'merch', stock: 3 },
  // Adding more products to reach 30 products
  { id: 7, title: 'Rumours', artist: 'Fleetwood Mac', price: 27.50, imgUrl: 'https://images.unsplash.com/photo-1574169208507-84376144848b?w=600&h=600&fit=crop', category: 'vinyl', stock: 15 },
  { id: 8, title: 'Thriller', artist: 'Michael Jackson', price: 32.00, imgUrl: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=600&h=600&fit=crop', category: 'vinyl', stock: 20 },
  { id: 9, title: 'Back to Black', artist: 'Amy Winehouse', price: 26.99, imgUrl: 'https://images.unsplash.com/photo-1519638399535-1b036603ac77?w=600&h=600&fit=crop', category: 'vinyl', stock: 8 },
  { id: 10, title: 'Nevermind', artist: 'Nirvana', price: 30.00, imgUrl: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=600&h=600&fit=crop', category: 'vinyl', stock: 11 },
  { id: 205, title: '1989', artist: 'Taylor Swift', price: 15.00, imgUrl: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=600&h=600&fit=crop', category: 'cd', stock: 25 },
  { id: 206, title: 'To Pimp a Butterfly', artist: 'Kendrick Lamar', price: 16.50, imgUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&h=600&fit=crop', category: 'cd', stock: 14 },
  { id: 207, title: 'Lemonade', artist: 'Beyoncé', price: 17.00, imgUrl: 'https://images.unsplash.com/photo-1619983081563-430f63602796?w=600&h=600&fit=crop', category: 'cd', stock: 18 },
  { id: 208, title: 'Born to Die', artist: 'Lana Del Rey', price: 14.99, imgUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&h=600&fit=crop', category: 'cd', stock: 22 },
  { id: 107, title: 'Record Store Mug', artist: 'Merch', price: 12.00, imgUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&h=600&fit=crop', category: 'merch', stock: 30 },
  { id: 108, title: 'Turntable Mat', artist: 'Merch', price: 15.00, imgUrl: 'https://images.unsplash.com/photo-1587731556938-38755b4803a6?w=600&h=600&fit=crop', category: 'merch', stock: 40 },
  { id: 109, title: 'Vintage Poster', artist: 'Decor', price: 10.00, imgUrl: 'https://images.unsplash.com/photo-1604085572504-a392ddf0d86a?w=600&h=600&fit=crop', category: 'merch', stock: 50 },
  { id: 110, title: 'Sticker Pack', artist: 'Accessories', price: 5.00, imgUrl: 'https://images.unsplash.com/photo-1572375992501-4b0892d50c69?w=600&h=600&fit=crop', category: 'merch', stock: 100 },
];

async function main() {
  console.log('Start seeding...');

  // 1. Clear existing data
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany({
    where: { role: 'USER' } // Keep the admin if it exists
  });

  // 2. Seed Products
  console.log('Seeding products...');
  for (const product of ALL_PRODUCTS) {
    await prisma.product.create({
      data: product,
    });
  }

  // 3. Seed Users (20 users)
  console.log('Seeding users...');
  const passwordHash = await bcrypt.hash('password123', 10);
  const users = [];
  for (let i = 1; i <= 20; i++) {
    const user = await prisma.user.create({
      data: {
        email: `customer${i}@example.com`,
        fullName: `Customer ${i}`,
        phone: `090123456${i.toString().padStart(2, '0')}`,
        address: `${i} Main Street, City`,
        password: passwordHash,
        role: 'USER',
        isVerified: true,
        createdAt: new Date(new Date().setDate(new Date().getDate() - Math.floor(Math.random() * 30))) // Random date in last 30 days
      }
    });
    users.push(user);
  }

  // 4. Seed Orders (30 orders)
  console.log('Seeding orders...');
  const statuses = ['PENDING', 'COMPLETED', 'CANCELLED'];
  
  for (let i = 1; i <= 30; i++) {
    const randomUser = users[Math.floor(Math.random() * users.length)];
    const numItems = Math.floor(Math.random() * 3) + 1; // 1 to 3 items
    
    // Pick random products
    const selectedProducts = [];
    for (let j = 0; j < numItems; j++) {
      const product = ALL_PRODUCTS[Math.floor(Math.random() * ALL_PRODUCTS.length)];
      if (!selectedProducts.find(p => p.id === product.id)) {
        selectedProducts.push(product);
      }
    }

    // Calculate total
    let totalAmount = 0;
    const orderItemsData = selectedProducts.map(p => {
      const quantity = Math.floor(Math.random() * 2) + 1; // 1 or 2
      totalAmount += p.price * quantity;
      return {
        productId: p.id,
        quantity: quantity,
        priceAtTime: p.price
      };
    });

    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const orderDate = new Date(new Date().setDate(new Date().getDate() - Math.floor(Math.random() * 30)));

    await prisma.order.create({
      data: {
        userId: randomUser.id,
        customerEmail: randomUser.email,
        customerPhone: randomUser.phone,
        shippingAddr: randomUser.address,
        totalAmount: parseFloat(totalAmount.toFixed(2)),
        status: status,
        createdAt: orderDate,
        orderItems: {
          create: orderItemsData
        }
      }
    });
  }

  console.log('Seeding finished successfully.');
  
  await redis.flushall();
  console.log('Redis cache cleared automatically.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    redis.disconnect();
  });
