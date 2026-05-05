# 📋 DANH SÁCH FILE CẦN REFACTOR - CHI TIẾT

> **Liệt kê 50 files cần refactor. Không sửa code. Để nhóm tự sửa.**

---

## 🔴 CRITICAL (Sửa ngay - 30 min)

### 1. `backend/src/sockets/soketServer.js`
- **Vấn đề**: Sai chính tả (typo) - "soket" phải là "socket"
- **Loại**: Naming error
- **Lý do**: 
  - Typo gây confusion
  - Import/require sai: `require('./soketServer')` khó tìm
  - Không professional
- **Hành động**: Đổi tên file → `socketServer.js`
- **Impact**: Cần update tất cả `require('./soketServer')`
- **Ưu tiên**: 🔴 **CRITICAL** - Fix ngay vì là lỗi chính tả

---

## 🟠 HIGH PRIORITY (Tuần này - 2-3 giờ)

### Backend - Controllers (Items 2-6)
**Vấn đề chung**: File naming không nhất quán - dùng `*Controller.js` thay vì `*.controller.js`
**Lý do**: Dot notation dễ tìm pattern, follow standard naming convention

| # | File | Hành động | Ví dụ |
|---|------|----------|-------|
| 2 | `areaController.js` | → `area.controller.js` | `require('./area.controller')` |
| 3 | `geocodeController.js` | → `geocode.controller.js` | `require('./geocode.controller')` |
| 4 | `incidentTypeController.js` | → `incidentType.controller.js` | `require('./incidentType.controller')` |
| 5 | `maintenanceTeamController.js` | → `maintenanceTeam.controller.js` | `require('./maintenanceTeam.controller')` |
| 6 | `reportController.js` | → `report.controller.js` | `require('./report.controller')` |

**Impact**: Cập nhật imports tất cả route files + app.js

---

### Backend - Routes (Items 7-11)
**Vấn đề chung**: File naming không nhất quán - dùng `*Routes.js` thay vì `*.routes.js`
**Lý do**: Consistency với controllers + easier grep pattern

| # | File | Hành động | Impact |
|---|------|----------|--------|
| 7 | `areaRoutes.js` | → `area.routes.js` | Update app.js imports |
| 8 | `geocodeRoutes.js` | → `geocode.routes.js` | Update app.js imports |
| 9 | `incidentTypeRoutes.js` | → `incidentType.routes.js` | Update app.js imports |
| 10 | `maintenanceTeamRoutes.js` | → `maintenanceTeam.routes.js` | Update app.js imports |
| 11 | `reportRoutes.js` | → `report.routes.js` | Update app.js imports |

---

### Backend - Models (Items 12-16)
**Vấn đề chung**: File names viết hoa (PascalCase), nhưng JavaScript files nên viết thường
**Lý do**: 
- Convention: File names = lowercase, Class names = PascalCase
- Tránh OS case-sensitive issues trên Linux/Mac

| # | File | Hành động | Ví dụ import |
|---|------|----------|-------------|
| 12 | `AiValidationLog.js` | → `aiValidationLog.js` | `const AiLog = require('./aiValidationLog')` |
| 13 | `Area.js` | → `area.js` | `const Area = require('./area')` |
| 14 | `IncidentType.js` | → `incidentType.js` | `const IncidentType = require('./incidentType')` |
| 15 | `MaintenanceTeam.js` | → `maintenanceTeam.js` | `const Team = require('./maintenanceTeam')` |
| 16 | `Report.js` | → `report.js` | `const Report = require('./report')` |

**Impact**: Update imports trong controllers, repositories, services

---

### Backend - Server Setup (Item 17)
**File**: `backend/server.js`
**Vấn đề**: Chứa cả app initialization + server start logic
**Lý do**:
- Express app ≠ HTTP server (phải tách)
- Dễ test hơn (có thể mock app)
- Professional standard

**Hành động**:
```
Tách thành:
- src/app.js (chỉ app config)
- src/index.js hoặc server.js (chỉ start server)
```

**Impact**: Update package.json main entry point

---

### Frontend - Pages (Items 18-19)
**File 18**: `frontend/src/pages/TestPhoneAuth.jsx`
- **Vấn đề**: Test file đặt ở pages folder (sai chỗ)
- **Hành động**: Chuyển → `frontend/src/test/phoneAuth.test.jsx`
- **Lý do**: Test files nên ở test folder, follow `.test.jsx` convention
- **Impact**: Update imports nếu có file dùng

