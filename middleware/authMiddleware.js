// authMiddleware.js
import jwt from 'jsonwebtoken';
import User from '../models/User.js'; // Path to your User model

export const authenticateUser = async (req, res, next) => {
  try {
    // 1. Get token from multiple sources
    const token = req.cookies?.token || 
                 req.headers.authorization?.split(' ')[1] || 
                 req.body?.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Authentication required. No token provided."
      });
    }

    // 2. Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Find user with token and valid verification status
    const user = await User.findById(decoded.userId)
      .select('-password -verificationToken -resetToken -__v');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Invalid token - user not found"
      });
    }

    // 4. Check if email is verified
    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        error: "Account not verified. Please check your email."
      });
    }

    // 5. Attach user to request object
    req.user = user;
    
    // 6. Proceed to next middleware/route
    next();

  } catch (error) {
    // Handle specific JWT errors
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: "Session expired. Please log in again."
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: "Invalid token. Please authenticate."
      });
    }

    // Log unexpected errors
    console.error('Authentication Error:', error);
    res.status(500).json({
      success: false,
      error: "Authentication failed. Please try again."
    });
  }
};
