import express from 'express';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Restaurant from '../models/Restaurant.js';
import Feedback from '../models/Feedback.js';
import nodemailer from "nodemailer";
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';
import Activity from '../models/Activity.js';

const router = express.Router();

// ✅ Apply middleware to all admin routes
router.use(authMiddleware);
router.use(adminMiddleware);

// =================== DASHBOARD ANALYTICS ===================
router.get('/analytics', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalOrders = await Order.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalRestaurants = await Restaurant.countDocuments();
    const totalFeedbacks = await Feedback.countDocuments();

    const totalRevenue = await Order.aggregate([
      { $match: { orderStatus: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const monthlyOrders = await Order.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0); // start of today
    const ordersToday = await Order.countDocuments({
      createdAt: { $gte: today }
    });

    // Popular products
    const popularProducts = await Product.find()
      .sort({ totalOrders: -1 })
      .limit(5)
      .select('name totalOrders averageRating');

    // Recent orders
    const recentOrders = await Order.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      stats: {
        totalUsers,
        totalOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        monthlyOrders,
        ordersToday,
        totalProducts,
        totalRestaurants,
        totalFeedbacks,
      },
      popularProducts,
      recentOrders
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// =================== RECENT ACTIVITY ===================
router.get("/recent-activity", async (req, res) => {
  try {
    const activities = await Activity.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .limit(20);

    res.json(activities);
  } catch (error) {
    console.error("Get activities error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// =================== USER MANAGEMENT ===================
router.get('/users', async (req, res) => {
  try {
    const { role } = req.query;
    let query = {};

    if (role === "user") query.role = "user";
    else if (role === "admin") query.role = "admin";

    const users = await User.find().sort({ updatedAt: -1 }); 
    res.json(users);
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});



router.get("/users/:id/details", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Fetch orders placed by this user
    const orders = await Order.find({ user: req.params.id })
      .populate("items.product", "name price image")
      .sort({ createdAt: -1 });

    // Fetch feedbacks given by this user
    const feedbacks = await Feedback.find({ user: req.params.id })
      .populate("restaurant", "name")
      .populate("order", "_id orderStatus")
      .sort({ createdAt: -1 });

    // Fetch favorites (products)
    const favorites = await User.findById(req.params.id)
      .populate("favorites", "name price image restaurant")
      .select("favorites");

    // ✅ Fetch recent activities for this user
    const activities = await Activity.find({ user: req.params.id })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({
      user,
      orders,
      feedbacks,
      favorites: favorites?.favorites || [],
      lastLogin: user.lastLogin,
      lastLogout: user.lastLogout,
      activities,
    });
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});
// Admin responds to a message
router.post("/:id/respond", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const { text } = req.body;
    const contact = await Contact.findById(req.params.id).populate("user");

    if (!contact) return res.status(404).json({ message: "Message not found" });

    contact.response = { text, respondedAt: new Date() };
    contact.status = "responded";

    // Case 1: User is registered + active → in-app
    if (contact.user && contact.user.isActive) {
      contact.deliveredTo = "in-app";
    } else {
      // Case 2: Guest OR inactive user → email response
      contact.deliveredTo = "email";

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: `"Picasso Support" <${process.env.SMTP_USER}>`,
        to: contact.email,
        subject: `Response to your message: ${contact.subject}`,
        text: text,
      });
    }

    await contact.save();
    res.json({ success: true, contact });

  } catch (error) {
    console.error("Respond error:", error);
    res.status(500).json({ message: "Failed to respond" });
  }
});

router.post('/users', async (req, res) => {
  try {
    const { name, email, password, phone, address, role = 'user' } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = new User({ name, email, password, phone, address, role });
    await user.save();

    const userResponse = await User.findById(user._id).select('-password');
    res.status(201).json({
      message: 'User created successfully',
      user: userResponse
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/users/:id', async (req, res) => {
  try {
    const { name, phone, address, role } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, phone, address, role },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User updated successfully', user });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Cannot delete admin user' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/users/:id/toggle-status', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({ message: 'User status updated successfully' });
  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// =================== PRODUCT MANAGEMENT ===================
router.get('/products', async (req, res) => {
  try {
    const products = await Product.find()
      .populate('restaurant', 'name')
      .sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/products', async (req, res) => {
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
    console.error('Create product error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/products/:id', async (req, res) => {
  try {
    const oldProduct = await Product.findById(req.params.id).lean();
    if (!oldProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('restaurant', 'name');

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // ✅ Detect updated fields
    const updatedFields = [];
    for (const key of Object.keys(req.body)) {
      if (JSON.stringify(req.body[key]) !== JSON.stringify(oldProduct[key])) {
        updatedFields.push(key);
      }
    }

    // ✅ Log activity
    await Activity.create({
      user: req.user.userId,
      action: "updated menu item",
      details: {
        productId: product._id,
        name: product.name,
        restaurant: product.restaurant?.name || "Unknown",
        updatedFields
      }
    });

    res.json({ message: 'Product updated successfully', product });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.delete('/products/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id).populate("restaurant", "name");
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

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
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// =================== ORDER MANAGEMENT ===================
// New GET route to fetch all orders including refund details
router.get('/orders', async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('user', 'name email phone')
      .populate('items.product', 'name image')
      .populate('refundDetails'); // ✅ This line is the key fix

    res.status(200).json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/orders/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email phone address')
      .populate({
        path: 'items.product',
        select: 'name price image category',
        populate: {
          path: 'restaurant',
          select: 'name'
        }
      })
      .populate('refundDetails'); // ✅ Added this populate call

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Get order details error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
// =================== REFUND MANAGEMENT ===================
// PUT /api/admin/orders/:id/refund - Process a refund request
// ✅ Admin Route to fetch refund requests
router.get('/admin/refund-requests', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    // Fetch only orders where refund is requested
    const refundRequests = await Order.find({ 'refundDetails.status': 'requested' })
      .populate('user', 'name email')
      .populate('items.product', 'name image price')
      .populate('paymentId', 'amount method refundStatus');

    res.json(refundRequests);
  } catch (error) {
    console.error('Error fetching refund requests:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ Admin Route to approve/reject refund
router.put('/admin/orders/:id/refund', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { refundStatus, rejectionReason } = req.body;
    const order = await Order.findById(req.params.id).populate('paymentId');

    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.refundDetails?.status !== 'requested') {
      return res.status(400).json({ message: 'Refund is not in requested state' });
    }

    if (refundStatus === 'approved') {
      // Process payment refund
      order.paymentId.refundStatus = 'approved';
      order.paymentId.status = 'refunded';
      order.paymentId.refundAmount = order.totalAmount;
      await order.paymentId.save();

      order.refundDetails.status = 'approved';
      order.refundDetails.approvedAt = new Date();
    } else if (refundStatus === 'denied') {
      order.refundDetails.status = 'denied';
      order.refundDetails.rejectedAt = new Date();
      order.refundDetails.reason = rejectionReason || "No reason provided";
    }

    await order.save();
    res.json({ message: `Refund ${refundStatus}`, order });
  } catch (error) {
    console.error('Refund update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


// =================== ORDER STATUS UPDATE ===================
router.put('/orders/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id).populate("items.product", "name");

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const previousStatus = order.orderStatus;
    order.orderStatus = status;
    if (status === 'delivered') {
      order.actualDeliveryTime = new Date();
    }

    await order.save();

    // Log admin order status change + product names
    await Activity.create({
      user: req.user.userId,
      action: 'updated order status',
      details: {
        orderId: order._id,
        previousStatus,
        newStatus: status,
        total: order.totalAmount,
        products: order.items.map(item => ({
          name: item.product?.name,
          qty: item.quantity
        }))
      }
    });

    res.json({ message: 'Order status updated successfully' });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// =================== RESTAURANT MANAGEMENT ===================
router.get('/restaurants', async (req, res) => {
  try {
    const restaurants = await Restaurant.find().sort({ createdAt: -1 });
    res.json(restaurants);
  } catch (error) {
    console.error('Get restaurants error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/restaurants', async (req, res) => {
  try {
    const restaurant = new Restaurant(req.body);
    await restaurant.save();

    // ✅ Log activity
    await Activity.create({
      user: req.user.userId,
      action: 'created restaurant',
      details: {
        restaurantId: restaurant._id,
        name: restaurant.name
      }
    });

    res.status(201).json({ message: 'Restaurant created successfully', restaurant });
  } catch (error) {
    console.error('Create restaurant error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/restaurants/:id', async (req, res) => {
  try {
    // Fetch current restaurant for comparison
    const oldRestaurant = await Restaurant.findById(req.params.id).lean();
    if (!oldRestaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    // Update restaurant with new data
    const restaurant = await Restaurant.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    // Track updated fields
    const updatedFields = [];

    for (const key of Object.keys(req.body)) {
      if (typeof req.body[key] === "object" && req.body[key] !== null) {
        // 🔹 Handle nested objects (like address)
        for (const subKey of Object.keys(req.body[key])) {
          if (
            JSON.stringify(oldRestaurant[key]?.[subKey]) !==
            JSON.stringify(req.body[key][subKey])
          ) {
            updatedFields.push(subKey);
          }
        }
      } else {
        if (JSON.stringify(oldRestaurant[key]) !== JSON.stringify(req.body[key])) {
          updatedFields.push(key);
        }
      }
    }

    // ✅ Log activity
    await Activity.create({
      user: req.user.userId,
      action: "updated restaurant",
      details: {
        restaurantId: restaurant._id,
        name: restaurant.name,
        updatedFields: updatedFields.length > 0 ? updatedFields : ["(no fields changed)"]
      }
    });

    res.json({ message: 'Restaurant updated successfully', restaurant });
  } catch (error) {
    console.error('Update restaurant error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});



router.delete('/restaurants/:id', async (req, res) => {
  try {
    const restaurant = await Restaurant.findByIdAndDelete(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    // ✅ Log activity
    await Activity.create({
      user: req.user.userId,
      action: `deleted restaurant`,
      details: {
        restaurantId: restaurant._id,
        name: restaurant.name
      }
    });

    res.json({ message: 'Restaurant deleted successfully' });
  } catch (error) {
    console.error('Delete restaurant error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// =================== FEEDBACK MANAGEMENT ===================
router.get('/feedback', async (req, res) => {
  try {
    const { status, type, priority } = req.query;
    let query = {};

    if (status) query.status = status;
    if (type) query.type = type;
    if (priority) query.priority = priority;

    const feedback = await Feedback.find(query)
      .populate('user', 'name email')
      .populate('restaurant', 'name')
      .populate('order')
      .populate('adminResponse.respondedBy', 'name')
      .sort({ createdAt: -1 });

    res.json(feedback);
  } catch (error) {
    console.error('Get feedback error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/feedback/:id/respond', async (req, res) => {
  try {
    const { message, status } = req.body;
    const feedback = await Feedback.findById(req.params.id);

    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    feedback.adminResponse = {
      message,
      respondedBy: req.user.userId,
      respondedAt: new Date()
    };
    feedback.status = status || 'in-progress';

    await feedback.save();
    res.json({ message: 'Response added successfully' });
  } catch (error) {
    console.error('Respond to feedback error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/feedback/:id/status', async (req, res) => {
  try {
    const { status, priority } = req.body;
    const feedback = await Feedback.findById(req.params.id);

    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    if (status) feedback.status = status;
    if (priority) feedback.priority = priority;

    await feedback.save();
    res.json({ message: 'Feedback updated successfully' });
  } catch (error) {
    console.error('Update feedback status error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;