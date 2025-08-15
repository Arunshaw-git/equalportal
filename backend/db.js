require('dotenv').config({ path: '../.env' }); // Load environment variables
const mongoose = require('mongoose');

// Separate connections for users and posts
const connectToDB = async ()=>{
  try{
   const connect = await mongoose.connect(process.env.MONGODB_URI);
   if(connect){
    console.log("Connected to DB")
   }
  }catch(err){
    console.log("Could not connect to DB")
    process.exit(1)
  }
}


module.exports = connectToDB 