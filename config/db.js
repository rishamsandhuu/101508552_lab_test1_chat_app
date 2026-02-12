const mongoose = require("mongoose");

async function connectDB(MONGO_URI) {
  try {
    mongoose.set("strictQuery", true);
    await mongoose.connect(MONGO_URI);
    console.log(":D MongoDB connected");
  } catch (err) {
    console.error("XP MongoDB connection failed:", err.message);
    process.exit(1);
  }
}

module.exports = connectDB;
