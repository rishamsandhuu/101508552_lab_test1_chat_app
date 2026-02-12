const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "username is required"],
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
      match: [/^[a-zA-Z0-9_]+$/, "username can contain letters, numbers, _ only"],
    },
    firstname: { type: String, required: true, trim: true, maxlength: 50 },
    lastname: { type: String, required: true, trim: true, maxlength: 50 },
    password: { type: String, required: true, minlength: 4 },
    createon: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

module.exports = mongoose.model("User", userSchema);
