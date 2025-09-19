import express from 'express';
import Restaurant from '../models/Restaurant.js';
import Product from '../models/Product.js';
import Activity from '../models/Activity.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get all restaurants
router.get('/', async (req, res) => {
  try {
    const {
      search,
      cuisine,
      minRating,
      featured,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 12
    } = req.query;

    let query = { isActive: true };

    // Apply filters
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { cuisine: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    if (cuisine) query.cuisine = { $in: [cuisine] };
    if (minRating) query.averageRating = { $gte: Number(minRating) };
    if (featured === 'true') query.featured = true;

    // Sorting
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const restaurants = await Restaurant.find(query)
      .sort(sortOptions)
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Restaurant.countDocuments(query);

    res.json({
      restaurants,
      pagination: {
        current: Number(page),
        total: Math.ceil(total / Number(limit)),
        count: total
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get restaurant by ID with menu
router.get('/:id', async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id).populate('ratings.user', 'name');
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    // Get restaurant's menu
    const menu = await Product.find({ restaurant: req.params.id, isAvailable: true })
      .populate('ratings.user', 'name')
      .sort({ category: 1, name: 1 });

    res.json({ restaurant, menu });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get restaurant menu with filters
router.get('/:id/menu', async (req, res) => {
  try {
    const {
      category,
      search,
      minPrice,
      maxPrice,
      isVegetarian,
      isVegan,
      isGlutenFree,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    let query = { restaurant: req.params.id, isAvailable: true };

    // Apply filters
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    if (isVegetarian === 'true') query.isVegetarian = true;
    if (isVegan === 'true') query.isVegan = true;
    if (isGlutenFree === 'true') query.isGlutenFree = true;

    // Sorting
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const menu = await Product.find(query)
      .populate('restaurant', 'name deliveryTime deliveryFee')
      .populate('ratings.user', 'name')
      .sort(sortOptions);

    res.json(menu);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add rating to restaurant
router.post('/:id/rating', authMiddleware, async (req, res) => {
  try {
    const { rating, review } = req.body;
    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    // Check if user already rated this restaurant
    const existingRatingIndex = restaurant.ratings.findIndex(
      r => r.user.toString() === req.user.userId
    );

    if (existingRatingIndex > -1) {
      // Update existing rating
      restaurant.ratings[existingRatingIndex] = {
        user: req.user.userId,
        rating,
        review,
        createdAt: new Date()
      };
    } else {
      // Add new rating
      restaurant.ratings.push({
        user: req.user.userId,
        rating,
        review
      });
    }

    restaurant.averageRating = restaurant.calculateAverageRating();
    await restaurant.save();

    res.json({ message: 'Rating added successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

/* -----------------------------
   ADMIN: Add, Update, Delete Restaurant
-------------------------------- */

// Create new restaurant
router.post('/', authMiddleware, async (req, res) => {
  try {
    const restaurant = new Restaurant(req.body);
    await restaurant.save();

    // Log activity
    await Activity.create({
      user: req.user.userId,
      action: 'created a restaurant',
      details: { restaurantId: restaurant._id, name: restaurant.name }
    });

    res.status(201).json(restaurant);
  } catch (err) {
    res.status(500).json({ message: 'Error creating restaurant', error: err.message });
  }
});

// Update restaurant
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const oldRestaurant = await Restaurant.findById(req.params.id);
    if (!oldRestaurant) return res.status(404).json({ message: 'Restaurant not found' });

    const updatedRestaurant = await Restaurant.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    // Detect changes with old → new values
    const changes = [];
    for (const key in req.body) {
      if (req.body[key] !== oldRestaurant[key]) {
        changes.push(`${key}: "${oldRestaurant[key]}" → "${req.body[key]}"`);
      }
    }

    // Log update
    await Activity.create({
      user: req.user.userId,
      action: 'updated a restaurant',
      details: {
        restaurantId: updatedRestaurant._id,
        name: updatedRestaurant.name,
        updatedFields: changes
      }
    });

    res.json(updatedRestaurant);
  } catch (err) {
    res.status(500).json({ message: 'Error updating restaurant', error: err.message });
  }
});

// Delete restaurant
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });

    await restaurant.deleteOne();

    // Log deletion
    await Activity.create({
      user: req.user.userId,
      action: 'deleted a restaurant',
      details: { restaurantId: restaurant._id, name: restaurant.name }
    });

    res.json({ message: 'Restaurant deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting restaurant', error: err.message });
  }
});

export default router;
