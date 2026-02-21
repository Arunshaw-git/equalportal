const express = require("express");
const router = express.Router();
const fetchUser = require("../middleware/fetchUser");
const Post = require("../models/Post");
const User = require("../models/User");

const escapeRegExp = (value = "") => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

router.get("/search", fetchUser, async (req, res) => {
  try {
    const rawQuery = String(req.query.q || "").trim();
    if (!rawQuery) {
      return res.json({ query: "", users: [], posts: [] });
    }

    const regex = new RegExp(escapeRegExp(rawQuery), "i");

    const [users, posts] = await Promise.all([
      User.find({
        $or: [{ name: regex }, { userName: regex }, { email: regex }],
      })
        .select("name userName email profilePicture followers following createdAt")
        .limit(12),
      Post.find({
        $or: [{ title: regex }, { desc: regex }],
      })
        .select("title desc media author comments upvotes downvotes createdAt newsOrNot")
        .populate("author", "name userName profilePicture")
        .sort({ createdAt: -1 })
        .limit(20),
    ]);

    res.json({
      query: rawQuery,
      users,
      posts,
    });
  } catch (error) {
    console.error("Error while searching:", error);
    res.status(500).json({ error: "Failed to search" });
  }
});

module.exports = router;
