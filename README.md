# 📀 RECORD STORE - FULLSTACK E-COMMERCE

Một ứng dụng web mua sắm đĩa nhạc (Vinyl, CD) và Merchandise hoàn chỉnh từ Frontend tới Backend. Dự án được thiết kế với phong cách tối giản (Minimalism), hiện đại và tập trung vào trải nghiệm mua sắm mượt mà.

---

## 🛠 Tech Stack (Công nghệ sử dụng)

### Frontend (Giao diện người dùng)

- **Framework**: React 18, TypeScript (Vite).
- **State Management**: Redux Toolkit (quản lý giỏ hàng, thông tin sản phẩm từ API).
- **Styling**: Tailwind CSS (Utility-first CSS).
- **Routing**: React Router v6.
- **HTTP Client**: Axios.
- **UI Utilities**: Lucide React (Icons), React Hot Toast (Thông báo).

### Backend (Máy chủ & API)

- **Runtime**: Node.js với TypeScript (`tsx`, `nodemon`).
- **Framework**: Express.js.
- **Cơ sở dữ liệu (Database)**: PostgreSQL.
- **ORM (Kết nối CSDL)**: Prisma (`@prisma/client`, `@prisma/adapter-pg`).
- **Xác thực (Authentication)**: JWT (JSON Web Token) & Bcryptjs.
- **Xử lý hình ảnh**: Multer (Tải ảnh trực tiếp lên server).

---

## 🌊 Luồng hoạt động (Data Flow / Architecture)

1. **Khởi động ứng dụng**: Ngay khi truy cập trang web (tại `App.tsx`), Frontend sẽ gọi Redux Thunk `fetchProducts` để bắn 1 GET request HTTP tới `http://localhost:3000/api/products`.
2. **Backend xử lý**: Express Router nhận request, dùng Prisma querying lấy tất cả **Products** từ CSDL PostgreSQL trả về giao diện.
3. **Phân phối State**: Redux Toolkit `productSlice` lưu trữ toàn bộ sản phẩm và thông tin tồn kho (stock). Các màn hình (Home, Vinyl, CD, Merch, Product Detail) móc nối với Redux qua `useSelector` để render sản phẩm tự động.
4. **Giỏ hàng (Cart)**: Các mặt hàng thêm vào giỏ được Redux quản lý state tạm thời.
5. **Thanh toán (Checkout)**:
   - Khi Submit (chốt đơn), một API dạng POST được gửi về `/api/orders/checkout` kèm payload thông tin khách hàng và số lượng giỏ.
   - Backend sử dụng cơ chế **Database Transaction**: Kiểm tra đồng thời xem kho có đủ hàng không. Nếu đủ, tiến hành trừ kho trong bảng `Product`, đồng thời ghi một Record hóa đơn vào khóa ngoại bảng `Order` & `OrderItem`.
   - Frontend nhận phản hồi thành công, làm trống giỏ hàng và chuyển hướng sang trang Hoàn tất.

6. **Xác thực & Phân quyền (Auth & RBAC)**:
   - Hệ thống sử dụng JWT để định danh người dùng. Khi đăng nhập, Backend trả về một Token được lưu vào `localStorage`.
   - **Phân quyền**: Người dùng có `role: 'ADMIN'` mới có quyền truy cập vào các API quản trị (`/api/admin/*`) thông qua middleware `verifyAdmin` ở Backend.
   - Frontend sử dụng React Router để bảo vệ các tuyến đường Admin, chỉ cho phép truy cập khi tài khoản có quyền Admin.

7. **Hệ thống Quản trị (Admin Dashboard)**:
   - **Thống kê**: Tổng hợp doanh thu từ các đơn hàng `COMPLETED`, đếm số lượng người dùng, sản phẩm và đơn hàng.
   - **Quản lý Sản phẩm**: Cho phép Thêm/Sửa/Xóa. Tích hợp chức năng **Upload ảnh trực tiếp** từ máy tính lên server thông qua Multer.
   - **Quản lý Đơn hàng**: Xem danh sách đơn hàng, cập nhật trạng thái (Đang xử lý, Đã gửi, Đã giao, Đã hủy) và xem chi tiết từng món hàng khách đã đặt.
   - **Đồng bộ dữ liệu (Real-time Sync)**: Mọi thay đổi từ Admin (Thêm sản phẩm mới, thay đổi giá, cập nhật kho) sẽ ngay lập tức kích hoạt lệnh làm mới kho dữ liệu toàn cầu (Global Redux Store), giúp giao diện người mua luôn hiển thị thông tin mới nhất mà không cần tải lại trang.

