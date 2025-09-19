import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Star, Plus, Minus, X } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  isSpicy?: boolean;
  spiceLevel?: number;
  isAvailable: boolean;
  averageRating: number;
  discount?: number;
  preparationTime?: number;
  tags?: string[];
  restaurant?: {
    _id: string;
    name: string;
    deliveryTime: number;
    deliveryFee: number;
  };
}

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [showModal, setShowModal] = useState<null | 'cart' | 'buyNow'>(null);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

  const discountedPrice =
    product.discount && product.discount > 0
      ? product.price * (1 - product.discount / 100)
      : product.price;

  const openCartModal = () => {
    setShowModal('cart');
  };

  const openBuyNowModal = () => {
    setShowModal('buyNow');
  };

  const handleConfirm = () => {
    if (showModal === 'cart') {
      addToCart(product, quantity, notes);
      setShowModal(null);
      setQuantity(1);
      setNotes('');
      if (!user) {
        toast.info('Item added! You’ll need to log in at checkout.');
      } else {
        toast.success('Item added to cart!');
      }
    } else if (showModal === 'buyNow') {
      setShowModal(null);
      addToCart(product, quantity, notes, true); // mark as buy now
      if (!user) {
        toast.info('Please log in to complete your purchase.');
        navigate('/login');
      } else {
        navigate('/cart', { state: { buyNow: true } });
      }
    }
  };

  return (
    <>
      {/* Product Card */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow group">
        <div className="relative">
          <Link to={`/products/${product._id}`}>
            <img
              src={
                product.image ||
                'https://images.pexels.com/photos/1279330/pexels-photo-1279330.jpeg'
              }
              alt={product.name}
              className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </Link>
          {product.discount && product.discount > 0 && (
            <div className="absolute top-2 right-2">
              <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                {product.discount}% OFF
              </span>
            </div>
          )}
        </div>

        <div className="p-4">
          <div className="flex justify-between items-start mb-2">
            <Link to={`/products/${product._id}`}>
              <h3 className="text-lg font-semibold text-gray-900 hover:text-orange-500 transition-colors">
                {product.name}
              </h3>
            </Link>
            <div className="text-right">
              <span className="text-lg font-bold text-orange-500">
                ${discountedPrice.toFixed(2)}
              </span>
              {product.discount && product.discount > 0 && (
                <div className="text-sm text-gray-500 line-through">
                  ${product.price.toFixed(2)}
                </div>
              )}
            </div>
          </div>

          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {product.description}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              <Star size={16} className="text-yellow-400 fill-current" />
              <span className="text-sm text-gray-600">
                {product.averageRating > 0
                  ? product.averageRating.toFixed(1)
                  : 'New'}
              </span>
            </div>

            {product.isAvailable && (
              <div className="flex space-x-2">
                <button
                  onClick={openCartModal}
                  className="bg-orange-500 text-white px-3 py-1 rounded-md text-sm font-semibold hover:bg-orange-600 transition-colors"
                >
                  Add to Cart
                </button>
                <button
                  onClick={openBuyNowModal}
                  className="bg-green-500 text-white px-3 py-1 rounded-md text-sm font-semibold hover:bg-green-600 transition-colors"
                >
                  Buy Now
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal for Add to Cart / Buy Now */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
            {/* Close Button */}
            <button
              onClick={() => setShowModal(null)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>

            <h2 className="text-xl font-semibold mb-4">
              {showModal === 'cart' ? 'Add to Cart' : 'Buy Now'} - {product.name}
            </h2>

            {/* Quantity Selector */}
            <div className="flex items-center justify-between mb-4">
              <span className="font-medium text-gray-700">Quantity</span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setQuantity(quantity > 1 ? quantity - 1 : 1)}
                  className="p-2 border rounded-md hover:bg-gray-100"
                >
                  <Minus size={16} />
                </button>
                <span className="font-semibold">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-2 border rounded-md hover:bg-gray-100"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* Notes Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Special Instructions
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special requests..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                rows={3}
              />
            </div>

            {/* Total Price */}
            <div className="flex justify-between items-center mb-6">
              <span className="text-lg font-semibold">Total:</span>
              <span className="text-xl font-bold text-orange-600">
                ${(discountedPrice * quantity).toFixed(2)}
              </span>
            </div>

            {/* Confirm Button */}
            <button
              onClick={handleConfirm}
              className={`w-full ${
                showModal === 'cart'
                  ? 'bg-orange-500 hover:bg-orange-600'
                  : 'bg-green-500 hover:bg-green-600'
              } text-white py-3 rounded-lg font-semibold transition-colors`}
            >
              {showModal === 'cart' ? 'Add to Cart' : 'Proceed to Checkout'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ProductCard;
