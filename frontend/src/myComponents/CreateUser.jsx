import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/SignUp.css";

const CreateUser = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
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

  const getErrorMessage = (data, fallback = "Unable to create account. Please try again.") => {
    if (!data) return fallback;
    if (typeof data.error === "string" && data.error.trim()) return data.error;
    if (Array.isArray(data.errors) && data.errors.length > 0) {
      const firstError = data.errors[0];
      if (firstError?.msg) return firstError.msg;
    }
    return fallback;
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];

    if (file) {
      // Basic file validation
      const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
      const maxSize = 3 * 1024 * 1024; // 5MB

      if (!allowedTypes.includes(file.type)) {
        setErrors({ file: "Invalid file type. Please upload JPEG, PNG, or GIF." });
        return;
      }

      if (file.size > maxSize) {
        setErrors({ file: "File is too large. Maximum size is 3MB." });
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

    if (!apiUrl) {
      setErrors({ global: "API URL missing. Set REACT_APP_API_URL in frontend/.env." });
      return;
    }

    setIsLoading(true);
    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      phoneNumber: formData.phoneNumber.trim(),
      password: formData.password,
      userName: formData.userName.trim(),
      gender: formData.gender,
    };

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
        payload.profilePicture = mediaUrl;
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
        body: JSON.stringify(payload),
      });

      const contentType = response.headers.get("content-type") || "";
      const data = contentType.includes("application/json")
        ? await response.json()
        : { error: await response.text() };

      if (!response.ok) {
        throw new Error(getErrorMessage(data));
      }
      localStorage.setItem("token", data.token);
      localStorage.setItem("userId", data.user?.id || '');
      setIsLoading(false);
      setFormData({
        name: "",
        email: "",
        phoneNumber: "",
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

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate("/");
  };

  return (
    <>
      <div className="signup-page">
        <div className="signup-shell">
          <div className="signup-top-bar">
            <button type="button" className="signup-back-btn" onClick={handleGoBack}>
              <span aria-hidden="true">&lt;</span> Back
            </button>
          </div>

          <section className="signup-brand-panel">
            <p className="signup-kicker">Equal Portal</p>
            <h1>Create your account.</h1>
            <p className="signup-subtitle">
              Join the community to post updates, comment on threads, and connect with people who care about the same issues.
            </p>
            <ul className="signup-points">
              <li>Personal profile with optional avatar</li>
              <li>Post, vote, and discuss in real time</li>
              <li>Secure login with private sessions</li>
            </ul>
            <button
              type="button"
              className="signup-alt-link"
              onClick={() => navigate("/login")}
            >
              Already have an account? Sign in
            </button>
          </section>

          <section className="signup-card">
            <h2>Get started</h2>
            {errors.global && <div className="error-text">{errors.global}</div>}
            <form onSubmit={handleSubmit} className="signup-form">
              <label htmlFor="name">Full Name</label>
              <input
                id="name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Your full name"
                required
              />
              {errors.name && <div className="error-text">{errors.name}</div>}

              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="name@example.com"
                required
              />
              {errors.email && <div className="error-text">{errors.email}</div>}

              <label htmlFor="phoneNumber">Phone Number</label>
              <input
                id="phoneNumber"
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                placeholder="+15551234567"
                required
              />
              {errors.phoneNumber && <div className="error-text">{errors.phoneNumber}</div>}

              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="At least 6 characters"
                required
                minLength="6"
              />
              {errors.password && (
                <div className="error-text">{errors.password}</div>
              )}

              <label htmlFor="userName">Username</label>
              <input
                id="userName"
                type="text"
                name="userName"
                value={formData.userName}
                onChange={handleChange}
                placeholder="Public username"
                required
              />

              <label htmlFor="gender">Gender</label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                required
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              {errors.gender && <div className="error-text">{errors.gender}</div>}

              <div className="signup-upload-group">
                <label htmlFor="fileInput">Profile Picture (Optional)</label>
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

              <button type="submit" disabled={isLoading} className="signup-submit-btn">
                {isLoading ? "Creating..." : "Create Account"}
              </button>
            </form>
          </section>
        </div>
      </div>
    </>
  );
};

export default CreateUser;
