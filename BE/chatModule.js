import express from 'express';
import agentRoutes from './routes/agentRoutes.js';
import userRoutes from './routes/userRoutes.js';
import chatRoutes from './routes/chatRoutes.js'

const chatModule = express.Router();



chatModule.use(express.json());
chatModule.use('/agents', agentRoutes);
chatModule.use('/users', userRoutes);
chatModule.use('/chats', chatRoutes);

export default chatModule;
