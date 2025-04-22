import mongoose from 'mongoose';

const propertySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Title is required"],
    trim: true,
    maxlength: [100, "Title cannot exceed 100 characters"]
  },
  price: {
    type: Number,
    required: [true, "Price is required"],
    min: [1, "Price must be at least 1"]
  },
  location: {
    type: String,
    required: [true, "Location is required"],
    trim: true
  },
  bedrooms: {
    type: Number,
    min: [0, "Bedrooms cannot be negative"]
  },
  bathrooms: {
    type: Number,
    min: [0, "Bathrooms cannot be negative"]
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, "Description cannot exceed 1000 characters"]
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  images: [String],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Property = mongoose.model('Property', propertySchema);
export default Property;