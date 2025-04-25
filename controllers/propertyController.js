import Property from '../models/Property.js';

// Create Property
export const createProperty = async (req, res) => {
  try {
    const images = req.files?.map(file => file.path) || [];
    if (!images.length) throw new Error('At least one image is required');

    const property = await Property.create({
      ...req.body,
      listedBy: req.user._id
    });
    
    res.status(201).json({
      success: true,
      data: property
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Get All Properties with Filters
export const getProperties = async (req, res) => {
  try {
    const { minPrice, maxPrice, bedrooms, location } = req.query;
    const query = {};

    if (minPrice) query.price = { $gte: Number(minPrice) };
    if (maxPrice) query.price = { ...query.price, $lte: Number(maxPrice) };
    if (bedrooms) query.bedrooms = { $gte: Number(bedrooms) };
    if (location) query.location = location;

    const properties = await Property.find(query)
      .populate('listedBy', 'name email')
      .sort('-createdAt');

    res.json({
      success: true,
      count: properties.length,
      data: properties
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// Get Single Property
export const getPropertyById = async (req, res) => {
  try {
      const property = await Property.findById(req.params.id)
      .populate('listedBy', 'name email phone');
      
    if (!property) {
      return res.status(404).json({
        success: false,
        error: 'Property not found'
      });
    }
    
    res.json({
      success: true,
      data: property
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// Update Property
export const updateProperty = async (req, res) => {
  try {
    const property = await Property.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!property) {
      return res.status(404).json({
        success: false,
        error: 'Property not found'
      });
    }

    res.json({
      success: true,
      data: property
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Delete Property
export const deleteProperty = async (req, res) => {
  try {
    const property = await Property.findByIdAndDelete(req.params.id);

    if (!property) {
      return res.status(404).json({
        success: false,
        error: 'Property not found'
      });
    }

    res.json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};