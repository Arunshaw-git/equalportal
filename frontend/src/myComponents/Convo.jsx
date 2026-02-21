import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import { useNavigate, useParams } from "react-router-dom";
import { useProfileUser } from "../contexts/ProfileUser";
import Sidebar from "./Sidebar";
import Logout from "./Logout";
import "../styles/Convo.css";

const Convo = () => {
  const { user1, user2 } = useParams();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const navigate = useNavigate();
  const [socket, setSocket] = useState(null);
  const { profileUser, setProfileUser } = useProfileUser();
  const messagesEndRef = useRef(null);

  const normalizeId = (value) => {
    if (!value) return "";
    if (typeof value === "object") {
      if (value._id) return String(value._id);
      if (value.$oid) return String(value.$oid);
    }
    return String(value);
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    const currentUserId = localStorage.getItem("userId") || user1;
    if (!token) {
      navigate("/login");
      return;
    }

    if (!profileUser || Object.keys(profileUser).length === 0) {
      const fetchProfile = async () => {
        try {
          const response = await fetch(`${process.env.REACT_APP_API_URL}/profile/${user2}`, {
            method: "GET",
            headers: {
              "content-type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });

          if (!response.ok) throw new Error("Failed to fetch user's profile");
          const data = await response.json();
          setProfileUser(data);
        } catch (error) {
          console.error("Error fetching user's profile:", error);
        }
      };

      fetchProfile();
    }

    const fetchConversation = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/message/${user1}/${user2}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const data = await res.json();
        if (data && Array.isArray(data.messages)) {
          setMessages(data.messages);
        } else if (data.messages === undefined && Array.isArray(data.message)) {
          setMessages(data.message);
        } else {
          setMessages([]);
        }
      } catch (err) {
        console.error("Error fetching messages:", err);
        setMessages([]);
      }
    };

    fetchConversation();

    const newSocket = io(process.env.REACT_APP_API_URL || "http://localhost:5001", {
      auth: { token },
      transports: ["websocket"],
    });

    setSocket(newSocket);

    newSocket.on("connect", () => {
      newSocket.emit("join", currentUserId);
    });

    newSocket.on("connect_error", (err) => {
      console.error("Socket connection error:", err.message);
    });

    newSocket.on("receiveMessage", (message) => {
      const senderId = normalizeId(message?.sender);
      const receiverId = normalizeId(message?.receiver);
      const meId = normalizeId(currentUserId);
      const otherId = normalizeId(user2);

      if (
        (senderId === otherId && receiverId === meId) ||
        (senderId === meId && receiverId === otherId)
      ) {
        setMessages((prev) => [...prev, message]);
      }
    });

    newSocket.on("messageSent", (message) => {
      const senderId = normalizeId(message?.sender);
      const receiverId = normalizeId(message?.receiver);
      const meId = normalizeId(currentUserId);
      const otherId = normalizeId(user2);

      if (senderId === meId && receiverId === otherId) {
        setMessages((prev) => {
          const realId = normalizeId(message?._id);
          if (realId && prev.some((m) => normalizeId(m?._id) === realId)) {
            return prev;
          }

          const tempIndex = [...prev]
            .reverse()
            .findIndex(
              (m) =>
                String(m?._id || "").startsWith("temp-") &&
                normalizeId(m?.sender) === meId &&
                normalizeId(m?.receiver) === otherId &&
                m?.text === message?.text
            );

          if (tempIndex !== -1) {
            const actualIndex = prev.length - 1 - tempIndex;
            const next = [...prev];
            next[actualIndex] = message;
            return next;
          }

          return [...prev, message];
        });
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, [user1, user2, navigate, profileUser, setProfileUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!text.trim() || !socket) return;

    const msgObj = { receiver: user2, text };
    socket.emit("sendMessage", msgObj);

    setMessages((prev) => [
      ...prev,
      {
        _id: `temp-${Date.now()}`,
        sender: user1,
        receiver: user2,
        text,
        isRead: false,
        createdAt: new Date().toISOString(),
      },
    ]);

    setText("");
  };

  const formatMessageTime = (createdAt) => {
    if (!createdAt) return "";
    return new Date(createdAt).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      <nav className="convo-navbar">
        <div className="convo-logo" />
        <div className="convo-nav-actions">
          <span className="convo-pill">Messages</span>
          <Logout />
        </div>
      </nav>

      <Sidebar />

      <main className="convo-page">
        <section className="convo-card">
          <header className="convo-head">
            <img
              src={profileUser?.profilePicture || "https://via.placeholder.com/60?text=User"}
              alt={profileUser?.name || "User"}
            />
            <div>
              <h1>{profileUser?.name || "Conversation"}</h1>
              <p>@{profileUser?.userName || "user"}</p>
            </div>
          </header>

          <div className="convo-messages">
            {Array.isArray(messages) && messages.length > 0 ? (
              messages.map((msg, index) => {
                const isMe = normalizeId(msg.sender) === normalizeId(user1);
                return (
                  <div key={index} className={`convo-message-row ${isMe ? "convo-message-row--me" : ""}`}>
                    <div className={`convo-message ${isMe ? "convo-message--me" : ""}`}>
                      <p>{msg.text}</p>
                      <span>{formatMessageTime(msg.createdAt)}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="convo-empty">No messages yet. Say hello and start the conversation.</p>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="convo-compose">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") sendMessage();
              }}
              placeholder="Type your message..."
            />
            <button onClick={sendMessage} disabled={!text.trim()}>
              Send
            </button>
          </div>
        </section>
      </main>
    </>
  );
};

export default Convo;
