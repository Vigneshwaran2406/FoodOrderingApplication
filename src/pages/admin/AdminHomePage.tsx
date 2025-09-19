// src/pages/admin/AdminHomePage.tsx
import React from "react";
import { Link } from "react-router-dom";
import {
  Users,
  ShoppingBag,
  Store,
  Package,
  MessageSquare,
  PlusCircle,
} from "lucide-react";

const AdminHomePage: React.FC = () => {
  // Dummy stats (replace with API calls later)
  const stats = [
    { title: "Users", value: 120, icon: <Users className="h-6 w-6 text-blue-500" />, link: "/admin/users" },
    { title: "Orders", value: 340, icon: <ShoppingBag className="h-6 w-6 text-green-500" />, link: "/admin/orders" },
    { title: "Restaurants", value: 15, icon: <Store className="h-6 w-6 text-orange-500" />, link: "/admin/restaurants" },
    { title: "Products", value: 220, icon: <Package className="h-6 w-6 text-purple-500" />, link: "/admin/products" },
    { title: "Feedback", value: 45, icon: <MessageSquare className="h-6 w-6 text-pink-500" />, link: "/admin/feedback" },
  ];

  // Dummy recent activity feed
  const recentActivity = [
    "User John placed order #1234 (₹550)",
    "New restaurant added: Spicy Biryani House",
    "Feedback received from Alice (5⭐)",
    "Product Pizza Margherita stock updated",
  ];

  return (
    <div className="p-6 space-y-8">
      {/* Heading */}
      <h1 className="text-2xl font-bold text-gray-800">Admin Home</h1>

      {/* Quick Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((item, idx) => (
          <Link
            key={idx}
            to={item.link}
            className="bg-white shadow rounded-lg p-5 flex items-center justify-between hover:shadow-md transition"
          >
            <div>
              <p className="text-sm text-gray-500">{item.title}</p>
              <p className="text-2xl font-bold text-gray-800">{item.value}</p>
            </div>
            <div className="bg-gray-100 p-3 rounded-full">{item.icon}</div>
          </Link>
        ))}
      </div>

      {/* Quick Actions Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          <Link
            to="/admin/restaurants"
            className="flex items-center px-4 py-2 bg-orange-500 text-white rounded-lg shadow hover:bg-orange-600"
          >
            <PlusCircle className="mr-2 h-5 w-5" /> Add Restaurant
          </Link>
          <Link
            to="/admin/products"
            className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600"
          >
            <PlusCircle className="mr-2 h-5 w-5" /> Add Product
          </Link>
          <Link
            to="/admin/users"
            className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg shadow hover:bg-green-600"
          >
            <PlusCircle className="mr-2 h-5 w-5" /> Add User
          </Link>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <div className="bg-white shadow rounded-lg divide-y">
          {recentActivity.map((activity, idx) => (
            <div key={idx} className="p-4 text-gray-700 text-sm">
              {activity}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminHomePage;
