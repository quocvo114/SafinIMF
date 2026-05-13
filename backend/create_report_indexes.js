// Script tạo index cho collection reports để tối ưu tốc độ truy vấn
// Không thay đổi logic hay giao diện, chỉ giúp MongoDB truy vấn nhanh hơn

const mongoose = require("mongoose");
require("dotenv").config();

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/your_db_name";

async function createIndexes() {
  await mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  const collection = mongoose.connection.collection("reports");
  await Promise.all([
    collection.createIndex({ type: 1 }),
    collection.createIndex({ status: 1 }),
    collection.createIndex({ location: 1 }),
    collection.createIndex({ createdAt: -1 }),
    collection.createIndex({ title: 1 }),
    collection.createIndex({ id: 1 }),
    collection.createIndex({ report_id: 1 }),
  ]);
  console.log("Indexes created successfully!");
  await mongoose.disconnect();
}

createIndexes().catch((err) => {
  console.error("Error creating indexes:", err);
  process.exit(1);
});
