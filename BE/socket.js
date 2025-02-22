import { io } from "./index.js";
import Chat from "./models/Chats.js";
import User from './models/User.js';
import Agent from './models/Agent.js';

const onlineUsers = new Map();
const onlineAgents = new Map();

export const chatSocket = () => {
  io.on("connection", (socket) => {
    console.log("🟢 A user connected:", socket.id);

    // Register clients
    socket.on("registerClient", ({ username }) => {
      console.log(`🔹 Registering Client: ${username}, Socket ID: ${socket.id}`);
      onlineUsers.set(socket.id, { username, role: "user" });
      console.log("📌 Current Online Users:", Array.from(onlineUsers.entries()));
      console.log("Current Online Agents:",Array.from(onlineAgents.entries()))
      io.emit("onlineUsers", Array.from(onlineUsers.values())); // Update agents
      io.emit("onlineAgents", Array.from(onlineAgents.values())); // Update users
    });

    // Register agents
    socket.on("registerAgent", ({ username }) => {
      console.log(`🔸 Registering Agent: ${username}, Socket ID: ${socket.id}`);
      onlineAgents.set(socket.id, { username, role: "agent" });
      console.log("📌 Current Online Users:", Array.from(onlineUsers.entries()));
      console.log("📌 Current Online Agents:", Array.from(onlineAgents.entries()));
      io.emit("onlineAgents", Array.from(onlineAgents.values())); // Update users
      io.emit("onlineUsers", Array.from(onlineUsers.values())); // Update agents
    });

    // Handle client disconnecting
    socket.on("clientOffline", ({ username }) => {
      for (const [socketId, user] of onlineUsers.entries()) {
        if (user.username === username) {
          onlineUsers.delete(socketId);
          break;
        }
      }
      console.log("🛑 Client went offline:", username);
      io.emit("onlineUsers", Array.from(onlineUsers.values()));
    });

    // Handle agent disconnecting
    socket.on("AgentOffline", ({ username }) => {
      for (const [socketId, user] of onlineAgents.entries()) {
        if (user.username === username) {
          onlineAgents.delete(socketId);
          break;
        }
      }
      console.log("🛑 Agent went offline:", username);
      io.emit("onlineAgents", Array.from(onlineAgents.values()));
    });

    // Send Message
    socket.on("sendMessage", async ({ sender, receiver, text, timestamp, role }) => {
      console.log("📨 Received sendMessage event:", { sender, receiver, text, timestamp, role });

      try {
        // 🔍 Find sender in DB
        const senderDB = await (role === "user"
          ? User.findOne({ where: { username: sender } })
          : Agent.findOne({ where: { username: sender } })
        );

        if (!senderDB) {
          console.error(`⚠️ Sender ${sender} not found in DB.`);
          return;
        }

        console.log("✅ Sender found in DB:", senderDB.username);

        // 🔍 Find receiver in DB
        const receiverDB = await (role === "agent"
          ? User.findOne({ where: { username: receiver } })
          : Agent.findOne({ where: { username: receiver } })
        );

        if (!receiverDB) {
          console.error(`⚠️ Receiver ${receiver} not found in DB.`);
          return;
        }

        console.log("✅ Receiver found in DB:", receiverDB.username);

        // 🔍 Find receiver's socket ID (if online)
        let receiverSocketId =
          [...onlineUsers.entries()].find(([id, user]) => user.username === receiver)?.[0] ||
          [...onlineAgents.entries()].find(([id, agent]) => agent.username === receiver)?.[0];

        // 📬 Prepare the message object
        const messageData = {
          sender: senderDB.username,
          receiver: receiverDB.username,
          text,
          timestamp,
          role,
        };

        // ✅ If receiver is online, send message in real-time
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("receiveMessage", messageData);
          console.log(`📩 Message sent to ${receiver} (Socket ID: ${receiverSocketId})`);
        } else {
          console.warn(`⚠️ Receiver ${receiver} is offline. Message will be saved.`);
        }

        // ✅ Save message in DB
        const savedMessage = await Chat.create({
          senderType: role,
          message: text,
          userId: role === "user" ? senderDB.id : receiverDB.id,
          agentId: role === "agent" ? senderDB.id : receiverDB.id,
        });

        console.log("✅ Message saved to DB:", savedMessage.toJSON());
      } catch (error) {
        console.error("❌ Error in sendMessage handler:", error);
      }
    });

    // Typing Indicator
    socket.on("typing", ({ user }) => {
      if (!user || !user.username) {
        console.error("❌ Invalid user data in 'typing' event:", user);
        return;
      }
      console.log(`📝 ${user.username} is typing...`);
      socket.broadcast.emit("typing", { user });
    });

    // Stopped Typing Indicator
    socket.on("stopped-typing", ({ user }) => {
      if (!user || !user.username) {
        console.error("❌ Invalid user data in 'stopped-typing' event:", user);
        return;
      }
      console.log(`🛑 ${user.username} stopped typing.`);
      socket.broadcast.emit("stopped-typing", { user });
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log(`🔴 User with socket ID ${socket.id} disconnected`);

      onlineUsers.forEach((value, key) => {
        if (key === socket.id) {
          console.log(`Removing user: ${value.username} (Socket ID: ${socket.id})`);
          onlineUsers.delete(key);
        }
      });

      onlineAgents.forEach((value, key) => {
        if (key === socket.id) {
          console.log(`Removing agent: ${value.username} (Socket ID: ${socket.id})`);
          onlineAgents.delete(key);
        }
      });

      console.log("📌 Updated Online Users:", Array.from(onlineUsers.values()));
      console.log("📌 Updated Online Agents:", Array.from(onlineAgents.values()));

      io.emit("onlineUsers", Array.from(onlineUsers.values()));
      io.emit("onlineAgents", Array.from(onlineAgents.values()));
    });
  });
};
