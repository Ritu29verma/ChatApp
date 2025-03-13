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
  const storedagentId = sessionStorage.getItem("id");
  const registerAgent = () => {
    if (storedagentId && storedUsername) {
      console.log("Re-registering agent after refresh:",storedUsername, storedagentId);
      socket.emit("registerAgent", { username: storedUsername , agentId : storedagentId });
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
    console.log("Selected User Updated:", selectedUser);
  }, [selectedUser]);

  useEffect(() => {
    console.log("✅ Selected User useEffect Triggered:", selectedUser);
    
    if (!selectedUser || !selectedUser.userId || !agent || !agent.id) {
      console.warn("🚨 Missing required data: ", { selectedUser, agent });
      return; 
    }
      console.log("Fetching chat history for:", { userId: selectedUser.userId,  agentId: agent.id  });
      const loadChatHistory = async () => {
        setLoading(true);
        try {
          let history = await fetchChatHistory(selectedUser.userId, agent.id); 
  
          console.log("Fetched history:", history);
  
          if (!Array.isArray(history))  history = []; 
  
          const formattedMessages = history.map((msg) => ({
            sender:
            msg.senderType === "user" ? selectedUser.username : agent.username,
            role: msg.senderType,
            text: msg.message,
            timestamp: msg.createdAt, 
          }));
  
          setMessages(formattedMessages);
        } catch (error) {
          console.error("Error fetching chat history:", error);
        }
        setLoading(false);
      };
  
      loadChatHistory();
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

    socket.on("chatAccepted", ({ client }) => {
      console.log("✅ Chat Accepted, Received Client Object:", client);
      setSelectedUser(client);
      setIsChatActive(true);
      setAcceptedRequests((prev) => [...prev, client.username]); 
      toast.success(`Connected with Client ${client.username}`);
    });

    socket.on("chatEnded", ({ session }) => {
      if (!session || !session.client) {
        console.error("⚠️ chatEnded event received, but session or client is missing:", session);
        return;
      }
      toast.success(`Chat with ${session.client.username} ended`); 
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


  const handleAcceptChat = (client) => {
    console.log("📢 handleAcceptChat called with client:", client);
    if (!client) {
        console.warn("⚠️ Client object is missing or invalid:", client);
        return;
    }

    socket.emit("acceptChat", { agentUsername: agent.username, clientUsername: client});

    setChatRequests((prev) => prev.filter((user) => user !== client));
    setAcceptedRequests((prev) => [...prev, client]);
    setSelectedUser(client); 
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
}, [isChatActive, selectedUser]); 


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
      <ClientList selectedUser={selectedUser} setSelectedUser={setSelectedUser} onClose={onClose} agent={agent} />

      {/* Right Section: Chat Window (Takes Full Screen on Mobile) */}
      {selectedUser ? (
        <div className="bg-white max-h-[calc(100vh-100px)] flex-grow shadow-lg rounded-lg flex flex-col flex-1 w-full md:w-2/3">
         <ChatHeader selectedUser={selectedUser} onClose={onClose} setSelectedUser={setSelectedUser}/>
         <div className="flex-1 overflow-y-auto pb-5">
              <MessageList messages={messages} />
            </div>
          {isTyping && typingUser && typingUser !== agent.username && (
  <div className="absolute bottom-40 left-4 text-gray-500 text-sm italic">
    {typingUser} is typing...
  </div>
    )}

<div className=" bg-white sticky bottom-0">
              <MessageInput
                agent={agent}
                selectedUser={selectedUser}
                setMessages={setMessages}
                newMessage={newMessage}
                setNewMessage={setNewMessage}
                setTypingUser={setTypingUser}
                setIsTyping={setIsTyping}
              />
            </div>
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