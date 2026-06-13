<p align="center">
  <img src="https://img.shields.io/badge/🎵-Classic_Records-1DB954?style=for-the-badge&labelColor=000000" alt="Classic Records" />
</p>

<h1 align="center">Classic Records — Vinyl & Music E-Commerce Platform</h1>

<p align="center">
  A production-grade, full-stack e-commerce platform for vinyl records, CDs, and music merchandise — built with a modern TypeScript stack, containerized with Docker, and designed for real-world operational resilience.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-6.0-3178C6?style=flat-square&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Express-5.x-000000?style=flat-square&logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-15-4169E1?style=flat-square&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Prisma-7.x-2D3748?style=flat-square&logo=prisma&logoColor=white" />
  <img src="https://img.shields.io/badge/Redis-Cache-DC382D?style=flat-square&logo=redis&logoColor=white" />
  <img src="https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white" />
  <img src="https://img.shields.io/badge/Nginx-Gateway-009639?style=flat-square&logo=nginx&logoColor=white" />
  <img src="https://img.shields.io/badge/Vite-8.x-646CFF?style=flat-square&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/Redux_Toolkit-9.x-764ABC?style=flat-square&logo=redux&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4.x-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/Jest-30-C21325?style=flat-square&logo=jest&logoColor=white" />
</p>

<p align="center">
  <a href="#-quick-start"><strong>Quick Start</strong></a> ·
  <a href="#-architecture"><strong>Architecture</strong></a> ·
  <a href="#-key-features"><strong>Features</strong></a> ·
  <a href="#-system-design-highlights"><strong>System Design</strong></a> ·
  <a href="#-deployment"><strong>Deployment</strong></a>
</p>

---

## 📸 Screenshots & Demo

### 🌐 Client Experience
<p align="center">
  <img src="./.github/screenshots/homepage_desktop.png" width="65%" alt="Homepage Desktop" style="border-radius: 8px; box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);" />
  <img src="./.github/screenshots/homepage_mobile.png" width="22%" alt="Homepage Mobile" style="border-radius: 8px; box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);" />
</p>
<p align="center">
  <em>Homepage Desktop (above-the-fold) and Mobile Responsive views side-by-side</em>
</p>

<br />

<p align="center">
  <img src="./.github/screenshots/chatbot.gif" width="45%" alt="AI Chatbot Support" style="border-radius: 8px;" />
  <img src="./.github/screenshots/checkout.gif" width="45%" alt="Atomic Checkout Flow" style="border-radius: 8px;" />
</p>
<p align="center">
  <em>Interactive Flows: AI Chatbot Support (Left) & OTP Auth/Atomic Checkout (Right)</em>
</p>

### 🔧 Admin & Analytics Dashboard
<p align="center">
  <img src="./.github/screenshots/admin_dashboard.png" width="88%" alt="Admin Dashboard Overview" style="border-radius: 8px;" />
</p>
<p align="center">
  <em>Admin Analytics Dashboard — Revenue trends, order statistics, and real-time inventory tracking</em>
</p>

<details>
  <summary>🔍 View More Screenshots (Details & Forms)</summary>
  <br />
  <p align="center">
    <img src="./.github/screenshots/otp_verification.png" width="45%" />
    <img src="./.github/screenshots/product_crud.png" width="45%" />
  </p>
  <p align="center">
    <em>Security OTP Verification (Left) and Admin Inventory CRUD (Right)</em>
  </p>
</details>

---

## 📖 Project Overview

### The Problem

Independent record stores and music retailers lack affordable, purpose-built e-commerce solutions. Generic platforms don't cater to the unique catalog structure of music products (artist, format, genre) or the niche community expectations around vinyl collecting.

### The Solution

**Classic Records** is a domain-specific e-commerce platform designed for music retailers selling vinyl records, CDs, and merchandise. It provides a complete purchasing flow for customers and a data-driven admin dashboard for store operators.

### Target Users

| Persona | Needs |
|---------|-------|
| **Customers** | Browse catalog by format (Vinyl/CD/Merch), search products, manage cart, checkout with order tracking |
| **Store Admins** | Manage inventory, process orders, monitor revenue analytics, manage user accounts |

### Key Capabilities

- Full authentication flow with **email OTP verification** and password reset
- Real-time inventory management with **atomic database transactions**
- **Redis caching layer** with graceful PostgreSQL fallback
- **5-service Docker Compose** deployment with health checks and restart policies
- Admin analytics dashboard with **5 statistical dimensions** (Revenue, Orders, Products, Users, Inventory)
- Integrated **AI-powered chatbot** for customer support
- **Multi-layer retry mechanism** across the entire stack
- **Rate limiting** (server-side + client-side) for security hardening

