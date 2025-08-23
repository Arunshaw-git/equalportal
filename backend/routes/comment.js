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

    const populatedComment = await Comments.findById(savedComment._id).populate("author")

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
