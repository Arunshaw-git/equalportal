require("dotenv").config({ path: "../.env" });
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const fs = require("fs");
const cloudinary = require("./config/cloudinary");
const path = require("path");
const { Server } = require("socket.io");
const http = require("http"); // Import http module for the server
const jwt = require("jsonwebtoken");

const connectToDB = require("./db");
const createRoutes = require("./routes/create");
const authRoutes = require("./routes/auth");
const homeRoutes = require("./routes/home");
const posts_scrape = require("./routes/posts_scrape");
const profile = require("./routes/profile");
const votes = require("./routes/votes");
const comment = require("./routes/comment");
const follow = require("./routes/follow");
const message = require("./routes/message");

const Message = require("./models/Message"); // Import your Message model
const Convo = require("./models/Conversation");

const app = express();
const port = process.env.PORT || 5001;

const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}
const server = http.createServer(app);

const allowedOrigins = [
  "http://localhost:3000", // Local development frontend
  "https://equalportal.netlify.app", // Deployed frontend URL
  "null", // Allow for file:// URL access (if testing locally without server)
];

// Security middleware
app.use(helmet());
app.use(express.json()); // Do not need this for FormData
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Custom CSP configuration
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
  );
  next();
});

app.use((req, res, next) => {
  console.log(`Method: ${req.method} URL: ${req.originalUrl}`);
  next();
});

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "DELETE", "PUT"], // Allowed HTTP methods
  })
);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
  pingTimeout: 60000, // 1 minute
  pingInterval: 25000,
});
// Route handling
// Route handling with base URL prefixes
app.use("/create", createRoutes);
app.use("/auth", authRoutes);
app.use("/", homeRoutes);
app.use("/", posts_scrape);
app.use("/", profile);
app.use("/", votes);
app.use("/", comment);
app.use("/", follow);
app.use("/message", message);

connectToDB();

let onlineUsers = new Map();
io.use((socket, next) => {
  const token = socket.handshake.auth.token; // token from client
  if (!token) return next(new Error("Authentication error"));

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.user.id; // attach userId to socket
    next();
  } catch (err) {
    next(new Error("Token invalid"));
  }
});

io.on("connection", (socket) => {
  console.log("User Connected:", socket.id);

  socket.on("join", (userId) => {
    onlineUsers.set(userId, socket.id);
    console.log("Online Users:", userId);
  });

  socket.on("sendMessage", async ({ sender, receiver, text }) => {
    try {
      const sender = socket.userId;
      // Create message in the database
      const message = new Message({ sender, receiver, text });
      await message.save();

      // Find or create the conversation
      let conversation = await Convo.findOne({
        participants: { $all: [sender, receiver] },
      });

      if (!conversation) {
        conversation = new Convo({
          participants: [sender, receiver],
          messages: [message._id],
        });
        await conversation.save();
      } else {
        conversation.messages.push(message._id);
        await conversation.save();
      }

      // Emit the message to the receiver in real-time
      const receiverSocketId = onlineUsers.get(receiver);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("receiveMessage", message);
      }

      // Emit to the sender (optional: for feedback)
      socket.emit("messageSent", message);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  });

  // Handle disconnect event
  socket.on("disconnect", () => {
    onlineUsers.forEach((value, key) => {
      if (value === socket.id) {
        onlineUsers.delete(key);
        console.log("User disconnected:", key);
      }
    });
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something went wrong!");
});

server.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
