const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema({
    title :{type: String, required: true},
    desc:{type:String, required: true},
    media:{type: String, required: false},
    author:{type:mongoose.Schema.Types.ObjectId, ref:"User", required:true},
    upvotes:[{type:mongoose.Schema.Types.ObjectId, ref:"User" }],
    downvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    comments:[{type:mongoose.Schema.Types.ObjectId,ref:"Comments"}],
    
},{timestamps:true});

PostSchema.pre('save', function(next) {
    // If user is in both arrays, remove from the other one
    const common = this.upvotes.filter(userId => this.downvotes.includes(userId));
    if (common.length > 0) {
        this.downvotes = this.downvotes.filter(userId => !common.includes(userId));
    }
    next();
});
module.exports = mongoose.model("Post", PostSchema) 