const express = require("express");
const Post = require("../models/Post");
const router = express.Router();

router.get("/postsscrape", async (req,res)=>{
    try {
        const posts = await Post.find({}, "title desc");
        res.json(posts)
      } catch (e) {
        console.log(e);
        return res.status(404);
      }
});

module.exports = router;