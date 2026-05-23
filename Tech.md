# Phân Tích Toàn Diện — App EnglishLearn

---

## 1. Công Nghệ Sử Dụng

**Frontend:**
- **React Native 0.81.5** — framework chính cho mobile
- **Expo ~54.0.33** — nền tảng build/run React Native
- **Expo Router ~6.0.23** — routing dựa trên file system (tương tự Next.js)
- **React 19.1.0** — phiên bản React mới nhất, bật React Compiler
- **React Native Reanimated ~4.1.1** — animation mượt
- **React Navigation** — điều hướng (bottom tabs, native stack)
- **Expo Speech** — text-to-speech (đọc flashcard)
- **AsyncStorage** — lưu token cục bộ trên thiết bị
- **Expo Constants, Expo Haptics, Expo Image** — tiện ích Expo

**Backend:**
- **Node.js + Express 4.21** — REST API server
- **Prisma 7.8** — ORM (Object Relational Mapper)
- **MariaDB/MySQL** — cơ sở dữ liệu quan hệ
- **bcrypt** — mã hóa mật khẩu
- **jsonwebtoken (JWT)** — xác thực người dùng (token 7 ngày)
- **dotenv** — quản lý biến môi trường
- **cors** — cho phép cross-origin request từ Expo

**Database:** MariaDB — 13 bảng, kết nối qua `@prisma/adapter-mariadb`

**Kiến trúc giao tiếp:** REST API — Frontend gọi HTTP đến Backend, không dùng GraphQL hay WebSocket.

---

## 2. Cấu Trúc Ứng Dụng

```
App_EnglishLearn/
├── frontend/                        ← Expo React Native app
│   ├── app/                         ← Màn hình (file = route)
│   │   ├── index.jsx                ← Splash / entry point
│   │   ├── login.jsx
│   │   ├── register.jsx
│   │   ├── quiz.jsx
│   │   ├── flashcard.jsx
│   │   ├── (tabs)/                  ← Nhóm tab navigation
│   │   │   ├── home.jsx
│   │   │   ├── leaderboard.jsx
│   │   │   ├── english-pro.jsx
│   │   │   ├── profile.jsx
│   │   │   └── settings.jsx
│   │   └── admin/                   ← Khu vực Admin riêng
│   │       └── index.jsx
│   └── src/
│       ├── components/
│       │   ├── admin/               ← AdminContent, AdminUsers, AdminSettings
│       │   ├── quiz/                ← QuizHeader, ChoiceOption, FeedbackBar, ResultScreen
│       │   ├── english-pro/         ← AllPlansView, TrialPlansView
│       │   └── common/              ← KuromiButton, HapticTab
│       ├── context/                 ← AuthContext, ThemeContext
│       ├── services/                ← api.js (toàn bộ HTTP calls), auth.js
│       └── constants/               ← theme.js, flashcardData.js
│
└── backend/                         ← Express REST API
    ├── src/
    │   ├── routes/                  ← authRoutes, adminRoutes, contentRoutes,
    │   │                               quizRoutes, userRoutes
    │   ├── controllers/             ← authController, adminController,
    │   │                               contentController, quizController, userController
    │   ├── services/                ← toàn bộ business logic
    │   ├── middleware/              ← authMiddleware (JWT + admin check), errorHandlers
    │   └── utils/                   ← apiError.js, userDto.js
    └── prisma/
        ├── schema.prisma            ← Định nghĩa 13 bảng DB
        └── seed.js                  ← Seed data mẫu
```

**Admin interface:** Có — nằm tại route `/admin` trong cùng app frontend (không phải app riêng). Phân biệt qua trường `role = ADMIN` trong DB, có route guard kiểm tra trước khi vào.

---

## 3. Chức Năng Người Dùng

| # | Màn hình / Tính năng | Mô tả |
|---|---|---|
| 1 | **Splash / Entry** | Kiểm tra auth token, tự động redirect |
| 2 | **Đăng ký** | Nhập tên, email, mật khẩu, tuổi |
| 3 | **Đăng nhập** | Email + mật khẩu, nhận JWT token |
| 4 | **Home** | Xem danh sách Section → Unit, tiến độ hoàn thành, trạng thái khóa/mở |
| 5 | **Quiz / Luyện tập** | Làm bài tập: trắc nghiệm, điền từ, nối từ |
| 6 | **Flashcard** | Học từ vựng dạng thẻ lật, có text-to-speech phát âm |
| 7 | **Leaderboard** | Bảng xếp hạng toàn người dùng theo XP |
| 8 | **English Pro** | Xem và so sánh các gói Premium |
| 9 | **Profile** | Xem thống kê: XP, streak, level, gems, hearts |
| 10 | **Settings** | Đổi tên/tuổi/avatar, đổi mật khẩu, đăng xuất, chuyển theme sáng/tối |
| 11 | **Màn hình kết quả** | ResultScreen sau khi hoàn thành bài — hiện điểm, XP nhận được |

