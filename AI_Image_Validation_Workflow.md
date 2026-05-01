# Luồng Xác Thực Hình Ảnh Bằng AI

## 1. Tổng quan

Hệ thống tích hợp mô hình AI **YOLO v11** đã được train để tự động xác thực hình ảnh trong báo cáo sự cố hạ tầng đô thị. Mục tiêu là lọc các báo cáo giả mạo, không liên quan hoặc chất lượng thấp trước khi chuyển đến quản lý khu vực.

> **Lưu ý:** Model AI đã được train và đang chạy ổn định. **Không được sửa đổi hoặc train lại model.**

## 2. Công nghệ sử dụng

| Thành phần           | Chi tiết                                                                                              |
| -------------------- | ----------------------------------------------------------------------------------------------------- |
| Model AI             | YOLO v11 (`best.pt`) – đã train, chạy trong `Urban_Issues/app.py`                                     |
| AI Service Framework | Flask + flask-cors + Ultralytics                                                                      |
| Tích hợp             | Backend NodeJS/ExpressJS gọi Flask API qua HTTP                                                       |
| Ngôn ngữ AI          | Python (phía AI service)                                                                              |
| Ngôn ngữ Backend     | JavaScript (NodeJS + ExpressJS)                                                                       |
| Truyền ảnh           | Frontend → Backend dưới dạng **base64 Data URL**, Backend decode → gửi multipart/form-data sang Flask |

---

## 3. Vị trí tích hợp trong luồng nghiệp vụ

Luồng AI được tích hợp tại **User Story 4 / PB05 – Tạo và gửi báo cáo sự cố**, ngay sau khi người dùng điền thông tin và tải ảnh lên, trước khi báo cáo được lưu chính thức vào hệ thống.

---

## 4. Luồng xử lý chi tiết

### 4.1. Sơ đồ luồng

```
Người dân tạo báo cáo
        │
        ▼
┌─────────────────────────┐
│ Điền thông tin báo cáo   │
│ (tiêu đề, mô tả ≥10 ký  │
│  tự, vị trí Đà Nẵng,    │
│  loại sự cố...)          │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ Tải lên hình ảnh         │
│ (1–3 ảnh, JPG/PNG, ≤5MB)│
│ → mã hóa base64 DataURL  │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ Kiểm tra hợp lệ dữ liệu  │
│ (Backend validateCreate- │
│  ReportPayload)          │
│  • title, type, userId   │
│  • description 10–100 ký │
│  • 1–3 ảnh, JPG/PNG ≤5MB │
│  • tọa độ trong Đà Nẵng  │
└────────┬────────────────┘
         │ Hợp lệ
         ▼
┌─────────────────────────────────────────┐
│  🤖 AI XÁC THỰC HÌNH ẢNH                │
│  (kiểm tra tất cả ảnh trong images[])    │
│                                         │
│  1. Backend decode base64 → buffer      │
│  2. Trích xuất EXIF metadata (GPS/Time) │
│  3. Gửi multipart/form-data → Flask API │
│     (thử lần lượt các URL candidate)   │
│  4. Flask chạy YOLO v11 (conf ≥ 0.25)  │
│  5. Trả về: detections[], total_objects │
└────────┬────────────────────────────────┘
         │
    ┌────┴────────────────────────────┐
    ▼                                 ▼
✅ AI CHẤP NHẬN                  ❌ AI TỪ CHỐI
(aiVerified=true                  (aiVerified=false,
 aiTotalObjects > 0               hoặc 0 detection,
 aiLabel ≠ "No detection"         hoặc label không hợp lệ,
 aiLabel ≠ "Unknown")             hoặc API timeout/lỗi)
    │                                 │
    ▼                                 ▼
Lưu báo cáo vào DB            Trả lỗi HTTP 422
Trạng thái: "Đang Chờ"        "AI_VALIDATION_FAILED"
+ lưu aiPercent,              → Thông báo yêu cầu
  aiLabel, aiSource              chụp lại ảnh đúng
```

### 4.2. Các bước xử lý chi tiết

