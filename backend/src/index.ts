import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';
import authRoutes from './routes/auth';
import letterRoutes from './routes/letters';
import templateRoutes from './routes/templates';
import { warmBrowser } from './lib/pdfGenerator';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/letters', letterRoutes);
app.use('/api/templates', templateRoutes);

app.get('/', (req, res) => {
  res.send('DocVerify Letter Verification API is running.');
});

// Setup Socket.IO
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined room`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

app.set('io', io);

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  warmBrowser().catch((err) => console.error('[PDF] Browser warm-up failed:', err));
});
