# 📋 AGILE-SCRUM DOCUMENTATION

## Record Store — Fullstack E-Commerce

---

## 1. Thông tin dự án

| Mục                   | Nội dung                                                            |
| --------------------- | ------------------------------------------------------------------- |
| **Tên dự án**         | Record Store — Fullstack E-Commerce                                 |
| **Mô tả**             | Ứng dụng web mua sắm đĩa nhạc (Vinyl, CD) và Merchandise hoàn chỉnh |
| **Phương pháp**       | Agile — Scrum Framework                                             |
| **Độ dài Sprint**     | 1 tuần / sprint                                                     |
| **Tổng số Sprint**    | 3 sprints                                                           |
| **Thời gian dự kiến** | 3 tuần                                                              |

---

## 2. Vai trò trong nhóm (Scrum Roles)

| Vai trò              | Trách nhiệm                                                      |
| -------------------- | ---------------------------------------------------------------- |
| **Product Owner**    | Xác định yêu cầu, ưu tiên Product Backlog, nhận demo cuối sprint |
| **Scrum Master**     | Tổ chức các buổi Scrum ceremonies, gỡ blocker cho team           |
| **Development Team** | Thiết kế, code, test và deploy các tính năng                     |

---

## 3. Product Backlog

Toàn bộ User Stories của dự án, sắp xếp theo độ ưu tiên từ cao xuống thấp.

### 3.1 Epic: Quản lý Sản phẩm

| ID    | User Story                                                                                                   | Priority      | Story Points | Sprint   |
| ----- | ------------------------------------------------------------------------------------------------------------ | ------------- | ------------ | -------- |
| US-01 | Là **khách hàng**, tôi muốn xem danh sách tất cả sản phẩm để có thể duyệt và chọn mua.                       | 🔴 Cao        | 3            | Sprint 1 |
| US-02 | Là **khách hàng**, tôi muốn lọc sản phẩm theo danh mục (Vinyl, CD, Merch) để tìm kiếm nhanh hơn.             | 🔴 Cao        | 2            | Sprint 1 |
| US-03 | Là **khách hàng**, tôi muốn xem chi tiết một sản phẩm (ảnh, giá, mô tả, tồn kho) để quyết định có mua không. | 🔴 Cao        | 2            | Sprint 1 |
| US-04 | Là **admin**, tôi muốn thêm sản phẩm mới kèm ảnh để cập nhật kho hàng.                                       | 🔴 Cao        | 5            | Sprint 1 |
| US-05 | Là **admin**, tôi muốn chỉnh sửa thông tin sản phẩm (giá, tồn kho, mô tả) để dữ liệu luôn chính xác.         | 🟡 Trung bình | 3            | Sprint 1 |
| US-06 | Là **admin**, tôi muốn xóa sản phẩm (khi chưa có đơn hàng) để dọn dẹp kho hàng.                              | 🟡 Trung bình | 2            | Sprint 1 |

### 3.2 Epic: Giỏ hàng & Thanh toán

| ID    | User Story                                                                                                   | Priority | Story Points | Sprint   |
| ----- | ------------------------------------------------------------------------------------------------------------ | -------- | ------------ | -------- |
| US-07 | Là **khách hàng**, tôi muốn thêm sản phẩm vào giỏ hàng để mua nhiều món cùng lúc.                            | 🔴 Cao   | 3            | Sprint 1 |
| US-08 | Là **khách hàng**, tôi muốn thay đổi số lượng và xóa sản phẩm trong giỏ hàng.                                | 🔴 Cao   | 2            | Sprint 1 |
| US-09 | Là **khách hàng**, tôi muốn xem tổng tiền giỏ hàng được cập nhật theo thời gian thực.                        | 🔴 Cao   | 1            | Sprint 1 |
| US-10 | Là **khách hàng**, tôi muốn điền thông tin giao hàng và xác nhận đặt hàng để hoàn tất mua sắm.               | 🔴 Cao   | 5            | Sprint 1 |
| US-11 | Là **hệ thống**, tôi cần kiểm tra tồn kho và trừ số lượng ngay khi checkout (transaction) để tránh oversell. | 🔴 Cao   | 5            | Sprint 1 |

### 3.3 Epic: Xác thực & Phân quyền

