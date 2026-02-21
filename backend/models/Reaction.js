const mongoose = require("mongoose");

const reactionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    targetType: { type: String, enum: ["post", "comment"], required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
    type: {
      type: String,
      enum: ["like", "sad", "smile", "angry", "wow"],
      required: true,
    },
  },
  { timestamps: true }
);

reactionSchema.index({ userId: 1, targetType: 1, targetId: 1 }, { unique: true });
reactionSchema.index({ targetType: 1, targetId: 1 });

module.exports = mongoose.model("Reaction", reactionSchema);

