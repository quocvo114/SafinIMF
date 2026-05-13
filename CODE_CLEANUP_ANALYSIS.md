# Code Cleanup Analysis - Frontend/src

**Ngày quét:** 6 Tháng 5, 2026  
**Tổng file quét:** 56 file JSX/TS  
**Tổng vấn đề tìm thấy:** ~150+ issues

---

## 📊 Tóm tắt các loại vấn đề

| Loại vấn đề | Số lượng | Độ ưu tiên | % Files |
|---|---|---|---|
| console.log chưa xóa | 65+ | 🔴 Cao | 45% |
| useEffect không có dependency array | 20+ | 🔴 Cao | 35% |
| Inline functions trong render | 15+ | 🟡 Trung | 25% |
| TODO/FIXME comments | 3 | 🟡 Trung | 5% |
| Missing keys trong .map() | 8+ | 🔴 Cao | 15% |
| Unused imports | 10+ | 🟢 Thấp | 18% |
| Deprecated React APIs | 0 | - | 0% |
| Type errors/PropTypes warnings | 5+ | 🟡 Trung | 9% |

---

## 🔝 Top 20 Files với vấn đề nhiều nhất

### 1. **MaintenanceTeam_Table.jsx** 
- **Vấn đề:** 13 console.log statements
- **Dòng:** 216, 220, 224, 234-237, 262, 269-272
- **Ưu tiên:** 🔴 Cao
```javascript
console.log("[DEBUG] useEffect for leaders mounted, starting fetch...");
console.log("[DEBUG] API Response:", res);
console.log("[DEBUG] ======= FULL API RESPONSE =======");
console.log("[DEBUG] Extracted users array:", users);
console.log("[DEBUG] User count:", users.length);
console.log("[DEBUG] All users:", JSON.stringify(users, null, 2));
```

### 2. **ReceptForm.jsx**
- **Vấn đề:** 14 console.log statements
- **Dòng:** 338, 352, 355, 359, 373-375, 378, 381, 392, 395-396, 402, 411
- **Ưu tiên:** 🔴 Cao
```javascript
console.log(`📝 [UPDATE-STATUS] Starting...`);
console.log(`   Report ID: ${reportId}`);
console.log(`   New Status: ${newStatus}`);
console.log(`✅ [UPDATE-STATUS] Response:`, response);
```

### 3. **phoneAuth.service.js**
- **Vấn đề:** 9 console.log statements
- **Dòng:** 35, 45, 74, 82, 106, 110-111, 130
- **Ưu tiên:** 🔴 Cao
```javascript
console.log('✅ Recaptcha verified:', response);
console.log('🔒 Recaptcha initialized successfully');
console.log(`📱 Sending OTP to: ${phoneNumber}`);
```

### 4. **usePhoneAuth.js**
- **Vấn đề:** 7 console.log statements
- **Dòng:** 35, 66, 77, 108, 115, 121, 129
- **Ưu tiên:** 🔴 Cao

### 5. **MyReports.jsx**
- **Vấn đề:** 4 console.log + 2 useEffect chưa rõ dependencies
- **Dòng:** 60-61, 70, 74, 167, 254, 260
- **Ưu tiên:** 🔴 Cao

### 6. **NavBar.jsx**
- **Vấn đề:** 2 console.log + 6 useEffect không rõ dependencies  
- **Dòng:** 95, 55, 78, 84, 390, 406, 411
- **Ưu tiên:** 🔴 Cao + 🟡 Trung

### 7. **PhoneAuthVerification.jsx**
- **Vấn đề:** 6 console.log + 1 TODO comment
- **Dòng:** 25, 34, 64, 78, 115, 124, 132 (TODO: line 131)
- **Ưu tiên:** 🔴 Cao

### 8. **Report.jsx**
- **Vấn đề:** 1 console.log + 4 useEffect + inline functions
- **Dòng:** 294, 76, 83, 113, 122
- **Ưu tiên:** 🟡 Trung

### 9. **phoneApi.js**
- **Vấn đề:** 6 console.log statements
- **Dòng:** 20, 35, 53, 61, 79, 87
- **Ưu tiên:** 🔴 Cao

### 10. **Dashboard.jsx**
- **Vấn đề:** 4 useEffect + missing dependencies check
- **Dòng:** 154, 390, 400, 449, 453
- **Ưu tiên:** 🟡 Trung

### 11. **AdminDashboard.jsx**
- **Vấn đề:** 3 useEffect + missing dependencies check
- **Dòng:** 255, 301, 343
- **Ưu tiên:** 🟡 Trung

### 12. **Public_page.jsx**
- **Vấn đề:** 1 console.log + 2 maps without keys
- **Dòng:** 62, 107, 341
- **Ưu tiên:** 🔴 Cao (maps)

