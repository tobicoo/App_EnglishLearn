# EnglishLearn

> *"Ngôn ngữ không chỉ là công cụ giao tiếp — đó là cánh cửa dẫn vào một thế giới khác."*

---

## Giới thiệu

**EnglishLearn** là ứng dụng học tiếng Anh di động được xây dựng theo mô hình gamification toàn diện, lấy cảm hứng từ những nền tảng giáo dục hàng đầu thế giới. Thay vì biến việc học thành nghĩa vụ khô khan, EnglishLearn kiến tạo một hành trình — nơi mỗi bài học là một màn chơi, mỗi câu trả lời đúng là một bước tiến, và mỗi ngày kiên trì đều được ghi nhận.

Ứng dụng được thiết kế để chạy trên cả **iOS**, **Android** và **Web**, với backend REST API vững chắc hỗ trợ đa người dùng đồng thời. Từ người học sơ cấp đến người luyện thi nâng cao, EnglishLearn cung cấp lộ trình học có cấu trúc: từ flashcard ghi nhớ từ vựng, bài tập trắc nghiệm, điền từ, nối cặp — đến hệ thống tiến độ minh bạch phản ánh đúng sự nỗ lực của người học.

Đây là đồ án môn **Lập trình trên thiết bị di động** — nhóm 3 sinh viên Trường Đại học Điện lực (EPU), Khóa học kỳ 6 năm 3.

**Thành viên nhóm:**
| Thành viên | Vai trò |
|---|---|
| Bùi Minh Ngọc | Backend · Database · API Integration · Gamification Engine |
| Nguyễn Thùy Linh | Frontend UI · Auth Flow · Profile · Leaderboard · Theme |
| Nguyễn Nhật Tùng Anh | Quiz System · Admin Panel · English Pro · Routing |

---

## Tính năng nổi bật

| Tính năng | Mô tả |
|---|---|
| **Hệ thống bài học có cấu trúc** | Section → Unit → Exercise theo lộ trình tuyến tính, bài sau mở khi hoàn thành bài trước |
| **3 loại bài tập** | Trắc nghiệm (Multiple Choice), Điền từ (Fill Blank), Nối cặp (Matching) |
| **Flashcard + Phát âm** | Học từ vựng với thẻ lật, hỗ trợ Text-to-Speech đọc phát âm |
| **Gamification đầy đủ** | XP · Level · Streak · Gems · Hearts — đồng bộ thực, không phải trang trí |
| **Heart System thông minh** | Tim tự hồi sinh theo thời gian, dùng lazy refill (tính khi cần, không chạy cron job) |
| **XP Ledger chống trùng** | Ghi toàn bộ lịch sử XP với idempotency key — tránh cộng XP 2 lần khi retry |
| **Bảng xếp hạng toàn server** | Cạnh tranh với tất cả người dùng theo XP thực tế |
| **Thông báo trong ứng dụng** | Hệ thống notification nội bộ với đánh dấu đã đọc |
| **Lịch sử học tập** | Theo dõi toàn bộ quá trình học và bài thi đã tạo |
| **Tạo & lưu bài kiểm tra** | Người dùng có thể tạo đề thi riêng và đánh dấu bài thi yêu thích |
| **Gói Premium** | Hệ thống subscription với nhiều gói dịch vụ |
| **Admin Panel tích hợp** | Quản lý nội dung, người dùng, cài đặt hệ thống ngay trong app |
| **Dark / Light Theme** | Chuyển đổi giao diện sáng/tối, lưu lựa chọn vĩnh viễn |

---

## Công nghệ sử dụng

### Frontend

