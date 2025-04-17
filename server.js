import 'dotenv/config'; 
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const app = express();

// ========================
// 1. DATABASE CONNECTION
// ========================
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/realty-db')
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error("MongoDB connection error:", err));
// ========================
// 2. USER SCHEMA/MODEL
// ========================
const userSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  password: String
});
const User = mongoose.model('User', userSchema); // ✅ Fixed missing closing )

// ========================
// 3. MIDDLEWARE
// ========================
app.use(cors({ origin: 'https://realtyestate.kesug.com' }));
app.use(express.json());

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

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = new User({ email, password: hashedPassword });
    await newUser.save();

    // Generate JWT token
    const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET);

    res.json({
      success: true,
      message: "User registered!",
      token // Send token to client
    });
  } catch (error) {
    if (error.code === 11000) { // MongoDB duplicate key error
      res.status(400).json({ error: "Email already exists" });
    } else {
      res.status(500).json({ error: "Registration failed" });
    }
  }
});

// 🔒 Login Endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);

    res.json({
      success: true,
      token // Send token to client
    });
  } catch (error) {
    res.status(500).json({ error: "Login failed" });
  }
});

// ========================
// 5. START SERVER
// ========================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});