| ID    | User Story                                                                                 | Priority      | Story Points | Sprint   |
| ----- | ------------------------------------------------------------------------------------------ | ------------- | ------------ | -------- |
| US-12 | Là **khách hàng**, tôi muốn đăng ký tài khoản với email và mật khẩu.                       | 🔴 Cao        | 3            | Sprint 2 |
| US-13 | Là **khách hàng**, tôi muốn đăng nhập để xem lịch sử đơn hàng của mình.                    | 🔴 Cao        | 3            | Sprint 2 |
| US-14 | Là **hệ thống**, tôi cần bảo vệ các API admin bằng JWT để chỉ admin mới có quyền truy cập. | 🔴 Cao        | 3            | Sprint 2 |
| US-15 | Là **khách hàng đã đăng nhập**, tôi muốn xem lịch sử tất cả đơn hàng đã đặt.               | 🟡 Trung bình | 3            | Sprint 2 |

### 3.4 Epic: Hiệu năng & Bảo mật

| ID    | User Story                                                                                        | Priority      | Story Points | Sprint   |
| ----- | ------------------------------------------------------------------------------------------------- | ------------- | ------------ | -------- |
| US-16 | Là **hệ thống**, tôi cần cache danh sách sản phẩm bằng Redis để giảm tải cho database.            | 🟡 Trung bình | 5            | Sprint 2 |
| US-17 | Là **hệ thống**, tôi cần giới hạn số lần đăng nhập thất bại (5 lần/15 phút) để chống brute-force. | 🔴 Cao        | 3            | Sprint 2 |
| US-18 | Là **hệ thống**, tôi cần giới hạn request toàn hệ thống (100 req/15 phút/IP) để chống DDoS.       | 🟡 Trung bình | 2            | Sprint 2 |

### 3.5 Epic: DevOps & Độ tin cậy

| ID    | User Story                                                                                                     | Priority      | Story Points | Sprint   |
| ----- | -------------------------------------------------------------------------------------------------------------- | ------------- | ------------ | -------- |
| US-19 | Là **developer**, tôi muốn toàn bộ hệ thống chạy trên Docker Compose (5 services) để dễ deploy.                | 🔴 Cao        | 5            | Sprint 3 |
| US-20 | Là **developer**, tôi muốn có API Gateway (Nginx) để tập trung routing và ẩn nội bộ hệ thống.                  | 🟡 Trung bình | 3            | Sprint 3 |
| US-21 | Là **developer**, tôi muốn CI/CD pipeline tự động build và deploy khi push code.                               | 🟡 Trung bình | 5            | Sprint 3 |
| US-22 | Là **hệ thống**, tôi cần cơ chế tự động thử lại (Retry) khi gặp lỗi kết nối tạm thời để đảm bảo tính liên tục. | 🟡 Trung bình | 5            | Sprint 3 |
| US-23 | Là **hệ thống**, tôi cần healthcheck cho từng Docker service để đảm bảo startup đúng thứ tự.                   | 🟡 Trung bình | 3            | Sprint 3 |

---

## 4. Sprint Planning

### Sprint 1 — Foundation: Core Features

**Mục tiêu Sprint:** Xây dựng nền tảng ứng dụng — người dùng có thể xem sản phẩm, thêm vào giỏ và đặt hàng thành công.

**Thời gian:** Tuần 1

**Sprint Backlog:**

| ID                  | Task                                                               | Assignee | Estimate | Status  |
| ------------------- | ------------------------------------------------------------------ | -------- | -------- | ------- |
| US-01               | Setup Express server + Prisma + PostgreSQL schema                  | Dev      | 4h       | ✅ Done |
| US-01               | Tạo API `GET /api/products` + seed data (20 sản phẩm)              | Dev      | 3h       | ✅ Done |
| US-01, US-02        | Build trang Home, Vinyl, CD, Merch với filter danh mục             | Dev      | 4h       | ✅ Done |
| US-03               | Build trang Product Detail                                         | Dev      | 3h       | ✅ Done |
| US-04, US-05, US-06 | Tạo Admin Dashboard: quản lý sản phẩm (CRUD) + upload ảnh (Multer) | Dev      | 6h       | ✅ Done |
| US-07, US-08, US-09 | Setup Redux Toolkit: cartSlice + productSlice, build trang Cart    | Dev      | 5h       | ✅ Done |
| US-10, US-11        | Tạo API `POST /api/orders/checkout` với Prisma Transaction         | Dev      | 5h       | ✅ Done |
| US-10               | Build trang Checkout + trang Order Complete                        | Dev      | 4h       | ✅ Done |

