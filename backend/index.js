require('dotenv').config({ path: '../.env' }); // Load environment variables from .env file
const { connectToUsersDB, connectToPostsDB } = require('./db');
const express = require('express')
const cors = require('cors');
const multer = require('multer');
const app = express()
const port = process.env.PORT || 5000;
app.use(cors({
  origin: 'http://localhost:5000/', // Specify your frontend URL here
  credentials: true,
}));
app.use(express.json())

// Call both connection functions
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
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/; // Allowed image file types
  const extname = allowedTypes.test(file.mimetype); // Check mimetype
  const mimetype = allowedTypes.test(file.originalname.split('.').pop().toLowerCase()); // Check extension

  if (extname && mimetype) {
    return cb(null, true); // Accept file
  } else {
    cb(new Error('Only .png, .jpg, .jpeg, and .gif files are allowed!'), false); // Reject file
  }
};

const upload = multer({ storage: storage, limits: { fileSize: 50 * 1024 * 1024 } });
app.use('/auth',require('./routes/auth'))
app.use('/', require('./routes/home'));

// POST route for creating posts with file uploads
app.post('/create', upload.single('media'), (req, res) => {
  try {
    const { title, desc } = req.body;
    const media = req.file;

    // Send back media file's path
    res.status(201).json({
      message: 'Post created successfully',
      post: {
        title,
        desc,
        media: `/uploads/${media.filename}`, // Return correct relative path
      },
    });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});


app.use('/uploads', express.static(__dirname + '/uploads'));

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})                         