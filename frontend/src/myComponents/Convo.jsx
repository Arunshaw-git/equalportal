import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import { useNavigate, useParams } from "react-router-dom";

const Convo = () => {
  const { user1, user2 } = useParams(); // Get user1 and user2 from URL
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const navigate = useNavigate();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    // Fetch old messages
    const fetchConversation = async () => {
      try {
        const res = await fetch(
          `${
            process.env.REACT_APP_API_URL || "http://localhost:5001"
          }/message/${user1}/${user2}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        const data = await res.json();
        if (data && Array.isArray(data.messages)) {
          setMessages(data.messages);
        } else if (data.messages === undefined && Array.isArray(data.message)) {
          // fallback if backend returns differently
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

    // Initialize socket
    const newSocket = io(
      process.env.REACT_APP_API_URL || "http://localhost:5001",
      {
        auth: { token },
        transports: ["websocket"], // force websocket
      }
    );

    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Socket connected:", newSocket.id);
      newSocket.emit("join", user1);
    });

    newSocket.on("connect_error", (err) => {
      console.error("Socket connection error:", err.message);
    });

    newSocket.on("receiveMessage", (message) => {
      // Only add messages relevant to this conversation
      if (
        (message.sender === user2 && message.receiver === user1) ||
        (message.sender === user1 && message.receiver === user2)
      ) {
        setMessages((prev) => [...prev, message]);
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, [user1, user2, navigate]);

  const sendMessage = () => {
    if (!text.trim() || !socket) return;

    const msgObj = { receiver: user2, text };

    // Send message via socket
    socket.emit("sendMessage", msgObj);

    // Optimistic update
    setMessages((prev) => [
      ...prev,
      { sender: user1, receiver: user2, text, isRead: false },
    ]);

    setText("");
  };

  return (
    <div style={{ width: "400px", border: "1px solid #ccc", padding: "10px" }}>
      <div style={{ maxHeight: "400px", overflowY: "auto" }}>
        {Array.isArray(messages) && messages.length > 0 ? (
          messages.map((msg, index) => (
            <div
              key={index}
              style={{
                textAlign: msg.sender === user1 ? "right" : "left",
                margin: "5px 0",
              }}
            >
              <span
                style={{
                  background: msg.sender === user1 ? "#daf8cb" : "#f1f1f1",
                  padding: "5px 10px",
                  borderRadius: "10px",
                  display: "inline-block",
                }}
              >
                {msg.text}
              </span>
            </div>
          ))
        ) : (
          <div> No messages</div>
        )}
      </div>

      <div>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          style={{ width: "70%" }}
        />
        <button
          onClick={sendMessage}
          style={{ width: "25%", marginLeft: "5%" }}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Convo;
