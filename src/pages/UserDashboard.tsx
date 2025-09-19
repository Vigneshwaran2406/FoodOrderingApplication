import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {ShoppingBag,Heart,Clock,Star,Package,MessageSquare,Settings,Award,DollarSign,ClipboardList,CheckCircle,Activity,User,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";

// ✅ Helpers reused from AdminDashboard
const formatStatus = (status: string) =>
  (status || "")
    .toString()
    .split("-")
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : ""))
    .join(" ");

const getStatusBadge = (status: string) => {
  if (!status) return null;
  let classes = "bg-gray-100 text-gray-800";
  if (status === "delivered" || status === "resolved")
    classes = "bg-green-100 text-green-800";
  else if (status === "cancelled" || status === "closed")
    classes = "bg-red-100 text-red-800";
  else if (status === "in-progress") classes = "bg-blue-100 text-blue-800";
  else if (status === "confirmed") classes = "bg-blue-100 text-blue-800";
  else if (status === "preparing") classes = "bg-orange-100 text-orange-800";
  else if (status === "pending") classes = "bg-yellow-100 text-yellow-800";
  else if (status === "out-for-delivery")
    classes = "bg-purple-100 text-purple-800";

  return (
    <span
      className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${classes}`}
    >
      {formatStatus(status)}
    </span>
  );
};

const getPriorityBadge = (priority: string) => {
  if (!priority) return null;
  const p = priority.toLowerCase();
  let classes = "bg-gray-100 text-gray-800";
  if (p === "low") classes = "bg-green-100 text-green-800";
  else if (p === "medium") classes = "bg-yellow-100 text-yellow-800";
  else if (p === "high") classes = "bg-orange-100 text-orange-800";
  else if (p === "urgent") classes = "bg-red-100 text-red-800";

  return (
    <span
      className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${classes}`}
    >
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </span>
  );
};

const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<any>({
    stats: {
      totalOrders: 0,
      totalSpent: 0,
      favoriteRestaurants: 0,
      averageRating: 0,
    },
    recentOrders: [],
    favoriteRestaurants: [],
    recommendations: [],
    feedbacks: [],
    loading: true,
  });
  const [activities, setActivities] = useState<any[]>([]);
