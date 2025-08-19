const express = require("express");
const Comments = require("../models/Comments");
const Post = require("../models/Post");
const fetchUser = require("../middleware/fetchUser");
const router = express.Router();

router.post("/:postId/comment", fetchUser, async (req, res) => {
  try {
    const { postId } = req.params;
    const { text } = req.body;
    const newComment = new Comments({
      text,
      author: req.user.id,
      post: postId,
      upvotes: [],
      downvotes: [],
    });

    const savedComment = await newComment.save();

    await Post.findByIdAndUpdate(
      postId,
      { $push: { comments: savedComment._id } },
      { new: true }
    );

    res.status(200).json(savedComment);
  } catch (error) {
    console.log("Error while saving comment: ", error);
    res.status(500).send("Internal server error while saving comment");
  }
});

module.exports = router;
