const express = require("express");
const fetchUser = require("../middleware/fetchUser");
const Notification = require("../models/Notification");

const router = express.Router();

router.get("/notifications", fetchUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const skip = (page - 1) * limit;

    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("actorId", "name userName profilePicture");

    res.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Internal server error fetching notifications" });
  }
});

router.get("/notifications/unread-count", fetchUser, async (req, res) => {
  try {
    const unreadCount = await Notification.countDocuments({
      userId: req.user.id,
      isRead: false,
    });
    res.json({ unreadCount });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    res.status(500).json({ error: "Internal server error fetching unread count" });
  }
});

router.patch("/notifications/:id/read", fetchUser, async (req, res) => {
  try {
    const updated = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $set: { isRead: true } },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: "Notification not found" });
    }

    res.json(updated);
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ error: "Internal server error updating notification" });
  }
});

router.patch("/notifications/read-all", fetchUser, async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user.id, isRead: false },
      { $set: { isRead: true } }
    );
    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({ error: "Internal server error updating notifications" });
  }
});

module.exports = router;
