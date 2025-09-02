const express = require("express");
const router = express.Router();
const User = require("../models/User.js");
const fetchUser = require("../middleware/fetchUser");

router.post("/follow/:toBeFollowed", fetchUser, async (req, res) => {
  const follower = req.user.id;
  const { toBeFollowed } = req.params;
  try {
    const user = await User.findById(follower);
    const toBeFollowedUser = await User.findById(toBeFollowed);
    if (!toBeFollowed || !user) {
      return res
        .status(400)
        .json({ error: "Invalid user or toBeFollowed parameter" });
    }

    const toBeFollowedUserIdx = user.following.indexOf(toBeFollowed);
    const followerInTargetFollowersIdx = toBeFollowedUser.followers.indexOf(follower)

    if (toBeFollowedUserIdx !== -1) {
      toBeFollowedUser.followers.splice(followerInTargetFollowersIdx,1)
      user.following.splice(toBeFollowedUserIdx, 1);
    } else {
      user.following.push(toBeFollowed);
      toBeFollowedUser.followers.push(follower);
    }
    console.log("target", toBeFollowedUser)
    console.log("Follower:", user)
    await user.save();
    await toBeFollowedUser.save();
    res.status(200).json({user:toBeFollowedUser, isFollowing: toBeFollowedUserIdx == -1});
  } catch (error) {
    console.log("Error while Following the user:", error);
    res.status(500).json("Error while following", error);
  }
});
module.exports = router;
