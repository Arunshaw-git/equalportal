// backend/routes/post.js
const express = require("express");
const router = express.Router();
const fetchUser = require("../middleware/fetchUser");
const cloudinary = require("../config/cloudinary");
const Post = require("../models/Post");
const upload = require("../config/multer"); // multer configuration

router.post('/create', fetchUser, upload.single("media"), async (req, res) => {
  try {
    const { title, desc } = req.body;
    let mediaUrl = null;
    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }

    if (req.file) {
      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "equalPortal/posts",
      });
      mediaUrl = result.secure_url; 
       // Remove the file from server after uploading to Cloudinary
       fs.unlink(req.file.path, (err) => {
        if (err) console.error("Failed to delete local file:", err);
      });
    }

    // Create a new post
    const newPost = new Post({
      title,
      desc,
      media: mediaUrl,
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
