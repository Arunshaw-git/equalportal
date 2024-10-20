const mongoose = require('mongoose')
const { Schema } = mongoose;

const UserSchema = new Schema({
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
    CreationDate:{
        type:Date,
        default: Date.now
    },
    
})
const User = mongoose.model('User',UserSchema);
  
module.exports = User 