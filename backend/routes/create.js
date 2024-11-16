// backend/routes/post.js
const express = require("express");
const router = express.Router();
const fetchUser = require("../middleware/fetchUser");
const cloudinary = require("../config/cloudinary");
const Post = require("../models/Post");

router.post('/', fetchUser,  async (req, res) => {
  try {
    const { title, desc, media } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }

    // Create a new post
    const newPost = new Post({
      title,
      desc,
      media,
      share: 0,
      upvote: 0,
      comments: [],
      creation_date: Date.now(),
      user: req.user.id,
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
