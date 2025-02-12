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
  let results = "";
  let success = false;
  let options = {
    mode: "text",
    pythonOptions: ["-u"], // Unbuffered output for real-time logging
  };

  try {
    const messages = (PythonShell.run(
      "./scraper/newsCrossCheck.py",
      options
    ).results = JSON.parse(messages.join(""))); // Convert Python output to JSON
    success = true;

    const posts = await Post.find(); // Fetch all posts from the database
    res.json({ posts, success, results }); // Send the posts as a JSON response
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

module.exports = router;
