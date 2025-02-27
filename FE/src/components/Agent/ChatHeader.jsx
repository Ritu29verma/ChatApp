import React from 'react'
import { FiX, FiArrowLeft, FiLogOut } from "react-icons/fi";

function ChatHeader({selectedUser, setSelectedUser, onClose}) {
  return (
     <div className="flex justify-between items-center bg-[#560BAD] text-white p-3 rounded-tl-md rounded-tr-md">
               {/* <button onClick={() => setSelectedUser(null)} className="md:hidden">
                 <FiArrowLeft size={20} />
               </button> */}
               <span>Chat with {selectedUser.username}</span>
               {/* <button onClick={onClose} className="hover:text-gray-300">
                 <FiX size={20} />
               </button> */}
             </div>
  )
}

export default ChatHeader
