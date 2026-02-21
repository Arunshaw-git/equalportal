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
import { useProfileUser } from "../contexts/ProfileUser";

const Profile = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const currentUserId = localStorage.getItem("userId");
  const userIdToFetch = id || currentUserId;

  const { profileUser, setProfileUser } = useProfileUser();

  const [posts, setPosts] = useState([]);
  const apiUrl = process.env.REACT_APP_API_URL;
  const [activePost, setActivePost] = useState(null);
  const [error, setError] = useState(null);
  const [newComment, setComment] = useState("");
  const [isPhotoUploading, setIsPhotoUploading] = useState(false);

  const [isFollowing, setIsFollowing] = useState(false);

  const humanizeFetchError = (err, fallback) => {
    const raw = String(err?.message || "").toLowerCase();
    if (raw.includes("failed to fetch") || raw.includes("networkerror")) {
      return "Network error: cannot reach server. Ensure backend is running and internet is available.";
    }
    return err?.message || fallback;
  };

  const parseErrorFromResponse = async (response, fallback) => {
    try {
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const data = await response.json();
        return data?.error || fallback;
      }
      const text = await response.text();
      if (text.includes("Cannot PATCH") || text.includes("Cannot PUT") || text.includes("Cannot POST")) {
        return "Profile picture API route is unavailable on backend.";
      }
      return text || fallback;
    } catch {
      return fallback;
    }
  };

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
      console.error("Error sending comment:", err);
      setError("Failed to send comment");
    }
  };

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
    } catch (voteError) {
      console.error("Error voting:", voteError);
    }
  };

  const handleDeletePost = async (postId) => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const confirmDelete = window.confirm("Delete this post permanently?");
    if (!confirmDelete) return;

    try {
      const deleteEndpoints = [`${apiUrl}/posts/${postId}`, `${apiUrl}/profile/posts/${postId}`];
      let response = null;
      let lastErrorMessage = "Failed to delete post";

      for (const endpoint of deleteEndpoints) {
        try {
          response = await fetch(endpoint, {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });
        } catch (networkError) {
          lastErrorMessage = humanizeFetchError(
            networkError,
            "Network error while deleting post"
          );
          continue;
        }

        if (response.ok) break;

        const contentType = response.headers.get("content-type") || "";
        const bodyText = contentType.includes("application/json")
          ? JSON.stringify(await response.json())
          : await response.text();

        if (bodyText.includes("Cannot DELETE")) {
          lastErrorMessage = "Delete route missing on backend. Restart backend server.";
          continue;
        }

        lastErrorMessage = bodyText || `Failed to delete post (${response.status})`;
      }

      if (!response || !response.ok) {
        throw new Error(lastErrorMessage);
      }

      setPosts((prevPosts) => prevPosts.filter((post) => post._id !== postId));
      setActivePost((prev) => (prev?._id === postId ? null : prev));
      setError(null);
    } catch (deleteError) {
      console.error("Error deleting post:", deleteError);
      setError(humanizeFetchError(deleteError, "Failed to delete post"));
    }
  };

  const handleProfilePictureChange = async (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    const maxSize = 5 * 1024 * 1024;

    if (!allowedTypes.includes(selectedFile.type)) {
      setError("Invalid image type. Upload JPEG, PNG, GIF, or WEBP.");
      return;
    }

    if (selectedFile.size > maxSize) {
      setError("Image is too large. Maximum size is 5MB.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setIsPhotoUploading(true);
      setError(null);

      const mediaFormData = new FormData();
      mediaFormData.append("file", selectedFile);
      mediaFormData.append("upload_preset", "equalportal");
      mediaFormData.append("cloud_name", "djnkm0nfh");

      let cloudinaryResponse;
      try {
        cloudinaryResponse = await fetch(
          "https://api.cloudinary.com/v1_1/djnkm0nfh/image/upload",
          {
            method: "POST",
            body: mediaFormData,
          }
        );
      } catch (uploadNetworkError) {
        throw new Error(
          "Cannot upload image right now. Check internet connection and try again."
        );
      }

      const cloudinaryResult = await cloudinaryResponse.json();
      if (!cloudinaryResponse.ok) {
        throw new Error(cloudinaryResult.message || "Failed to upload profile image");
      }

      const imageUrl = cloudinaryResult.secure_url;
      const saveAttempts = [
        { url: `${apiUrl}/profile/picture`, method: "PATCH" },
        { url: `${apiUrl}/profile/picture`, method: "PUT" },
        { url: `${apiUrl}/settings/account`, method: "PATCH" },
      ];

      let saved = false;
      let lastSaveError = "Failed to save profile image";

      for (const attempt of saveAttempts) {
        let saveResponse;
        try {
          saveResponse = await fetch(attempt.url, {
            method: attempt.method,
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ profilePicture: imageUrl }),
          });
        } catch (saveNetworkError) {
          lastSaveError = humanizeFetchError(saveNetworkError, "Network error saving profile image");
          continue;
        }

        if (!saveResponse.ok) {
          lastSaveError = await parseErrorFromResponse(
            saveResponse,
            `Failed to save profile image (${attempt.method})`
          );
          continue;
        }

        let saveData = {};
        try {
          saveData = await saveResponse.json();
        } catch {
          saveData = {};
        }

        setProfileUser((prev) => ({
          ...prev,
          profilePicture: saveData?.user?.profilePicture || imageUrl,
        }));
        saved = true;
        break;
      }

      if (!saved) {
        throw new Error(lastSaveError || "Failed to save profile image");
      }
    } catch (uploadError) {
      console.error("Error updating profile picture:", uploadError);
      setError(humanizeFetchError(uploadError, "Failed to update profile picture"));
    } finally {
      setIsPhotoUploading(false);
      e.target.value = "";
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
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

        if (userIdToFetch !== currentUserId) {
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
        setPosts(userPosts);
      } catch (fetchError) {
        console.log("Error while fetching data in profile:", fetchError);
      }
    };
    fetchProfile();
  }, [apiUrl, navigate, userIdToFetch, currentUserId, setProfileUser]);

  const handleFollowChange = (newStatus) => {
    setIsFollowing(newStatus);
  };

  const displayName =
    profileUser.name?.trim() ||
    profileUser.userName?.split("@")[0] ||
    "Community Member";
  const displayHandle = profileUser.userName
    ? profileUser.userName.replace(/^@/, "")
    : "";

  return (
    <>
      <nav className="homepage-navbar">
        <Link to="/">
          <div className="logo-container"></div>
        </Link>
        <div className="home-nav-actions">
          <span className="home-status-pill">Profile</span>
          <Logout />
        </div>
      </nav>
      <Sidebar />

      <main className="profile-container">
        <section className="profile-hero">
          <div className="profile-cover" aria-hidden="true">
            <div className="profile-cover-glow"></div>
          </div>

          <div className="profile-card">
            <div className="profile-image">
              <img
                src={profileUser.profilePicture || "https://via.placeholder.com/140?text=User"}
                alt={`${profileUser.name || "User"} profile`}
              />
              {userIdToFetch === currentUserId && (
                <label className="profile-image-upload" htmlFor="profilePictureInput">
                  {isPhotoUploading ? "Uploading..." : "Change Photo"}
                </label>
              )}
              {userIdToFetch === currentUserId && (
                <input
                  id="profilePictureInput"
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleProfilePictureChange}
                  className="profile-image-input"
                  disabled={isPhotoUploading}
                />
              )}
            </div>

            <div className="profile-details">
              <div className="profile-title">
                <h1>{displayName}</h1>
                {displayHandle && <p className="profile-handle">@{displayHandle}</p>}
                {profileUser.email && <p className="profile-email">{profileUser.email}</p>}
              </div>

              <p className="profile-bio">
                {profileUser.bio ||
                  "Building a fairer world through stories, action, and community."}
              </p>

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

                <Link to={`/${currentUserId}/${profileUser._id}`}>
                  <button
                    className="message-btn"
                    disabled={!profileUser?._id || profileUser._id === currentUserId}
                  >
                    Message
                  </button>
                </Link>
              </div>

              <div className="profile-stats">
                <div className="profile-stat">
                  <span className="stat-number">{posts.length || 0}</span>
                  <span className="stat-label">Posts</span>
                </div>
                <div className="profile-stat">
                  <span className="stat-number">{profileUser.followers?.length || 0}</span>
                  <span className="stat-label">Followers</span>
                </div>
                <div className="profile-stat">
                  <span className="stat-number">{profileUser.following?.length || 0}</span>
                  <span className="stat-label">Following</span>
                </div>
              </div>

              <div className="profile-meta">
                <span>
                  Joined{" "}
                  {profileUser.createdAt
                    ? new Date(profileUser.createdAt).toLocaleDateString()
                    : "Unknown"}
                </span>
              </div>
            </div>
          </div>
        </section>

        <div className="profile-line"></div>

        <section className="profile-posts-header">
          <h2>Recent Posts</h2>
          <p>Latest updates and community contributions</p>
        </section>

        {error && <p className="profile-error">{error}</p>}

        <ul className="profile-posts">
          {posts.length > 0 ? (
            posts.map((post) => (
              <li
                key={post._id}
                className="post-item"
                onClick={() => setActivePost(post)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setActivePost(post);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={`Open full post: ${post.title}`}
              >
                <div className="profile-post-top">
                  <h2>{post.title}</h2>
                  {userIdToFetch === currentUserId && (
                    <button
                      type="button"
                      className="profile-delete-post-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePost(post._id);
                      }}
                    >
                      Delete
                    </button>
                  )}
                </div>
                <p className="description">{post.desc}</p>

                {post.media ? <img src={post.media} alt="Post" className="post-image" /> : null}

                <p className="post-time">{new Date(post.createdAt).toLocaleString()}</p>

                <div className="buttons-container">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleVote(post._id, "upvote");
                    }}
                    className={`action-button upvote ${
                      post.upvotes?.includes(currentUserId) ? "active" : ""
                    }`}
                    disabled={!currentUserId}
                  >
                    <FontAwesomeIcon
                      icon={faArrowUp}
                      color={post.upvotes?.includes(currentUserId) ? "#FF4500" : "inherit"}
                    />
                    {post.upvotes?.length || 0}
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleVote(post._id, "downvote");
                    }}
                    className={`action-button downvote ${
                      post.downvotes?.includes(currentUserId) ? "active" : ""
                    }`}
                    disabled={!currentUserId}
                  >
                    <FontAwesomeIcon
                      icon={faArrowDown}
                      color={post.downvotes?.includes(currentUserId) ? "#7193FF" : "inherit"}
                    />
                    {post.downvotes?.length || 0}
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActivePost(post);
                    }}
                    className="action-button"
                  >
                    <FontAwesomeIcon icon={faComment} />
                    {post.comments?.length || 0}
                  </button>
                </div>
              </li>
            ))
          ) : (
            <li className="profile-empty">No posts yet. New stories and updates will appear here.</li>
          )}
        </ul>
      </main>

      {activePost && (
        <div className="comments-modal-overlay">
          <div className="comments-modal">
            <button className="close-comments" onClick={() => setActivePost(null)}>
              x
            </button>

            <div className="profile-modal-post">
              <h3>{activePost.title}</h3>
              {activePost.desc ? <p className="profile-modal-post-desc">{activePost.desc}</p> : null}
              {activePost.media ? (
                <img
                  src={activePost.media}
                  alt={activePost.title || "Post media"}
                  className="profile-modal-post-image"
                />
              ) : null}
              <p className="profile-modal-post-time">
                {activePost.createdAt ? new Date(activePost.createdAt).toLocaleString() : ""}
              </p>
            </div>

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
                placeholder="Write your comment..."
              />
              <button onClick={handleSubmitComment} disabled={!newComment?.trim()}>
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Profile;
