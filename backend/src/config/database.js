const mongoose = require("mongoose");
const User = require("../services/user/user.model");

const RETRY_DELAY_MS = 10000;
let retryTimer = null;

async function ensureEmailIndex() {
  const collection = User.collection;
  const indexes = await collection.indexes();
  const emailIndex = indexes.find((idx) => idx.name === "email_1");

  const isExpectedSparseUnique =
    emailIndex && emailIndex.unique === true && emailIndex.sparse === true;

  if (emailIndex && !isExpectedSparseUnique) {
    await collection.dropIndex("email_1");
    console.log("ℹ️ Dropped legacy email_1 index");
  }

  // Dọn dữ liệu rỗng để không vi phạm unique index.
  await collection.updateMany(
    { $or: [{ email: "" }, { email: null }] },
    { $unset: { email: "" } },
  );

  await collection.createIndex(
    { email: 1 },
    {
      name: "email_1",
      unique: true,
      sparse: true,
    },
  );
  console.log("✅ Ensured sparse unique email_1 index");
}

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!mongoUri) {
    console.error(
      "Missing MONGO_URI/MONGODB_URI in .env. Configure MongoDB to enable DB features.",
    );
    return false;
  }

  try {
    const conn = await mongoose.connect(mongoUri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    await ensureEmailIndex();
    return true;
  } catch (err) {
    console.error("MongoDB Connection Error:", err.message);
    if (!retryTimer) {
      // Retry later instead of crashing the server.
      retryTimer = setTimeout(() => {
        retryTimer = null;
        connectDB();
      }, RETRY_DELAY_MS);
    }
    return false;
  }
};

module.exports = connectDB;
