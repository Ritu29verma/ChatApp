import Chat from "../models/Chats.js";

export const getChatHistory = async (req, res) => {
  const { userId, agentId } = req.query; // Use query params instead of req.params to support both

  try {
    if (!userId || !agentId) {
      return res.status(400).json({ error: "userId and agentId are required." });
    }

    const chatHistory = await Chat.findAll({
      where: {
        userId,
        agentId, // Now also filtering by agentId
      },
      order: [["createdAt", "ASC"]],
    });

    res.status(200).json(chatHistory);
  } catch (error) {
    console.error("Error fetching chat history:", error);
    res.status(500).json({ error: "Failed to fetch chat history." });
  }
};
