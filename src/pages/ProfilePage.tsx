import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Edit2,
  Save,
  X,
  Lock,
  ShoppingBag,
  Heart,
  Clock,
  Star,
  Package,
  MessageSquare,
  Settings,
  Award,
  DollarSign,
  ClipboardList,
  CheckCircle,
  Activity,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import { Link, useNavigate } from "react-router-dom";
import LoadingSpinner from "../components/UI/LoadingSpinner";

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

const getStatusColor = (status: string) => {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "confirmed":
      return "bg-blue-100 text-blue-800";
    case "delivered":
      return "bg-green-100 text-green-800";
    case "cancelled":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};


const ProfilePage: React.FC = () => {
  const { user, logout, setUser } = useAuth();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const API_URL = import.meta.env.VITE_API_URL;
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
  const [isViewingOrder, setIsViewingOrder] = useState(false);
  const [viewOrder, setViewOrder] = useState<any | null>(null);
  const [expandedFeedback, setExpandedFeedback] = useState<string | null>(null);
  const [orderProductsCache, setOrderProductsCache] = useState<Record<string, any[]>>({});

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
    },
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);

        const profileRes = await axios.get(`${API_URL}/users/profile`, {
          withCredentials: true,
        });
        const userData = profileRes.data;
        setFormData({
          name: userData.name || "",
          email: userData.email || "",
          phone: userData.phone || "",
          address: userData.address || { street: "", city: "", state: "", zipCode: "" },
        });

        // Fetch dashboard data
        const [ordersRes, favoritesRes, recommendationsRes, feedbackRes, activitiesRes] =
          await Promise.all([
            axios.get(`${API_URL}/orders/my-orders`, { withCredentials: true }),
axios.get(`${API_URL}/users/favorites`, { withCredentials: true }),
axios.get(`${API_URL}/products?limit=4&sortBy=averageRating&sortOrder=desc`),
axios.get(`${API_URL}/feedback/my-feedback`, { withCredentials: true }),
axios.get(`${API_URL}/users/my-activities`, { withCredentials: true }),

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
            averageRating: 4.5,
          },
          recentOrders: orders.slice(0, 5),
          favoriteRestaurants: favoritesRes.data || [],
          recommendations: Array.isArray(recommendationsRes.data)
            ? recommendationsRes.data
            : recommendationsRes.data?.products || [],
          feedbacks: feedbackRes.data || [],
          loading: false,
        });
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to fetch all data");
        setLoading(false);
      }finally {
      setLoading(false); // ✅ always reset
    }
    };

    if (user) {
      fetchAllData();
    }
  }, [user, setUser]); // Kept `setUser` in dependencies because it's used in another function.
                       // The fix is actually in `AuthContext.tsx` to prevent the loop.
                       // However, this `setUser` call is now also removed from `fetchAllData` to be safe.
  
  const fetchDashboardData = async () => {
    try {
      const [ordersRes, favoritesRes, recommendationsRes, feedbackRes, activitiesRes] =
        await Promise.all([
          axios.get(`${API_URL}/orders/my-orders`, { withCredentials: true }),
          axios.get(`${API_URL}/users/favorites`, { withCredentials: true }),
          axios.get(`${API_URL}/products?limit=4&sortBy=averageRating&sortOrder=desc`),
          axios.get(`${API_URL}/feedback/my-feedback`, { withCredentials: true }),
          axios.get(`${API_URL}/users/my-activities`, { withCredentials: true }),

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
          averageRating: 4.5,
        },
        recentOrders: orders.slice(0, 5),
        favoriteRestaurants: favoritesRes.data || [],
        recommendations: Array.isArray(recommendationsRes.data)
          ? recommendationsRes.data
          : recommendationsRes.data?.products || [],
        feedbacks: feedbackRes.data || [],
        loading: false,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setDashboardData((prev: any) => ({ ...prev, loading: false }));
    }
  };

  const fetchUserProfile = async () => {
    try {
      const response = await axios.get(`${API_URL}/users/profile`, {
        withCredentials: true,
      });
      const userData = response.data;
      setFormData({
        name: userData.name || "",
        email: userData.email || "",
        phone: userData.phone || "",
        address: userData.address || {
          street: "",
          city: "",
          state: "",
          zipCode: "",
        },
      });
    } catch (error) {
      console.error("Error fetching user profile:", error);
      toast.error("Failed to fetch profile data");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name.includes("address.")) {
      const addressField = name.split(".")[1];
      setFormData({
        ...formData,
        address: { ...formData.address, [addressField]: value },
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const response = await axios.put(
        `${API_URL}/users/profile`,
        {
          name: formData.name,
          phone: formData.phone,
          address: formData.address,
        },
        { withCredentials: true }
      );
      setUser(response.data);
      setIsEditing(false);
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    fetchUserProfile();
    setIsEditing(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUploadImage = async () => {
    if (!selectedFile) {
      toast.error("Please select an image first");
      return;
    }

    const formDataImg = new FormData();
    formDataImg.append("profileImage", selectedFile);
    try {
      const response = await axios.put(
        `${API_URL}/users/profile/upload`,
        formDataImg,
        {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      setUser((prev: any) => (prev ? { ...prev, profileImage: response.data.profileImage } : prev));
      toast.success("Profile image updated successfully!");
      setSelectedFile(null);
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      const res = await axios.put(
        `${API_URL}/users/profile/change-password`,
        {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        },
        { withCredentials: true }
      );
      toast.success(res.data.message || "Password updated successfully. Please log in again.");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setIsChangingPassword(false);
      setTimeout(() => {
        toast.info("You have been logged out");
        logout("expired");
      }, 2000);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update password");
    }
  };

useEffect(() => {
  if (!loading && !user) {
    navigate("/login");
  }
}, [user, loading, navigate]);


  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="px-6 py-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 rounded-full overflow-hidden border">
                  {user.profileImage ? (
                    <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-full h-full text-gray-400" />
                  )}
                </div>

                {isEditing && (
                  <div className="mt-3">
                    <input type="file" accept="image/*" onChange={handleFileChange} />
                    <button
                      onClick={handleUploadImage}
                      className="mt-2 px-3 py-1 bg-blue-500 text-white rounded"
                    >
                      Upload Image
                    </button>
                  </div>
                )}
              </div>

              <div>
                <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
                <p className="text-gray-600">{user.role}</p>
              </div>
            </div>

            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                <Edit2 size={16} />
                <span>Edit Profile</span>
              </button>
            ) : (
              <div className="flex space-x-2">
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  <Save size={16} />
                  <span>{loading ? "Saving..." : "Save"}</span>
                </button>
                <button
                  onClick={handleCancel}
                  disabled={loading}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  <X size={16} />
                  <span>Cancel</span>
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                ) : (
                  <p>{formData.name}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <p>
                  {formData.email} <span className="text-xs text-gray-500">(Cannot be changed)</span>
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                {isEditing ? (
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                ) : (
                  <p>{formData.phone || "Not provided"}</p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Address Information</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Street</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="address.street"
                    value={formData.address.street}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                ) : (
                  <p>{formData.address.street || "Not provided"}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="address.city"
                      value={formData.address.city}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  ) : (
                    <p>{formData.address.city || "Not provided"}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="address.state"
                      value={formData.address.state}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  ) : (
                    <p>{formData.address.state || "Not provided"}</p>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ZIP</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="address.zipCode"
                    value={formData.address.zipCode}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                ) : (
                  <p>{formData.address.zipCode || "Not provided"}</p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8 border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Lock className="mr-2" size={18} /> Change Password
            </h3>
            {!isChangingPassword ? (
              <button
                onClick={() => setIsChangingPassword(true)}
                className="px-6 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600"
              >
                Change Password
              </button>
            ) : (
              <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Current Password</label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    className="mt-1 w-full px-3 py-2 border rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">New Password</label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    className="mt-1 w-full px-3 py-2 border rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    className="mt-1 w-full px-3 py-2 border rounded-md"
                    required
                  />
                </div>
                <div className="flex space-x-2">
                  <button
                    type="submit"
                    className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                  >
                    Update Password
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsChangingPassword(false)}
                    className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
      {/* ------------------- USER DASHBOARD SECTION ------------------- */}
      <div className="mt-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Your Dashboard 👋
        </h1>
        <p className="text-gray-600 mt-2">
          Here's what's happening with your food orders
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 my-8">
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
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

          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b border-gray-200 flex items-center space-x-2">
              <MessageSquare className="text-purple-500" />
              <h2 className="text-lg font-semibold text-gray-900">Your Feedback</h2>
            </div>
            <div className="p-6 max-h-80 overflow-y-auto space-y-4">
              {dashboardData.feedbacks && dashboardData.feedbacks.length > 0 ? (
                dashboardData.feedbacks.map((fb: any) => {
                  const isExpanded = expandedFeedback === fb._id;
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
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${color}`}>
                        <Icon className="w-5 h-5" />
                      </div>

                      <div className="flex-1 space-y-3">
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
                                  i <= (fb.rating || 0) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                                }
                              />
                            ))}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-gray-200 flex items-center space-x-4">
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

                        <div className="pt-2 border-t border-gray-200 flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-800">
                            {fb.subject || fb.message}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(fb.createdAt).toLocaleDateString()}
                          </p>
                        </div>

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
                                Responded on: {new Date(fb.adminResponse.respondedAt).toLocaleString()}
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
            <div className="p-6 max-h-80 overflow-y-auto">
              {dashboardData.recentOrders.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.recentOrders.map((order: any) => (
                    <div
                      key={order._id}
                      className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <button
                          onClick={() => {
                            setViewOrder(order);
                            setIsViewingOrder(true);
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
                      <p className="text-xs text-gray-500 mb-2">
                        Placed on: {order.createdAt ? new Date(order.createdAt).toLocaleString() : ""}
                      </p>
                      <div className="space-y-1 mb-2">
                        {order.items?.map((item: any, i: number) => (
                          <p key={i} className="text-sm text-gray-700">
                            {item.product?.name} × {item.quantity}
                          </p>
                        ))}
                      </div>
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

        <div className="mt-8 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg shadow-sm text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold mb-2">🎉 Food Explorer Badge</h2>
              <p className="text-orange-100">
                You've ordered from {Math.min(dashboardData.stats.totalOrders, 5)} different restaurants!{" "}
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

        <div className="bg-white rounded-lg shadow-sm border mt-8">
          <div className="p-6 border-b border-gray-200 flex items-center space-x-2">
            <Activity className="text-blue-500" />
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
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
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {act.action === "placed an order" && "You placed an order"}
                            {act.action === "cancelled an order" && "You cancelled an order"}
                            {act.action === "submitted feedback" && "You submitted feedback"}
                            {act.action === "reviewed an order" && "You reviewed an order"}
                            {act.action === "added favourite" && "You added a favourite food"}
                            {act.action === "profile updated" && "You updated your profile"}
                          </p>

                          <div className="mt-2 text-sm text-gray-700 space-y-2">
                            {act.action.includes("order") && (
                              <div className="pt-2 border-t border-gray-200 space-y-2">
                                <div className="flex items-center space-x-4">
                                  <span className="flex items-center">
                                    <span className="font-semibold text-gray-800 mr-2">Status:</span>
                                    {getStatusBadge(
                                      act.details?.newStatus || (act.action === "cancelled an order" ? "cancelled" : "pending")
                                    )}
                                  </span>
                                  {act.details?.total !== undefined && (
                                    <span className="font-semibold text-gray-800">
                                      Amount: ${Number(act.details.total).toFixed(2)}
                                    </span>
                                  )}
                                </div>

                                {act.details?.orderId && (
                                  <div className="flex items-center">
                                    <span className="font-semibold text-gray-800 mr-2">Order:</span>
                                    <button
                                      onClick={async () => {
                                        try {
                                          const res = await axios.get(`${API_URL}/orders/${act.details.orderId}`, { withCredentials: true });
                                          setViewOrder(res.data);
                                          setIsViewingOrder(true);
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

                                {(() => {
                                  const products =
                                    act.details?.products?.length > 0
                                      ? act.details.products
                                      : orderProductsCache[act.details?.orderId || ""];

                                  if (!products && act.details?.orderId) {
                                    axios.get(`${API_URL}/orders/${act.details.orderId}`, { withCredentials: true })

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

                            {act.action === "submitted feedback" && (
                              <div className="pt-2 border-t border-gray-200 space-y-1">
                                <div className="flex items-center space-x-4">
                                  {act.details?.status && (
                                    <span className="flex items-center">
                                      <span className="font-semibold text-gray-800 mr-2">Status:</span>
                                      {getStatusBadge(act.details.status)}
                                    </span>
                                  )}
                                  {act.details?.priority && (
                                    <span className="flex items-center">
                                      <span className="font-semibold text-gray-800 mr-2">Priority:</span>
                                      {getPriorityBadge(act.details.priority)}
                                    </span>
                                  )}
                                </div>
                                <div className="flex flex-wrap items-center">
                                  <span className="font-semibold text-gray-800 mr-2">Subject:</span>
                                  <span className="text-purple-600 font-medium mr-2">
                                    “{act.details?.subject || "No Subject"}”
                                  </span>
                                  <span className="font-semibold text-gray-800 mr-2">Type:</span>
                                  <span className="text-gray-700">{act.details?.type || "N/A"}</span>
                                </div>
                              </div>
                            )}

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

                            {act.action === "added favourite" && (
                              <div className="pt-2 border-t border-gray-200">
                                <p>
                                  {act.details?.name} – ${act.details?.price} (
                                  {act.details?.rating}★)
                                </p>
                              </div>
                            )}

                            {act.action === "profile updated" && (
                              <div className="pt-2 border-t border-gray-200">
                                <p>Changed: {act.details?.fields?.join(", ")}</p>
                              </div>
                            )}
                          </div>

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
              <p className="text-gray-500 text-center py-8">No recent activity</p>
            )}
          </div>
        </div>
      </div>

      {isViewingOrder && viewOrder && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white w-full max-w-2xl p-6 rounded-lg shadow-lg relative overflow-y-auto max-h-[90vh]">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
              onClick={() => setIsViewingOrder(false)}
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
              {viewOrder.deliveryAddress && (
                <div>
                  <h3 className="font-semibold mb-1">Delivery Address</h3>
                  <p className="text-sm text-gray-700">
                    {viewOrder.deliveryAddress.street}, {viewOrder.deliveryAddress.city},{" "}
                    {viewOrder.deliveryAddress.state} {viewOrder.deliveryAddress.zipCode}
                  </p>
                </div>
              )}
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
              {viewOrder.orderStatus !== "delivered" && viewOrder.orderStatus !== "cancelled" && (
                <button
                  onClick={async () => {
                    if (!window.confirm("⚠️ Are you sure you want to cancel this order?")) {
                      return;
                    }
                    try {
                      await axios.put(
  `${API_URL}/orders/${viewOrder._id}/cancel`,
  { reason: "Cancelled from dashboard" },
  { withCredentials: true }
);

                      alert("Order cancelled successfully!");
                      setIsViewingOrder(false);
                      fetchDashboardData();
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
    </div>
  );
};

export default ProfilePage;