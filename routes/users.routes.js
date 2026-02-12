const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: "No token" });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}

// GET /api/users (protected)
router.get("/", authMiddleware, async (req, res) => {
  const users = await User.find({}, { _id: 0, username: 1, firstname: 1, lastname: 1 }).sort({
    username: 1,
  });
  res.json({ users });
});

module.exports = router;
