import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const dbUrl = process.env.DATABASE_URL;

// Si existe DATABASE_URL, estamos en producción (Render + Aiven)
export const sequelize = dbUrl 
  ? new Sequelize(dbUrl, {
      dialect: 'mariadb',
      logging: false,
      dialectOptions: {
        ssl: {
          require: true, // Aiven exige conexión encriptada
          rejectUnauthorized: false
        }
      }
    })
  // Si no existe, usamos tu entorno local de desarrollo
  : new Sequelize(
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