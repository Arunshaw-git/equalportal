// backend/config/multer.js
const multer = require('multer');
const path = require("path");

// Set up multer storage (to store temporary file paths)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Store temporarily in 'uploads' directory
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname); // Use unique filenames
  },
});

const upload = multer({ storage: storage });

module.exports = upload;
