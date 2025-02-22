import { useState, useEffect, useRef } from "react";
import socket from "../socket";
import { FiX, FiArrowLeft, FiLogOut } from "react-icons/fi";
import { fetchUsers, fetchChatHistory } from "./chatService";
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import AdminNavbar from "../components/AdminNavbar";

function AdminChatWindow({ onClose, userRole}) {
  const [messages, setMessages] = useState([]); // ✅ Change to an array
  const [users, setUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [typingUser, setTypingUser] = useState("");
  const messagesEndRef = useRef(null);
  const [isTyping, setIsTyping] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const agent = location.state?.agent || null;
  console.log("Received Agent Data in ChatWindowAgent:", agent);

  if (!agent || !agent.username) {
    console.error("⚠️ Agent data is missing or undefined");
    return <div>Error: Agent data is missing</div>;
  }

  useEffect(() => {
    const handleOnlineUsers = (users) => {
      console.log("Online users received:", users);
      setOnlineUsers([...users]); 
    };

    socket.on("onlineUsers", handleOnlineUsers);

    return () => {
      socket.off("onlineUsers", handleOnlineUsers);
    };
  }, []);

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
    const fetchData = async () => {
      const allUsers = await fetchUsers();
      setUsers(allUsers);
      setLoading(false);
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const isUserOnline = (username) => {
    return Array.isArray(onlineUsers) && onlineUsers.some((user) => user.username === username);
  };  

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

  const handleLogout = () => {
    if (agent.username) {
      socket.emit("agentOffline", { username : agent.username });
    }
    sessionStorage.removeItem("phoneNumber");
    sessionStorage.removeItem("username");
    sessionStorage.removeItem("agent");
    navigate("/login");
  };
  
  

  // Handle Input Change and Emit Typing Event
  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    socket.emit("typing", { user: selectedUser });
  };

  // Debounce Typing Event
  useEffect(() => {
    let typingTimer;
    if (newMessage.trim() === "") {
      socket.emit("stopped-typing", { user: selectedUser });
    } else {
      typingTimer = setTimeout(() => {
        socket.emit("stopped-typing", { user: selectedUser });
      }, 600);
    }
    return () => clearTimeout(typingTimer);
  }, [newMessage, selectedUser]);

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

  // Send a message to a selected user
  const sendMessage = () => {
    if (!agent || !agent.username) {
      console.error("Agent data is missing or undefined");
      return;
    }
    if (!newMessage.trim() || !selectedUser) return;
    const messageData = {
      sender: agent.username,
      role: "agent",
      receiver: selectedUser?.username || "unknown",
      text: newMessage,
      timestamp: new Date().toISOString(), // ✅ Ensure valid timestamp
    };

    if (!messageData.receiver) {
      console.error("Receiver is undefined, cannot send message.");
      return;
    }  

    console.log("Message data being sent:", messageData);
    socket.emit("sendMessage", messageData);
    setMessages((prev) => [...prev, messageData]); // ✅ Append to array
    setNewMessage("");
    socket.emit("stopped-typing", { user: selectedUser });
  };


  return (
    <div className="h-screen bg-[#E7DBEF] md:flex-row">
         <AdminNavbar agent={agent} onLogout={handleLogout} />
         <div className=" flex flex-1 overflow-hidden md:flex-row md:space-x-4 mt-1 p-4 ">
      {/* Left Section: Online Users (1/3 on md screens) */}
      <div
        className={`bg-white shadow-lg rounded-lg p-4 transition-all md:w-1/3 h-full md:block overflow-y-auto ${
          selectedUser ? "hidden md:block" : "block w-full"
        }`}
      >
        <div className="flex justify-between items-center bg-[#7209B7] text-white p-3 rounded-lg">
          <span>Online Users</span>
          <button onClick={onClose} className="hover:text-gray-300">
            <FiX size={20} />
          </button>
        </div>

        <ul className="max-h-[calc(100vh-200px)] overflow-y-auto mt-2">
          {users.length === 0 ? (
            <li className="text-gray-500 text-center p-2">No users online</li>
          ) : (
            users.map((user, index) => (
              <li
                key={index}
                className="cursor-pointer flex items-center p-2 bg-[#E7DBEF] shadow-sm hover:bg-[#7209B7] hover:text-white rounded mb-1 transition"
                onClick={() => setSelectedUser(user)}
              >
                <span
               className={`h-2 w-2 rounded-full mr-2 ${isUserOnline(user?.username) ? "bg-green-500" : "bg-gray-400"}`}
               ></span>
                {user.username} 
                {/* ({user.phoneNumber}) */}
              </li>
            ))
          )}
        </ul>
      </div>

      {/* Right Section: Chat Window (Takes Full Screen on Mobile) */}
      {selectedUser ? (
        <div className="bg-white max-h-[calc(100vh-100px)] flex-grow shadow-lg rounded-lg flex flex-col flex-1 w-full md:w-2/3">
          
          {/* Chat Header */}
          <div className="flex justify-between items-center bg-[#560BAD] text-white p-3 rounded-tl-md rounded-tr-md">
            <button onClick={() => setSelectedUser(null)} className="md:hidden">
              <FiArrowLeft size={20} />
            </button>
            <span>Chat with {selectedUser.username}</span>
            <button onClick={onClose} className="hover:text-gray-300">
              <FiX size={20} />
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex flex-col md:h-full min-h-[calc(100vh-238px)]  flex-grow overflow-y-auto h-full p-2">
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
              <div className="flex justify-center items-center p-4 bg-gray-100 h-full rounded-lg text-center">
              <p className="text-gray-600 italic text-lg">Start a conversation!</p>
              </div>
            )  }
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
              value={newMessage}
              onChange={handleInputChange}
              placeholder="Type a message..."
            />
            <button
              className="ml-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800"
              onClick={sendMessage}
            >
              Send
            </button>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex bg-white shadow-lg rounded-lg flex-col flex-1 p-4 md:w-2/3 justify-center items-center text-center">
        <p className="text-gray-500 italic text-lg">"Select an agent to chat."</p>
      </div>
      )}
    </div>
    </div>
  );
}

export default AdminChatWindow;