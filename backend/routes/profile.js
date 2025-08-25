const express = require("express");
const User = require("../models/User");
const fetchUser = require("../middleware/fetchUser");
const router = express.Router();
const Post = require("../models/Post");

router.get("/profile/:id?", fetchUser, async (req, res) => {

  try {
    const userId = req.params.id || req.user.id
    let user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.log("Error from profile :", error);
    res.status(500).json("Internal error :", error);
  }
});



router.get("/posts/:id", fetchUser, async (req, res) => {
  const id = req.params.id;

  try {
    
    const user = await User.findById(id).select("posts").populate(
      {
        path: "posts",          // populate posts array
        populate: {
          path: "comments",     // populate comments inside each post
          populate: {
            path: "author",     // populate author inside comments
            select: "name profilePicture" // only select name and profilePicture
          }
        }
      }
    ); 

    if (!user) return res.status(404).json("User not found");

    res.json(user.posts);
  } catch (error) {
    console.error(error);
    res.status(500).json("An error occurred");
  }
});
module.exports = router;