**Hệ thống Gamification tích hợp:**
- **XP (kinh nghiệm):** Cộng dồn qua XpLedger, tăng level mỗi 200 XP
- **Hearts (tim):** Hao mòn khi trả lời sai, tự hồi sinh theo thời gian
- **Streak:** Theo dõi số ngày học liên tiếp
- **Gems:** Nhận 10 gems khi hoàn thành unit lần đầu
- **Level:** Tăng theo tổng XP tích lũy

---

## 4. Chức Năng Admin

Admin truy cập tại route `/admin` (trong cùng app), giao diện chia **3 tab:**

| Tab | Tính năng | Chi tiết |
|---|---|---|
| **Settings** | Cài đặt hồi tim | Chỉnh thời gian hồi tim (giây), mặc định 120 giây |
| **Content** | Quản lý nội dung | CRUD đầy đủ cho toàn bộ nội dung học |
| | | Tạo/sửa/xóa **Section** (tiêu đề, phụ đề, thứ tự, published/draft) |
| | | Tạo/sửa/xóa **Unit** (loại: LESSON / REVIEW / CHECKPOINT, XP reward) |
| | | Tạo/sửa/xóa **Exercise** (loại: MULTIPLE_CHOICE / FILL_BLANK / MATCHING) |
| **Users** | Quản lý người dùng | Xem danh sách toàn bộ user kèm stats |
| | | Reset mật khẩu người dùng |
| | | Reset tiến độ học của người dùng |

Tổng cộng **26+ API endpoints** dành riêng cho admin, tất cả yêu cầu JWT + role ADMIN.

---

## 5. Mô Tả Bài Toán — User Flow

```
[Người dùng mới]
        ↓
  Mở app → Splash kiểm tra AsyncStorage có token không
        ↓ (không có token)
  Màn hình Login / Register
        ↓
  ĐĂNG KÝ:
  Nhập tên, email, mật khẩu, tuổi
  → POST /api/auth/register
  Backend: hash password (bcrypt) → tạo user DB → trả JWT + user info
        ↓
  ĐĂNG NHẬP:
  → POST /api/auth/login
  Backend: tìm user, so sánh password → tạo JWT 7 ngày → trả về
  → Lưu JWT vào AsyncStorage → vào Home
        ↓
  HOME:
  → GET /api/sections (kèm JWT)
  Backend: trả sections + units + tiến độ của user đó
  Hiển thị: unit nào completed ✓ / in-progress / locked 🔒
        ↓
  NHẤN VÀO UNIT → BẮT ĐẦU HỌC:
  → GET /api/units/:id/exercises
  → POST /api/units/:id/attempts/start → tạo UnitAttempt trong DB
        ↓
  LÀM TỪNG EXERCISE:
  → POST /api/exercises/:id/attempts
  Backend: kiểm tra đáp án
    ├── Đúng → cộng XP, ghi XpLedger
    └── Sai  → trừ 1 heart, ghi ExerciseAttempt
        ↓
  HOÀN THÀNH TẤT CẢ EXERCISE:
  → POST /api/units/:id/complete
  Backend:
    ├── Tính tổng điểm, cộng XP thưởng
    ├── +10 gems nếu là lần đầu hoàn thành
    ├── Cập nhật streak (ngày học liên tiếp)
    ├── Cập nhật level nếu đủ XP
    └── Ghi UserUnitProgress = COMPLETED
        ↓
  ResultScreen — hiện điểm, XP, gems nhận được
        ↓
  [ADMIN] Truy cập /admin → Quản lý nội dung, users, cài đặt
```

**Điểm kỹ thuật đáng chú ý:** Heart refill dùng cơ chế **lazy computation** — không chạy background job, chỉ tính toán lúc user request đến, tiết kiệm tài nguyên server. XpLedger dùng **idempotency key** để tránh cộng XP 2 lần nếu request bị retry.