**Velocity Sprint 1:** 28 Story Points

**Definition of Done:**

- [x] API trả dữ liệu đúng format JSON
- [x] Frontend render được sản phẩm từ API (không dùng mock data)
- [x] Checkout transaction rollback khi hết hàng
- [x] Không có lỗi console khi chạy ứng dụng

---

### Sprint 2 — Security & Performance

**Mục tiêu Sprint:** Bổ sung xác thực người dùng, phân quyền admin, cache Redis và các lớp bảo mật.

**Thời gian:** Tuần 2

**Sprint Backlog:**

| ID    | Task                                                                | Assignee | Estimate | Status  |
| ----- | ------------------------------------------------------------------- | -------- | -------- | ------- |
| US-12 | Tạo API `POST /api/auth/register` + hash password (bcrypt)          | Dev      | 3h       | ✅ Done |
| US-13 | Tạo API `POST /api/auth/login` + phát hành JWT (7 ngày)             | Dev      | 3h       | ✅ Done |
| US-13 | Build UI đăng nhập/đăng ký trong trang `/account`                   | Dev      | 4h       | ✅ Done |
| US-14 | Viết middleware `verifyUser` + `verifyAdmin` bảo vệ admin routes    | Dev      | 3h       | ✅ Done |
| US-15 | Tạo API `GET /api/orders/my-orders` + hiển thị lịch sử đơn hàng     | Dev      | 3h       | ✅ Done |
| US-16 | Tích hợp Redis: cache `products:all` và `products:{id}`, TTL 1 giờ  | Dev      | 6h       | ✅ Done |
| US-16 | Implement CRUD cache: invalidate khi admin thêm/sửa/xóa sản phẩm    | Dev      | 4h       | ✅ Done |
| US-17 | Áp dụng `strictLimiter` (5 req/15 phút) cho `/login` và `/checkout` | Dev      | 2h       | ✅ Done |
| US-18 | Áp dụng `generalLimiter` (100 req/15 phút) cho toàn bộ API          | Dev      | 1h       | ✅ Done |
| US-18 | Xử lý lỗi 429 phía frontend: hiển thị toast thay vì crash           | Dev      | 2h       | ✅ Done |

**Velocity Sprint 2:** 21 Story Points

**Definition of Done:**

- [x] JWT token được lưu `localStorage`, đính kèm vào mọi request cần auth
- [x] Admin routes trả 403 khi user không có quyền
- [x] Redis HIT/MISS log xuất hiện đúng trong console backend
- [x] Brute-force login bị chặn sau 5 lần thử

---

### Sprint 3 — DevOps & Resilience

**Mục tiêu Sprint:** Containerize toàn bộ hệ thống, tự động hóa CI/CD và tăng độ tin cậy với Retry Mechanism.

**Thời gian:** Tuần 3

**Sprint Backlog:**

| ID    | Task                                                                                  | Assignee | Estimate | Status  |
| ----- | ------------------------------------------------------------------------------------- | -------- | -------- | ------- |
| US-19 | Viết `Dockerfile` cho frontend (multi-stage: build + nginx)                           | Dev      | 2h       | ✅ Done |
| US-19 | Viết `Dockerfile` cho backend (node:20-alpine + prisma generate)                      | Dev      | 2h       | ✅ Done |
| US-19 | Viết `docker-compose.yml` với 5 services: gateway, frontend, backend, postgres, redis | Dev      | 3h       | ✅ Done |
| US-20 | Cấu hình Nginx `nginx.conf`: route `/` → frontend, `/api/` → backend                  | Dev      | 2h       | ✅ Done |
| US-21 | Viết `.gitlab-ci.yml`: stages build → test → deploy                                   | Dev      | 3h       | ✅ Done |
| US-21 | Viết `Jenkinsfile`: pipeline 4 stages với retry(3) cho mỗi stage                      | Dev      | 3h       | ✅ Done |
| US-22 | Viết utility `withRetry` (Exponential Backoff) trong backend                          | Dev      | 4h       | ✅ Done |
| US-22 | Bọc Checkout transaction trong `withRetry` (3 lần, 500ms base)                        | Dev      | 1h       | ✅ Done |
| US-22 | Fix Redis `retryStrategy`: retry vô thời hạn thay vì dừng sau 3 lần                   | Dev      | 2h       | ✅ Done |
| US-22 | Thêm Axios retry interceptor frontend: retry 3 lần cho 5xx/network error              | Dev      | 3h       | ✅ Done |
| US-23 | Thêm `healthcheck` cho 5 Docker services + `depends_on condition: service_healthy`    | Dev      | 3h       | ✅ Done |
| US-23 | Thêm `restart: on-failure` cho tất cả services                                        | Dev      | 1h       | ✅ Done |

