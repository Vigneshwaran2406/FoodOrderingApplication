import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.ObjectId,
    ref: 'Order',
    required: true
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: [0, 'Amount cannot be negative']
  },
  method: {
    type: String,
    enum: ['upi', 'card', 'cod'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'], // ✅ payment lifecycle
    default: 'pending'
  },
  transactionId: {
    type: String,
    unique: true,
    sparse: true
  },
  paymentGateway: {
    type: String,
    enum: ['razorpay', 'stripe', 'dummy_upi', 'dummy_card', 'cod']
  },
  gatewayTransactionId: String,
  gatewayResponse: mongoose.Schema.Types.Mixed,
  // UPI specific fields
  upiId: String,
  upiApp: {
    type: String,
    enum: ['gpay', 'phonepe', 'paytm', 'bhim', 'other']
  },
  // Card specific fields
  cardDetails: {
    last4: String,
    brand: String,
    type: String
  },
  failureReason: String,
  processedAt: Date,
  refundAmount: Number,

  // ⭐ Unified refund statuses with Order model
  refundStatus: {
    type: String,
    enum: ["requested",'completed', "approved", "denied"],
    default: "requested"
  },
  refunds: [{
    amount: Number,
    reason: String,
    refundedAt: Date
  }]
}, { timestamps: true });

// Generate unique transaction ID
paymentSchema.pre('save', function(next) {
  if (!this.transactionId) {
    this.transactionId = `TXN${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }
  next();
});

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;