---

## ✨ Key Features

### 🛒 Customer Experience

| Feature | Description |
|---------|-------------|
| **Authentication** | Register with email OTP verification, login with JWT, password reset via email |
| **Product Catalog** | Browse by category (Vinyl, CD, Merchandise) with filtering and search |
| **Product Detail** | Rich product pages with image gallery, stock availability, and quantity selection |
| **Shopping Cart** | Persistent cart with select-all, per-item selection, and quantity management |
| **Checkout** | Form-validated checkout with shipping details, stock verification at transaction time |
| **Order History** | View past orders with status tracking (Pending → Completed → Shipped) |
| **AI Chatbot** | Integrated conversational assistant powered by LLM APIs |
| **Dark/Light Theme** | System-wide theme toggle with persistent user preference |

### 🔧 Admin Dashboard

| Feature | Description |
|---------|-------------|
| **Dashboard Overview** | KPI cards for revenue, users, products, and orders at a glance |
| **Product Management** | Full CRUD with direct image upload via Multer |
| **Order Management** | View, filter, and update order status with detailed line items |
| **User Management** | View registered users and account details |
| **Revenue Analytics** | Time-series revenue charts with period filtering (Today/Week/Month/Year/Custom) |
| **Order Analytics** | Order volume trends, status distribution breakdown |
| **Product Analytics** | Top-selling products, category performance metrics |
| **User Analytics** | Registration trends, top customers by spend |
| **Inventory Analytics** | Stock valuation, low-stock alerts, out-of-stock tracking by category |
| **Data Export** | Export statistics data for external reporting |

### 🏗️ Infrastructure

| Feature | Description |
|---------|-------------|
| **Docker Compose** | 5-service orchestration (API Gateway, Frontend, Backend, PostgreSQL, Redis) |
| **API Gateway** | Nginx reverse proxy routing `/` → Frontend, `/api/` → Backend |
| **Redis Cache** | Read-through caching with TTL, automatic invalidation on writes |
| **CI/CD Pipelines** | GitLab CI (build → test → deploy) and Jenkins (4-stage with retry) |
| **Health Checks** | Container-level health monitoring with dependency-aware startup ordering |
| **Rate Limiting** | Tiered rate limits — general (100 req/window) and strict (10 req/window for auth/checkout) |

---

## 🏛️ Architecture

```mermaid
graph TB
    subgraph Client
        Browser["🌐 Browser"]
    end

    subgraph Docker["Docker Compose Network"]
        Gateway["🔀 API Gateway<br/>(Nginx)"]

        subgraph Frontend["Frontend Container"]
            React["⚛️ React 19 + Vite<br/>Redux Toolkit<br/>Tailwind CSS"]
        end

        subgraph Backend["Backend Container"]
            Express["🟢 Express 5<br/>TypeScript"]
            Prisma["Prisma ORM"]
            Auth["JWT + OTP Auth"]
            Cache["Cache Layer"]
            Retry["Retry Engine"]
            RateLimit["Rate Limiter"]
        end

        subgraph Data["Data Layer"]
            PG["🐘 PostgreSQL 15"]
            Redis["⚡ Redis"]
        end
    end

    Browser -->|"HTTP :8080"| Gateway
    Gateway -->|"/ → :80"| React
    Gateway -->|"/api/ → :3000"| Express
    Express --> Prisma --> PG
    Express --> Cache --> Redis
    Cache -.->|"Fallback on MISS"| PG
    Redis -.->|"Graceful Fallback"| PG
```

### Request Flow

```
Client Request
  └─→ Nginx API Gateway (:8080)
        ├─→ Static Assets → Frontend (Nginx :80)
        └─→ /api/* → Express Backend (:3000)
                ├─→ Rate Limit Check
                ├─→ JWT Authentication
                ├─→ Redis Cache (HIT → return)
                ├─→ Cache MISS → PostgreSQL Query
                ├─→ Cache Result (TTL: 1 hour)
                └─→ Response
```

---

## 🧰 Tech Stack

### Frontend

