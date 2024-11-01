import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/CreatePost.css";

function CreatePost() {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [media, setMedia] = useState(null); // State for media file
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const file = e.target.files[0];

    if (file) {
      // Basic file validation
      const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (!allowedTypes.includes(file.type)) {
        setError("Invalid file type. Please upload JPEG, PNG, or GIF.");
        return;
      }

      if (file.size > maxSize) {
        setError("File is too large. Maximum size is 5MB.");
        return;
      }

      // Set media file and create preview
      setMedia(file);
      setPreview(URL.createObjectURL(file));
      setError(null);
    }
  };

  // Clear selected file
  const clearMedia = () => {
    setMedia(null);
    setPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      setError("Please enter a title");
      return;
    }

    const formData = new FormData(); // Create FormData object
    formData.append("title", title);
    formData.append("desc", desc);
    if (media) formData.append("media", fileInput.files[0]);

    try {
      setIsLoading(true);
      setError(null);

      // Get the token from localStorage
      const token = localStorage.getItem("token");
      const response = await fetch("https://equalportal.onrender.com/create", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`, // If token is needed
        },
        body: formData, // Send form data with file
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create post");
      }

      const data = await response.json();
      console.log("Post created:", data);

      // Reset form after successful submission
      setTitle("");
      setDesc("");
      clearMedia();

      navigate("/");
    } catch (error) {
      console.error("Error creating post:", error);
      alert(error.message);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="homepage-container">
        <nav className="navbar">
          <div className="logo-container"></div>
        </nav>
        <div className="container">
          <form onSubmit={handleSubmit} className="form">
            <h1 className="header">Create a Post</h1>

            <div className="form-group">
              <label htmlFor="title">Title</label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter post title"
                required
                maxLength={100}
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Enter post description"
                maxLength={500}
                rows={4}
              />
            </div>

            {/* Media Upload */}
            <div className="form-group">
              <label htmlFor="media">Media (Optional)</label>
              <input
                type="file"
                id="media"
                onChange={handleFileChange}
                accept="image/jpeg,image/png,image/gif"
              />
              {/* Media Preview */}
              {preview && (
                <div className="media-preview">
                  <img src={preview} alt="Preview" className="preview-image" />
                  <button
                    type="button"
                    onClick={clearMedia}
                    className="clear-media-btn"
                  >
                    Remove Image
                  </button>
                </div>
              )}
            </div>
             {/* Error Display */}
              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}

            {/* Submit Button */}
            <button type="submit" disabled={isLoading} className="button">
              {isLoading ? "Creating Post..." : "Create Post"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

export default CreatePost;
