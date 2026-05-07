const mongoose = require('mongoose');
mongoose.set('autoIndex', false);
const Report = require('./src/models/Report');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 }).then(async () => {
  console.log("Connected. Querying...");
  const start = Date.now();
  await Report.findOne({ id: "1" });
  console.log("findOne({ id: '1' }) took", Date.now() - start, "ms");
  
  const start2 = Date.now();
  await Report.findOne({ report_id: 1 });
  console.log("findOne({ report_id: 1 }) took", Date.now() - start2, "ms");
  
  process.exit(0);
});
