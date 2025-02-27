import { useState, useEffect } from "react";
import socket from "../../socket";

const MessageInput = ({ agent, selectedUser, setMessages }) => {
    const [typingUser, setTypingUser] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [newMessage, setNewMessage] = useState("");

  // Handle Input Change and Emit Typing Event
  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    socket.emit("typing", { user: agent });
  };

  // Debounce Typing Event
  useEffect(() => {
    let typingTimer;
    if (newMessage.trim() === "") {
      socket.emit("stopped-typing", { user: agent });
    } else {
      typingTimer = setTimeout(() => {
        socket.emit("stopped-typing", { user: agent });
      }, 600);
    }
    return () => clearTimeout(typingTimer);
  }, [newMessage, agent]);

  useEffect(() => {
    if (!socket) {
      console.log("Socket not available");
      return;
    }

    socket.on("typing", (data) => {
      console.log("Typing event from:", data.user.username);
      setTypingUser(data.user.username);
      setIsTyping(true);
    });

    socket.on("stopped-typing", () => {
      console.log("Stopped typing event");
      setTypingUser("");
      setIsTyping(false);
    });

    return () => {
      socket.off("typing");
      socket.off("stopped-typing");
    };
  }, [socket]);

  // Send a message to a selected user
  const sendMessage = () => {
    if (!agent || !agent.username) {
      console.error("Agent data is missing or undefined");
      return;
    }
    if (!newMessage.trim() || !selectedUser) return;
    const messageData = {
      sender: agent.username,
      role: "agent",
      receiver: selectedUser?.username || "unknown",
      text: newMessage,
      timestamp: new Date().toISOString(), // ✅ Ensure valid timestamp
    };

    if (!messageData.receiver) {
      console.error("Receiver is undefined, cannot send message.");
      return;
    }  

    console.log("Message data being sent:", messageData);
    socket.emit("sendMessage", messageData);
    setMessages((prev) => [...prev, messageData]); // ✅ Append to array
    setNewMessage("");
    socket.emit("stopped-typing", { user: selectedUser });
  };


return (
<>
  {/* Typing Indicator */}
  {isTyping && typingUser && (
            <div className="p-2 text-sm text-gray-600">{typingUser} is typing...</div>
          )}

          {/* Input Field */}
          <div className="flex border-t p-2">
            <input
              type="text"
              className="flex-1 border p-2 rounded-lg focus:outline-none"
              value={newMessage}
              onChange={handleInputChange}
              placeholder="Type a message..."
            />
            <button
              className="ml-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800"
              onClick={sendMessage}
            >
              Send
            </button>
          </div>
</>
    )};

  export default MessageInput;