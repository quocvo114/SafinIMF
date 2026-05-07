const mongoose = require('mongoose');
const Report = require('./src/models/Report');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 }).then(async () => {
  console.log("Connected. Querying...");
  try {
    const res = await Report.findOne({ $or: [{ id: "1" }, { report_id: 1 }] });
    console.log("Query result:", !!res);
  } catch (err) {
    console.error("Query err:", err);
  }
  process.exit(0);
});
