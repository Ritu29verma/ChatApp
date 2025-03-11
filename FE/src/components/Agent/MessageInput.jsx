import { useState, useEffect } from "react";
import socket from "../../socket";

const MessageInput = ({ agent, selectedUser, setMessages, newMessage, setNewMessage,setTypingUser, setIsTyping }) => {
  let typingTimer = null;
  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
  
    // Emit typing event
    socket.emit("typing", { user: agent });
  
    // ✅ Only update typing status if the sender is NOT the agent
    if (selectedUser?.username !== agent.username) {
      setTypingUser(agent.username);
      setIsTyping(true);
    }
  
    // Clear any existing timeout
    if (typingTimer) clearTimeout(typingTimer);
  
    // Set a timeout to stop typing after 1.5s
    typingTimer = setTimeout(() => {
      socket.emit("stopped-typing", { user: agent });
  
      // ✅ Ensure only client's typing status is displayed
      if (selectedUser?.username !== agent.username) {
        setTypingUser("");
        setIsTyping(false);
      }
    }, 1500);
  };
  
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
      onClick={() => {
        if (newMessage.trim()) {
          sendMessage(newMessage);
          setNewMessage("");
        }
      }}
      disabled={!newMessage.trim()}
    >
      Send
    </button>
          </div>
</>
    )};

  export default MessageInput;