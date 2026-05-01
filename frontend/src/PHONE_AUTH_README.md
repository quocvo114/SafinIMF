# 📱 Firebase Phone Authentication - Hướng Dẫn Đầy Đủ

## 📦 Các File Được Tạo

```
frontend/src/
├── components/
│   ├── PhoneAuthVerification.jsx    ← Component cơ bản (UI + Logic)
│   └── PhoneAuthExample.jsx         ← Ví dụ hoàn chỉnh với Hook
├── hooks/
│   └── usePhoneAuth.js              ← Custom Hook (KHUYÊN DÙNG)
├── services/
│   ├── phoneAuth.service.js         ← Service class
│   ├── firebase.js                  ← Firebase config (cần tạo)
│   └── FIREBASE_SETUP_GUIDE.js      ← Hướng dẫn setup
```

---

## 🚀 QUICK START

### 1️⃣ Setup Firebase

Tạo file `frontend/src/services/firebase.js`:

```javascript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",                    // ← Thay đổi
  authDomain: "your-project.firebaseapp.com",// ← Thay đổi
  projectId: "your-project-id",              // ← Thay đổi
  storageBucket: "your-project.appspot.com", // ← Thay đổi
  messagingSenderId: "123456789",            // ← Thay đổi
  appId: "1:123456789:web:abcd1234efgh5678", // ← Thay đổi
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
```

### 2️⃣ Cấu Hình Firebase Console

1. Vào https://console.firebase.google.com/
2. Chọn project
3. **Authentication → Sign-in method**
   - Enable "Phone"
4. **Authentication → Phone Numbers**
   - Thêm số test: `+84901234567`
   - Mã OTP test: `123456`
   - **Save** → Không tốn phí!

### 3️⃣ Sử Dụng Component

#### Cách 1: Component đơn (Không cần Hook)

```jsx
import PhoneAuthVerification from '@/components/PhoneAuthVerification';

export default function LoginPage() {
  return <PhoneAuthVerification />;
}
```

#### Cách 2: Component + Hook (KHUYÊN DÙNG)

```jsx
import PhoneAuthExample from '@/components/PhoneAuthExample';

export default function LoginPage() {
  return <PhoneAuthExample />;
}
```

#### Cách 3: Hook standalone

```jsx
import usePhoneAuth from '@/hooks/usePhoneAuth';

export default function CustomPhoneAuth() {
  const { phoneNumber, setPhoneNumber, otp, setOtp, sendOTP, verifyOTP, loading, error } = usePhoneAuth();

  const handleSend = async (e) => {
    e.preventDefault();
    try {
      await sendOTP(phoneNumber);
      // Chuyển sang bước nhập OTP
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <form onSubmit={handleSend}>
      <input
        type="tel"
        value={phoneNumber}
        onChange={(e) => setPhoneNumber(e.target.value)}
        placeholder="+84901234567"
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Đang gửi...' : 'Gửi OTP'}
      </button>
    </form>
  );
}
```

---

## 🧪 TEST KHÔNG TỐN PHÍ

### Số Test Có Sẵn

| Số Điện Thoại | Mã OTP | Ghi Chú |
|---------------|--------|--------|
| `+84901234567` | `123456` | Firebase demo |
| `+84987654321` | `654321` | (Tùy setup) |

### Cách Setup Thêm Số Test

1. Firebase Console → **Authentication**
2. **Phone Numbers Tab**
3. **Add phone number**
4. Nhập: `+84901234567`
5. Nhập: `123456`
6. **Save** ✅

> ⚠️ **Lưu ý**: Chỉ dùng khi `NODE_ENV === 'development'`

---

## 📝 API Reference

### usePhoneAuth Hook

```javascript
const {
  // State
  phoneNumber,        // string
  setPhoneNumber,     // (phone) => void
  otp,                // string (6 digits)
  setOtp,             // (code) => void
  loading,            // boolean
  error,              // string
  success,            // string
  verificationId,     // string (debug only)

  // Methods
  sendOTP,            // async (phone) => Promise
  verifyOTP,          // async (otp) => Promise<UserCredential>
  reset,              // () => void
} = usePhoneAuth();
```

### PhoneAuthService Class

```javascript
import { PhoneAuthService } from '@/services/phoneAuth.service';
import { auth } from '@/services/firebase';

const phoneAuth = new PhoneAuthService(auth);

// Khởi tạo Recaptcha
await phoneAuth.initRecaptcha('recaptcha-container');

// Gửi OTP
const verificationId = await phoneAuth.sendOTP('+84901234567');

// Xác nhận OTP
const userCredential = await phoneAuth.verifyOTP('123456');

// Clear Recaptcha
phoneAuth.clearRecaptcha();
```