| Công nghệ | Phiên bản | Mục đích |
|---|---|---|
| React Native | 0.81.5 | Framework mobile đa nền tảng |
| Expo | ~54.0.33 | Nền tảng build, run và phân phối |
| Expo Router | ~6.0.23 | Routing dựa trên file system (tương tự Next.js) |
| React | 19.1.0 | Thư viện UI với React Compiler |
| React Navigation | ^7.x | Bottom tabs, native stack |
| React Native Reanimated | ~4.1.1 | Animation mượt |
| Expo Speech | ~14.0.8 | Text-to-Speech đọc flashcard |
| Expo Haptics | ~15.0.8 | Phản hồi rung cảm ứng |
| AsyncStorage | 2.2.0 | Lưu trữ cục bộ (token, theme) |
| Context API | — | Quản lý state toàn app (Auth, Theme) |

### Backend

| Công nghệ | Phiên bản | Mục đích |
|---|---|---|
| Node.js | 18+ | Runtime |
| Express | ^4.21.2 | REST API framework |
| Prisma | ^7.8.0 | ORM với type-safe queries |
| MariaDB / MySQL | 10.6+ / 8.0+ | Cơ sở dữ liệu quan hệ |
| bcrypt | ^6.0.0 | Mã hóa mật khẩu (12 salt rounds) |
| jsonwebtoken | ^9.0.3 | Xác thực JWT (7 ngày) |
| cors | ^2.8.5 | Cross-Origin Resource Sharing |
| dotenv | ^16.4.7 | Quản lý biến môi trường |

### Kiến trúc

```
Mobile App (Expo)  ──HTTP/REST──►  Express API  ──Prisma──►  MariaDB
     │                                  │
AsyncStorage                     JWT · bcrypt
(token, theme)               (auth · security)
```

---

## Cấu trúc project

```
App_EnglishLearn/
├── README.md
├── CHANGELOG.md
├── database_full.sql          ← Schema SQL đầy đủ
├── database_seed.sql          ← Dữ liệu mẫu
│
├── backend/                   ← Express REST API
│   ├── src/
│   │   ├── app.js             ← Khởi tạo Express, đăng ký routes
│   │   ├── server.js          ← Entry point, lắng nghe cổng
│   │   ├── controllers/       ← Xử lý request/response (9 files)
│   │   │   ├── authController.js
│   │   │   ├── userController.js
│   │   │   ├── contentController.js
│   │   │   ├── quizController.js
│   │   │   ├── adminController.js
│   │   │   ├── examController.js
│   │   │   ├── historyController.js
│   │   │   ├── notificationController.js
│   │   │   └── subscriptionController.js
│   │   ├── services/          ← Business logic (11 files)
│   │   │   ├── authService.js
│   │   │   ├── userService.js
│   │   │   ├── contentService.js
│   │   │   ├── quizService.js
│   │   │   ├── adminService.js
│   │   │   ├── examService.js
│   │   │   ├── historyService.js
│   │   │   ├── notificationService.js
│   │   │   ├── subscriptionService.js
│   │   │   ├── heartService.js
│   │   │   └── settingsService.js
│   │   ├── routes/            ← Định nghĩa endpoint (9 files)
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js   ← JWT + role guard
│   │   │   └── errorHandlers.js
│   │   ├── utils/
│   │   │   ├── apiError.js    ← Custom error class
│   │   │   └── userDto.js     ← Safe user serialization
│   │   └── lib/
│   │       └── prisma.js      ← Prisma Client singleton
│   ├── prisma/
│   │   ├── schema.prisma      ← 16 models database
│   │   ├── seed.js            ← Seed dữ liệu mẫu
│   │   └── migrations/
│   ├── package.json
│   └── .env                   ← (tự tạo, không commit)
│
└── frontend/                  ← Expo React Native App
    ├── app/                   ← Màn hình (mỗi file = một route)
    │   ├── _layout.jsx        ← Root layout, providers
    │   ├── index.jsx          ← Splash / entry point
    │   ├── login.jsx
    │   ├── register.jsx
    │   ├── quiz.jsx           ← Màn hình làm bài chính
    │   ├── flashcard.jsx      ← Học từ vựng dạng thẻ
    │   ├── notifications.jsx  ← Trung tâm thông báo
    │   ├── history.jsx        ← Lịch sử học tập
    │   ├── create-exam.jsx    ← Tạo bài kiểm tra
    │   ├── saved-exams.jsx    ← Bài thi đã lưu
    │   ├── payment.jsx        ← Trang thanh toán / gói Premium
    │   ├── profile-info.jsx   ← Thông tin cá nhân
    │   ├── change-password.jsx
    │   ├── app-settings.jsx   ← Cài đặt ứng dụng
    │   ├── language.jsx       ← Chọn ngôn ngữ
    │   ├── (tabs)/            ← Nhóm tab navigation chính
    │   │   ├── _layout.jsx    ← Header (streak, gems, hearts)
    │   │   ├── home.jsx       ← Danh sách bài học
    │   │   ├── leaderboard.jsx
    │   │   ├── english-pro.jsx ← Trang Premium
    │   │   ├── profile.jsx
    │   │   └── settings.jsx   ← Menu / cài đặt
    │   └── admin/             ← Khu vực quản trị
    │       ├── _layout.jsx
    │       ├── index.jsx      ← Admin dashboard
    │       ├── content-manager.jsx
    │       ├── system-settings.jsx
    │       └── activity-log.jsx
    └── src/
        ├── components/
        │   ├── quiz/          ← QuizHeader, ChoiceOption, FeedbackBar, ResultScreen
        │   ├── admin/         ← AdminContent, AdminUsers, AdminSettings
        │   ├── english-pro/   ← AllPlansView, TrialPlansView
        │   └── common/        ← KuromiButton, HapticTab
        ├── context/
        │   ├── AuthContext.jsx  ← Auth state, heart refill
        │   └── ThemeContext.jsx ← Dark/Light theme
        ├── services/
        │   ├── api.js         ← Tất cả HTTP calls (821+ dòng)
        │   └── auth.js        ← AsyncStorage auth helpers
        ├── constants/
        │   └── theme.js       ← Colors, GameConfig
        └── hooks/
            └── use-color-scheme.js
```

