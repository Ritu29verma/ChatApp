import React from 'react'
import { FiX, FiArrowLeft, FiLogOut } from "react-icons/fi";

function ChatHeader({selectedAgent, setSelectedAgent, onClose}) {
  return (
     <div className="flex justify-between items-center bg-[#560BAD] text-white p-3 rounded-tl-md rounded-tr-md z-10">
           {/* <button onClick={() => setSelectedAgent(null)} className="md:hidden">
             <FiArrowLeft size={20} />
           </button> */}
           <span>Chat with {selectedAgent.username}</span>
           {/* <button onClick={onClose} className="hover:text-gray-300">
             <FiX size={20} />
           </button> */}
         </div>
  )
}

export default ChatHeader
