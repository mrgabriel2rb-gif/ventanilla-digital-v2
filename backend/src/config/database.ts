import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

export const sequelize = new Sequelize(
  process.env.DB_NAME || 'ventanilla_db',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || 'admin123',
  {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    dialect: 'mariadb',
    logging: false,
  }
);
