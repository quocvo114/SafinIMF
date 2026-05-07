const mongoose = require('mongoose');
const Report = require('./src/models/Report');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 }).then(async () => {
  console.log("Connected. Counting...");
  try {
    const res = await Report.countDocuments();
    console.log("Count:", res);
  } catch (err) {
    console.error("Query err:", err);
  }
  process.exit(0);
});
