import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, Clock, Truck, MapPin, Phone, Mail, Search, Filter } from 'lucide-react';
import ProductCard from '../components/Product/ProductCard';
import axios from 'axios';

const RestaurantDetailPage: React.FC = () => {
  const { id } = useParams();
  const [restaurant, setRestaurant] = useState<any>(null);
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [menuFilters, setMenuFilters] = useState({
    search: '',
    category: '',
    sortBy: 'name',
    sortOrder: 'asc'
  });
  const API_URL = import.meta.env.VITE_API_URL;
  const categories = [
    { value: '', label: 'All Categories' },
    { value: 'appetizer', label: 'Appetizers' },
    { value: 'main-course', label: 'Main Course' },
    { value: 'pizza', label: 'Pizza' },
    { value: 'pasta', label: 'Pasta' },
    { value: 'burger', label: 'Burgers' },
    { value: 'chinese', label: 'Chinese' },
    { value: 'indian', label: 'Indian' },
    { value: 'salad', label: 'Salads' },
    { value: 'dessert', label: 'Desserts' },
    { value: 'beverage', label: 'Beverages' }
  ];

  useEffect(() => {
    if (id) {
      fetchRestaurantDetails();
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchMenu();
    }
  }, [id, menuFilters]);

  const fetchRestaurantDetails = async () => {
    try {
      const response = await axios.get(`${API_URL}/restaurants/${id}`);
      setRestaurant(response.data.restaurant);
    } catch (error) {
      console.error('Error fetching restaurant details:', error);
    }
  };

  const fetchMenu = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      Object.entries(menuFilters).forEach(([key, value]) => {
        if (value !== '') {
          params.append(key, value.toString());
        }
      });

      const response = await axios.get(`${API_URL}/restaurants/${id}/menu?${params}`);
      setMenu(response.data);
    } catch (error) {
      console.error('Error fetching menu:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: any) => {
    setMenuFilters({ ...menuFilters, [key]: value });
  };

  const groupedMenu = menu.reduce((acc: any, item: any) => {
    const category = item.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {});

  if (!restaurant) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-64 bg-gray-300 rounded-lg mb-8"></div>
          <div className="h-8 bg-gray-300 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-300 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Restaurant Header */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-8">
        <div className="relative h-64">
          <img
            src={restaurant.image}
            alt={restaurant.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-end">
            <div className="p-6 text-white">
              <h1 className="text-3xl font-bold mb-2">{restaurant.name}</h1>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <Star size={20} className="text-yellow-400 fill-current" />
                  <span className="text-lg font-semibold">
                    {restaurant.averageRating > 0 ? restaurant.averageRating.toFixed(1) : 'New'}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock size={16} />
                  <span>{restaurant.deliveryTime} min delivery</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Truck size={16} />
                  <span>${restaurant.deliveryFee} delivery fee</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-gray-600 mb-4">{restaurant.description}</p>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {restaurant.cuisine.map((cuisine: string, index: number) => (
                  <span
                    key={index}
                    className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium"
                  >
                    {cuisine}
                  </span>
                ))}
              </div>

              <div className="text-sm text-gray-600">
                <p className="mb-1">Minimum order: ${restaurant.minimumOrder}</p>
                <p>Total orders: {restaurant.totalOrders}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <MapPin size={16} className="text-gray-400" />
                <span className="text-sm">
                  {restaurant.address.street}, {restaurant.address.city}, {restaurant.address.state} {restaurant.address.zipCode}
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone size={16} className="text-gray-400" />
                <span className="text-sm">{restaurant.phone}</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail size={16} className="text-gray-400" />
                <span className="text-sm">{restaurant.email}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Section */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Menu</h2>
        
        {/* Menu Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search menu items..."
              value={menuFilters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>

          <select
            value={menuFilters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          >
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>

          <select
            value={`${menuFilters.sortBy}-${menuFilters.sortOrder}`}
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split('-');
              setMenuFilters({ ...menuFilters, sortBy, sortOrder });
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          >
            <option value="name-asc">Name: A to Z</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="averageRating-desc">Highest Rated</option>
          </select>
        </div>
      </div>

      {/* Menu Items */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
              <div className="w-full h-48 bg-gray-300"></div>
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-300 rounded"></div>
                <div className="h-3 bg-gray-300 rounded"></div>
                <div className="h-4 bg-gray-300 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      ) : menuFilters.category === '' ? (
        // Show grouped by category
        <div className="space-y-8">
          {Object.entries(groupedMenu).map(([category, items]: [string, any]) => (
            <div key={category}>
              <h3 className="text-xl font-semibold text-gray-900 mb-4 capitalize">
                {category.replace('-', ' ')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map((product: any) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Show filtered results
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menu.map((product: any) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}

      {!loading && menu.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No menu items found.</p>
        </div>
      )}
    </div>
  );
};

export default RestaurantDetailPage;