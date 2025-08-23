import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowUp,
  faArrowDown,
  faComment,
} from "@fortawesome/free-solid-svg-icons";
import "../styles/Homepage.css";
import "../styles/Comments.css";
import Logout from "./Logout";
import "../styles/ProfileBtn.css";
import Sidebar from "./Sidebar";
import Comments from "./Comments";
import { usePosts } from "../contexts/PostsContext";

const Homepage = () => {
  const { posts, setPosts, loading, error, setError } = usePosts();
  // const [results, setResults] = useState([]);
  const navigate = useNavigate();
  const apiUrl = process.env.REACT_APP_API_URL;
  const currentUserId = localStorage.getItem("userId");
  const [activePost, setActivePost] = useState(null); // post whose comments are open
  const [newComment, setComment] = useState("");

  //stop scrolling of homepage when modal is open
  useEffect(() => {
    if (activePost) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    // Cleanup in case component unmounts
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [activePost]);

  const handleSubmitComment = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }
      const res = await fetch(`${apiUrl}/${activePost._id}/comment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: newComment }),
      });
      if (!res.ok) throw new Error("Failed to send comment");

      const commentData = await res.json();

      setPosts(
        posts.map((post) =>
          post._id === activePost._id
            ? { ...post, comments: [...(post.comments || []), commentData] }
            : post
        )
      );
      
      setActivePost((prev) => ({
        ...prev,
        comments: [...(prev.comments || []), commentData],
      }));
      setComment("");
    } catch (err) {
      console.error("Error sending comment:", error);
      setError("Failed to send comment");
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.warn("No token found, redirecting to login");
      navigate("/login"); // Redirect to login page if no token is found
    }
  }, [navigate]);

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
        setPosts(
          posts.map((post) =>
            post._id === postId
              ? {
                  ...post,
                  upvotes: data.upvotes,
                  downvotes: data.downvotes,
                }
              : post
          )
        );
      }
    } catch (error) {
      console.error("Error voting:", error);
    }
  };

  if (loading) return <p>Loading..</p>;
  return (
    <>
      <nav className="navbar">
        <div className="logo-container"></div>

        <div className="nav-buttons">
          <Logout />
        </div>
      </nav>
      <Sidebar />
      <div className="homepage-container">
        <div className="header">
          <h1>Posts</h1>
        </div>
        <div className="create-post-container">
          <button
            onClick={() => navigate("/create")}
            className="create-post-button"
          >
            + Create Post
          </button>
        </div>

        {error && <p style={{ color: "red" }}>{error}</p>}

        <ul className="post-list">
          {posts.length > 0 ? (
            posts.map((post, index) => (
              <li
                key={post._id}
                className="post-item"
                openComments={() => setActivePost(post)}
              >
                <div className="post-author">
                  {post.author ? (
                    <>
                      <Link to={`/profile/${post.author._id}`}>
                        <img
                          src={post.author.profilePicture}
                          alt={post.author.name}
                          className="author-img"
                        />
                      </Link>
                      <div>
                        <h3>{post.author.name}</h3>
                        <p>@{post.author.userName}</p>
                      </div>
                    </>
                  ) : (
                    <p>unkown</p>
                  )}
                </div>
                <p className="profile-line"></p>
                <h2>{post.title}</h2>
                <p className="description">{post.desc}</p>

                {post.media ? (
                  <img
                    src={`${post.media}`}
                    className="post-image"
                    alt={post.title}
                  />
                ) : null}

                <p>{new Date(post.createdAt).toLocaleString()}</p>

                <div className="buttons-container">
                  {/* upvote button */}
                  <button
                    onClick={() => handleVote(post._id, "upvote")}
                    className={`action-button upvote ${
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
                    className={` action-button downvote ${
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
                  <button
                    className="action-button "
                    onClick={() => {
                      setActivePost(post);
                    }}
                  >
                    <FontAwesomeIcon icon={faComment} />{" "}
                    {post.comments?.length || 0}
                  </button>
                </div>
              </li>
            ))
          ) : (
            <p>No posts found</p>
          )}
        </ul>
      </div>
      {activePost && (
        <div className="comments-modal-overlay">
          <div className="comments-modal">
            <button
              className="close-comments"
              onClick={() => setActivePost(null)}
            >
              ✕
            </button>

            <div className="comments-content">
              <Comments
                comments={activePost.comments}
                setPosts={setPosts}
                currentUserId={currentUserId}
                activePost={activePost}
                setActivePost={setActivePost}
              />
            </div>
            <div className="comment-field">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmitComment();
                }}
                maxLength={300}
                placeholder="write your comment.."
              />
              <button
                onClick={handleSubmitComment}
                disabled={!newComment?.trim()}
              >
                send
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
export default Homepage;
