require("dotenv").config();
const path = require("path");
const http = require("http");
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");

const connectDB = require("./config/db");
const authRoutes = require("./routes/auth.routes");
const usersRoutes = require("./routes/users.routes");

const GroupMessage = require("./models/GroupMessage");
const PrivateMessage = require("./models/PrivateMessage");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

const PORT = process.env.PORT || 3000;

const ROOMS = ["devops", "cloud-computing", "covid19", "sports", "nodeJS"];

// middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/public", express.static(path.join(__dirname, "public")));

// serve HTML views
app.get("/", (req, res) => res.redirect("/login"));
app.get("/signup", (req, res) => res.sendFile(path.join(__dirname, "views", "signup.html")));
app.get("/login", (req, res) => res.sendFile(path.join(__dirname, "views", "login.html")));
app.get("/rooms", (req, res) => res.sendFile(path.join(__dirname, "views", "rooms.html")));
app.get("/chat", (req, res) => res.sendFile(path.join(__dirname, "views", "chat.html")));

// APIs
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);

// rooms list endpoint (public)
app.get("/api/rooms", (req, res) => res.json({ rooms: ROOMS }));

// Socket auth (token from localStorage)
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("No token"));
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = payload; // { username, firstname, lastname }
    next();
  } catch (err) {
    next(new Error("Invalid token"));
  }
});

io.on("connection", (socket) => {
  const username = socket.user.username;

  // Join a room
  socket.on("joinRoom", async ({ room }) => {
    if (!room) return;

    // leave previous room if tracked
    if (socket.currentRoom) socket.leave(socket.currentRoom);

    socket.join(room);
    socket.currentRoom = room;

    // send room history (last 50)
    const history = await GroupMessage.find({ room }).sort({ date_sent: 1 }).limit(50);
    socket.emit("roomHistory", history);

    socket.to(room).emit("systemMsg", { message: `${username} joined ${room}` });
  });

  // Leave room
  socket.on("leaveRoom", () => {
    if (socket.currentRoom) {
      const r = socket.currentRoom;
      socket.leave(r);
      socket.currentRoom = null;
      socket.emit("systemMsg", { message: `You left the room.` });
      socket.to(r).emit("systemMsg", { message: `${username} left ${r}` });
    }
  });

  // Group message
  socket.on("groupMessage", async ({ room, message }) => {
    if (!room || !message) return;
    if (socket.currentRoom !== room) return; // enforce room-only chat

    const doc = await GroupMessage.create({
      from_user: username,
      room,
      message,
      date_sent: new Date(),
    });

    io.to(room).emit("groupMessage", doc);
  });

  // Private message (1-to-1)
  socket.on("privateMessage", async ({ to_user, message }) => {
    if (!to_user || !message) return;
    if (to_user === username) return;

    const doc = await PrivateMessage.create({
      from_user: username,
      to_user,
      message,
      date_sent: new Date(),
    });

    // We emit to sender and receiver “private channel”
    // Use usernames as personal rooms for delivery
    io.to(`user:${to_user}`).emit("privateMessage", doc);
    io.to(`user:${username}`).emit("privateMessage", doc);
  });

  // typing indicator for private chat
  socket.on("privateTyping", ({ to_user, isTyping }) => {
    if (!to_user) return;
    io.to(`user:${to_user}`).emit("privateTyping", {
      from_user: username,
      isTyping: !!isTyping,
    });
  });

  // personal room to receive private messages
  socket.join(`user:${username}`);

  socket.on("disconnect", () => {
    // nothing special needed
  });
});

// start
(async () => {
  await connectDB(process.env.MONGO_URI);
  server.listen(PORT, () => console.log(`✅ Server running: http://localhost:${PORT}`));
})();