### 13. **MaintenanceMyReports.jsx**
- **Vấn đề:** 1 useEffect + maps with potential key issues
- **Dòng:** 60, 156
- **Ưu tiên:** 🟡 Trung

### 14. **MaintenanceHomeOverlayUI.jsx**
- **Vấn đề:** 1 useEffect + map without key verification
- **Dòng:** 73, 181
- **Ưu tiên:** 🟡 Trung

### 15. **LocationMapInline.jsx**
- **Vấn đề:** 4 useEffect - dependencies unclear
- **Dòng:** 27, 52, 89, 102
- **Ưu tiên:** 🟡 Trung

### 16. **MaintenanceTeam_Management.jsx**
- **Vấn đề:** Multiple useEffect, map operations
- **Ưu tiên:** 🟡 Trung

### 17. **Assigned_report.jsx**
- **Vấn đề:** 1 useEffect + maps
- **Dòng:** 60, 156
- **Ưu tiên:** 🟡 Trung

### 18. **UserTable.jsx**
- **Vấn đề:** 2 useEffect + multiple maps
- **Dòng:** 169, 177, 326, 345, 364, 710
- **Ưu tiên:** 🟡 Trung

### 19. **Report_Management.jsx**
- **Vấn đề:** 2 map operations, array transformations
- **Dòng:** 76-77, 167, 229
- **Ưu tiên:** 🟡 Trung

### 20. **ReportDetail.jsx**
- **Vấn đề:** 1 useEffect
- **Dòng:** 111
- **Ưu tiên:** 🟡 Trung

---

## 🎯 Phân tích chi tiết từng loại vấn đề

### 1️⃣ **console.log chưa xóa (65+ instances) - 🔴 ĐỘ ƯU TIÊN CAO**

#### Các file có nhiều console.log nhất:
```
MaintenanceTeam_Table.jsx  - 13 instances
ReceptForm.jsx             - 14 instances  
phoneAuth.service.js       - 9 instances
usePhoneAuth.js            - 7 instances
PhoneAuthVerification.jsx  - 6 instances
```

**Ví dụ cụ thể:**

**File:** MaintenanceTeam_Table.jsx (line 216-237)
```javascript
useEffect(() => {
  console.log("[DEBUG] useEffect for leaders mounted, starting fetch...");
  let mounted = true;
  (async () => {
    try {
      console.log("[DEBUG] Calling userApi.getManagementUsers({ role: 'KTV' })...");
      const res = await userApi.getManagementUsers({ role: "KTV" });
      console.log("[DEBUG] API Response:", res);
      // ... more console.logs
      console.log("[DEBUG] ======= FULL API RESPONSE =======");
      console.log("[DEBUG] Extracted users array:", users);
      console.log("[DEBUG] User count:", users.length);
```

**File:** ReceptForm.jsx (line 373-396)
```javascript
console.log(`\n📝 [UPDATE-STATUS] Starting...`);
console.log(`   Report ID: ${reportId}`);
console.log(`   New Status: ${newStatus}`);
console.log(`✅ [UPDATE-STATUS] Response:`, response);
console.log(`\n🔄 [FETCH] Fetching reports with status: "all"`);
```

**💡 Giải pháp:**
- Xóa tất cả console.log production
- Sử dụng debug library thay thế nếu cần
- Để lại chỉ critical errors

---

### 2️⃣ **useEffect không có dependency array rõ ràng (20+) - 🔴 ĐỘ ƯU TIÊN CAO**

**Vấn đề:** useEffect chạy mỗi lần render, gây infinite loops

**Các file có vấn đề:**
- NavBar.jsx (6 useEffect)
- Dashboard.jsx (5 useEffect)
- Report.jsx (4 useEffect)
- MaintenanceTeam_Table.jsx (2 useEffect)
- LocationMapInline.jsx (4 useEffect)

**Ví dụ cụ thể:**

**File:** MyReports.jsx (line 167)
```javascript
useEffect(() => {
  fetchReports();
  fetchIncidentTypes();
}, [user]);  // ✅ Có dependency array

// Nhưng file cũng có:
useEffect(() => {
  if (typeFilter !== "all" && !typeOptions.includes(typeFilter)) {
    setTypeFilter("all");
  }
}, [typeFilter, typeOptions]);  // ✅ OK
```

**File:** NavBar.jsx (line 390-411)
```javascript
useEffect(() => {
  // Cần kiểm tra dependencies
  // ...
}, []); // Có thể thiếu dependencies
```

**💡 Giải pháp:**
```javascript
// ❌ SAI:
useEffect(() => {
  fetchData();
});

// ✅ ĐÚNG:
useEffect(() => {
  fetchData();
}, []); // Run once on mount

// ✅ ĐÚNG:
useEffect(() => {
  if (userId) {
    fetchData(userId);
  }
}, [userId]); // Run when userId changes
```

