const express = require("express");
const Message = require("../models/Message");
const Convo = require("../models/Conversation")
const User = require("../models/User");
const router = express.Router();
const fetchUser = require("../middleware/fetchUser")

router.post("/sendMessage", fetchUser, async(req,res)=>{
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
        console.log("Message saved:",message)
        convo.messages.push(message._id);
        await convo.save();
        
        res.status(200).json({message: "Message has been sent "});
    } catch (error) {
        res.status(500).json({error:error.message});
    }

})

router.get("/conversations/list", fetchUser, async (req, res) => {
    try {
        const currentUserId = req.user.id;
        const conversations = await Convo.find({
            participants: currentUserId,
        }).sort({ updatedAt: -1, _id: -1 });

        const otherUserIds = [];
        const latestMessageIds = [];

        conversations.forEach((convo) => {
            const otherUserId = (convo.participants || []).find(
                (participant) => String(participant) !== String(currentUserId)
            );
            if (otherUserId) otherUserIds.push(String(otherUserId));

            if (Array.isArray(convo.messages) && convo.messages.length > 0) {
                latestMessageIds.push(String(convo.messages[convo.messages.length - 1]));
            }
        });

        const [users, latestMessages] = await Promise.all([
            User.find({ _id: { $in: otherUserIds } }).select("name userName profilePicture"),
            Message.find({ _id: { $in: latestMessageIds } }).select("text sender createdAt"),
        ]);

        const userById = new Map(users.map((user) => [String(user._id), user]));
        const messageById = new Map(latestMessages.map((message) => [String(message._id), message]));

        const items = conversations.map((convo) => {
            const otherUserId = (convo.participants || []).find(
                (participant) => String(participant) !== String(currentUserId)
            );
            const otherUser = otherUserId ? userById.get(String(otherUserId)) : null;

            if (!otherUser) return null;

            const latestMessageId =
                Array.isArray(convo.messages) && convo.messages.length > 0
                    ? String(convo.messages[convo.messages.length - 1])
                    : null;
            const latestMessage = latestMessageId ? messageById.get(latestMessageId) : null;

            return {
                convoId: convo._id,
                user: {
                    _id: otherUser._id,
                    name: otherUser.name,
                    userName: otherUser.userName,
                    profilePicture: otherUser.profilePicture,
                },
                latestMessage: latestMessage
                    ? {
                        text: latestMessage.text,
                        sender: latestMessage.sender,
                        createdAt: latestMessage.createdAt,
                    }
                    : null,
            };
        }).filter(Boolean);

        res.status(200).json({ conversations: items });
    } catch (error) {
        console.error("Conversation list error:", error);
        res.status(200).json({ conversations: [] });
    }
});

router.get("/:user1/:user2", fetchUser, async (req,res)=>{
    console.log("In getConvo")
    const { user1,user2} = req.params;
    try {
        const convo = await Convo.findOne({
            participants: { $all:[user1,user2]}
        }).populate("messages");

        if(!convo){
            return res.status(404).json({message:[]})
        }
        console.log("Convo:",convo)
        res.status(200).json(convo);
    } catch (error) {
        res.status(500).json({error:error.message});
    }

})

module.exports = router;
