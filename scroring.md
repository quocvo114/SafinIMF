# Hệ thống Scoring & Confidence - Báo cáo Sự cố Hạ tầng

## Tổng quan

Hệ thống tính độ tin cậy (confidence) của một báo cáo dựa trên **4 tiêu chí**:

| Tiêu chí             | Nguồn dữ liệu                             | Mục đích                                              |
| -------------------- | ----------------------------------------- | ----------------------------------------------------- |
| **Vị trí**           | GPS từ ảnh vs GPS báo cáo                 | Xác thực người dùng có đến đúng nơi báo cáo không     |
| **Nội dung**         | Từ khóa trong mô tả                       | Đánh giá mức độ liên quan đến sự cố hạ tầng           |
| **Thời gian**        | EXIF DateTime vs thời gian báo cáo        | Phát hiện báo cáo cũ, ảnh chụp từ lâu                 |
| **AI Vision (YOLO)** | Model YOLO phát hiện ổ gà, đường nứt, rác | Xác thực hình ảnh có chứa sự cố được nhận diện bởi AI |

> **⚠️ AI Vision là tiêu chí bắt buộc.** Nếu AI không thể phân tích ảnh (timeout, lỗi, không phát hiện sự cố nào trong 3 loại: ổ gà, đường nứt, rác), báo cáo sẽ **bị từ chối** — không chia lại trọng số.

---

## 1. Location Score (Vị trí)

### Công thức

```
score = max(0, 100 - (distance_km / 5) × 100)
```

### Bảng điểm

| Khoảng cách | Điểm |
| ----------- | ---- |
| 0 m         | 100  |
| 500 m       | 90   |
| 1 km        | 80   |
| 2 km        | 60   |
| 3 km        | 40   |
| 4 km        | 20   |
| 5 km        | 0    |

### Quy tắc

- **Có GPS EXIF + GPS báo cáo:** Tính khoảng cách Haversine → điểm
- **Thiếu GPS EXIF:** Không tính tiêu chí này
- **Báo cáo dạng text địa chỉ:** 0 điểm (trong tương lai sẽ hỗ trợ geocoding)

---

## 2. Content Score (Nội dung)

### Danh sách từ khóa

| Loại       | Điểm  | Từ khóa                                                                                                                                           |
| ---------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Mạnh**   | 2 pts | pothole, hole, hố, nứt, crack, gãy, broken, nguy hiểm, hazard, accident, tai nạn, damaged, hư hỏng                                                |
| **Thường** | 1 pt  | road, đường, asphalt, nhựa, pavement, vỉa hè, traffic, giao thông, repair, sửa chữa, unsafe, không an toàn, risk, rủi ro, deteriorated, suy thoái |

### Công thức

```
total_score = Σ(điểm từ khóa tìm thấy)
score = min(100, (total_score / 18) × 100)
```

_Giải thích: 18 là tổng điểm tối đa (9 từ khóa mạnh × 2 điểm)_

### Bảng điểm tham khảo

| Kịch bản                | Điểm |
| ----------------------- | ---- |
| 9 từ mạnh               | 100  |
| 6 từ mạnh               | 67   |
| 4 từ mạnh               | 44   |
| 3 từ mạnh + 2 từ thường | 50   |
| 2 từ mạnh               | 22   |
| 1 từ mạnh               | 11   |
| Không có từ nào         | 0    |

### Quy tắc

- Không phân biệt hoa/thường
- Tìm kiếm chính xác (word boundary)
- Từ khóa xuất hiện nhiều lần chỉ tính 1 lần
- Nội dung trống → 0 điểm

---

## 3. Time Score (Thời gian)

### Công thức

```
score = max(0, 100 - (hours_diff / 6) × 100)
```

### Bảng điểm

| Chênh lệch | Điểm |
| ---------- | ---- |
| 0 giờ      | 100  |
| 1.5 giờ    | 75   |
| 3 giờ      | 50   |
| 4.5 giờ    | 25   |
| 6+ giờ     | 0    |

### Quy tắc

- **Có DateTime EXIF:** Tính chênh lệch tuyệt đối với thời gian báo cáo
- **Thiếu DateTime:** Không tính tiêu chí này
- **Khác ngày:** Tính từ 24h trở lên (sẽ được 0 điểm)

---

## 4. AI Vision Score (YOLO) — Xác thực 3 loại sự cố

### Các loại sự cố AI nhận diện

| Loại sự cố    | Từ khóa nhận diện (YOLO classes) |
| ------------- | -------------------------------- |
| **Ổ gà**      | pothole, ổ gà, hố đường          |
| **Đường nứt** | crack, đường nứt, nứt gãy        |
| **Rác**       | trash, rác, waste, debris        |

### Công thức (Option 3: Amplify + Floor Minimum)

```
amplified_damage = damage_percentage × 5
floor_minimum = num_detections × 15
boosted = max(amplified_damage, floor_minimum)
score = min(100, boosted)
```

### Giải thích

- **Amplify 5x:** Vì damage_percentage từ YOLO thường rất nhỏ (0.7%), ta nhân với 5x để phóng đại
- **Floor Minimum:** Đảm bảo mỗi sự cố phát hiện được tối thiểu 15 điểm
- **Max:** Lấy giá trị cao hơn (damage amplified hay floor minimum)
- **Cap at 100:** Không vượt quá 100%

### Bảng điểm