| Technology | Version | Purpose |
|-----------|---------|---------|
| [React](https://react.dev/) | 19.x | UI component library |
| [TypeScript](https://www.typescriptlang.org/) | 6.0 | Type-safe JavaScript |
| [Vite](https://vitejs.dev/) | 8.x | Build tool and dev server |
| [Redux Toolkit](https://redux-toolkit.js.org/) | 2.x | Global state management |
| [React Router](https://reactrouter.com/) | 7.x | Client-side routing |
| [Tailwind CSS](https://tailwindcss.com/) | 4.x | Utility-first CSS framework |
| [Axios](https://axios-http.com/) | 1.x | HTTP client with interceptors |
| [Recharts](https://recharts.org/) | 2.x | Charting library for analytics |
| [Lucide React](https://lucide.dev/) | 1.x | Icon system |

### Backend

| Technology | Version | Purpose |
|-----------|---------|---------|
| [Node.js](https://nodejs.org/) | 20.x | JavaScript runtime |
| [Express](https://expressjs.com/) | 5.x | Web framework |
| [TypeScript](https://www.typescriptlang.org/) | 6.0 | Type-safe server code |
| [Prisma](https://www.prisma.io/) | 7.x | Type-safe ORM with migrations |
| [ioredis](https://github.com/redis/ioredis) | 5.x | Redis client with auto-reconnect |
| [JSON Web Token](https://github.com/auth0/node-jsonwebtoken) | 9.x | Stateless authentication |
| [bcryptjs](https://github.com/dcodeIO/bcrypt.js) | 3.x | Password hashing |
| [Multer](https://github.com/expressjs/multer) | 2.x | Multipart file upload handling |
| [Nodemailer](https://nodemailer.com/) | 8.x | Email delivery (OTP) |
| [Jest](https://jestjs.io/) + [ts-jest](https://kulshekhar.github.io/ts-jest/) | 30.x | Unit testing framework |

### Infrastructure

| Technology | Purpose |
|-----------|---------|
| [PostgreSQL 15](https://www.postgresql.org/) | Primary relational database |
| [Redis](https://redis.io/) | In-memory caching layer |
| [Nginx](https://nginx.org/) | API Gateway / Reverse Proxy |
| [Docker Compose](https://docs.docker.com/compose/) | Multi-container orchestration |
| [GitLab CI/CD](https://docs.gitlab.com/ee/ci/) | Continuous integration pipeline |
| [Jenkins](https://www.jenkins.io/) | Continuous deployment pipeline |

---

## 📂 Repository Structure

```
record-store-ecommerce/
│
├── api-gateway/
│   └── nginx.conf                  # Reverse proxy routing rules
│
├── backend/
│   ├── prisma/
│   │   └── schema.prisma           # Database schema (User, Product, Order, OrderItem, Otp)
│   ├── src/
│   │   ├── config/                  # Environment, Prisma client, Redis, email transporter
│   │   ├── middlewares/             # Auth (JWT + RBAC), rate limiting, file upload
│   │   ├── modules/
│   │   │   ├── auth/                # Register, login, OTP verify, password reset
│   │   │   ├── products/            # CRUD + Redis cache layer
│   │   │   ├── orders/              # Checkout with DB transactions + retry
│   │   │   ├── admin/               # Admin-only product/order/user management
│   │   │   ├── statistics/          # Analytics (revenue, orders, products, users, inventory)
│   │   │   └── chat/                # AI chatbot integration
│   │   ├── utils/
│   │   │   └── retry.ts             # Generic retry with exponential backoff
│   │   ├── __tests__/               # Unit tests (AuthService, OrderService)
│   │   └── app.ts                   # Express app setup & route registration
│   ├── Dockerfile
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/              # Navbar, Footer, ProductCard, ChatBot, ProtectedRoute
│   │   │   └── admin/               # Admin-specific shared components (StatsUtils)
│   │   ├── pages/                   # Home, Vinyl, CD, Merch, Cart, Checkout, User, FAQ, etc.
│   │   │   └── admin/               # AdminDashboard, AdminProducts, AdminOrders, AdminUsers
│   │   │       └── statistics/      # Revenue, Order, Product, User, Inventory analytics pages
│   │   ├── store/                   # Redux slices (cart, product, user)
│   │   ├── services/                # Axios client with retry interceptor
│   │   ├── layouts/                 # MainLayout, AdminLayout
│   │   ├── context/                 # React context providers
│   │   └── types/                   # TypeScript type definitions
│   ├── Dockerfile                   # Multi-stage build (Node → Nginx)
│   └── package.json
│
├── docker-compose.yml               # 5-service orchestration
├── Jenkinsfile                       # 4-stage CI/CD pipeline with retry
├── .gitlab-ci.yml                    # GitLab CI pipeline (build → test → deploy)
└── README.md
```

Each backend module follows a **layered architecture** pattern:

```
module/
├── *.routes.ts          # Route definitions & middleware binding
├── *.controller.ts      # HTTP request/response handling
├── *.service.ts         # Business logic & orchestration
├── *.repository.ts      # Database access (Prisma queries)
└── *.cache.ts           # Redis cache operations (where applicable)
```

---

## 🚀 Quick Start

### Option 1: Docker Compose (Recommended)

Spin up the entire stack with a single command:

```bash
# Clone the repository
git clone https://github.com/HungEzz/record-store-ecommerce.git
cd record-store-ecommerce

# Start all 5 services in detached mode
docker-compose up -d --build

# Initialize the database schema and seed sample data
docker exec -it record_store_backend npx prisma db push
docker exec -it record_store_backend npm run seed
```

**Access the application:**

| Service | URL |
|---------|-----|
| 🌐 Web App (via Gateway) | [http://localhost:8080](http://localhost:8080) |
| 🔌 API (via Gateway) | [http://localhost:8080/api/products](http://localhost:8080/api/products) |
| 🐘 PostgreSQL | `localhost:5432` |
| ⚡ Redis | `localhost:6379` |

**Manage the stack:**

```bash
docker-compose logs -f           # Stream all logs
docker-compose logs -f backend   # Stream backend logs only
docker-compose down              # Stop all services
docker-compose down -v           # Stop and remove volumes (reset DB)
```

### Option 2: Manual Setup

**Prerequisites:** Node.js ≥ 20, PostgreSQL 15+, Redis (optional — app falls back to direct DB queries)

#### 1. Backend

```bash
cd backend
npm install

# Configure environment variables
cp .env.example .env   # Then edit with your DB credentials
```

Required `.env` variables:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/record_store?schema=public"
JWT_SECRET="your-secret-key"
REDIS_URL="redis://localhost:6379"
PORT=3000
```

```bash
# Push schema to database and seed sample data
npx prisma db push
npm run seed

# Start the development server
npm run dev    # → http://localhost:3000
```

#### 2. Frontend

```bash
cd frontend
npm install
npm run dev    # → http://localhost:5173
```

#### 3. Run Tests

```bash
cd backend
npm test                # Run all unit tests
npm run test:coverage   # Run with coverage report
```

---

## 🧠 System Design Highlights

### 1. Layered Module Architecture

Each domain module (auth, products, orders, statistics) is structured into distinct layers: **Routes → Controller → Service → Repository**. This separation enforces single responsibility, makes business logic independently testable, and allows swapping the data layer without touching service code.

### 2. Atomic Checkout with Database Transactions

The checkout endpoint wraps the entire operation (stock validation, stock decrement, order creation, line item insertion) in a **single Prisma `$transaction`** block. This guarantees that either all mutations succeed or none do — preventing overselling and partial order states.

### 3. JWT Authentication + Email OTP Verification

- **Registration** → Creates unverified account → Generates cryptographically secure 6-digit OTP (`crypto.randomInt`) → Sends styled HTML email via Nodemailer → User verifies OTP to activate account
- **Login** → Validates credentials → Issues JWT (7-day expiry) → RBAC middleware (`verifyAdmin`) guards admin routes
- **Password Reset** → OTP-based flow with anti-enumeration response (always returns generic message regardless of email existence)
- **Security controls:** OTP cooldown (60s), hourly rate limit (5 OTPs/email/hour), bcrypt hashing for both passwords and OTPs

### 4. Redis Read-Through Cache with Graceful Degradation

```
GET /api/products
  ├─ Redis connected? → Check cache key "products:all"
  │     ├─ HIT  → Return cached JSON (fast path)
  │     └─ MISS → Query PostgreSQL → Cache result (TTL: 1h) → Return
  └─ Redis down? → Query PostgreSQL directly (graceful fallback)
```

Cache invalidation is **write-through**: every product CREATE/UPDATE/DELETE operation updates the corresponding Redis key and invalidates the list cache. The application continues operating normally even when Redis is completely unavailable.

### 5. Multi-Layer Retry with Exponential Backoff

Retry is implemented at **four layers** of the stack:

| Layer | Mechanism | Scope |
|-------|-----------|-------|
| **Docker Compose** | `restart: on-failure` + health checks with `depends_on: condition: service_healthy` | Container lifecycle |
| **Backend — `withRetry()`** | Generic async retry utility with configurable attempts and backoff | Critical DB transactions (checkout) |
| **Backend — ioredis** | Built-in `retryStrategy` with exponential backoff (max 10s) | Redis connection recovery |
| **Frontend — Axios Interceptor** | Automatic retry on 5xx/network errors, excludes 4xx and rate limits | HTTP request resilience |

All retry implementations use **exponential backoff** (`500ms → 1s → 2s → 4s`) with maximum delay caps to prevent thundering herd effects.

### 6. Tiered Rate Limiting

- **General:** 100 requests per 10-second window (all endpoints)
- **Strict:** 10 requests per 10-second window (login, checkout)
- **OTP:** 15 requests per 10-second window (OTP verify/resend)
- **Client-side:** Button disabling on submit to prevent double-clicks; 429 responses surfaced as user-friendly toast notifications

### 7. Admin Analytics Engine

Five dedicated statistics modules with flexible period filtering:

- **Revenue Stats** — Total revenue, completed orders, average order value, daily revenue chart
- **Order Stats** — Volume trends, status distribution (Pending/Completed/Cancelled), recent orders
- **Product Stats** — Top sellers by quantity, category performance breakdown
- **User Stats** — Registration trends, top customers by total spend
- **Inventory Stats** — Stock valuation, low-stock alerts (≤5 units), out-of-stock tracking, category breakdown

All analytics support period filters (`today`, `week`, `month`, `year`, `custom` date range) and data export.

---

## 🚢 Deployment

### Architecture Overview

The application deploys as 5 Docker containers behind an Nginx API Gateway:

```mermaid
graph LR
    Internet["🌐 Internet"] -->|":8080"| GW["Nginx API Gateway"]
    GW -->|"/"| FE["Frontend<br/>nginx:alpine"]
    GW -->|"/api/"| BE["Backend<br/>node:20-alpine"]
    GW -->|"/uploads/"| BE
    BE --> PG["PostgreSQL 15<br/>postgres:15-alpine"]
    BE --> RD["Redis<br/>redis:alpine"]

    style GW fill:#009639,color:#fff
    style FE fill:#61DAFB,color:#000
    style BE fill:#68A063,color:#fff
    style PG fill:#4169E1,color:#fff
    style RD fill:#DC382D,color:#fff
```

### Container Startup Order

Docker Compose manages dependencies with health-check-gated startup:

```
1. PostgreSQL  ─ pg_isready          ─→ HEALTHY
2. Redis       ─ redis-cli ping      ─→ HEALTHY
3. Backend     ─ (waits for 1 & 2)   ─→ starts → HEALTHY (GET /api/products)
4. Frontend    ─ (waits for 3)       ─→ starts → HEALTHY (GET :80)
5. API Gateway ─ (waits for 3 & 4)   ─→ starts → routes traffic
```

### CI/CD Pipelines

**GitLab CI** (`.gitlab-ci.yml`):
```
build_frontend → build_backend → deploy_docker (main branch only)
```

**Jenkins** (`Jenkinsfile`):
```
Checkout → Install Dependencies (retry×3) → Build Frontend (retry×3) → Docker Build & Deploy (retry×3)
```

Both pipelines include retry strategies to handle transient CI infrastructure failures.

### Persistent Volumes

| Volume              | Mount                     | Purpose                                          |
|---------------------|---------------------------|--------------------------------------------------|
| `pgdata`            | PostgreSQL data directory | Database persistence across container restarts   |
| `backend_uploads`   | `/app/uploads` in backend | Uploaded product images persistence              |

---

## 👥 Team & Contributions

| Contributor | Focus Areas                                                                                     |
|-------------|-------------------------------------------------------------------------------------------------|
| **HungEzz**    | Backend architecture, Redis caching, Docker & infrastructure, CI/CD pipelines, rate limiting, retry mechanisms, API Gateway configuration, admin statistics & analytics dashboard 
| **luuvanphat** | Frontend UI/UX, user management, checkout flow, data visualization with Recharts |
| **ThinChat** | AI chatbot integration, conversational features |

---

## 🗺️ Roadmap

| Phase | Feature | Status |
|-------|---------|--------|
| **v1.1** | Payment gateway integration (Stripe/VNPay) | 🔲 Planned |
| **v1.1** | Full-text search with Elasticsearch | 🔲 Planned |
| **v1.2** | WebSocket real-time order status updates | 🔲 Planned |
| **v1.2** | Product reviews and ratings system | 🔲 Planned |
| **v1.3** | Wishlist and saved items | 🔲 Planned |
| **v1.3** | Email notification system (order confirmation, shipping updates) | 🔲 Planned |
| **v2.0** | Microservices decomposition (auth, orders, catalog as independent services) | 🔲 Planned |
| **v2.1** | Recommendation engine based on purchase history | 🔲 Planned |
| **v2.1** | Internationalization (i18n) and multi-currency support | 🔲 Planned |

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

<p align="center">
  Built with ☕ and 🎵 by the <strong>Classic Records</strong> team.
</p>