**File 19**: `frontend/src/pages/ThongKe.jsx`
- **Vấn đề**: Tên Tiếng Việt (ThongKe = Thống Kê)
- **Hành động**: Đổi → `Statistics.jsx` hoặc `Analytics.jsx`
- **Lý do**: Codebase nên dùng English (dễ collaborate, professional)
- **Impact**: Update router, menu labels

---

### Urban_Issues (Item 20)
**Files**: `Urban_Issues/app.py` + `Urban_Issues/streamlit_app.py`
- **Vấn đề**: 2 entry point - confusing, không biết dùng cái nào
- **Hành động**: 
  1. Xác định cái nào là main/production
  2. Giữ cái đó
  3. Xóa cái kia (hoặc rename thành backup)
- **Lý do**: Chỉ nên 1 entry point chính
- **Impact**: Update README, start script

---

## 🟡 MEDIUM PRIORITY (Tuần sau - 4-5 giờ)

### Backend - Middleware (Items 21-24)
**Vấn đề chung**: Naming không đồng bộ (camelCase vs kebab-case)
**Convention**: Middleware files nên dùng kebab-case (hyphen)

| # | File | Hành động | Lý do |
|---|------|----------|-------|
| 21 | `auth.js` | → `basic-auth.js` (hoặc tên rõ ràng) | Quá generic, không rõ loại auth gì |
| 22 | `firebaseAuth.js` | → `firebase-auth.js` | Consistency: kebab-case cho middleware |
| 23 | `jwt.js` | → `jwt-auth.js` | Tên quá chung, không rõ là auth |
| 24 | `role.js` | → `role-auth.js` hoặc `role.middleware.js` | Tương tự |

**Impact**: Update middleware imports tại app.js hoặc route files

---

### Backend - Repositories (Items 25-27)
**Vấn đề chung**: PascalCase + naming inconsistent
**Hành động**: Match pattern `.repository.js` (giống controller & routes)

| # | File | Hành động | Ví dụ |
|---|------|----------|-------|
| 25 | `IncidentTypeRepository.js` | → `incidentType.repository.js` | `require('./incidentType.repository')` |
| 26 | `MaintenanceTeamRepository.js` | → `maintenanceTeam.repository.js` | `require('./maintenanceTeam.repository')` |
| 27 | `ReportRepository.js` | → `report.repository.js` | `require('./report.repository')` |

**Impact**: Update requires tại services/controllers

---

### Backend - File Organization (Items 28-30)
**Vấn đề chung**: Test/Script files nằm ở sai folder

| # | File | Hành động | Lý do |
|---|------|----------|-------|
| 28 | `backend/create_test_user.js` | → `backend/scripts/create-test-user.js` | Script utilities nên ở scripts folder |
| 29 | `backend/test_ai_flow.js` | → `backend/tests/ai-flow.test.js` | Test files nên ở tests folder |
| 30 | `backend/src/tests/report.createReport.test.js` | → `backend/tests/report.createReport.test.js` | Test không nên ở src folder (source code) |

**Impact**: Update require paths nếu test files được import

---

### Frontend - Components Naming (Items 31-36)
**Vấn đề chung**: Dấu gạch dưới, suffix thừa
**Convention**: React components dùng PascalCase, không dấu gạch dưới

| # | File | Hành động | Lý do |
|---|------|----------|-------|
| 31 | `MaintenanceTeam_Table.jsx` | → `MaintenanceTeamTable.jsx` | Gạch dưới không follow React convention |
| 32 | `Update_Status.jsx` | → `UpdateStatus.jsx` | Tương tự |
| 33 | `ReportDetail-QLKV.jsx` | → Tên English (vd: `ReportDetailReview.jsx`) | Viết tắt Tiếng Việt không nên dùng |
| 34 | `Report.pb05.validation.test.jsx` | → `ReportValidation.test.jsx` | Too many dots, confusing |
| 35 | `HomeOverlayUI.jsx` | → `HomeOverlay.jsx` | Suffix "UI" thừa (file đã là component) |
| 36 | `MaintenanceHomeOverlayUI.jsx` | → `MaintenanceHomeOverlay.jsx` | Tương tự |

