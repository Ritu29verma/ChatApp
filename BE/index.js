import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import { chatSocket } from "./socket.js";
import chatModule from './chatModule.js';
import sequelize from "./config.js";
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use((req, res, next) => {
    req.db = sequelize;
    next();
  });

app.use("/chat", chatModule);


    const server = http.createServer(app);
    const io = new Server(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });

    chatSocket(io);

    sequelize.sync()
    .then(() => {
      console.log("✅ Database synced");
      server.listen(port, () => {
        console.log(`🚀 Server is running on port ${port}`);
      });
    })
    .catch((error) => {
      console.error("❌ Error syncing database:", error);
    });
  
  export { io };