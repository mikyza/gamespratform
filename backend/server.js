require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const authRoutes = require('./routes/authRoutes');
const socketHandler = require('./sockets/gameHandler');
// NEW: Import admin routes (you will create this file)
// const adminRoutes = require('./routes/adminRoutes'); 

const app = express();
const server = http.createServer(app);

// 1. Strict CORS to fix Render proxy blocking
const ALLOWED_ORIGINS = [
  'https://gamespratform-1.onrender.com',
  'https://gamespratform.onrender.com',
  'http://localhost:3000',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin) || origin.endsWith('.onrender.com')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

app.use(express.json());

// 2. Socket.IO configuration forcing Websocket first
const io = new Server(server, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'], // Fallback to polling[cite: 5]
  allowEIO3: true,
});

// 3. Health Checks (Required by Render immediately on boot)
app.get('/', (req, res) => res.status(200).send('Arena Platform Backend Live 🚀'));
app.get('/health', (req, res) => res.status(200).json({ status: 'OK' }));

// 4. API Routes
app.use('/api/auth', authRoutes);
// app.use('/api/admin', adminRoutes); // Uncomment when ready

// Initialize Socket Handlers
socketHandler(io);

// 5. START SERVER FIRST, THEN CONNECT TO DB
const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

if (process.env.MONGODB_URI) {
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ MongoDB Connected Successfully'))
    .catch((err) => console.error('❌ MongoDB Connection Error:', err));
} else {
  console.error('⚠️ Warning: MONGODB_URI is missing from environment variables.');
}
