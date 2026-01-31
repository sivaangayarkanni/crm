require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');

const authRoutes = require('./routes/auth');
const tenantRoutes = require('./routes/tenants');
const leadRoutes = require('./routes/leads');
const contactRoutes = require('./routes/contacts');
const dealRoutes = require('./routes/deals');
const analyticsRoutes = require('./routes/analytics');
const billingRoutes = require('./routes/billing');
const webhookRoutes = require('./routes/webhooks');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Security Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Health Check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/deals', dealRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/webhooks', webhookRoutes);

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      details: Object.values(err.errors).map(e => e.message)
    });
  }
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid token' });
  }
  
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Socket.io Real-time Events
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Join tenant-specific room
  socket.on('join:tenant', (tenantId) => {
    socket.join(`tenant:${tenantId}`);
    console.log(`Socket ${socket.id} joined tenant:${tenantId}`);
  });
  
  // Real-time lead updates
  socket.on('lead:update', (data) => {
    socket.to(`tenant:${data.tenantId}`).emit('lead:updated', data);
  });
  
  socket.on('lead:new', (data) => {
    socket.to(`tenant:${data.tenantId}`).emit('lead:created', data);
  });
  
  // Real-time deal updates
  socket.on('deal:update', (data) => {
    socket.to(`tenant:${data.tenantId}`).emit('deal:updated', data);
  });
  
  // Notifications
  socket.on('notification:send', (data) => {
    io.to(`tenant:${data.tenantId}`).emit('notification', data);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Make io accessible in routes
app.set('io', io);

// Serve static files from React frontend in production
if (process.env.NODE_ENV === 'production') {
  const path = require('path');
  
  // Serve the React build files
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  
  // Serve static files from public folder
  app.use(express.static(path.join(__dirname, '../frontend/public')));
  
  // Handle React routing, return all requests to React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
  });
}

// Database Connection
const connectDB = async () => {
  try {
    // Try MongoDB Atlas first, fallback to local MongoDB
    let mongoURI = process.env.MONGODB_URI;
    
    // If Atlas connection fails, try local MongoDB
    if (mongoURI && mongoURI.includes('mongodb+srv')) {
      try {
        await mongoose.connect(mongoURI, {
          ssl: process.env.NODE_ENV === 'production' ? true : false,
          retryWrites: true,
          w: 'majority',
          maxPoolSize: 10,
          serverSelectionTimeoutMS: 3000,
          socketTimeoutMS: 45000,
        });
        console.log('✅ MongoDB Atlas connected successfully');
        console.log('📦 Connected to MongoDB Atlas');
        return;
      } catch (atlasError) {
        console.warn('⚠️ MongoDB Atlas connection failed, trying local MongoDB...');
        mongoURI = 'mongodb://127.0.0.1:27017/tenantflow';
      }
    } else {
      mongoURI = 'mongodb://127.0.0.1:27017/tenantflow';
    }
    
    const mongooseOptions = {
      // Connection options
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };
    
    await mongoose.connect(mongoURI, mongooseOptions);
    console.log('✅ MongoDB connected successfully');
    console.log('📦 Connected to local MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.warn('⚠️ Server starting without database - some features will not work');
    // Don't exit, allow server to run without DB for development
  }
};

// Start Server
const PORT = process.env.PORT || 5001;

connectDB().then(() => {
  httpServer.listen(PORT, () => {
    console.log(`
    🚀 TenantFlow Backend Server
    ============================
    📡 Server running on port ${PORT}
    🌐 Environment: ${process.env.NODE_ENV || 'development'}
    🔗 Health check: http://localhost:${PORT}/health
    `);
  });
});

module.exports = { app, io };
