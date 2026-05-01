# 🔍 Frontend Refactoring Checklist

> **Ngày tạo:** 2026-04-28
> **Mục đích:** Liệt kê toàn bộ file, component, và code trong `frontend/src` cần refactor

---

## 📂 Tổng quan cấu trúc thư mục

```
frontend/src/
├── App.jsx, App.css, main.jsx, index.css     # Entry points
├── context/                                   # Auth context
├── router/                                    # Route guards
├── hooks/                                     # Custom hooks
├── lib/                                       # Utilities
├── services/                                  # API services, Firebase
│   └── api/                                   # Axios clients & API modules
├── pages/                                     # Page components
├── components/                                # Feature components
│   └── ui/                                    # shadcn/ui primitives
├── styles/                                    # Global CSS
├── image/                                     # Static assets
└── test/                                      # Test setup
```

---

## 🔴 CRITICAL - Vấn đề nghiêm trọng (Cần refactor ngay)

### 1. Firebase credentials hardcode trong source
- **File:** `services/firebase.js`
- **Vấn đề:** API keys (`apiKey`, `authDomain`, `projectId`...) hardcode trực tiếp
- **Giải pháp:** Chuyển sang `.env` (VITE_FIREBASE_API_KEY, ...)

### 2. Trùng lặp component `MyReports`
| File | Mô tả |
|------|-------|
| `pages/MyReports.jsx` | Phiên bản đơn giản |
| `components/MyReports.jsx` | Phiên bản nâng cao (AI validation, pagination) |
- **Giải pháp:** Gộp thành 1, xóa file còn lại

### 3. Trùng lặp `dialog` UI component
| File | Mô tả |
|------|-------|
| `components/ui/dialog.tsx` | TypeScript version |
| `components/ui/dialog.jsx` | JavaScript version |
- **Giải pháp:** Giữ 1 file duy nhất (khuyến nghị `.tsx`)

### 4. Hardcoded mock data trong production pages
| File | Vấn đề |
|------|--------|
| `pages/Assigned_report.jsx` | Dữ liệu report hardcode thay vì gọi API |
| `pages/ThongKe.jsx` | Toàn bộ thống kê là mock data |
| `components/MaintenanceMyReports.jsx` | Mock data thay vì API |

### 5. Port API không nhất quán
| File | Base URL |
|------|----------|
| `services/api/axiosClient.js` | `http://localhost:5050/api` |
| `components/Report.jsx` | `http://localhost:5001/api` (khác port!) |

---

## 🟠 MAJOR - Vấn đề lớn (Nên refactor)

### 6. Code trùng lặp giữa 3 Dashboard map
| File | Dòng code trùng |
|------|-----------------|
| `pages/Dashboard.jsx` (~500 lines) | `parseCoordinate()`, `extractPositionFromReport()`, `mapReportTypeToIncidentType()`, `parseReportDate()`, `getReporterName()`, `loadCachedReports()`, `saveCachedReports()`, `loadGeocodeCache()`, `saveGeocodeCache()`, `geocodeLocation()`, `normalizeReportsForMap()`, `MapController` component |
| `pages/AdminDashboard.jsx` | Tương tự Dashboard |
| `pages/MaintenanceDashboard.jsx` | Tương tự Dashboard |
- **Giải pháp:** Extract thành `lib/mapUtils.js`

### 7. Code trùng lặp giữa các Sidebar
| File | Mô tả |
|------|-------|
| `components/UserSidebar.jsx` (~400 lines) | Citizen sidebar |
| `components/MaintenanceUserSidebar.jsx` (~400 lines) | Maintenance sidebar (gần giống hệt UserSidebar) |
- **Giải pháp:** Tạo `BaseSidebar` parameterized component

### 8. Code trùng lặp giữa HomeOverlayUI
| File | Mô tả |
|------|-------|
| `components/HomeOverlayUI.jsx` | Citizen map overlay |
| `components/MaintenanceHomeOverlayUI.jsx` | Maintenance map overlay (tương tự) |
- **Giải pháp:** Gộp thành 1 component với props

### 9. Unused/Dead code
| File | Trạng thái |
|------|------------|
| `router/AdminRoute.jsx` | Không được import ở đâu (ProtectedRoute đã lo hết) |
| `components/UserProfileModal.jsx` | Không dùng (đã có `Info_Management.jsx`) |
| `components/PhoneAuthExample.jsx` | Chỉ là ví dụ, không dùng trong app |
| `components/PhoneAuthVerification.jsx` | Có bug: `confirmationResult` undefined |

### 10. Toast không nhất quán
| File | Cách dùng |
|------|-----------|
| `pages/SignIn.jsx`, `Register.jsx` | Dùng custom `Toast.jsx` |
| `pages/Dashboard.jsx`, `AdminSidebar.jsx` | Dùng `sonner` toast |
- **Giải pháp:** Chuẩn hóa về `sonner` (đã có trong deps)

