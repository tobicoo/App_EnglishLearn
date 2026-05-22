# English — App Học Tiếng Anh

Ứng dụng học tiếng Anh bằng React Native (Expo) với backend Express, Prisma và MySQL.

## Chạy nhanh (Quick Start)

**1. Chuẩn bị**
- Cài Node.js + npm
- Chạy MySQL local, tạo database `english_learning_app`
- Tạo `backend/.env`:

```bash
PORT=3000
DATABASE_URL="mysql://USER:PASSWORD@localhost:3306/english_learning_app"
JWT_SECRET="replace-with-a-long-random-secret"
JWT_EXPIRES_IN=7d
```

**2. Backend**

```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate:dev -- --name init
npx prisma db seed
npm run dev
```

API chạy tại: `http://localhost:3000/health`

**3. Frontend**

```bash
cd frontend
npm install
npm start
```

> **Lưu ý kết nối điện thoại:** Nếu chạy app trên điện thoại qua Expo Go, `localhost` sẽ trỏ vào điện thoại. Cần đặt IP máy dev vào biến môi trường:
>
> ```bash
> # PowerShell
> $env:EXPO_PUBLIC_API_URL="http://192.168.1.x:3000"
> npm start
> ```

## Cấu trúc project

```
mobile_project/
├── backend/           Express API + Prisma/MySQL
│   ├── prisma/        Schema, migration, seed script
│   ├── src/           API routes/controllers/services
│   └── package.json   Backend scripts
├── frontend/          Expo / React Native app
│   ├── app/           Expo Router screens
│   ├── src/           Components, contexts, services
│   └── package.json   Frontend scripts
```