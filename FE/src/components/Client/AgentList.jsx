import { useEffect, useState, useRef } from "react";
import socket from "../../socket";
import { FiX } from "react-icons/fi";
import { fetchAgents} from "../../Pages/chatServiceAgent"

const AgentList = ({ selectedAgent, setSelectedAgent, onClose }) => {
     const [onlineAgents, setOnlineAgents] = useState([]);
     const [agents, setAgents] = useState([]);
     const [loading, setLoading] = useState(true);

     useEffect(() => {
      const fetchData = async () => {
       const allAgents = await fetchAgents();
              setAgents(allAgents);
        setLoading(false);
      };
      fetchData();
    }, []);

      const isAgentOnline = (username) => {
        return Array.isArray(onlineAgents) && onlineAgents.some((agent) => agent.username === username);
      };

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

    return (
      <div
          className={`bg-white shadow-lg rounded-lg p-4 m-2 transition-all md:w-1/3 w-full md:block ${selectedAgent ? "hidden md:block" : "block"}`}
        >
          <div className="flex justify-between items-center bg-[#7209B7] text-white p-3 rounded-lg">
            <span>Available Agents</span>
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
                  onClick={() => {setSelectedAgent(user) }}
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
    );
  };
  
  export default AgentList;
  