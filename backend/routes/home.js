const express = require('express');
const router = express.Router();
const fetchUser = require("../middleware/fetchUser");
const Post = require('../models/Post');
const multer = require('multer');

//chatgpt 
// Set up multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/'); // Specify the directory to save uploaded files
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + '-' + file.originalname); // Create a unique filename
    },
  });
  
  const upload = multer({ storage: storage });
  
//chatgpt 
// Route to get all posts
router.get('/', fetchUser, async (req, res) => {
    try {
        const posts = await Post.find(); // Fetch all posts from the database
        res.json(posts); // Send the posts as a JSON response
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }
});
  
module.exports = router;
