import React, { useState } from "react";
import socket from "../../socket";

function ConversationButton({ currentUser, setShowStartConversation, showStartConversation, setSearchingForAgent }) {
  const [isClicked, setIsClicked] = useState(false);

  const handleStartNewChat = () => {
    setIsClicked(true); // Start animation
    socket.emit("newChatRequest", { clientUsername: currentUser });

    setTimeout(() => {
      setShowStartConversation(false);
      setSearchingForAgent(true);
      setIsClicked(false); // Reset animation after effect
    }, 600);
  };

  return (
    <div>
      {showStartConversation && (
        <div className="text-center mt-4">
          {/* Black Box with Centered Button */}
          <div className="w-[300px] md:w-[400px] h-[150px] bg-black flex items-center justify-center rounded-lg shadow-lg">
            <button
              className={`relative px-8 py-4 text-white text-lg font-semibold 
                        transition-all duration-500 ease-in-out transform
                        bg-[#560BAD] border-2 border-[#7209B7] rounded-lg
                        shadow-lg hover:bg-[#7209B7] hover:border-blue-500
                        active:scale-95 active:shadow-md 
                        ${isClicked ? "animate-pulse" : ""}`}
              onClick={handleStartNewChat}
            >
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-[#7209B7] to-[#560BAD] rounded-lg opacity-30"></span>
              Start Conversation
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ConversationButton;
