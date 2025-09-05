import React, { useEffect, useState } from "react";
import Logout from "./Logout";
import "../styles/Profile.css";
import "../styles/Homepage.css";
import Sidebar from "./Sidebar";
import { useNavigate, Link, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowUp,
  faArrowDown,
  faComment,
} from "@fortawesome/free-solid-svg-icons";
import Comments from "./Comments";
import FollowBtn from "./FollowBtn";
import {  useProfileUser } from "../contexts/ProfileUser";


const Profile = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const currentUserId = localStorage.getItem("userId");
  const userIdToFetch = id || currentUserId;

  const {profileUser, setProfileUser} = useProfileUser();

  const [posts, setPosts] = useState([]);
  const apiUrl = process.env.REACT_APP_API_URL;
  const [activePost, setActivePost] = useState(null);
  const [error, setError] = useState(null);
  const [newComment, setComment] = useState("");

  const [isFollowing, setIsFollowing] = useState(false);

 
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
        setProfileUser(data);
        console.log("user data:", data);

        if (userIdToFetch !== currentUserId) {
          // Check if the current user is following this profile user
          setIsFollowing(data.followers?.includes(currentUserId) || false);
        }
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
        console.log(" Error while fetching data in profile:", e);
      }
    };
    fetchProfile();
  }, [apiUrl, navigate, userIdToFetch, currentUserId,setProfileUser]);

  const handleFollowChange = (newStatus) => {
    setIsFollowing(newStatus); // Update follow status when button is clicked
  };

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
            <img src={profileUser.profilePicture} alt="Profile" />
          </div>
          <div className="profile-details">
            <h1>{profileUser.name}</h1>
            <div className="profile-actions">
              {userIdToFetch !== currentUserId && (
                <FollowBtn
                  userId={profileUser._id}
                  currentUserId={currentUserId}
                  isFollowing={isFollowing}
                  onFollowChange={handleFollowChange}
                  setUser={setProfileUser}
                />
              )}

              <Link to={`/${currentUserId}/${profileUser._id}`} >
                <button
                className="message-btn"
                disabled={!profileUser?._id || profileUser._id === currentUserId}
              >
                Message
              </button>
              </Link>

            </div>
            <div className="followers-following">
              <p>Followers: {profileUser.followers?.length || 0}</p>
              <p>Following: {profileUser.following?.length || 0}</p>
            </div>
            <p>
              Profile created on:{" "}
              {new Date(profileUser.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="profile-line"></div>

        {/* User's Posts Section */}

        <ul className="profile-posts">
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
                <div className="buttons-container">
                  {/* upvote button */}
                  <button
                    onClick={() => handleVote(post._id, "upvote")}
                    className={`action-button  upvote ${
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
                    className={`action-button downvote ${
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
                    onClick={() => setActivePost(post)}
                    className="action-button"
                  >
                    <FontAwesomeIcon icon={faComment} />{" "}
                    {post.comments?.length || 0}
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

export default Profile;
