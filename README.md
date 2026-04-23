# 📀 RECORD STORE - FULLSTACK E-COMMERCE

Một ứng dụng web mua sắm đĩa nhạc (Vinyl, CD) và Merchandise hoàn chỉnh từ Frontend tới Backend. Dự án được thiết kế với phong cách tối giản (Minimalism), hiện đại và tập trung vào trải nghiệm mua sắm mượt mà.

---

## 🛠 Tech Stack (Công nghệ sử dụng)

### Frontend (Giao diện người dùng)
* **Framework**: React 18, TypeScript (Vite).
* **State Management**: Redux Toolkit (quản lý giỏ hàng, thông tin sản phẩm từ API).
* **Styling**: Tailwind CSS (Utility-first CSS).
* **Routing**: React Router v6.
* **HTTP Client**: Axios.
* **UI Utilities**: Lucide React (Icons), React Hot Toast (Thông báo).

### Backend (Máy chủ & API)
* **Runtime**: Node.js với TypeScript (`tsx`, `nodemon`).
* **Framework**: Express.js.
* **Cơ sở dữ liệu (Database)**: PostgreSQL.
* **ORM (Kết nối CSDL)**: Prisma (`@prisma/client`, `@prisma/adapter-pg`).
* **Xác thực (Authentication)**: JWT (JSON Web Token) & Bcryptjs.
* **Xử lý hình ảnh**: Multer (Tải ảnh trực tiếp lên server).

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

*(Mở liên kết `http://localhost:5173` trên trình duyệt và bắt đầu mua sắm!)*

---

## 📁 Cấu trúc thư mục (Project Structure)

Dự án được phân tách rõ ràng theo mô hình Client - Server:

```text
Ktvtkpm_25_26/
├── backend/
│   ├── prisma/             # Cấu trúc CSDL (schema.prisma)
│   ├── src/
│   │   ├── index.ts        # Express Server & API logic
│   │   └── seed.ts         # Script tiêm dữ liệu mẫu vào DB
│   ├── .env                # Biến môi trường Database
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
