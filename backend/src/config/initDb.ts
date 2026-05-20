import mariadb from 'mariadb';
import dotenv from 'dotenv';

dotenv.config();

async function createDatabase() {
  const pool = mariadb.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'admin123',
    port: parseInt(process.env.DB_PORT || '3306', 10),
  });

  try {
    const connection = await pool.getConnection();
    const dbName = process.env.DB_NAME || 'ventanilla_db';
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
    console.log(`Database ${dbName} created or already exists.`);
    connection.release();
  } catch (err) {
    console.error('Error creating database:', err);
  } finally {
    await pool.end();
  }
}

createDatabase();
