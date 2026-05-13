/**
 * 📱 SMS Service (Mock Mode Only)
 * - mock: Log OTP ra console (dev mode - KHÔNG tốn tiền)
 * OTP sẽ hiển thị trên terminal backend để test
 */

class SMSService {
  constructor() {
    this.mode = (process.env.SMS_MODE || 'mock').toLowerCase();
    console.log(`🔧 SMS Service initialized in ${this.mode.toUpperCase()} mode`);
  }

  /**
   * 📤 Gửi SMS (Mock mode only)
   * @param {string} phone - Số điện thoại (format: 0971234567)
   * @param {string} message - Nội dung tin nhắn
   * @returns {Promise<Object>} { success: bool, mock: bool }
   */
  async sendSMS(phone, message) {
    try {
      // ===== MOCK MODE: Chỉ log ra console =====
      const timestamp = new Date().toISOString();
      console.log('\n');
      console.log('╔════════════════════════════════════════════════════════╗');
      console.log('║                  📱 SMS MOCK MODE                      ║');
      console.log('╠════════════════════════════════════════════════════════╣');
      console.log(`║ 📞 Phone:        ${phone.padEnd(44)} ║`);
      console.log(`║ 📝 Message:      ${message.substring(0, 42).padEnd(42)} ║`);
      if (message.length > 42) {
        console.log(`║                  ${message.substring(42, 84).padEnd(42)} ║`);
      }
      console.log(`║ 🕐 Time:         ${timestamp.padEnd(44)} ║`);
      console.log(`║ 🔄 Mode:         MOCK (No API Call)${' '.repeat(25)} ║`);
      console.log('╚════════════════════════════════════════════════════════╝');
      console.log('\n');

      return {
        success: true,
        mock: true,
        message: 'SMS logged in mock mode - No API call made',
      };
    } catch (err) {
      console.error(`❌ [SMS] Send error: ${err.message}`);
      throw new Error(`Failed to send SMS: ${err.message}`);
    }
  }

  /**
   * 🔐 Gửi OTP
   * @param {string} phone - Số điện thoại
   * @param {string} otpCode - Mã OTP (6 chữ số)
   * @returns {Promise<Object>}
   */
  async sendOTP(phone, otpCode) {
    const message = `${otpCode} la ma xac minh dang ky Urban Infrastructure cua ban`;
    console.log(`🔐 Generating OTP message for ${phone}: ${otpCode}`);
    return await this.sendSMS(phone, message);
  }
}

// 🔌 Export class (NOT instantiated)
module.exports = SMSService;
