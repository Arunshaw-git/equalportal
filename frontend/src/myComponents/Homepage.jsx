import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faComment,
  faArrowTrendUp,
  faComments,
  faNewspaper,
} from "@fortawesome/free-solid-svg-icons";
import "../styles/Homepage.css";
import "../styles/Comments.css";
import "../styles/ProfileBtn.css";
import Sidebar from "./Sidebar";
import Comments from "./Comments";
import Logout from "./Logout";
import FollowBtn from "./FollowBtn";
import { usePosts } from "../contexts/PostsContext";

const Homepage = () => {
  const { posts, setPosts, loading, error, setError } = usePosts();
  const navigate = useNavigate();
  const apiUrl = process.env.REACT_APP_API_URL;
  const authToken = localStorage.getItem("token");

  const decodeUserIdFromToken = (token) => {
    try {
      if (!token) return null;
      const payloadPart = token.split(".")[1];
      if (!payloadPart) return null;
      const base64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
      const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
      const payload = JSON.parse(atob(padded));
      return payload?.user?.id || null;
    } catch {
      return null;
    }
  };

  const currentUserId = localStorage.getItem("userId") || decodeUserIdFromToken(authToken);

  const normalizeId = (value) => {
    if (!value) return "";
    if (typeof value === "object") {
      if (value._id) return String(value._id);
      if (value.$oid) return String(value.$oid);
    }
    return String(value);
  };

  const [activePost, setActivePost] = useState(null);
  const [newComment, setComment] = useState("");
  const [myReactions, setMyReactions] = useState({});
  const [followStatusByUser, setFollowStatusByUser] = useState({});

  const safePosts = useMemo(() => posts || [], [posts]);
  const postIdsKey = useMemo(() => safePosts.map((post) => post._id).join(","), [safePosts]);

  const topPosts = useMemo(
    () =>
      [...safePosts]
        .sort((a, b) => {
          const scoreA =
            (Array.isArray(a.upvotes) ? a.upvotes.length : 0) +
            (Array.isArray(a.downvotes) ? a.downvotes.length : 0) +
            (Array.isArray(a.comments) ? a.comments.length : 0);
          const scoreB =
            (Array.isArray(b.upvotes) ? b.upvotes.length : 0) +
            (Array.isArray(b.downvotes) ? b.downvotes.length : 0) +
            (Array.isArray(b.comments) ? b.comments.length : 0);
          return scoreB - scoreA;
        })
        .slice(0, 3),
    [safePosts]
  );

  const totalComments = useMemo(
    () => safePosts.reduce((acc, post) => acc + (Array.isArray(post.comments) ? post.comments.length : 0), 0),
    [safePosts]
  );

  const totalVotes = useMemo(
    () =>
      safePosts.reduce(
        (acc, post) =>
          acc +
          (Array.isArray(post.upvotes) ? post.upvotes.length : 0) +
          (Array.isArray(post.downvotes) ? post.downvotes.length : 0),
        0
      ),
    [safePosts]
  );

  const newsCount = useMemo(() => safePosts.filter((post) => post.newsOrNot).length, [safePosts]);

  const reactionOptions = [
    { key: "sad", label: "Sad" },
    { key: "smile", label: "Smile" },
    { key: "angry", label: "Angry" },
    { key: "wow", label: "Wow" },
  ];

  const hasUserVote = (voteList) =>
    Array.isArray(voteList) && voteList.some((vote) => normalizeId(vote) === normalizeId(currentUserId));

  useEffect(() => {
    const nextState = {};
    safePosts.forEach((post) => {
      const authorId = post?.author?._id;
      if (!authorId) return;
      if (nextState[authorId] !== undefined) return;
      const followers = Array.isArray(post?.author?.followers) ? post.author.followers : [];
      nextState[authorId] = followers.some(
        (follower) => normalizeId(follower) === normalizeId(currentUserId)
      );
    });
    setFollowStatusByUser((prev) => ({ ...nextState, ...prev }));
  }, [safePosts, currentUserId]);

  const getVoteCount = (voteList) => (Array.isArray(voteList) ? voteList.length : 0);

  const getReactionEmoji = (reactionType) => {
    if (reactionType === "like") return "\u{1F44D}";
    if (reactionType === "sad") return "\u{1F622}";
    if (reactionType === "smile") return "\u{1F60A}";
    if (reactionType === "angry") return "\u{1F620}";
    if (reactionType === "wow") return "\u{1F62E}";
    return "\u{1F44D}";
  };

  const handleFeedFollowChange = (authorId, newStatus) => {
    setFollowStatusByUser((prev) => ({
      ...prev,
      [authorId]: newStatus,
    }));
  };

  useEffect(() => {
    if (activePost) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
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

      setPosts((prevPosts) =>
        (prevPosts || []).map((post) =>
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

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    const fetchReactionsForPosts = async () => {
      const token = localStorage.getItem("token");
      if (!token || safePosts.length === 0) return;

      try {
        const reactionsList = await Promise.all(
          safePosts.map(async (post) => {
            const response = await fetch(`${apiUrl}/reactions/post/${post._id}`, {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            });

            if (!response.ok) {
              return { postId: post._id, myReaction: null };
            }

            const data = await response.json();
            return { postId: post._id, myReaction: data.myReaction || null };
          })
        );

        const mappedReactions = {};
        reactionsList.forEach((item) => {
          mappedReactions[item.postId] = item.myReaction;
        });
        setMyReactions(mappedReactions);
      } catch (reactionError) {
        console.error("Error loading reactions:", reactionError);
      }
    };

    fetchReactionsForPosts();
  }, [apiUrl, postIdsKey]);

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
        setPosts((prevPosts) =>
          (prevPosts || []).map((post) =>
            post._id === postId
              ? {
                  ...post,
                  upvotes: data.upvotes,
                  downvotes: data.downvotes,
                }
              : post
          )
        );
        setError(null);
        return data;
      }

      setError("Failed to update vote");
      return null;
    } catch (voteError) {
      console.error("Error voting:", voteError);
      setError("Failed to update vote");
      return null;
    }
  };

  const handleDownvote = async (postId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const existingReaction = myReactions[postId] || null;
      if (existingReaction && existingReaction !== "like") {
        let clearReactionResponse = await fetch(`${apiUrl}/reactions`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ targetType: "post", targetId: postId }),
        });

        if (clearReactionResponse.status === 404) {
          clearReactionResponse = await fetch(`${apiUrl}/reactions/toggle`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ targetType: "post", targetId: postId, type: existingReaction }),
          });
        }

        if (clearReactionResponse.ok) {
          const clearData = await clearReactionResponse.json();
          setPosts((prevPosts) =>
            (prevPosts || []).map((post) =>
              post._id === postId
                ? { ...post, reactionCounts: clearData.reactionCounts || post.reactionCounts }
                : post
            )
          );
        }
      }

      const voteData = await handleVote(postId, "downvote");
      if (!voteData) return;

      setMyReactions((prev) => ({
        ...prev,
        [postId]: null,
      }));
    } catch (downvoteError) {
      console.error("Error applying exclusive downvote:", downvoteError);
      setError("Failed to update reaction");
    }
  };

  const handleReaction = async (postId, reactionType) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const existingReaction = myReactions[postId] || null;
      const postForReaction = safePosts.find((post) => post._id === postId);
      const userHasDownvote = hasUserVote(postForReaction?.downvotes);
      const userHasUpvote = hasUserVote(postForReaction?.upvotes);

      if (reactionType === "like") {
        if (userHasDownvote) {
          const clearedDownvote = await handleVote(postId, "downvote");
          if (!clearedDownvote) return;
        }

        const voteData = await handleVote(postId, "upvote");
        if (!voteData) return;

        const userLiked =
          normalizeId(currentUserId) !== ""
            ? Array.isArray(voteData.upvotes) &&
              voteData.upvotes.some((id) => normalizeId(id) === normalizeId(currentUserId))
            : existingReaction !== "like";

        setMyReactions((prev) => ({
          ...prev,
          [postId]: userLiked ? "like" : null,
        }));
        return;
      }

      if (userHasDownvote) {
        const clearedDownvote = await handleVote(postId, "downvote");
        if (!clearedDownvote) return;
      }

      let effectiveExistingReaction = existingReaction;
      if (existingReaction === "like" || userHasUpvote) {
        const clearedUpvote = await handleVote(postId, "upvote");
        if (!clearedUpvote) return;
        effectiveExistingReaction = null;
      }

      let response = await fetch(`${apiUrl}/reactions/toggle`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ targetType: "post", targetId: postId, type: reactionType }),
      });

      if (response.status === 404) {
        const isToggleOff = effectiveExistingReaction === reactionType;
        response = await fetch(`${apiUrl}/reactions`, {
          method: isToggleOff ? "DELETE" : "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(
            isToggleOff
              ? { targetType: "post", targetId: postId }
              : { targetType: "post", targetId: postId, type: reactionType }
          ),
        });
      }

      if (response.status === 404 && reactionType === "like") {
        const voteResponse = await fetch(`${apiUrl}/upvotes/${postId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!voteResponse.ok) {
          throw new Error("Like endpoint is unavailable. Please restart backend.");
        }

        const voteData = await voteResponse.json();
        setPosts((prevPosts) =>
          (prevPosts || []).map((post) =>
            post._id === postId
              ? {
                  ...post,
                  upvotes: voteData.upvotes,
                  downvotes: voteData.downvotes,
                  reactionCounts: {
                    ...(post.reactionCounts || {}),
                    like: Array.isArray(voteData.upvotes) ? voteData.upvotes.length : 0,
                  },
                }
              : post
          )
        );

        const userLiked =
          Array.isArray(voteData.upvotes) &&
          voteData.upvotes.some((id) => (typeof id === "object" ? id?._id : id) === currentUserId);

        setMyReactions((prev) => ({
          ...prev,
          [postId]: userLiked ? "like" : null,
        }));

        setError(null);
        return;
      }

      if (!response.ok) {
        let message = `Failed to update reaction (${response.status})`;
        try {
          const raw = await response.text();
          if (raw) {
            try {
              const errorData = JSON.parse(raw);
              message = errorData?.details || errorData?.error || raw || message;
            } catch {
              if (raw.includes("Cannot POST /reactions/toggle") || raw.includes("Cannot PUT /reactions")) {
                message = "Reaction API route is missing. Restart backend server.";
              } else {
                message = raw;
              }
            }
          }
        } catch {
          // keep fallback message
        }
        throw new Error(message);
      }

      const data = await response.json();
      setPosts((prevPosts) =>
        (prevPosts || []).map((post) =>
          post._id === postId
            ? { ...post, reactionCounts: data.reactionCounts || post.reactionCounts }
            : post
        )
      );

      setMyReactions((prev) => ({
        ...prev,
        [postId]:
          data?.myReaction !== undefined
            ? data.myReaction
            : effectiveExistingReaction === reactionType
              ? null
              : reactionType,
      }));

      setError(null);
    } catch (reactionError) {
      console.error("Error updating reaction:", reactionError);
      setError(reactionError?.message || "Failed to update reaction");
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (loading) return <p className="home-loading">Loading feed...</p>;

  return (
    <>
      <nav className="homepage-navbar">
        <div className="logo-container"></div>
        <div className="home-nav-actions">
          <span className="home-status-pill">Live feed</span>
          <Logout />
        </div>
      </nav>

      <Sidebar />

      <div className="homepage-container">
        <section className="home-hero">
          <div>
            <p className="home-kicker">Community stream</p>
            <h1>One trusted place for your community updates.</h1>
            <p>
              Discover verified stories, join discussions, and publish updates that move people to action.
            </p>
          </div>

          <div className="home-hero-actions">
            <button onClick={() => navigate("/create")} className="create-post-button">
              + Create Post
            </button>
            <button onClick={() => navigate("/trending")} className="hero-secondary-button">
              Explore Trending
            </button>
          </div>
        </section>

        <section className="home-stats-grid">
          <article className="home-stat-card">
            <div className="home-stat-icon">
              <FontAwesomeIcon icon={faNewspaper} />
            </div>
            <p className="home-stat-label">Published Posts</p>
            <h3>{safePosts.length}</h3>
          </article>

          <article className="home-stat-card">
            <div className="home-stat-icon">
              <FontAwesomeIcon icon={faComments} />
            </div>
            <p className="home-stat-label">Total Comments</p>
            <h3>{totalComments}</h3>
          </article>

          <article className="home-stat-card">
            <div className="home-stat-icon">
              <FontAwesomeIcon icon={faArrowTrendUp} />
            </div>
            <p className="home-stat-label">Total Reactions</p>
            <h3>{totalVotes}</h3>
          </article>

          <article className="home-stat-card">
            <div className="home-stat-icon">
              <FontAwesomeIcon icon={faNewspaper} />
            </div>
            <p className="home-stat-label">Classified News</p>
            <h3>{newsCount}</h3>
          </article>
        </section>

        <section className="home-spotlight">
          <div className="home-spotlight-head">
            <h2>Spotlight</h2>
            <p>Most engaged discussions right now</p>
          </div>

          <div className="home-spotlight-list">
            {topPosts.length > 0 ? (
              topPosts.map((post) => (
                <article key={`spotlight-${post._id}`} className="spotlight-card">
                  <h3>{post.title}</h3>
                  <p>{post.desc}</p>
                  <button className="spotlight-btn" type="button" onClick={() => setActivePost(post)}>
                    Open Discussion
                  </button>
                </article>
              ))
            ) : (
              <p className="spotlight-empty">No spotlight posts yet.</p>
            )}
          </div>
        </section>

        <div className="home-feed-head">
          <h2>Latest Posts</h2>
          <p>{safePosts.length} total</p>
        </div>

        {error && <p className="home-error">{typeof error === "string" ? error : "Unable to load posts."}</p>}

        <ul className="post-list">
          {safePosts.length > 0 ? (
            safePosts.map((post) => (
              <li key={post._id} className="post-item">
                <div className="post-author">
                  {post.author ? (
                    <>
                      <Link to={`/profile/${post.author._id}`}>
                        <img src={post.author.profilePicture} alt={post.author.name} className="author-img" />
                      </Link>
                      <div>
                        <h3>{post.author.name}</h3>
                        <p>@{post.author.userName}</p>
                      </div>
                      <div className="post-author-right">
                        <span className={`fact-chip ${post.newsOrNot ? "fact-chip--news" : "fact-chip--not-news"}`}>
                          {post.newsOrNot ? "Model: News" : "Model: Not News"}
                        </span>
                        {normalizeId(post.author._id) !== normalizeId(currentUserId) && (
                          <FollowBtn
                            userId={post.author._id}
                            currentUserId={currentUserId}
                            isFollowing={Boolean(followStatusByUser[post.author._id])}
                            onFollowChange={(status) => handleFeedFollowChange(post.author._id, status)}
                            className="home-follow-btn"
                          />
                        )}
                      </div>
                    </>
                  ) : (
                    <p>Unknown author</p>
                  )}
                </div>
                <h3 className="post-title">{post.title}</h3>
                <p className="description">{post.desc}</p>

                {post.media ? <img src={`${post.media}`} className="post-image" alt={post.title} /> : null}

                <p className="post-time">{formatDate(post.createdAt)}</p>

                <div className="post-actions-row">
                  <div className="reaction-bar">
                    <button
                      className={`reaction-like-trigger ${myReactions[post._id] ? "active" : ""}`}
                      onClick={() => handleReaction(post._id, "like")}
                      disabled={!authToken}
                      type="button"
                    >
                      <span className="reaction-emoji" aria-hidden="true">
                        {getReactionEmoji(myReactions[post._id] || "like")}
                      </span>
                      <span>{myReactions[post._id] || "Like"}</span>
                    </button>

                    <div className="reaction-popover">
                      {reactionOptions.map((reaction) => (
                        <button
                          key={`${post._id}-${reaction.key}`}
                          className={`reaction-popover-item ${myReactions[post._id] === reaction.key ? "active" : ""}`}
                          onClick={() => handleReaction(post._id, reaction.key)}
                          disabled={!authToken}
                          title={reaction.label}
                          type="button"
                        >
                          <span className="reaction-emoji" aria-hidden="true">
                            {getReactionEmoji(reaction.key)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="buttons-container">
                    <button
                      onClick={() => handleDownvote(post._id)}
                      className={`action-button unlike-button ${hasUserVote(post.downvotes) ? "active" : ""}`}
                      disabled={!authToken}
                    >
                      <span className="unlike-emoji" aria-hidden="true">
                        {"\u{1F44E}"}
                      </span>
                      <span className="vote-count">{getVoteCount(post.downvotes)}</span>
                    </button>

                    <button className="action-button" onClick={() => setActivePost(post)}>
                      <FontAwesomeIcon icon={faComment} />
                      <span className="vote-count">
                        {Array.isArray(post.comments) ? post.comments.length : 0}
                      </span>
                    </button>
                  </div>
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
            <button className="close-comments" onClick={() => setActivePost(null)}>
              X
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

export default Homepage;
