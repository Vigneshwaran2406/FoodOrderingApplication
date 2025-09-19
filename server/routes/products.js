import express from 'express';
import Product from '../models/Product.js';
import { authMiddleware } from '../middleware/auth.js';
import Activity from '../models/Activity.js'; // ✅ add activity logging
import Restaurant from '../models/Restaurant.js';

const router = express.Router();

// Get all products with filtering and sorting
router.get('/', async (req, res) => {
  try {
    const {
      restaurant,
      category,
      search,
      minPrice,
      maxPrice,
      isVegetarian,
      isVegan,
      isGlutenFree,
      isSpicy,
      featured,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 12
    } = req.query;

    let query = { isAvailable: true };

    // Apply filters
    if (restaurant) query.restaurant = restaurant;
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
    if (isSpicy === 'true') query.isSpicy = true;
    if (featured === 'true') query.featured = true;

    // Sorting
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const products = await Product.find(query)
      .populate('restaurant', 'name deliveryTime deliveryFee averageRating')
      .sort(sortOptions)
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Product.countDocuments(query);

    res.json({
      products,
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

// Get product by ID
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('restaurant', 'name address phone deliveryTime deliveryFee averageRating')
      .populate('ratings.user', 'name');
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add rating to product
router.post('/:id/rating', authMiddleware, async (req, res) => {
  try {
    const { rating, review } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if user already rated this product
    const existingRatingIndex = product.ratings.findIndex(
      r => r.user.toString() === req.user.userId
    );

    if (existingRatingIndex > -1) {
      // Update existing rating
      product.ratings[existingRatingIndex] = {
        user: req.user.userId,
        rating,
        review
      };
    } else {
      // Add new rating
      product.ratings.push({
        user: req.user.userId,
        rating,
        review
      });
    }

    product.averageRating = product.calculateAverageRating();
    await product.save();

    res.json({ message: 'Rating added successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

/* ===========================
   ADMIN: Manage Menu Items
=========================== */

// Create product (menu item)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    await product.populate('restaurant', 'name');

    // ✅ Log activity
    await Activity.create({
      user: req.user.userId,
      action: "created menu item",
      details: {
        productId: product._id,
        name: product.name,
        price: product.price,
        restaurant: product.restaurant?.name || "Unknown"
      }
    });

    res.status(201).json({ message: 'Product created successfully', product });
  } catch (error) {
    res.status(500).json({ message: 'Error creating product', error: error.message });
  }
});

// Update product (menu item)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const oldProduct = await Product.findById(req.params.id).lean();
    if (!oldProduct) return res.status(404).json({ message: 'Product not found' });

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!product) return res.status(404).json({ message: 'Product not found' });

    await product.populate('restaurant', 'name');

    // Find updated fields
    const updatedFields = [];
    for (const key of Object.keys(req.body)) {
      if (JSON.stringify(req.body[key]) !== JSON.stringify(oldProduct[key])) {
        updatedFields.push(key);
      }
    }

    const payload = {
      user: req.user.userId,
      action: "updated menu item",
      details: {
        productId: product._id.toString(),
        name: product.name || "Unnamed",
        restaurant: product.restaurant?.name || "Unknown",
        updatedFields: updatedFields.length > 0 ? updatedFields : ["(no changes detected)"]
      }
    };

    console.log("✅ Saving Activity:", payload); // 👈 must show up in console

    await Activity.create(payload);

    res.json({ message: 'Product updated successfully', product });
  } catch (error) {
    res.status(500).json({ message: 'Error updating product', error: error.message });
  }
});


// Delete product (menu item)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate("restaurant", "name");
    if (!product) return res.status(404).json({ message: 'Product not found' });

    await product.deleteOne();

    // ✅ Log activity
    await Activity.create({
      user: req.user.userId,
      action: "deleted menu item",
      details: {
        productId: product._id,
        name: product.name,
        restaurant: product.restaurant?.name || "Unknown"
      }
    });

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting product', error: error.message });
  }
});

export default router;
