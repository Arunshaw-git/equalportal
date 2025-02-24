const express = require("express");
const router = express.Router();
const fetchUser = require("../middleware/fetchUser");
const Post = require("../models/Post");
const multer = require("multer");
const { PythonShell } = require("python-shell");

let latestResults = null; // Store the latest results from Python script
let waitingClients = [];  // Store waiting responses for long polling

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

//chatgpt's help
// Route to get all posts
router.get("/", fetchUser, async (req, res) => {


  try {
    const posts = await Post.find(); // Fetch all posts from the database
    console.log(posts)
    res.json(posts );
  }catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


// Long Polling Route for Results
router.get("/results", async (req, res) => {
  if (latestResults) {
    res.json(latestResults); // Send results immediately if ready
  } else {
    waitingClients.push(res); // Store the response to be sent later

    // Timeout to prevent infinite waiting
    setTimeout(() => {
      waitingClients = waitingClients.filter(r => r !== res);
      res.json([]); // Send empty array if no results yet
    }, 30000); // 30 seconds timeout
  }
});

// Function to Run Python Script
async function runPythonScript() {
  let options = { mode: "text", pythonOptions: ["-u"] };

  try {
    const messages = await PythonShell.run("./scraper/newsCrossCheck.py", options);
    console.log("PythonShell Output:", messages);

    latestResults = JSON.parse(messages[0]); // Store results

    // Respond to all waiting clients
    waitingClients.forEach(res => res.json(latestResults));
    waitingClients = []; // Clear stored requests
  } catch (error) {
    console.error("Python script error:", error.message);
    
    // Respond to waiting clients with an error
    waitingClients.forEach(res => res.status(500).json({ error: "Failed to fetch results" }));
    waitingClients = []; // Clear stored request
  }
}
   
// Run the Python script periodically
setInterval(runPythonScript, 300000); // Every 60 seconds
module.exports = router;
