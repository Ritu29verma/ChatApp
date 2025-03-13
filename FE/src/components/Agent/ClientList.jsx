import { useState, useEffect } from "react";
import socket from "../../socket";
import { fetchUsers, fetchChatHistory } from "../../Pages/chatService";
import { FiX } from "react-icons/fi";

function ClientList({ selectedUser, setSelectedUser , onClose, agent}) {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [lastMessages, setLastMessages] = useState({});

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
    const fetchData = async () => {
      try {
        const allUsers = await fetchUsers();
        console.log("🟢 Users fetched:", allUsers);
        setUsers(allUsers);
  
        if (!agent || !agent.id) {
          console.warn("🚨 Missing agent data! Cannot fetch chat history.");
          return;
        }
  
        console.log("✅ Agent ID:", agent.id);
  
        // Fetch last messages from chat history
        const lastMessagesMap = {};
        for (let user of allUsers) {
          console.log(`🔹 Checking user: ${user.username} (ID: ${user.id})`);
  
          if (!user.id) {
            console.warn(`⚠️ Skipping user ${user.username}: userId is missing.`);
            continue;
          }
  
          try {
            console.log(`📨 Fetching chat history for UserID: ${user.id}, AgentID: ${agent.id}`);
            const chatHistory = await fetchChatHistory(user.id, agent.id);
  
            if (!Array.isArray(chatHistory)) {
              console.error(`❌ Invalid chat history format for UserID: ${user.id}`, chatHistory);
              continue;
            }
  
            if (chatHistory.length > 0) {
              lastMessagesMap[user.id] = chatHistory[chatHistory.length - 1].message;
              console.log(`📩 Last message for ${user.username}:`, chatHistory[chatHistory.length - 1].message);
            } else {
              console.log(`🚫 No chat history for ${user.username}`);
            }
          } catch (error) {
            console.error(`❌ Error fetching chat history for UserID: ${user.id}:`, error);
          }
        }
  
        setLastMessages((prev) => ({ ...prev, ...lastMessagesMap }));
        console.log("🟢 Final last messages map:", lastMessagesMap);
      } catch (error) {
        console.error("🚨 Error fetching users or chat history:", error);
      }
      setLoading(false);
    };
  
    fetchData();
  }, [agent]);

  const isUserOnline = (username) => {
    return Array.isArray(onlineUsers) && onlineUsers.some((user) => user.username === username);
  }; 

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        for (let user of users) {
          if (!user.id) continue;

          const chatHistory = await fetchChatHistory(user.id, agent.id);
          if (Array.isArray(chatHistory) && chatHistory.length > 0) {
            const lastMsg = chatHistory[chatHistory.length - 1].message;

            setLastMessages((prev) => {
              if (prev[user.id] !== lastMsg) {
                console.log(`🔄 Updating last message for ${user.username}: ${lastMsg}`);
                return { ...prev, [user.id]: lastMsg };
              }
              return prev; // No change if message is the same
            });
          }
        }
      } catch (error) {
        console.error("🚨 Error polling chat history:", error);
      }
    }, 1000);
    return () => clearInterval(interval); 
  }, [users, agent]);

  useEffect(() => {
    const handleNewMessage = ({ senderId, message }) => {
      console.log("📩 New message received:", { senderId, message });

      setLastMessages((prev) => ({
        ...prev,
        [senderId]: message,
      }));
    };

    socket.on("newMessage", handleNewMessage);
    return () => socket.off("newMessage", handleNewMessage);
  }, []);

  const sortedUsers = [...users].sort((a, b) => {
    const aOnline = isUserOnline(a.username);
    const bOnline = isUserOnline(b.username);
    return bOnline - aOnline; // Online users first
  });

  return (
    <div
      className={`bg-white min-h-[calc(100vh-100px)] shadow-lg rounded-lg p-4 transition-all md:w-1/3 h-full md:block overflow-y-auto ${
        selectedUser ? "hidden md:block" : "block w-full"
      }`}
    >
      <div className="flex justify-between items-center bg-[#7209B7] text-white p-3 rounded-lg">
        <span>Available Users</span>
        <button onClick={onClose} className="hover:text-gray-300">
          <FiX size={20} />
        </button>
      </div>

      <ul className="max-h-[calc(100vh-200px)] overflow-y-auto mt-2">
        {loading ? (
          <li className="text-gray-500 text-center p-2">Loading users...</li>
        ) : sortedUsers.length === 0 ? (
          <li className="text-gray-500 text-center p-2">No users available</li>
        ) : (
          sortedUsers.map((user, index) => (
            <li
            key={index}
            className="cursor-pointer flex flex-col p-2 bg-[#E7DBEF] shadow-sm hover:bg-[#7209B7] hover:text-white rounded mb-1 transition"
            onClick={() => setSelectedUser({ ...user, userId: user.id })}
          >
            {/* Username & Online Status */}
            <div className="flex items-center">
              <span
                className={`h-3 w-3 rounded-full mr-2 ${
                  isUserOnline(user?.username) ? "bg-green-500" : "bg-gray-400"
                }`}
              ></span>
              <span className="font-medium">{user.username}</span>
            </div>

            {/* Last Message */}
            <p className="text-sm text-gray-700 mt-1 ml-4 truncate">
              {lastMessages[user.id] || (
                <span className="text-gray-400">No messages yet</span>
              )}
            </p>
          </li>
          ))
        )}
      </ul>
    </div>
  );
}

export default ClientList;