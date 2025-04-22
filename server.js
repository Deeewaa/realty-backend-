import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { authenticateUser } from './middleware/authMiddleware.js';
import { authorize } from './middleware/authorize.js';
import authRouter from './routes/authRoutes.js';

const app = express();

// ========================
// 1. DATABASE CONNECTION
// ========================
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/realty-db')
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error("MongoDB connection error:", err));

// ========================
// 2. MIDDLEWARE
// ========================
// Security middleware
app.use(helmet());
app.use(cors({ 
  origin: process.env.CLIENT_URL || 'https://realtyestate.kesug.com',
  credentials: true
}));

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again later'
});

// Body parsing
app.use(express.json({ limit: '10kb' }));

// ========================
// 3. ROUTES
// ========================
// Auth Routes
app.use('/api/auth', authLimiter, authRouter);

// User Routes
import userRouter from './routes/userRoutes.js';
app.use('/api/users', authenticateUser, userRouter);

// Property Routes
import propertyRouter from './routes/propertyRoutes.js';
app.use('/api/properties', propertyRouter);

// Admin Routes
import adminRouter from './routes/adminRoutes.js';
app.use('/api/admin', authenticateUser, authorize(['admin']), adminRouter);

// ========================
// 4. ERROR HANDLING
// ========================
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(statusCode).json({
    success: false,
    error: message
  });
});

// ========================
// 5. START SERVER
// ========================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});