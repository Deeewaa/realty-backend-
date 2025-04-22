import 'dotenv/config'; 
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';

const app = express();

// ========================
// 1. DATABASE CONNECTION
// ========================
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/realty-db')
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error("MongoDB connection error:", err));
// ========================
// Authentication Middleware
// ========================
const authenticateUser = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
};
  // ========================
// 2. USER SCHEMA/MODEL
// ========================
const userSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  password: String,
  name: String,
  phone: String,
  role: { type: String, enum: ['buyer', 'agent', 'admin'], default: 'buyer' },
  createdAt: { type: Date, default: Date.now }
});
// ========================
// Property Schema/Model
// ========================
const propertySchema = new mongoose.Schema({
  title: { type: String, required: true },
  price: { type: Number, required: true },
  location: String,
  bedrooms: Number,
  bathrooms: Number,
  description: String,
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  images: [String],
  createdAt: { type: Date, default: Date.now }
});
const Property = mongoose.model('Property', propertySchema);
// ========================
// 3. MIDDLEWARE
// ========================
app.use(cors({ origin: 'https://realtyestate.kesug.com' }));
app.use(express.json());

// Configure email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Forgot password endpoint
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Generate reset token (expires in 15 minutes)
    const resetToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    // Send email
    const resetLink = `https://realtyestate.kesug.com/reset-password?token=${resetToken}`;
    
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset',
      html: `Click <a href="${resetLink}">here</a> to reset your password.`
    });

    res.json({ success: true, message: "Reset email sent" });

  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({ error: "Failed to send reset email" });
  }
});
// ========================
// 4. ROUTES (UPDATED)
// ========================
// 🔒 Registration Endpoint
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    // Check for existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = new User({ email, password: hashedPassword });
    await newUser.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      success: true,
      message: "User registered!",
      token
    });

  } catch (error) {  // 👈 Only ONE catch block needed
    console.error("Registration Error:", error);
    
    // Handle duplicate email error
    if (error.code === 11000) {
      return res.status(400).json({ error: "Email already exists" });
    }
    
    // Handle JWT errors
    if (error.name === 'JsonWebTokenError') {
      return res.status(500).json({ error: "Token generation failed" });
    }

    res.status(500).json({ error: "Registration failed" });
  }
});  // 👈 Removed duplicate catch block
// 🔒 Login Endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("Login attempt for:", email);
    
    // 👇 ADD PASSWORD RESET ROUTES HERE
    // ========================
    // Password Reset Routes
    // ========================
    app.post('/api/auth/reset-password', async (req, res) => {
      try {
        const { token, newPassword } = req.body;
    
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);
        if (!user) return res.status(400).json({ error: "Invalid token" });
    
        // Update password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();
    
        res.json({ success: true, message: "Password updated" });
    
      } catch (error) {
        console.error("Reset Password Error:", error);
        if (error.name === 'TokenExpiredError') {
          res.status(401).json({ error: "Reset link expired" });
        } else {
          res.status(500).json({ error: "Password reset failed" });
        }
      }
    });
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    // Find user
    const user = await User.findOne({ email });
    console.log("User found:", user); // 👈 Debugging log

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    console.log("Password match result:", isMatch); // 👈 Debugging log

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
    console.log("Token generated successfully"); // 👈 Debugging log

    res.json({ success: true, token });

  } catch (error) {
    console.error("Login Error Details:", error); // 👈 Detailed error logging
    res.status(500).json({ error: "Login failed" });
  }
});
// ========================
// User Profile Routes
// ========================
// Get current user's profile
app.get('/api/users/me', authenticateUser, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error("Profile Error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Update user profile
app.patch('/api/users/me', authenticateUser, async (req, res) => {
  try {
    const updates = req.body;
    delete updates.email; // Prevent email changes
    delete updates.password; // Prevent password changes via this route

    const user = await User.findByIdAndUpdate(
      req.userId,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    res.json(user);
  } catch (error) {
    console.error("Update Profile Error:", error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: "Server error" });
  }
});
// ========================
// Property Routes
// ========================
// Create property (Agent/Admin only)
app.post('/api/properties', authenticateUser, async (req, res) => {
  try {
    const { title, price, location, bedrooms, bathrooms, description } = req.body;
    
    const newProperty = new Property({
      title,
      price,
      location,
      bedrooms,
      bathrooms,
      description,
      postedBy: req.userId
    });

    await newProperty.save();
    res.status(201).json(newProperty);

  } catch (error) {
    console.error("Create Property Error:", error);
    res.status(500).json({ error: "Failed to create property" });
  }
});

// Get all properties
app.get('/api/properties', async (req, res) => {
  try {
    const properties = await Property.find().populate('postedBy', 'name email');
    res.json(properties);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch properties" });
  }
});

// Get single property
app.get('/api/properties/:id', async (req, res) => {
  try {
    const property = await Property.findById(req.params.id).populate('postedBy', 'name email');
    if (!property) return res.status(404).json({ error: "Property not found" });
    res.json(property);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch property" });
  }
});
// ========================
// 5. START SERVER
// ========================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});