---

## 🚀 Hướng dẫn Cài đặt & Chạy dự án (How to Run)

Để hệ thống hoạt động, bạn cần mở **2 cửa sổ Terminal** chạy song song (1 cái cho Frontend, 1 cái cho Backend).

### Yêu cầu tiên quyết

- Cài đặt **Node.js** (v18 trở lên).
- Cài đặt **PostgreSQL** và đã tạo một cơ sở dữ liệu trống có tên là `record_store` (bạn có thể tạo bằng phần mềm pgAdmin).

### Bước 1: Cấu hình và chạy Backend

Mở Terminal, đi hướng tới thư mục `backend/`:

```bash
cd backend
npm install
```

Kiểm tra file `.env` nằm trong thư mục `backend` và đảm bảo URL kết nối tương ứng với tài khoản/mật khẩu PostgreSQL của máy bạn. Ví dụ:

```env
DATABASE_URL="postgresql://postgres:root@localhost:5432/record_store?schema=public"
PORT=3000
```

Đẩy cấu trúc bảng Database và tự động nạp dữ liệu đĩa nhạc mẫu vào Database:

```bash
npx prisma db push
npm run seed
```

Khởi động máy chủ Backend:

```bash
npm run dev
```

> Server sẽ chạy tại: `http://localhost:3000`

### Bước 2: Chạy Frontend

Giữ nguyên Terminal của Backend chạy ngầm. Hãy mở một Terminal mới và trỏ vào thư mục `frontend/`:

```bash
cd frontend
npm install
npm run dev
```

> Web App giao diện sẽ chạy tại: `http://localhost:5173`

_(Mở liên kết `http://localhost:5173` trên trình duyệt và bắt đầu mua sắm!)_

---

## 📁 Cấu trúc thư mục (Project Structure)

Dự án được phân tách rõ ràng theo mô hình Client - Server:

```text
Ktvtkpm_25_26/
├── backend/
│   ├── prisma/             # Cấu trúc CSDL (schema.prisma)
│   ├── src/
│   │   ├── index.ts        # Express Server & API logic + Redis cache
│   │   └── seed.ts         # Script tiêm dữ liệu mẫu vào DB
│   ├── uploads/            # Thư mục chứa ảnh upload từ Admin
│   ├── .env                # Biến môi trường (DB, JWT, Redis)
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/     # Các thành phần tái sử dụng (Navbar, FilterBar...)
    │   ├── store/          # Redux Toolkit (cartSlice.ts, productSlice.ts)
    │   ├── services/       # axios config gọi API về localhost:3000
    │   ├── pages/          # Các trang React chính
    │   ├── types/          # Định nghĩa kiểu dữ liệu TS
    │   └── App.tsx         # Hệ thống Routing
    └── package.json
```

---

## 🔴 Redis — Hệ thống Cache cho Sản phẩm

### Tại sao dùng Redis?

Dự án sử dụng **Redis** làm tầng cache (**caching layer**) giữa Frontend và PostgreSQL. Thay vì mỗi lần truy cập đều phải query Database, Redis lưu trữ dữ liệu sản phẩm trong bộ nhớ RAM, giúp phản hồi nhanh hơn nhiều lần.

```text
┌──────────┐     GET /products      ┌───────────┐   Cache HIT    ┌─────────┐
│ Frontend │  ──────────────────►   │  Express  │  ───────────►  │  Redis  │
│ (React)  │  ◄──────────────────   │  Server   │  ◄───────────  │ (RAM)   │
└──────────┘     JSON response      └───────────┘                └─────────┘
                                         │  Cache MISS
                                         ▼
                                    ┌───────────┐
                                    │PostgreSQL │  ← Chỉ query khi
                                    │   (Disk)  │    Redis không có data
                                    └───────────┘
```

### Yêu cầu: Cài đặt Redis

Redis cần được chạy trước khi khởi động Backend. Chọn **1 trong các cách** sau:

**Cách 1 — Docker (Khuyến nghị):**

```bash
docker run -d --name redis -p 6379:6379 redis
```

