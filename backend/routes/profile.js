const express = require("express");
const User = require("../models/User");
const fetchUser = require("../middleware/fetchUser");
const router = express.Router();
const Post = require("../models/Post");
const Comments = require("../models/Comments");
const Reaction = require("../models/Reaction");
const Notification = require("../models/Notification");

const isObjectIdEqual = (a, b) => String(a) === String(b);

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

const updateProfilePicture = async (req, res) => {
  try {
    const { profilePicture } = req.body;
    if (!profilePicture || typeof profilePicture !== "string") {
      return res.status(400).json({ error: "Valid profile picture URL is required" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { profilePicture: profilePicture.trim() },
      { new: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({ message: "Profile picture updated", user: updatedUser });
  } catch (error) {
    console.error("Error updating profile picture:", error);
    return res.status(500).json({ error: "Internal server error updating profile picture" });
  }
};

router.patch("/profile/picture", fetchUser, updateProfilePicture);
router.put("/profile/picture", fetchUser, updateProfilePicture);

router.delete("/posts/:postId", fetchUser, async (req, res) => {
  try {
    const { postId } = req.params;
    const currentUserId = req.user.id;

    const post = await Post.findById(postId).select("author comments");
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    if (!isObjectIdEqual(post.author, currentUserId)) {
      return res.status(403).json({ error: "You can delete only your own posts" });
    }

    const commentIds = Array.isArray(post.comments) ? post.comments : [];

    await Promise.all([
      Post.findByIdAndDelete(postId),
      User.findByIdAndUpdate(currentUserId, { $pull: { posts: postId } }),
      Comments.deleteMany({ post: postId }),
      Reaction.deleteMany({
        $or: [
          { targetType: "post", targetId: postId },
          { targetType: "comment", targetId: { $in: commentIds } },
        ],
      }),
      Notification.deleteMany({
        $or: [
          { entityType: "post", entityId: postId },
          { entityType: "comment", entityId: { $in: commentIds } },
        ],
      }),
    ]);

    return res.json({ message: "Post deleted successfully", postId });
  } catch (error) {
    console.error("Error deleting post:", error);
    return res.status(500).json({ error: "Internal server error deleting post" });
  }
});
module.exports = router;
