import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config(); 

// Initialize Sequelize with database credentials
const sequelize = new Sequelize(
  process.env.DB_NAME, 
  process.env.DB_USER, 
  process.env.DB_PASS, 
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false,
  }
);

// Test the database connection
(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected...');
  } catch (error) {
    console.error('❌ Error connecting to the database:', error);
  }
})();

// Sync database models
sequelize.sync()
  .then(() => console.log('✅ Database synced'))
  .catch(error => console.error('❌ Error syncing the database:', error));

export default sequelize;
