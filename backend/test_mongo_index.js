const mongoose = require('mongoose');
const Report = require('./src/models/Report');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 }).then(async () => {
  console.log("Connected.");
  try {
    Report.on('index', error => {
      if (error) {
        console.error("Index build error:", error);
      } else {
        console.log("Index build success");
      }
    });
    console.log("Waiting for index event...");
  } catch (err) {
    console.error("Query err:", err);
  }
});
