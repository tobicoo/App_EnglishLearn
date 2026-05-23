# CHANGELOG — App EnglishLearn

---

## [2026-05-23] — Phiên làm việc hôm nay

### Tổng quan
Phiên làm việc tập trung vào **mở rộng tính năng** (thêm module mới) và **tái cấu trúc giao diện** (refactor admin panel và màn hình cài đặt). Tổng cộng 2 commit + các thay đổi chưa commit, ảnh hưởng 35 file.

---

### COMMIT 1 — `95cec83` · 00:56 +0700
> *"Chinh sua giao dien cua admin, sua route khi nhan back, sua giao dien resultscreen, them api cho viec tao bai tap"*

#### Backend

**`backend/src/services/adminService.js`** (+227 dòng)
- **Thêm:** CRUD đầy đủ cho **Exercise** — `createExercise`, `updateExercise`, `deleteExercise` với logic tạo option, xử lý `correctOptionId`, `matchingPairs`
- **Thêm:** `createUnit`, `updateUnit` xử lý đầy đủ các trường
- **Lý do:** Admin cần quản lý bài tập trực tiếp từ giao diện thay vì dùng Prisma Studio

**`backend/src/controllers/adminController.js`** (+57 dòng)
- **Thêm:** `createExercise`, `updateExercise`, `deleteExercise` — wrap service tương ứng
- **Lý do:** Bổ sung controller layer cho các service vừa thêm

**`backend/src/routes/adminRoutes.js`** (+6 dòng)
- **Thêm:** Routes cho exercise CRUD: `POST /api/admin/exercises`, `PATCH /api/admin/exercises/:id`, `DELETE /api/admin/exercises/:id`

**`backend/src/services/heartService.js`** (+6 dòng)
- **Sửa:** Điều chỉnh logic tính thời gian hồi tim

**`backend/src/services/quizService.js`** (+36 dòng)
- **Sửa:** Cập nhật logic tính XP, streak khi hoàn thành unit

**`backend/src/server.js`** (±12 dòng)
- **Sửa:** Nhỏ — điều chỉnh cấu hình server

#### Frontend

**`frontend/app/admin/index.jsx`** (-380/+175 dòng — tái cấu trúc lớn)
- **Lý do chỉnh:** File cũ nhét toàn bộ logic admin vào một file duy nhất (~800 dòng), khó bảo trì
- **Thay đổi:** Tách logic thành 3 component riêng biệt, `index.jsx` giờ chỉ còn là shell điều hướng

**`frontend/src/components/admin/AdminContent.jsx`** (tạo mới, 768 dòng)
- **Thêm:** Component quản lý nội dung hoàn chỉnh
- **Bao gồm:** CRUD Section, Unit, Exercise (trắc nghiệm, điền từ, nối cặp), Flashcard
- **Lý do:** Tách khỏi `index.jsx` để mỗi concern có file riêng, dễ test và mở rộng

**`frontend/src/components/admin/AdminSettings.jsx`** (tạo mới, 43 dòng)
- **Thêm:** Component cài đặt admin (heartbeat interval)

**`frontend/src/components/admin/AdminUsers.jsx`** (tạo mới, 127 dòng)
- **Thêm:** Component quản lý người dùng (list, reset password, reset progress)

**`frontend/src/components/quiz/ResultScreen.jsx`** (±30 dòng)
- **Sửa:** Cải thiện giao diện màn hình kết quả sau bài quiz
- **Lý do:** Màn hình cũ hiển thị thông tin thiếu, layout chưa đẹp

**`frontend/app/(tabs)/_layout.jsx`** (±8 dòng)
- **Sửa:** Sửa route khi nhấn nút back — trước đây back không đúng màn hình

**`frontend/app/index.jsx`** (±25 dòng)
- **Sửa:** Điều chỉnh logic redirect splash screen

**`frontend/app/login.jsx`** / **`register.jsx`** (±13/±12 dòng)
- **Sửa:** Nhỏ — điều chỉnh UX form

