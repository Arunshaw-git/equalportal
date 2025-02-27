import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowUp } from "@fortawesome/free-solid-svg-icons";
import "../styles/Homepage.css";
import Logout from "./Logout";

const Homepage = () => {
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState(null);
  const [results, setResults] = useState([]);
  const navigate = useNavigate();
  const apiUrl = process.env.REACT_APP_API_URL;

  useEffect(() => {
    // Function to fetch posts from the backend
    const fetchPosts = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("Token not provided while fetching posts");
        navigate("/login"); // Redirect to login page if no token is found
        return; // Prevent fetching posts without a token
      }

      try {
        const response = await fetch(`${apiUrl}/`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`, // Use token from localStorage
          },
        });

        if (!response.ok) {
          const errorData = await response.json(); // Attempt to parse the response as JSON
          throw new Error(errorData.error || "Failed to fetch posts");
        }

        const data = await response.json();
        console.log(data);
        setPosts(data); // Set posts into state
      } catch (error) {
        setError(error.message);
        console.error("Fetch error:", error); // Log any errors encountered during fetch
      }
    };

    fetchPosts();
  }, [apiUrl]);

  useEffect(() => {
    let isMounted = true; // To prevent memory leaks

    const fetchResults = async () => {
      const token = localStorage.getItem("token"); // Move this inside the function
      if (!token) return;

      try {
        const response = await fetch(`${apiUrl}/results`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        console.log("Response Status:", response.status);
        console.log("Response Headers:", response.headers);

        if (!response.ok) throw new Error("Failed to fetch results");

        const data = await response.json();
        console.log("Fetched results:", data);
        setResults(data); // Update results in state

        //start another request
        if (isMounted) {
          setResults(data);
          setTimeout(fetchResults, 5000); // Retry every 5s
        }
      } catch (error) {
        console.error("Error fetching results:", error);
        if (isMounted) setTimeout(fetchResults, 5000);
      }
    };

    fetchResults();
    return () => {
      isMounted = false; // Cleanup function
    };
  }, [apiUrl]);

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
            posts.map((post, index) => (
              <li key={post._id} className="post-item">
                <h2>{post.title}</h2>
                <p className="description">{post.desc}</p>

                {/* Display results if available, otherwise "No links found" */}
                <p>
                  {results.length === 0 ||
                  !results[index] ||
                  results[index] === ""
                    ? "No Links found"
                    : "Related Link:"}
                </p>
                {results.length > 0 && results[index] && (
                  <p>
                    <a
                      href={results[index]}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {results[index]}
                    </a>
                  </p>
                )}

                {post.media ? (
                  <img
                    src={`${post.media}`}
                    className="post-image"
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
