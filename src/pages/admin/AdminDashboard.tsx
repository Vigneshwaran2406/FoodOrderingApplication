import React, { useState, useEffect } from "react";
import {
  Users,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  Package,
  Star,
  Store,
  MessageSquare,
  Activity,
  UtensilsCrossed,
  Pizza,
  ClipboardList,
  UserCheck,
  Zap,
  ShoppingCart,
  ShoppingBasket,
} from "lucide-react";
import { Link } from "react-router-dom";
import axios from "axios";

const AdminDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const API_URL = import.meta.env.VITE_API_URL;
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  
  useEffect(() => {
    fetchAnalytics();
    fetchRecentActivity();
  }, []);
  
  const fetchAnalytics = async () => {
    try {
      const response = await axios.get("${API_URL}/admin/analytics", {
        withCredentials: true,
      });
      setAnalytics(response.data);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const response = await axios.get("${API_URL}/admin/recent-activity", {
        withCredentials: true,
      });
      setRecentActivity(response.data || []);
    } catch (error) {
      console.error("Error fetching activity:", error);
    }
  };

  const formatStatus = (status: string) => {
    return status
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const getStatusBadge = (status: string) => {
    if (!status) return null;
    let classes = "bg-gray-100 text-gray-800";
    if (status === "delivered" || status === "resolved") classes = "bg-green-100 text-green-800";
    else if (status === "cancelled" || status === "closed") classes = "bg-red-100 text-red-800";
    else if (status === "in-progress") classes = "bg-blue-100 text-blue-800";
    else if (status === "confirmed") classes = "bg-blue-100 text-blue-800";
    else if (status === "preparing") classes = "bg-orange-100 text-orange-800";
    else if (status === "pending") classes = "bg-yellow-100 text-yellow-800";
    else if (status === "out-for-delivery") classes = "bg-purple-100 text-purple-800";

    return (
      <span className={`ml-2 inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${classes}`}>
        {formatStatus(status)}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
  if (!priority) return null;
  let classes = "bg-gray-100 text-gray-800";
  if (priority === "low") classes = "bg-green-100 text-green-800";
  else if (priority === "medium") classes = "bg-yellow-100 text-yellow-800";
  else if (priority === "high") classes = "bg-orange-100 text-orange-800";
  else if (priority === "urgent") classes = "bg-red-100 text-red-800";

  return (
    <span className={`ml-2 inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${classes}`}>
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </span>
  );
};


  if (loading) {
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
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {/* users */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics?.stats?.totalUsers || 0}
              </p>
            </div>
          </div>
        </div>

        {/* orders */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics?.stats?.totalOrders || 0}
              </p>
            </div>
          </div>
        </div>

        {/* revenue */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                ${analytics?.stats?.totalRevenue?.toFixed(2) || "0.00"}
              </p>
            </div>
          </div>
        </div>

        {/* monthly orders */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Monthly Orders</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics?.stats?.monthlyOrders || 0}
              </p>
            </div>
          </div>
        </div>

        {/* products */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
              <Pizza className="w-6 h-6 text-pink-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Products</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics?.stats?.totalProducts || 0}
              </p>
            </div>
          </div>
        </div>

        {/* restaurants */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <Store className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Restaurants</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics?.stats?.totalRestaurants || 0}
              </p>
            </div>
          </div>
        </div>

        {/* feedbacks */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-teal-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Feedbacks</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics?.stats?.totalFeedbacks || 0}
              </p>
            </div>
          </div>
        </div>
        {/* Orders Today */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-lime-100 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-lime-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Orders Today</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics?.stats?.ordersToday ?? 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Quick Actions */}
<div className="bg-white rounded-lg shadow-sm border">
  {/* Header with border */}
  <div className="p-6 border-b border-gray-200 flex items-center space-x-2">
  <Zap className="text-orange-500" />
  <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
</div>

  {/* Body */}
  <div className="p-6 flex flex-col space-y-3">
    <Link
      to="/admin/users"
      className="flex items-center px-4 py-3 bg-orange-100 text-orange-600 rounded-lg hover:bg-orange-200 transition"
    >
      <Users className="w-5 h-5 mr-2" /> Users
    </Link>
    <Link
      to="/admin/restaurants"
      className="flex items-center px-4 py-3 bg-orange-100 text-orange-600 rounded-lg hover:bg-orange-200 transition"
    >
      <Store className="w-5 h-5 mr-2" /> Restaurants
    </Link>
    <Link
      to="/admin/menu"
      className="flex items-center px-4 py-3 bg-orange-100 text-orange-600 rounded-lg hover:bg-orange-200 transition"
    >
      <UtensilsCrossed className="w-5 h-5 mr-2" /> Menus
    </Link>
    <Link
      to="/admin/feedback"
      className="flex items-center px-4 py-3 bg-orange-100 text-orange-600 rounded-lg hover:bg-orange-200 transition"
    >
      <MessageSquare className="w-5 h-5 mr-2" /> Feedbacks
    </Link>
  </div>
</div>


        {/* Recent Activity */}
<div className="bg-white rounded-lg shadow-sm border">
  <div className="p-6 border-b border-gray-200 flex items-center space-x-2">
    <Activity className="text-blue-500" />
    <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
  </div>
  <div className="p-6">
    {recentActivity.length > 0 ? (
      <div className="max-h-80 overflow-y-auto pr-2"> {/* 👈 scrollable wrapper */}
        <ul className="space-y-4">
          {recentActivity.map((act: any, index: number) => {
            let Icon = ClipboardList;
            let color = "text-blue-600 bg-blue-100";

            if (act.action.includes("order")) {
              Icon = ClipboardList;
              color = "text-green-600 bg-green-100";
            } else if (act.action.includes("feedback")) {
              Icon = MessageSquare;
              color = "text-purple-600 bg-purple-100";
            } else if (act.action.includes("restaurant")) {
              Icon = Store;
              color = "text-red-600 bg-red-100";
            } else if (act.action.includes("menu item")) {
              Icon = Pizza;
              color = "text-yellow-600 bg-yellow-100";
            } else {
              Icon = UserCheck;
              color = "text-orange-600 bg-orange-100";
            }

            return (
              <li key={index} className="flex items-start space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm text-gray-800">
                    <strong>{act.user?.name || "Unknown User"}</strong>{" "}
                    {act.action}
                  </p>

                  {/* Restaurants */}
                  {act.action.includes("restaurant") && (
                    <div className="mt-2 text-sm text-gray-700 space-y-2">
                      {/* Restaurant Name */}
                      {act.details?.name && (
                        <p className="font-semibold text-gray-800">
                          {act.details.name}
                        </p>
                      )}

                      {/* Updated fields if any */}
                      {act.details?.updatedFields && act.details.updatedFields.length > 0 && (
                        <p className="text-gray-600">
                          Updated fields: {act.details.updatedFields.join(", ")}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Menu Items */}
{act.action.toLowerCase().includes("menu item") && (
  <div className="mt-2 text-sm text-gray-700 space-y-2">
    {/* Item name */}
    {act.details?.name && (
      <p className="font-semibold text-gray-800">
        Item: {act.details.name}
      </p>
    )}

    {/* Restaurant name */}
    {act.details?.restaurant && (
      <p className="text-gray-700">
        Restaurant: {act.details.restaurant}
      </p>
    )}

    {/* Price when created */}
    {act.action.toLowerCase().includes("created") &&
      act.details?.price !== undefined && (
        <p className="text-gray-700">
          Price: ${Number(act.details.price).toFixed(2)}
        </p>
      )}

    {/* Updated fields */}
    {act.action.toLowerCase().includes("updated") &&
      act.details?.updatedFields &&
      act.details.updatedFields.length > 0 && (
        <p className="text-gray-600">
          Updated fields: {act.details.updatedFields.join(", ")}
        </p>
      )}
  </div>
)}
                  {/* Orders */}
                  {act.details?.orderId && (
                    <div className="mt-2 text-sm text-gray-700 space-y-2">
                      {/* Status + Amount in one row */}
                      <div className="pt-2 border-t border-gray-200 flex items-center space-x-4">
                        {act.details.newStatus && (
                          <span className="font-semibold text-gray-800">
                            Status: {getStatusBadge(act.details.newStatus)}
                          </span>
                        )}
                        <span className="font-semibold text-gray-800">Amount:</span>
                        {act.details.total !== undefined && (
                          <span>${Number(act.details.total).toFixed(2)}</span>
                        )}
                      </div>

                      {/* Order ID + Product names in one line */}
                      <div className="pt-2 border-t border-gray-200 flex flex-wrap items-center">
                        <span className="font-semibold text-gray-800 mr-2">Order:</span>
                        <Link
                          to={`/admin/orders/${act.details.orderId}`}
                          className="text-green-600 hover:underline font-semibold mr-2"
                        >
                          #{act.details.orderId.slice(-6)}
                        </Link>

                        {act.details.products && act.details.products.length > 0 && (
                          <>
                            <span className="font-semibold text-gray-800 mr-2">Item:</span>
                            <span className="text-gray-600">
                              {act.details.products.map((p: any) => (
                                <span key={p.name} className="mr-2">
                                  {p.name} x{p.qty}
                                </span>
                              ))}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Feedbacks */}
                  {act.details?.feedbackId && (
                    <div className="mt-2 text-sm text-gray-700 space-y-2">
                      {/* Status + Priority in one row */}
                      <div className="pt-2 border-t border-gray-200 flex items-center space-x-4">
                        {act.details.newStatus && (
                          <div className="flex items-center">
                            <span className="font-semibold text-gray-800 mr-2">Status:</span>
                            {getStatusBadge(act.details.newStatus)}
                          </div>
                        )}
                        {act.details.newPriority && (
                          <div className="flex items-center">
                            <span className="font-semibold text-gray-800 mr-2">Priority:</span>
                            {getPriorityBadge(act.details.newPriority)}
                          </div>
                        )}
                      </div>

                      {/* Subject + Type */}
                      <div className="pt-2 border-t border-gray-200 flex flex-wrap items-center">
                        <span className="font-semibold text-gray-800 mr-2">Subject:</span>
                        <Link
                          to={`/admin/feedback/${act.details.feedbackId}`}
                          className="text-purple-600 hover:underline mr-2"
                        >
                          “{act.details.subject || "No Subject"}”
                        </Link>
                        <span className="font-semibold text-gray-800 mr-2">Type:</span>
                        <span className="text-gray-700">{act.details.type || "N/A"}</span>
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-gray-500">{new Date(act.createdAt).toLocaleString()}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    ) : (
      <p className="text-gray-500">No recent activity</p>
    )}
  </div>
</div>


      </div>

      {/* Popular Products & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Popular Products */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200 flex items-center space-x-2">
  <Star className="text-yellow-500" />
  <h2 className="text-lg font-semibold text-gray-900">Popular Products</h2>
</div>
          <div className="p-6">
            {analytics?.popularProducts?.length > 0 ? (
              <div className="space-y-4">
                {analytics.popularProducts.map((product: any, index: number) => (
                  <div key={product._id} className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-orange-600">{index + 1}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className="flex items-center space-x-1">
                          <Package size={12} />
                          <span>{product.totalOrders} orders</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Star size={12} />
                          <span>{product.averageRating || 0}/5</span>
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No product data available</p>
            )}
          </div>
        </div>

       {/* Recent Orders */}
<div className="bg-white rounded-lg shadow-sm border">
  <div className="p-6 border-b border-gray-200 flex items-center space-x-2">
    <ShoppingCart className="text-green-500" />
    <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
  </div>
  <div className="p-6">
    {analytics?.recentOrders?.length > 0 ? (
      <div className="max-h-80 overflow-y-auto pr-2 space-y-4"> {/* 👈 Scrollable wrapper */}
        {analytics.recentOrders.map((order: any) => (
          <div key={order._id} className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Order #{order._id.slice(-8)}</p>
              <p className="text-sm text-gray-600">{order.user?.name || "Unknown User"}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-gray-900">${order.totalAmount.toFixed(2)}</p>
              <span
                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  order.orderStatus === "delivered"
                    ? "bg-green-100 text-green-800"
                    : order.orderStatus === "cancelled"
                    ? "bg-red-100 text-red-800"
                    : "bg-blue-100 text-blue-800"
                }`}
              >
                {formatStatus(order.orderStatus)}
              </span>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <p className="text-gray-500">No recent orders</p>
    )}
  </div>
</div>


      </div>
    </div>
  );
};

export default AdminDashboard;
