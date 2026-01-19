# 🎾 Booking Pickleball

> Hệ thống quản lý và đặt sân Pickleball trực tuyến

[![Next.js](https://img.shields.io/badge/Next.js-15.5-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=flat&logo=node.js)](https://nodejs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.19-2D3748?style=flat&logo=prisma)](https://www.prisma.io/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-blue?style=flat&logo=mysql)](https://www.mysql.com/)

## 📋 Mục Lục

- [Giới Thiệu](#-giới-thiệu)
- [Tính Năng](#-tính-năng)
- [Công Nghệ](#-công-nghệ)
- [Yêu Cầu](#-yêu-cầu)
- [Cài Đặt](#-cài-đặt)
- [Cấu Trúc Dự Án](#-cấu-trúc-dự-án)
- [API Documentation](#-api-documentation)
- [Screenshots](#-screenshots)
- [Đóng Góp](#-đóng-góp)
- [License](#-license)

## 🎯 Giới Thiệu

**Booking Pickleball** là một hệ thống quản lý đầy đủ cho việc đặt sân Pickleball trực tuyến. Dự án cung cấp giao diện thân thiện cho người dùng đặt sân, quản lý lịch đặt, thanh toán trực tuyến và nhiều tính năng khác.

### Đối Tượng Sử Dụng

- 👥 **Người dùng**: Đặt sân, quản lý lịch đặt, thanh toán, đánh giá
- 👨‍💼 **Admin**: Quản lý sân, đặt lịch, người dùng, thống kê, blog
- 🏢 **Chủ sân**: Theo dõi doanh thu, quản lý đặt sân, xử lý yêu cầu

## ✨ Tính Năng

### Người Dùng

- ✅ **Đăng ký/Đăng nhập** - Xác thực với JWT
- 🔍 **Tìm kiếm sân** - Lọc theo loại, giá, thời gian
- 📅 **Đặt sân** - Đặt lẻ, đặt theo tuần, đặt cho giải đấu
- 💳 **Thanh toán** - Tích hợp PayOS (cọc 30%, thanh toán còn lại)
- 📜 **Lịch sử đặt sân** - Xem, hủy, yêu cầu hoàn tiền
- ⭐ **Đánh giá sân** - Rating và comment sau khi sử dụng
- 📝 **Blog** - Đọc, viết, like, comment bài viết
- 💬 **Chatbot AI** - Hỗ trợ tự động 24/7
- 👤 **Quản lý profile** - Cập nhật thông tin, ảnh đại diện

### Admin

- 📊 **Dashboard thống kê** - Doanh thu, đặt sân, người dùng
- 🎾 **Quản lý sân** - CRUD courts, slots, pricing
- 📅 **Quản lý booking** - Xác nhận, check-in, hoàn thành
- 👥 **Quản lý người dùng** - Phân quyền, khóa/mở tài khoản
- 💰 **Quản lý thanh toán** - Theo dõi, xác nhận hoàn tiền
- 📰 **Quản lý blog** - Duyệt, chỉnh sửa, xóa bài viết
- 🏆 **Quản lý giải đấu** - Tạo, theo dõi tournament
- 📈 **Báo cáo** - Export Excel, biểu đồ doanh thu

### Chính Sách Đặt Sân

- ⏰ **Cọc trước 30%** - Thanh toán qua PayOS
- 🔄 **Hoàn tiền linh hoạt**:
  - Hủy trên 2 giờ: Hoàn 100%
  - Hủy 1-2 giờ: Hoàn 80%
  - Hủy 30 phút - 1 giờ: Hoàn 50%
  - Hủy dưới 30 phút: Không hoàn
- 📅 **Đặt theo tuần** - Giảm giá cho đặt định kỳ
- 🏆 **Đặt cho giải đấu** - Ưu tiên và hỗ trợ đặc biệt

## 🛠 Công Nghệ

### Frontend

- **Framework**: Next.js 15.5 (App Router)
- **Language**: TypeScript 5.9
- **UI Library**: React 19, Tailwind CSS
- **Components**: Radix UI, shadcn/ui
- **State Management**: React Hooks
- **Forms**: React Hook Form + Zod
- **Charts**: Chart.js, React Chart.js 2
- **Editor**: CKEditor 5 (WYSIWYG)
- **Icons**: Lucide React
- **Date**: date-fns, React DatePicker
- **Notifications**: Sonner

### Backend

- **Runtime**: Node.js 18+
- **Framework**: Express 5
- **Language**: TypeScript 5.9
- **ORM**: Prisma 6.19
- **Database**: MySQL 8.0
- **Auth**: JWT (jsonwebtoken), bcrypt
- **Payment**: PayOS SDK
- **AI**: Google Generative AI, OpenRouter
- **Cron Jobs**: node-cron
- **File Upload**: Multer
- **Validation**: express-validator

### DevOps & Tools

- **Package Manager**: npm
- **Database Tools**: Prisma Studio
- **API Testing**: Postman/Thunder Client
- **Version Control**: Git
- **Code Editor**: VS Code

## 📦 Yêu Cầu

Đảm bảo đã cài đặt:

```bash
Node.js >= 18.0.0
npm >= 9.0.0
MySQL >= 8.0.0
Git
```

## 🚀 Cài Đặt

### 1. Clone Repository

```bash
git clone https://github.com/TyPhu0312/Booking-Pickleball.git
cd Booking-Pickleball
```

### 2. Cài Đặt Backend

```bash
cd backend
npm install
```

Tạo file `.env`:

```env
DATABASE_URL="mysql://username:password@localhost:3306/booking_pickleball"
PORT=5000
JWT_SECRET=your_jwt_secret_key
PAYOS_CLIENT_ID=your_payos_client_id
PAYOS_API_KEY=your_payos_api_key
PAYOS_CHECKSUM_KEY=your_payos_checksum_key
GOOGLE_AI_API_KEY=your_google_ai_api_key
FRONTEND_URL=http://localhost:3000
```

Khởi tạo database:

```bash
npm run prisma:generate
npm run prisma:push
```

### 3. Cài Đặt Frontend

```bash
cd ../frontend
npm install
```

Tạo file `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_APP_NAME=Booking Pickleball
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Chạy Ứng Dụng

**Terminal 1 - Backend:**

```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**

```bash
cd frontend
npm run dev
```

Truy cập:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- Prisma Studio: http://localhost:5555 (chạy `npx prisma studio`)

📖 **[Xem hướng dẫn cài đặt chi tiết](docs/Huong_dan_cai_dat.md)**

## 📁 Cấu Trúc Dự Án

```
Booking-Pickleball/
│
├── backend/                    # Node.js + Express + Prisma
│   ├── controllers/           # Business logic
│   │   ├── auth.controller.ts
│   │   ├── bookings.controller.ts
│   │   ├── courts.controller.ts
│   │   ├── payments.controller.ts
│   │   └── ...
│   ├── middlewares/           # Auth, validation
│   ├── routes/                # API endpoints
│   ├── prisma/                # Database schema
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── utils/                 # Helper functions
│   ├── prompts/               # AI chatbot prompts
│   └── index.ts               # Entry point
│
├── frontend/                  # Next.js 15 + React 19
│   ├── src/
│   │   ├── app/              # App Router
│   │   │   ├── (auth)/       # Auth pages
│   │   │   ├── (page)/       # User pages
│   │   │   └── admin/        # Admin panel
│   │   ├── components/       # React components
│   │   │   ├── admin/
│   │   │   ├── auth/
│   │   │   ├── features/
│   │   │   └── ui/           # shadcn/ui components
│   │   └── lib/              # Utils & config
│   └── public/               # Static files
│
└── docs/                      # Documentation
    └── Huong_dan_cai_dat.md
```

## 📡 API Documentation

### Authentication

```
POST   /api/auth/register        # Đăng ký
POST   /api/auth/login           # Đăng nhập
GET    /api/auth/profile         # Lấy profile (JWT required)
```

### Bookings

```
GET    /api/bookings                      # Danh sách booking
POST   /api/bookings                      # Tạo booking mới
GET    /api/bookings/:id                  # Chi tiết booking
PUT    /api/bookings/update/:id           # Cập nhật booking
DELETE /api/bookings/delete/:id           # Hủy booking
GET    /api/bookings/getBookingByUserIdOrPhone/:id  # Lịch sử user
```

### Courts

```
GET    /api/courts               # Danh sách sân
POST   /api/courts               # Tạo sân (Admin)
GET    /api/courts/:id           # Chi tiết sân
PUT    /api/courts/:id           # Cập nhật sân (Admin)
DELETE /api/courts/:id           # Xóa sân (Admin)
```

### Slots

```
GET    /api/slots                # Danh sách slots
POST   /api/slots                # Tạo slot (Admin)
GET    /api/slots/available      # Slots available
```

### Payments

```
POST   /api/payos/create         # Tạo thanh toán
GET    /api/payos/booking/:id    # Thông tin payment
POST   /api/payos/webhook        # PayOS webhook
```

### Refunds

```
POST   /api/refunds/request-cancel/:id   # Yêu cầu hoàn tiền
GET    /api/refunds                       # Danh sách refunds (Admin)
PUT    /api/refunds/approve/:id           # Duyệt hoàn tiền (Admin)
```

### Feedbacks

```
GET    /api/feedbacks                     # Danh sách đánh giá
POST   /api/feedbacks                     # Tạo đánh giá
GET    /api/feedbacks/court/:id           # Đánh giá của sân
GET    /api/feedbacks/user/:id/bookings   # Check can review
```

### Users (Admin)

```
GET    /api/users                # Danh sách users
GET    /api/users/:id            # Chi tiết user
PUT    /api/users/:id            # Cập nhật user
DELETE /api/users/:id            # Xóa user
```

## 🔐 Authentication Flow

1. User đăng ký/đăng nhập
2. Server trả về JWT token
3. Client lưu token vào localStorage
4. Mọi request kèm theo header: `Authorization: Bearer <token>`
5. Middleware verify token và attach user vào request

## 💳 Payment Flow

1. User chọn slot và tạo booking
2. System tính 30% tiền cọc
3. Redirect đến PayOS payment gateway
4. PayOS callback về webhook
5. System cập nhật booking status → CONFIRMED
6. User thanh toán 70% còn lại khi check-in

## 📊 Database Schema

### Main Tables

- **Users** - Người dùng (admin, user)
- **Roles** - Phân quyền
- **Courts** - Sân (INDOOR/OUTDOOR)
- **Slots** - Khung giờ
- **Bookings** - Đặt sân (CASUAL/WEEKLY/TOURNAMENT)
- **BookingSlots** - Chi tiết booking-slot mapping
- **Payments** - Thanh toán
- **Refunds** - Hoàn tiền
- **Feedbacks** - Đánh giá
- **Tournaments** - Giải đấu
- **Blogs** - Bài viết

## 🎨 Screenshots

_Coming soon..._

## 🤝 Đóng Góp

Contributions, issues và feature requests đều được chào đón!

1. Fork dự án
2. Tạo branch: `git checkout -b feature/AmazingFeature`
3. Commit: `git commit -m 'Add some AmazingFeature'`
4. Push: `git push origin feature/AmazingFeature`
5. Tạo Pull Request

## 👥 Team

- **Tác giả**: TyPhu0312
- **Dự án**: Luận văn tốt nghiệp (LVTN)

## 📝 License

Dự án này được phát triển cho mục đích học tập và nghiên cứu.

---

⭐ Nếu dự án hữu ích, hãy cho một star nhé! ⭐