**`frontend/src/services/api.js`** (+84 dòng)
- **Thêm:** `createAdminExercise`, `updateAdminExercise`, `deleteAdminExercise`
- **Thêm:** `createAdminFlashcard`, `updateAdminFlashcard`, `deleteAdminFlashcard`
- **Thêm:** `createAdminUnit`

**`frontend/src/constants/theme.js`** (±2 dòng)
- **Sửa:** Nhỏ — điều chỉnh màu sắc

---

### THAY ĐỔI CHƯA COMMIT — Đang làm việc (2026-05-23)

#### Backend — Thêm 4 module mới hoàn toàn

**`backend/prisma/schema.prisma`** (+73 dòng)
- **Thêm model `Notification`** — thông báo trong ứng dụng với `type`, `icon`, `title`, `body`, `isRead`; index theo `(userId, isRead)` và `(userId, createdAt)` để query nhanh
- **Thêm model `Exam`** — bài kiểm tra do người dùng tạo với `category`, `difficulty`, `isPublic`, `isPremium`
- **Thêm model `ExamBookmark`** — đánh dấu bài thi yêu thích, unique `(userId, examId)` tránh bookmark trùng
- **Thêm model `UserSubscription`** — gói đăng ký Premium, unique per user, có `plan`, `status`, `expiresAt`
- **Thêm relations vào User:** `notifications`, `createdExams`, `examBookmarks`, `subscription`
- **Lý do:** 4 tính năng này (Thông báo, Thi, Subscription) được frontend yêu cầu nhưng backend chưa có schema

**`backend/src/app.js`** (+8 dòng)
- **Thêm:** Đăng ký 4 route group mới: `examRoutes`, `historyRoutes`, `notificationRoutes`, `subscriptionRoutes`
- **Lý do:** 4 module mới cần được mount vào Express app mới hoạt động

**Files mới tạo (controllers + routes + services):**
- `backend/src/controllers/examController.js` — listExams, createExam, myExams, savedExams, toggleBookmark
- `backend/src/controllers/historyController.js` — learningHistory, createdHistory
- `backend/src/controllers/notificationController.js` — list, markRead, markAllRead
- `backend/src/controllers/subscriptionController.js` — getSubscription, createSubscription
- `backend/src/routes/examRoutes.js`
- `backend/src/routes/historyRoutes.js`
- `backend/src/routes/notificationRoutes.js`
- `backend/src/routes/subscriptionRoutes.js`
- `backend/src/services/examService.js`
- `backend/src/services/historyService.js`
- `backend/src/services/notificationService.js`
- `backend/src/services/subscriptionService.js`

**`backend/src/controllers/adminController.js`** (+47 dòng thêm tiếp)
- **Thêm:** `createFlashcard`, `updateFlashcard`, `deleteFlashcard`
- **Thêm:** `stats` — tổng quan thống kê hệ thống
- **Thêm:** `activityLog` — nhật ký hoạt động admin
- **Lý do:** Admin cần quản lý flashcard và xem số liệu tổng quan

**`backend/src/routes/adminRoutes.js`** (+5 dòng thêm tiếp)
- **Thêm:** `GET /api/admin/stats`, `GET /api/admin/activity-log`, flashcard CRUD routes

**`backend/src/services/adminService.js`** (+200 dòng thêm tiếp)
- **Thêm:** `createFlashcard`, `updateFlashcard`, `deleteFlashcard`
- **Thêm:** `getStats` — đếm tổng users, sections, units, exercises
- **Thêm:** `getActivityLog` — lấy danh sách hoạt động gần đây

**`backend/src/services/userService.js`** (±5 dòng)
- **Sửa:** Điều chỉnh nhỏ leaderboard query

**`backend/src/controllers/userController.js`** (±2 dòng)
- **Sửa:** Nhỏ

#### Frontend — Màn hình mới + Refactor lớn

