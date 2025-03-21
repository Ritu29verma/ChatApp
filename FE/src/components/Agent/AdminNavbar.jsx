import { useState } from "react";
import { FiMenu, FiX, FiLogOut } from "react-icons/fi";
import socket from "../../socket";
import { useNavigate } from "react-router-dom";

const AdminNavbar = ({ agent }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    if (agent.username) {
      socket.emit("agentOffline", { username : agent.username });
    }
    sessionStorage.removeItem("phoneNumber");
    sessionStorage.removeItem("username");
    sessionStorage.removeItem("agent");
    sessionStorage.removeItem("id");
    navigate("/login");
  };

  return (
    <nav className="bg-[#7209B7] text-white p-4 flex justify-between items-center shadow-md relative">
      {/* Left Side: Admin Logo */}
      <h1 className="text-xl font-bold">CHATIFY ADMIN</h1>

      {/* Right Side (Desktop) */}
      <div className="hidden sm:flex items-center space-x-4">
        {agent?.username && <span className="font-semibold">{agent.username}</span>}
        {agent?.username && (
          <button
            className="bg-red-600 px-3 py-1 rounded-lg hover:bg-red-700 flex items-center"
            onClick={handleLogout}
          >
            <FiLogOut className="mr-1" /> Logout
          </button>
        )}
      </div>

      {/* Hamburger Menu (Mobile) */}
      <div className="sm:hidden">
        <button onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      {menuOpen && (
        <div className="absolute top-14 right-4 bg-white text-black shadow-lg rounded-lg p-3 flex flex-col space-y-2 sm:hidden">
          {agent?.username && <span className="font-semibold">{agent.username}</span>}
          {agent?.username && (
            <button
              className="bg-red-600 px-3 py-1 rounded-lg hover:bg-red-700 flex items-center text-white"
              onClick={handleLogout}
            >
              <FiLogOut className="mr-1" /> Logout
            </button>
          )}
        </div>
      )}
    </nav>
  );
};

export default AdminNavbar;
