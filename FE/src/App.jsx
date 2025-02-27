import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ChatHandlerAgent from "./Pages/ChatHandlerAgent";
import { Toaster } from "react-hot-toast";
import AdminChatWindow from "./Pages/ChatWindowAgent";
import ChatWindow from "./Pages/ChatWindow";

function App() {
  return (
    <Router>
       <Toaster position="top-center" reverseOrder={false} />
      <Routes>
        {/* <Route path="/" element={<h1 className="text-center text-3xl font-bold mt-10">Welcome to Chat Application</h1>} /> */}
        <Route path="/login" element={<ChatHandlerAgent/>} />
        <Route path="/agent-chat" element={<AdminChatWindow/>} />
        <Route path="/" element={<ChatWindow/>} />
      </Routes>
    </Router>
  );
}

export default App;
