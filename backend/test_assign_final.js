const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const token = jwt.sign({ id: 1, role: 'admin' }, process.env.JWT_SECRET || 'test_secret', { expiresIn: '1h' });

async function test() {
  console.log("Starting test...");
  const start = Date.now();
  try {
    const res = await axios.patch('http://localhost:5050/api/reports/RPT-1778064090713-979/status', {
      status: "Đang Xử Lý",
      handlingTeamId: "traffic-1",
      handlingTeamName: "Đội Giao Thông 1"
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Success in", Date.now() - start, "ms. Data:", res.data);
  } catch (err) {
    console.error("Error in", Date.now() - start, "ms. Err:", err.response ? err.response.data : err.message);
  }
}
test();
