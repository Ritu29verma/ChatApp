import { useEffect, useState, useRef } from "react";

const MessageList = ({ messages }) => {
    const messagesEndRef = useRef(null);

      useEffect(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
      }, [messages]);

      return (
        <div className="flex justify-center items-center w-full bg-gray-200">
          {console.log("Messages Array: ", messages)}
          <div 
            className="w-10/12 flex-1 md:h-full min-h-[calc(100vh-260px)] overflow-y-auto p-4 relative bg-white bg-opacity-80" >
            {messages.length > 0 ? (
              messages.map((msg, index) => (
                <div key={index} className={`p-2 ${msg.role === "user" ? "text-right" : "text-left"}`}>
                  <span className="font-semibold">{msg.sender}:</span> {msg.text}
                  <div className="text-xs text-gray-500">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))
            ) 
            : (
              // No messages placeholder
              <div className="flex flex-grow justify-center items-center md:h-full min-h-[calc(100vh-320px)] p-4  rounded-lg text-center">
                <p className="text-gray-600 italic text-lg">Start a conversation!</p>
              </div>
            )
            }
      
            <div ref={messagesEndRef} />
          </div>
        </div>
      )};      
  
  export default MessageList;
  