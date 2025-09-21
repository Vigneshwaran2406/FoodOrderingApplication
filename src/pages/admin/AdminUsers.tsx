import React, { useState, useEffect } from "react";
import {
  Users,
  Mail,
  Phone,
  MapPin,
  Plus,
  AlertCircle,
  ChevronLeft, 
  ChevronRight,
  ClipboardList, MessageSquare, UserCheck, Activity,User,ShoppingCart,HeartIcon,X,
  UserCircle,Star
} from "lucide-react";
import axios from "axios";
import { Link } from "react-router-dom";

// Status Badge
const formatStatus = (status: string) => {
  if (!status) return "";
  return status
    .replace(/-/g, " ") // replace dashes with spaces
    .replace(/\b\w/g, (char) => char.toUpperCase()); // capitalize each word
};
const API_URL = import.meta.env.VITE_API_URL;
const getStatusBadge = (status: string) => {
  if (!status) return null;
  let classes = "bg-gray-100 text-gray-800";

  if (status === "delivered" || status === "resolved")
    classes = "bg-green-100 text-green-800";
  else if (status === "cancelled" || status === "closed")
    classes = "bg-red-100 text-red-800";
  else if (status === "in-progress")
    classes = "bg-blue-100 text-blue-800";
  else if (status === "confirmed")
    classes = "bg-blue-100 text-blue-800";
  else if (status === "preparing")
    classes = "bg-orange-100 text-orange-800";
  else if (status === "pending")
    classes = "bg-yellow-100 text-yellow-800";
  else if (status === "out-for-delivery")
    classes = "bg-purple-100 text-purple-800";

  return (
    <span
      className={`ml-2 inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${classes}`}
    >
      {formatStatus(status)}
    </span>
  );
};


const getPriorityBadge = (priority: string) => {
  if (!priority) return null;
  let classes = "bg-gray-100 text-gray-800";

  if (priority === "high") classes = "bg-red-100 text-red-800";
  else if (priority === "medium") classes = "bg-yellow-100 text-yellow-800";
  else if (priority === "low") classes = "bg-green-100 text-green-800";

  return (
    <span
      className={`ml-2 inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${classes}`}
    >
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </span>
  );
};

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const usersPerPage = 5;
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedUserDetails, setSelectedUserDetails] = useState<any>(null);  
  const [viewLoading, setViewLoading] = useState(false);


  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "user",
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
    },
  });

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const showMessage = (message: string, type: "success" | "error") => {
    if (type === "success") {
      setSuccess(message);
      setError("");
      setTimeout(() => setSuccess(""), 3000);
    } else {
      setError(message);
      setSuccess("");
      setTimeout(() => setError(""), 5000);
    }
  };

  const fetchUsers = async () => {
    try {
      const url = roleFilter
        ? `${API_URL}/admin/users?role=${roleFilter}`
        : `${API_URL}/admin/users`;

      const response = await axios.get(url);
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
      showMessage("Failed to fetch users", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        "${API_URL}/admin/users",
        formData
      );
      const newUser = response.data.user;
      setUsers((prev) => [newUser, ...prev]);
      setShowModal(false);
      resetForm();
      showMessage("User created successfully!", "success");
    } catch (error: any) {
      console.error("Error creating user:", error);
      const errorMessage =
        error.response?.data?.message || "Error creating user";
      showMessage(errorMessage, "error");
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      const response = await axios.put(
        `${API_URL}/admin/users/${editingUser._id}`,
        formData
      );
      const updatedUser = response.data.user;
      setUsers((prev) =>
        prev.map((u) => (u._id === updatedUser._id ? updatedUser : u))
      );
      setShowEditModal(false);
      setEditingUser(null);
      resetForm();
      showMessage("User updated successfully!", "success");
    } catch (error: any) {
      console.error("Error updating user:", error);
      const errorMessage =
        error.response?.data?.message || "Error updating user";
      showMessage(errorMessage, "error");
    }
  };

  const handleDelete = async () => {
    if (!userToDelete) return;
    try {
      await axios.delete(`${API_URL}/admin/users/${userToDelete}`);
      setUsers((prev) => prev.filter((u) => u._id !== userToDelete));
      setShowDeleteModal(false);
      setUserToDelete(null);
      showMessage("User deleted successfully!", "success");
    } catch (error: any) {
      console.error("Error deleting user:", error);
      setShowDeleteModal(false);
      setUserToDelete(null);
      showMessage(error.response?.data?.message || "Error deleting user", "error");
    }
  };

  const toggleUserStatus = async (userId: string) => {
    try {
      await axios.put(
        `${API_URL}/admin/users/${userId}/toggle-status`
      );
      setUsers((prev) =>
        prev.map((u) =>
          u._id === userId ? { ...u, isActive: !u.isActive } : u
        )
      );
      showMessage("User status updated successfully!", "success");
    } catch (error) {
      console.error("Error toggling user status:", error);
      showMessage("Failed to update user status", "error");
    }
  };
