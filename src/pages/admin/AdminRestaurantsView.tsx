import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Star, Clock, Truck, MapPin, Settings } from 'lucide-react';
import axios from 'axios';

const AdminRestaurantsView: React.FC = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    cuisine: '',
    minRating: '',
    featured: false,
    sortBy: 'averageRating',
    sortOrder: 'desc'
  });
  const [showFilters, setShowFilters] = useState(false);

  const cuisineTypes = [
    { value: '', label: 'All Cuisines' },
    { value: 'Italian', label: 'Italian' },
    { value: 'Indian', label: 'Indian' },
    { value: 'Chinese', label: 'Chinese' },
    { value: 'American', label: 'American' },
    { value: 'Mexican', label: 'Mexican' },
    { value: 'Asian', label: 'Asian' },
    { value: 'Mediterranean', label: 'Mediterranean' },
    { value: 'Healthy', label: 'Healthy' },
    { value: 'Fast Food', label: 'Fast Food' }
  ];

  useEffect(() => {
    fetchRestaurants();
  }, [filters]);

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== '' && value !== false) {
          params.append(key, value.toString());
        }
      });

      const response = await axios.get(`/api/restaurants?${params}`);
      setRestaurants(response.data.restaurants);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      cuisine: '',
      minRating: '',
      featured: false,
      sortBy: 'averageRating',
      sortOrder: 'desc'
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Restaurants</h1>
          <p className="text-gray-600">Browse all restaurants in the system</p>
        </div>
        <Link
          to="/admin/restaurants"
          className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors flex items-center space-x-2"
        >
          <Settings size={20} />
          <span>Manage Restaurants</span>
        </Link>
      </div>

      {/* Search and Filter Bar */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search restaurants..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>

          {/* Sort */}
          <select
            value={`${filters.sortBy}-${filters.sortOrder}`}
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split('-');
              setFilters({ ...filters, sortBy, sortOrder });
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          >
            <option value="averageRating-desc">Highest Rated</option>
            <option value="deliveryTime-asc">Fastest Delivery</option>
            <option value="deliveryFee-asc">Lowest Delivery Fee</option>
            <option value="name-asc">Name: A to Z</option>
          </select>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Filter size={16} />
            <span>Filters</span>
          </button>
        </div>

        {/* Expandable Filters */}
        {showFilters && (
          <div className="bg-gray-50 p-4 rounded-lg space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Cuisine */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cuisine Type
                </label>
                <select
                  value={filters.cuisine}
                  onChange={(e) => handleFilterChange('cuisine', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  {cuisineTypes.map((cuisine) => (
                    <option key={cuisine.value} value={cuisine.value}>
                      {cuisine.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Minimum Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Rating
                </label>
                <select
                  value={filters.minRating}
                  onChange={(e) => handleFilterChange('minRating', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="">Any Rating</option>
                  <option value="4">4+ Stars</option>
                  <option value="4.5">4.5+ Stars</option>
                </select>
              </div>

              {/* Featured */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Special Options
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.featured}
                    onChange={(e) => handleFilterChange('featured', e.target.checked)}
                    className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                  />
                  <span className="ml-2 text-sm">Featured Only</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={clearFilters}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Restaurants Grid */}
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {restaurants.map((restaurant: any) => (
            <Link
              key={restaurant._id}
              to={`/restaurants/${restaurant._id}`}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="relative">
                <img
                  src={restaurant.image}
                  alt={restaurant.name}
                  className="w-full h-48 object-cover"
                />
                {restaurant.featured && (
                  <div className="absolute top-2 left-2">
                    <span className="bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                      Featured
                    </span>
                  </div>
                )}
              </div>

              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{restaurant.name}</h3>
                  <div className="flex items-center space-x-1">
                    <Star size={16} className="text-yellow-400 fill-current" />
                    <span className="text-sm text-gray-600">
                      {restaurant.averageRating > 0 ? restaurant.averageRating.toFixed(1) : 'New'}
                    </span>
                  </div>
                </div>

                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{restaurant.description}</p>

                <div className="flex flex-wrap gap-1 mb-3">
                  {restaurant.cuisine.slice(0, 2).map((cuisine: string, index: number) => (
                    <span
                      key={index}
                      className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs"
                    >
                      {cuisine}
                    </span>
                  ))}
                  {restaurant.cuisine.length > 2 && (
                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                      +{restaurant.cuisine.length - 2} more
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Clock size={14} />
                    <span>{restaurant.deliveryTime} min</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Truck size={14} />
                    <span>${restaurant.deliveryFee}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MapPin size={14} />
                    <span>{restaurant.address.city}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {!loading && restaurants.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No restaurants found matching your criteria.</p>
          <button
            onClick={clearFilters}
            className="mt-4 text-orange-500 hover:text-orange-600"
          >
            Clear filters to see all restaurants
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminRestaurantsView;