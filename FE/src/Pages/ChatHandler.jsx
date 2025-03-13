import { useState, useEffect } from "react";
import { checkOrRegisterUser } from "./chatService";
import socket from "../socket";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from 'react-hot-toast';

function ChatHandler({ onClose }) {
  
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(false);
  const [onlineAgents, setOnlineAgents] = useState([]);
  const [user, setUserData] = useState();
  const navigate = useNavigate();

  const handleLogin = async (isGuest) => {
    setLoading(true);
    try {
      const user = await checkOrRegisterUser(isGuest ? null : userName, isGuest);
      setLoading(false);
  
      console.log("User Data from API:", user); // Debugging
  
      if (user && user.username) {
        setUserData(user);
        sessionStorage.setItem("user", JSON.stringify(user)); 
        sessionStorage.setItem("username", user.username);
        sessionStorage.setItem("id", user.id);
  
        socket.emit("registerClient", { username: user.username, userId: user.id });
        socket.emit("newChatRequest", { username: user.username });
        
        toast.success("Login successful");
        onClose();
        navigate("/", { state: { user } });
      } else {
        throw new Error("Invalid username or user not found");
      }
    } catch (error) {
      setLoading(false);
      console.error("Login Error:", error);
      toast.error("Login failed. Invalid username or user not found.");
    }
  };  

  useEffect(() => {
    socket.on("onlineAgents", (agents) => {
      console.log("Online Agents received:", agents);
      setOnlineAgents(agents);
    });
  
    return () => {
      socket.off("onlineAgents");
    };
  }, []);

  return (
    <>
    {/* Show Modal only if user is not logged in */}
    {!user && (
      <div className="fixed inset-0  bg-opacity-50 flex justify-center items-center backdrop-blur-md">
        <div className="bg-white p-6 rounded-lg shadow-lg w-96">
          <h2 className="text-lg flex justify-center font-bold text-black mb-4">Start Chatting</h2>
          <input
            type="text"
            className="w-full p-2 mb-4 border border-gray-300 rounded"
            placeholder="Enter User name"
            value={userName}
            onChange={(e) => setUserName(e.target.value)} 
          />
          <button
            onClick={() => handleLogin(false)}
              className="w-full bg-[#560BAD] text-white py-2 rounded-lg font-semibold hover:bg-[#7209B7] transition duration-300"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          <div className="m-2 flex justify-center text-gray-600">Or</div>

          <button
            onClick={() => handleLogin(true)}
           className="w-full bg-black text-white py-2 rounded-lg font-semibold hover:bg-gray-800 transition duration-300"
          >
            Login as Guest
          </button>
        </div>
      </div>
    )}

 
  </>
);
}

export default ChatHandler;