**Cách 2 — WSL (Windows Subsystem for Linux):**

```bash
sudo apt update && sudo apt install redis-server
redis-server
```

**Cách 3 — Memurai (Redis cho Windows native):**

- Tải tại: https://www.memurai.com/
- Cài đặt và chạy, mặc định port 6379.

### Cấu hình

File `backend/.env` chứa URL kết nối Redis:

```env
REDIS_URL="redis://localhost:6379"
```

### Redis CRUD — 4 thao tác trên object Product

Dự án demo đầy đủ **4 thao tác CRUD** trên Redis cho object `Product`:

| Thao tác   | Khi nào xảy ra                                                    | Redis Key                       | Mô tả                                                                      |
| ---------- | ----------------------------------------------------------------- | ------------------------------- | -------------------------------------------------------------------------- |
| **CREATE** | Admin tạo sản phẩm mới (`POST /api/products`)                     | `products:{id}`                 | Lưu product vào cache, xóa cache danh sách cũ                              |
| **READ**   | User truy cập danh sách / chi tiết sản phẩm (`GET /api/products`) | `products:all`, `products:{id}` | Đọc từ Redis trước, nếu không có (MISS) thì query PostgreSQL rồi cache lại |
| **UPDATE** | Admin sửa sản phẩm (`PUT /api/products/:id`)                      | `products:{id}`                 | Cập nhật cache với dữ liệu mới từ DB                                       |
| **DELETE** | Admin xóa sản phẩm (`DELETE /api/products/:id`)                   | `products:{id}`                 | Xóa key khỏi Redis, invalidate danh sách                                   |

### Cache Flow chi tiết

```text
GET /api/products (Không có filter)
  │
  ├─ Bước 1: Kiểm tra Redis key "products:all"
  │           ├── CÓ (HIT)  → Trả JSON từ Redis → Kết thúc
  │           └── KHÔNG (MISS) ↓
  │
  ├─ Bước 2: Query PostgreSQL → Lấy toàn bộ products
  │
  ├─ Bước 3: Lưu kết quả vào Redis (TTL: 1 giờ)
  │
  └─ Bước 4: Trả JSON cho client
```

```text
POST /api/products (Admin tạo mới)
  │
  ├─ Bước 1: Validate input → Lưu vào PostgreSQL
  │
  ├─ Bước 2: redis.SET("products:{id}", product_json) ← REDIS CREATE
  │
  ├─ Bước 3: redis.DEL("products:all")  ← Invalidate cache danh sách
  │
  └─ Bước 4: Trả product mới cho client
```

### Kiểm tra Redis hoạt động

Khi chạy Backend, theo dõi console log:

```
✅ Redis connected successfully                    ← Kết nối thành công
📦 [Redis HIT] GET /api/products — trả từ cache   ← Đọc từ cache (nhanh)
🗄️ [Redis MISS] GET /api/products — query PostgreSQL ← Cache trống, query DB
📦 [Redis CREATE] Cached product #17               ← Tạo mới trong cache
📦 [Redis UPDATE] Updated cache product #17         ← Cập nhật cache
📦 [Redis DELETE] Removed product #17 from cache    ← Xóa khỏi cache
```

### Graceful Fallback

Nếu Redis **không được cài** hoặc **bị ngắt kết nối**, ứng dụng vẫn hoạt động bình thường — tất cả request sẽ đi thẳng vào PostgreSQL. Console sẽ hiện cảnh báo:

```
⚠️ Redis connection error (app sẽ fallback về PostgreSQL): connect ECONNREFUSED
```

---

## 🐳 Docker & Docker Compose (Containerization)

Dự án đã được thiết lập chạy trên Docker với **5 images (dịch vụ)**, thỏa mãn tiêu chí `Docker All Services` (tối thiểu 5 images) và `Docker Compose` (chạy tối thiểu 3 services), bao gồm cả `API Gateway`.

### Danh sách 5 services (Container):

1. **api-gateway** (`nginx:alpine`): Đóng vai trò là Reverse Proxy/API Gateway, điều phối request:
   - Route `/` đi tới `frontend`.
   - Route `/api/` và `/uploads/` đi tới `backend`.
