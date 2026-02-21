const express = require("express");
const Comments = require("../models/Comments");
const Post = require("../models/Post");
const User = require("../models/User");
const Notification = require("../models/Notification");
const fetchUser = require("../middleware/fetchUser");
const router = express.Router();

const extractMentions = (text = "") => {
  const mentions = text.match(/@([a-zA-Z0-9_]+)/g) || [];
  return [...new Set(mentions.map((mention) => mention.slice(1).toLowerCase()))];
};

const isObjectIdEqual = (a, b) => String(a) === String(b);
const escapeRegExp = (value = "") => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

router.post("/:postId/comment", fetchUser, async (req, res) => {
  try {
    const { postId } = req.params;
    const { text } = req.body;
    const currentUserId = req.user.id;

    const post = await Post.findById(postId).select("author");
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    const newComment = new Comments({
      text,
      author: currentUserId,
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

    const notificationsToCreate = [];

    if (!isObjectIdEqual(post.author, currentUserId)) {
      notificationsToCreate.push({
        userId: post.author,
        actorId: currentUserId,
        type: "comment",
        entityType: "post",
        entityId: postId,
        meta: { commentPreview: (text || "").slice(0, 120) },
      });
    }

    const mentionedUserNames = extractMentions(text);
    if (mentionedUserNames.length > 0) {
      const mentionedUsers = await User.find({
        $or: mentionedUserNames.map((name) => ({
          userName: { $regex: `^${escapeRegExp(name)}$`, $options: "i" },
        })),
      }).select("_id");

      const notifiedSet = new Set(
        notificationsToCreate.map((n) => String(n.userId))
      );

      for (const user of mentionedUsers) {
        if (isObjectIdEqual(user._id, currentUserId)) continue;
        if (notifiedSet.has(String(user._id))) continue;

        notificationsToCreate.push({
          userId: user._id,
          actorId: currentUserId,
          type: "mention",
          entityType: "comment",
          entityId: savedComment._id,
          meta: { commentPreview: (text || "").slice(0, 120) },
        });
      }
    }

    if (notificationsToCreate.length > 0) {
      await Notification.insertMany(notificationsToCreate);
    }

    const populatedComment = await Comments.findById(savedComment._id).populate("author");

    res.status(200).json(populatedComment);
  } catch (error) {
    console.log("Error while saving comment: ", error);
    res.status(500).send("Internal server error while saving comment");
  }
});

router.post("/comment/upvotes/:commentId",fetchUser,async (req,res)=>{
  const {commentId} = req.params;
  const currentUserId = req.user.id;
  console.log("In comment votes api: " ,commentId)

  const comment = await Comments.findById(commentId )
  if (!comment) return res.status(404).json({ error: "Comment not found" });

  const userUpVotesIdx = comment.upvotes.indexOf(currentUserId);
  const userDownVotesIdx = comment.downvotes.indexOf(currentUserId);

  if(userUpVotesIdx !== -1){
    comment.upvotes.splice(userUpVotesIdx, 1);
  }
  else{
    if(userDownVotesIdx !== -1){
      comment.downvotes.splice(userDownVotesIdx, 1)
    }
    comment.upvotes.push(currentUserId);
  }

  await comment.save()
  res.json(comment); 


})

router.post("/comment/downvotes/:commentId", fetchUser, async (req,res)=>{
  const currentUserId = req.user.id;
  const {commentId} = req.params;
  console.log('in downvote',commentId)
  try{
    const comment = await Comments.findById(commentId)
    if (!comment) return res.status(404).json({ error: "Comment not found" });

    const userUpvoteIdx = comment.upvotes.indexOf(currentUserId);
    const userDownvoteIdx = comment.downvotes.indexOf(currentUserId);

    if(userDownvoteIdx !== -1){
      comment.downvotes.splice(userDownvoteIdx,1)
    }
    else{
      if(userUpvoteIdx !== -1){
        comment.upvotes.splice(userUpvoteIdx,1)
      }
      comment.downvotes.push(currentUserId 
      )
    }
    await comment.save()
    res.json(comment)


  }catch(err){
    res.status(500).json("Internal server error during comment voting ")
  }



})

module.exports = router;
