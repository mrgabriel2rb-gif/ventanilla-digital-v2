import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { sequelize } from './models';
import { seedSuperAdmin } from './seeders/superadmin';
import dotenv from 'dotenv';

dotenv.config();

import authRoutes from './routes/authRoutes';
import reporteRoutes from './routes/reporteRoutes';
import adminRoutes from './routes/adminRoutes';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
  }
});

app.set('io', io);

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/reportes', reporteRoutes);
app.use('/api/admin', adminRoutes);

// Routes here (to be added)
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await sequelize.sync({ force: false });
    console.log('Base de datos sincronizada.');
    
    await seedSuperAdmin();
    
    httpServer.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Error al iniciar el servidor:', error);
  }
};

startServer();
