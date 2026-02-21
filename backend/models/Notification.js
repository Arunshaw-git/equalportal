const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["reaction", "comment", "mention"], required: true },
    entityType: { type: String, enum: ["post", "comment"], required: true },
    entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
    meta: {
      reactionType: {
        type: String,
        enum: ["like", "sad", "smile", "angry", "wow", null],
        default: null,
      },
      commentPreview: { type: String, default: "" },
    },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);

