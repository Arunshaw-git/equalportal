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
    phoneNumber: {
        type: String,
        required: false,
        unique: true,
        sparse: true
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
    settings: {
        privacy: {
            privateProfile: { type: Boolean, default: false },
            showEmail: { type: Boolean, default: false },
            showPhone: { type: Boolean, default: false }
        },
        notifications: {
            inApp: { type: Boolean, default: true },
            email: { type: Boolean, default: true },
            mentions: { type: Boolean, default: true }
        },
        preferences: {
            compactMode: { type: Boolean, default: false },
            reduceMotion: { type: Boolean, default: false },
            contentLanguage: { type: String, default: "English" }
        }
    },
   
    
},{timestamps:true})
const User = mongoose.model('User',UserSchema);
  
module.exports = User;
