import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Logout from "./Logout";
import "../styles/MessagesPage.css";

const MessagesPage = () => {
  const navigate = useNavigate();
  const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5001";
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const token = localStorage.getItem("token");

  const decodeUserIdFromToken = (rawToken) => {
    try {
      if (!rawToken) return null;
      const payloadPart = rawToken.split(".")[1];
      if (!payloadPart) return null;
      const base64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
      const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
      const payload = JSON.parse(atob(padded));
      return payload?.user?.id || null;
    } catch {
      return null;
    }
  };

  const currentUserId = useMemo(
    () => localStorage.getItem("userId") || decodeUserIdFromToken(token),
    [token]
  );

  const buildFallbackConversationsFromPosts = useCallback((posts) => {
    const seen = new Map();
    (Array.isArray(posts) ? posts : []).forEach((post) => {
      const author = post?.author;
      if (!author?._id) return;
      if (String(author._id) === String(currentUserId)) return;
      if (seen.has(author._id)) return;
      seen.set(author._id, {
        convoId: `fallback-${author._id}`,
        user: {
          _id: author._id,
          name: author.name || "Unknown user",
          userName: author.userName || "user",
          profilePicture: author.profilePicture || "",
        },
        latestMessage: {
          text: "Start a new conversation.",
          sender: null,
          createdAt: null,
        },
      });
    });
    return Array.from(seen.values()).slice(0, 20);
  }, [currentUserId]);

  const loadConversations = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError("");
      const endpointCandidates = [
        `${apiUrl}/message/conversations/list`,
        `${apiUrl}/message/conversations`,
        `${apiUrl}/message/list`,
      ];

      let conversations = null;
      let lastStatus = null;

      for (const endpoint of endpointCandidates) {
        const response = await fetch(endpoint, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 401) {
          navigate("/login");
          return;
        }

        if (!response.ok) {
          lastStatus = response.status;
          continue;
        }

        const data = await response.json();
        const maybeConversations = Array.isArray(data.conversations) ? data.conversations : null;
        if (maybeConversations) {
          conversations = maybeConversations;
          break;
        }
      }

      if (!conversations) {
        throw new Error(`Unable to fetch conversations (${lastStatus || "unknown"})`);
      }

      setItems(conversations);
      if (conversations.length > 0) {
        localStorage.setItem("messages_conversations_cache", JSON.stringify(conversations));
      }
    } catch (listError) {
      console.error("Conversations error:", listError);
      try {
        const fallbackPostsResponse = await fetch(`${apiUrl}/`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!fallbackPostsResponse.ok) {
          throw new Error("Fallback feed search failed");
        }

        const fallbackPosts = await fallbackPostsResponse.json();
        const fallbackItems = buildFallbackConversationsFromPosts(fallbackPosts);
        setItems(fallbackItems);
        setError(fallbackItems.length > 0 ? "" : "Unable to load conversations right now.");
      } catch (fallbackError) {
        const cached = localStorage.getItem("messages_conversations_cache");
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            setItems(Array.isArray(parsed) ? parsed : []);
            setError("");
            return;
          } catch {
            // Ignore cache parse failures
          }
        }
        console.error("Fallback conversations error:", fallbackError);
        setError("Unable to load conversations right now.");
      }
    } finally {
      setLoading(false);
    }
  }, [apiUrl, token, navigate, buildFallbackConversationsFromPosts]);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    loadConversations();
  }, [navigate, token, loadConversations]);

  return (
    <>
      <nav className="messages-navbar">
        <div className="messages-logo" />
        <div className="messages-actions">
          <span className="messages-pill">Messages</span>
          <Logout />
        </div>
      </nav>

      <Sidebar />

      <main className="messages-page">
        <section className="messages-card">
          <div className="messages-head">
            <div>
              <h1>Messages</h1>
              <p>Open direct conversations with community members.</p>
            </div>
            <button type="button" onClick={loadConversations}>
              Refresh
            </button>
          </div>

          {loading && <p className="messages-state">Loading conversations...</p>}
          {!loading && error && <p className="messages-error">{error}</p>}
          {!loading && items.length === 0 && (
            <p className="messages-state">
              No conversations yet. Visit a user profile and click Message to start one.
            </p>
          )}

          {!loading && items.length > 0 && (
            <div className="conversation-list">
              {items.map((item) => (
                <article key={item.convoId} className="conversation-item">
                  <img
                    src={item.user?.profilePicture || "https://via.placeholder.com/64?text=User"}
                    alt={item.user?.name || "User"}
                  />
                  <div className="conversation-meta">
                    <h3>{item.user?.name || "Unknown user"}</h3>
                    <p>@{item.user?.userName || "user"}</p>
                    <span>
                      {item.latestMessage?.text
                        ? item.latestMessage.text
                        : "No messages yet. Start the conversation."}
                    </span>
                  </div>
                  {currentUserId && item.user?._id ? (
                    <Link to={`/${currentUserId}/${item.user._id}`}>Open Chat</Link>
                  ) : (
                    <button type="button" disabled>
                      Open Chat
                    </button>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
};

export default MessagesPage;