---

## Cài đặt và chạy

### Yêu cầu hệ thống

| Công cụ | Phiên bản tối thiểu |
|---|---|
| Node.js | 18+ |
| MariaDB / MySQL | 10.6+ / 8.0+ |
| npm | 9+ |
| Expo Go (điện thoại) | App Store / Google Play |

---

### 1. Cài đặt Backend

#### Bước 1 — Tạo database

```sql
CREATE DATABASE english_learning_app
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

#### Bước 2 — Cấu hình môi trường

```bash
cd backend
cp .env.example .env
```

Mở `.env` và điền thông tin thực:

```env
PORT=3000
DATABASE_URL="mysql://USER:PASSWORD@localhost:3306/english_learning_app"
JWT_SECRET="chuoi-bi-mat-dai-ngau-nhien-it-nhat-32-ky-tu"
JWT_EXPIRES_IN=7d
ADMIN_EMAIL="admin@test.com"
ADMIN_PASSWORD="123123"
```

> Thay `USER` và `PASSWORD` bằng thông tin đăng nhập MariaDB của bạn.

#### Bước 3 — Cài dependencies

```bash
npm install
```

#### Bước 4 — Chạy migration và generate Prisma Client

```bash
npm run prisma:generate
npm run prisma:migrate:dev
```

#### Bước 5 — Seed dữ liệu mẫu

```bash
node prisma/seed.js
```

Lệnh này sẽ tạo:
- Tài khoản admin: `admin@test.com` / `123123`
- Sections, units, flashcards và exercises mẫu
- Người dùng mẫu cho bảng xếp hạng

#### Bước 6 — Khởi động server

```bash
# Chế độ phát triển (tự reload khi sửa file)
npm run dev

# Chế độ production
npm start
```

Server chạy tại: `http://localhost:3000`

Kiểm tra: mở trình duyệt vào `http://localhost:3000/health` — nếu thấy `{"ok":true}` là thành công.

---

### 2. Cài đặt Frontend

#### Bước 1 — Cài dependencies

```bash
cd frontend
npm install
```

