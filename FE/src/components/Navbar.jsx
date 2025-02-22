import { useState } from "react";
import { FiMenu, FiX, FiLogOut } from "react-icons/fi";

const Navbar = ({ currentUser, onLogout, isLoggedIn }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="bg-[#7209B7] text-white p-4 flex justify-between items-center shadow-md">
      {/* Left Side: Logo */}
      <h1 className="text-xl font-bold">CHATIFY</h1>

      {/* Right Side (Desktop) */}
      <div className="hidden sm:flex items-center space-x-4">
        {currentUser && <span className="font-semibold">{currentUser}</span>}
        {currentUser && (
          <button
            className="bg-red-600 px-3 py-1 rounded-lg hover:bg-red-700 flex items-center"
            onClick={onLogout}
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
          {currentUser && <span className="font-semibold">{currentUser}</span>}
          {currentUser && (
            <button
              className="bg-red-600 px-3 py-1 rounded-lg hover:bg-red-700 flex items-center text-white"
              onClick={onLogout}
            >
              <FiLogOut className="mr-1" /> Logout
            </button>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
