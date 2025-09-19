import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true
    },
    notes: String
  }],
  totalAmount: {
    type: Number,
    required: true
  },
  deliveryAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String
  },
  paymentMethod: {
    type: String,
    enum: ['cod', 'upi', 'card'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  orderStatus: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'out-for-delivery', 'delivered', 'cancelled'],
    default: 'pending'
  },
  estimatedDeliveryTime: {
    type: Date
  },
  actualDeliveryTime: {
    type: Date
  },
  cancellationReason: String,

  // ⭐ New field for full order review
  orderReview: {
    rating: { type: Number, min: 1, max: 5 },
    comment: { type: String, trim: true },
    reviewedAt: Date
  },

  // ⭐ New field for Buy Now orders
  buyNow: {
    type: Boolean,
    default: false
  },

  // ⭐ New field to link to Payment model
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
  },

  // ⭐ Save payment transaction id (UPI_, CARD_, COD_)
  transactionId: {
    type: String
  },
  
  // ⭐ Refund requests (only added when user requests refund)
  refundDetails: {
    status: {
      type: String,
      enum: ['requested', 'approved', 'denied'],
      default: null// ❌ no default → field won’t exist until refund requested
    },
    amount: Number,
    reason: String,
    adminResponse: String,
    requestedAt: Date,
    approvedAt: Date,
    rejectedAt: Date
  }

}, {
  timestamps: true
});

export default mongoose.model('Order', orderSchema);
