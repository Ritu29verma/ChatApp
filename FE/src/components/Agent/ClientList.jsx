import { useState, useEffect } from "react";
import socket from "../../socket";
import { fetchUsers } from "../../Pages/chatService";
import { FiX } from "react-icons/fi";

function ClientList({ selectedUser, setSelectedUser , onClose}) {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);

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
    const handleOnlineUsers = (users) => {
      setOnlineUsers([...users]);
    };

    socket.on("onlineUsers", handleOnlineUsers);

    return () => {
      socket.off("onlineUsers", handleOnlineUsers);
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      const allUsers = await fetchUsers();
      setUsers(allUsers);
      setLoading(false);
    };
    fetchData();
  }, []);

  const isUserOnline = (username) => {
    return Array.isArray(onlineUsers) && onlineUsers.some((user) => user.username === username);
  }; 

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
  );
}

export default ClientList;