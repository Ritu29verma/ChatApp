// routes/chatRoutes.js
import express from "express";
import { getChatHistory } from "../controllers/chatController.js";

const router = express.Router();

// Get Chat History
router.get("/history", getChatHistory);

export default router;
