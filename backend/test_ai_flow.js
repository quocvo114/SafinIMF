const axios = require('axios');
const fs = require('fs');

async function testCreateReport() {
  // A tiny 1x1 transparent PNG in base64
  const dummyBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
  
  const payload = {
    title: "Test AI and Scoring Flow",
    type: "Giao Thông", // Use a valid type
    location: "Hải Châu, Đà Nẵng",
    description: "Đường nứt nguy hiểm cần sửa chữa gấp", // Strong keywords for high content score
    images: [dummyBase64],
    userId: "650a1b2c3d4e5f6a7b8c9d0e", // Dummy MongoID
    lat: 16.0544, // In Da Nang
    lng: 108.2022
  };

  try {
    const res = await axios.post('http://localhost:5050/api/reports', payload);
    console.log("✅ SUCCESS:");
    console.log(JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error("❌ ERROR:");
    if (err.response) {
      console.error(JSON.stringify(err.response.data, null, 2));
    } else {
      console.error(err.message);
    }
  }
}

testCreateReport();
