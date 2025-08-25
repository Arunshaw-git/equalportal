import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const FollowButton = ({ userId, currentUserId, isFollowing, onFollowChange, setUser }) => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [followStatus, setFollowStatus] = useState(isFollowing);
  const apiUrl = process.env.REACT_APP_API_URL;
  
  const handleFollow = async () => {
    if (!currentUserId) {
      navigate("/login"); // Redirect to login if not logged in
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/follow/${userId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to follow/unfollow");
      }

      // Assuming the server responds with the updated follow status
      const data = await response.json();
      setFollowStatus(data.isFollowing); 
      setUser(data.user)
      if (onFollowChange) onFollowChange(data.isFollowing); 
      
    } catch (error) {
      console.error("Error during follow/unfollow:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleFollow}
      disabled={loading}
      className={`follow-btn ${followStatus ? "following" : "not-following"}`}
    >
      {loading ? "Loading..." : followStatus ? "Unfollow" : "Follow"}
    </button>
  );
};

export default FollowButton;
