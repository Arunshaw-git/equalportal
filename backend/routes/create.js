const express = require("express");
const router = express.Router();
const fetchUser = require("../middleware/fetchUser");
const cloudinary = require("../config/cloudinary");
const Post = require("../models/Post");
const User = require("../models/User");

router.post('/', fetchUser,  async (req, res) => {
  try {
    const { title, desc, media } = req.body;
    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }
    const newPost = new Post({
      title,
      desc,
      media,
      upvotes: [],
      comments: [],
      author: req.user.id,
    });

    // Save the post to the database
    const savedPost = await newPost.save();

    await User.findByIdAndUpdate(
      req.user.id, 
      { $push: { posts: savedPost._id } }, // Add the post ID to the user's `posts` array
      { new: true }
    );

    res.json(savedPost); // Respond with the created post

  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
});

module.exports = router;
