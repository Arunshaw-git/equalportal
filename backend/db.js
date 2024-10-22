require('dotenv').config({ path: '../.env' }); // Load environment variables
const mongoose = require('mongoose');

// Separate connections for users and posts
const connectToUsersDB = async () => {
  try {
    const uri = process.env.MONGODB_USERS_URI;
    if (!uri) throw new Error('Users DB URI is not defined');
    
    await mongoose.createConnection(uri);
    console.log('Connected to Users DB');
  } catch (error) {
    console.error('Could not connect to Users DB:', error);
    process.exit(1); // Exit on failure
  }
};

const connectToPostsDB = async () => {
  try {
    const uri = process.env.MONGODB_POSTS_URI;
    if (!uri) throw new Error('Posts DB URI is not defined');

    await mongoose.createConnection(uri);
    console.log('Connected to Posts DB');
  } catch (error) {
    console.error('Could not connect to Posts DB:', error);
    process.exit(1); // Exit on failure
  }
};

module.exports = { connectToUsersDB, connectToPostsDB };
