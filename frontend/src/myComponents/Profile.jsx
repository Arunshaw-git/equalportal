import React, { useEffect, useState } from "react";
import Logout from "./Logout";
import "../styles/Profile.css";
import Sidebar from "./Sidebar";
import { useNavigate, Link, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowUp, faArrowDown } from "@fortawesome/free-solid-svg-icons";

const Profile = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const currentUserId = localStorage.getItem("userId");
  const userIdToFetch = id || currentUserId;

  const [user, setUser] = useState([]);
  const [posts, setPosts] = useState([]);
  const apiUrl = process.env.REACT_APP_API_URL;

  // vote handler
  const handleVote = async (postId, voteType) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const res = await fetch(`${apiUrl}/${voteType}s/${postId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 200) {
        const data = await res.json();
        setPosts(posts.map((post) => (post._id === postId ? data : post)));
      }
    } catch (error) {
      console.error("Error voting:", error);
    }
  };
  
  //fetch profile
  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        console.log("Token not provided while fetching ");
        navigate("/login");
        return;
      }

      try {
        const response = await fetch(`${apiUrl}/profile/${userIdToFetch}`, {
          method: "GET",
          headers: {
            "content-type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error("Failed to fetch user's profile");
        const data = await response.json();
        setUser(data);

        const postsResponse = await fetch(`${apiUrl}/posts/${userIdToFetch}`, {
          method: "GET",
          headers: {
            "content-type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        const userPosts = await postsResponse.json();
        console.log("data in the posts' profile", userPosts);
        setPosts(userPosts);
      } catch (e) {
        console.log("Profile Error:", e);
      }
    };
    fetchProfile();
  }, [apiUrl, navigate]);

  return (
    <>
      <nav className="navbar">
        <Link to="/">
          <div className="logo-container"></div>
        </Link>
        <Logout />
      </nav>
      <Sidebar />
      <div className="profile-container">
        {/* Profile section with user details and buttons */}
        <div className="profile-div">
          <div className="profile-image">
            <img src={user.profilePicture} alt="Profile" />
          </div>
          <div className="profile-details">
            <h1>{user.name}</h1>
            <div className="profile-actions">
              <button className="follow-btn">Follow</button>
              <button className="message-btn">Message</button>
            </div>
            <div className="followers-following">
              <p>Followers: {user.followersCount}</p>
              <p>Following: {user.followingCount}</p>
            </div>
            <p>
              Profile created on:{" "}
              {new Date(user.CreationDate).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="profile-line"></div>

        {/* User's Posts Section */}
        <ul className="post-list">
          {posts.length > 0 ? (
            posts.map((post, index) => (
              <li key={post._id} className="post-item">
                <h2>{post.title}</h2>
                <p
                  className="description
                  "
                >
                  {post.desc}
                </p>

                {post.media ? (
                  <img src={post.media} alt="Post" className="post-image" />
                ) : null}
                <p>{new Date(post.createdAt).toLocaleString()}</p>
                {/* Add any voting or actions here if necessary */}
                <div className="vote-buttons">
                  {/* upvote button */}
                  <button
                    onClick={() => handleVote(post._id, "upvote")}
                    className={`vote-button ${
                      post.upvotes?.includes(currentUserId) ? "active" : ""
                    }`}
                    disabled={!currentUserId}
                  >
                    <FontAwesomeIcon
                      icon={faArrowUp}
                      color={
                        post.upvotes?.includes(currentUserId)
                          ? "#FF4500"
                          : "inherit"
                      }
                    />
                    {post.upvotes?.length || 0}
                  </button>

                  {/* Downvote Button */}
                  <button
                    onClick={() => handleVote(post._id, "downvote")}
                    className={`vote-button ${
                      post.downvotes?.includes(currentUserId) ? "active" : ""
                    }`}
                    disabled={!currentUserId}
                  >
                    <FontAwesomeIcon
                      icon={faArrowDown}
                      color={
                        post.downvotes?.includes(currentUserId)
                          ? "#7193FF"
                          : "inherit"
                      }
                    />
                    {post.downvotes?.length || 0}
                  </button>
                </div>
                <p>Post id:{post._id}</p>
              </li>
            ))
          ) : (
            <p>No posts found</p>
          )}
        </ul>
      </div>
    </>
  );
};

export default Profile;
