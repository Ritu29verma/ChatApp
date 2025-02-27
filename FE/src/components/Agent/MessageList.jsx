import { useRef, useEffect } from "react";

const MessageList = ({ messages }) => {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);


  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <div className="flex flex-col md:h-full min-h-[calc(100vh-260px)]  flex-grow overflow-y-auto h-full p-2">
    {messages.length > 0 ? (
      messages.map((msg, index) => (
        <div key={index} className={`p-2 ${msg.role === "user" ? "text-right" : "text-left"}`}>
          <span className="font-semibold">{msg.sender}:</span> {msg.text}
          <div className="text-xs text-gray-500">
            {new Date(msg.timestamp).toLocaleTimeString()}
          </div>
        </div>
      ))
      ) : (
        <div className="flex justify-center items-center md:h-full min-h-[calc(100vh-300px)] p-4 bg-gray-100 rounded-lg text-center">
        <p className="text-gray-600 italic text-lg">Start a conversation!</p>
        </div>
      )  }
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;