#### Bước 2 — Cấu hình URL API *(chỉ cần khi dùng điện thoại thật)*

Tạo file `frontend/.env.local`:

```env
EXPO_PUBLIC_API_URL=http://<IP_MÁY_TÍNH>:3000
```

Lấy IP máy tính:
- **Windows:** `ipconfig` → tìm dòng **IPv4 Address**
- **macOS/Linux:** `ifconfig` → tìm `inet` của interface đang dùng

> Máy tính và điện thoại phải cùng mạng WiFi.
> Khi dùng giả lập Android, bỏ qua bước này (tự dùng `10.0.2.2:3000`).

#### Bước 3 — Khởi động Expo

```bash
npm start
```

| Nền tảng | Cách mở |
|---|---|
| Điện thoại thật | Mở **Expo Go** → quét QR code trên terminal |
| Android Emulator | Nhấn `a` |
| iOS Simulator | Nhấn `i` |
| Trình duyệt web | Nhấn `w` |

---

### 3. Tài khoản mặc định

#### Tài khoản Admin

| Vai trò | Email | Mật khẩu |
|---|---|---|
| Admin | admin@test.com | 123123 |

Admin truy cập bảng quản trị từ **Profile → Admin Panel** trong app (hoặc route `/admin`).

#### Tài khoản User mẫu (seed sẵn cho leaderboard)

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

> Các tài khoản trên được tạo tự động khi chạy `node prisma/seed.js` — dùng để test bảng xếp hạng và các tính năng người dùng thông thường.

---

## Lệnh hữu ích

### Backend

```bash
# Xem trạng thái migration
npm run prisma:migrate:status

# Mở Prisma Studio — GUI quản lý database trực quan
npx prisma studio

# Seed lại dữ liệu (idempotent, chạy lại được nhiều lần)
node prisma/seed.js
```

### Frontend

```bash
npm run lint        # Kiểm tra lỗi ESLint
npm run android     # Chạy trên Android
npm run ios         # Chạy trên iOS
npm run web         # Chạy trên trình duyệt
```

---

## Xử lý lỗi thường gặp

| Lỗi | Nguyên nhân | Cách sửa |
|---|---|---|
| `Cannot connect to server` | Backend chưa chạy hoặc sai IP | Kiểm tra `npm run dev` đang chạy; kiểm tra `EXPO_PUBLIC_API_URL` |
| `P1001: Can't reach database` | MariaDB chưa khởi động | Khởi động MariaDB; kiểm tra `DATABASE_URL` trong `.env` |
| `P3005: Database schema is not empty` | Schema xung đột | Chạy `npm run prisma:migrate:dev` |
| `Table doesn't exist` | Chưa migrate | Chạy `npm run prisma:migrate:dev` |
| QR code không quét được | Khác mạng WiFi | Đảm bảo điện thoại và máy tính cùng WiFi |
| `Module not found` (frontend) | Thiếu dependency | Chạy `npm install` trong thư mục `frontend/` |

---

## Luồng hoạt động tổng quát

```
Mở app
  └── Có token? ──Yes──► Home (GET /api/sections)
       │
       No
       └── Login / Register
             └── Nhận JWT token → lưu AsyncStorage

Home
  └── Chọn Unit → Học
        ├── POST /api/units/:id/attempts/start
        ├── Làm từng exercise
        │     ├── Đúng → +XP, ghi XpLedger
        │     └── Sai  → -1 heart, ghi ExerciseAttempt
        └── POST /api/units/:id/complete
              ├── Tính điểm + thưởng XP
              ├── +10 gems (lần đầu hoàn thành)
              ├── Cập nhật streak & level
              └── ResultScreen

Admin (/admin)
  ├── Content Manager → CRUD Section / Unit / Exercise / Flashcard
  ├── System Settings → Cài đặt thời gian hồi tim
  └── Activity Log → Xem nhật ký hoạt động
```

---

*EnglishLearn — EPU · Khoa Công nghệ Thông tin · Năm 3 · Kỳ 6 · 2025–2026*
