const express = require("express");
const Comments = require("../models/Comments");
const User = require("../models/User");
const fetchUser = require("../middleware/fetchUser");
const router = express.Router();


router.post('/comment', fetchUser, async(req,res)=>{
    try {
        const {postId, comment} = req.user.body;
        const  newComment = new Comments({
            text: text,
            author: req.user.id,
            post: postId,
            upvotes:[],
            downvotes:[],
        }) 
        const savedComment = await newComment.save()
        await User.findByIdAndDelete(req.user.id,{$push: {comments: savedComment._id}}, {new:true})
        res.status(200).json(savedComment)

    } catch (error) {
        console.log('Error while saving comment: ', error);
        res.status(500).send("Internal server error while saving comment")
    }

})

module.exports = router;