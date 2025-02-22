import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { checkOrRegisterAgent } from "./chatServiceAgent";

const LoginPage = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
   
  
  const handleLogin = async (isGuest) => {
    setLoading(true);
    const agent = await checkOrRegisterAgent(isGuest ? null : phoneNumber, isGuest, navigate);
    setLoading(false);
    
    if (agent) {
      setAgentData(agent);
      socket.emit("registerAgent", {
        phoneNumber: agent.phoneNumber,
        username: agent.username,
      });
  
      toast.success("Login successful");
      setShowChat(true);
    } else {
      toast.error("Login failed. Please try again.");
    }
  };
  
  return (
    <div className="flex h-screen items-center justify-center bg-[#E7DBEF] px-4">
      <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-md text-center">
        <h2 className="text-2xl font-bold text-[#560BAD] mb-6">Agent Login</h2>

        <input
          type="text"
          placeholder="Enter Phone Number"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          className="w-full p-3 border border-[#7209B7] rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-[#7209B7]"
        />

        <button
          onClick={() => handleLogin(false)}
          className="w-full bg-[#560BAD] text-white py-2 rounded-lg font-semibold hover:bg-[#7209B7] transition duration-300"
        >
          Login
        </button>

        <div className="mt-4 text-gray-600">Or</div>

        <button
          onClick={() => handleLogin(true)}
          className="w-full bg-black text-white py-2 rounded-lg font-semibold hover:bg-gray-800 transition duration-300 mt-4"
        >
          Login as Guest
        </button>
      </div>
    </div>
  );
};

export default LoginPage;