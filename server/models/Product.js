import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  ingredients: [{
    type: String
  }],
  price: {
    type: Number,
    required: true,
    min: 0
  },
  originalPrice: {
    type: Number
  },
  discount: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  category: {
    type: String,
    required: true,
    enum: ['appetizer', 'main-course', 'dessert', 'beverage', 'snacks', 'salad', 'soup', 'pizza', 'burger', 'pasta', 'chinese', 'indian', 'mexican', 'italian']
  },
  image: {
    type: String,
    required: true
  },
  images: [{
    type: String
  }],
  isVegetarian: {
    type: Boolean,
    default: false
  },
  isVegan: {
    type: Boolean,
    default: false
  },
  isGlutenFree: {
    type: Boolean,
    default: false
  },
  isSpicy: {
    type: Boolean,
    default: false
  },
  spiceLevel: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  nutritionInfo: {
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number,
    fiber: Number
  },
  allergens: [{
    type: String
  }],
  isAvailable: {
    type: Boolean,
    default: true
  },
  stock: {
    type: Number,
    default: 100
  },
  preparationTime: {
    type: Number,
    default: 15 // minutes
  },
  ratings: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    review: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  averageRating: {
    type: Number,
    default: 0
  },
  totalOrders: {
    type: Number,
    default: 0
  },
  featured: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String
  }
  ]
}, {
  timestamps: true
});

productSchema.methods.calculateAverageRating = function() {
  if (this.ratings.length === 0) return 0;
  const sum = this.ratings.reduce((acc, rating) => acc + rating.rating, 0);
  return Math.round((sum / this.ratings.length) * 10) / 10;
};

productSchema.methods.getDiscountedPrice = function() {
  if (this.discount > 0) {
    return this.price * (1 - this.discount / 100);
  }
  return this.price;
};
export default mongoose.model('Product', productSchema);