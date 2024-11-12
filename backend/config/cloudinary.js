const cloudinary = require("cloudinary").v2;
// Configure Cloudinary with your credentials
cloudinary.config({
    cloud_name: process.env.CLOUDNAME, // Replace with your cloud name
    api_key: process.env.CLOUDAPIKEY,       // Replace with your API key
    api_secret: process.env.CLOUDINARYSECERET, // Replace with your API secret
  });

module.exports = cloudinary;
