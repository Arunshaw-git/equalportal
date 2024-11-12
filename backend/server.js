require('dotenv').config({ path: '../.env' }); // Load environment variables from .env file
const express = require('express')
const cors = require('cors');
const helmet = require('helmet');
const fs = require('fs');
const upload = require("./config/multer");
const bodyParser = require("body-parser");
const cloudinary = require('./config/cloudinary');
const path = require("path");

const { connectToUsersDB, connectToPostsDB } = require('./db');

const createRoutes = require("./routes/create");
const authRoutes = require("./routes/auth");
const homeRoutes = require("./routes/home");

const app = express()
const port = process.env.PORT || 5001;

const uploadsDir = path.join(__dirname, 'uploads')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

const allowedOrigins = [
  'http://localhost:3000', // Local development frontend
  'https://equalportal.netlify.app', 
  // Deployed frontend URL
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'DELETE','PUT'], // Allowed HTTP methods
}));

// Security middleware
app.use(helmet());
// Custom CSP configuration
app.use((req, res, next) => {
  res.setHeader("Content-Security-Policy", "script-src 'self' 'unsafe-inline' 'unsafe-eval'");
  next();
});

// JSON and URL-encoded parsers
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.urlencoded({ extended: true }));

// Use multer for handling multipart/form-data
app.use(upload.single("media"));

// Route handling
app.use("/create", createRoutes);
app.use("/auth", authRoutes);
app.use("/", homeRoutes);

// Call both connection functions from db
connectToUsersDB();
connectToPostsDB();

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something went wrong!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})                         