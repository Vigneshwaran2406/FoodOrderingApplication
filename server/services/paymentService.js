import Payment from '../models/Payment.js';
import Order from '../models/Order.js';
import { v4 as uuidv4 } from 'uuid';

class PaymentService {
  // Dummy UPI Payment Processing
  static async processUPIPayment({ amount, upiId, upiApp, orderId, userId }) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    const isSuccess = Math.random() > 0.1;

    const payment = new Payment({
      order: orderId,
      user: userId,
      amount,
      method: 'upi',
      paymentGateway: 'dummy_upi',
      upiId,
      upiApp,
      status: isSuccess ? 'completed' : 'failed',
      gatewayTransactionId: `UPI_${uuidv4()}`,
      gatewayResponse: {
        success: isSuccess,
        message: isSuccess ? 'Payment successful' : 'Payment failed due to insufficient balance',
        timestamp: new Date(),
        upiRef: `UPI${Date.now()}`
      },
      processedAt: isSuccess ? new Date() : undefined,
      failureReason: isSuccess ? undefined : 'Insufficient balance or invalid UPI ID'
    });

    await payment.save();

    if (isSuccess) {
      await Order.findByIdAndUpdate(orderId, {
        paymentStatus: 'paid',
        paymentId: payment._id,
        transactionId: payment.gatewayTransactionId,
        orderStatus: 'confirmed'
      });
    }

    return {
      success: isSuccess,
      payment,
      message: isSuccess ? 'UPI payment successful' : 'UPI payment failed'
    };
  }

  // Dummy Card Payment Processing
  static async processCardPayment({ amount, cardNumber, expiryMonth, expiryYear, cvv, cardholderName, orderId, userId }) {
    await new Promise(resolve => setTimeout(resolve, 3000));
    const isValidCard = this.validateCard(cardNumber, expiryMonth, expiryYear, cvv);
    const isSuccess = isValidCard && Math.random() > 0.15;

    const last4 = cardNumber.slice(-4);
    const cardBrand = this.getCardBrand(cardNumber);

    const payment = new Payment({
      order: orderId,
      user: userId,
      amount,
      method: 'card',
      paymentGateway: 'dummy_card',
      cardDetails: { last4, brand: cardBrand, type: 'credit' },
      status: isSuccess ? 'completed' : 'failed',
      gatewayTransactionId: `CARD_${uuidv4()}`,
      gatewayResponse: {
        success: isSuccess,
        message: isSuccess ? 'Card payment successful' : 'Card payment declined',
        timestamp: new Date(),
        authCode: isSuccess ? `AUTH${Math.random().toString(36).substr(2, 6).toUpperCase()}` : undefined
      },
      processedAt: isSuccess ? new Date() : undefined,
      failureReason: isSuccess ? undefined : 'Card declined by bank'
    });

    await payment.save();

    if (isSuccess) {
      await Order.findByIdAndUpdate(orderId, {
        paymentStatus: 'paid',
        paymentId: payment._id,
        transactionId: payment.gatewayTransactionId,
        orderStatus: 'confirmed'
      });
    }

    return {
      success: isSuccess,
      payment,
      message: isSuccess ? 'Card payment successful' : 'Card payment failed'
    };
  }

  // COD Payment Processing
  static async processCODPayment({ amount, orderId, userId }) {
    const payment = new Payment({
      order: orderId,
      user: userId,
      amount,
      method: 'cod',
      paymentGateway: 'cod',
      status: 'pending',
      gatewayTransactionId: `COD_${uuidv4()}`,
      gatewayResponse: { message: 'Cash on Delivery - Payment pending', timestamp: new Date() }
    });

    await payment.save();

    await Order.findByIdAndUpdate(orderId, {
      paymentStatus: 'pending',
      paymentId: payment._id,
      transactionId: payment.gatewayTransactionId,
      orderStatus: 'confirmed'
    });

    return {
      success: true,
      payment,
      message: 'Order confirmed - Pay on delivery'
    };
  }

  // Refund Processing
  // paymentService.js
static async processRefund(payment, amount, reason = "User requested refund") {
  if (amount <= 0 || amount > payment.amount) {
    throw new Error("Invalid refund amount");
  }

  await new Promise(resolve => setTimeout(resolve, 2000));
  const isSuccess = Math.random() > 0.1;

  if (isSuccess) {
    payment.refundAmount = amount;
    payment.refundStatus = "completed";
    payment.status = "refunded";

    // ⭐ store refund log
    payment.refunds = payment.refunds || [];
    payment.refunds.push({
      amount,
      reason,
      refundedAt: new Date()
    });

    await payment.save();

    await Order.findByIdAndUpdate(payment.order, {
      paymentStatus: "refunded",
      orderStatus: "cancelled"
    });

    return { success: true, message: "Refund successful", payment };
  } else {
    payment.refundStatus = "failed";
    await payment.save();
    return { success: false, message: "Refund failed at gateway", payment };
  }
}

  // Helpers
  static validateCard(cardNumber, expiryMonth, expiryYear, cvv) {
    const clean = cardNumber.replace(/\s/g, '');
    if (clean.length < 13 || clean.length > 19) return false;
    const currentYear = new Date().getFullYear() % 100;
    const currentMonth = new Date().getMonth() + 1;
    if (
      parseInt(expiryYear) < currentYear ||
      (parseInt(expiryYear) === currentYear && parseInt(expiryMonth) < currentMonth)
    ) {
      return false;
    }
    if (cvv.length < 3 || cvv.length > 4) return false;
    return true;
  }

  static getCardBrand(cardNumber) {
    const clean = cardNumber.replace(/\s/g, '');
    if (clean.startsWith('4')) return 'Visa';
    if (clean.startsWith('5') || clean.startsWith('2')) return 'Mastercard';
    if (clean.startsWith('3')) return 'American Express';
    if (clean.startsWith('6')) return 'Discover';
    return 'Unknown';
  }
}

export default PaymentService;
