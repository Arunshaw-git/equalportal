import React, { useState } from "react";
import { useNavigate} from "react-router-dom";

const CreateUser = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    userName: "",
  });
  const apiUrl = process.env.REACT_APP_API_URL;
  const navigate = useNavigate();

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

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
    setLoading(true);

    // WE NEED TO FIRST COVERT THE FORM DATA INTO JSON FIRST
    //var object = {};
    //(not done yet)SO FIRST CONVERT THE FORMDATA INTO OBJECT THEN JSON
    var json = JSON.stringify(formData);

    try {
      const response = await fetch(`${apiUrl}/auth/createuser`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: json,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "An error occurred");
      }

      setSuccess(true);
      setLoading(false);

      localStorage.setItem("token", data.token);
      navigate("/");
    } catch (error) {
      setLoading(false);
      setErrors({ global: error.message });
    }
  };

  return (
    <>
      <div className="container">
        <div className="form-container">
          <h2>Create a New User</h2>
          {success && (
            <div className="success-message">User created successfully!</div>
          )}
          {errors.global && (
            <div className="error-message">{errors.global}</div>
          )}

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
            {errors.userName && (
              <div className="error-text">{errors.userName}</div>
            )}

            <button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Account"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default CreateUser;
