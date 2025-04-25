import dotenv from 'dotenv';
dotenv.config();
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
app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ 
  origin: process.env.CLIENT_URL || 'https://realtyestate.kesug.com',
  credentials: true
}));

// Add CORS_ORIGIN as a separate configuration if needed
const corsOptions = {
  origin: process.env.CORS_ORIGIN 
    ? process.env.CORS_ORIGIN.split(',') 
    : process.env.CLIENT_URL,
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later',
  validate: { trustProxy: true },
  keyGenerator: (req) => req.headers['x-forwarded-for']?.split(',')[0].trim() || req.ip
});

app.use(express.json({ limit: '10kb' }));

// Email transporter setup
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// ========================
// 3. EMAIL VERIFICATION ROUTES
// ========================
// Generate verification email
app.post('/api/verify-email', authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    
    // Generate verification token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Save token to user document
    user.emailVerificationToken = token;
    user.emailVerificationExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Send verification email
    const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${token}`;
    
    await transporter.sendMail({
      from: `"Realty Estate" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'Email Verification',
      html: `
        <p>Please verify your email by clicking the link below:</p>
        <a href="${verificationUrl}">Verify Email</a>
        <p>This link expires in 1 hour.</p>
      `
    });

    res.json({ success: true, message: 'Verification email sent' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error sending verification email' });
  }
});

// Confirm email verification
app.get('/api/confirm-email/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await mongoose.model('User').findOne({
      _id: decoded.userId,
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, error: 'Invalid or expired token' });
    }

    user.isVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.json({ success: true, message: 'Email verified successfully' });
  } catch (error) {
    res.status(400).json({ success: false, error: 'Verification failed' });
  }
});

// ========================
// 4. EXISTING ROUTES & MIDDLEWARE
// ========================
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
// 5. ERROR HANDLING & SERVER START
// ========================
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});