/**
 * 🔥 Firebase Configuration
 * Config từ Firebase Console → Web App
 */

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBvPK7NTZKDUfwaehshN02hYC-1jhs7Nec",
  authDomain: "khoa-luan2026.firebaseapp.com",
  projectId: "khoa-luan2026",
  storageBucket: "khoa-luan2026.firebasestorage.app",
  messagingSenderId: "371297324316",
  appId: "1:371297324316:web:727e33394c32fd73f87ed9",
  measurementId: "G-1F1CZYDCJS",
};

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);

// Khởi tạo Auth
export const auth = getAuth(app);

export default app;

/**
 * 📖 HƯỚNG DẪN LẤY CONFIG:
 * 
 * 1. Vào https://console.firebase.google.com/
 * 2. Chọn project: "Khoa-Luan2026l"
 * 3. Click "Khoa-Luan2026l" → Project settings
 * 4. Scroll xuống tìm "Web apps"
 * 5. Click app của bạn → Copy config
 * 6. Paste vào file này
 * 
 * Ví dụ config:
{
  "apiKey": "AIzaSyD_YvbnH8Y_nXc9T3QvQ8-YQ5rR0_A",
  "authDomain": "khoa-luan2026l.firebaseapp.com",
  "projectId": "khoa-luan2026l",
  "storageBucket": "khoa-luan2026l.appspot.com",
  "messagingSenderId": "123456789012",
  "appId": "1:123456789012:web:abcdef1234567890"
}
 */
