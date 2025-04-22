// userRoutes.js
import express from 'express';
import User from '../models/User.js';
import { authenticateUser } from '../middleware/authMiddleware.js';

const router = express.Router();

// Middleware to verify Authorization header
const verifyAuthHeader = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: "Missing or invalid Authorization header"
    });
  }
  
  next();
};

// Get current user (protected)
router.get('/me', 
  verifyAuthHeader,    // 👈 Enforces header check
  authenticateUser,    // 👈 Validates token
  async (req, res) => {
    try {
      // Explicit header validation
      const token = req.headers.authorization.split(' ')[1];
      
      const user = await User.findById(req.user._id)
        .select('-password -verificationToken -resetToken');

      if (!user) {
        return res.status(404).json({ 
          success: false,
          error: "User not found" 
        });
      }

      res.json({
        success: true,
        user,
        token // Return fresh token if needed
      });

    } catch (error) {
      console.error("Profile Error:", error);
      res.status(500).json({
        success: false,
        error: "Server error"
      });
    }
});

// Update profile (protected)
router.patch('/me', 
  verifyAuthHeader,
  authenticateUser,
  async (req, res) => {
    try {
      // Validate headers first
      if (!req.headers['content-type']?.includes('application/json')) {
        return res.status(415).json({
          success: false,
          error: "Content-Type must be application/json"
        });
      }

      // ... rest of your update logic ...

    } catch (error) {
      // ... error handling ...
    }
});

export default router;