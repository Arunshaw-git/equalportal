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

//route 2: create post (chatgpt)
router.post('/create', fetchUser, upload.single('media'), async (req, res) => {
    try {
      const { title, desc } = req.body;
      const media = req.file ? req.file.path : null; // Get the media file path
  
      // Check if the required fields are provided
      if (!title) {
        return res.status(400).json({ error: "Title is required" });
      }
  
      // Create a new post
      const newPost = new Post({
        title,
        desc,
        media, // Save the media path
        share: 0,
        upvote: 0, // Initial upvotes as zero
        comments: [], // Initial comments as an empty array
        creation_date: Date.now(),
        user: req.user.id, // Associate the post with the logged-in user
      });
  
      // Save the post to the database
      const savedPost = await newPost.save();
      res.json(savedPost); // Respond with the created post
  
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Internal Server Error");
    }
  });
  
module.exports = router;
