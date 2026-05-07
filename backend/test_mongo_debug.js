const mongoose = require('mongoose');
mongoose.set('autoIndex', false);
mongoose.set('debug', true);
const Report = require('./src/models/Report');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 }).then(async () => {
  console.log("Connected. Querying...");
  const start = Date.now();
  try {
    const res = await Report.findOne({ $or: [{ id: "1" }, { report_id: 1 }] });
    console.log("Result in", Date.now() - start, "ms");
  } catch (err) {
    console.error("Update err:", err);
  }
  process.exit(0);
});
