🚀 Urban Infrastructure Incident Management System

📌 Overview

Hệ thống Quản lý và xử lý báo cáo cơ sở hạ tầng đô thị là một nền tảng thuộc lĩnh vực Smart City, giúp kết nối trực tiếp giữa người dân và cơ quan quản lý trong việc phát hiện, báo cáo và xử lý các sự cố hạ tầng công cộng.

Người dân có thể dễ dàng:

Chụp ảnh sự cố (ổ gà, đèn hỏng, rác thải, ngập nước,...)

Gửi báo cáo kèm:

Mô tả chi tiết

Vị trí (GPS / bản đồ)

Hình ảnh thực tế

Hệ thống cho phép phía quản lý:

Tiếp nhận và quản lý báo cáo

Phân loại sự cố (thủ công hoặc AI)

Phân công đội xử lý

Theo dõi tiến độ xử lý theo thời gian thực

Phản hồi kết quả đến người dân

👉 Mục tiêu:

Giảm thời gian xử lý sự cố từ 7–30 ngày → 1–7 ngày

Tăng độ chính xác phân loại lên ~95%

Minh bạch toàn bộ quy trình xử lý

🏗️ System Architecture

Hệ thống gồm 3 thành phần chính:

1. 📱 Mobile App (Người dân)

Tạo báo cáo sự cố

Upload hình ảnh + vị trí

Theo dõi trạng thái xử lý

2. 💻 Web Dashboard (Quản lý)

Quản lý toàn bộ báo cáo

Phân công xử lý

Xem thống kê & hot spots

Bản đồ tương tác

3. ⚙️ Backend API

Xử lý logic nghiệp vụ

Lưu trữ dữ liệu

Xác thực người dùng

Phân loại sự cố bằng AI

🛠️ Tech Stack
🔹 Frontend

ReactJS

HTML, CSS (Tailwind CSS)

JavaScript (ES6+)

🔹 Backend

Node.js

Express.js

RESTful API

🔹 Database

MongoDB (MongoDB Atlas)

Mongoose ORM

🔹 Authentication

JWT (JSON Web Token)

Cookie-based auth

🔹 AI (đang phát triển)

Image Classification

Xác thực hình ảnh sự cố

Phân loại tự động (đường, điện, nước, môi trường,...)

⚙️ Core Features
👤 User Features (Người dân)

Đăng ký / Đăng nhập

Tạo báo cáo sự cố

Upload hình ảnh

Gửi vị trí GPS

Xem danh sách báo cáo đã gửi

Theo dõi trạng thái xử lý

🛠️ Admin / Manager Features

Xem danh sách báo cáo

Lọc & tìm kiếm báo cáo

Phân loại sự cố

Phân công đội xử lý

Cập nhật trạng thái:

Pending

Processing

Resolved

Upload ảnh sau khi xử lý

Quản lý người dùng

Quản lý danh mục sự cố

📊 Analytics

Thống kê số lượng báo cáo

Xác định khu vực “hot spots”

Hiển thị trên bản đồ

🔄 Real-time (định hướng)

Cập nhật trạng thái xử lý theo thời gian thực

Thông báo cho người dân

🤖 AI Integration (In Progress)

Hệ thống đang được mở rộng với AI nhằm:

Xác thực hình ảnh người dùng upload

Phát hiện ảnh giả / không hợp lệ

Tự động phân loại sự cố

👉 Benefit:

Giảm tải cho admin

Tăng độ chính xác

Tăng tốc xử lý

🗂️ Project Structure (Backend)
backend/
│── src/
│ ├── config/
│ ├── controllers/
│ ├── middleware/
│ ├── models/
│ ├── routes/
│ └── server.js
🔐 Authentication Flow

User đăng ký → tạo ID custom (TK1, TK2,...)

Login → cấp JWT

Middleware kiểm tra quyền:

User

Admin

🧪 Testing & QA

Dự án áp dụng:

Test Case cho từng module (Login, Report,...)

Kiểm thử:

Functional Testing

UI Testing

Retesting

Quy trình theo từng Sprint

🔄 Development Process

Áp dụng Scrum:

Sprint 1: Core features (Auth, Report)

Sprint 2: Management & Analytics

Final: Fix + Release

🎯 Future Improvements

Hoàn thiện AI phân loại ảnh

Tích hợp WebSocket (real-time)

Tối ưu UX/UI dashboard

Thêm notification system

Tích hợp bản đồ nâng cao (heatmap)
