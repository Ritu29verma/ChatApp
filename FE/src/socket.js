import { io } from 'socket.io-client';

const socket = io(import.meta.env.VITE_SOCKET_URL, {
  transports: ["websocket", "polling"]
});

socket.on("disconnect", () => {
  console.log("Client disconnected, removing from active sessions...");
  socket.emit("removeUserOnDisconnect");
});

export default socket;