const fetchUserDetails = async (userId: string) => {
  try {
    setViewLoading(true);
    const response = await axios.get(`${API_URL}/admin/users/${userId}/details`);
    setSelectedUserDetails(response.data);
    setShowViewModal(true);
  } catch (error) {
    console.error("Error fetching user details:", error);
    showMessage("Failed to fetch user details", "error");
  } finally {
    setViewLoading(false);
  }
};

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      phone: "",
      role: "user",
      address: {
        street: "",
        city: "",
        state: "",
        zipCode: "",
      },
    });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
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

  const handleEdit = (user: any) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: "",
      phone: user.phone || "",
      role: user.role,
      address: user.address || {
        street: "",
        city: "",
        state: "",
        zipCode: "",
      },
    });
    setShowEditModal(true);
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.phone && user.phone.includes(searchQuery))
  );

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

  const getPaginationNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, "...", totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(
          1,
          "...",
          currentPage - 1,
          currentPage,
          currentPage + 1,
          "...",
          totalPages
        );
      }
    }
    return pages;
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p>Loading...</p>
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
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>Add User</span>
        </button>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 space-y-2 md:space-y-0">
        <input
          type="text"
          placeholder="Search by name, email, or phone..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full md:w-1/3"
        />

        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Users size={20} />
          <span>{filteredUsers.length} users</span>
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setCurrentPage(1);
              fetchUsers();
            }}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="">All Roles</option>
            <option value="user">Users</option>
            <option value="admin">Admins</option>
          </select>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentUsers.map((user: any) => (
                <tr key={user._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
  <div className="flex items-center">
    <div className="w-10 h-10 rounded-full overflow-hidden bg-orange-100 flex items-center justify-center">
      {user.profileImage ? (
        <img
          src={user.profileImage}
          alt={user.name}
          className="w-full h-full object-cover"
        />
      ) : (
        <span className="text-orange-600 font-semibold text-sm">
          {user.name.charAt(0).toUpperCase()}
        </span>
      )}
    </div>
    <div className="ml-4">
      <div className="text-sm font-medium text-gray-900">
        {user.name}
      </div>
      <div className="text-sm text-gray-500">
        {user.role} • ID: {user._id.slice(-8)}
      </div>
    </div>
  </div>
</td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <div className="flex items-center text-sm text-gray-900">
                        <Mail size={14} className="mr-2 text-gray-400" />
                        {user.email}
                      </div>
                      {user.phone && (
                        <div className="flex items-center text-sm text-gray-500">
                          <Phone size={14} className="mr-2 text-gray-400" />
                          {user.phone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.address &&
                    (user.address.street || user.address.city) ? (
                      <div className="flex items-center text-sm text-gray-900">
                        <MapPin size={14} className="mr-2 text-gray-400" />
                        <span>
                          {user.address.street && `${user.address.street}, `}
                          {user.address.city}
                          {user.address.state && `, ${user.address.state}`}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">No address</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={user.isActive}
                        onChange={() => toggleUserStatus(user._id)}
                        className="sr-only"
                      />
                      <div
                        className={`w-11 h-6 rounded-full transition-colors ${
                          user.isActive ? "bg-green-500" : "bg-gray-300"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                            user.isActive ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </div>
                      <span
                        className={`ml-2 text-sm font-medium ${
                          user.isActive ? "text-green-600" : "text-red-500"
                        }`}
                      >
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    </label>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap flex items-center space-x-2">
                    <button
  onClick={() => fetchUserDetails(user._id)}
  className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm font-medium"
>
  View
</button>
                    <button
                      onClick={() => handleEdit(user)}
                      className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        setUserToDelete(user._id);
                        setShowDeleteModal(true);
                      }}
                      className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center mt-4 space-x-2">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
            className="px-3 py-1 border rounded disabled:opacity-50 flex items-center"
          >
            <ChevronLeft size={18} />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((page) => {
              if (page === 1 || page === totalPages) return true;
              if (page >= currentPage - 1 && page <= currentPage + 1) return true;
              return false;
            })
            .map((page, idx, arr) => {
              const prevPage = arr[idx - 1];
              return (
                <React.Fragment key={page}>
                  {prevPage && page - prevPage > 1 && (
                    <span className="px-2">...</span>
                  )}
                  <button
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 border rounded ${
                      currentPage === page
                        ? "bg-orange-500 text-white"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    {page}
                  </button>
                </React.Fragment>
              );
            })}
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
            className="px-3 py-1 border rounded disabled:opacity-50 flex items-center"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {filteredUsers.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <Users size={64} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No users found
          </h3>
          <p className="text-gray-500">No users have registered yet.</p>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Add New User
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength={6}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Role
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Street
                </label>
                <input
                  type="text"
                  name="address.street"
                  value={formData.address.street}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    City
                  </label>
                  <input
                    type="text"
                    name="address.city"
                    value={formData.address.city}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    State
                  </label>
                  <input
                    type="text"
                    name="address.state"
                    value={formData.address.state}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Zip Code
                  </label>
                  <input
                    type="text"
                    name="address.zipCode"
                    value={formData.address.zipCode}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600"
                >
                  Add User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Edit User</h3>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Role
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Street
                </label>
                <input
                  type="text"
                  name="address.street"
                  value={formData.address.street}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    City
                  </label>
                  <input
                    type="text"
                    name="address.city"
                    value={formData.address.city}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    State
                  </label>
                  <input
                    type="text"
                    name="address.state"
                    value={formData.address.state}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Zip Code
                  </label>
                  <input
                    type="text"
                    name="address.zipCode"
                    value={formData.address.zipCode}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-96">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirm Deletion
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this user? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setUserToDelete(null);
                }}
                className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}


{showViewModal && selectedUserDetails && (
  <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
    <div className="relative top-6 mx-auto p-6 border w-11/12 md:w-4/5 shadow-lg rounded-md bg-white">
      
      {/* === Top Bar with Back + Close === */}
      <div className="flex justify-between items-center mb-6">
        {/* Back Button */}
        <button
          onClick={() => setShowViewModal(false)}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          <span className="font-medium">Back</span>
        </button>

        {/* Title */}
        <h3 className="text-xl font-bold text-gray-900">User Details</h3>

        {/* Close Button */}
        <button
          onClick={() => setShowViewModal(false)}
          className="text-gray-600 hover:text-gray-900"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {viewLoading ? (
        <p>Loading...</p>
      ) : (
        <div className="space-y-6">
          {/* === Profile Section === */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
  {/* === User Overview Card === */}
  <div className="bg-white rounded-lg shadow-sm border">
    {/* Header */}
    <div className="p-6 border-b border-gray-200 flex items-center space-x-2">
      <UserCircle className="text-blue-500 w-5 h-5" />
      <h2 className="text-lg font-semibold text-gray-900">User Overview</h2>
    </div>
    {/* Body */}
    <div className="p-6 flex flex-col items-center text-center">
      {/* Profile Image */}
      <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center mb-4 overflow-hidden">
        {selectedUserDetails.user.profileImage ? (
          <img
            src={selectedUserDetails.user.profileImage}
            alt="Profile"
            className="w-full h-full object-cover"
          />
        ) : (
          <User className="w-10 h-10 text-gray-400" />
        )}
      </div>

      {/* Status + Role */}
      <div className="mb-3 flex flex-wrap gap-2 justify-center">
        {selectedUserDetails.user.isActive ? (
          <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
            Active
          </span>
        ) : (
          <span className="px-3 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
            Inactive
          </span>
        )}
        <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
          {selectedUserDetails.user.role}
        </span>
      </div>

      {/* Last Login / Logout */}
      <p className="text-sm text-gray-600">
        <strong>Last Login:</strong>{" "}
        {selectedUserDetails.lastLogin
          ? new Date(selectedUserDetails.lastLogin).toLocaleString()
          : "Never"}
      </p>
      <p className="text-sm text-gray-600">
        <strong>Last Logout:</strong>{" "}
        {selectedUserDetails.lastLogout
          ? new Date(selectedUserDetails.lastLogout).toLocaleString()
          : "Never"}
      </p>
    </div>
  </div>

  {/* === Profile Details Card === */}
  <div className="bg-white rounded-lg shadow-sm border">
    {/* Header */}
    <div className="p-6 border-b border-gray-200 flex items-center space-x-2">
      <User className="text-purple-500 w-5 h-5" />
      <h2 className="text-lg font-semibold text-gray-900">Profile Details</h2>
    </div>
    {/* Body */}
    <div className="p-6 space-y-2 text-sm text-gray-700">
      <p><Mail className="inline w-4 h-4 mr-1 text-gray-500" /> <strong>Name:</strong> {selectedUserDetails.user.name}</p>
      <p><Mail className="inline w-4 h-4 mr-1 text-gray-500" /> <strong>Email:</strong> {selectedUserDetails.user.email}</p>
      <p><Phone className="inline w-4 h-4 mr-1 text-gray-500" /> <strong>Phone:</strong> {selectedUserDetails.user.phone || "N/A"}</p>
      <div>
        <MapPin className="inline w-4 h-4 mr-1 text-gray-500" /> <strong>Address:</strong>
        {selectedUserDetails.user.address ? (
          <div className="ml-6 mt-1 space-y-1">
            <p><strong>Street:</strong> {selectedUserDetails.user.address.street}</p>
            <p><strong>City:</strong> {selectedUserDetails.user.address.city}</p>
            <p><strong>State:</strong> {selectedUserDetails.user.address.state}</p>
            <p><strong>Zip Code:</strong> {selectedUserDetails.user.address.zipCode}</p>
          </div>
        ) : (
          <span className="ml-2">N/A</span>
        )}
      </div>
    </div>
  </div>
</div>
          {/* Orders & Feedbacks side by side */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  {/* Orders */}
  <div className="bg-white rounded-lg shadow-sm border">
    <div className="p-6 border-b border-gray-200 flex items-center space-x-2">
      <ShoppingCart className="text-green-500 w-5 h-5" />
      <h4 className="text-lg font-semibold">Orders</h4>
    </div>
    <div className="p-6 max-h-60 overflow-y-auto space-y-3">
      {selectedUserDetails.orders.length > 0 ? (
        selectedUserDetails.orders.slice(0, 5).map((order: any) => (
          <div key={order._id} className="border-b pb-2">
            <p className="text-sm font-semibold">
              Order{" "}
              <Link
                to={`/admin/orders/${order._id}`}
                className="text-green-600 hover:underline"
              >
                #{order._id.slice(-6)}
              </Link>
            </p>
            <div className="flex items-center space-x-2 text-sm">
              <span>Status:</span>
              {getStatusBadge(order.orderStatus)}
            </div>
            <p className="text-sm">Total: ₹{order.totalAmount}</p>
            <p className="text-xs text-gray-500">
              Placed: {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>
        ))
      ) : (
        <p className="text-gray-500">No orders found</p>
      )}
    </div>
  </div>

  {/* Feedbacks */}
  <div className="bg-white rounded-lg shadow-sm border">
    <div className="p-6 border-b border-gray-200 flex items-center space-x-2">
      <MessageSquare className="text-pink-500 w-5 h-5" />
      <h4 className="text-lg font-semibold">Feedbacks</h4>
    </div>
    <div className="p-6 max-h-60 overflow-y-auto space-y-3">
      {selectedUserDetails.feedbacks.length > 0 ? (
        selectedUserDetails.feedbacks.slice(0, 5).map((fb: any) => (
          <div key={fb._id} className="border-b pb-2">
            <p className="text-sm font-semibold">
              Feedback{" "}
              <Link
                to={`/admin/feedback/${fb._id}`}
                className="text-purple-600 hover:underline"
              >
                #{fb._id.slice(-6)}
              </Link>
            </p>
            <div className="flex items-center space-x-2 text-sm">
              <span>Status:</span>
              {getStatusBadge(fb.status)}
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <span>Priority:</span>
              {getPriorityBadge(fb.priority)}
            </div>
            <p className="text-xs text-gray-500">
              Submitted: {new Date(fb.createdAt).toLocaleString()}
            </p>
          </div>
        ))
      ) : (
        <p className="text-gray-500">No feedbacks found</p>
      )}
    </div>
  </div>
</div>


          {/* Favorites & Recent Activity side by side */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  {/* Favorites */}
  <div className="bg-white rounded-lg shadow-sm border">
    <div className="p-6 border-b border-gray-200 flex items-center space-x-2">
      <Star className="text-yellow-500 w-5 h-5" />
      <h4 className="text-lg font-semibold">Favorites</h4>
    </div>
    <div className="p-6 max-h-60 overflow-y-auto space-y-2">
      {selectedUserDetails.favorites.length > 0 ? (
        selectedUserDetails.favorites.map((fav: any) => (
          <div key={fav._id} className="text-sm">
            {fav.name} – ₹{fav.price}
          </div>
        ))
      ) : (
        <p className="text-gray-500">No favorites found</p>
      )}
    </div>
  </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b border-gray-200 flex items-center space-x-2">
                <Activity className="text-blue-500" />
                <h4 className="text-lg font-semibold text-gray-900">Recent Activity</h4>
              </div>
              <div className="p-6 max-h-60 overflow-y-auto pr-2">
                {selectedUserDetails.activities?.length > 0 ? (
                  <ul className="space-y-4">
                    {selectedUserDetails.activities.slice(0, 5).map((act: any, index: number) => {
                      let Icon = ClipboardList;
                      let color = "text-blue-600 bg-blue-100";

                      if (act.action.includes("order")) {
                        Icon = ClipboardList;
                        color = "text-green-600 bg-green-100";
                      } else if (act.action.includes("feedback")) {
                        Icon = MessageSquare;
                        color = "text-purple-600 bg-purple-100";
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
                            <p className="text-sm text-gray-800">{act.action}</p>

                            {/* Orders */}
                            {act.details?.orderId && (
                              <div className="mt-2 text-sm text-gray-700 space-y-2">
                                <div className="pt-2 border-t border-gray-200 flex items-center space-x-4">
                                  {act.details.newStatus && (
                                    <span className="font-semibold text-gray-800">
                                      Status: {getStatusBadge(act.details.newStatus)}
                                    </span>
                                  )}
                                  <span className="font-semibold text-gray-800">Amount:</span>
                                  {act.details.total !== undefined && (
                                    <span>₹{Number(act.details.total).toFixed(2)}</span>
                                  )}
                                </div>
                                <div className="pt-2 border-t border-gray-200 flex flex-wrap items-center">
                                  <span className="font-semibold text-gray-800 mr-2">Order:</span>
                                  <Link
                                    to={`/admin/orders/${act.details.orderId}`}
                                    className="text-green-600 hover:underline font-semibold mr-2"
                                  >
                                    #{act.details.orderId.slice(-6)}
                                  </Link>
                                  {act.details.products?.length > 0 && (
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
                ) : (
                  <p className="text-gray-500">No recent activity</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
)}

    </div>
  );
};

export default AdminUsers;
