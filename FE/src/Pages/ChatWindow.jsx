import { useEffect, useState, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import toast, { Toaster } from 'react-hot-toast';
import ChatHandler from "./ChatHandler";
import socket from "../socket";
import { fetchChatHistory } from './chatServiceAgent';
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import Navbar from "../components/Client/Navbar";
import MessageList from "../components/Client/MessageList";
import MessageInput from "../components/Client/MessageInput";
import AgentList from "../components/Client/AgentList";
import ChatHeader from "../components/Client/ChatHeader";
import ConversationButton from "../components/Client/ConversationButton";
import SearchingForAgent from "../components/Client/SearchingForAgent";
import image from "../assets/bgchat2.jpg"

const ChatWindow = ({ onClose }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [username, setUsername] = useState(sessionStorage.getItem("username"));
  const [typingUser, setTypingUser] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [input, setInput] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState(() => {
    const storedUser = sessionStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null; 
  });
  const hasRequestedChat = useRef(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false); 
  const [searchingForAgent, setSearchingForAgent] = useState(false);
  const [isChatActive, setIsChatActive] = useState(false);
  const [showStartConversation, setShowStartConversation] = useState(false);

  const handleLogout = () => {
    if (!currentUser) {
      console.log("Username not yet available, delaying logout.");
      return;
    }
    console.log("Logging out:", { currentUser });
  
    socket.emit("clientOffline", { currentUser });
    sessionStorage.removeItem("username");
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("id");
  
    setUsername(null);
    setCurrentUser(null);
    setIsLoggedIn(false);
    setShowLoginModal(true); 
  
    navigate("/", { state: { user: null } });
  };
  
  useEffect(() => {
    if (!username) {
      console.log("No user data found in sessionStorage, updating state.");
      setShowLoginModal(true);
      setIsLoggedIn(false);
    }
  }, [username]);

  useEffect(() => {
    if (location.state?.user) {
      const userFromLocation = location.state.user;
      setCurrentUser(userFromLocation);
      setUsername(userFromLocation.username);
      setIsLoggedIn(true); // set isLoggedIn to true after login
      setSearchingForAgent(true);
      console.log("User received in ChatWindow:", userFromLocation, userFromLocation.username);
    }
  }, [location.state?.user]);

  useEffect(() => {
    console.log("CurrentUser received in ChatWindow:", currentUser);
  }, [currentUser]);

    useEffect(() => {
    if (!currentUser) {
      const storedUser = sessionStorage.getItem("user");
      if (storedUser) {
        setCurrentUser(JSON.parse(storedUser));
        setUsername(JSON.parse(storedUser).username);
        setIsLoggedIn(true);
      } else {
        navigate("/");
      }
    }
  }, [currentUser, navigate]); 

  useEffect(() => {
    socket.on("receiveMessage", (message) => {
      console.log("Received message:", message);
      setMessages((prev) => [...prev, message]); // Store as an array
    });

    return () => {
      socket.off("receiveMessage");
    };
  }, []);

  useEffect(() => {
    console.log("Selected User Updated:", selectedAgent);
  }, [selectedAgent]);

  useEffect(() => {
    const storedUserId = sessionStorage.getItem("id");
    if (username && storedUserId) {
      socket.emit("registerClient", { username, userId:storedUserId });

      // Prevent duplicate chat requests
      if (!hasRequestedChat.current) {
        socket.emit("newChatRequest", { clientUsername: username });
        hasRequestedChat.current = true;
      }
    }
  }, [username]);

  useEffect(() => {
    console.log("✅ Selected Agent useEffect Triggered:", selectedAgent);
    
    if (!selectedAgent || !selectedAgent.agentId || !currentUser || !currentUser.id) {
      console.warn("🚨 Missing required data: ", { selectedAgent, currentUser });
      return; // Exit early if any required value is missing
    }
    console.log("📥 Fetching chat history for:", { userId: currentUser.id, agentId: selectedAgent.agentId });
    const loadChatHistory = async () => { 
      setLoading(true);
      try {
        let history = await fetchChatHistory(currentUser.id, selectedAgent.agentId);
        console.log("✅ Fetched history:", history);
  
        if (!Array.isArray(history)) history = []; // Ensure history is an array
  
        const formattedMessages = history.map((msg) => ({
          sender: msg.senderType === "user" ? currentUser.username : selectedAgent.username,
          role: msg.senderType,
          text: msg.message,
          timestamp: msg.createdAt,
        }));
  
        setMessages(formattedMessages);
      } catch (error) {
        console.error("❌ Error fetching chat history:", error);
      }
      setLoading(false);
    };
  
    loadChatHistory();
  }, [selectedAgent, currentUser]);


  useEffect(() => {
    socket.on("newChatRequest", () => {
      setSearchingForAgent(true);
    });

    socket.on("chatAccepted", ({ agent }) => {
      console.log("✅ Chat Accepted on Client Side, Received Agent Object:", agent);
      setSearchingForAgent(false);
      setIsChatActive(true);
      setShowStartConversation(false);
      setSelectedAgent(agent);
      toast.success(`Connected with Agent ${agent.username}`);
    });

    socket.on("chatEnded", ({ session }) => {
      console.log("📩 chatEnded Event Received:", session);
      toast.success(`Chat with ${session.agent.username} ended`);
      setSelectedAgent(null);
      setIsChatActive(false);
      setSearchingForAgent(false);
      setShowStartConversation(true);
    });

    return () => {
      socket.off("newChatRequest");
      socket.off("chatAccepted");
      socket.off("chatEnded");
    };
  }, []);
  
  const handleEndChat = () => {
    if (selectedAgent) {
      socket.emit("endChat", { agentUsername: selectedAgent.username, clientUsername: username });
    } else {
      console.error("⚠️ No agent selected to end chat.");
    }
  };
  
  useEffect(() => {
    let typingTimer;
    if (input.trim() === "") {
      socket.emit('stopped-typing',  { user: currentUser });
    } else {
      typingTimer = setTimeout(() => {
        socket.emit('stopped-typing',{ user: currentUser });
      }, 600);
    }
    return () => clearTimeout(typingTimer);
  }, [input]);
  
  useEffect(() => {
    if (!socket) {
      console.log("Socket not available");
      return;
    }
  
    socket.on('typing', (data) => {
      console.log("Typing event from:", data.user.username);
      setTypingUser(data.user.username);
      setIsTyping(true);
    });
  
    socket.on('stopped-typing', () => {
      console.log("Stopped typing event");
      setTypingUser('');
      setIsTyping(false);
    });
  
    return () => {
      socket.off('typing');
      socket.off('stopped-typing');
    };
  }, [socket]);


  return (
    <div
      className="min-h-screen bg-[#E7DBEF] flex flex-col items-center relative"
      style={{
        backgroundImage: `url(${image})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Navbar should be above everything */}
      <div className="mb-2 w-full z-40">
        <Navbar
          currentUser={username}
          showStartConversation={showStartConversation}
          setShowStartConversation={setShowStartConversation}
          setSearchingForAgent={setSearchingForAgent}
          handleLogout={handleLogout}
        />
      </div>
  
      {/* Chat Login Modal */}
      {showLoginModal && (
        <div className="absolute z-50 inset-0 bg-opacity-50 flex justify-center items-center transition-opacity duration-500">
          <ChatHandler onClose={() => setShowLoginModal(false)} />
        </div>
      )}
  
      {/* Searching for Agent - should be above everything except Navbar */}
      {searchingForAgent && (
        <div className="absolute inset-0 flex items-center justify-center bg-opacity-50 z-30">
          <AnimatePresence>
            <SearchingForAgent />
          </AnimatePresence>
        </div>
      )}
  
      {/* Main Chat Window */}
      <div className="max-h-[calc(100vh-100px)] w-full md:w-10/12 flex flex-col items-center justify-center">
        {selectedAgent ? (
          <div className="bg-white max-h-[calc(100vh-100px)] shadow-lg rounded-lg flex flex-col w-full md:w-2/3 z-10">
            <ChatHeader
              selectedAgent={selectedAgent}
              setSelectedAgent={setSelectedAgent}
              onClose={onClose}
            />
             <div className="flex-1 overflow-y-auto pb-5">
        <MessageList messages={messages} />
      </div>
            {isTyping && typingUser && typingUser !== username && (
        <div className="absolute bottom-40 left-4 text-gray-500 text-sm italic">
          {typingUser} is typing...
        </div>)}
            <div className=" bg-white sticky bottom-0">
        <MessageInput
          currentUser={currentUser}
          selectedAgent={selectedAgent}
          setMessages={setMessages}
          input={input}
          setInput={setInput}
          setTypingUser={setTypingUser}
          setIsTyping={setIsTyping}
        />
      </div>

            <button className="bg-red-500 text-white p-2 m-2 rounded" onClick={handleEndChat}>
              End Chat
            </button>
          </div>
        ) : (
          <div
            className="bg-white h-screen shadow-lg rounded-lg flex flex-col items-center justify-center p-6 w-full relative"
            style={{
              backgroundImage: `url(${image})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          >
            <div className="relative z-10">
              <ConversationButton
                currentUser={currentUser}
                setShowStartConversation={setShowStartConversation}
                showStartConversation={showStartConversation}
                setSearchingForAgent={setSearchingForAgent}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 

export default ChatWindow;