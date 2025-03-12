import { useRef, useEffect } from "react";

const MessageList = ({ messages }) => {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <div className="flex flex-col flex-grow overflow-y-auto h-full p-2 bg-white">
      {/* Debugging: Check if messages exist */}
      {console.log("Messages Array: ", messages)}

      {messages && messages.length > 0 ? (
        messages.map((msg, index) => (
          <div
            key={index}
            className={`p-2 ${msg.role === "user" ? "text-right" : "text-left"}`}
          >
            <span className="font-semibold">{msg.sender}:</span> {msg.text}
            <div className="text-xs text-gray-500">
              {new Date(msg.timestamp).toLocaleTimeString()}
            </div>
          </div>
        ))
      ) : (
        <div className="flex justify-center items-center min-h-[calc(100vh-300px)] p-4 rounded-lg text-center">
          <p className="text-gray-600 italic text-lg">Start a conversation!</p>
        </div>
      )}
      {/* Scroll reference */}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