**Velocity Sprint 3:** 16 Story Points

**Definition of Done:**

- [x] `docker-compose up -d --build` khởi động thành công tất cả 5 services
- [x] `docker-compose ps` hiển thị tất cả services ở trạng thái `healthy`
- [x] withRetry unit tests: 5/5 PASS
- [x] CI/CD pipeline chạy không lỗi khi push lên nhánh `main`

---

## 5. Sprint Review (Demo & Kết quả)

### Sprint 1 Review

**Demo cho:** Product Owner / Giảng viên hướng dẫn

| Tính năng demo                                    | Kết quả      |
| ------------------------------------------------- | ------------ |
| Xem danh sách sản phẩm từ PostgreSQL qua API      | ✅ Hoạt động |
| Filter sản phẩm theo Vinyl / CD / Merch           | ✅ Hoạt động |
| Thêm sản phẩm vào giỏ, thay đổi số lượng          | ✅ Hoạt động |
| Checkout: trừ tồn kho, tạo đơn hàng (transaction) | ✅ Hoạt động |
| Checkout hết hàng: rollback, không tạo đơn        | ✅ Hoạt động |
| Admin: Thêm/Sửa/Xóa sản phẩm, upload ảnh          | ✅ Hoạt động |

**Feedback nhận được:** Cần bổ sung xác thực người dùng và bảo mật API → chuyển sang Sprint 2.

---

### Sprint 2 Review

**Demo cho:** Product Owner / Giảng viên hướng dẫn

| Tính năng demo                                               | Kết quả      |
| ------------------------------------------------------------ | ------------ |
| Đăng ký / Đăng nhập trả JWT token                            | ✅ Hoạt động |
| Truy cập Admin Dashboard: chỉ ADMIN được vào                 | ✅ Hoạt động |
| Xem lịch sử đơn hàng (user đã đăng nhập)                     | ✅ Hoạt động |
| Redis cache: lần đầu MISS (query DB), lần sau HIT (từ cache) | ✅ Hoạt động |
| Rate limit: login > 5 lần → trả 429 + toast thông báo        | ✅ Hoạt động |

**Feedback nhận được:** Cần containerize để dễ deploy và tăng độ tin cậy → chuyển sang Sprint 3.

---

### Sprint 3 Review

**Demo cho:** Product Owner / Giảng viên hướng dẫn

| Tính năng demo                                                          | Kết quả                       |
| ----------------------------------------------------------------------- | ----------------------------- |
| `docker-compose up`: 5 services khởi động đúng thứ tự nhờ healthcheck   | ✅ Hoạt động                  |
| Truy cập `http://localhost:8080` qua API Gateway                        | ✅ Hoạt động                  |
| Tắt Redis → app fallback PostgreSQL, bật lại → tự reconnect             | ✅ Hoạt động                  |
| withRetry: simulate DB lỗi 2 lần → thành công lần 3                     | ✅ Hoạt động (5/5 tests pass) |
| Frontend: server trả 503 → tự retry 3 lần, hiển thị toast khi hết retry | ✅ Hoạt động                  |
| Jenkins pipeline push `main` → tự động build + deploy                   | ✅ Hoạt động                  |

---

## 6. Sprint Retrospective

### Sprint 1 Retrospective

| Hạng mục             | Nội dung                                                                                                   |
| -------------------- | ---------------------------------------------------------------------------------------------------------- |
| ✅ **Làm tốt**       | Prisma schema thiết kế hợp lý ngay từ đầu, ít phải migrate. Redux Toolkit giúp quản lý cart state rất gọn. |
| ⚠️ **Cần cải thiện** | Chưa có authentication → một số API admin bị public. Cần xử lý sớm hơn ở sprint sau.                       |
| 💡 **Hành động**     | Sprint 2 ưu tiên JWT auth trước khi build thêm tính năng mới.                                              |

