import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const dbHost = process.env.DB_HOST || '127.0.0.1';
const dbPort = process.env.DB_PORT || 3306;
const dbName = process.env.DB_NAME || 'touches_db';
const dbUser = process.env.DB_USER || 'root';
const dbPassword = process.env.DB_PASSWORD || '';

export const sequelize = new Sequelize(dbName, dbUser, dbPassword, {
  host: dbHost,
  port: Number(dbPort),
  dialect: 'mysql',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

export const connectDB = async () => {
  try {
    if (process.env.RUN_DB_SYNC === 'true') {
      await sequelize.sync({ alter: true });
      console.log('Database models synchronized (alter mode).');
    } else {
      await sequelize.authenticate();
      console.log('Database connection verified (lightweight mode).');
    }
  } catch (error) {
    console.warn('⚠️ Could not connect to MySQL server:', error.message);
    console.warn('⚠️ Server will run in API fallback mode. Ensure MySQL service is running.');
  }
};
