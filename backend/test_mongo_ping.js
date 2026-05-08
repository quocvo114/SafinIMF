const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 }).then(async () => {
  console.log("Connected. Pinging...");
  try {
    const ping = await mongoose.connection.db.admin().ping();
    console.log("Ping:", ping);
  } catch (err) {
    console.error("Ping err:", err);
  }
  process.exit(0);
});
