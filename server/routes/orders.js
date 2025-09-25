import express from 'express';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Payment from '../models/Payment.js';
import PaymentService from '../services/paymentService.js';
import { authMiddleware } from '../middleware/auth.js';
import Activity from "../models/Activity.js";
import User from '../models/User.js';

const router = express.Router();

/**
 * Create new order
 */
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { items, deliveryAddress, paymentMethod, buyNow, transactionId } = req.body;

    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(400).json({ message: `Product ${item.product} not found` });
      }
      if (!product.isAvailable) {
        return res.status(400).json({ message: `Product ${product.name} is not available` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${product.name}` });
      }

      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;

      orderItems.push({
        product: product._id,
        quantity: item.quantity,
        price: product.price,
        notes: item.notes || ''
      });

      product.stock -= item.quantity;
      product.totalOrders = (product.totalOrders || 0) + item.quantity;
      await product.save();
    }

    // ✅ Create order ONCE
    const order = new Order({
      user: req.user.userId,
      items: orderItems,
      totalAmount,
      deliveryAddress,
      paymentMethod,
      buyNow: buyNow || false,
      transactionId: transactionId || null,
      estimatedDeliveryTime: new Date(Date.now() + 45 * 60 * 1000)
    });

    await order.save();

    // ✅ Process payment without duplicating order
    let paymentResult;
    if (paymentMethod === "upi") {
      paymentResult = await PaymentService.processUPIPayment({
        amount: totalAmount,
        upiId: "dummy@upi",
        upiApp: "gpay",
        orderId: order._id,
        userId: req.user.userId
      });
    } else if (paymentMethod === "card") {
      paymentResult = await PaymentService.processCardPayment({
        amount: totalAmount,
        cardNumber: "4111111111111111",
        expiryMonth: "12",
        expiryYear: "30",
        cvv: "123",
        cardholderName: "Test User",
        orderId: order._id,
        userId: req.user.userId
      });
    } else {
      paymentResult = await PaymentService.processCODPayment({
        amount: totalAmount,
        orderId: order._id,
        userId: req.user.userId
      });
    }

    if (paymentResult?.payment) {
      order.transactionId = paymentResult.payment.gatewayTransactionId;
      order.paymentId = paymentResult.payment._id;
      await order.save(); // ✅ update same order
    }

    await order.populate('items.product user');

    const products = order.items.map(item => ({
      name: item.product?.name || "Unknown",
      qty: item.quantity
    }));

    await Activity.create({
      user: req.user.userId,
      action: buyNow ? "placed a buy now order" : "placed an order",
      details: {
        orderId: order._id,
        total: order.totalAmount,
        newStatus: order.orderStatus,
        products
      }
    });

    res.status(201).json(order);
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/:id/request-refund', authMiddleware, async (req, res) => {
  try {
    const { reason } = req.body;
    const orderId = req.params.id;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.user.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not your order' });
    }

    // ✅ Allow request only if no refund already requested
    if (order.refundDetails && order.refundDetails.status && order.refundDetails.status !== 'denied') {
      return res.status(400).json({ message: 'A refund has already been requested or processed for this order' });
    }

    order.refundDetails = {
      status: 'requested',
      reason: reason,
      requestedAt: new Date(),
    };

    await order.save();

    res.json({ message: 'Refund request submitted successfully' });
  } catch (error) {
    console.error('Refund request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/:id/review', authMiddleware, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (order.user.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not your order' });
    }

    if (order.orderStatus !== 'delivered') {
      return res.status(400).json({ message: 'Can only review delivered orders' });
    }

    if (order.orderReview?.rating) {
      return res.status(400).json({ message: 'You already reviewed this order' });
    }

    order.orderReview = {
      rating,
      comment,
      reviewedAt: new Date()
    };

    await order.save();

    await Activity.create({
      user: req.user.userId,
      action: "reviewed an order",
      details: { orderId: order._id, rating, comment }
    });

    res.status(201).json({ message: 'Order review submitted successfully', order });
  } catch (error) {
    console.error('Order review error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/my-orders', authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.userId })
      .populate('items.product', 'name image')
      .populate('paymentId', 'status refundStatus refundAmount gatewayTransactionId')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    console.error("Error fetching orders:", err);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.product')
      .populate('user', 'name email phone')
      .populate('paymentId');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.user._id.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(order);
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get("/users/:id/details", async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const orders = await Order.find({ user: userId })
      .populate("items.product")
      .populate("paymentId")
      .sort({ createdAt: -1 });

    const feedbacks = await Feedback.find({ user: userId })
      .populate("restaurant", "name")
      .populate("order")
      .sort({ createdAt: -1 });

    const activities = await Activity.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({
      user,
      orders,
      feedbacks,
      favorites: user.favorites || [],
      lastLogin: user.lastLogin,
      lastLogout: user.lastLogout,
      activities,
    });
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.put('/:id/cancel', authMiddleware, async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.user.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (['delivered', 'cancelled'].includes(order.orderStatus)) {
      return res.status(400).json({ message: 'Cannot cancel this order' });
    }

    order.orderStatus = 'cancelled';
    order.cancellationReason = reason;

    // ✅ Do NOT auto-set refundDetails here
    await order.save();

    await Activity.create({
      user: req.user.userId,
      action: "cancelled an order",
      details: {
        orderId: order._id,
        reason,
        total: order.totalAmount
      }
    });

    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (product) {
        product.stock += item.quantity;
        await product.save();
      }
    }

    res.json({ message: 'Order cancelled successfully' });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

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

    const products = order.items.map(item => ({
      name: item.product?.name || "Unknown",
      qty: item.quantity
    }));

    await Activity.create({
      user: req.user.userId,
      action: 'updated order status',
      details: {
        orderId: order._id,
        previousStatus,
        newStatus: status,
        total: order.totalAmount,
        products
      }
    });

    res.json({ message: 'Order status updated successfully' });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ✅ Admin Route to fetch refund requests
router.get('/admin/refund-requests', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const refundRequests = await Order.find({ 'refundDetails.status': 'requested' })
      .populate('user', 'name email phone')
      .populate('items.product', 'name');

    res.json(refundRequests);
  } catch (error) {
    console.error('Error fetching refund requests:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ✅ Admin Route to approve/reject refund
// ✅ Admin Route to approve/deny refund
router.put('/admin/orders/:id/update-refund', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    // ⬇️ FIX: use "status" instead of "refundStatus"
    const { status, rejectionReason } = req.body;
    const order = await Order.findById(req.params.id).populate('paymentId');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.refundDetails?.status !== 'requested') {
      return res.status(400).json({ message: 'Refund is not in a requested state' });
    }

    if (status === 'approved') {
      // ✅ Approve refund
      order.refundDetails.status = 'approved';
      order.refundDetails.approvedAt = new Date();

      if (order.paymentId) {
        order.paymentId.refundStatus = 'completed';
        order.paymentId.refundAmount = order.totalAmount;
        await order.paymentId.save();
      }

      await Activity.create({
        user: req.user.userId,
        action: "approved a refund request",
        details: { orderId: order._id, amount: order.totalAmount }
      });

    } else if (status === 'denied') {
      // ✅ Deny refund
      order.refundDetails.status = 'denied';
      order.refundDetails.rejectionReason = rejectionReason || "No reason provided";
      order.refundDetails.rejectedAt = new Date();

      await Activity.create({
        user: req.user.userId,
        action: "denied a refund request",
        details: { orderId: order._id, reason: rejectionReason }
      });

    } else {
      return res.status(400).json({ message: 'Invalid refund status provided' });
    }

    await order.save();
    res.json({ message: `Refund request ${status} successfully` });
  } catch (error) {
    console.error('Update refund status error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;