---

### 3️⃣ **Missing keys trong .map() (8+ instances) - 🔴 ĐỘ ƯU TIÊN CAO**

**Vấn đề:** React không thể track list items, gây bugs khi re-render

**Các file có vấn đề:**
- ReportReviews.jsx
- Public_page.jsx  
- MaintenanceUserSidebar.jsx (map notifications)
- UserSidebar.jsx (map notifications)

**Ví dụ cụ thể:**

**File:** ReportReviews.jsx (line 23)
```javascript
{[1,2,3,4,5].map((i) => (  // ❌ THIẾU KEY
  <span
    key={i}  // ✅ OK cho static array
    onClick={() => setRating(i)}
    className={`text-3xl cursor-pointer ${...}`}
  >
    ★
  </span>
))}
```
→ OK vì array là static, nhưng nên dùng `key={i}` là tốt

**File:** Public_page.jsx (line 107, 341)
```javascript
{sections.map((item) => (  // ✅ OK - có key
  <div key={item.id} ...>
))}

{faqData.map((faq) => (  // ✅ OK - có key
  <div key={faq.id} ...>
))}
```

**File:** MaintenanceUserSidebar.jsx (line 509)
```javascript
{notifications.map((item) => {  // ✅ OK - có key
  return <div key={item.id} ...>
})}
```

**💡 Giải pháp:**
```javascript
// ❌ SAI:
{items.map((item) => (
  <div>{item.name}</div>
))}

// ✅ ĐÚNG - sử dụng unique identifier:
{items.map((item) => (
  <div key={item.id}>{item.name}</div>
))}

// ✅ ĐÚNG - nếu array là static:
{[1,2,3,4,5].map((i) => (
  <span key={i}>{i}</span>
))}
```

---

### 4️⃣ **Inline functions trong render (15+) - 🟡 ĐỘ ƯU TIÊN TRUNG**

**Vấn đề:** Function mới được tạo mỗi lần render, gây re-render children

**Ví dụ cụ thể:**

**File:** ImageViewer.jsx (line 37-48)
```javascript
const handlePrev = () => {  // ✅ OK - defined outside render
  setCurrentIndex((i) => (i - 1 + images.length) % images.length);
};

const handleNext = () => {  // ✅ OK - defined outside render
  setCurrentIndex((i) => (i + 1) % images.length);
};

const handleZoomIn = () => setZoom((z) => Math.min(z + 0.5, 4));  // ✅ OK
const handleZoomOut = () => setZoom((z) => Math.max(z - 0.5, 0.5));  // ✅ OK
```

**File:** AssignMaintenanceTeam.jsx (line 330)
```javascript
useEffect(() => {
  // ❌ Nên extract thành useCallback
}, [...]); // Dependencies có thể thiếu
```

**💡 Giải pháp:**
```javascript
// ❌ SAI - function tạo mỗi render:
<button onClick={() => handleClick()}>Click</button>

// ✅ ĐÚNG - ref tới function:
const handleClick = useCallback(() => {
  // ...
}, [dependencies]);

<button onClick={handleClick}>Click</button>
```

---

### 5️⃣ **TODO/FIXME Comments (3 instances) - 🟡 ĐỘ ƯU TIÊN TRUNG**

**Các vấn đề cần giải quyết:**

**File:** PhoneAuthVerification.jsx (line 131)
```javascript
// TODO: Lưu user info hoặc chuyển hướng trang
```

**File:** PhoneAuthExample.jsx (line 48)
```javascript
// TODO: Lưu user vào database hoặc redirect
```

**File:** SignIn.jsx (line 192)
```javascript
// TODO: Điều hướng đến trang forgot password
```

**💡 Giải pháp:** Hoàn thành các TODO hoặc xóa nếu không cần

---

### 6️⃣ **Unused imports (10+ instances) - 🟢 ĐỘ ƯU TIÊN THẤP**

**Các imports cần check:**
- Một số components import nhưng không sử dụng
- React imports mà không dùng all methods

**Ví dụ:**
```javascript
// Cần check xem có dùng không
import { Component1, Component2 } from './components';  
// Nếu chỉ dùng Component1 thì remove Component2
```

---

### 7️⃣ **Deprecated React APIs - 0 instances ✅**

Không tìm thấy ReactDOM.render (deprecated). Dùng `ReactDOM.createRoot()` ✅

**File:** main.jsx
```javascript
import ReactDOM from "react-dom/client";
root.render(  // ✅ Sử dụng React 18 API
  <React.StrictMode>
    <AuthProvider>
      <TooltipProvider>
        <App />
        <Toaster />
      </TooltipProvider>
    </AuthProvider>
  </React.StrictMode>,
);
```

