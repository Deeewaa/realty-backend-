import express from 'express';
import Property from '../models/Property.js';
import { authenticateUser } from '../middleware/authMiddleware.js'; // 👈 Fixed import
import { authorize } from '../middleware/authorize.js';
const router = express.Router();

// Get all properties (public)
router.get('/', async (req, res) => {
  // ... your property listing logic
});

// Create property (protected)
router.post('/', 
  authenticateUser, 
  authorize(['agent', 'admin']), // 👈 Added authorization
  async (req, res) => {
    try {
      const { title, price, location, bedrooms, bathrooms, description } = req.body;
      
      const newProperty = new Property({
        title,
        price,
        location,
        bedrooms,
        bathrooms,
        description,
        postedBy: req.user._id
      });

      await newProperty.save();
      
      res.status(201).json({
        success: true,
        property: newProperty
      });

    } catch (error) {
      console.error("Create Property Error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to create property"
      });
    }
});

export default router;