import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Star, Clock, Plus, Minus, Heart, Share2, Truck } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { toast } from 'react-toastify';

const ProductDetailPage: React.FC = () => {
  const { id } = useParams();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [product, setProduct] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const API_URL = import.meta.env.VITE_API_URL;
  // Fetch product + reviews (single place)
  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(`${API_URL}/products/${id}`);
        setProduct(data || null);

        // fetch reviews (safe)
        try {
          const reviewRes = await axios.get(`${API_URL}/reviews/product/${id}`);
          setReviews(Array.isArray(reviewRes.data) ? reviewRes.data : []);
        } catch (revErr) {
          console.error('Failed to fetch reviews:', revErr);
          setReviews([]);
        }
      } catch (err) {
        console.error('Error fetching product:', err);
        toast.error("Failed to load product details");
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProduct();
  }, [id]);

  // fetch favorites when product loads and user present
  useEffect(() => {
    if (user && product?._id) {
      checkIfFavorite();
    } else {
      setIsFavorite(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, product?._id]);

  const checkIfFavorite = async () => {
    try {
      const res = await axios.get("${API_URL}/users/favorites", {
        withCredentials: true,
      });
      const favIds = Array.isArray(res.data) ? res.data.map((fav: any) => fav._id) : [];
      setIsFavorite(favIds.includes(product._id));
    } catch (error) {
      console.error("Error checking favorites:", error);
    }
  };

  const toggleFavorite = async () => {
    if (!user || user.role !== "user") {
      toast.info('Login to save favorites');
      return;
    }
    try {
      if (isFavorite) {
        await axios.delete(`${API_URL}/users/favorites/${product._id}`, {
          withCredentials: true,
        });
        setIsFavorite(false);
      } else {
        await axios.post(`${API_URL}/users/favorites/${product._id}`, {}, {
          withCredentials: true,
        });
        setIsFavorite(true);
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast.error("Failed to update favorites");
    }
  };

  const handleAddToCart = () => {
    if (product) {
      addToCart(product, quantity, notes);
      setQuantity(1);
      setNotes("");
      if (!user) {
        toast.info("Item added! You’ll need to log in at checkout.");
      } else {
        toast.success("Item added to cart!");
      }
    }
  };

  const handleBuyNow = () => {
    if (product) {
      addToCart(product, quantity, notes, true); // special flag for buyNow
      navigate("/cart", { state: { buyNow: true } });
      if (!user) {
        toast.info("You’ll need to log in before completing payment.");
      }
    }
  };

  const handleQuantityChange = (change: number) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1) {
      setQuantity(newQuantity);
    }
  };

  const handleSubmitReview = async () => {
    if (!user || user.role !== "user") {
      toast.error("You must be logged in as a user to submit a review.");
      return;
    }
    if (rating === 0) {
      toast.error("Please select a rating.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await axios.post(
        "${API_URL}/reviews",
        {
          productId: product._id,
          rating,
          comment,
        },
        { withCredentials: true }
      );

      const newReview = res.data;
      setReviews(prev => [newReview, ...prev]);

      // defensive update of product rating if fields present
      setProduct((prev: any) => {
        if (!prev) return prev;
        const prevRatings = Array.isArray(prev.ratings) ? prev.ratings : [];
        const prevAverage = typeof prev.averageRating === 'number' ? prev.averageRating : 0;
        const totalRatings = prevRatings.length + 1;
        const newAverage = totalRatings ? ((prevAverage * prevRatings.length) + newReview.rating) / totalRatings : newReview.rating;
        return {
          ...prev,
          averageRating: newAverage,
          ratings: [...prevRatings, newReview.rating],
        };
      });

      setRating(0);
      setComment('');
      toast.success("Review submitted!");
    } catch (error: any) {
      console.error("Error submitting review:", error.response?.data || error.message);
      toast.error(error.response?.data?.message || "Failed to submit review.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="h-96 bg-gray-300 rounded-lg"></div>
            <div className="space-y-4">
              <div className="h-8 bg-gray-300 rounded w-3/4"></div>
              <div className="h-4 bg-gray-300 rounded w-1/2"></div>
              <div className="h-6 bg-gray-300 rounded w-1/4"></div>
              <div className="h-20 bg-gray-300 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Product not found</h2>
          <Link to="/menu" className="text-orange-500 hover:text-orange-600">
            Back to Menu
          </Link>
        </div>
      </div>
    );
  }

  const images = Array.isArray(product.images) && product.images.length > 0 ? product.images : [product.image || ''];
  const discountedPrice = typeof product.getDiscountedPrice === 'function'
    ? product.getDiscountedPrice()
    : (product.discount ? product.price * (1 - (product.discount / 100)) : product.price || 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="mb-8">
        <ol className="flex items-center space-x-2 text-sm text-gray-600">
          <li><Link to="/" className="hover:text-orange-500">Home</Link></li>
          <li>/</li>
          <li><Link to="/restaurants" className="hover:text-orange-500">Restaurants</Link></li>
          <li>/</li>
          <li>
            <Link to={`/restaurants/${product.restaurant?._id || ''}`} className="hover:text-orange-500">
              {product.restaurant?.name || 'Restaurant'}
            </Link>
          </li>
          <li>/</li>
          <li className="text-gray-900">{product.name}</li>
        </ol>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Product Images */}
        <div className="space-y-4">
          <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
            <img
              src={images[activeImageIndex] || ''}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>

          {images.length > 1 && (
            <div className="flex space-x-2 overflow-x-auto">
              {images.map((image: string, index: number) => (
                <button
                  key={index}
                  onClick={() => setActiveImageIndex(index)}
                  className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                    activeImageIndex === index ? 'border-orange-500' : 'border-gray-200'
                  }`}
                >
                  <img
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
              <div className="flex items-center space-x-2">
                <button
                  onClick={toggleFavorite}
                  className={`p-2 transition-colors ${isFavorite ? "text-red-500" : "text-gray-400 hover:text-red-500"}`}
                >
                  <Heart size={20} fill={isFavorite ? "currentColor" : "none"} />
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                  <Share2 size={20} />
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-4 mb-4">
              <div className="flex items-center space-x-1">
                <Star size={16} className="text-yellow-400 fill-current" />
                <span className="font-medium">
                  {typeof product.averageRating === 'number' && product.averageRating > 0 ? product.averageRating.toFixed(1) : 'No ratings'}
                </span>
                <span className="text-gray-600">({Array.isArray(product.ratings) ? product.ratings.length : 0} reviews)</span>
              </div>
              <div className="flex items-center space-x-1 text-gray-600">
                <Clock size={16} />
                <span>{product.preparationTime || '—'} min prep</span>
              </div>
            </div>

            <div className="flex items-center space-x-2 mb-4">
              <span className="text-2xl font-bold text-orange-500">
                ${Number(discountedPrice).toFixed(2)}
              </span>
              {product.discount > 0 && (
                <>
                  <span className="text-lg text-gray-500 line-through">
                    ${Number(product.price || 0).toFixed(2)}
                  </span>
                  <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm font-medium">
                    {product.discount}% OFF
                  </span>
                </>
              )}
            </div>

            <p className="text-gray-600 mb-4">{product.description}</p>

            {/* Tags and Dietary Info */}
            <div className="flex flex-wrap gap-2 mb-4">
              {product.isVegetarian && (
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                  Vegetarian
                </span>
              )}
              {product.isVegan && (
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                  Vegan
                </span>
              )}
              {product.isGlutenFree && (
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                  Gluten-Free
                </span>
              )}
              {product.isSpicy && (
                <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                  Spicy {product.spiceLevel || '—'}/5
                </span>
              )}
              {Array.isArray(product.tags) && product.tags.map((tag: string, index: number) => (
                <span
                  key={index}
                  className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Restaurant Info */}
          <div className="border-t pt-4">
            <Link
              to={`/restaurants/${product.restaurant?._id || ''}`}
              className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-orange-600 font-semibold">
                  {product.restaurant?.name ? product.restaurant.name.charAt(0) : 'R'}
                </span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{product.restaurant?.name || 'Restaurant'}</h3>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Star size={12} className="text-yellow-400 fill-current" />
                    <span>{product.restaurant?.averageRating?.toFixed(1) || 'New'}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock size={12} />
                    <span>{product.restaurant?.deliveryTime || '—'} min</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Truck size={12} />
                    <span>${product.restaurant?.deliveryFee || '—'}</span>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* Add to Cart Section – visible for guests too */}
          {product.isAvailable ? (
            <div className="border-t pt-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Special Instructions (Optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any special requests or modifications..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    rows={3}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-700">Quantity:</span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleQuantityChange(-1)}
                        className="p-1 rounded-full border border-gray-300 hover:bg-gray-50"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="font-semibold min-w-[2rem] text-center">{quantity}</span>
                      <button
                        onClick={() => handleQuantityChange(1)}
                        className="p-1 rounded-full border border-gray-300 hover:bg-gray-50"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-gray-600">Total</p>
                    <p className="text-xl font-bold text-gray-900">
                      ${(product.price * quantity || 0).toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={handleAddToCart}
                    className="flex-1 bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Plus size={20} />
                    <span>Add to Cart</span>
                  </button>
                  <button
                    onClick={handleBuyNow}
                    className="flex-1 bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors flex items-center justify-center space-x-2"
                  >
                    <span>Buy Now</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="border-t pt-6">
              <div className="bg-gray-100 text-gray-600 py-3 px-4 rounded-lg text-center">
                Currently unavailable
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Additional Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Ingredients */}
        {Array.isArray(product.ingredients) && product.ingredients.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Ingredients</h3>
            <ul className="space-y-2">
              {product.ingredients.map((ingredient: string, index: number) => (
                <li key={index} className="text-gray-600 flex items-center">
                  <span className="w-2 h-2 bg-orange-500 rounded-full mr-3"></span>
                  {ingredient}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Nutrition Info */}
        {product.nutritionInfo && (
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Nutrition Information</h3>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(product.nutritionInfo).map(([key, value]: [string, any]) => (
                <div key={key} className="text-center">
                  <p className="text-2xl font-bold text-orange-500">{value}</p>
                  <p className="text-sm text-gray-600 capitalize">{key}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetailPage;
