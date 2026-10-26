import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './db.js';
import { chatController } from './controllers/chatController.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: '*', // Allow client connections
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.originalUrl.startsWith('/api')) {
      console.log(`[HTTP] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// Health check endpoint
app.get('/api/health', chatController.getHealth);

// Conversation management routes
app.get('/api/conversations', chatController.listConversations);
app.post('/api/conversations', chatController.createConversation);
app.get('/api/conversations/:id', chatController.getConversation);
app.patch('/api/conversations/:id', chatController.updateConversation);
app.delete('/api/conversations/:id', chatController.deleteConversation);

// Real-time SSE streaming chat endpoint
app.post('/api/conversations/:id/stream', chatController.streamChat);

// 404 Catch-all
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, error: `Route ${req.method} ${req.originalUrl} not found` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Server Error]', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error occurred',
    message: process.env.NODE_ENV === 'production' ? undefined : err.message,
  });
});

// Initialize Database & Start Server
async function startServer() {
  await connectDB(process.env.MONGODB_URI);

  const server = app.listen(PORT, () => {
    console.log(`\n=================================================`);
    console.log(`🚀 AI Chat Assistant Server running on port ${PORT}`);
    console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`💬 API Base:     http://localhost:${PORT}/api/conversations`);
    console.log(`=================================================\n`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n❌ [Port Conflict] Port ${PORT} is already in use.`);
      console.error(`💡 Solution: Close the existing process on port ${PORT} or change PORT in server/.env.\n`);
      process.exit(1);
    } else {
      console.error('[Server Startup Error]', err);
    }
  });

  const shutdown = () => {
    console.log('\n[Server] Gracefully shutting down...');
    server.close(() => {
      console.log('[Server] Closed all connections.');
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

startServer();