| Bước | Mô tả                                                                                                             | Kết quả                                                        |
| ---- | ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| 1    | Người dân chọn ảnh (1–3 ảnh, JPG/PNG, ≤5MB) và điền thông tin báo cáo                                             | Dữ liệu sẵn sàng                                               |
| 2    | Nhấn **Gửi** → Frontend gửi POST lên backend (ảnh dưới dạng base64 Data URL)                                      | Request gửi lên server                                         |
| 3    | Backend chạy `validateCreateReportPayload()` kiểm tra tất cả trường bắt buộc, định dạng ảnh, tọa độ trong Đà Nẵng | Nếu sai → HTTP 400 báo lỗi cụ thể                              |
| 4    | Backend decode từng ảnh, trích xuất EXIF (GPS/DateTime nếu có), sau đó gửi AI                                     | Có metadata phục vụ scoring/xác minh                           |
| 5    | Backend gọi `verifyAllImages()` → thử lần lượt các URL candidate: port 5001 → 5000 → ...                          | Timeout mỗi URL: 10 giây (env `MODEL_API_TIMEOUT_MS`)          |
| 6    | Flask AI service chạy YOLO v11 với `conf=0.25`, phân tích ảnh, trả về `detections[]` + `total_objects`            | JSON response                                                  |
| 7    | Backend đánh giá kết quả AI cho từng ảnh (`isAiAccepted`)                                                         | Xem tiêu chí bên dưới                                          |
| 8a   | **AI chấp nhận** → Tạo báo cáo, lưu DB, trạng thái **"Đang Chờ"**                                                 | HTTP 201, trả data báo cáo                                     |
| 8b   | **AI từ chối** → Không lưu báo cáo                                                                                | HTTP 422, `code: "AI_VALIDATION_FAILED"`, thông báo lỗi cụ thể |

---

## 5. Tiêu chí ảnh hợp lệ (hàm `isAiAccepted`)

> ⚠️ **Khác với tài liệu cũ**: Hệ thống **KHÔNG dùng ngưỡng % confidence** để chấp nhận/từ chối. Thay vào đó dùng **logic detection-based**.

| Tiêu chí          | Yêu cầu                                  | Ghi chú                                      |
| ----------------- | ---------------------------------------- | -------------------------------------------- |
| `aiVerified`      | Phải là `true`                           | False khi API lỗi hoặc timeout               |
| `aiTotalObjects`  | Phải > 0                                 | Phải phát hiện ít nhất 1 đối tượng           |
| `aiLabel`         | Khác `""`, `"No detection"`, `"Unknown"` | Nhãn của detection có confidence cao nhất    |
| Định dạng ảnh     | JPG / PNG                                | Kiểm tra từ MIME type base64                 |
| Dung lượng        | ≤ 5MB / ảnh                              | Kiểm tra trong `validateCreateReportPayload` |
| Số lượng ảnh      | 1 đến 3 ảnh                              | Bắt buộc                                     |
| Ảnh được AI check | **Tất cả ảnh** trong `images[]`          | Từ chối nếu có bất kỳ ảnh nào không đạt      |

**Lưu ý về `aiPercent`:** Giá trị này được lưu vào DB để tham khảo (confidence cao nhất trong tất cả detection), nhưng **không được dùng làm điều kiện chấp nhận/từ chối** trong logic hiện tại.

---

## 6. Các loại sự cố AI nhận diện

Model YOLO v11 được train nhận diện **10 class**:

| STT | Tên class (CLASS_NAMES) | Ghi chú          |
| --- | ----------------------- | ---------------- |
| 0   | Road cracks             | Đường nứt        |
| 1   | Pothole                 | Ổ gà             |
| 2   | Illegal Parking         | Đậu xe trái phép |
| 3   | Broken Road Sign        | Biển báo hư      |
| 4   | Fallen trees            | Cây đổ           |
| 5   | Littering               | Rác thải         |

> ⚠️ **Khác tài liệu cũ**: Model nhận diện **10 class** (không phải 3 class như ghi trước). Đây là thực tế từ code `app.py`.

---

## 7. Luồng xử lý lỗi

