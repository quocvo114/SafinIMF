/**
 * 🧪 TEST Page - Firebase Phone Auth
 * Test riêng, không ảnh hưởng hệ thống cũ
 */

import React from 'react';
import PhoneAuthExample from '../components/PhoneAuthExample';

export default function TestPhoneAuth() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-blue-600 text-white py-4 px-6">
        <h1 className="text-2xl font-bold">🧪 Test Firebase Phone Auth</h1>
        <p className="text-blue-100">Test số: +84901234567 | Mã OTP: 123456</p>
      </div>

      {/* Content */}
      <div className="py-12">
        <PhoneAuthExample />
      </div>

      {/* Info */}
      <div className="bg-white border-t border-gray-200 py-8 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-bold mb-4">ℹ️ Hướng Dẫn</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Column 1 */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-bold text-blue-900 mb-2">📱 Bước 1: Gửi OTP</h3>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Nhập: <code className="bg-white px-2 py-1 rounded">+84901234567</code></li>
                <li>Click "Gửi OTP"</li>
                <li>Firebase xác thực</li>
              </ol>
            </div>

            {/* Column 2 */}
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-bold text-green-900 mb-2">🔑 Bước 2: Xác Nhận</h3>
              <ol className="text-sm text-green-800 space-y-1 list-decimal list-inside">
                <li>Nhập: <code className="bg-white px-2 py-1 rounded">123456</code></li>
                <li>Click "Xác Nhận"</li>
                <li>Backend lưu SĐT</li>
              </ol>
            </div>

            {/* Column 3 */}
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-bold text-purple-900 mb-2">✅ Kết Quả</h3>
              <ul className="text-sm text-purple-800 space-y-1">
                <li>✅ Firebase verify OTP</li>
                <li>✅ Backend lưu vào DB</li>
                <li>✅ phone_verified = true</li>
              </ul>
            </div>

            {/* Column 4 */}
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="font-bold text-yellow-900 mb-2">💡 Lưu Ý</h3>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• Mã test FREE (không tốn tiền)</li>
                <li>• Chỉ hoạt động ở development</li>
                <li>• Sau đó integrate vào Register</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