| Số phát hiện | Damage % | Amplified | Floor | Score |
| ------------ | -------- | --------- | ----- | ----- |
| 0            | 0.7%     | 3.5%      | 0%    | 0     |
| 1            | 0.7%     | 3.5%      | 15%   | 15    |
| 1            | 5%       | 25%       | 15%   | 25    |
| 2            | 10%      | 50%       | 30%   | 50    |
| 2            | 50%      | 250%      | 30%   | 100   |

### Quy tắc

- **Không phát hiện sự cố nào (0):** Score = 0 → **Từ chối báo cáo**
- **Phát hiện ≥1 sự cố (bất kỳ loại nào):** Tối thiểu 15% × số phát hiện
- **Damage nhỏ nhưng có phát hiện:** Được boost nhờ floor minimum
- **Damage lớn:** Score capped at 100%
- **AI timeout / lỗi:** Từ chối báo cáo, thông báo "Hệ thống AI tạm thời không khả dụng"

---

## 5. Trọng số

### Trường hợp đầy đủ 4 tiêu chí

| Tiêu chí         | Trọng số |
| ---------------- | -------- |
| Location         | 28%      |
| Content          | 28%      |
| Time             | 23%      |
| AI Vision (YOLO) | 21%      |

### Trường hợp thiếu tiêu chí KHÔNG bắt buộc

| Tình huống        | Location | Content | Time | AI Vision |
| ----------------- | -------- | ------- | ---- | --------- |
| Đầy đủ 4 tiêu chí | 28%      | 28%     | 23%  | 21%       |
| Thiếu Time        | 35%      | 35%     | -    | 30%       |
| Thiếu Location    | -        | 40%     | 30%  | 30%       |
| Chỉ Content       | -        | 50%     | 50%  | -         |

### Quy tắc

- **AI Vision là BẮT BUỘC** — không có kết quả AI → **từ chối báo cáo**, không chia lại trọng số
- Location và Time là tiêu chí KHÔNG bắt buộc — thiếu sẽ chia lại trọng số cho các tiêu chí còn lại
- Nếu chỉ còn 1 tiêu chí (không tính AI): Tính confidence chỉ dựa trên tiêu chí đó (100%)

---

## 6. Công thức tổng hợp

```
confidence = Σ(score_i × weight_i)
confidence = round(confidence)
```

---

## 7. Đánh giá mức độ tin cậy

| Khoảng điểm | Mức độ             | Màu | Hành động                 |
| ----------- | ------------------ | --- | ------------------------- |
| 90-100%     | Rất tin cậy        | 🟢  | Tự động duyệt             |
| 80-89%      | Tin cậy cao        | 🟢  | Kiểm tra nhanh            |
| 70-79%      | Tin cậy trung bình | 🟡  | Xác minh thủ công         |
| 50-69%      | Tin cậy thấp       | 🟠  | Yêu cầu bổ sung thông tin |
| < 50%       | Không đủ tin cậy   | 🔴  | Từ chối                   |

---

## 8. Ví dụ minh họa

### Input

```
Báo cáo:
- Vị trí: 10.776234, 106.710049
- Nội dung: "Hố đường lớn trên Nguyễn Huệ, nứt gãy nguy hiểm"
- Thời gian: 2024-03-23 10:30

EXIF ảnh:
- GPS: 10.776300, 106.710100 (cách 100m)
- DateTime: 2024-03-23 08:45 (cách 1.75 giờ)

AI Vision:
- Phát hiện: 1 ổ gà, damage 0.7%
```

### Tính toán

| Tiêu chí       | Điểm | Trọng số | Thành phần     |
| -------------- | ---- | -------- | -------------- |
| Location       | 90   | 28%      | 25.2           |
| Content        | 100  | 28%      | 28.0           |
| Time           | 71   | 23%      | 16.3           |
| AI Vision      | 15   | 21%      | 3.2            |
| **Confidence** |      |          | **72.7 → 73%** |

### Kết luận

**73% - Tin cậy trung bình** 🟡 → Xác minh thủ công

---

## 9. Các tham số có thể điều chỉnh

| Tham số              | Giá trị mặc định | Mục đích                                   |
| -------------------- | ---------------- | ------------------------------------------ |
| maxDistance          | 5 km             | Ngưỡng khoảng cách tối đa                  |
| maxHoursDiff         | 6 giờ            | Ngưỡng thời gian tối đa                    |
| maxKeywordScore      | 18 điểm          | Tổng điểm tối đa từ khóa                   |
| weights              | 28/28/23/21      | Trọng số (Location/Content/Time/AI Vision) |
| strongKeywordWeight  | 2 pts            | Điểm cho từ khóa mạnh                      |
| regularKeywordWeight | 1 pt             | Điểm cho từ khóa thường                    |
| yoloAmplify          | 5x               | Hệ số nhân damage_percentage               |
| yoloFloorMinimum     | 15%              | Điểm tối thiểu mỗi sự cố phát hiện         |
| yoloTimeout          | 30s              | Timeout cho YOLO API call                  |
| yoloRetryCount       | 3                | Số lần retry nếu YOLO API lỗi              |
| yoloClasses          | 3                | Số lớp sự cố: ổ gà, đường nứt, rác         |

---

**Ghi chú:** Hệ thống này tích hợp 4 tiêu chí để tính độ tin cậy: vị trí GPS, nội dung mô tả, thời gian EXIF, và xác thực AI (YOLO phát hiện 3 loại sự cố: ổ gà, đường nứt, rác). **AI Vision là tiêu chí bắt buộc — không có kết quả AI = từ chối báo cáo.**
