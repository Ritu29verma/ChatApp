import axios from 'axios';


export const checkOrRegisterUser = async ( username = null, isGuest = false ) => {
  try {
    const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/chat/users/check-or-register`, {
      username,
      isGuest
    });
    const user = response.data;

    if (user) {
      sessionStorage.setItem("username", user.username);
    }

    return user;
  } catch (error) {
    console.error('Error checking/registering user:', error);
    return null;
  }
};


export const fetchUsers = async () => {
  try {
    const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/chat/users/getUsers`);
    return response.data;
  } catch (error) {
    console.error("Error fetching users:", error);
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
