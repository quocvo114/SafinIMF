const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const token = jwt.sign({ id: 1, role: 'admin' }, process.env.JWT_SECRET || 'test_secret', { expiresIn: '1h' });

async function test() {
  try {
    const res = await axios.patch('http://localhost:5050/api/reports/1/status', {
      status: "Đang Xử Lý",
      handlingTeamId: "traffic-1",
      handlingTeamName: "Đội Giao Thông 1"
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Success:", res.data);
  } catch (err) {
    console.error("Error:", err.response ? err.response.data : err.message);
  }
}
test();
