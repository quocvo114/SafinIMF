const axios = require('axios');
require('dotenv').config();

async function test() {
  console.log("Starting test...");
  try {
    const res = await axios.patch('http://localhost:5050/api/reports/1/status', {}, {
      timeout: 3000
    });
    console.log("Success:", res.data);
  } catch (err) {
    console.error("Error:", err.response ? err.response.data : err.message);
  }
}
test();
