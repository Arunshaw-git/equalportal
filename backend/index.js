require('dotenv').config({ path: '../.env' }); // Load environment variables from .env file
const { connectToUsersDB, connectToPostsDB } = require('./db');
const express = require('express')
const cors = require('cors');
const multer = require('multer');
const app = express()
const path = require("path");
const port = process.env.PORT || 5000;
const helmet = require('helmet');
const fs = require('fs');
const uploadsDir = path.join(__dirname, 'uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

const allowedOrigins = [
  'https://localhost:3000', // Local development frontend
  'https://equalportal.netlify.app', // Deployed frontend URL
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

app.use(express.json())

// Ensure uploads directory exists

// Security middleware
app.use(helmet());
// Custom CSP configuration
app.use((req, res, next) => {
  res.setHeader("Content-Security-Policy", "script-src 'self' 'unsafe-inline' 'unsafe-eval'");
  next();
});

// Call both connection functions from db
connectToUsersDB();
connectToPostsDB();

app.use('/auth',require('./routes/auth'))
app.use('/', require('./routes/home'));

// Increase the size limit for incoming requests
app.use(express.json({ limit: '10mb' })); // Adjust size as needed
app.use(express.urlencoded({ limit: '10mb', extended: true })); 

const upload = multer({ dest: 'uploads/' })

app.use('/uploads',cors(), express.static(path.join(__dirname, 'uploads')));

// POST route for creating posts with file uploads
app.post('/create', upload.single('media'), async (req, res) => {
  console.log('File received:', req.file); // Log file info
  console.log('Destination path:', path.join(__dirname, 'uploads'));

  try {
    const { title, desc} = req.body;
    const media = req.file ? req.file.filename : null; // Ensure only the filename is saved
    
    console.log(req.file); // Log file info to console
    console.log(req.body); 

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const newPost = new Post({
      title,
      desc,
      media,
      upvotes: 0,
      comments :[],
      share:0,
      creation_date : Date.now(),
    });
    const savedPost = await newPost.save();
    
    res.status(201).json(savedPost);
  } catch (error) {
    console.error('Error creating post:', error);
    if (error instanceof multer.MulterError) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to create post' });
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})                         