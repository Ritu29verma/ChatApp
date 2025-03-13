import { useState, useEffect } from 'react';
import AgentChatWindow from './ChatWindowAgent';
import { checkOrRegisterAgent } from './chatServiceAgent';
import socket from '../socket';
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from 'react-toastify';

function ChatHandlerAgent() {
  const [showChat, setShowChat] = useState(false);
  const [agentData, setAgentData] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (isGuest) => {
    if (!isGuest && (!phoneNumber || phoneNumber.length !== 10 || !/^\d{10}$/.test(phoneNumber))) {
      toast.error("Please enter a valid 10-digit phone number.");
      return;
    }
  
    setLoading(true);
    const agent = await checkOrRegisterAgent(isGuest ? null : phoneNumber, isGuest);
    setLoading(false);
  
    console.log("Agent Data from API:", agent); // Debugging
  
    if (agent && agent.username) {
      setAgentData(agent);
      
      sessionStorage.setItem("agent",JSON.stringify(agent));
      sessionStorage.setItem("phoneNumber", agent.phoneNumber);
      sessionStorage.setItem("username", agent.username);
      sessionStorage.setItem("id", agent.id);
      console.log(agent.username , agent.id);
      socket.emit("registerAgent", { username: agent.username , agentId: agent.id});
      toast.success("Login successful");
      navigate("/agent-chat", { state: { agent } });
  
      setShowChat(true);
    } else {
      toast.error("Login failed. Please try again.");
    }
  };

  useEffect(() => {
    const storedPhoneNumber = sessionStorage.getItem("phoneNumber");
    const storedUsername = sessionStorage.getItem("username");
  
    if (storedPhoneNumber && storedUsername) {
      setAgentData({ phoneNumber: storedPhoneNumber, username: storedUsername });
    }
  }, []);

  const handleCloseChat = () => {
    const username = sessionStorage.getItem("username");
    if (phoneNumber) {
      socket.emit("AgentOffline", { username });
    }
    setShowChat(false);
  };

  return (
    <>
      <div className="flex h-screen items-center justify-center bg-[#E7DBEF] px-4">
        <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-md text-center">
          <h2 className="text-2xl font-bold text-[#560BAD] mb-6">Agent Login</h2>

        <input
       type="text"
       placeholder="Enter Phone Number"
       value={phoneNumber}
       onChange={(e) => {
       const input = e.target.value;
        if (/^\d{0,10}$/.test(input)) {
      setPhoneNumber(input); // Allow only up to 10 digits
       } }}
       className="w-full p-3 border border-[#7209B7] rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-[#7209B7]"
       />


          {/* ✅ Fix: Pass `false` explicitly for phone number login */}
          <button
            onClick={() => handleLogin(false)}
            className="w-full bg-[#560BAD] text-white py-2 rounded-lg font-semibold hover:bg-[#7209B7] transition duration-300"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          {/* <div className="mt-4 text-gray-600">Or</div>

          <button
            onClick={() => handleLogin(true)}
            className="w-full bg-black text-white py-2 rounded-lg font-semibold hover:bg-gray-800 transition duration-300 mt-4"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login as Guest"}
          </button> */}
        </div>
      </div>

      {showChat && (
        <AgentChatWindow
          onClose={handleCloseChat}
          agent={agentData}
          userRole="agent"
        />
      )}
      
      <ToastContainer />
    </>
  );
}

export default ChatHandlerAgent;
