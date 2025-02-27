import { useState, useEffect } from "react";
import socket from "../../socket";

const MessageInput = ({ currentUser , selectedAgent, setMessages, input, setInput ,setTypingUser, setIsTyping }) => {
  let typingTimer = null;
  const sendMessage = () => {
    if (input.trim() === "") return;

    if (!currentUser || !selectedAgent) {
      console.error("User or selectedAgent is missing", { currentUser, selectedAgent });
      return;
    }

    const messageData = {
      sender: currentUser.username,  // ✅ FIX: Using `currentUser.username`
      role: "user",
      receiver: selectedAgent.username,
      text: input,
      timestamp: new Date(),
    };

    console.log("Sending message:", messageData);
    socket.emit("sendMessage", messageData);
    setMessages((prev) => [...prev, messageData]);
    setInput("");
    socket.emit("stopped-typing", { user: selectedAgent }); // FIX: Stop typing on send
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);

    // Emit typing event
    socket.emit("typing", { user: currentUser });
    setTypingUser(currentUser.username);
    setIsTyping(true);

    // Clear any existing timeout
    if (typingTimer) clearTimeout(typingTimer);

    // Set a timeout to stop typing after 1.5s
    typingTimer = setTimeout(() => {
      socket.emit("stopped-typing", { user: currentUser });
      setTypingUser("");
      setIsTyping(false);
    }, 1500);
  };

  return (
 <>
    <div className="flex border-t p-2">
    <input
      type="text"
      className="flex-1 border p-2 rounded-lg focus:outline-none"
      value={input}
      onChange={handleInputChange}
      placeholder="Type a message..."
    />
    <button
      className="ml-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800"
      onClick={() => {
        if (input.trim()) {
          sendMessage(input);
          setInput("");
        }
      }}
      disabled={!input.trim()}
    >
      Send
    </button>
  </div>
 </>
  );
};

export default MessageInput;
