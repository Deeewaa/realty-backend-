import express from 'express';
import User from '../models/User.js';
import Property from '../models/Property.js';
import { authorize } from '../middleware/authorize.js';

const router = express.Router();

// Admin dashboard statistics
router.get('/dashboard', async (req, res) => {
  try {
    // Get statistics
    const [usersCount, propertiesCount, latestUsers] = await Promise.all([
      User.countDocuments(),
      Property.countDocuments(),
      User.find().sort({ createdAt: -1 }).limit(5).select('-password')
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers: usersCount,
        totalProperties: propertiesCount,
        recentSignups: latestUsers
      }
    });

  } catch (error) {
    console.error("Admin Dashboard Error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to load dashboard data"
    });
  }
});

// Get all users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password -verificationToken');
    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch users"
    });
  }
});

// Update user role
router.patch('/users/:id', async (req, res) => {
  try {
    const { role } = req.body;
    
    if (!['buyer', 'agent', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: "Invalid role specified"
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }

    res.json({
      success: true,
      message: "User role updated",
      user
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to update user role"
    });
  }
});

// Delete property
router.delete('/properties/:id', async (req, res) => {
  try {
    const property = await Property.findByIdAndDelete(req.params.id);
    
    if (!property) {
      return res.status(404).json({
        success: false,
        error: "Property not found"
      });
    }

    res.json({
      success: true,
      message: "Property deleted successfully"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to delete property"
    });
  }
});

export default router;