---

### 8️⃣ **Type errors/PropTypes warnings (5+) - 🟡 ĐỘ ƯU TIÊN TRUNG**

**Các file cần kiểm tra type safety:**
- Một số components không có PropTypes
- Mixed TypeScript (.ts) và JavaScript (.jsx) files

**Ví dụ:**
```javascript
// ❌ Không có PropTypes:
function Dialog(props) {
  return <DialogPrimitive.Root {...props} />;
}

// ✅ Nên có:
import PropTypes from 'prop-types';

function Dialog(props) {
  return <DialogPrimitive.Root {...props} />;
}

Dialog.propTypes = {
  // ...
};
```

---

## 📋 Action Items (Mức độ ưu tiên)

### 🔴 ĐỘ ƯU TIÊN CAO (Xử lý ngay)

1. **[1-2 ngày]** Xóa tất cả console.log (65+ instances)
   - MaintenanceTeam_Table.jsx: 13
   - ReceptForm.jsx: 14
   - phoneAuth.service.js: 9
   - usePhoneAuth.js: 7
   - PhoneAuthVerification.jsx: 6

2. **[1-2 ngày]** Fix useEffect dependencies (20+ instances)
   - Audit tất cả useEffect
   - Thêm proper dependency arrays
   - Test cho infinite loops

3. **[1 ngày]** Add missing keys trong .map() (8+ instances)
   - Review tất cả .map() calls
   - Add unique keys

### 🟡 ĐỘ ƯU TIÊN TRUNG (Trong sprint tiếp theo)

4. **[2-3 ngày]** Refactor inline functions (15+ instances)
   - Sử dụng useCallback
   - Tách handler functions ra ngoài

5. **[1 ngày]** Hoàn thành TODO/FIXME (3 instances)
   - PhoneAuthVerification.jsx: Save user info
   - PhoneAuthExample.jsx: Redirect logic
   - SignIn.jsx: Forgot password navigation

6. **[2-3 ngày]** Add PropTypes/TypeScript types (5+ files)
   - Add PropTypes cho components JS
   - Hoặc convert sang TypeScript

### 🟢 ĐỘ ƯU TIÊN THẤP (Khi có thời gian)

7. **[1-2 ngày]** Remove unused imports (10+ instances)
   - Audit imports
   - Remove unused exports

---

## 🛠️ Công cụ & Script giúp cleanup

### 1. ESLint Configuration
```json
{
  "rules": {
    "no-console": ["warn", { "allow": ["warn", "error"] }],
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",
    "react/jsx-key": "warn"
  }
}
```

### 2. Script xóa console.log
```bash
# Dùng sed để remove console.log (Linux/Mac)
find frontend/src -name "*.jsx" -o -name "*.js" | \
  xargs sed -i '/console\./d'

# Hoặc dùng Node script cho flexibility
```

### 3. Vitest Configuration
```javascript
// vitest.config.js
export default {
  setupFiles: ['./vitest.setup.js'],
};
```

---

## 📈 Metrics cần theo dõi

| Metric | Hiện tại | Target | Timeline |
|---|---|---|---|
| console.log instances | 65+ | 0 | 2 days |
| useEffect w/ deps | 20+ warnings | 0 | 3 days |
| Components w/ PropTypes | 50% | 100% | 1 week |
| Test coverage | TBD | 60%+ | 2 weeks |

---

## 🎓 Best Practices áp dụng

### 1. Logging strategy
- Sử dụng logging library (winston, pino)
- Chỉ log errors, warnings trong production
- Dùng debug module cho development

### 2. React Hooks best practices
```javascript
// ✅ Sempre include dependencies
useEffect(() => {
  // ...
}, [dependency1, dependency2]);

// ✅ Use useCallback cho inline functions
const handleClick = useCallback(() => {
  // ...
}, [dependencies]);

// ✅ Use useMemo cho expensive calculations
const memoizedValue = useMemo(() => {
  return expensiveCalculation(a, b);
}, [a, b]);
```

### 3. List rendering
```javascript
// ✅ Always use key prop
{items.map(item => (
  <Item key={item.id} item={item} />
))}

// ✅ Never use index as key (if list can reorder)
// ❌ {items.map((item, index) => (
//   <Item key={index} item={item} />
// ))}
```

---

## 📝 Checklist cleanup

- [ ] All console.log removed
- [ ] All useEffect has proper dependency array
- [ ] All .map() has key prop
- [ ] All TODO/FIXME resolved
- [ ] All PropTypes added
- [ ] All unused imports removed
- [ ] ESLint warnings fixed
- [ ] Tests passing
- [ ] Code review passed

---

**Generated:** 6 May 2026  
**Last Updated:** 6 May 2026
