import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowUp } from "@fortawesome/free-solid-svg-icons";
import "../styles/Homepage.css";
import Logout from "./Logout";

const Homepage = () => {
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Check if user is logged in by verifying the token in localStorage
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login"); // Redirect to login page if no token is found
    }
  }, [navigate]);

  // Function to fetch posts from the backend
  const fetchPosts = async () => {
    try {
      const response = await fetch("http://localhost:5000/", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Use token from localStorage
        },
      });

      if (!response.ok) {
        const errorData = await response.json(); // Attempt to parse the response as JSON
        console.error("Error fetching posts:", errorData);
        throw new Error(errorData.error || "Failed to fetch posts");
      }

      const data = await response.json();
      setPosts(data); // Set posts into state
    } catch (error) {
      setError(error.message);
      console.error("Fetch error:", error); // Log any errors encountered during fetch
    }
  };
  // Use useEffect to fetch posts when component mounts
  useEffect(() => {
    fetchPosts();
  }, []);

  return (
    <>
      <div className="homepage-container">
        <nav className="navbar">
          <Link to="/">
            <div className="logo-container"></div>
          </Link>
          <Logout />
        </nav>

        <div className="header">
          <p>null</p>
          <h1>Posts</h1>
        </div>
        <div className="create-post-container">
          <button
            onClick={() => navigate("/create")}
            className="create-post-button"
          >
            + Create New Post
          </button>
        </div>
        {error && <p style={{ color: "red" }}>{error}</p>}

        <ul className="post-list">
          {posts.length > 0 ? (
            posts.map((post) => (
              <li key={post._id} className="post-item">
                <h2>{post.title}</h2>
                <p>{post.desc}</p>
                {post.media ? (
                  <img
                    src={`http://localhost:5000/${post.media}`}
                    alt={post.title}
                  />
                ) : null}
                <p>{new Date(post.creation_date).toLocaleString()}</p>
                <button className="upvote-button">
                  <FontAwesomeIcon icon={faArrowUp} size="lg" /> {post.upvote}{" "}
                  Upvotes
                </button>
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
export default Homepage;