### 11. Thiếu Error Boundary
- **Vấn đề:** Không có React Error Boundary nào → crash = white screen
- **Giải pháp:** Tạo `components/ErrorBoundary.jsx`

### 12. Navbar hardcode mock notifications
| File | Vấn đề |
|------|--------|
| `components/NavBar.jsx` | `useState` với notification data hardcode |
| `components/NavBar.jsx` (NavbarAdmin) | Tương tự |

---

## 🟡 MODERATE - Vấn đề trung bình

### 13. Thiếu centralized constants/config
- Status values (`"Đang Chờ"`, `"Đang Xử Lý"`, `"Đã Giải Quyết"`) định nghĩa rải rác nhiều file
- Incident type mappings duplicated trong Dashboard, AdminDashboard, MaintenanceDashboard
- Cache keys散落 khắp nơi
- **Giải pháp:** Tạo `lib/constants.js`

### 14. Pagination buttons không hoạt động
- **File:** `pages/MyReports.jsx`
- Previous/Next buttons không có `onClick` handler

### 15. `RegisterConfirm.jsx` có guard check trùng lặp
- `if (!phone)` xuất hiện 2 lần (line ~30 và ~107)

### 16. `usePhoneAuth.js` cleanup bug
- `useEffect` cleanup gọi `recaptchaVerifier?.clear()` nhưng lần đầu render là `null`

### 17. Empty `useEffect` trong Overlay components
| File | Vấn đề |
|------|--------|
| `components/HomeOverlayUI.jsx` | `handleClickOutside` rỗng |
| `components/MaintenanceHomeOverlayUI.jsx` | Tương tự |

### 18. `MaintenanceReportDetail.jsx` hardcoded image
- Before photo hardcode Unsplash URL thay vì `report.image`

### 19. `Report.jsx` quá dài (~872 lines)
- Xử lý quá nhiều trách nhiệm: camera, GPS, file upload, drag-drop, validation, API submit
- **Giải pháp:** Tách thành `ReportCamera.jsx`, `ReportImageUpload.jsx`, `ReportForm.jsx`

### 20. `UserTable.jsx` và `MaintenanceTeam_Table.jsx` trùng modal code
- Add/edit modals giống hệt nhau
- **Giải pháp:** Tạo shared `CrudModal.jsx`

### 21. Encoding issue trong `ReceptForm.jsx`
- SelectItem "old" date filter hiển thị `CÅ™ hÆ¡n` thay vì `Cũ hơn`

---

## 🟢 MINOR - Vấn đề nhỏ

### 22. Naming inconsistency
| File | Vấn đề |
|------|--------|
| `pages/incident_management.jsx` | snake_case (các file khác PascalCase) |
| `pages/Assigned_report.jsx` | Mixed case |

### 23. Commented-out code
| File | Code comment |
|------|--------------|
| `components/NavBar.jsx` | `// <Avatar ...>` |
| `pages/ReceptForm.jsx` | `// const [page, setPage] = useState(2);` |

---

## 📋 Danh sách FULL file cần refactor

### Root files (4 files)
| # | File | Trạng thái |
|---|------|------------|
| 1 | `App.jsx` | OK - route config, cần cleanup unused imports |
| 2 | `App.css` | Kiểm tra có cần thiết không |
| 3 | `main.jsx` | OK |
| 4 | `index.css` | OK |
| 5 | `PHONE_AUTH_README.md` | Documentation, có thể xóa nếu không cần |

### Context (1 file)
| # | File | Trạng thái |
|---|------|------------|
| 6 | `context/AuthContext.jsx` | OK - nhưng nên thêm error handling |

### Router (2 files)
| # | File | Trạng thái |
|---|------|------------|
| 7 | `router/ProtectedRoute.jsx` | OK - đang dùng |
| 8 | `router/AdminRoute.jsx` | **CẦN XÓA** - unused |

### Hooks (2 files)
| # | File | Trạng thái |
|---|------|------------|
| 9 | `hooks/usePhoneAuth.js` | **REFACTOR** - cleanup bug |
| 10 | `hooks/use-mobile.ts` | OK |

### Lib (2 files)
| # | File | Trạng thái |
|---|------|------------|
| 11 | `lib/utils.ts` | OK - `cn()` utility |
| 12 | `lib/mapIcons.js` | OK - nhưng có thể merge vào `lib/mapUtils.js` mới |

