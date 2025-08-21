import React from "react";
import {
  faArrowUp,
  faArrowDown,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const Comments = ({ comments, currentUserId }) => {
  const apiUrl = process.env.REACT_APP_API_URL;

  const handleCommentVote = async (commentId, voteType)=>{
    const token = localStorage.getItem("token")

    const response = await fetch(`${apiUrl}/comment/${voteType}s/${commentId}`,{
      method: "POST",
      headers:{
        "Content-Type": "application/json",
        Authorization :`Bearer ${token}`,
      }
    })
    const data = response.json();
    comments.filter((c)=> c._id===commentId ? data : null )

  }

  return (
    <>
      <div className="comments-list">
        {comments && comments.length > 0 ? (
          comments.map((c) => (
            <div key={c._id} className="comment-item">
              <img
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
                      c.upvotes.includes(currentUserId) ? "active" : ""
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
                    {c.upvotes?.length || 0 }

                  </button>

                  <button
                    className={`comment-action-button comment-downvote ${
                      c.upvotes.includes(currentUserId) ? "active" : ""
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
                    {c.downvotes?.length || 0 }
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
