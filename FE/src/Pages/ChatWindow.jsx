import { useEffect, useState, useRef } from "react";
import ChatHandler from "./ChatHandler";
import socket from "../socket";
import { fetchAgents,fetchChatHistory } from './chatServiceAgent';
import { FiX, FiArrowLeft, FiLogOut } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";

const ChatWindow = ({ onClose, userRole,  user }) => {
  const [messages, setMessages] = useState([]);
  const [agents, setAgents] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [typingUser, setTypingUser] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [username, setUsername] = useState(sessionStorage.getItem("username"));
  const messagesEndRef = useRef(null);
  const [onlineAgents, setOnlineAgents] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState(() => {
    const storedUser = sessionStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null; 
  });
  const [isLoggedIn, setIsLoggedIn] = useState(false); 

  useEffect(() => {
    const storedUsername = sessionStorage.getItem("username");
  
    const registerClient = () => {
      if (storedUsername) {
        console.log("Re-registering client after refresh:", storedUsername);
        socket.emit("registerClient", { username: storedUsername });
      }
    };
    registerClient();
    
  }, []);

  useEffect(() => {
    if (location.state?.user) {
      const userFromLocation = location.state.user;
      setCurrentUser(userFromLocation);
      setUsername(userFromLocation.username);
      setIsLoggedIn(true); // set isLoggedIn to true after login
      console.log("User received in ChatWindow:", userFromLocation, userFromLocation.username);
    }
  }, [location.state?.user]);

  useEffect(() => {
    console.log("CurrentUser received in ChatWindow:", currentUser);
  }, [currentUser]);

   useEffect(() => {
    if (!currentUser || !currentUser.id) {
      navigate("/user-chat");
    }
  }, [currentUser, navigate]);


  useEffect(() => {
    const handleOnlineAgents = (agents) => {
      console.log("Online Agents received:", agents);
      setOnlineAgents([...agents]);
    };

    socket.on("onlineAgents", handleOnlineAgents);

    return () => {
      socket.off("onlineAgents", handleOnlineAgents);
    };
  }, []);

  useEffect(() => {
    if (!currentUser) {
    const storedUser = sessionStorage.getItem("user");
    const storedUsername =sessionStorage.getItem("username")
    if (storedUser) {
      setCurrentUser(storedUser);
      setUsername(storedUsername);
      setIsLoggedIn(true); // set isLoggedIn to true if user is in session storage
    } else {
      setTimeout(() => setShowLoginModal(true), 1000); // Show modal after 1 second
    }}
  }, [currentUser]);

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

  const handleLogout = () => {
    if (!username || !currentUser) {
      console.log("Username or currentUser not yet available, delaying logout.");
      return;
    }

    console.log("Logging out:", { username });

    socket.emit("clientOffline", { username });

    sessionStorage.removeItem("username");
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("id");

    setUsername(null);
    setCurrentUser(null);
    setIsLoggedIn(false); // set isLoggedIn to false after logout

    navigate("/user-chat", { state: { user: null } });
  };

  useEffect(() => {
    const fetchData = async () => {
     const allAgents = await fetchAgents();
            setAgents(allAgents);
      setLoading(false);
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const isAgentOnline = (username) => {
    return Array.isArray(onlineAgents) && onlineAgents.some((agent) => agent.username === username);
  };

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
    console.log("✅ Selected Agent useEffect Triggered:", selectedAgent);
    
    if (!selectedAgent || !selectedAgent.id || !currentUser || !currentUser.id) {
      console.warn("🚨 Missing required data: ", { selectedAgent, currentUser });
      return; // Exit early if any required value is missing
    }
  
    console.log("📥 Fetching chat history for:", { userId: currentUser.id, agentId: selectedAgent.id });
  
    const loadChatHistory = async () => { 
      setLoading(true);
      try {
        let history = await fetchChatHistory(currentUser.id, selectedAgent.id);
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
  

  const handleAgentClick = (user) => {
    console.log("Selected Agent:", user);
    setSelectedAgent(user);
  };

  // Handle Input Change and Emit Typing Event
  const handleInputChange = (e) => {
    setInput(e.target.value);
    socket.emit('typing',{ user: selectedAgent });
  };

// Debounce Typing Event
useEffect(() => {
  let typingTimer;
  if (input.trim() === "") {
    socket.emit('stopped-typing',  { user: selectedAgent });
  } else {
    typingTimer = setTimeout(() => {
      socket.emit('stopped-typing',{ user:selectedAgent });
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
    <div className="h-screen bg-[#E7DBEF] md:flex-row relative">
    <div  className="mb-2 ">
    <Navbar currentUser={username} onLogout={handleLogout} isLoggedIn={isLoggedIn} />
    </div>
      {showLoginModal && (
        <div className="absolute inset-0 bg-opacity-50 flex justify-center items-center transition-opacity duration-500">
          <ChatHandler onClose={() => setShowLoginModal(false)} />
        </div>
      )}
    <div className={`max-h-[calc(100vh-100px)] w-full flex transition-all ${showLoginModal ? ' ' : ''}`}>

  {/* Left Section: Online Agents List */}
  <div
    className={`bg-white shadow-lg rounded-lg p-4 m-2 transition-all md:w-1/3 w-full md:block ${selectedAgent ? "hidden md:block" : "block"}`}
  >
    <div className="flex justify-between items-center bg-[#7209B7] text-white p-3 rounded-lg">
      <span>Online Agents</span>
      <button onClick={onClose} className="hover:text-gray-300">
        <FiX size={20} />
      </button>
    </div>
    <ul className="max-h-[calc(100vh-200px)] overflow-y-auto mt-2">
      {agents.length === 0 ? (
        <li className="text-gray-500 text-center p-2">No agents available</li>
      ) : (
        agents.map((user, index) => (
          <li
            key={index}
            className="cursor-pointer flex items-center p-2 bg-[#E7DBEF] shadow-sm hover:bg-[#7209B7] hover:text-white rounded mb-1 transition"
            onClick={() => {setSelectedAgent(user);
             handleAgentClick(user);
            }}
          >
            <span
              className={`h-2 w-2 rounded-full mr-2 ${isAgentOnline(user?.username) ? "bg-green-500" : "bg-gray-400"}`}
            ></span>
            {user.username}
          </li>
        ))
      )}
    </ul>
  </div>

  {/* Right Section: Chat Window */}
  {selectedAgent ? (
    <div className="bg-white m-2 max-h-[calc(100vh-100px)] flex-grow shadow-lg rounded-lg flex flex-col flex-1 w-full md:w-2/3">
      {/* Chat Header */}
      <div className="flex justify-between items-center bg-[#560BAD] text-white p-3 rounded-tl-md rounded-tr-md">
        <button onClick={() => setSelectedAgent(null)} className="md:hidden">
          <FiArrowLeft size={20} />
        </button>
        <span>Chat with {selectedAgent.username}</span>
        <button onClick={onClose} className="hover:text-gray-300">
          <FiX size={20} />
        </button>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 md:h-full min-h-[calc(100vh-238px)] overflow-y-auto p-2">
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
          <div className="flex justify-center items-center md:h-full min-h-[calc(100vh-238px)] p-4 bg-gray-100 rounded-lg text-center">
          <p className="text-gray-600 italic text-lg">Start a conversation!</p>
          </div>
        ) }
        
        <div ref={messagesEndRef} />
        
      </div>
  {/* Typing Indicator */}
  {isTyping && typingUser && (
        <div className="p-2 text-sm text-gray-600">{typingUser} is typing...</div>
      )}

      {/* Input Field */}
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
    </div>
  ) : (
    <div className="hidden m-2 md:flex bg-white shadow-lg rounded-lg flex-col flex-1 p-4 md:w-2/3 justify-center items-center text-center">
    <p className="text-gray-500 italic text-lg">"Select an agent to chat."</p>
  </div>
  )}
</div>
     </div>
  );
};

export default ChatWindow;
