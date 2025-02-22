import React, { useState, useEffect } from "react";
import { checkOrRegisterAgent } from "./chatServiceAgent";
import AgentChatWindow from "./ChatWindowAgent";

const GuestChatWindow = () => {
  const [username, setUsername] = useState("");
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    const registerGuest = async () => {
      const guest = await checkOrRegisterAgent(null, true);
      if (guest) {
        setUsername(guest.username);
      }
    };
    registerGuest();
  }, []);

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="bg-white p-6 rounded shadow-lg text-center">
        <h2 className="text-xl font-bold mb-4">Welcome, {username || "Guest"}!</h2>
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded"
          onClick={() => setShowChat(true)}
        >
          Start Chat
        </button>
      </div>

      {showChat && <AgentChatWindow onClose={() => setShowChat(false)} />}
    </div>
  );
};

export default GuestChatWindow;
