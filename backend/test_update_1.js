const mongoose = require('mongoose');
mongoose.set('autoIndex', false);
const Report = require('./src/models/Report');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 }).then(async () => {
  console.log("Connected. Updating...");
  const start = Date.now();
  try {
    const res = await Report.findOneAndUpdate(
      { $or: [{ id: "1" }, { report_id: 1 }] },
      { status: "Đang Xử Lý" },
      { new: true }
    );
    console.log("Update result in", Date.now() - start, "ms:", !!res);
  } catch (err) {
    console.error("Update err:", err);
  }
  process.exit(0);
});
