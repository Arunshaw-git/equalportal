const express = require("express");
const fetchUser = require("../middleware/fetchUser");
const Post = require("../models/Post");
const Comments = require("../models/Comments");
const Reaction = require("../models/Reaction");
const Notification = require("../models/Notification");

const router = express.Router();

const VALID_TARGETS = ["post", "comment"];
const VALID_REACTIONS = ["like", "sad", "smile", "angry", "wow"];

const isObjectIdEqual = (a, b) => String(a) === String(b);

const getModelByTargetType = (targetType) => {
  if (targetType === "post") return Post;
  if (targetType === "comment") return Comments;
  return null;
};

const emptyReactionCounts = () => ({
  like: 0,
  sad: 0,
  smile: 0,
  angry: 0,
  wow: 0,
});

router.put("/reactions", fetchUser, async (req, res) => {
  try {
    const { targetType, targetId, type } = req.body;
    const userId = req.user.id;

    if (!VALID_TARGETS.includes(targetType)) {
      return res.status(400).json({ error: "Invalid targetType" });
    }
    if (!VALID_REACTIONS.includes(type)) {
      return res.status(400).json({ error: "Invalid reaction type" });
    }

    const Model = getModelByTargetType(targetType);
    const targetDoc = await Model.findById(targetId);
    if (!targetDoc) {
      return res.status(404).json({ error: `${targetType} not found` });
    }

    if (!targetDoc.reactionCounts) {
      targetDoc.reactionCounts = emptyReactionCounts();
    }

    const existingReaction = await Reaction.findOne({ userId, targetType, targetId });

    if (existingReaction) {
      if (existingReaction.type === type) {
        return res.json({
          message: "Reaction unchanged",
          reactionCounts: targetDoc.reactionCounts,
          myReaction: existingReaction.type,
        });
      }

      targetDoc.reactionCounts[existingReaction.type] = Math.max(
        0,
        (targetDoc.reactionCounts[existingReaction.type] || 0) - 1
      );
      targetDoc.reactionCounts[type] = (targetDoc.reactionCounts[type] || 0) + 1;
      existingReaction.type = type;

      await Promise.all([targetDoc.save(), existingReaction.save()]);
    } else {
      targetDoc.reactionCounts[type] = (targetDoc.reactionCounts[type] || 0) + 1;

      await Promise.all([
        targetDoc.save(),
        Reaction.create({ userId, targetType, targetId, type }),
      ]);
    }

    const ownerId = targetDoc.author;
    if (ownerId && !isObjectIdEqual(ownerId, userId)) {
      try {
        await Notification.create({
          userId: ownerId,
          actorId: userId,
          type: "reaction",
          entityType: targetType,
          entityId: targetId,
          meta: { reactionType: type },
        });
      } catch (notificationError) {
        // Reaction should still succeed even if notification creation fails.
        console.error("Notification create failed:", notificationError);
      }
    }

    return res.json({
      message: "Reaction saved",
      reactionCounts: targetDoc.reactionCounts,
      myReaction: type,
    });
  } catch (error) {
    console.error("Error saving reaction:", error);
    return res.status(500).json({
      error: "Internal server error saving reaction",
      details: error?.message || "Unknown error",
    });
  }
});

