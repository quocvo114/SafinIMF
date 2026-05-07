const mongoose = require('mongoose');
mongoose.set('autoIndex', false);
const Report = require('./src/models/Report');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 }).then(async () => {
  console.log("Connected. Querying all...");
  try {
    const res = await Report.find({}).limit(1);
    console.log("Query result length:", res.length);
  } catch (err) {
    console.error("Query err:", err);
  }
  process.exit(0);
});