**Impact**: Update imports trong pages/components

---

### Frontend - Components Size (Items 37-38)
**Vấn đề**: Components quá lớn (>500 lines có thể tách)
**Hành động**: Tách thành sub-components

**File 37**: `frontend/src/components/UserTable.jsx`
- **Vấn đề**: Table component thường phức tạp + lớn
- **Giải pháp**: Tách thành:
  - `TableHeader.jsx`
  - `TableRow.jsx`
  - `TableCell.jsx`
  - Chuyển vào `components/tables/UserTable/`
- **Lý do**: Single Responsibility Principle (SRP)

**File 38**: `frontend/src/components/UserProfileModal.jsx`
- **Vấn đề**: Modal thường quá phức tạp
- **Giải pháp**: Tách thành sub-components, chuyển vào `components/modals/`
- **Lý do**: Dễ bảo trì, reusable

---

### Frontend - Pages Naming (Items 39-44)
**Vấn đề chung**: Dấu gạch dưới, chữ thường, chính tả
**Convention**: Page files dùng PascalCase

| # | File | Hành động | Ghi chú |
|---|------|----------|--------|
| 39 | `Assigned_report.jsx` | → `AssignedReport.jsx` | Gạch dưới không follow convention |
| 40 | `incident_management.jsx` | → `IncidentManagement.jsx` | Chữ thường không follow React standard |
| 41 | `Info_Management.jsx` | → `InfoManagement.jsx` | Gạch dưới |
| 42 | `MaintenanceTeam_Management.jsx` | → `MaintenanceTeamManagement.jsx` | Gạch dưới |
| 43 | `Report_Management.jsx` | → `ReportManagement.jsx` | Gạch dưới |
| 44 | `ReceptForm.jsx` | → `ReceiptForm.jsx` (nếu sai) | Check: Recept hay Receipt? (biên lai = Receipt) |

**Impact**: Update router, menu labels

---

### Frontend - Other (Items 45-46)
**File 45**: `frontend/src/pages/AdminDashboard.jsx` + `Dashboard.jsx`
- **Vấn đề**: Có thể duplicate (check nội dung)
- **Hành động**:
  - Nếu giống nhau: giữ 1, xóa 1
  - Nếu khác: giữ cả 2 nhưng rename rõ ràng
- **Lý do**: Avoid duplicate code maintenance nightmare

**File 46**: `frontend/src/services/FIREBASE_SETUP_GUIDE.js`
- **Vấn đề**: Docs/Guide ở services folder (sai chỗ)
- **Hành động**: Chuyển vào `docs/FIREBASE_SETUP.md` (markdown)
- **Lý do**: Docs không nên ở code folder
- **Impact**: Update README link

---

### Urban_Issues (Item 47)
**File**: `Urban_Issues/best.pt`
- **Vấn đề**: File model PyTorch lớn (.pt file) không nên trong git
- **Hành động**:
  1. Thêm vào `.gitignore`: `*.pt`, `*.pth`
  2. Upload vào cloud storage (Google Drive, S3, Hugging Face)
  3. Add download script hoặc README hướng dẫn
- **Lý do**: Git không nên chứa binary files lớn (repo bloat)
- **Impact**: Update .gitignore, README

---

## 🟢 LOW PRIORITY (Sau này - 1-2 giờ)

| # | File | Vấn đề | Hành động | Lý do |
|---|------|--------|----------|-------|
| 48 | `frontend/src/components/MyReports.jsx` | Duplicate (ở components + pages) | Check + merge, giữ 1 cái | Avoid duplicate code |
| 49 | `fix-mojibake.ps1` | Script ở root project | Chuyển vào `backend/scripts/` | Scripts nên organized ở folder |
| 50 | `scroring.md` | Check chính tả ("scroring" vs "scoring") | Nếu sai → `scoring.md` | Professional naming |

---

## 📊 TÓNG QUAN

| Độ ưu tiên | Số lượng | Thời gian dự tính | Loại chính |
|-----------|---------|------------------|-----------|
| 🔴 CRITICAL | 1 | 30 min | Typo fix |
| 🟠 HIGH | 13 | 2-3 giờ | Naming + organization |
| 🟡 MEDIUM | 27 | 4-5 giờ | Naming + components |
| 🟢 LOW | 9 | 1-2 giờ | Cleanup |
| **TOTAL** | **50** | **8-11 giờ** | - |

