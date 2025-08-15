import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const CreateUser = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    userName: "",
    gender: "",
  });
  const [media, setMedia] = useState(null); // State for media file
  const [preview, setPreview] = useState(null); // For previewing the media
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const apiUrl = process.env.REACT_APP_API_URL;
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const file = e.target.files[0];

    if (file) {
      // Basic file validation
      const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
      const maxSize = 3 * 1024 * 1024; // 5MB

      if (!allowedTypes.includes(file.type)) {
        setErrors("Invalid file type. Please upload JPEG, PNG, or GIF.");
        return;
      }

      if (file.size > maxSize) {
        setErrors("File is too large. Maximum size is 3MB.");
        return;
      }
      // Set media file and create preview
      setMedia(file);
      setPreview(URL.createObjectURL(file));
      setErrors((prev) => ({ ...prev, file: null }));
    }
  };
  // Clear selected file
  const clearMedia = () => {
    setMedia(null);
    setPreview(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  //when form is submitted
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    const formDataToSubmit = new FormData();
    formDataToSubmit.append("name", formData.name);
    formDataToSubmit.append("email", formData.email);
    formDataToSubmit.append("password", formData.password);
    formDataToSubmit.append("userName", formData.userName);
    formDataToSubmit.append("gender", formData.gender);

    // Upload media if provided
    if (media) {
      const mediaFormData = new FormData();
      mediaFormData.append("file", media); // The 'media' file being uploaded
      mediaFormData.append("upload_preset", "equalportal"); // Cloudinary upload preset
      mediaFormData.append("cloud_name", "djnkm0nfh");

      try {
        const cloudinaryResponse = await fetch(
          "https://api.cloudinary.com/v1_1/djnkm0nfh/image/upload",
          {
            method: "POST",
            body: mediaFormData,
          }
        );

        const cloudinaryResult = await cloudinaryResponse.json();
        if (!cloudinaryResponse.ok) {
          throw new Error(
            cloudinaryResult.message || "Failed to upload media."
          );
        }

        const mediaUrl = cloudinaryResult.secure_url;
        formDataToSubmit.append("profilePicture", mediaUrl); // Append the uploaded media URL to form data
      } catch (error) {
        setIsLoading(false);
        setErrors({ file: error.message });
        return;
      }
    }

    // Submit form data to backend
    try {
      const response = await fetch(`${apiUrl}/auth/createuser`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(Object.fromEntries(formDataToSubmit.entries())), // Convert FormData to JSON
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "An error occurred");
      }
      localStorage.setItem("token", data.token);
      localStorage.setItem("userId", data.user?.id || '');
      setIsLoading(false);
      setFormData({
        name: "",
        email: "",
        password: "",
        userName: "",
        gender: "",
      });
      clearMedia(); // Clear media preview
      navigate("/"); // Redirect after successful form submission
    } catch (error) {
      setIsLoading(false);
      setErrors({ global: error.message }); // Set global error if the request fails
    }
  };

  return (
    <>
    <nav className="navbar">
         <div className="logo-container"></div>
       </nav>
      <div className="create-post-container">
        <div className="form-container">
          <h2>Create a New User</h2>
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Full Name"
              required
            />
            {errors.name && <div className="error-text">{errors.name}</div>}

            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email Address"
              required
            />
            {errors.email && <div className="error-text">{errors.email}</div>}

            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Password"
              required
              minLength="6"
            />
            {errors.password && (
              <div className="error-text">{errors.password}</div>
            )}

            <input
              type="text"
              name="userName"
              value={formData.userName}
              onChange={handleChange}
              placeholder="Username"
              required
            />
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              required
              className="form-input"
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
            {errors.gender && <div className="error-text">{errors.gender}</div>}

            <div className="form-group">
              <label htmlFor="media">Profile Picture (Optional)</label>
              <input
                type="file"
                id="fileInput"
                onChange={handleFileChange}
                name="media"
                accept="image/jpeg,image/png,image/gif"
              />
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
              {errors.file && <div className="error-text">{errors.file}</div>}
            </div>

            <button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Account"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default CreateUser;