router.post("/reactions/toggle", fetchUser, async (req, res) => {
  try {
    const { targetType, targetId, type } = req.body;
    const userId = req.user.id;

    if (!VALID_TARGETS.includes(targetType)) {
      return res.status(400).json({ error: "Invalid targetType" });
    }
    if (!VALID_REACTIONS.includes(type)) {
      return res.status(400).json({ error: "Invalid reaction type" });
    }

    const Model = getModelByTargetType(targetType);
    const targetDoc = await Model.findById(targetId);
    if (!targetDoc) {
      return res.status(404).json({ error: `${targetType} not found` });
    }

    if (!targetDoc.reactionCounts) {
      targetDoc.reactionCounts = emptyReactionCounts();
    }

    const existingReaction = await Reaction.findOne({ userId, targetType, targetId });

    // Toggle off when user clicks the same reaction.
    if (existingReaction && existingReaction.type === type) {
      await Reaction.deleteOne({ _id: existingReaction._id });
      targetDoc.reactionCounts[type] = Math.max(
        0,
        (targetDoc.reactionCounts[type] || 0) - 1
      );
      await targetDoc.save();

      return res.json({
        message: "Reaction removed",
        reactionCounts: targetDoc.reactionCounts,
        myReaction: null,
      });
    }

    if (existingReaction) {
      targetDoc.reactionCounts[existingReaction.type] = Math.max(
        0,
        (targetDoc.reactionCounts[existingReaction.type] || 0) - 1
      );
      existingReaction.type = type;
      targetDoc.reactionCounts[type] = (targetDoc.reactionCounts[type] || 0) + 1;
      await Promise.all([existingReaction.save(), targetDoc.save()]);
    } else {
      targetDoc.reactionCounts[type] = (targetDoc.reactionCounts[type] || 0) + 1;
      await Promise.all([
        Reaction.create({ userId, targetType, targetId, type }),
        targetDoc.save(),
      ]);
    }

    const ownerId = targetDoc.author;
    if (ownerId && !isObjectIdEqual(ownerId, userId)) {
      try {
        await Notification.create({
          userId: ownerId,
          actorId: userId,
          type: "reaction",
          entityType: targetType,
          entityId: targetId,
          meta: { reactionType: type },
        });
      } catch (notificationError) {
        console.error("Notification create failed:", notificationError);
      }
    }

    return res.json({
      message: "Reaction saved",
      reactionCounts: targetDoc.reactionCounts,
      myReaction: type,
    });
  } catch (error) {
    console.error("Error toggling reaction:", error);
    return res.status(500).json({
      error: "Internal server error toggling reaction",
      details: error?.message || "Unknown error",
    });
  }
});

router.delete("/reactions", fetchUser, async (req, res) => {
  try {
    const { targetType, targetId } = req.body;
    const userId = req.user.id;

    if (!VALID_TARGETS.includes(targetType)) {
      return res.status(400).json({ error: "Invalid targetType" });
    }

    const Model = getModelByTargetType(targetType);
    const targetDoc = await Model.findById(targetId);
    if (!targetDoc) {
      return res.status(404).json({ error: `${targetType} not found` });
    }

    if (!targetDoc.reactionCounts) {
      targetDoc.reactionCounts = emptyReactionCounts();
    }

    const existingReaction = await Reaction.findOneAndDelete({ userId, targetType, targetId });
    if (!existingReaction) {
      return res.status(404).json({ error: "Reaction not found" });
    }

    targetDoc.reactionCounts[existingReaction.type] = Math.max(
      0,
      (targetDoc.reactionCounts[existingReaction.type] || 0) - 1
    );
    await targetDoc.save();

    return res.json({
      message: "Reaction removed",
      reactionCounts: targetDoc.reactionCounts,
      myReaction: null,
    });
  } catch (error) {
    console.error("Error deleting reaction:", error);
    return res.status(500).json({
      error: "Internal server error deleting reaction",
      details: error?.message || "Unknown error",
    });
  }
});

router.get("/reactions/:targetType/:targetId", fetchUser, async (req, res) => {
  try {
    const { targetType, targetId } = req.params;
    const userId = req.user.id;

    if (!VALID_TARGETS.includes(targetType)) {
      return res.status(400).json({ error: "Invalid targetType" });
    }

    const Model = getModelByTargetType(targetType);
    const targetDoc = await Model.findById(targetId).select("reactionCounts");
    if (!targetDoc) {
      return res.status(404).json({ error: `${targetType} not found` });
    }

    const myReaction = await Reaction.findOne({ userId, targetType, targetId }).select("type");

    return res.json({
      reactionCounts: targetDoc.reactionCounts || emptyReactionCounts(),
      myReaction: myReaction ? myReaction.type : null,
    });
  } catch (error) {
    console.error("Error fetching reactions:", error);
    return res.status(500).json({ error: "Internal server error fetching reactions" });
  }
});

module.exports = router;


