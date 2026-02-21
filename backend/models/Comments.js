const mongoose = require("mongoose")

const commentSchema = new mongoose.Schema({
    text:{type:String,required:true},
    post:{type:mongoose.Schema.Types.ObjectId, ref:"Post", required:true},
    author:{type:mongoose.Schema.Types.ObjectId, ref:"User", required:true},
    upvotes:[{type:mongoose.Schema.Types.ObjectId, ref:"User"}],
    downvotes:[{type:mongoose.Schema.Types.ObjectId, ref:"User"}],
    reactionCounts: {
        like: { type: Number, default: 0 },
        sad: { type: Number, default: 0 },
        smile: { type: Number, default: 0 },
        angry: { type: Number, default: 0 },
        wow: { type: Number, default: 0 },
    },
},{timestamps:true})

commentSchema.pre('save', function(next) {
    // If user is in both arrays, remove from the other one
    const common = this.upvotes.filter(userId => this.downvotes.includes(userId));
    if (common.length > 0) {
        this.downvotes = this.downvotes.filter(userId => !common.includes(userId));
    }
    next();
});
module.exports = mongoose.model("Comments", commentSchema)

