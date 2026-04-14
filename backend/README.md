# Backend — English App

> **Hiện tại**: Mock API sử dụng [json-server](https://github.com/typicode/json-server).  
> **Tương lai**: Sẽ thay bằng backend thực (Node.js/Express, NestJS, hoặc framework khác).

## Cài đặt

```bash
cd backend
npm install
```

## Chạy server

```bash
npm start
# Server chạy tại http://localhost:3000
```

## Endpoints (json-server tự tạo)

| Method | Endpoint              | Mô tả                  |
|--------|-----------------------|-------------------------|
| GET    | `/users`              | Danh sách users         |
| GET    | `/users/:id`          | Chi tiết user           |
| POST   | `/users`              | Tạo user mới            |
| PATCH  | `/users/:id`          | Cập nhật user           |
| GET    | `/sections`           | Danh sách sections      |
| GET    | `/units`              | Danh sách units         |
| GET    | `/flashcards`         | Tất cả flashcards       |
| GET    | `/flashcards?unitId=` | Flashcards theo unit    |
| GET    | `/quizzes?unitId=`    | Quizzes theo unit       |
| GET    | `/leaderboard`        | Bảng xếp hạng          |

## Cấu trúc dữ liệu

Xem file `db.json` để biết schema chi tiết.