**Files màn hình mới tạo:**
- `frontend/app/notifications.jsx` — Trung tâm thông báo, phân tab (Tất cả / Chưa đọc), đánh dấu đọc
- `frontend/app/history.jsx` — Lịch sử học tập và bài thi đã tạo
- `frontend/app/create-exam.jsx` — Giao diện tạo bài kiểm tra mới
- `frontend/app/saved-exams.jsx` — Danh sách bài thi đã đánh dấu
- `frontend/app/payment.jsx` — Trang chọn gói Premium và thanh toán
- `frontend/app/profile-info.jsx` — Xem và chỉnh sửa thông tin cá nhân
- `frontend/app/change-password.jsx` — Đổi mật khẩu
- `frontend/app/app-settings.jsx` — Cài đặt ứng dụng
- `frontend/app/language.jsx` — Chọn ngôn ngữ giao diện
- `frontend/app/admin/_layout.jsx` — Layout wrapper cho khu vực admin
- `frontend/app/admin/content-manager.jsx` — Trang quản lý nội dung
- `frontend/app/admin/system-settings.jsx` — Cài đặt hệ thống
- `frontend/app/admin/activity-log.jsx` — Nhật ký hoạt động

**`frontend/app/(tabs)/settings.jsx`** (-300/+172 dòng — tái cấu trúc lớn)
- **Lý do chỉnh:** File cũ nhét toàn bộ logic Settings + thao tác vào một màn hình duy nhất, quá dài và khó bảo trì
- **Thay đổi:** Chuyển thành menu điều hướng — mỗi action lớn (đổi mật khẩu, thông tin cá nhân, cài đặt app) được tách ra màn hình riêng

**`frontend/app/(tabs)/_layout.jsx`** (+14 dòng thêm)
- **Sửa:** Thêm nút chuông thông báo vào header tab bar, điều hướng tới `/notifications`

**`frontend/app/(tabs)/leaderboard.jsx`** (±4 dòng)
- **Sửa:** Nhỏ

**`frontend/app/_layout.jsx`** (+9 dòng)
- **Sửa:** Thêm cấu hình stack screens cho các màn hình mới

**`frontend/app/admin/index.jsx`** (tiếp tục refactor)
- **Sửa:** Bổ sung tab Activity Log, điều chỉnh routing nội bộ

**`frontend/app/flashcard.jsx`** (±22 dòng)
- **Sửa:** Cải thiện giao diện và UX flashcard

**`frontend/src/components/admin/AdminContent.jsx`** (+167 dòng thêm)
- **Thêm:** Hỗ trợ quản lý Flashcard trong Admin Content

**`frontend/src/constants/flashcardData.js`** (XÓA)
- **Lý do:** Dữ liệu flashcard cứng không còn cần thiết — đã migrate hoàn toàn sang API động (`GET /api/flashcards`)

**`frontend/src/services/api.js`** (+241 dòng thêm)
- **Thêm:** Toàn bộ API calls cho 4 module mới:
  - Notifications: `getNotifications`, `markNotificationRead`, `markAllNotificationsRead`
  - Exams: `getPublicExams`, `createExam`, `getMyExams`, `getSavedExams`, `toggleExamBookmark`, `removeExamBookmark`
  - History: `getLearningHistory`, `getCreatedHistory`
  - Subscription: `getMySubscription`, `createSubscription`
  - Admin mới: `getAdminStats`, `getAdminActivityLog`

**`database_full.sql`** (mới)
- **Thêm:** Schema SQL đầy đủ export từ MariaDB

**`database_seed.sql`** (mới)
- **Thêm:** Dữ liệu mẫu để seed database

**`backend/prisma/migrations/20260523000000_add_notifications_exams_subscriptions/`** (mới)
- **Thêm:** Migration file cho 4 model mới

---

## [2026-05-22] — Commit trước

### COMMIT 2 — `77cd4dc`
> *"add backend, add admin route, chinh sua logic tinh xp, tim, streak va gem"*

- Thêm toàn bộ backend ban đầu (Express + Prisma)
- Thêm admin routes cơ bản
- Xây dựng hệ thống gamification: logic tính XP, heart, streak, gem trong `quizService.js`
- Thiết lập cấu trúc project đầy đủ

---

*Changelog được tạo tự động bởi Claude Code · 2026-05-23*
