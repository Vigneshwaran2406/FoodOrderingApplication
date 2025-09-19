// src/App.tsx
import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation
} from 'react-router-dom';

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';

// Layout
import Header from './components/Layout/Header';
import Footer from './components/Layout/Footer';
import AdminHeader from './components/Layout/AdminHeader';
import LoadingSpinner from './components/UI/LoadingSpinner';

// User Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import MenuPage from './pages/MenuPage';
import CartPage from './pages/CartPage';
import ProfilePage from './pages/ProfilePage';
import OrderHistoryPage from './pages/OrderHistoryPage';
import RestaurantsPage from './pages/RestaurantsPage';
import RestaurantDetailPage from './pages/RestaurantDetailPage';
import ProductDetailPage from './pages/ProductDetailPage';
import FeedbackPage from './pages/FeedbackPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminOrders from './pages/admin/AdminOrders';
import AdminUsers from './pages/admin/AdminUsers';
import AdminRestaurants from './pages/admin/AdminRestaurants';
import AdminFeedback from './pages/admin/AdminFeedback';
import AdminRestaurantsView from './pages/admin/AdminRestaurantsView';
import AdminMenuView from './pages/admin/AdminMenuView';
import AdminProfilePage from './pages/admin/AdminProfilePage';


import ContactPage from "./pages/ContactPage";  // <-- make sure this path is correct
import AdminContactPage from "./pages/admin/AdminContact"; // <-- for admin


// ---------- Route Guards ----------

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner />;
  
  // 🚀 Force redirect if no user (session expired or logged out)
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (!user || user.role !== 'admin') return <Navigate to="/" />;
  return <>{children}</>;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : '/'} />;
  return <>{children}</>;
};

// ---------- Layout Helper ----------

const isAdminRoute = (pathname: string) => pathname.startsWith('/admin');

// ---------- Main Content ----------

const AppContent: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const location = useLocation();
  const showAdminHeader = isAdmin && isAdminRoute(location.pathname);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {showAdminHeader ? <AdminHeader /> : <Header />}

      <main className="flex-1">
        <Routes>
          {/* Redirect admins who hit "/" straight to the admin panel */}
          <Route
            path="/"
            element={isAdmin ? <Navigate to="/admin" /> : <HomePage />}
          />

          {/* Public / User routes */}
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/restaurants" element={<RestaurantsPage />} />
          <Route path="/restaurants/:id" element={<RestaurantDetailPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />


          {/* User contact page (open for guests + users) */}
<Route path="/contact" element={<ContactPage />} />

{/* Admin contact page */}
<Route
  path="/admin/contact"
  element={
    <AdminRoute>
      <AdminContactPage />
    </AdminRoute>
  }
/>
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <RegisterPage />
              </PublicRoute>
            }
          />

          <Route path="/cart" element={<CartPage />} />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <OrderHistoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/feedback"
            element={
              <ProtectedRoute>
                <FeedbackPage />
              </ProtectedRoute>
            }
          />
          
          {/* Admin routes */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
         
          <Route
            path="/admin/restaurants-view"
            element={
              <AdminRoute>
                <AdminRestaurantsView />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/menu"
            element={
              <AdminRoute>
                <AdminMenuView />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/products"
            element={
              <AdminRoute>
                <AdminProducts />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/orders"
            element={
              <AdminRoute>
                <AdminOrders />
              </AdminRoute>
            }
          />
           <Route
  path="/admin/orders/:id"
  element={
    <AdminRoute>
      <AdminOrders />
    </AdminRoute>
  }
/>
          <Route
            path="/admin/users"
            element={
              <AdminRoute>
                <AdminUsers />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/restaurants"
            element={
              <AdminRoute>
                <AdminRestaurants />
              </AdminRoute>
            }
          />

          <Route
            path="/admin/profile"
            element={
              <AdminRoute>
                <AdminProfilePage />
              </AdminRoute>
            }
          />

          <Route
            path="/admin/feedback"
            element={
              <AdminRoute>
                <AdminFeedback />
              </AdminRoute>
            }
          />
                 <Route
                path="/admin/feedback/:id"
                 element={
    <AdminRoute>
      <AdminFeedback />
    </AdminRoute>
  }
/>
   

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
};

// ---------- App Wrapper ----------

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <AppContent />
        </CartProvider>
      </AuthProvider>
      <ToastContainer position="top-right" autoClose={3000} />
    </Router>
    
  );
}

export default App;
