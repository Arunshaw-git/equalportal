import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Logout from "./Logout";
const Profile = () => {
  const [user, setUser] = useState([]);
  const navigate = useNavigate();
  const apiUrl = process.env.REACT_APP_API_URL;

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        console.log("Token not provided while fetching  ");
        navigate("/login"); // Redirect to login
        return;
      }

      try {
        const response = await fetch(`${apiUrl}/profile`, {
          method: "GET",
          headers: {
            "content-type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error( "Failed to fetch user's profile");
        
        const data = await response.json();
        console.log(data);
        setUser(data);
      } catch (e) {
        console.log("Profile Error:", e);
      }
    };
    fetchProfile();
  }, [apiUrl,navigate]);

  return (
    <>
      <nav className="navbar">
        <Link to="/">
          <div className="logo-container"></div>
        </Link>
        <Logout />
      </nav>

      <div className="homepage-container">
        <div className="header">
          <h1>{user.name}</h1>
          <p>User Name: {user.userName}</p>
          <p>Email: {user.email}</p>
          <p>Profile created on: {user.CreationDate}</p>
          
          
        </div>
      </div>
    </>
  );
};

export default Profile;