| Tình huống                | Mã lỗi                           | Thông báo trả về                                       |
| ------------------------- | -------------------------------- | ------------------------------------------------------ |
| Dữ liệu form không hợp lệ | HTTP 400 `VALIDATION_ERROR`      | Mô tả lỗi cụ thể (thiếu trường, sai format...)         |
| Loại sự cố không tồn tại  | HTTP 400 `INVALID_INCIDENT_TYPE` | "Loại sự cố không hợp lệ hoặc đã bị xóa"               |
| AI API timeout (>10s)     | HTTP 422 `AI_VALIDATION_FAILED`  | "Không gọi được AI model" (sau khi thử hết tất cả URL) |
| AI phát hiện 0 đối tượng  | HTTP 422 `AI_VALIDATION_FAILED`  | "Ảnh không liên quan đến sự cố hạ tầng..."             |
| Không có ảnh truyền vào   | HTTP 422 `AI_VALIDATION_FAILED`  | "Không có ảnh để xác thực"                             |
| Lỗi server nội bộ         | HTTP 500                         | `error.message`                                        |

---

## 8. Phân quyền liên quan đến AI

| Vai trò         | Tương tác với AI                                                                |
| --------------- | ------------------------------------------------------------------------------- |
| Công dân        | Ảnh báo cáo được AI tự động kiểm tra khi gửi                                    |
| Quản lý khu vực | Nhận báo cáo đã qua AI duyệt; xem được `aiPercent`, `aiLabel` lưu trong báo cáo |
| Đội xử lý       | Nhận báo cáo đã qua AI duyệt, không can thiệp trực tiếp                         |

---

## 9. Ghi chú kỹ thuật

- Model YOLO v11 đã được **train sẵn và đang chạy** → **KHÔNG được sửa đổi, train lại hoặc đụng vào model** (`best.pt`)
- AI service chạy bằng Flask trên `Urban_Issues/app.py`, port mặc định **5000**; backend thử port **5001 trước** (nếu có `MODEL_API_URL` trong `.env`)
- Cấu hình URL AI qua biến môi trường: `MODEL_API_URL` (trong `.env` của backend)
- Timeout mỗi lần gọi AI: `MODEL_API_TIMEOUT_MS` (mặc định 10,000ms = **10 giây**)
- Phản hồi AI bao gồm: `detections[]`, mỗi detection có `class_id`, `class_name`, `confidence`, `bbox`
- Backend lưu vào báo cáo: `aiPercent` (%), `aiVerified` (bool), `aiLabel` (tên nhãn), `aiTotalObjects`, `aiSource` (URL đã gọi thành công)
- Backend trích xuất EXIF metadata (GPS/DateTime) từ ảnh và lưu vào báo cáo để phục vụ scoring/xác minh thủ công
- Tất cả ảnh trong `images[]` đều được gửi qua AI để xác thực
- YOLO chạy với ngưỡng confidence tối thiểu `conf=0.25` (lọc detection yếu ở phía Flask)

---

## 10. Điểm không khớp với tài liệu cũ & Đề xuất cải thiện

| Vấn đề                   | Thực tế hiện tại                        | Đề xuất                                                                                |
| ------------------------ | --------------------------------------- | -------------------------------------------------------------------------------------- |
| **Số class AI**          | 10 class (không phải 3)                 | Cập nhật tài liệu ✅ (đã sửa)                                                          |
| **Tiêu chí chấp nhận**   | Detection-based (không dùng ngưỡng 60%) | Cân nhắc thêm ngưỡng `aiPercent > 60%` vào `isAiAccepted()` nếu muốn đúng với spec gốc |
| **Số ảnh được AI check** | Tất cả `images[]`                       | Đã triển khai: từ chối nếu có bất kỳ ảnh nào AI không nhận diện được                   |
| **Ảnh đen trắng**        | Chưa được implement                     | Nếu cần, thêm bước preprocessing ảnh trước khi gửi sang Flask                          |
| **Log AI**               | Chưa có log riêng cho AI                | Nên thêm logging vào `aiVerification.service.js` để dễ debug                           |
