/**
 * 📱 Phone Auth API Client
 * Call Backend API để lưu SĐT xác thực từ Firebase
 */

import axiosClient from './axiosClient';

/**
 * 📤 Liên kết SĐT xác thực từ Firebase
 *
 * @param {string} phoneNumber - SĐT từ Firebase (+84901234567)
 * @param {string} uid - Firebase UID
 * @param {string} token - Firebase ID Token
 * @returns {Promise<Object>}
 *
 * API Endpoint: POST /api/phone/link
 */
export const linkPhoneNumber = async (phoneNumber, uid, token) => {
  try {
    console.log(`📱 [API] Linking phone: ${phoneNumber}`);

    const response = await axiosClient.post(
      '/phone/link',
      {
        phoneNumber,
        uid,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`, // Firebase token
        },
      }
    );

    console.log('✅ Phone linked successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Link phone error:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

/**
 * 🔍 Kiểm tra trạng thái xác thực SĐT
 *
 * @param {string} token - Firebase ID Token
 * @returns {Promise<Object>}
 *
 * API Endpoint: GET /api/phone/verify-status
 */
export const checkPhoneVerifyStatus = async (token) => {
  try {
    console.log('🔍 [API] Checking phone verify status');

    const response = await axiosClient.get('/phone/verify-status', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log('✅ Verify status:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Check status error:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

/**
 * 🗑️ Hủy liên kết SĐT
 *
 * @param {string} token - Firebase ID Token
 * @returns {Promise<Object>}
 *
 * API Endpoint: DELETE /api/phone/unlink
 */
export const unlinkPhoneNumber = async (token) => {
  try {
    console.log('🗑️ [API] Unlinking phone');

    const response = await axiosClient.delete('/phone/unlink', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log('✅ Phone unlinked:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Unlink error:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

export default {
  linkPhoneNumber,
  checkPhoneVerifyStatus,
  unlinkPhoneNumber,
};
