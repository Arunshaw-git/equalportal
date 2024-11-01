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

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Specify the directory to save uploaded files
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
// Initialize multer with the defined storage configuration
const upload = multer({ storage: storage });

app.use('/uploads',cors(), express.static(path.join(__dirname, 'uploads')));

// POST route for creating posts with file uploads
app.post('/create', upload.single('media'), async (req, res) => {
  try {
    const { title, desc} = req.body;
    const media = req.file ? path.basename(req.file.path) : null; // Get the media file path if available
 
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