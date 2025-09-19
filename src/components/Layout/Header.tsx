import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useCart } from "../../contexts/CartContext";
import {
  Menu,
  X,
  ShoppingCart,
  User,
  LogOut,
  Settings,
} from "lucide-react";

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const { getTotalItems } = useCart();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login"); // ✅ redirect to login after logout
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">DV</span>
            </div>
            <span className="text-xl font-bold text-gray-900">Picasso</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
           

            <Link
              to="/restaurants"
              className="text-gray-700 hover:text-orange-500 transition-colors"
            >
              Restaurants
            </Link>
            <Link
              to="/menu"
              className="text-gray-700 hover:text-orange-500 transition-colors"
            >
              Menu
            </Link>

            {/* ✅ Added Contact Page link (visible to everyone) */}
            <Link
              to="/contact"
              className="text-gray-700 hover:text-orange-500 transition-colors"
            >
              Contact
            </Link>

            {user && user.role === "user" && (
              <>
                <Link
                  to="/orders"
                  className="text-gray-700 hover:text-orange-500 transition-colors"
                >
                  Orders
                </Link>
                <Link
                  to="/feedback"
                  className="text-gray-700 hover:text-orange-500 transition-colors"
                >
                  Feedback
                </Link>
               
              </>
            )}

            {/* ✅ Always show Cart (guests + users) */}
            <Link
              to="/cart"
              className="relative text-gray-700 hover:text-orange-500 transition-colors"
            >
              <ShoppingCart size={20} />
              {getTotalItems() > 0 && (
                <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {getTotalItems()}
                </span>
              )}
            </Link>

            {/* ✅ Admin link */}
            {user && user.role === "admin" && (
              <Link
                to="/admin"
                className="text-gray-700 hover:text-orange-500 transition-colors"
              >
                Dashboard
              </Link>
            )}
          </nav>

          {/* User Menu / Auth */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-orange-500 transition-colors"
                >
                  <User size={20} />
                  <span className="hidden sm:inline">{user.name}</span>
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                    <Link
                      to="/profile"
                      className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <Settings size={16} />
                      <span>Profile</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-2 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <LogOut size={16} />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-orange-500 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600 transition-colors"
                >
                  Register
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="flex flex-col space-y-4">
              <Link
                to="/"
                className="text-gray-700 hover:text-orange-500 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>

              {/* ✅ Contact link for mobile */}
              <Link
                to="/contact"
                className="text-gray-700 hover:text-orange-500 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Contact
              </Link>

              {user && user.role === "user" && (
                <>
              
                  <Link
                    to="/orders"
                    className="text-gray-700 hover:text-orange-500 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Orders
                  </Link>
                  <Link
                    to="/feedback"
                    className="text-gray-700 hover:text-orange-500 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Feedback
                  </Link>
                </>
              )}

              <Link
                to="/restaurants"
                className="text-gray-700 hover:text-orange-500 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Restaurants
              </Link>
              <Link
                to="/menu"
                className="text-gray-700 hover:text-orange-500 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Menu
              </Link>

              {/* ✅ Always show Cart (guests + users) */}
              <Link
                to="/cart"
                className="flex items-center space-x-2 text-gray-700 hover:text-orange-500 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                <ShoppingCart size={20} />
                <span>Cart ({getTotalItems()})</span>
              </Link>

              {user && user.role === "admin" && (
                <Link
                  to="/admin"
                  className="text-gray-700 hover:text-orange-500 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