### Sprint 2 Retrospective

| Hạng mục             | Nội dung                                                                                                  |
| -------------------- | --------------------------------------------------------------------------------------------------------- |
| ✅ **Làm tốt**       | Redis cache hoạt động ngay, fallback về PostgreSQL khi Redis down rất trơn tru. Rate limiting bảo vệ tốt. |
| ⚠️ **Cần cải thiện** | Redis `retryStrategy` ban đầu cấu hình `return null` sau 3 lần → mất kết nối vĩnh viễn khi Redis restart. |
| 💡 **Hành động**     | Sprint 3 fix Redis retry strategy, bổ sung `reconnectOnError`.                                            |

### Sprint 3 Retrospective

| Hạng mục             | Nội dung                                                                                                                    |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| ✅ **Làm tốt**       | `withRetry` utility tái sử dụng được, unit test 5/5. Docker healthcheck giải quyết hoàn toàn vấn đề startup race condition. |
| ⚠️ **Cần cải thiện** | `docker-compose.yml` chưa có volume backup cho Redis. CI/CD chưa có stage `test` tự động.                                   |
| 💡 **Hành động**     | Backlog cho sprint tương lai: thêm Redis persistence, viết integration tests.                                               |

---

## 7. Burndown Chart (Story Points)

```
Sprint 1 (28 points)
Ngày 1  ████████████████████████████  28 pts remaining
Ngày 2  ████████████████████████      24 pts remaining
Ngày 3  ████████████████              16 pts remaining
Ngày 4  ████████                       8 pts remaining
Ngày 5  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░   0 pts remaining ✅

Sprint 2 (21 points)
Ngày 1  █████████████████████          21 pts remaining
Ngày 2  █████████████████              17 pts remaining
Ngày 3  ████████████                   12 pts remaining
Ngày 4  ███████                         7 pts remaining
Ngày 5  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░   0 pts remaining ✅

Sprint 3 (16 points)
Ngày 1  ████████████████               16 pts remaining
Ngày 2  ████████████                   12 pts remaining
Ngày 3  ████████                        8 pts remaining
Ngày 4  ████                            4 pts remaining
Ngày 5  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░   0 pts remaining ✅
```

**Tổng Velocity:** 28 + 21 + 16 = **65 Story Points** hoàn thành trong 3 sprints.

---

## 8. Definition of Done (Chung)

Một User Story được coi là **Done** khi thỏa mãn toàn bộ các tiêu chí sau:

- [ ] Code đã được review (hoặc self-review nếu làm một mình)
- [ ] Không có lỗi TypeScript compile (frontend `tsc --noEmit` exit code 0)
- [ ] Tính năng hoạt động đúng trên môi trường local
- [ ] Tính năng hoạt động đúng trên môi trường Docker (`docker-compose up`)
- [ ] Không có lỗi console nghiêm trọng (error) khi sử dụng tính năng
- [ ] README.md đã được cập nhật nếu tính năng thay đổi cách chạy dự án

---

## 9. Technical Debt & Future Backlog

Các hạng mục chưa làm, có thể đưa vào sprint tương lai:

| ID    | Mô tả                                                                       | Priority      |
| ----- | --------------------------------------------------------------------------- | ------------- |
| TD-01 | Viết Integration Tests cho các API endpoint chính (checkout, auth)          | 🟡 Trung bình |
| TD-02 | Thêm Redis persistence (`appendonly yes`) để cache không mất khi restart    | 🟡 Trung bình |
| TD-03 | Email notification khi đặt hàng thành công (nodemailer)                     | 🟢 Thấp       |
| TD-04 | Tìm kiếm sản phẩm full-text (hiện tại Navbar search chỉ filter client-side) | 🟡 Trung bình |
| TD-05 | Pagination cho trang sản phẩm (hiện tại load all)                           | 🟡 Trung bình |
| TD-06 | HTTPS / SSL certificate cho production deployment                           | 🔴 Cao        |
| TD-07 | Monitoring & Alerting (Prometheus + Grafana)                                | 🟢 Thấp       |

---

_Tài liệu này được tạo theo Scrum Guide 2020 — scrumguides.org_
