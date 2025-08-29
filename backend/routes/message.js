const express = require("express");
const Message = require("../models/Message");
const Convo = require("../models/Conversation")
const router = express.Router();
const fetchUser = require("../middleware/fetchUser")

router.post("sendMessage", fetchUser, async(req,res)=>{
    const {sender, receiver, text} = req.body

    try {
        let convo = await Convo.findOne({
            participants:{$all:[sender, receiver]}
        });

        if(!convo){
            const newConvo = new Convo({
                participants:[sender,receiver],
                messages:[]
            })
            await newConvo.save();
            convo = newConvo; 
        }

        const message = new Message({
            sender,
            receiver,
            text
        });
        await message.save();

        convo.messages.push(message._id);
        await convo.save();
        
        res.status(200).json({message: "Message has been sent "});
    } catch (error) {
        res.status(500).json({error:error.message});
    }

})

router.get("/:user1/:user2", fetchUser, async (req,res)=>{
    console.log("In getConvo")
    const { user1,user2} = req.params;
    try {
        const convo = await Convo.findOne({
            participants: { $all:[user1,user2]}
        }).populate("messages");

        if(!convo){
            return res.status(404).json({message:"Conversation not found"})
        }
        console.log("Convo:",convo)
        res.status(200).json(convo);
    } catch (error) {
        res.status(500).json({error:error.message});
    }

})

module.exports = router;