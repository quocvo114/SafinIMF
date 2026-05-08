const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const token = jwt.sign({ id: 1, role: 'admin' }, process.env.JWT_SECRET || 'test_secret', { expiresIn: '1h' });

async function test() {
  console.log("Starting test...");
  try {
    const res = await axios.get('http://localhost:5050/api/reports/1', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Success getById:", res.data ? "ok" : "empty");
  } catch (err) {
    console.error("Error getById:", err.response ? err.response.data : err.message);
  }
}
test();
