const mongoose = require("mongoose")
//A dedicated connection for the users database

const UserSchema = new mongoose.Schema({
    userName:{
        unique:true,
        type:String,
        required:true
    },
    name:{
        type: String,
        required: true
    },
    email:{
        type:String,
        required: true,
        unique: true
    },
    password:{
        type:String,
        required:true
    },
    profilePicture:{
        type:String,
        required:false,
        default:''
    },
    gender:{
        type:String,
        enum:['Male','Female','Other'],
        default:''
    },
    followers:[{type:mongoose.Schema.Types.ObjectId, ref:"User"}],
    following:[{type:mongoose.Schema.Types.ObjectId, ref:"User"}],
    posts:[{type:mongoose.Schema.Types.ObjectId, ref:"Post"}],
   
    
},{timestamps:true})
const User = mongoose.model('User',UserSchema);
  
module.exports = User;