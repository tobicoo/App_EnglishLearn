# EnglishLearn

Ứng dụng học tiếng Anh di động theo mô hình gamification — học qua bài tập, flashcard, thi đua bảng xếp hạng và nhận thưởng XP mỗi ngày.

Chạy trên **Android**, **iOS** và **Web** thông qua Expo Go.

---

## Thành viên nhóm

| Thành viên | MSSV | Vai trò & Công việc |
|---|---|---|
| Bùi Minh Ngọc | | Backend · Database · REST API · Gamification (XP, Hearts, Streak, Gems) · Seed data |
| Nguyễn Thùy Linh | | Frontend UI · Auth Flow (Login/Register/Welcome) · Profile · Leaderboard · Theme sáng/tối · Ngôn ngữ per-user |
| Nguyễn Nhật Tùng Anh | | Quiz System · Admin Panel · English Pro · Notifications · Exam · Routing |

---

## Giới thiệu dự án

**EnglishLearn** cung cấp lộ trình học tiếng Anh có cấu trúc từ cơ bản đến nâng cao:

- **Bài học** theo cấu trúc Section → Unit → Exercise (trắc nghiệm, điền từ, nối cặp)
- **Flashcard** kèm phát âm Text-to-Speech
- **Gamification** — XP · Level · Streak · Gems · Hearts đồng bộ thực với server
- **Bảng xếp hạng** toàn server theo XP
- **Tạo & lưu đề thi** cá nhân
- **Thông báo** trong ứng dụng
- **Gói Premium** (English Pro)
- **Admin Panel** quản lý nội dung, người dùng, hệ thống
- **Dark / Light Theme** lưu per-device
- **Ngôn ngữ UI** Tiếng Việt / English lưu per-user

---

## Cách chạy

### Yêu cầu

- Node.js 18+
- MariaDB hoặc MySQL 8+
- npm 9+
- Expo Go (cài trên điện thoại từ App Store / Google Play)

---

### Backend

**Bước 1 — Tạo database**

```sql
CREATE DATABASE english_learning_app
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

**Bước 2 — Tạo file môi trường**

```bash
cd backend
```

Tạo file `.env` với nội dung:

```env
PORT=3000
DATABASE_URL="mysql://root:@localhost:3306/english_learning_app"
JWT_SECRET="replace-with-a-long-random-secret"
JWT_EXPIRES_IN=7d
ADMIN_EMAIL="admin@test.com"
ADMIN_PASSWORD="123123"
```

**Bước 3 — Cài dependencies và migrate**

```bash
npm install
npm run prisma:generate
npm run prisma:migrate:dev
```

**Bước 4 — Seed dữ liệu mẫu**

```bash
node prisma/seed.js
```

**Bước 5 — Chạy server**

```bash
npm run dev
```

Server chạy tại `http://localhost:3000` — kiểm tra tại `http://localhost:3000/health`

---

### Frontend

**Bước 1 — Cài dependencies**

```bash
cd frontend
npm install
```

**Bước 2 — Cấu hình IP** *(chỉ cần khi dùng điện thoại thật)*

Tạo file `frontend/.env.local`:

```env
EXPO_PUBLIC_API_URL=http://<IP_MÁY_TÍNH>:3000
```

> Lấy IP bằng lệnh `ipconfig` (Windows) — mục **IPv4 Address**.
> Điện thoại và máy tính phải cùng mạng WiFi.

**Bước 3 — Chạy Expo**

```bash
npm start
```

Mở **Expo Go** trên điện thoại → quét QR code trên terminal.

---

## Tài khoản mặc định

> Tất cả tài khoản được tạo tự động sau khi chạy `node prisma/seed.js`

### Admin

| Email | Mật khẩu | Ghi chú |
|---|---|---|
| admin@test.com | 123123 | Vào Admin Panel qua Menu → Admin Panel |

### User mẫu

| Tên | Email | Mật khẩu |
|---|---|---|
| Hoàng Minh Khoa | leaderboard-201@seed.local | leaderboard-201 |
| Trần Anh Thư | leaderboard-202@seed.local | leaderboard-202 |
| Nguyễn Bảo Châu | leaderboard-203@seed.local | leaderboard-203 |
| Lê Gia Hân | leaderboard-204@seed.local | leaderboard-204 |
| Phạm Việt Dũng | leaderboard-205@seed.local | leaderboard-205 |
| Vũ Thanh Hương | leaderboard-206@seed.local | leaderboard-206 |
| Đặng Quốc Huy | leaderboard-207@seed.local | leaderboard-207 |
| Bùi Khánh Linh | leaderboard-208@seed.local | leaderboard-208 |
| Ngô Thị Phương | leaderboard-209@seed.local | leaderboard-209 |
| Tô Minh Đức | leaderboard-210@seed.local | leaderboard-210 |

---

*Đồ án môn Lập trình trên thiết bị di động — EPU · Năm 3 · Kỳ 6 · 2025–2026*
