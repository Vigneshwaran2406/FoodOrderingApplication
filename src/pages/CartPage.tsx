import React, { useState, useEffect, useRef } from 'react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';

const arraysEqual = (a: string[] = [], b: string[] = []) => {
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  const aa = [...a].sort().join(',');
  const bb = [...b].sort().join(',');
  return aa === bb;
};

const CartPage: React.FC = () => {
  const { items, updateQuantity, removeFromCart, clearCart, getTotalAmount } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const buyNowProduct = (location.state as any)?.buyNowProduct || null;

  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState({
    paymentMethod: 'cod',
    deliveryAddress: {
      street: '',
      city: '',
      state: '',
      zipCode: ''
    }
  });

  const [step, setStep] = useState<'review' | 'payment'>('review');
  const [createdOrder, setCreatedOrder] = useState<any>(null);

  const [paymentForm, setPaymentForm] = useState({
    upiId: '',
    upiApp: 'gpay',
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    cardholderName: ''
  });

  const [cardError, setCardError] = useState<string | null>(null);
  const [cardBrand, setCardBrand] = useState<string | null>(null);

  // keep a ref of previous item IDs to detect when item set changes (not quantity)
  const prevIdsRef = useRef<string[]>([]);

  useEffect(() => {
    // On mount: try to restore a pending checkout (if any)
    try {
      const pendingRaw = localStorage.getItem('pendingCheckout');
      if (pendingRaw) {
        const pending = JSON.parse(pendingRaw);
        const snapshot: string[] = pending.snapshot || [];
        const currentSnapshot = buyNowProduct ? [buyNowProduct._id] : items.map(i => i.id);

        // Only restore if the cart contents match the snapshot the user created before being redirected to login
        if (arraysEqual(snapshot, currentSnapshot)) {
          if (pending.orderData) setOrderData(pending.orderData);
          if (pending.paymentForm) setPaymentForm(pending.paymentForm);
          // If user already logged in and the saved payment method was UPI/CARD -> go to payment step
          if (user && pending.orderData && (pending.orderData.paymentMethod === 'upi' || pending.orderData.paymentMethod === 'card')) {
            setStep('payment');
          }
        }
        localStorage.removeItem('pendingCheckout');
      }
    } catch (err) {
      console.error('Failed to restore pending checkout', err);
      localStorage.removeItem('pendingCheckout');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-skip to payment after login if they had already chosen UPI/CARD
  useEffect(() => {
    if (user && (orderData.paymentMethod === 'upi' || orderData.paymentMethod === 'card')) {
      setStep('payment');
    }
  }, [user, orderData.paymentMethod]);

  // Clear delivery address if the cart item IDs change (not on quantity changes),
  // but DO NOT clear if there is a pendingCheckout (we do not want to overwrite restoration).
  useEffect(() => {
    try {
      const pendingExists = !!localStorage.getItem('pendingCheckout');
      const currentIds = items.map(i => i.id).sort();
      const prevIds = prevIdsRef.current.sort();

      if (!pendingExists) {
        const prevJoined = prevIds.join(',');
        const currJoined = currentIds.join(',');
        // If there were previous IDs and the set changed (not simple quantity update), clear address
        if (prevJoined && prevJoined !== currJoined) {
          setOrderData({
            paymentMethod: 'cod',
            deliveryAddress: { street: '', city: '', state: '', zipCode: '' }
          });
        }
      }
      prevIdsRef.current = items.map(i => i.id);
    } catch (err) {
      console.error('Error while comparing cart snapshots', err);
    }
  }, [items]);

  const handleQuantityChange = (id: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeFromCart(id);
    } else {
      updateQuantity(id, newQuantity);
    }
  };

  const handleAddressChange = (field: string, value: string) => {
    setOrderData({
      ...orderData,
      deliveryAddress: { ...orderData.deliveryAddress, [field]: value }
    });
  };

  const detectCardBrand = (number: string) => {
    if (/^4/.test(number)) return 'Visa';
    if (/^5[1-5]/.test(number)) return 'Mastercard';
    if (/^3[47]/.test(number)) return 'American Express';
    if (/^6(?:011|5)/.test(number)) return 'Discover';
    return null;
  };

  const isCardExpired = (month: string, year: string) => {
    if (!month || !year) return false;
    const now = new Date();
    const expDate = new Date(parseInt('20' + year, 10), parseInt(month, 10) - 1);
    return expDate < now;
  };

  const createOrder = async () => {
    let orderItems;
    let isBuyNow = false;

    if (buyNowProduct) {
      isBuyNow = true;
      orderItems = [
        {
          product: buyNowProduct._id,
          quantity: 1,
          price: buyNowProduct.price
        }
      ];
    } else {
      if (items.length === 0) return null;
      orderItems = items.map(item => ({
        product: item.id,
        quantity: item.quantity,
        price: item.price,
        notes: item.notes || ''
      }));
    }

    const res = await axios.post('http://localhost:5000/api/orders', {
      items: orderItems,
      deliveryAddress: orderData.deliveryAddress,
      paymentMethod: orderData.paymentMethod,
      buyNow: isBuyNow
    }, { withCredentials: true });

    // server may respond with order in data or res.data
    const newOrder = res.data.order || res.data;
    setCreatedOrder(newOrder);

    if (!isBuyNow) clearCart();

    return newOrder;
  };

  const handleContinue = async () => {
    // If guest, save pending checkout snapshot, then send them to login
    if (!user) {
      // Save orderData, paymentForm and a snapshot of cart item IDs so we can restore correctly after login
      try {
        const snapshot = buyNowProduct ? [buyNowProduct._id] : items.map(i => i.id);
        const pending = {
          orderData,
          paymentForm,
          snapshot,
          buyNowProduct
        };
        localStorage.setItem('pendingCheckout', JSON.stringify(pending));
      } catch (err) {
        console.error('Failed to save pending checkout', err);
      }
      toast.error("Please log in or register to continue checkout.");
      navigate('/login', { state: { from: '/cart' } });
      return;
    }

    // Logged-in flow:
    if (orderData.paymentMethod === 'cod') {
      setLoading(true);
      try {
        const order = await createOrder();
        if (order) {
          toast.success("Order placed successfully with Cash on Delivery!");
          navigate('/orders');
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to place COD order.");
      } finally {
        setLoading(false);
      }
    } else {
      setStep('payment');
    }
  };

  const handleUPIPayment = async () => {
    setLoading(true);
    try {
      const order = await createOrder();
      if (!order) return;
      const res = await fetch('http://localhost:5000/api/payments/upi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          orderId: order._id,
          amount: order.totalAmount,
          upiId: paymentForm.upiId,
          upiApp: paymentForm.upiApp
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('UPI Payment successful!');
        navigate('/orders');
      } else {
        toast.error(data.message || 'UPI Payment failed');
      }
    } catch (err) {
      toast.error('Network error during UPI payment.');
    } finally {
      setLoading(false);
    }
  };

  const handleCardPayment = async () => {
    if (isCardExpired(paymentForm.expiryMonth, paymentForm.expiryYear)) {
      setCardError('Card expired. Please enter a valid card.');
      return;
    } else {
      setCardError(null);
    }
    setLoading(true);

    try {
      const order = await createOrder();
      if (!order) return;
      const res = await fetch('http://localhost:5000/api/payments/card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          orderId: order._id,
          amount: order.totalAmount,
          ...paymentForm
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Card Payment successful!');
        navigate('/orders');
      } else {
        toast.error(data.message || 'Card Payment failed');
      }
    } catch (err) {
      toast.error('Network error during Card payment.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setStep('review');
    setPaymentForm({
      upiId: '',
      upiApp: 'gpay',
      cardNumber: '',
      expiryMonth: '',
      expiryYear: '',
      cvv: '',
      cardholderName: ''
    });
    setCreatedOrder(null);
    toast('Payment cancelled.', { icon: '⚠️' });
  };

  if (!buyNowProduct && items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Toaster />
        <div className="text-center">
          <ShoppingBag size={64} className="mx-auto text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
          <p className="text-gray-600 mb-8">Add some delicious items to get started!</p>
          <button
            onClick={() => navigate('/menu')}
            className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors"
          >
            Browse Menu
          </button>
        </div>
      </div>
    );
  }

  const displayedItems = buyNowProduct ? [buyNowProduct] : items;
  const totalAmount = buyNowProduct ? buyNowProduct.price : getTotalAmount();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Toaster />
      <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
        {buyNowProduct ? 'Buy Now Checkout' : 'Shopping Cart'}
      </h1>

      {step === 'review' && (
        <div className="space-y-6">
          {/* Items */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold mb-4">Items</h3>
            {displayedItems.map((item: any) => (
              <div
                key={item._id || item.id}
                className="flex items-center justify-between border-b pb-4 mb-4"
              >
                <div className="flex items-center space-x-4">
                  <img
                    src={item.image || 'https://images.pexels.com/photos/1279330/pexels-photo-1279330.jpeg'}
                    alt={item.name}
                    className="w-16 h-16 object-cover rounded-md"
                  />
                  <div>
                    <h3 className="font-semibold">{item.name}</h3>
                    <p className="text-orange-500 font-bold">${item.price}</p>
                  </div>
                </div>
                {!buyNowProduct && (
                  <div className="flex items-center space-x-3">
                    <button onClick={() => handleQuantityChange(item.id, item.quantity - 1)}>
                      <Minus size={16} />
                    </button>
                    <span className="font-semibold">{item.quantity}</span>
                    <button onClick={() => handleQuantityChange(item.id, item.quantity + 1)}>
                      <Plus size={16} />
                    </button>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Delivery Address */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold mb-4">Delivery Address</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Street Address"
                value={orderData.deliveryAddress.street}
                onChange={(e) => handleAddressChange('street', e.target.value)}
                className="w-full border p-2 rounded"
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="City"
                  value={orderData.deliveryAddress.city}
                  onChange={(e) => handleAddressChange('city', e.target.value)}
                  className="w-full border p-2 rounded"
                />
                <input
                  type="text"
                  placeholder="State"
                  value={orderData.deliveryAddress.state}
                  onChange={(e) => handleAddressChange('state', e.target.value)}
                  className="w-full border p-2 rounded"
                />
              </div>
              <input
                type="text"
                placeholder="ZIP Code"
                value={orderData.deliveryAddress.zipCode}
                onChange={(e) => handleAddressChange('zipCode', e.target.value)}
                className="w-full border p-2 rounded"
              />
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold mb-4">Payment Method</h3>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cod"
                  checked={orderData.paymentMethod === 'cod'}
                  onChange={(e) => setOrderData({ ...orderData, paymentMethod: e.target.value })}
                />
                <span className="ml-2">Cash on Delivery</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="upi"
                  checked={orderData.paymentMethod === 'upi'}
                  onChange={(e) => setOrderData({ ...orderData, paymentMethod: e.target.value })}
                />
                <span className="ml-2">UPI Payment</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="card"
                  checked={orderData.paymentMethod === 'card'}
                  onChange={(e) => setOrderData({ ...orderData, paymentMethod: e.target.value })}
                />
                <span className="ml-2">Credit/Debit Card</span>
              </label>
            </div>
          </div>

          <button
            onClick={handleContinue}
            disabled={loading || !orderData.deliveryAddress.street || !orderData.deliveryAddress.city}
            className="w-full bg-orange-500 text-white py-3 rounded-lg"
          >
            {loading ? 'Processing...' : 'Continue'}
          </button>
        </div>
      )}

      {/* Payment Step */}
      {step === 'payment' && (
        <div className="bg-white p-6 rounded-lg shadow-sm border mt-6">
          {orderData.paymentMethod === 'upi' && (
            <>
              <h3 className="font-semibold mb-4">Enter UPI Details</h3>
              <input
                type="text"
                placeholder="name@bank"
                value={paymentForm.upiId}
                onChange={(e) => setPaymentForm({ ...paymentForm, upiId: e.target.value })}
                className="w-full border p-2 rounded mb-3"
              />
              <select
                value={paymentForm.upiApp}
                onChange={(e) => setPaymentForm({ ...paymentForm, upiApp: e.target.value })}
                className="w-full border p-2 rounded mb-3"
              >
                <option value="gpay">Google Pay</option>
                <option value="phonepe">PhonePe</option>
                <option value="paytm">Paytm</option>
                <option value="bhim">BHIM</option>
                <option value="other">Other</option>
              </select>
              <div className="flex space-x-3">
                <button
                  onClick={handleUPIPayment}
                  disabled={loading}
                  className={`flex-1 text-white py-2 rounded ${loading ? 'bg-gray-400' : 'bg-blue-500'}`}
                >
                  {loading ? 'Processing...' : 'Pay Now'}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={loading}
                  className="flex-1 bg-gray-300 text-gray-800 py-2 rounded"
                >
                  Cancel
                </button>
              </div>
            </>
          )}

          {orderData.paymentMethod === 'card' && (
            <>
              <h3 className="font-semibold mb-4">Enter Card Details</h3>
              <div className="relative mb-2">
                <input
                  type="text"
                  placeholder="Card Number"
                  value={paymentForm.cardNumber}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPaymentForm({ ...paymentForm, cardNumber: val });
                    setCardBrand(detectCardBrand(val));
                  }}
                  className="w-full border p-2 rounded pr-20"
                />
                {cardBrand && (
                  <span className="absolute right-3 top-2 text-sm font-medium text-gray-600">
                    {cardBrand}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2 mb-2">
                <input
                  type="text"
                  placeholder="MM"
                  value={paymentForm.expiryMonth}
                  onChange={(e) => setPaymentForm({ ...paymentForm, expiryMonth: e.target.value })}
                  className="border p-2 rounded"
                />
                <input
                  type="text"
                  placeholder="YY"
                  value={paymentForm.expiryYear}
                  onChange={(e) => setPaymentForm({ ...paymentForm, expiryYear: e.target.value })}
                  className="border p-2 rounded"
                />
                <input
                  type="text"
                  placeholder="CVV"
                  value={paymentForm.cvv}
                  onChange={(e) => setPaymentForm({ ...paymentForm, cvv: e.target.value })}
                  className="border p-2 rounded"
                />
              </div>
              <input
                type="text"
                placeholder="Cardholder Name"
                value={paymentForm.cardholderName}
                onChange={(e) => setPaymentForm({ ...paymentForm, cardholderName: e.target.value })}
                className="w-full border p-2 rounded mb-3"
              />
              {cardError && <p className="text-red-500 text-sm mb-2">{cardError}</p>}
              <div className="flex space-x-3">
                <button
                  onClick={handleCardPayment}
                  disabled={loading}
                  className={`flex-1 text-white py-2 rounded ${loading ? 'bg-gray-400' : 'bg-blue-500'}`}
                >
                  {loading ? 'Processing...' : 'Pay Now'}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={loading}
                  className="flex-1 bg-gray-300 text-gray-800 py-2 rounded"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default CartPage;
