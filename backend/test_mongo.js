const mongoose = require('mongoose');
require('dotenv').config();

console.log("Connecting to:", process.env.MONGO_URI);
mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 }).then(() => {
  console.log("Connected successfully");
  process.exit(0);
}).catch(err => {
  console.error("Connection error:", err);
  process.exit(1);
});
