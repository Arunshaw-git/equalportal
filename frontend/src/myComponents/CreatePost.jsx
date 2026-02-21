import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/CreatePost.css";
import "../styles/Homepage.css";
import Logout from "./Logout";

function CreatePost() {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [media, setMedia] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const apiUrl = process.env.REACT_APP_API_URL;
  const navigate = useNavigate();

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate("/");
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];

    if (file) {
      const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
      const maxSize = 5 * 1024 * 1024;

      if (!allowedTypes.includes(file.type)) {
        setError("Invalid file type. Please upload JPEG, PNG, or GIF.");
        return;
      }

      if (file.size > maxSize) {
        setError("File is too large. Maximum size is 5MB.");
        return;
      }

      setMedia(file);
      setPreview(URL.createObjectURL(file));
      setError(null);
    }
  };

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

    const formData = new FormData();
    formData.append("title", title);
    formData.append("desc", desc);

    if (media) {
      const mediaFormData = new FormData();
      mediaFormData.append("file", media);
      mediaFormData.append("upload_preset", "equalportal");
      mediaFormData.append("cloud_name", "djnkm0nfh");

      const cloudinaryResponse = await fetch("https://api.cloudinary.com/v1_1/djnkm0nfh/image/upload", {
        method: "POST",
        body: mediaFormData,
      });

      const cloudinaryResult = await cloudinaryResponse.json();
      if (!cloudinaryResponse.ok) {
        throw new Error(cloudinaryResult.message || "failed to upload to cloudinary");
      }

      const mediaUrl = cloudinaryResult.secure_url;
      formData.append("media", mediaUrl);
    }

    try {
      setIsLoading(true);
      setError(null);

      const token = localStorage.getItem("token");

      const object = {};
      formData.forEach((value, key) => {
        object[key] = value;
      });
      const json = JSON.stringify(object);

      const response = await fetch(`${apiUrl}/create`, {
        method: "POST",
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: json,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create post");
      }

      setTitle("");
      setDesc("");
      clearMedia();
      navigate("/");
    } catch (submitError) {
      console.error("Error creating post:", submitError);
      setError(submitError.message);
      clearMedia();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <nav className="homepage-navbar">
        <Link to="/">
          <div className="logo-container"></div>
        </Link>
        <div className="home-nav-actions">
          <span className="home-status-pill">Create</span>
          <Logout />
        </div>
      </nav>

      <main className="create-post-page">
        <div className="create-post-topbar">
          <button type="button" className="create-post-back-btn" onClick={handleGoBack}>
            &lt; Back
          </button>
        </div>

        <div className="create-post-shell">
          <section className="create-post-intro">
            <p className="create-post-kicker">Publishing Studio</p>
            <h1>Create a post that people can trust and share.</h1>
            <p>
              Add a clear title, explain your message, and include supporting media. Quality posts get better
              engagement and stronger community feedback.
            </p>
            <ul className="create-post-tips">
              <li>Use a specific title so readers understand your post quickly.</li>
              <li>Keep your description factual and easy to verify.</li>
              <li>Upload a relevant image to improve clarity and reach.</li>
            </ul>
          </section>

          <section className="create-post-card">
            <form onSubmit={handleSubmit} className="create-post-form" encType="multipart/form-data">
              <div className="create-post-head">
                <h2>Create Post</h2>
                <span className="create-post-status">{isLoading ? "Publishing..." : "Ready"}</span>
              </div>

              <div className="create-post-group">
                <label htmlFor="title">Title</label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Write a clear post title"
                  required
                  maxLength={100}
                />
                <p className="create-post-meta">{title.length}/100</p>
              </div>

              <div className="create-post-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="Add context, details, and key facts"
                  maxLength={500}
                  rows={6}
                />
                <p className="create-post-meta">{desc.length}/500</p>
              </div>

              <div className="create-post-group">
                <label htmlFor="fileInput">Media (Optional)</label>
                <input
                  type="file"
                  id="fileInput"
                  onChange={handleFileChange}
                  name="media"
                  accept="image/jpeg,image/png,image/gif"
                />
                <p className="create-post-meta">JPG, PNG, GIF up to 5MB</p>

                {preview && (
                  <div className="create-post-preview">
                    <img src={preview} alt="Preview" className="create-post-preview-image" />
                    <button type="button" onClick={clearMedia} className="create-post-remove-btn">
                      Remove Image
                    </button>
                  </div>
                )}
              </div>

              {error && <div className="create-post-error">{error}</div>}

              <button type="submit" disabled={isLoading} className="create-post-submit">
                {isLoading ? "Creating Post..." : "Publish Post"}
              </button>
            </form>
          </section>
        </div>
      </main>
    </>
  );
}

export default CreatePost;