---

## 6. Phân Công Công Việc

| Thành viên | Phần đảm nhận | Chi tiết cụ thể |
|---|---|---|
| **Bùi Minh Ngọc** | Backend + Database + API Integration | Toàn bộ Express backend: 5 controllers, 7 services, 5 route files |
| | | Prisma schema 13 models (User, Section, Unit, Exercise, XpLedger...) |
| | | Hệ thống gamification: XP, hearts, streak, gems, level trong `quizService.js`, `heartService.js` |
| | | Auth system: JWT, bcrypt, authMiddleware |
| | | File `frontend/src/services/api.js` — 30+ API calls, error handling tiếng Việt |
| | | Seed data `prisma/seed.js` |
| **Nguyễn Thùy Linh** | UI màn hình người dùng | Màn hình Login, Register (form + validation + gọi API) |
| | | Home screen: danh sách Section/Unit, tiến độ, unit locking |
| | | Profile: hiển thị XP, streak, level, gems, hearts |
| | | Settings: đổi tên/avatar/password, dark/light theme |
| | | Leaderboard, Flashcard (+ expo-speech) |
| | | `AuthContext`, `ThemeContext` — quản lý state toàn app |
| | | `src/components/common/` — KuromiButton, HapticTab |
| **Nguyễn Nhật Tùng Anh** | Quiz System + Admin Panel + English Pro | `app/quiz.jsx` — logic làm bài, quản lý trạng thái |
| | | `components/quiz/` — QuizHeader, ChoiceOption, FeedbackBar, ResultScreen |
| | | `app/admin/index.jsx` — dashboard, route guard theo role |
| | | `components/admin/` — AdminContent (CRUD), AdminUsers, AdminSettings |
| | | `app/(tabs)/english-pro.jsx` + AllPlansView, TrialPlansView |
| | | Expo Router setup: `_layout.jsx`, cấu hình tab navigation |

---

## 7. Công Nghệ Thanh Toán

**Chưa có tích hợp thanh toán thật.**

Codebase có màn hình `english-pro.jsx` và 2 components hiển thị bảng giá:

| Gói | Giá | Ưu đãi |
|---|---|---|
| Personal 1 tháng | 129,000 VND | Kèm 7-day free trial |
| Personal 6 tháng | 449,000 VND | Tiết kiệm 40% |
| Personal 12 tháng | 689,000 VND | Tiết kiệm 60% |
| Family 12 tháng | 899,000 VND | Tối đa 6 thành viên, tiết kiệm 50% |

Tuy nhiên các nút CTA **chưa kết nối** đến bất kỳ payment gateway nào — không có Stripe, VNPay, MoMo, ZaloPay hay In-App Purchase của Apple/Google. Đây là **UI placeholder** sẵn sàng để tích hợp sau.

---

## 8. Tính Năng Nổi Bật

So với các app học tiếng Anh thông thường:

| Tính năng | Mô tả |
|---|---|
| **Gamification đầy đủ** | Hệ thống XP + Level + Streak + Gems + Hearts đồng bộ — không chỉ thêm badge cho có |
| **Heart System thông minh** | Tim tự hồi sinh theo thời gian, dùng lazy refill (tính lúc cần, không chạy background job) — tiết kiệm tài nguyên server đáng kể |
| **XP Ledger / Audit trail** | Ghi lại toàn bộ lịch sử XP với idempotency key — tránh cộng XP 2 lần nếu request bị retry |
| **3 loại bài tập** | MULTIPLE_CHOICE, FILL_BLANK, MATCHING — đa dạng hơn app chỉ có trắc nghiệm |
| **Unit locking** | Bài sau bị khóa đến khi hoàn thành bài trước — tạo lộ trình học tuyến tính có cấu trúc |
| **Admin Panel tích hợp** | Quản lý nội dung ngay trong app, không cần tool ngoài — phù hợp nhóm nhỏ, triển khai nhanh |
| **Leaderboard toàn server** | Cạnh tranh với toàn bộ người dùng theo XP thực |
| **Dark / Light theme** | Hỗ trợ theme tự động theo hệ thống hoặc tùy chỉnh tay |
| **Flashcard + TTS** | Học từ vựng kèm phát âm tự động qua expo-speech |
| **Kiến trúc sạch** | Backend tách Controller / Service / DTO rõ ràng — dễ mở rộng và bảo trì |
