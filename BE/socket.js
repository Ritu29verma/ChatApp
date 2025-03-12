import { io } from "./index.js";
import Chat from "./models/Chats.js";
import User from './models/User.js';
import Agent from './models/Agent.js';

const onlineUsers = new Map();
const onlineAgents = new Map();
const activeSessions = new Map();
const pendingChatRequests = new Map();

export const chatSocket = () => {
  io.on("connection", (socket) => {
    console.log("🟢 A user connected:", socket.id);

    // Register clients
    socket.on("registerClient", ({ username }) => {
      console.log(`🔹 Registering Client: ${username}, Socket ID: ${socket.id}`);
      onlineUsers.set(socket.id, { username, role: "user" });
      console.log("📌 Current Online Users:", Array.from(onlineUsers.entries()));
      console.log("Current Online Agents:",Array.from(onlineAgents.entries()))
      io.emit("onlineUsers", Array.from(onlineUsers.values())); // Update users
      io.emit("onlineAgents", Array.from(onlineAgents.values())); // Update agents
      checkForAvailableAgents(username);
    });

    // Register agents
    socket.on("registerAgent", ({ username }) => {
      console.log(`🔸 Registering Agent: ${username}, Socket ID: ${socket.id}`);
      onlineAgents.set(socket.id, { username, role: "agent" });
      console.log("📌 Current Online Users:", Array.from(onlineUsers.entries()));
      console.log("📌 Current Online Agents:", Array.from(onlineAgents.entries()));
      io.emit("onlineAgents", Array.from(onlineAgents.values())); // Update agents
      io.emit("onlineUsers", Array.from(onlineUsers.values())); // Update users
    
     // Send only unaccepted chat requests to the newly logged-in agent
     const unacceptedRequests = Array.from(pendingChatRequests.keys()).filter(
      (clientUsername) => !pendingChatRequests.get(clientUsername)
    );

    if (unacceptedRequests.length > 0) {
      unacceptedRequests.forEach((clientUsername) => {
        io.to(socket.id).emit("newChatRequest", { clientUsername });
      });
    }
  });

    socket.on("newChatRequest", ({ clientUsername }) => {
      checkForAvailableAgents(clientUsername);
      if (!pendingChatRequests.has(clientUsername)) {
        pendingChatRequests.set(clientUsername, false); // Mark as unaccepted

        // Notify all online agents about the new request
        Array.from(onlineAgents.keys()).forEach((agentSocketId) => {
          io.to(agentSocketId).emit("newChatRequest", { clientUsername });
        });
      }
    });

    function checkForAvailableAgents(clientUsername) {
      const availableAgents = Array.from(onlineAgents.entries()).filter(
        ([_, agent]) => !activeSessions.has(agent.username)
      );
      if (availableAgents.length === 0) {
        console.log("❌ No available agents for:", clientUsername);
        return;
      }
      availableAgents.forEach(([agentSocketId, agent]) => {
        io.to(agentSocketId).emit("newChatRequest", { clientUsername });
      });
    }

    socket.on("acceptChat", ({ agentUsername, clientUsername }) => {
      console.log(`🟢 acceptChat Event Received | Agent: ${agentUsername}, Client: ${clientUsername}`);
      if (pendingChatRequests.has(clientUsername) && !pendingChatRequests.get(clientUsername)) {
        pendingChatRequests.set(clientUsername, true); 
      const clientEntry = [...onlineUsers.entries()].find(([_, user]) => user.username === clientUsername);
      if (clientEntry) {
        const [clientSocketId] = clientEntry;

         // ✅ Remove from pending requests if it was stored
         if (pendingChatRequests.has(clientUsername)) {
          pendingChatRequests.delete(clientUsername); // Correct way to remove from Map
        }        

        // Store session correctly
        activeSessions.set(clientUsername, {
          agent: agentUsername,
          client: clientUsername,
          agentSocketId: socket.id,
          clientSocketId: clientSocketId
        });

        console.log("✅ Chat Accepted - Session stored:", activeSessions.get(clientUsername));

        // Notify both parties
        io.to(clientSocketId).emit("chatAccepted", { agentUsername });
        io.to(socket.id).emit("chatAccepted", { clientUsername });
        console.log(`📢 Emitting chatRequestHandled for Client: ${clientUsername}, Agent: ${agentUsername}`);
       io.emit("chatRequestHandled", { clientUsername, agentUsername });
      } else {
        console.log(`⚠️ Client ${clientUsername} not found for chat.`);
      }}
    }); 

    socket.on("denyChat", ({ clientUsername }) => {
      console.log(`🚫 Agent denied chat request from ${clientUsername}`);
    
      // Find the client's socket ID
      const clientEntry = [...onlineUsers.entries()].find(([_, user]) => user.username === clientUsername);
      
      if (clientEntry) {
        const [clientSocketId] = clientEntry;
        io.to(clientSocketId).emit("chatDenied", { message: "Your chat request was denied." });
        console.log(`🔴 Notified ${clientUsername} about denial`);
      } else {
        console.log(`⚠️ Client ${clientUsername} not found`);
      }
    
      // ✅ Emit event back to the denying agent
      io.to(socket.id).emit("chatDeniedByAgent", { clientUsername });
    }); 

    socket.on("endChat", ({ agentUsername, clientUsername }) => {
      console.log("End Chat requested by:", { agentUsername, clientUsername });
    
      const session = activeSessions.get(clientUsername); // ✅ Find session by clientUsername
    
      if (session) {
        activeSessions.delete(clientUsername); // ✅ Delete session using clientUsername
    
        io.to([...onlineUsers.entries()].find(([_, u]) => u.username === session.client)?.[0])
          .emit("chatEnded", { session });
    
        io.to([...onlineAgents.entries()].find(([_, a]) => a.username === session.agent)?.[0])
          .emit("chatEnded", { session });
    
        console.log("✅ Chat session ended successfully:", session);
      } else {
        console.error("⚠️ No active session found for client:", clientUsername);
      }
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
