import React from "react";

const Comments = ({ comments }) => {
  return (
    <>
      <div className="comments-list">
        {comments && comments.length > 0 ? (
          comments.map((c) => (
            <div key={c._id} className="comment-item">
              <strong>{c.author?.name || "Unknown"}</strong>: {c.text}
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
