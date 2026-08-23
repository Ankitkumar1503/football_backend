import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.MYSQL_URL || process.env.DATABASE_URL || process.env.MYSQL_PUBLIC_URL;

const dbHost = process.env.DB_HOST || process.env.MYSQLHOST || process.env.MYSQLHOST_URL || '127.0.0.1';
const dbPort = process.env.DB_PORT || process.env.MYSQLPORT || 3306;
const dbName = process.env.DB_NAME || process.env.MYSQLDATABASE || 'touches_db';
const dbUser = process.env.DB_USER || process.env.MYSQLUSER || 'root';
const dbPassword = process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || '';

export const sequelize = connectionString
  ? new Sequelize(connectionString, {
      dialect: 'mysql',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
    })
  : new Sequelize(dbName, dbUser, dbPassword, {
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
    await sequelize.authenticate();
    console.log('✅ MySQL Database connected successfully via Sequelize.');
    await sequelize.sync({ alter: true });
    console.log('✅ Database models synchronized.');
  } catch (error) {
    console.warn('⚠️ Could not connect to MySQL server:', error.message);
    console.warn('⚠️ Server will run in API fallback mode.');
  }
};
