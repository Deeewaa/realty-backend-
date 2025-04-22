import express from 'express';
import User from '../models/User.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { transporter } from '../utils/emailService.js';

const router = express.Router();

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
    const verificationToken = jwt.sign(
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
      verificationToken
    });

    // Send verification email
    await transporter.sendMail({
      from: `"Realty App" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Verify Your Email Address',
      html: `
        <h2>Welcome to Realty App!</h2>
        <p>Please verify your email by clicking the link below:</p>
        <a href="${process.env.CLIENT_URL}/verify-email?token=${verificationToken}">
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

export default router;