---

## ⚠️ Xử Lý Lỗi

### Lỗi Phổ Biến

```javascript
try {
  await sendOTP('+84901234567');
} catch (error) {
  switch (error.message) {
    case 'Invalid phone number format. Use E.164: +84901234567':
      console.log('Định dạng số sai');
      break;
    case 'Quota exceeded':
      console.log('Quá nhiều thử, thử lại sau');
      break;
    case 'Invalid verification code':
      console.log('Mã OTP sai');
      break;
    default:
      console.log(error.message);
  }
}
```

---

## 🔒 Bảo Mật

### 1. Bảo vệ API Key

Tạo `.env.local`:

```env
VITE_FIREBASE_API_KEY=xxx
VITE_FIREBASE_AUTH_DOMAIN=xxx
VITE_FIREBASE_PROJECT_ID=xxx
```

Thêm vào `.gitignore`:

```
.env.local
.env
.env.*.local
```

### 2. Giới Hạn API Calls

**Firebase Console → Settings → API Keys**
- Restrict key to only Authentication API
- Set application restrictions

### 3. Firestore Rules (Optional)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{document=**} {
      allow read, write: if 
        request.auth != null && 
        request.auth.token.phone_number_verified == true;
    }
  }
}
```

---

## 📱 Định Dạng Số Điện Thoại (E.164)

```
✅ Valid:
+84901234567    (Việt Nam)
+14155552671    (USA)
+441234567890   (UK)
+86 13800138000 (China)

❌ Invalid:
84901234567     (Thiếu +)
+84 901 234 567 (Có space)
09012345678     (Format cũ)
```

---

## 🐛 Debug Mode

### In Console Logs

Tất cả methods đều in logs:

```javascript
// Logs:
// ✅ Recaptcha initialized
// 📱 Sending OTP to: +84901234567
// ✅ OTP sent successfully
// 🔑 Verifying OTP...
// ✅ OTP verified successfully
// ❌ Lỗi gửi OTP: auth/invalid-phone-number
```

### Kiểm Tra Verification ID (Dev only)

Xem `PhoneAuthExample.jsx` - debug info section

---

## 🎯 Ví Dụ Hoàn Chỉnh

### Integration với AuthContext

```jsx
// contexts/AuthContext.jsx
import usePhoneAuth from '../hooks/usePhoneAuth';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const { phoneNumber, setPhoneNumber, otp, setOtp, sendOTP, verifyOTP, loading, error } = usePhoneAuth();
  
  const handlePhoneLogin = async (phone) => {
    try {
      await sendOTP(phone);
      // Chuyển sang step nhập OTP
    } catch (err) {
      console.error(err);
    }
  };

  const handlePhoneVerify = async (code) => {
    try {
      const userCredential = await verifyOTP(code);
      // Lưu user đăng nhập
      // Redirect trang chủ
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AuthContext.Provider value={{ phoneNumber, setPhoneNumber, otp, setOtp, handlePhoneLogin, handlePhoneVerify, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
}
```

---

## 📚 Tài Liệu Tham Khảo

- [Firebase Phone Auth Docs](https://firebase.google.com/docs/auth/web/phone-auth)
- [RecaptchaVerifier API](https://firebase.google.com/docs/reference/js/auth.RecaptchaVerifier)
- [E.164 Format](https://en.wikipedia.org/wiki/E.164)

---

## ❓ FAQ

### Q: Tôi có thể dùng số thực khi test không?
**A**: Có, nhưng sẽ tốn phí SMS. Khuyên dùng số test không tốn tiền (xem phần "TEST KHÔNG TỐN PHÍ").

### Q: Lỗi "RecaptchaVerifier not initialized"?
**A**: Chắc chắn `<div id="recaptcha-container"></div>` có trong DOM.

### Q: Cách reset component?
**A**: Gọi `reset()` function, nó sẽ clear tất cả state.

### Q: Làm sao lấy user info sau khi verify?
**A**: Component trả về `UserCredential`, access `userCredential.user.phoneNumber`

---

## 🚀 NEXT STEPS

- [ ] Setup Firebase config
- [ ] Enable Phone Auth trong Console
- [ ] Thêm số test
- [ ] Import component vào page
- [ ] Test với số demo
- [ ] Deploy lên production

---

✅ **Happy coding!** 🎉
