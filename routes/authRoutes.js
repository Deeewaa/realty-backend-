import express from 'express';
import User from '../models/User.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { transporter } from '../utils/emailService.js';

const router = express.Router();

// REGISTRATION ROUTE
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validate input
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        error: "All fields (email, password, name) are required"
      });
    }

    // Check for existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: "Email already registered"
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create verification token
    const emailVerificationToken = jwt.sign(
      { email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Create new user
    const newUser = await User.create({
      email,
      name,
      password: hashedPassword,
      isVerified: false,
      emailVerificationToken,
      emailVerificationExpires: Date.now() + 3600000
    });

    // Send verification email
    await transporter.sendMail({
      from: `"Realty App" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Verify Your Email Address',
      html: `
        <h2>Welcome to Realty App!</h2>
        <p>Please verify your email by clicking the link below:</p>
        <a href="${process.env.CLIENT_URL}/verify-email?token=${emailVerificationToken}">
          Verify Email
        </a>
        <p>This link expires in 1 hour.</p>
      `
    });

    // Remove sensitive data from response
    const userResponse = {
      _id: newUser._id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role
    };

    res.status(201).json({
      success: true,
      message: "Registration successful! Please check your email.",
      user: userResponse
    });

  } catch (error) {
    console.error("Registration Error:", error);
    
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        error: "Email already exists"
      });
    }
    
    res.status(500).json({
      success: false,
      error: "Registration failed. Please try again."
    });
  }
});

// LOGIN ROUTE
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required"
      });
    }

    // Find user with password and verification status
    const user = await User.findOne({ email })
      .select('+password +isVerified');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password"
      });
    }

    // Check email verification status
    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        error: "Email not verified. Please check your inbox.",
        resendEndpoint: "/api/auth/resend-verification"
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password"
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Prepare user response
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified
    };

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: userResponse
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});

export default router;