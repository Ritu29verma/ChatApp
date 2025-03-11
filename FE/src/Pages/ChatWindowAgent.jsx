import { useState, useEffect, useRef } from "react";
import socket from "../socket";
import { fetchChatHistory } from "./chatService";
import { useLocation } from "react-router-dom";
import AdminNavbar from "../components/Agent/AdminNavbar";
import MessageList from "../components/Agent/MessageList";
import MessageInput from "../components/Agent/MessageInput";
import ClientList from "../components/Agent/ClientList";
import ChatHeader from "../components/Agent/ChatHeader";
import ChatRequestModal from "../components/Agent/ChatRequestModal";
import toast, { Toaster } from 'react-hot-toast';

function AdminChatWindow({ onClose }) {
  const [messages, setMessages] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [chatRequests, setChatRequests] = useState([]);
  const [isChatActive, setIsChatActive] = useState(false); 
  const [acceptedRequests, setAcceptedRequests] = useState([]);
  const [typingUser, setTypingUser] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const location = useLocation();
  const agent = location.state?.agent || null;
  console.log("Received Agent Data in ChatWindowAgent:", agent);

  if (!agent || !agent.username) {
    console.error("⚠️ Agent data is missing or undefined");
    return <div>Error: Agent data is missing</div>;
  }

  useEffect(() => {
  const storedUsername = sessionStorage.getItem("username");

  const registerAgent = () => {
    if (storedUsername) {
      console.log("Re-registering agent after refresh:", storedUsername);
      socket.emit("registerAgent", { username: storedUsername });
    }
  };
  registerAgent();
  }, []);

  useEffect(() => {
    socket.on("receiveMessage", (message) => {
      console.log("Received message:", message);
      setMessages((prev) => [...prev, message]); // ✅ Store as an array
    });

    return () => {
      socket.off("receiveMessage");
    };
  }, []);

  useEffect(() => {
    if (selectedUser && agent) {
      console.log("Fetching chat history for:", {
        userId: selectedUser.id, // ✅ User first
        agentId: agent.id, // ✅ Agent second
      });
  
      const loadChatHistory = async () => {
        setLoading(true);
        try {
          let history = await fetchChatHistory(selectedUser.id, agent.id); // ✅ Fix order
  
          console.log("Fetched history:", history);
  
          if (!Array.isArray(history)) {
            history = []; // ✅ Ensure history is an array
          }
  
          // ✅ Correct sender names & timestamps
          const formattedMessages = history.map((msg) => ({
            sender:
              msg.senderType === "user" ? selectedUser.username : agent.username,
            role: msg.senderType,
            text: msg.message,
            timestamp: msg.createdAt, // ✅ Use correct timestamp
          }));
  
          setMessages(formattedMessages);
        } catch (error) {
          console.error("Error fetching chat history:", error);
        }
        setLoading(false);
      };
  
      loadChatHistory();
    }
  }, [selectedUser, agent]);

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

  useEffect(() => {
    socket.on("newChatRequest", ({ clientUsername }) => {
      setChatRequests((prevRequests) => {
        // Avoid adding duplicate requests
        if (!prevRequests.includes(clientUsername)) {
          return [...prevRequests, clientUsername];
        }
        return prevRequests;
      });
    });

    socket.on("chatRequestHandled", ({ clientUsername, agentUsername }) => {
      console.log(`🔔 Event received: chatRequestHandled for ${clientUsername}`);
      setChatRequests((prev) => prev.filter((user) => user !== clientUsername));
      setTimeout(() => {
        toast(`Client ${clientUsername} is now connected with Agent ${agentUsername}`);
      }, 500);
    });  

    socket.on("chatAccepted", ({ clientUsername }) => {
      setSelectedUser({ username: clientUsername });
      setIsChatActive(true); // Mark the agent as busy
      setAcceptedRequests((prev) => [...prev, clientUsername]); // Mark request as accepted
      toast.success(`Connected with Client ${clientUsername}`);
    });

    socket.on("chatEnded", ({ session }) => {
      toast.success(`Chat with ${session.client} ended`);
      setSelectedUser(null);
      setIsChatActive(false);
    });

    return () => {
      socket.off("newChatRequest");
      socket.off("chatAccepted");
      socket.off("chatEnded");
      socket.off("chatRequestHandled");
    };
  }, []);

  const handleAcceptChat = (clientUsername) => {
    socket.emit("acceptChat", { agentUsername : agent.username, clientUsername });
    setChatRequests((prev) => prev.filter((user) => user !== clientUsername));
    setAcceptedRequests((prev) => [...prev, clientUsername]);
    setSelectedUser({ username: clientUsername }); 
    setIsChatActive(true);
  };

  const handleDenyChat = (clientUsername) => {
    socket.emit("denyChat", { clientUsername });
    setChatRequests((prev) => prev.filter((user) => user !== clientUsername));
  };

  const handleEndChat = () => {
    if (selectedUser) {
      socket.emit("endChat", { agentUsername: agent.username, clientUsername: selectedUser.username });
      setIsChatActive(false);
    } else {
      console.error("⚠️ No user selected to end chat.");
    }
  };
  
  useEffect(() => {
    socket.on("chatDeniedByAgent", ({ clientUsername }) => {
      toast(`You denied the chat request from ${clientUsername}`);
    });
  
    return () => {
      socket.off("chatDeniedByAgent");
    };
  }, []);  

  useEffect(() => {
    console.log("🔔 isChatActive changed:", isChatActive);
    if (isChatActive && selectedUser) {
        console.log("🎉 Opening Chat Window for:", selectedUser);
    }
}, [isChatActive, selectedUser]); // ✅ Watch both `isChatActive` and `selectedUser`


  return (
    <div className="h-screen bg-[#E7DBEF] md:flex-row">
         <AdminNavbar agent={agent} />
         <div className=" flex flex-1 overflow-hidden md:flex-row md:space-x-4 mt-1 p-4 ">
         {!isChatActive && chatRequests.length > 0 && (
          <ChatRequestModal 
            // requests={chatRequests.filter(client => !acceptedRequests.includes(client))} 
            requests = {chatRequests}
            onAccept={handleAcceptChat} 
            onDeny={handleDenyChat} 
          />
        )}
      <ClientList selectedUser={selectedUser} setSelectedUser={setSelectedUser} onClose={onClose} />

      {/* Right Section: Chat Window (Takes Full Screen on Mobile) */}
      {selectedUser ? (
        <div className="bg-white max-h-[calc(100vh-100px)] flex-grow shadow-lg rounded-lg flex flex-col flex-1 w-full md:w-2/3">
         <ChatHeader selectedUser={selectedUser} onClose={onClose} setSelectedUser={setSelectedUser}/>
          <MessageList messages={messages} />
          {/* {isTyping && typingUser && typingUser !== agent.username && (
  <div className="absolute bottom-40 left-4 text-gray-500 text-sm italic">
    {typingUser} is typing...
  </div>
    )} */}

          <MessageInput agent={agent} selectedUser={selectedUser} setMessages={setMessages} newMessage={newMessage} setNewMessage={setNewMessage} setTypingUser={setTypingUser} setIsTyping={setIsTyping}/>
          {selectedUser && (
         <button className="bg-red-500 text-white p-2 m-2 rounded" onClick={handleEndChat}>
         End Chat
       </button>
      )}
        </div>
      ) : (
        <div className="hidden md:flex bg-white shadow-lg rounded-lg flex-col flex-1 p-4 md:w-2/3 justify-center items-center text-center">
        <p className="text-gray-500 italic text-lg">"Select an user to see chat history."</p>
      </div>
      )}
    </div>
    </div>
  );
}

export default AdminChatWindow;