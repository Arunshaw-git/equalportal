require('dotenv').config({ path: '../.env' }); // Load environment variables from .env file
const { connectToUsersDB, connectToPostsDB } = require('./db');
const express = require('express')
const cors = require('cors');
const multer = require('multer');
const app = express()
const port = process.env.PORT || 5000;

const helmet = require('helmet');

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

// Increase the size limit for incoming requests
app.use(express.json({ limit: '10mb' })); // Adjust size as needed
app.use(express.urlencoded({ limit: '10mb', extended: true })); 
// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Specify the directory to save uploaded files
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname); // Create a unique filename
  },
});
// File filter to only allow images


const upload = multer({ storage: storage, limits: { fileSize: 50 * 1024 * 1024 } });
app.use('/auth',require('./routes/auth'))
app.use('/', require('./routes/home'));

// POST route for creating posts with file uploads
app.post('/create', upload.single('media'), async (req, res) => {
  try {
    const { title, desc } = req.body; // Extract title and description from body
    const media = req.file; // Get the uploaded file
    const newPost = new Post({
      title,
      desc,
      media: media.filename, // Store the relative path in DB
    });
    const savedPost = await newPost.save();
    // Send back media file's path
    res.status(201).json( savedPost);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});


app.use('/uploads',cors(), express.static(__dirname + '/uploads'));

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})                         