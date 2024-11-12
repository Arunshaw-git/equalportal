// backend/config/multer.js
const multer = require('multer');
const path = require("path");
const cloudinary = require('cloudinary').v2; // Import Cloudinary

// Set up multer storage (to store temporary file paths)
const storage = multer.diskStorage({
  cloudinary: cloudinary,  // Cloudinary instance
  params: {
    folder: 'equalPortal/posts',  // Cloudinary folder
  },
});

const upload = multer({ storage: storage });

module.exports = upload;