2. **frontend** (Custom image từ `nginx:alpine`): Đóng gói React Vite app sau khi đã build tĩnh.
3. **backend** (Custom image từ `node:18-alpine`): Chạy Express Server, Prisma, logic xử lý và thao tác Redis.
4. **postgres** (`postgres:15-alpine`): Cơ sở dữ liệu chính.
5. **redis** (`redis:alpine`): Hệ thống Cache.

### Cách chạy với Docker Compose

1. **Khởi chạy toàn bộ hệ thống** ở chế độ background:

   ```bash
   docker-compose up -d --build
   ```

2. **Khởi tạo Database** (Chạy Prisma migrate và seed data sau khi DB đã lên):

   ```bash
   # Truy cập vào container backend và chạy lệnh khởi tạo
   docker exec -it record_store_backend npx prisma db push
   docker exec -it record_store_backend npm run seed
   ```

3. **Truy cập ứng dụng:**
   - **Frontend (Web App)**: Mở trình duyệt tại `http://localhost:8080` (API Gateway sẽ tự động trỏ về UI).
   - **Backend API**: Có thể gọi qua Gateway tại `http://localhost:8080/api/...`

### Các lệnh quản lý hữu ích:

- Xem log toàn bộ hệ thống: `docker-compose logs -f`
- Xem log riêng backend: `docker-compose logs -f backend`
- Dừng hệ thống: `docker-compose down`
- Dừng hệ thống và xóa cả volume (xóa sạch DB): `docker-compose down -v`

---

## 🔁 Retry Mechanism (Tự động thử lại khi gặp lỗi tạm thời)

Hệ thống phân tán như dự án này (5 Docker services giao tiếp với nhau) luôn có khả năng gặp **lỗi tạm thời** (transient failure): mạng bị giật, container chưa khởi động xong, DB đang quá tải... Retry Mechanism tự động thử lại các thao tác đó thay vì báo lỗi ngay cho người dùng.

### Chiến lược: Exponential Backoff

Thay vì retry ngay lập tức (gây thêm tải), hệ thống chờ theo hàm mũ giữa các lần thử:

```
Lần 1 thất bại → chờ 500ms  → thử lại
Lần 2 thất bại → chờ 1000ms → thử lại
Lần 3 thất bại → chờ 2000ms → thử lại
Lần 4 thất bại → báo lỗi thực sự (tối đa 8000ms/lần)
```

### 4 lớp Retry được áp dụng

#### 1. Docker Compose — Healthcheck & Restart Policy

Mỗi service có `healthcheck` riêng. Các service phụ thuộc chỉ khởi động sau khi dependency đã **thực sự sẵn sàng** (không chỉ "đang chạy"). Nếu container crash, `restart: on-failure` tự khởi động lại.

```text
postgres  ──healthcheck: pg_isready──►  HEALTHY
redis     ──healthcheck: redis-cli ping──► HEALTHY
                    │
                    ▼  (depends_on condition: service_healthy)
backend   ──healthcheck: GET /api/products──► HEALTHY
                    │
                    ▼
frontend  ──healthcheck: GET :80──► HEALTHY
                    │
                    ▼
api-gateway  (chỉ khởi động sau khi frontend & backend healthy)
```

| Service  | Healthcheck         | Interval | Retries | Start Period |
| -------- | ------------------- | -------- | ------- | ------------ |
| postgres | `pg_isready`        | 10s      | 5       | 20s          |
| redis    | `redis-cli ping`    | 10s      | 5       | 10s          |
| backend  | `GET /api/products` | 15s      | 5       | 30s          |
| frontend | `GET :80`           | 10s      | 3       | 15s          |

#### 2. Backend — `withRetry` Utility (Exponential Backoff)

Hàm tiện ích dùng chung trong toàn backend, chỉ retry lỗi tạm thời — **không** retry lỗi logic ứng dụng (hết hàng, không tìm thấy sản phẩm):

```typescript
// Dùng cho bất kỳ DB operation nào cần bảo vệ
const result = await withRetry(
  () => prisma.$transaction(...),
  { maxAttempts: 3, baseDelayMs: 500, label: 'checkout transaction' }
);
```

Hiện đang bảo vệ **Checkout endpoint** — thao tác quan trọng nhất, mất đơn hàng nếu DB lỗi tạm thời.

#### 3. Backend — Redis Retry (Tự kết nối lại)

ioredis được cấu hình để **tự động kết nối lại** sau khi mất kết nối (không giới hạn), với exponential backoff tối đa 10s/lần:

