import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import { useNavigate, useParams } from "react-router-dom";

const apiUrl = process.env.REACT_APP_API_URL;
const socket = io(apiUrl || "http://localhost:5001"); // Backend URL

const Convo = () => {
  const { user1, user2 } = useParams(); // Get user1 and user2 from URL
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const navigate = useNavigate()
  // Fetch existing conversation messages on component mount
  useEffect(() => {
    const fetchConversation = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }
      try {
        const response = await fetch(`${apiUrl}/message/${user1}/${user2}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const data = await response.json();

        if (data && Array.isArray(data.messages)) {
          setMessages(data.messages);
        } else {
          setMessages([]); // If no messages or incorrect format, set as empty array
        }

        setMessages(data.messages);
      } catch (error) {
        console.error("Error fetching conversation:", error);
        setMessages([]);
      }
    };

    fetchConversation();

    // Join the conversation when the component mounts
    socket.emit("join", user1);

    // Listen for new incoming messages
    socket.on("receiveMessage", (message) => {
      if (
        (message.sender === user2 && message.receiver === user1) ||
        (message.sender === user1 && message.receiver === user2)
      ) {
        setMessages((prevMessages) => [...prevMessages, message]);
      }
    });

    return () => {
      socket.off("receiveMessage"); // Clean up when component unmounts
    };
  }, [user1, user2]);

  // Send message to the server via Socket.IO
  const sendMessage = () => {
    if (text.trim() === "") return;

    // Send message through Socket.IO to the server
    socket.emit("sendMessage", {
      sender: user1,
      receiver: user2,
      text,
    });

    // Optimistic update: immediately add the message to UI
    setMessages((prevMessages) => {
      // Ensure that prevMessages is an array
      return Array.isArray(prevMessages)
        ? [
            ...prevMessages,
            { sender: user1, receiver: user2, text, isRead: false },
          ]
        : [{ sender: user1, receiver: user2, text, isRead: false }];
    });
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
