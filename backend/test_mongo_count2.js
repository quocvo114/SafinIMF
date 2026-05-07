const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 }).then(async () => {
  console.log("Connected.");
  try {
    const db = mongoose.connection.db;
    const num = await db.collection('reports').countDocuments({});
    console.log("Exact count:", num);
  } catch (err) {
    console.error("Err:", err);
  }
  process.exit(0);
});