```text
Redis mất kết nối
  → chờ 500ms → thử kết nối lại
  → chờ 1000ms → thử kết nối lại
  → chờ 2000ms → thử kết nối lại
  → ...tối đa 10000ms/lần → tiếp tục thử cho đến khi thành công
```

Trong thời gian chờ reconnect, mọi request sẽ tự động **fallback về PostgreSQL** — app không bị gián đoạn.

#### 4. Frontend — Axios Retry Interceptor

`api.ts` tự động retry khi nhận lỗi server (5xx) hoặc mạng bị ngắt (network error), **không** retry lỗi logic (4xx, 429):

```text
Request thất bại
  ├── 429 (Rate Limit) → Hiện toast cảnh báo, không retry
  ├── 4xx (lỗi client) → Báo lỗi ngay, không retry
  ├── 5xx / Network error → Retry với exponential backoff
  │     Lần 1: chờ 500ms → retry
  │     Lần 2: chờ 1000ms → retry
  │     Lần 3: chờ 2000ms → retry
  │     Hết retry → Hiện toast "Kết nối thất bại"
  └── Timeout (ECONNABORTED) → Báo lỗi ngay, không retry
```

### Console Log khi Retry hoạt động

Theo dõi backend logs để thấy retry:

```
⚠️ [Retry] checkout transaction thất bại lần 1/3. Thử lại sau 500ms...
⚠️ [Retry] checkout transaction thất bại lần 2/3. Thử lại sau 1000ms...
✅ [Retry] checkout transaction thành công ở lần thử 3
```

```
⚠️ [Redis Retry] Lần 1 — thử kết nối lại sau 500ms
🔄 [Redis Retry] Đang thử kết nối lại Redis...
✅ Redis ready — cache layer hoạt động
```

---

## 🤖 CI/CD Pipelines (Automated Deployments)

Dự án tích hợp sẵn cấu hình Pipeline để tự động hóa quá trình kiểm thử, build và triển khai, đáp ứng các tiêu chí về **DevOps** và **Automation**.

- **GitLab CI/CD (`.gitlab-ci.yml`)**:
  - Tự động build Frontend & Backend.
  - Kiểm tra tính toàn vẹn của mã nguồn.
  - Sẵn sàng để deploy lên server thông qua GitLab Runner.
- **Jenkins (`Jenkinsfile`)**:
  - Pipeline 4 giai đoạn chuyên nghiệp: `Checkout` → `Install` → `Build` → `Docker Deploy`.
  - **Retry tích hợp**: mỗi stage `npm install`, `npm run build` và `docker-compose up` đều được bọc trong `retry(3)` — tự động thử lại tối đa 3 lần nếu mạng CI flaky hoặc Docker Hub bị chậm.
  - Giúp quản lý vòng đời phát triển phần mềm một cách tự động.

---

## 🛡️ Rate Limiting (Security & UX)

Hệ thống được bảo vệ 2 lớp bởi cơ chế **Rate Limiting** để chống lại các cuộc tấn công Spam và Brute-force, đảm bảo trải nghiệm người dùng mượt mà.

### 1. Server-side (Hậu phương bảo mật)

Sử dụng middleware `express-rate-limit` để kiểm soát lưu lượng truy cập dựa trên IP:

- **General Rate Limit:** 100 requests / 15 phút (Áp dụng toàn bộ hệ thống).
- **Strict Rate Limit:** 5 requests / 15 phút (Áp dụng cho **Login** và **Checkout**).
- **Trust Proxy:** Đã được cấu hình để nhận diện đúng IP người dùng ngay cả khi chạy sau Nginx/Docker.

### 2. Client-side (Tiền tuyến trải nghiệm)

- **Submission Blocking:** Nút "Xác nhận đặt hàng" và "Đăng nhập" sẽ bị vô hiệu hóa (`disabled`) ngay khi nhấn để ngăn chặn việc gửi trùng lặp yêu cầu do click quá nhanh (Double-click).
- **Global Error Handling:** Tích hợp bộ bắt lỗi (Interceptor) trong `api.ts`. Nếu Server trả về lỗi `429 (Too Many Requests)`, ứng dụng sẽ hiển thị thông báo Toast cảnh báo người dùng một cách thân thiện thay vì để ứng dụng bị treo.

---
