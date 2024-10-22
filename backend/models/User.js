const mongoose = require('mongoose')
//A dedicated connection for the users database
const usersConnection = mongoose.createConnection(process.env.MONGODB_USERS_URI);

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
const User = usersConnection.model('User',UserSchema);
  
module.exports = User;