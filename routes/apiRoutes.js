const express = require('express');
const router = express.Router();
const authenticateUser = require('../middleware/authMiddleware'); // 👈 ADD THIS
const authorize = require('../middleware/authorize');

// ========================
// Protected Routes
// ========================

// Admin Dashboard
router.get('/admin/dashboard', 
  authenticateUser, // 👈 MUST COME FIRST
  authorize(['admin']), 
  (req, res) => {
    res.json({ message: "Welcome to Admin Dashboard" });
  }
);

// Property Listings (Agent+Admin)
router.get('/property/listings',
  authenticateUser, // 👈 REQUIRED
  authorize(['agent', 'admin']),
  (req, res) => {
    res.json({ listings: [] });
  }
);

// Save Property (Buyer only)
router.post('/properties/:id/save',
  authenticateUser, // 👈 NECESSARY
  authorize(['buyer']),
  (req, res) => {
    // Save property logic
  }
);

module.exports = router;
// Save Property (Buyer only)
router.post('/properties/:id/save',
  authorize(['buyer']),
  (req, res) => {
    // Save property logic
  }
);

module.exports = router;