const express = require("express");
const Post = require("../models/Post.js")
const fetchUser = require("../middleware/fetchUser.js");

const router = express.Router();

// Upvote endpoint
router.post("/upvotes/:id", fetchUser, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }

        const userId = req.user.id;
        const upvoteIndex = post.upvotes.indexOf(userId);
        const downvoteIndex = post.downvotes.indexOf(userId);

        // If already upvoted, remove upvote
        if (upvoteIndex !== -1) {
            post.upvotes.splice(upvoteIndex, 1);
        } 
        // If not upvoted, add upvote and remove downvote if exists
        else {
            if (downvoteIndex !== -1) {
                post.downvotes.splice(downvoteIndex, 1);
            }
            post.upvotes.push(userId);
        }

        await post.save();
        res.json(post);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error while upvoting" });
    }
});

// Downvote endpoint
router.post("/downvotes/:id", fetchUser, async (req, res) => {
    try {
        const userId = req.user.id;
        
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }

        const upvoteIndex = post.upvotes.indexOf(userId);
        const downvoteIndex = post.downvotes.indexOf(userId);

        // If already downvoted, remove downvote
        if (downvoteIndex !== -1) {
            post.downvotes.splice(downvoteIndex, 1);
        } 
        // If not downvoted, add downvote and remove upvote if exists
        else {
            if (upvoteIndex !== -1) {
                post.upvotes.splice(upvoteIndex, 1);
            }
            post.downvotes.push(userId);
        }

        await post.save();
        res.json(post);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error while downvoting" });
    }
});

module.exports = router;