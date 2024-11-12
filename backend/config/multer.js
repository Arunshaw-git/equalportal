// backend/config/multer.js
const multer = require('multer');
const path = require("path");

// Set up multer storage (to store temporary file paths)
const storage = multer.diskStorage({
  loudinary: cloudinary,  // Cloudinary instance
  params: {
    folder: 'equalPortal/posts',  // Cloudinary folder
  },
});

const upload = multer({ storage: storage });

module.exports = upload;
