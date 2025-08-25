import React from "react";
import { faArrowUp, faArrowDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useNavigate } from "react-router-dom";
const Comments = ({
  comments,
  currentUserId,
  activePost,
  setPosts,
  setActivePost,
}) => {
  const apiUrl = process.env.REACT_APP_API_URL;
  const navigate = useNavigate();
  const handleCommentVote = async (commentId, voteType) => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("Token not provided ");
      navigate("/login")
      return; // Prevent fetching posts without a token
    }
    try {
      const response = await fetch(
        `${apiUrl}/comment/${voteType}s/${commentId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      setActivePost((prev) => {
        const updatedComments = prev.comments.map((comment) =>
          comment._id === commentId
            ? {
                ...comment,
                upvotes: data.upvotes || [],
                downvotes: data.downvotes || [],
              }
            : comment
        );

        return {
          ...prev,
          comments: updatedComments,
        };
      });

      setPosts((prevPosts) => {
        return prevPosts.map((post) =>
          post._id === activePost._id
            ? {
                ...post,
                comments: post.comments.map((comment) =>
                  comment._id === commentId
                    ? {
                        ...comment,
                        upvotes: data.upvotes || [],
                        downvotes: data.downvotes || [],
                      }
                    : comment
                ),
              }
            : post
        );
      });
    } catch (err) {
      console.error("error while handling commment vote:", err);
    }
  };

  return (
    <>
      <div className="comments-list">
        {comments && comments.length > 0 ? (
          comments.map((c) => (
            <div key={c._id} className="comment-item">
              <img
                alt="pfp"
                src={c.author?.profilePicture}
                className="comment-profilePicture"
              />
              <div className="comment-container">
                <h6 style={{ fontSize: "14px", fontWeight: "light" }}>
                  {c.author?.name || "Unknown"}
                </h6>
                <p>{c.text}</p>

                {/*vote buttons*/}
                <div className="comment-buttons">
                  <button
                    className={`comment-action-button comment-upvote ${
                      c.upvotes?.includes(currentUserId) ? "active" : ""
                    }`}
                    onClick={() => handleCommentVote(c._id, "upvote")}
                  >
                    <FontAwesomeIcon
                      icon={faArrowUp}
                      color={
                        c.upvotes?.includes(currentUserId)
                          ? "#FF4500"
                          : "inherit"
                      }
                    />
                    {c.upvotes?.length || 0}
                  </button>

                  <button
                    className={`comment-action-button comment-downvote ${
                      c.downvotes?.includes(currentUserId) ? "active" : ""
                    }`}
                    onClick={() => handleCommentVote(c._id, "downvote")}
                  >
                    <FontAwesomeIcon
                      icon={faArrowDown}
                      color={
                        c.upvotes?.includes(currentUserId)
                          ? "#FF4500"
                          : "inherit"
                      }
                    />
                    {c.downvotes?.length || 0}
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p>No comments yet</p>
        )}
      </div>
    </>
  );
};

export default Comments;
