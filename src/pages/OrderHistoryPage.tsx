import React, { useState, useEffect } from 'react';
import { Clock, MapPin, CreditCard, Package, Star, X, RotateCcw } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';

const OrderHistoryPage: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isViewing, setIsViewing] = useState(false);
  const [viewOrder, setViewOrder] = useState<any>(null);

  // ⭐ Review modal states
  const [isReviewing, setIsReviewing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/orders/my-orders', { withCredentials: true });
      setOrders(response.data || []);
    } catch (error: any) {
      console.error('Error fetching orders:', error.response?.data || error.message || error);
      toast.error(error.response?.data?.message || 'Failed to load orders');
      setOrders([]); // ensure orders is an array if something went wrong
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (order: any) => {
    setViewOrder(order);
    setIsViewing(true);
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;

    try {
      await axios.put(
        `http://localhost:5000/api/orders/${orderId}/cancel`,
        { reason: "User cancelled the order" },
        { withCredentials: true }
      );
      toast.success("Order cancelled successfully");
      fetchOrders(); // refresh list
    } catch (error: any) {
      console.error("Cancel order error:", error.response?.data || error.message);
      toast.error(error.response?.data?.message || "Failed to cancel order");
    }
  };

  const handleRefund = async (order: any) => {
  try {
    const response = await axios.post(
      `http://localhost:5000/api/orders/${order._id}/request-refund`,
      { reason: "User requested refund" }, // you can pass reason here
      { withCredentials: true }
    );
    toast.success(response.data.message || "Refund request submitted");
    fetchOrders(); // refresh
  } catch (err: any) {
    console.error("Refund request error:", err.response?.data || err.message);
    toast.error(err.response?.data?.message || "Refund request failed");
  }
};


  const getStatusColor = (status: string) => {
    const s = status || 'pending';
    switch (s) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'preparing': return 'bg-orange-100 text-orange-800';
      case 'out-for-delivery': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatStatus = (status: string) => {
    if (!status) return 'Pending';
    return status.split('-').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // ⭐ Open review modal
  const handleOpenReview = (order: any) => {
    if (!order) return;
    setSelectedOrder(order);
    setRating(0);
    setComment('');
    setIsReviewing(true);
  };

  // ⭐ Submit order review
  const handleSubmitReview = async () => {
    if (!rating) {
      toast.error("Please select a rating before submitting");
      return;
    }

    if (!selectedOrder || !selectedOrder._id) {
      toast.error("No order selected for review");
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(
        `http://localhost:5000/api/orders/${selectedOrder._id}/review`,
        { rating, comment },
        { withCredentials: true }
      );

      toast.success("Order review submitted!");
      setIsReviewing(false);
      setRating(0);
      setComment('');
      fetchOrders(); // refresh order list
    } catch (error: any) {
      console.error("Failed to submit review:", error.response?.data || error.message);
      toast.error(error.response?.data?.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow-sm">
              <div className="h-4 bg-gray-300 rounded w-1/4 mb-4"></div>
              <div className="h-3 bg-gray-300 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Order History</h1>

      {orders.length === 0 ? (
        <div className="text-center py-12">
          <Package size={64} className="mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No orders yet</h2>
          <p className="text-gray-600 mb-6">When you place orders, they'll appear here</p>
          <button
            onClick={() => window.location.href = '/menu'}
            className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors"
          >
            Start Ordering
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order: any) => (
            <div key={order._id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Order #{String(order._id).slice(-8)}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Placed on {order?.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'Unknown'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order?.orderStatus)}`}>
                      {formatStatus(order?.orderStatus)}
                    </span>
                    <p className="text-lg font-bold text-gray-900 mt-1">
                      ${typeof order?.totalAmount === 'number' ? order.totalAmount.toFixed(2) : '0.00'}
                    </p>
                  </div>
                </div>

                {/* Order Items */}
                <div className="border-t border-gray-200 pt-4 mb-4">
                  <div className="space-y-3">
                    {(order.items || []).map((item: any, index: number) => (
                      <div key={index} className="flex items-center space-x-3">
                        <img
                          src={item?.product?.image || 'https://images.pexels.com/photos/1279330/pexels-photo-1279330.jpeg'}
                          alt={item?.product?.name || 'Product'}
                          className="w-12 h-12 object-cover rounded-md"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{item?.product?.name || 'Unknown product'}</p>
                          <p className="text-sm text-gray-600">Qty: {item?.quantity ?? 0}</p>
                        </div>
                        <p className="font-semibold text-gray-900">
                          ${typeof item?.price === 'number' ? (item.price * (item.quantity ?? 0)).toFixed(2) : '0.00'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <MapPin size={16} />
                    <span>
                      {order?.deliveryAddress?.street ? order.deliveryAddress.street : 'N/A'}{order?.deliveryAddress?.city ? `, ${order.deliveryAddress.city}` : ''}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <CreditCard size={16} />
                    <span className="capitalize">{order?.paymentMethod || 'N/A'}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Clock size={16} />
                    <span>
                      {order?.estimatedDeliveryTime ?
                        `Est. ${new Date(order.estimatedDeliveryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` :
                        'Estimating...'
                      }
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
<div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
  <div className="space-x-2">
    {order?.orderStatus === 'delivered' && !order?.orderReview?.rating && (
      <button 
        onClick={() => handleOpenReview(order)}
        className="flex items-center space-x-1 text-sm text-orange-500 hover:text-orange-600"
      >
        <Star size={16} />
        <span>Rate Order</span>
      </button>
    )}

    {order?.orderReview?.rating && (
      <div className="flex items-center space-x-2 text-sm text-green-600">
        <Star size={16} className="text-yellow-400" />
        <span>You rated: {order.orderReview.rating} ★</span>
      </div>
    )}
  </div>

  <div className="space-x-2">
    <button 
      className="text-sm text-gray-600 hover:text-gray-800"
      onClick={() => handleViewDetails(order)}
    >
      View Details
    </button>

    {['pending', 'confirmed'].includes(order?.orderStatus) && (
      <button 
        className="text-sm text-red-600 hover:text-red-800"
        onClick={() => handleCancelOrder(order._id)}
      >
        Cancel Order
      </button>
    )}

    {/* ⭐ Refund Section with statuses */}
    {/* ⭐ Refund Button & Status */}
{order?.orderStatus === 'cancelled' && order?.paymentId && (
  <>
    {/* Show request button only if no refund started */}
    {(!order?.refundDetails || !order?.refundDetails.status) && (
      <button
        className="flex items-center space-x-1 text-sm text-red-600 hover:text-red-800"
        onClick={() => handleRefund(order)}
      >
        <RotateCcw size={16} />
        <span>Request Refund</span>
      </button>
    )}

    {order?.refundDetails?.status === 'requested' && (
      <span className="text-sm text-yellow-600 font-medium">
        Refund Requested (awaiting admin approval)
      </span>
    )}

    {order?.refundDetails?.status === 'approved' && (
      <span className="text-sm text-green-600 font-medium">
        Refund Completed
      </span>
    )}

    {order?.refundDetails?.status === 'denied' && (
      <span className="text-sm text-red-600 font-medium">
        Refund Rejected
      </span>
    )}
  </>
)}

  </div>
</div>

              </div>
            </div>
          ))}
        </div>
      )}

      {isViewing && viewOrder && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] p-6 rounded-lg shadow-lg relative overflow-hidden">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
              onClick={() => setIsViewing(false)}
            >
              <X size={20} />
            </button>
            <h2 className="text-xl font-bold mb-4">Order Details</h2>

            {/* ⭐ Scrollable content */}
            <div className="space-y-4 overflow-y-auto max-h-[70vh] pr-2">
              <p><strong>Order ID:</strong> {viewOrder?._id ?? 'N/A'}</p>
              <p><strong>Status:</strong> {formatStatus(viewOrder?.orderStatus)}</p>
              <p><strong>Total:</strong> ${typeof viewOrder?.totalAmount === 'number' ? viewOrder.totalAmount.toFixed(2) : '0.00'}</p>
              <p><strong>Payment Method:</strong> {viewOrder?.paymentMethod ?? 'N/A'}</p>
              <p><strong>Order Placed:</strong> {viewOrder?.createdAt ? new Date(viewOrder.createdAt).toLocaleString() : 'Unknown'}</p>
              <p>
                <strong>Delivery Address:</strong><br />
                {viewOrder?.deliveryAddress?.street ?? 'N/A'}, {viewOrder?.deliveryAddress?.city ?? ''},<br />
                {viewOrder?.deliveryAddress?.state ?? ''} - {viewOrder?.deliveryAddress?.zipCode ?? ''}
              </p>
              <p><strong>Estimated Delivery:</strong> {viewOrder?.estimatedDeliveryTime
                ? new Date(viewOrder.estimatedDeliveryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : 'Estimating...'}</p>

              {/* Items List */}
              <div>
                <h3 className="font-semibold mb-2">Items</h3>
                <div className="space-y-2">
                  {(viewOrder?.items || []).map((item: any, i: number) => (
                    <div key={i} className="flex items-center space-x-3 border p-2 rounded">
                      <img
                        src={item?.product?.image || "https://via.placeholder.com/50"}
                        alt={item?.product?.name || 'Product'}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div className="flex-1">
                        <p className="font-medium">{item?.product?.name ?? 'Unknown'}</p>
                        <p className="text-sm text-gray-600">Qty: {item?.quantity ?? 0}</p>
                      </div>
                      <p className="font-semibold">${typeof item?.price === 'number' ? (item.price * (item.quantity ?? 0)).toFixed(2) : '0.00'}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ⭐ Review Modal */}
      {isReviewing && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white w-full max-w-md p-6 rounded-lg shadow-lg relative">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
              onClick={() => setIsReviewing(false)}
            >
              <X size={20} />
            </button>
            <h2 className="text-xl font-bold mb-4">Rate Order #{selectedOrder?._id ? String(selectedOrder._id).slice(-8) : ''}</h2>

            {/* Stars */}
            <div className="flex space-x-2 mb-4">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className={`text-2xl ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
                >
                  ★
                </button>
              ))}
            </div>

            {/* Comment */}
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience with this order..."
              className="w-full border rounded-lg p-2 mb-4"
              rows={3}
            />

            <button
              onClick={handleSubmitReview}
              disabled={submitting}
              className={`w-full py-2 rounded-lg text-white ${submitting ? 'bg-gray-400' : 'bg-orange-500 hover:bg-orange-600'}`}
            >
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderHistoryPage;
