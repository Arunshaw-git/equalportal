const express = require("express");
const router = express.Router();
const fetchUser = require("../middleware/fetchUser");
const Post = require("../models/Post");
const multer = require("multer");
const { PythonShell } = require("python-shell");

//chatgpt
// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Specify the directory to save uploaded files
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname); // Create a unique filename
  },
});

const upload = multer({ storage: storage });

//chatgpt
// Route to get all posts
router.get("/", fetchUser, async (req, res) => {
  let success = false;
  let options = {
    mode: "text", pythonOptions: ["-u"], // Unbuffered output for real-time logging
  };

  try {
   
    const posts = await Post.find(); // Fetch all posts from the database
    let results = [];
    try {
      const messages = await PythonShell.run("./scraper/newsCrossCheck.py", options);
      results = JSON.parse(messages.join("")); // Convert Python output to JSON
    } catch (pyError) {
      console.error("Python script error:", pyError.message);
      results = new Array(posts.length).fill(""); // Fill results with empty values to match posts
    }

    res.json({ posts, success:true, results}); 
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

module.exports = router;
