import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: [true, "Email is required"],
    unique: true,
    trim: true,
    lowercase: true,
    match: [
      /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/, 
      "Invalid email format"
    ]
  },
  password: { 
    type: String, 
    required: [true, "Password is required"],
    minlength: [8, "Password must be at least 8 characters"],
    select: false
  },
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true
  },
  role: { 
    type: String, 
    enum: ['buyer', 'agent', 'admin'], 
    default: 'buyer' 
  },
  isVerified: { 
    type: Boolean, 
    default: false 
  },
  // Changed to match server.js implementation
  emailVerificationToken: { 
    type: String,
    select: false
  },
  emailVerificationExpires: Date,  // Added expiration field
  resetToken: {
    type: String,
    select: false
  },
  resetTokenExpiry: Date
}, { timestamps: true });

// Password hashing middleware
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

const User = mongoose.model('User', userSchema);
export default User;