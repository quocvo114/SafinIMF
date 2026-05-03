# Hướng dẫn chạy Flask + YOLO Model 

## 1. Yêu cầu trước khi chạy

* Đã cài Python **3.10+**
* Đã clone project về máy
* Có file model: `best.pt`

---

## 2. Di chuyển vào thư mục project

```bash
cd Urban_Issues
```

---

## 3. Tạo môi trường ảo (chỉ làm lần đầu)

```bash
python -m venv venv
```

---

## 4. Kích hoạt môi trường ảo (QUAN TRỌNG)

### Windows:

```bash
venv\Scripts\activate
```

Nếu thành công sẽ thấy:

```bash
(venv) D:\...
```

Nếu KHÔNG activate → sẽ lỗi:

```
No module named flask
```

---

## 5. Cài thư viện

```bash
pip install -r requirements.txt
```

Nếu chưa có file requirements:

```bash
pip install flask flask-cors ultralytics
```

---

## 6. Kiểm tra model

Đảm bảo file tồn tại:

```
Urban_Issues/
 ├── app.py
 ├── best.pt   ✅ bắt buộc
```

---

## 7. Chạy server Flask

```bash
python -m flask --app app run --host 0.0.0.0 --port 5001
```

---

## 8. Kết quả

Nếu chạy thành công:

```
Running on http://127.0.0.1:5001
```

---

## 9. Các lỗi thường gặp

### ❌ No module named flask

👉 Quên activate venv hoặc chưa cài thư viện => Quay lại B4 và B5

---

### ❌ No module named ultralytics

👉 Chạy:

```bash
pip install ultralytics
```

---

### ❌ FileNotFoundError: best.pt

👉 Thiếu file model → copy vào project

---

### ❌ View function mapping is overwriting

👉 Trùng tên function route trong Flask

---

## 10. Lưu ý quan trọng

* Luôn chạy trong `(venv)`
* Không dùng Python global
* Nên dùng Python 3.10 để tránh lỗi YOLO

---

## 11. Quy trình chuẩn

```bash
cd Urban_Issues
venv\Scripts\activate
pip install -r requirements.txt
python -m flask --app app run
```

---

## ✅ Kết luận

👉 Lỗi phổ biến nhất:

* Quên **activate venv**
* Thiếu **model**
* Sai **Python version**

👉 Chỉ cần làm đúng 3 bước:

1. Activate venv
2. Cài thư viện
3. Chạy Flask

→ là chạy được project
