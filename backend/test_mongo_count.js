const mongoose = require('mongoose');
require('dotenv').config();
const Report = require('./src/models/Report');

mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 }).then(async () => {
  console.log("Connected.");
  try {
    const db = mongoose.connection.db;
    const stats = await db.collection('reports').stats();
    console.log("Collection stats:", stats.count, "documents, size:", stats.size);
    const num = await db.collection('reports').countDocuments({});
    console.log("Exact count:", num);
  } catch (err) {
    console.error("Err:", err);
  }
  process.exit(0);
});
