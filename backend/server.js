const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
require('dotenv').config();

const { testConnection, sequelize } = require('./config/database');
const { syncModels } = require('./models');

// Import routes
const authRoutes = require('./routes/auth');
const walletRoutes = require('./routes/wallet');
const communityRoutes = require('./routes/community');
const productRoutes = require('./routes/products');
// TODO: Add other routes as needed
// const userRoutes = require('./routes/users');
// const transactionRoutes = require('./routes/transactions');
// const orderRoutes = require('./routes/orders');
// const mdmRoutes = require('./routes/mdm');
// const adminRoutes = require('./routes/admin');

// Initialize Express app
const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Device-ID', 'X-App-Version', 'X-Device-Name', 'X-Device-Type']
}));

// Basic middleware
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
const API_PREFIX = `/api/${process.env.API_VERSION || 'v1'}`;

app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/wallet`, walletRoutes);
app.use(`${API_PREFIX}/community`, communityRoutes);
app.use(`${API_PREFIX}/products`, productRoutes);
// TODO: Enable these routes when they are created
// app.use(`${API_PREFIX}/users`, userRoutes);
// app.use(`${API_PREFIX}/transactions`, transactionRoutes);
// app.use(`${API_PREFIX}/orders`, orderRoutes);
// app.use(`${API_PREFIX}/mdm`, mdmRoutes);
// app.use(`${API_PREFIX}/admin`, adminRoutes);

// API documentation endpoint
app.get(`${API_PREFIX}`, (req, res) => {
  res.json({
    message: 'TLB Diamond API',
    version: process.env.API_VERSION || 'v1',
    endpoints: {
      auth: `${API_PREFIX}/auth`,
      users: `${API_PREFIX}/users`,
      wallet: `${API_PREFIX}/wallet`,
      transactions: `${API_PREFIX}/transactions`,
      products: `${API_PREFIX}/products`,
      orders: `${API_PREFIX}/orders`,
      community: `${API_PREFIX}/community`,
      mdm: `${API_PREFIX}/mdm`,
      admin: `${API_PREFIX}/admin`
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);

  // Handle Sequelize validation errors
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Invalid input data',
      details: err.errors.map(e => ({
        field: e.path,
        message: e.message
      }))
    });
  }

  // Handle Sequelize unique constraint errors
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      error: 'Conflict',
      message: 'Resource already exists',
      field: err.errors[0]?.path
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Token expired'
    });
  }

  // Handle file upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      error: 'File Too Large',
      message: 'File size exceeds limit'
    });
  }

  // Default error response
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(status).json({
    error: status >= 500 ? 'Internal Server Error' : err.name || 'Error',
    message: process.env.NODE_ENV === 'production' && status >= 500 ? 
             'An internal error occurred' : message,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// Graceful shutdown handling
const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  
  try {
    await sequelize.close();
    console.log('Database connections closed.');
    
    process.exit(0);
  } catch (error) {
    console.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
const PORT = process.env.PORT || 3000;

const createAdminUser = async () => {
  const bcrypt = require('bcryptjs');
  const { User, Wallet } = require('./models');
  
  try {
    // Check if admin user already exists
    const existingAdmin = await User.findOne({ 
      where: { email: 'admin@tlbdiamond.com' } 
    });
    
    if (!existingAdmin) {
      console.log('🔧 Creating admin user...');
      
      // Hash the admin password
      const hashedPassword = await bcrypt.hash('TLBAdmin2024!', 12);
      
      // Create admin user
      const adminUser = await User.create({
        email: 'admin@tlbdiamond.com',
        password_hash: hashedPassword,
        first_name: 'TLB',
        last_name: 'Administrator',
        phone: '+1234567890',
        role: 'admin',
        account_type: 'business',
        status: 'active',
        is_verified: true,
        verification_level: 'full'
      });
      
      // Create admin wallet
      await Wallet.create({
        user_id: adminUser.id,
        available_balance: 1000000.00, // Give admin 1M TLB for testing
        currency: 'TLB'
      });
      
      console.log('✅ Admin user created successfully');
      console.log('📧 Email: admin@tlbdiamond.com');
      console.log('🔑 Password: TLBAdmin2024!');
    } else {
      console.log('✅ Admin user already exists');
    }
    
  } catch (error) {
    console.error('❌ Failed to create admin user:', error);
  }
};

const startServer = async () => {
  try {
    // Test database connection
    await testConnection();
    
    // Sync models (create tables)
    await syncModels(false); // Set to true to force recreate tables
    
    // Create admin user if it doesn't exist
    await createAdminUser();
    
    if (!process.env.JWT_SECRET) {
      console.warn('⚠️  JWT_SECRET is not set: sign-in, registration and every authenticated route will fail until it is set.');
    }

    // Start listening
    app.listen(PORT, () => {
      console.log(`\n🚀 TLB Diamond API Server running on port ${PORT}`);
      console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 API Base URL: http://localhost:${PORT}${API_PREFIX}`);
      console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
      console.log(`📚 API Documentation: http://localhost:${PORT}${API_PREFIX}\n`);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

startServer();

module.exports = app;