---

## 📋 DANH SÁCH THEO LOẠI VẤN ĐỀ

### 🔡 Naming Convention Issues
- Items 2-16: Controllers, Routes, Models (pattern inconsistency)
- Items 21-24: Middleware (camelCase → kebab-case)
- Items 25-27: Repositories (PascalCase → camelCase)
- Items 31-36, 39-44: Components/Pages (underscore → PascalCase)

### 🗂️ File Organization Issues
- Items 28-30: Scripts/Tests (wrong folder)
- Item 18: Test file ở pages
- Item 46: Docs ở services

### 🛑 Critical Issues
- Item 1: Typo (soketServer)
- Item 20: Duplicate entry point

### 🎨 Component Issues
- Items 35-36: Suffix "UI" thừa
- Items 37-38: Components quá lớn (cần tách)
- Item 33: Viết tắt Tiếng Việt

### 📚 Documentation/Other
- Item 47: Binary model file ở git

---

## ✅ HƯỚNG DẪN THỰC HIỆN

### Step 1: CRITICAL (30 min)
```
Item 1: soketServer.js → socketServer.js
- Rename file
- grep -r "soketServer" để tìm tất cả imports
- Update imports
```

### Step 2: HIGH Priority (2-3 giờ)
```
Items 2-20:
- Controllers: rename 5 files + update imports
- Routes: rename 5 files + update app.js
- Models: rename 5 files + update tất cả requires
- Server: tách app.js + index.js
- Pages: rename 2 files
- Urban: xóa 1 file
```

### Step 3: Test
```bash
npm start      # Backend test
npm run dev    # Frontend test
Kiểm tra: No import errors
```

### Step 4: MEDIUM Priority (4-5 giờ)
```
Items 21-47: Tiếp tục rename + organize
- Middleware: 4 files
- Repositories: 3 files
- File organization: 3 files
- Components: 8 files
- Pages: 6 files
- Other: 2 files
- Urban: 1 file
```

### Step 5: LOW Priority (1-2 giờ)
```
Items 48-50: Cleanup, merge duplicates
```

### Step 6: Final Test + Commit
```bash
npm test
git commit -m "refactor: standardize naming and file organization"
```

---

## 💡 TIPS THỰC HIỆN

✅ **Cách rename file đúng**:
1. Rename file
2. Tìm tất cả imports: `grep -r "oldName" .`
3. Update imports bằng Find & Replace (`Ctrl+Shift+H` VSCode)
4. Test ngay

✅ **VSCode shortcuts**:
- `Ctrl+Shift+H`: Find & Replace (update imports)
- `Ctrl+P`: Quick file search
- `Ctrl+Shift+F`: Search in all files

✅ **Terminal commands**:
```bash
# Tìm tất cả requires
grep -r "require.*oldName" .

# Tìm tất cả imports ES6
grep -r "import.*oldName" .

# Rename file
mv oldName.js newName.js
```

✅ **Test strategy**:
- Test sau mỗi 5 files rename
- Không batch quá nhiều

✅ **Git strategy**:
- Làm trên branch riêng
- Commit sau mỗi group refactor
- Messages: `refactor: rename controllers`, `refactor: fix typo in socket`, etc.

---

## ⚠️ LƯU Ý QUAN TRỌNG

❌ **KHÔNG**:
- ❌ Sửa code logic (chỉ refactor naming/organization)
- ❌ Thay đổi function/class names (chỉ file names)
- ❌ Xóa files mà không chắc nó không dùng
- ❌ Batch quá nhiều changes

✅ **CÓ THỂ**:
- ✅ Rename file + update imports
- ✅ Tách components lớn
- ✅ Move files vào folder đúng
- ✅ Commit thường xuyên

---

## 🎯 EXPECTED RESULTS

Sau khi refactor:
- ✅ Tất cả files follow naming convention
- ✅ Files organize ở folder đúng
- ✅ No import errors
- ✅ Codebase sạch, dễ bảo trì
- ✅ Dễ collaborate team

---

**Status**: 📋 Sẵn sàng refactor
**Last updated**: May 4, 2026
**Total files**: 50
**Estimated time**: 8-11 giờ
