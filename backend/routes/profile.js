const express = require("express");
const User = require("../models/User")
const fetchUser = require("../middleware/fetchUser");
const router = express.Router();

router.get("/profile",fetchUser, async (req,res)=>{

    try{
        
        let user = await User.findById(req.user.id).select("-password");;
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        res.json(user);

    }catch(error){
        console.log("Error from profile :", error)
        res.status(500).json("Internal error :", error)
    }

})
module.exports = router;