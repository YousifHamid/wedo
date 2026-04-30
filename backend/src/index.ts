import express from 'express';
import path from 'path';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db';
import authRoutes from './routes/auth.routes';
import tripRoutes from './routes/trip.routes';
import zoneRoutes from './routes/zone.routes';
import walletRoutes from './routes/wallet.routes';
import adminRoutes from './routes/admin.routes';
import whatsappRoutes from './routes/whatsapp.routes';
import setupSockets from './sockets';

dotenv.config();

// Connect to Database
connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT']
  }
});

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/trip', tripRoutes);
app.use('/api/zones', zoneRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/whatsapp', whatsappRoutes);

// Socket.io Setup
setupSockets(io);

// Basic Route
app.get('/', (req, res) => {
  res.send('Mashi API Running');
});

// Serve Privacy Policy
app.get('/privacy-policy', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/privacy-policy.html'));
});

// Serve Account Deletion Page
app.get('/delete-account', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/delete-account.html'));
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Mashi server listening on port ${PORT}`);
});