### Services/API (9 files)
| # | File | Trạng thái |
|---|------|------------|
| 13 | `services/firebase.js` | **REFACTOR** - chuyển sang .env |
| 14 | `services/phoneAuth.service.js` | Kiểm tra có đang dùng không |
| 15 | `services/FIREBASE_SETUP_GUIDE.js` | Documentation-only, có thể xóa |
| 16 | `services/api/axiosClient.js` | OK - nhưng thống nhất port với Report.jsx |
| 17 | `services/api/reportApi.js` | OK |
| 18 | `services/api/userApi.js` | OK |
| 19 | `services/api/phoneApi.js` | OK |
| 20 | `services/api/maintenanceTeamApi.js` | OK |
| 21 | `services/api/authApi.js` | OK |
| 22 | `services/api/incidentApi.js` | OK |

### Pages (17 files)
| # | File | Trạng thái |
|---|------|------------|
| 23 | `pages/Dashboard.jsx` | **REFACTOR** - extract shared map utils |
| 24 | `pages/AdminDashboard.jsx` | **REFACTOR** - extract shared map utils |
| 25 | `pages/MaintenanceDashboard.jsx` | **REFACTOR** - extract shared map utils |
| 26 | `pages/SignIn.jsx` | **MINOR** - chuyển sang sonner toast |
| 27 | `pages/Register.jsx` | **MINOR** - chuyển sang sonner toast |
| 28 | `pages/ForgotPassword.jsx` | OK |
| 29 | `pages/ResetPassword.jsx` | OK |
| 30 | `pages/MyReports.jsx` | **REFACTOR/GỘP** với components/MyReports.jsx |
| 31 | `pages/Assigned_report.jsx` | **REFACTOR** - thay mock data bằng API |
| 32 | `pages/ReceptForm.jsx` | **REFACTOR** - fix encoding, cleanup comment |
| 33 | `pages/Overview.jsx` | OK |
| 34 | `pages/MaintenanceTeam_Management.jsx` | OK - delegate component |
| 35 | `pages/incident_management.jsx` | **MINOR** - rename sang PascalCase |
| 36 | `pages/ThongKe.jsx` | **REFACTOR** - connect API thay vì mock |
| 37 | `pages/UserManagement.jsx` | OK - delegate component |
| 38 | `pages/Info_Management.jsx` | OK |
| 39 | `pages/TestPhoneAuth.jsx` | Kiểm tra có cần giữ không |
| 40 | `pages/Report_Management.jsx` | OK |
| 41 | `pages/Public_page.jsx` | Kiểm tra nội dung |

### Components (22 files)
| # | File | Trạng thái |
|---|------|------------|
| 42 | `components/Sidebar.jsx` | OK - admin icon-only |
| 43 | `components/AdminSidebar.jsx` | OK |
| 44 | `components/UserSidebar.jsx` | **REFACTOR** - gộp với MaintenanceUserSidebar |
| 45 | `components/MaintenanceUserSidebar.jsx` | **REFACTOR** - gộp với UserSidebar |
| 46 | `components/LayoutAdmin.jsx` | OK |
| 47 | `components/NavBar.jsx` | **REFACTOR** - thay mock notifications bằng API |
| 48 | `components/HomeOverlayUI.jsx` | **REFACTOR** - gộp với MaintenanceHomeOverlayUI |
| 49 | `components/MaintenanceHomeOverlayUI.jsx` | **REFACTOR** - gộp với HomeOverlayUI |
| 50 | `components/Report.jsx` | **REFACTOR** - tách thành nhiều component nhỏ (~872 lines) |
| 51 | `components/ReportDetail.jsx` | OK |
| 52 | `components/ReportDetail-QLKV.jsx` | OK |
| 53 | `components/MaintenanceReportDetail.jsx` | **REFACTOR** - fix hardcoded image |
| 54 | `components/IncidentPopupContent.jsx` | OK |
| 55 | `components/IncidentTypePopup.jsx` | OK |
| 56 | `components/UserTable.jsx` | **REFACTOR** - extract shared CrudModal |
| 57 | `components/MaintenanceTeam_Table.jsx` | **REFACTOR** - extract shared CrudModal |
| 58 | `components/Toast.jsx` | **REFACTOR** - cân nhắc xóa nếu dùng sonner |
| 59 | `components/MyReports.jsx` | **REFACTOR/GỘP** với pages/MyReports.jsx |
| 60 | `components/MaintenanceMyReports.jsx` | **REFACTOR** - thay mock data bằng API |
| 61 | `components/RegisterConfirm.jsx` | **REFACTOR** - fix duplicate guard |
| 62 | `components/NotificationPanel.jsx` | OK |
| 63 | `components/UserProfileModal.jsx` | **CẦN XÓA** - unused |
| 64 | `components/ReportReviews.jsx` | OK |
| 65 | `components/PhoneAuthVerification.jsx` | **REFACTOR** - fix undefined confirmationResult |
| 66 | `components/PhoneAuthExample.jsx` | **CẦN XÓA** - chỉ là ví dụ |

