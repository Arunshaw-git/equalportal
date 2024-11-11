const cloudinary = require('cloudinary').v2;
const express = require("express");
const multer = require("multer");
const port = process.env.PORT || 5000;

cloudinary.config({
  cloud_name: process.env.CLOUDNAME, // Replace with your cloud name
  api_key: process.env.CLOUDAPIKEY,       // Replace with your API key
  api_secret: process.env.CLOUDINARYSECERET, // Replace with your API secret
});

const app = express();

// Set up Multer
const storage = multer.memoryStorage(); // Store file in memory buffer
const upload = multer({ storage });

// File upload endpoint
app.post('/upload', upload.single('media'), async (req, res) => {
  try {
    const result = await cloudinary.uploader.upload_stream(
      { resource_type: "image" },
      (error, result) => {
        if (error) {
          return res.status(500).send(error);
        }
        res.json({ url: result.secure_url });
      }
    );

    // Pass the file buffer to Cloudinary
    result.end(req.file.buffer);
  } catch (error) {
    res.status(500).send(error);
  }
});

app.listen(port, () => {
  console.log("Server running on port 3000");
});
