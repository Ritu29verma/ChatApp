import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./Pages/LoginPage";
import ChatHandlerAgent from "./Pages/ChatHandlerAgent";
import { ToastContainer } from 'react-toastify';
import AdminChatWindow from "./Pages/ChatWindowAgent";
import ChatWindow from "./Pages/ChatWindow";

function App() {
  return (
    <Router>
      <ToastContainer  autoClose={600} />
      <Routes>
        <Route path="/" element={<h1 className="text-center text-3xl font-bold mt-10">Welcome to Chat Application</h1>} />
        <Route path="/login" element={<ChatHandlerAgent/>} />
        <Route path="/agent-chat" element={<AdminChatWindow/>} />
        <Route path="/user-chat" element={<ChatWindow/>} />
      </Routes>
    </Router>
  );
}

export default App;
