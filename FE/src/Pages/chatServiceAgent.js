import axios from 'axios';

export const checkOrRegisterAgent = async (phoneNumber, isGuest = false) => {
  try {
    const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/chat/agents/check-or-register`, {
      phoneNumber,
      isGuest,
    });

    const agent = response.data;

    if (agent) {
      sessionStorage.setItem("phoneNumber", agent.phoneNumber);
      sessionStorage.setItem("username", agent.username);
    }

    return agent;
  } catch (error) {
    console.error('Error checking/registering agent:', error);
    return null;
  }
};



export  const fetchAgents = async () => {
  try {
    const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/chat/agents/all-agents`);
    return response.data;
  } catch (error) {
    console.error("Error fetching agents:", error);
    return[];
  }
};

export const fetchChatHistory = async (userId, agentId) => {
  try {
    const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/chat/chats/history`, {
      params: { userId, agentId }, // ✅ Send both userId and agentId as query params
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching chat history:", error.response || error);
    return [];
  }
};
