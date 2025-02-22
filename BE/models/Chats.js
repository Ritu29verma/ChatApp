import { DataTypes } from 'sequelize';
import sequelize from '../config.js';
import Agent from './Agent.js';
import User from './User.js';

const Chat = sequelize.define('Chat', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  senderType: {
    type: DataTypes.ENUM('agent', 'user'),
    allowNull: false,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  userId: {
    type: DataTypes.STRING,  // ✅ Changed from INTEGER to STRING
    allowNull: true,
  },
  agentId: {
    type: DataTypes.STRING,  // ✅ Changed from INTEGER to STRING
    allowNull: true,  // An agent may not always be involved
  },
}, {
  timestamps: true,
  tableName: 'chats', 
});

// Relationships
Chat.belongsTo(User, { foreignKey: 'userId', onDelete: 'CASCADE' });
Chat.belongsTo(Agent, { foreignKey: 'agentId', onDelete: 'CASCADE' });

export default Chat;