const [isViewing, setIsViewing] = useState(false);
const [viewOrder, setViewOrder] = useState<any | null>(null);
const [expandedFeedback, setExpandedFeedback] = useState<string | null>(null);
const [orderProductsCache, setOrderProductsCache] = useState<Record<string, any[]>>({});


  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Hit your actual endpoints. Adjust if your backend uses a different path.
      const [ordersRes, favoritesRes, recommendationsRes, feedbackRes, activitiesRes] =
  await Promise.all([
    axios.get("/api/orders/my-orders", { withCredentials: true }),
    axios.get("/api/users/favorites", { withCredentials: true }),
    axios.get("/api/products?limit=4&sortBy=averageRating&sortOrder=desc"),
    axios.get("/api/feedback/my-feedback", { withCredentials: true }),
    axios.get("/api/users/my-activities", { withCredentials: true }),
  ]);
      
      const orders = ordersRes.data || [];
      const totalSpent = orders.reduce(
        (sum: number, order: any) => sum + (order.totalAmount || 0),
        0
      );
      setActivities(activitiesRes.data || []);

      setDashboardData({
        stats: {
          totalOrders: orders.length,
          totalSpent,
          favoriteRestaurants: favoritesRes.data?.length || 0,
          averageRating: 4.5, // placeholder — compute from reviews if you want
        },
        recentOrders: orders.slice(0, 5),
        favoriteRestaurants: favoritesRes.data || [],
        // recommendations endpoint usually returns array; use data directly
        recommendations: Array.isArray(recommendationsRes.data)
          ? recommendationsRes.data
          : recommendationsRes.data?.products || [],
        feedbacks: feedbackRes.data || [],
        loading: false,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setDashboardData((prev) => ({ ...prev, loading: false }));
    }
    
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "confirmed":
        return "bg-blue-100 text-blue-800";
      case "preparing":
        return "bg-orange-100 text-orange-800";
      case "out-for-delivery":
        return "bg-purple-100 text-purple-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatStatus = (status: string) =>
    (status || "")
      .toString()
      .split("-")
      .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : ""))
      .join(" ");

  if (dashboardData.loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow-sm">
                <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                <div className="h-6 bg-gray-300 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.name}! 👋
        </h1>
        <p className="text-gray-600 mt-2">
          Here's what's happening with your food orders
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">
                {dashboardData.stats.totalOrders}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Spent</p>
              <p className="text-2xl font-bold text-gray-900">
                ${dashboardData.stats.totalSpent.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <Heart className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Favorites</p>
              <p className="text-2xl font-bold text-gray-900">
                {dashboardData.stats.favoriteRestaurants}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Star className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Rating</p>
              <p className="text-2xl font-bold text-gray-900">
                {dashboardData.stats.averageRating}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            to="/menu"
            className="flex flex-col items-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
          >
            <Package className="w-8 h-8 text-orange-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">Browse Menu</span>
          </Link>

          <Link
            to="/orders"
            className="flex flex-col items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Clock className="w-8 h-8 text-blue-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">
              Order History
            </span>
          </Link>

          <Link
            to="/profile"
            className="flex flex-col items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
          >
            <Settings className="w-8 h-8 text-green-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">
              Profile Settings
            </span>
          </Link>

          <Link
            to="/feedback"
            className="flex flex-col items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
          >
            <MessageSquare className="w-8 h-8 text-purple-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">
              Give Feedback
            </span>
          </Link>
        </div>
      </div>

      {/* Favorites + Feedback Section */}
<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
  {/* Favorites Section */}
  <div className="bg-white rounded-lg shadow-sm border">
    <div className="p-6 border-b border-gray-200">
      <h2 className="text-lg font-semibold text-gray-900">Your Favorites</h2>
    </div>
    <div className="p-6 max-h-80 overflow-y-auto">
      {dashboardData.favoriteRestaurants.length > 0 ? (
        <div className="space-y-4">
          {dashboardData.favoriteRestaurants.map((product: any) => (
            <Link
              key={product._id}
              to={`/products/${product._id}`}
              className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <img
                src={product.image}
                alt={product.name}
                className="w-12 h-12 object-cover rounded-md"
              />
              <div className="flex-1">
                <p className="font-medium text-gray-900">{product.name}</p>
                <p className="text-sm text-gray-600">
                  {product.restaurant?.name}
                </p>
                <div className="flex items-center space-x-2">
                  <span className="text-orange-500 font-bold">
                    ${product.price}
                  </span>
                  <div className="flex items-center space-x-1">
                    <Star size={12} className="text-yellow-400 fill-current" />
                    <span className="text-xs text-gray-600">
                      {product.averageRating || "New"}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <Heart size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">No favorites yet</p>
          <p className="text-sm text-gray-400">
            Browse products and tap the heart ❤️ to add them here
          </p>
        </div>
      )}
    </div>
  </div>

  {/* Feedback Section */}
<div className="bg-white rounded-lg shadow-sm border">
  <div className="p-6 border-b border-gray-200 flex items-center space-x-2">
    <MessageSquare className="text-purple-500" />
    <h2 className="text-lg font-semibold text-gray-900">Your Feedback</h2>
  </div>
  <div className="p-6 max-h-80 overflow-y-auto space-y-4">
    {dashboardData.feedbacks && dashboardData.feedbacks.length > 0 ? (
      dashboardData.feedbacks.map((fb: any) => {
        const isExpanded = expandedFeedback === fb._id;

        // Normalize priority + choose icon
        const priority = fb.priority ? fb.priority.toLowerCase() : "";
        let Icon = MessageSquare;
        let color = "bg-purple-100 text-purple-600";
        if (fb.type?.toLowerCase().includes("complaint")) {
          Icon = ClipboardList;
          color = "bg-red-100 text-red-600";
        }
        return (
          <div
            key={fb._id}
            className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg border border-gray-200"
          >
            {/* Icon */}
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${color}`}>
              <Icon className="w-5 h-5" />
            </div>

            {/* Feedback Content */}
            <div className="flex-1 space-y-3">
              {/* Line 1: Type + Rating */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-800">
                  {fb.type || "N/A"}
                </span>
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      size={14}
                      className={
                        i <= (fb.rating || 0)
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-gray-300"
                      }
                    />
                  ))}
                </div>
              </div>

              {/* Line 2: Status + Priority */}
              <div className="pt-2 border-t border-gray-200 flex items-center space-x-4">
                {/* Status */}
                <div className="flex items-center">
                  <span className="font-semibold text-gray-800 mr-2">Status:</span>
                  <span
                    className={
                      fb.status === "resolved"
                        ? "px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                        : fb.status === "in-progress"
                        ? "px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        : fb.status === "pending"
                        ? "px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"
                        : "px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                    }
                  >
                    {fb.status || "N/A"}
                  </span>
                </div>
                {/* Priority */}
                <div className="flex items-center">
                  <span className="font-semibold text-gray-800 mr-2">Priority:</span>
                  <span
                    className={
                      priority === "high"
                        ? "px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"
                        : priority === "medium"
                        ? "px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"
                        : priority === "low"
                        ? "px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                        : priority === "urgent"
                        ? "px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800"
                        : "px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                    }
                  >
                    {fb.priority || "N/A"}
                  </span>
                </div>
              </div>

              {/* Line 3: Subject + Date */}
              <div className="pt-2 border-t border-gray-200 flex items-center justify-between">
                <p className="text-sm font-medium text-gray-800">
                  {fb.subject || fb.message}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(fb.createdAt).toLocaleDateString()}
                </p>
              </div>

              {/* Toggle Button */}
              {fb.adminResponse?.message && (
                <button
                  onClick={() =>
                    setExpandedFeedback(isExpanded ? null : fb._id)
                  }
                  className="text-xs text-orange-600 hover:text-orange-700 font-medium mt-2"
                >
                  {isExpanded ? "Hide Response ▲" : "View Admin Response ▼"}
                </button>
              )}

              {/* Admin Response (Expandable) */}
              {isExpanded && fb.adminResponse?.message && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded space-y-2">
                  <p className="text-sm text-gray-800 flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-1" />
                    <strong>Admin Response:</strong>&nbsp;{fb.adminResponse.message}
                  </p>

                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <span className="font-semibold text-gray-800 mr-2">Status:</span>
                      <span
                        className={
                          fb.status === "resolved"
                            ? "px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                            : fb.status === "in-progress"
                            ? "px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            : "px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                        }
                      >
                        {fb.status || "N/A"}
                      </span>
                    </div>
                  </div>

                  {fb.adminResponse.respondedAt && (
                    <p className="text-xs text-gray-500">
                      Responded on:{" "}
                      {new Date(fb.adminResponse.respondedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })
    ) : (
      <div className="text-center py-8">
        <MessageSquare size={48} className="mx-auto text-gray-400 mb-4" />
        <p className="text-gray-500">No feedback submitted yet</p>
        <p className="text-sm text-gray-400">
          Share your experience with us to see updates here
        </p>
      </div>
    )}
  </div>
</div>
</div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Orders */}
<div className="bg-white rounded-lg shadow-sm border">
  <div className="p-6 border-b border-gray-200">
    <div className="flex justify-between items-center">
      <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
      <Link
        to="/orders"
        className="text-orange-500 hover:text-orange-600 text-sm font-medium"
      >
        View All
      </Link>
    </div>
  </div>
  {/* scrollable recent orders */}
  <div className="p-6 max-h-80 overflow-y-auto">
    {dashboardData.recentOrders.length > 0 ? (
      <div className="space-y-4">
        {dashboardData.recentOrders.map((order: any) => (
          <div
            key={order._id}
            className="p-4 bg-gray-50 rounded-lg border border-gray-200"
          >
            {/* Order ID + Status */}
            <div className="flex justify-between items-center mb-2">
              <button
                onClick={() => {
                  setViewOrder(order);
                  setIsViewing(true);
                }}
                className="font-semibold text-gray-900 hover:text-orange-600 transition-colors"
              >
                Order ID: {order._id}
              </button>
              <span
                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                  order.orderStatus
                )}`}
              >
                {formatStatus(order.orderStatus)}
              </span>
            </div>

            {/* Placed Date */}
            <p className="text-xs text-gray-500 mb-2">
              Placed on:{" "}
              {order.createdAt
                ? new Date(order.createdAt).toLocaleString()
                : ""}
            </p>

            {/* Items */}
            <div className="space-y-1 mb-2">
              {order.items?.map((item: any, i: number) => (
                <p key={i} className="text-sm text-gray-700">
                  {item.product?.name} × {item.quantity}
                </p>
              ))}
            </div>

            {/* Amount */}
            <p className="text-sm font-medium text-gray-900">
              Total: ${order.totalAmount?.toFixed(2)}
            </p>
          </div>
        ))}
      </div>
    ) : (
      <div className="text-center py-8">
        <ShoppingBag size={48} className="mx-auto text-gray-400 mb-4" />
        <p className="text-gray-500">No orders yet</p>
        <Link
          to="/menu"
          className="text-orange-500 hover:text-orange-600 text-sm font-medium"
        >
          Start ordering
        </Link>
      </div>
    )}
  </div>
        </div>
        
{/* Order Details Modal */}
{isViewing && viewOrder && (
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
    <div className="bg-white w-full max-w-2xl p-6 rounded-lg shadow-lg relative overflow-y-auto max-h-[90vh]">
      {/* Close Button */}
      <button
        className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
        onClick={() => setIsViewing(false)}
      >
        ✕
      </button>

      <h2 className="text-xl font-bold mb-4">Order Details</h2>

      <div className="space-y-4">
        <p><strong>Order ID:</strong> {viewOrder._id}</p>
        <p><strong>Status:</strong> {formatStatus(viewOrder.orderStatus)}</p>
        <p><strong>Total:</strong> ${viewOrder.totalAmount?.toFixed(2)}</p>
        <p><strong>Payment Method:</strong> {viewOrder.paymentMethod}</p>
        <p><strong>Placed On:</strong> {new Date(viewOrder.createdAt).toLocaleString()}</p>
        <p><strong>Estimated Delivery:</strong> 
          {viewOrder.estimatedDeliveryTime
            ? new Date(viewOrder.estimatedDeliveryTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : "Estimating..."}
        </p>

        {/* Address */}
        {viewOrder.deliveryAddress && (
          <div>
            <h3 className="font-semibold mb-1">Delivery Address</h3>
            <p className="text-sm text-gray-700">
              {viewOrder.deliveryAddress.street}, {viewOrder.deliveryAddress.city},{" "}
              {viewOrder.deliveryAddress.state} {viewOrder.deliveryAddress.zipCode}
            </p>
          </div>
        )}

        {/* Items */}
        <div>
          <h3 className="font-semibold mb-2">Items</h3>
          <div className="space-y-2">
            {viewOrder.items.map((item: any, i: number) => (
              <div key={i} className="flex items-center space-x-3 border p-2 rounded">
                <img
                  src={item.product.image}
                  alt={item.product.name}
                  className="w-12 h-12 object-cover rounded"
                />
                <div className="flex-1">
                  <p className="font-medium">{item.product.name}</p>
                  <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                </div>
                <p className="font-semibold">
                  ${(item.price * item.quantity).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Cancel Order Button */}
{viewOrder.orderStatus !== "delivered" &&
 viewOrder.orderStatus !== "cancelled" && (
  <button
    onClick={async () => {
      if (!window.confirm("⚠️ Are you sure you want to cancel this order?")) {
        return;
      }
      try {
        await axios.put(
          `/api/orders/${viewOrder._id}/cancel`,
          { reason: "Cancelled from dashboard" },
          { withCredentials: true }
        );
        alert("Order cancelled successfully!");
        setIsViewing(false);
        fetchDashboardData(); // refresh orders
      } catch (error: any) {
        alert(error.response?.data?.message || "Failed to cancel order");
      }
    }}
    className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded mt-4"
  >
    Cancel Order
  </button>
)}
      </div>
    </div>
  </div>
)}
        {/* Recommended for You */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Recommended for You</h2>
              <Link
                to="/menu"
                className="text-orange-500 hover:text-orange-600 text-sm font-medium"
              >
                View All
              </Link>
            </div>
          </div>
          <div className="p-6 max-h-80 overflow-y-auto">
            {dashboardData.recommendations.length > 0 ? (
              <div className="space-y-4">
                {dashboardData.recommendations.map((product: any) => (
                  <Link
                    key={product._id}
                    to={`/products/${product._id}`}
                    className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-12 h-12 object-cover rounded-md"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-600">
                        {product.restaurant?.name}
                      </p>
                      <div className="flex items-center space-x-2">
                        <span className="text-orange-500 font-bold">
                          ${product.price}
                        </span>
                        <div className="flex items-center space-x-1">
                          <Star size={12} className="text-yellow-400 fill-current" />
                          <span className="text-xs text-gray-600">
                            {product.averageRating || "New"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Award size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No recommendations yet</p>
                <p className="text-sm text-gray-400">
                  Order more to get personalized recommendations
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Achievement Section */}
      <div className="mt-8 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg shadow-sm text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold mb-2">🎉 Food Explorer Badge</h2>
            <p className="text-orange-100">
              You've ordered from {Math.min(dashboardData.stats.totalOrders, 5)} different restaurants!
              {dashboardData.stats.totalOrders >= 10 && " You're a true food explorer!"}
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">
              {dashboardData.stats.totalOrders}
            </div>
            <div className="text-sm text-orange-200">Orders Completed</div>
          </div>
        </div>
      </div>

      {/* ✅ Recent Activity (upgraded like AdminDashboard) */}
      <div className="bg-white rounded-lg shadow-sm border mt-8">
        <div className="p-6 border-b border-gray-200 flex items-center space-x-2">
          <Activity className="text-blue-500" />
          <h2 className="text-lg font-semibold text-gray-900">
            Recent Activity
          </h2>
        </div>
        <div className="p-6">
          {activities.length > 0 ? (
            <div className="max-h-96 overflow-y-auto pr-2">
              <ul className="space-y-4">
                {activities.map((act: any, index: number) => {
                  let Icon = User;
                  let color = "text-orange-600 bg-orange-100";
                  if (act.action.includes("order")) {
                    Icon = ClipboardList;
                    color = "text-green-600 bg-green-100";
                  } else if (act.action.includes("feedback")) {
                    Icon = MessageSquare;
                    color = "text-purple-600 bg-purple-100";
                  } else if (act.action.includes("review")) {
                    Icon = Star;
                    color = "text-yellow-600 bg-yellow-100";
                  } else if (act.action.includes("favourite")) {
                    Icon = Heart;
                    color = "text-red-600 bg-red-100";
                  }

                  return (
                    <li key={index} className="flex items-start space-x-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${color}`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {act.action === "placed an order" &&
                            "You placed an order"}
                          {act.action === "cancelled an order" &&
                            "You cancelled an order"}
                          {act.action === "submitted feedback" &&
                            "You submitted feedback"}
                          {act.action === "reviewed an order" &&
                            "You reviewed an order"}
                          {act.action === "added favourite" &&
                            "You added a favourite food"}
                          {act.action === "profile updated" &&
                            "You updated your profile"}
                        </p>

                        {/* ✅ Details */}
                        <div className="mt-2 text-sm text-gray-700 space-y-2">
                          {/* Orders (placed / cancelled / etc.) */}
{act.action.includes("order") && (
  <div className="pt-2 border-t border-gray-200 space-y-2">
    {/* Status + Amount */}
    <div className="flex items-center space-x-4">
      <span className="flex items-center">
        <span className="font-semibold text-gray-800 mr-2">Status:</span>
        {getStatusBadge(
          act.details?.newStatus ||
          (act.action === "cancelled an order" ? "cancelled" : "pending")
        )}
      </span>

      {act.details?.total !== undefined && (
        <span className="font-semibold text-gray-800">
          Amount: ${Number(act.details.total).toFixed(2)}
        </span>
      )}
    </div>

    {/* Order ID (clickable to open modal) */}
    {act.details?.orderId && (
      <div className="flex items-center">
        <span className="font-semibold text-gray-800 mr-2">Order:</span>
        <button
          onClick={async () => {
            try {
              const res = await axios.get(`/api/orders/${act.details.orderId}`, {
                withCredentials: true,
              });
              setViewOrder(res.data); // full order object
              setIsViewing(true);
            } catch (error: any) {
              console.error("Failed to fetch order details:", error);
              alert(error.response?.data?.message || "Failed to load order details");
            }
          }}
          className="text-green-600 hover:underline font-semibold mr-2"
        >
          #{act.details.orderId.slice(-6)}
        </button>
      </div>
    )}

    {/* Items (from activity or fallback fetch) */}
    {(() => {
      const products =
        act.details?.products?.length > 0
          ? act.details.products
          : orderProductsCache[act.details?.orderId || ""];

      // if no products cached yet → fetch and store
      if (!products && act.details?.orderId) {
        axios
          .get(`/api/orders/${act.details.orderId}`, { withCredentials: true })
          .then((res) => {
            setOrderProductsCache((prev) => ({
              ...prev,
              [act.details.orderId]: res.data.items.map((item: any) => ({
                name: item.product?.name,
                qty: item.quantity,
              })),
            }));
          })
          .catch((err) => console.error("Failed to fetch order products", err));
      }

      return products && products.length > 0 ? (
        <div className="flex flex-wrap items-center">
          <span className="font-semibold text-gray-800 mr-2">Items:</span>
          <span className="text-gray-600">
            {products.map((p: any) => (
              <span key={p.name} className="mr-2">
                {p.name} ×{p.qty}
              </span>
            ))}
          </span>
        </div>
      ) : null;
    })()}
  </div>
)}
                          {/* Feedbacks */}
                          {act.action === "submitted feedback" && (
                            <div className="pt-2 border-t border-gray-200 space-y-1">
                              <div className="flex items-center space-x-4">
                                {act.details?.status && (
                                  <span className="flex items-center">
                                    <span className="font-semibold text-gray-800 mr-2">
                                      Status:
                                    </span>
                                    {getStatusBadge(act.details.status)}
                                  </span>
                                )}
                                {act.details?.priority && (
                                  <span className="flex items-center">
                                    <span className="font-semibold text-gray-800 mr-2">
                                      Priority:
                                    </span>
                                    {getPriorityBadge(act.details.priority)}
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center">
                                <span className="font-semibold text-gray-800 mr-2">
                                  Subject:
                                </span>
                                <span className="text-purple-600 font-medium mr-2">
                                  “{act.details?.subject || "No Subject"}”
                                </span>
                                <span className="font-semibold text-gray-800 mr-2">
                                  Type:
                                </span>
                                <span className="text-gray-700">
                                  {act.details?.type || "N/A"}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Reviews */}
                          {act.action === "reviewed an order" && (
                            <div className="pt-2 border-t border-gray-200">
                              <p>
                                Rating:{" "}
                                <span className="text-yellow-600 font-semibold">
                                  {act.details?.rating} ★
                                </span>{" "}
                                – {act.details?.comment}
                              </p>
                            </div>
                          )}

                          {/* Favourites */}
                          {act.action === "added favourite" && (
                            <div className="pt-2 border-t border-gray-200">
                              <p>
                                {act.details?.name} – ${act.details?.price} (
                                {act.details?.rating}★)
                              </p>
                            </div>
                          )}

                          {/* Profile updates */}
                          {act.action === "profile updated" && (
                            <div className="pt-2 border-t border-gray-200">
                              <p>Changed: {act.details?.fields?.join(", ")}</p>
                            </div>
                          )}
                        </div>

                        {/* Date */}
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(act.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              No recent activity
            </p>
          )}
        </div>
      </div>

    </div>
  );
};

export default UserDashboard;
