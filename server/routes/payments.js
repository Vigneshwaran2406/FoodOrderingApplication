import express from 'express';
import { body, validationResult } from 'express-validator';
import Payment from '../models/Payment.js';
import PaymentService from '../services/paymentService.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// ====================== PAYMENT CREATION ====================== //

// Process UPI
router.post('/upi', authMiddleware, [
  body('amount').isFloat({ min: 1 }),
  body('upiId').matches(/^[\w.-]+@[\w.-]+$/),
  body('upiApp').isIn(['gpay', 'phonepe', 'paytm', 'bhim', 'other']),
  body('orderId').isMongoId()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: 'Validation failed', errors: errors.array() });

  const { amount, upiId, upiApp, orderId } = req.body;
  try {
    const result = await PaymentService.processUPIPayment({ amount, upiId, upiApp, orderId, userId: req.user.userId });
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Process Card
router.post('/card', authMiddleware, [
  body('amount').isFloat({ min: 1 }),
  body('cardNumber').isLength({ min: 13, max: 19 }),
  body('expiryMonth').isInt({ min: 1, max: 12 }),
  body('expiryYear').isInt({ min: 0, max: 99 }),
  body('cvv').isLength({ min: 3, max: 4 }),
  body('cardholderName').notEmpty(),
  body('orderId').isMongoId()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: 'Validation failed', errors: errors.array() });

  const { amount, cardNumber, expiryMonth, expiryYear, cvv, cardholderName, orderId } = req.body;
  try {
    const result = await PaymentService.processCardPayment({
      amount, cardNumber, expiryMonth, expiryYear, cvv, cardholderName, orderId, userId: req.user.userId
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// COD
router.post('/cod', authMiddleware, [
  body('amount').isFloat({ min: 1 }),
  body('orderId').isMongoId()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: 'Validation failed', errors: errors.array() });

  const { amount, orderId } = req.body;
  try {
    const result = await PaymentService.processCODPayment({ amount, orderId, userId: req.user.userId });
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ====================== FETCH PAYMENTS ====================== //

// Get single payment
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('order', 'orderNumber totalAmount')
      .populate('user', 'fullName email');

    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    if (payment.user._id.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    res.json(payment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ====================== REFUND FLOW ====================== //

// Refund request (user → admin review)
router.post('/:transactionId/refund', authMiddleware, async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { amount } = req.body;

    const payment = await Payment.findOne({ gatewayTransactionId: transactionId });
    if (!payment) {
      return res.status(404).json({ success: false, message: "No payment record found for this transaction" });
    }

    if (payment.user.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    if (payment.status !== "completed") {
      return res.status(400).json({ success: false, message: "Only completed payments can be refunded" });
    }

    // Mark as refund requested
    payment.refundAmount = amount;
    payment.refundStatus = "requested";
    await payment.save();

    return res.json({
      success: true,
      message: "Refund request submitted. Awaiting admin approval.",
      refund: {
        transactionId,
        amount,
        status: payment.refundStatus,
      }
    });

  } catch (error) {
    console.error("Refund request error:", error);
    res.status(500).json({ success: false, message: "Refund request failed", error: error.message });
  }
});

// Admin: Get all refunds (requested, approved, denied)
router.get('/admin/refunds', authMiddleware, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied" });
  }

  try {
    const { status } = req.query; // ?status=requested
    const filter = status ? { refundStatus: status } : { refundStatus: { $in: ["requested", "approved", "denied"] } };

    const refunds = await Payment.find(filter)
      .populate("user", "fullName email")
      .populate("order", "orderNumber totalAmount createdAt");
    const order = await Order.findById(payment.order);
    if (order) {
      order.refundDetails = {
      status: "pending",
      reason: req.body.reason || "User requested refund",
      requestedAt: new Date()
      };
      await order.save();
    }

    res.json(refunds);
  } catch (err) {
    console.error("Error fetching refunds:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Admin approves refund
router.put('/:transactionId/refund/approve', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: "Only admin can approve refunds" });
    }

    const { transactionId } = req.params;
    const payment = await Payment.findOne({ gatewayTransactionId: transactionId });
    if (!payment) return res.status(404).json({ success: false, message: "Payment not found" });

    payment.status = "refunded";
    payment.refundStatus = "approved";
    await payment.save();
    const order = await Order.findById(payment.order);
    if (order) {
      order.refundDetails.status = refundStatus === "approved" ? "approved" : "denied";
      order.refundDetails.respondedAt = new Date();
      await order.save();
    }

    return res.json({ success: true, message: "Refund approved and processed", payment });
  } catch (error) {
    console.error("Admin refund approval error:", error);
    res.status(500).json({ success: false, message: "Refund approval failed" });
    }
});

// Admin rejects refund
router.put('/:transactionId/refund/reject', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: "Only admin can reject refunds" });
    }

    const { transactionId } = req.params;
    const payment = await Payment.findOne({ gatewayTransactionId: transactionId });
    if (!payment) return res.status(404).json({ success: false, message: "Payment not found" });

    payment.refundStatus = "denied";
    await payment.save();

    return res.json({ success: true, message: "Refund request rejected", payment });
  } catch (error) {
    console.error("Admin refund rejection error:", error);
    res.status(500).json({ success: false, message: "Refund rejection failed" });
  }
});

// ====================== USER'S PAYMENTS ====================== //

router.get('/my/payments', authMiddleware, async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  let filter = { user: req.user.userId };
  if (status) filter.status = status;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const payments = await Payment.find(filter)
    .populate('order', 'orderNumber totalAmount')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Payment.countDocuments(filter);

  res.json({
    payments,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      totalPayments: total
    }
  });
});

export default router;
