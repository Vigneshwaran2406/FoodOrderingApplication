import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Eye, Package, Clock, CheckCircle, XCircle,
  Filter, User, MapPin, AlertCircle
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';

const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [refundResponse, setRefundResponse] = useState('');

  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (id) {
      fetchOrderDetails(id);
    }
  }, [id]);

  const showMessage = (message: string, type: 'success' | 'error') => {
    if (type === 'success') {
      setSuccess(message);
      setError('');
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError(message);
      setSuccess('');
      setTimeout(() => setError(''), 5000);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/admin/orders', { withCredentials: true });
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      showMessage('Failed to fetch orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderDetails = async (orderId: string) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/admin/orders/${orderId}`, { withCredentials: true });
      setSelectedOrder(response.data);
      setShowOrderModal(true);
    } catch (error) {
      console.error('Error fetching order details:', error);
      showMessage('Failed to fetch order details', 'error');
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      await axios.put(
        `http://localhost:5000/api/admin/orders/${orderId}/status`,
        { status },
        { withCredentials: true }
      );
      fetchOrders();
      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder({ ...selectedOrder, orderStatus: status });
      }
      showMessage('Order status updated successfully!', 'success');
    } catch (error) {
      console.error('Error updating order status:', error);
      showMessage('Failed to update order status', 'error');
    }
  };

  // ⭐ Handle refund approval/denial (fixed API route)
  const handleRefund = async (orderId: string, action: 'approved' | 'denied') => {
    try {
      await axios.put(
        `http://localhost:5000/api/orders/admin/orders/${orderId}/update-refund`, // ✅ fixed
        { status: action, rejectionReason: refundResponse || '' },
        { withCredentials: true }
      );

      toast.success(`Refund ${action} successfully!`);
      fetchOrders();

      setSelectedOrder(prev => prev ? {
        ...prev,
        refundDetails: {
          ...prev.refundDetails,
          status: action,
          adminResponse: refundResponse,
          respondedAt: new Date()
        }
      } : null);

      setRefundResponse('');
      closeModal();
    } catch (error: any) {
      console.error(`Error processing refund:`, error);
      toast.error(error.response?.data?.message || 'Failed to process refund');
    }
  };

  const closeModal = () => {
    setShowOrderModal(false);
    setSelectedOrder(null);
    navigate('/admin/orders');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
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
    return status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock size={16} />;
      case 'confirmed': return <CheckCircle size={16} />;
      case 'preparing': return <Package size={16} />;
      case 'out-for-delivery': return <Package size={16} />;
      case 'delivered': return <CheckCircle size={16} />;
      case 'cancelled': return <XCircle size={16} />;
      default: return <Clock size={16} />;
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((order: any) => {
      if (filter === 'all') return true;
      if (filter === 'refund-requested' && order.refundDetails?.status === 'requested') return true;
      if (filter === 'refunded' && order.refundDetails?.status === 'approved') return true;
      if (filter === 'refund-denied' && order.refundDetails?.status === 'denied') return true;
      return order.orderStatus === filter;
    });
  }, [orders, filter]);

  const orderStatusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'preparing', label: 'Preparing' },
    { value: 'out-for-delivery', label: 'Out for Delivery' },
    { value: 'delivered', label: 'Delivered' }
  ];

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/4 mb-8"></div>
          <div className="bg-white shadow-sm rounded-lg p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-300 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md flex items-center">
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center">
          <AlertCircle size={16} className="mr-2" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Filter className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="all">All Orders</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="preparing">Preparing</option>
              <option value="out-for-delivery">Out for Delivery</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
              <option value="refund-requested">Refund Requested</option>
              <option value="refunded">Refunded</option>
              <option value="refund-denied">Refund Denied</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">Order</th>
                <th className="px-6 py-3 text-left">Customer</th>
                <th className="px-6 py-3 text-left">Items</th>
                <th className="px-6 py-3 text-left">Total</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Payment Status</th>
                <th className="px-6 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order: any) => (
                  <tr key={order._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          #{order._id.slice(-8)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {order.user?.name || 'Unknown User'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.user?.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {order.items.length} items
                      </div>
                      <div className="text-sm text-gray-500">
                        {order.items.slice(0, 2).map((item: any, index: number) => (
                          <span key={index}>
                            {item.product?.name}
                            {index < Math.min(order.items.length - 1, 1) && ', '}
                          </span>
                        ))}
                        {order.items.length > 2 && '...'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${order.totalAmount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(order.orderStatus)}
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.orderStatus)}`}>
                          {formatStatus(order.orderStatus)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {order.refundDetails && order.refundDetails.status ? (
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            order.refundDetails.status === 'requested'
                              ? 'bg-yellow-100 text-yellow-800'
                              : order.refundDetails.status === 'approved'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {order.refundDetails.status === 'requested'
                            ? 'Refund Requested'
                            : order.refundDetails.status === 'approved'
                            ? 'Refunded'
                            : 'Refund Denied'}
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                          Paid
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => navigate(`/admin/orders/${order._id}`)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye size={16} />
                        </button>
                        {order.orderStatus !== 'delivered' && order.orderStatus !== 'cancelled' && (
                          <select
                            value={order.orderStatus}
                            onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                            className="text-xs border border-gray-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          >
                            {orderStatusOptions.map(option => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    No orders to display for this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {filteredOrders.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <Package size={64} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
          <p className="text-gray-500">
            {filter === 'all' ? 'No orders have been placed yet.' : `No orders with status "${formatStatus(filter)}".`}
          </p>
        </div>
      )}

      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                Order Details - #{selectedOrder._id.slice(-8)}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {/* Full Order Details */}
            <div className="space-y-4">
              <p><strong>Customer:</strong> {selectedOrder.user?.name} ({selectedOrder.user?.email})</p>
              <p><strong>Status:</strong> {formatStatus(selectedOrder.orderStatus)}</p>
              <p><strong>Total:</strong> ${selectedOrder.totalAmount.toFixed(2)}</p>
              <p><strong>Address:</strong> {selectedOrder.deliveryAddress?.street}, {selectedOrder.deliveryAddress?.city}</p>

              <div>
                <h4 className="font-semibold">Items:</h4>
                <ul className="list-disc pl-6">
                  {selectedOrder.items.map((item: any, i: number) => (
                    <li key={i}>
                      {item.product?.name} x {item.quantity} = ${item.price * item.quantity}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Refund request handling */}
            {selectedOrder.refundDetails?.status === 'requested' && (
              <div className="bg-orange-50 p-4 rounded-lg mt-6">
                <h4 className="font-semibold text-orange-800 mb-3 flex items-center">
                  <AlertCircle size={16} className="mr-2" />
                  Refund Request
                </h4>
                <p className="text-sm text-gray-700 mb-3">
                  A refund has been requested for this order. You can approve or deny it below.
                </p>
                <textarea
                  value={refundResponse}
                  onChange={(e) => setRefundResponse(e.target.value)}
                  placeholder="Admin notes (optional)"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                ></textarea>
                <div className="flex justify-end space-x-2 mt-4">
                  <button
                    onClick={() => handleRefund(selectedOrder._id, 'approved')}
                    className="px-4 py-2 text-sm font-semibold rounded-md bg-green-600 text-white hover:bg-green-700"
                  >
                    Approve Refund
                  </button>
                  <button
                    onClick={() => handleRefund(selectedOrder._id, 'denied')}
                    className="px-4 py-2 text-sm font-semibold rounded-md bg-red-600 text-white hover:bg-red-700"
                  >
                    Deny Refund
                  </button>
                </div>
              </div>
            )}

            {/* Refund details */}
            {selectedOrder.refundDetails?.status && (
              <div className="space-y-2 mt-4">
                <h4 className="font-semibold text-gray-900">Refund Details</h4>
                {selectedOrder.refundDetails.reason && (
                  <p className="text-gray-700">
                    <strong>Reason:</strong> {selectedOrder.refundDetails.reason}
                  </p>
                )}
                <p className="text-gray-700">
                  <strong>Status:</strong>{' '}
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      selectedOrder.refundDetails.status === 'requested'
                        ? 'bg-yellow-100 text-yellow-800'
                        : selectedOrder.refundDetails.status === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {selectedOrder.refundDetails.status === 'requested'
                      ? 'Requested'
                      : selectedOrder.refundDetails.status === 'approved'
                      ? 'Approved'
                      : 'Denied'}
                  </span>
                </p>
                {selectedOrder.refundDetails.adminResponse && (
                  <p className="text-gray-700">
                    <strong>Admin Response:</strong> {selectedOrder.refundDetails.adminResponse}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