### UI Components - shadcn (24 files)
| # | File | Trạng thái |
|---|------|------------|
| 67 | `components/ui/button.tsx` | OK |
| 68 | `components/ui/input.tsx` | OK |
| 69 | `components/ui/label.tsx` | OK |
| 70 | `components/ui/textarea.tsx` | OK |
| 71 | `components/ui/select.tsx` | OK |
| 72 | `components/ui/dialog.tsx` | **GIỮ** - TypeScript version |
| 73 | `components/ui/dialog.jsx` | **XÓA** - duplicate của dialog.tsx |
| 74 | `components/ui/card.tsx` | OK |
| 75 | `components/ui/table.tsx` | OK |
| 76 | `components/ui/pagination.tsx` | OK |
| 77 | `components/ui/badge.tsx` | OK |
| 78 | `components/ui/alert.tsx` | OK |
| 79 | `components/ui/separator.tsx` | OK |
| 80 | `components/ui/scroll-area.tsx` | OK |
| 81 | `components/ui/sheet.tsx` | OK |
| 82 | `components/ui/sidebar.tsx` | OK |
| 83 | `components/ui/popover.tsx` | OK |
| 84 | `components/ui/tabs.tsx` | OK |
| 85 | `components/ui/toggle.tsx` | OK |
| 86 | `components/ui/toggle-group.tsx` | OK |
| 87 | `components/ui/tooltip.tsx` | OK |
| 88 | `components/ui/sonner.tsx` | OK |
| 89 | `components/ui/field.tsx` | OK |
| 90 | `components/ui/skeleton.tsx` | OK |
| 91 | `components/ui/spinner.tsx` | OK |

### Styles (1 file)
| # | File | Trạng thái |
|---|------|------------|
| 92 | `styles/map.css` | OK |

### Test (1 file)
| # | File | Trạng thái |
|---|------|------------|
| 93 | `test/setupTests.js` | OK |
| 94 | `components/Report.pb05.validation.test.jsx` | OK |

---

## 🎯 Thứ tự ưu tiên refactor

### Phase 1 - Critical (làm trước)
1. ✅ Chuyển Firebase config sang `.env` → `services/firebase.js`
2. ✅ Gộp/xóa duplicate `MyReports` → `pages/MyReports.jsx` + `components/MyReports.jsx`
3. ✅ Xóa duplicate `dialog.jsx` → `components/ui/dialog.jsx`
4. ✅ Thống nhất API base URL → `axiosClient.js` + `Report.jsx`
5. ✅ Thay mock data bằng API → `Assigned_report.jsx`, `ThongKe.jsx`, `MaintenanceMyReports.jsx`

### Phase 2 - Major (làm tiếp)
6. ✅ Extract shared map utils → `lib/mapUtils.js` (từ 3 Dashboard files)
7. ✅ Gộp Sidebars → `components/BaseSidebar.jsx`
8. ✅ Gộp HomeOverlayUI → `components/BaseHomeOverlayUI.jsx`
9. ✅ Xóa unused files → `AdminRoute.jsx`, `UserProfileModal.jsx`, `PhoneAuthExample.jsx`
10. ✅ Chuẩn hóa toast → sonner khắp nơi
11. ✅ Thêm Error Boundary → `components/ErrorBoundary.jsx`

### Phase 3 - Moderate (làm sau)
12. ✅ Tạo centralized constants → `lib/constants.js`
13. ✅ Tách `Report.jsx` thành nhiều component nhỏ
14. ✅ Tạo shared `CrudModal.jsx`
15. ✅ Fix các bugs nhỏ (encoding, duplicate guards, empty useEffects)

### Phase 4 - Minor (cleanup cuối)
16. ✅ Rename files sang PascalCase → `incident_management.jsx`
17. ✅ Xóa commented-out code
18. ✅ Cleanup unused imports

---

## 📊 Thống kê

| Metric | Count |
|--------|-------|
| **Tổng số file** | 94 |
| **Critical issues** | 5 |
| **Major issues** | 7 |
| **Moderate issues** | 9 |
| **Minor issues** | 3 |
| **Files cần refactor** | ~35/94 (~37%) |
| **Files có thể xóa** | ~5 (`AdminRoute.jsx`, `UserProfileModal.jsx`, `PhoneAuthExample.jsx`, `dialog.jsx`, `FIREBASE_SETUP_GUIDE.js`) |
| **Files cần gộp** | ~6 thành ~3 |
| **Files cần tạo mới** | ~3 (`lib/mapUtils.js`, `lib/constants.js`, `components/ErrorBoundary.jsx`) |
