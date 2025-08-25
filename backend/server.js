require('dotenv').config({ path: '../.env' }); 
const express = require('express')
const cors = require('cors');
const helmet = require('helmet');
const fs = require('fs');
const cloudinary = require('./config/cloudinary');
const path = require("path");


const connectToDB = require('./db');

const createRoutes = require("./routes/create");
const authRoutes = require("./routes/auth");
const homeRoutes = require("./routes/home");
const posts_scrape = require("./routes/posts_scrape");
const profile = require("./routes/profile");
const votes = require("./routes/votes");
const comment = require("./routes/comment");
const follow = require("./routes/follow");
const app = express()
const port = process.env.PORT || 5001;

const uploadsDir = path.join(__dirname, 'uploads')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

const allowedOrigins = [
  'http://localhost:3000', // Local development frontend
  'https://equalportal.netlify.app', // Deployed frontend URL
  'null'  // Allow for file:// URL access (if testing locally without server)

];
app.use((req,res,next)=>{
  console.log( `Method: ${req.method} URL: ${req.originalUrl}`);
  next();
});

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

app.use(express.json()); // Do not need this for FormData
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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
// Call both connection functions from db
connectToDB();

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something went wrong!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})                         
