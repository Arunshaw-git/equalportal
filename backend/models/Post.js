const mongoose = require('mongoose')
const postsConnection = mongoose.createConnection(process.env.MONGODB_POSTS_URI)
const { Schema } = mongoose;
const PostSchema = new Schema({
    title :{
      type: String,
      required:true
    },
    desc:{
        type:String,
        required:false
    },
    media:{
        type: String,
        required: false,
    },
    upvote:{
        type: Number, // Use Number type instead of int
        default: 0,
    },
    comments:{
        type:[String],
        default: [],  

    },
    share:{
        type: Number, // Use Number type instead of int
        default: 0,
    },
    creation_date:{
        type:Date,
        default: Date.now,
    },
    
});
const Post = postsConnection.model('Post',PostSchema);
module.exports = Post 