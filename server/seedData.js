import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/User.js';
import Product from './models/Product.js';
import Restaurant from './models/Restaurant.js';

dotenv.config();
console.log("MONGODB_URI:", process.env.MONGODB_URI);

const seedData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/foodorderingapp');
    console.log('Connected to MongoDB');
    
    // Clear existing data
    await User.deleteMany({});
    await Product.deleteMany({});
    console.log('Cleared existing data');

    // Create admin user

    const admin = new User({
      name: 'Admin User',
      email: 'admin@foodorder.com',
      password: 123456,
      phone: '+1234567890',
      role: 'admin',
      address: {
        street: '123 Admin Street',
        city: 'Admin City',
        state: 'AC',
        zipCode: '12345'
      }
    });
    await admin.save();

    // Create demo user
    const user = new User({
      name: 'Demo User',
      email: 'user@foodorder.com',
      password: 123456,
      phone: '+1234567891',
      role: 'user',
      address: {
        street: '456 User Avenue',
        city: 'User City',
        state: 'UC',
        zipCode: '67890'
      }
    });
    await user.save();

    // Create sample restaurants
    const restaurants = [
      {
        name: 'Bella Italia',
        description: 'Authentic Italian cuisine with fresh ingredients and traditional recipes',
        image: 'https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg',
        address: {
          street: '123 Main Street',
          city: 'New York',
          state: 'NY',
          zipCode: '10001'
        },
        phone: '+1-555-0101',
        email: 'info@bellaitalia.com',
        cuisine: ['Italian', 'Mediterranean'],
        openingHours: {
          monday: { open: '11:00', close: '22:00' },
          tuesday: { open: '11:00', close: '22:00' },
          wednesday: { open: '11:00', close: '22:00' },
          thursday: { open: '11:00', close: '22:00' },
          friday: { open: '11:00', close: '23:00' },
          saturday: { open: '11:00', close: '23:00' },
          sunday: { open: '12:00', close: '21:00' }
        },
        deliveryTime: 25,
        deliveryFee: 2.99,
        minimumOrder: 12.00,
        averageRating: 4.6,
        featured: true
      },
      {
        name: 'Spice Garden',
        description: 'Authentic Indian and Asian fusion cuisine with aromatic spices',
        image: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg',
        address: {
          street: '456 Oak Avenue',
          city: 'New York',
          state: 'NY',
          zipCode: '10002'
        },
        phone: '+1-555-0102',
        email: 'hello@spicegarden.com',
        cuisine: ['Indian', 'Asian', 'Vegetarian'],
        openingHours: {
          monday: { open: '12:00', close: '22:30' },
          tuesday: { open: '12:00', close: '22:30' },
          wednesday: { open: '12:00', close: '22:30' },
          thursday: { open: '12:00', close: '22:30' },
          friday: { open: '12:00', close: '23:00' },
          saturday: { open: '12:00', close: '23:00' },
          sunday: { open: '12:00', close: '22:00' }
        },
        deliveryTime: 35,
        deliveryFee: 3.49,
        minimumOrder: 15.00,
        averageRating: 4.4,
        featured: true
      },
      {
        name: 'Burger Palace',
        description: 'Gourmet burgers and American classics made with premium ingredients',
        image: 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg',
        address: {
          street: '789 Burger Lane',
          city: 'New York',
          state: 'NY',
          zipCode: '10003'
        },
        phone: '+1-555-0103',
        email: 'orders@burgerpalace.com',
        cuisine: ['American', 'Fast Food'],
        openingHours: {
          monday: { open: '10:00', close: '23:00' },
          tuesday: { open: '10:00', close: '23:00' },
          wednesday: { open: '10:00', close: '23:00' },
          thursday: { open: '10:00', close: '23:00' },
          friday: { open: '10:00', close: '24:00' },
          saturday: { open: '10:00', close: '24:00' },
          sunday: { open: '11:00', close: '22:00' }
        },
        deliveryTime: 20,
        deliveryFee: 2.49,
        minimumOrder: 10.00,
        averageRating: 4.2
      },
      {
        name: 'Dragon Wok',
        description: 'Fresh Chinese cuisine with traditional wok cooking and modern flavors',
        image: 'https://images.pexels.com/photos/1410235/pexels-photo-1410235.jpeg',
        address: {
          street: '321 Dragon Street',
          city: 'New York',
          state: 'NY',
          zipCode: '10004'
        },
        phone: '+1-555-0104',
        email: 'info@dragonwok.com',
        cuisine: ['Chinese', 'Asian'],
        openingHours: {
          monday: { open: '11:30', close: '22:00' },
          tuesday: { open: '11:30', close: '22:00' },
          wednesday: { open: '11:30', close: '22:00' },
          thursday: { open: '11:30', close: '22:00' },
          friday: { open: '11:30', close: '22:30' },
          saturday: { open: '11:30', close: '22:30' },
          sunday: { open: '12:00', close: '21:30' }
        },
        deliveryTime: 30,
        deliveryFee: 3.99,
        minimumOrder: 18.00,
        averageRating: 4.3
      },
      {
        name: 'Fresh & Green',
        description: 'Healthy salads, smoothies, and organic meals for conscious eaters',
        image: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg',
        address: {
          street: '654 Health Boulevard',
          city: 'New York',
          state: 'NY',
          zipCode: '10005'
        },
        phone: '+1-555-0105',
        email: 'hello@freshgreen.com',
        cuisine: ['Healthy', 'Vegetarian', 'Vegan'],
        openingHours: {
          monday: { open: '07:00', close: '21:00' },
          tuesday: { open: '07:00', close: '21:00' },
          wednesday: { open: '07:00', close: '21:00' },
          thursday: { open: '07:00', close: '21:00' },
          friday: { open: '07:00', close: '21:00' },
          saturday: { open: '08:00', close: '20:00' },
          sunday: { open: '08:00', close: '20:00' }
        },
        deliveryTime: 25,
        deliveryFee: 2.99,
        minimumOrder: 12.00,
        averageRating: 4.5,
        featured: true
      }
    ];

    const createdRestaurants = await Restaurant.insertMany(restaurants);
    console.log('Sample restaurants created');

    // Create sample products
    const products = [
      {
        restaurant: createdRestaurants[0]._id, // Bella Italia
        name: 'Classic Margherita Pizza',
        description: 'Traditional Italian pizza with fresh tomato sauce, mozzarella di bufala, and fresh basil leaves',
        ingredients: ['Tomato sauce', 'Mozzarella di bufala', 'Fresh basil', 'Extra virgin olive oil'],
        price: 14.99,
        category: 'pizza',
        image: 'https://images.pexels.com/photos/315755/pexels-photo-315755.jpeg',
        isVegetarian: true,
        isAvailable: true,
        stock: 50,
        averageRating: 4.5,
        preparationTime: 15,
        tags: ['pizza', 'classic', 'vegetarian']
      },
      {
        restaurant: createdRestaurants[0]._id, // Bella Italia
        name: 'Spaghetti Carbonara',
        description: 'Creamy pasta with pancetta, eggs, parmesan cheese, and black pepper',
        ingredients: ['Spaghetti', 'Pancetta', 'Eggs', 'Parmesan cheese', 'Black pepper'],
        price: 16.99,
        category: 'pasta',
        image: 'https://images.pexels.com/photos/4518843/pexels-photo-4518843.jpeg',
        isVegetarian: false,
        isAvailable: true,
        stock: 30,
        averageRating: 4.7,
        preparationTime: 20,
        tags: ['pasta', 'creamy', 'italian']
      },
      {
        restaurant: createdRestaurants[1]._id, // Spice Garden
        name: 'Chicken Tikka Masala',
        description: 'Tender chicken pieces in a rich, creamy tomato-based curry sauce',
        ingredients: ['Chicken breast', 'Tomatoes', 'Cream', 'Onions', 'Garam masala', 'Ginger', 'Garlic'],
        price: 18.99,
        category: 'indian',
        image: 'https://images.pexels.com/photos/2474661/pexels-photo-2474661.jpeg',
        isVegetarian: false,
        isSpicy: true,
        spiceLevel: 3,
        isAvailable: true,
        stock: 25,
        averageRating: 4.6,
        preparationTime: 25,
        tags: ['curry', 'chicken', 'spicy', 'popular']
      },
      {
        restaurant: createdRestaurants[1]._id, // Spice Garden
        name: 'Vegetable Biryani',
        description: 'Fragrant basmati rice cooked with mixed vegetables and aromatic spices',
        ingredients: ['Basmati rice', 'Mixed vegetables', 'Saffron', 'Cardamom', 'Cinnamon', 'Bay leaves'],
        price: 15.99,
        category: 'indian',
        image: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg',
        isVegetarian: true,
        isVegan: true,
        isSpicy: true,
        spiceLevel: 2,
        isAvailable: true,
        stock: 20,
        averageRating: 4.4,
        preparationTime: 30,
        tags: ['rice', 'vegetarian', 'vegan', 'aromatic']
      },
      {
        restaurant: createdRestaurants[2]._id, // Burger Palace
        name: 'Classic Beef Burger',
        description: 'Juicy beef patty with lettuce, tomato, onion, pickles, and our special sauce',
        ingredients: ['Beef patty', 'Lettuce', 'Tomato', 'Onion', 'Pickles', 'Special sauce', 'Brioche bun'],
        price: 12.99,
        category: 'burger',
        image: 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg',
        isVegetarian: false,
        isAvailable: true,
        stock: 40,
        averageRating: 4.3,
        preparationTime: 15,
        tags: ['burger', 'beef', 'classic']
      },
      {
        restaurant: createdRestaurants[2]._id, // Burger Palace
        name: 'Crispy Chicken Wings',
        description: 'Golden crispy chicken wings with your choice of sauce',
        ingredients: ['Chicken wings', 'Flour coating', 'Spices', 'Choice of sauce'],
        price: 10.99,
        category: 'appetizer',
        image: 'https://images.pexels.com/photos/60616/fried-chicken-chicken-fried-crunchy-60616.jpeg',
        isVegetarian: false,
        isAvailable: true,
        stock: 35,
        averageRating: 4.4,
        preparationTime: 18,
        tags: ['wings', 'crispy', 'appetizer']
      },
      {
        restaurant: createdRestaurants[3]._id, // Dragon Wok
        name: 'Sweet & Sour Pork',
        description: 'Crispy pork pieces with bell peppers and pineapple in sweet and sour sauce',
        ingredients: ['Pork', 'Bell peppers', 'Pineapple', 'Sweet and sour sauce', 'Onions'],
        price: 17.99,
        category: 'chinese',
        image: 'https://images.pexels.com/photos/1410235/pexels-photo-1410235.jpeg',
        isVegetarian: false,
        isAvailable: true,
        stock: 25,
        averageRating: 4.2,
        preparationTime: 20,
        tags: ['pork', 'sweet', 'sour', 'chinese']
      },
      {
        restaurant: createdRestaurants[3]._id, // Dragon Wok
        name: 'Vegetable Fried Rice',
        description: 'Wok-fried rice with mixed vegetables, eggs, and soy sauce',
        ingredients: ['Jasmine rice', 'Mixed vegetables', 'Eggs', 'Soy sauce', 'Garlic', 'Ginger'],
        price: 11.99,
        category: 'chinese',
        image: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg',
        isVegetarian: true,
        isAvailable: true,
        stock: 30,
        averageRating: 4.1,
        preparationTime: 12,
        tags: ['rice', 'vegetarian', 'wok', 'quick']
      },
      {
        restaurant: createdRestaurants[4]._id, // Fresh & Green
        name: 'Mediterranean Quinoa Bowl',
        description: 'Nutritious quinoa with roasted vegetables, feta cheese, and tahini dressing',
        ingredients: ['Quinoa', 'Roasted vegetables', 'Feta cheese', 'Tahini', 'Olive oil', 'Lemon'],
        price: 13.99,
        category: 'salad',
        image: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg',
        isVegetarian: true,
        isGlutenFree: true,
        nutritionInfo: {
          calories: 420,
          protein: 18,
          carbs: 45,
          fat: 16,
          fiber: 8
        },
        isAvailable: true,
        stock: 25,
        averageRating: 4.5,
        preparationTime: 10,
        tags: ['healthy', 'quinoa', 'mediterranean', 'gluten-free']
      },
      {
        restaurant: createdRestaurants[4]._id, // Fresh & Green
        name: 'Green Detox Smoothie',
        description: 'Refreshing blend of spinach, apple, cucumber, ginger, and lemon',
        ingredients: ['Spinach', 'Green apple', 'Cucumber', 'Ginger', 'Lemon', 'Coconut water'],
        price: 6.99,
        category: 'beverage',
        image: 'https://images.pexels.com/photos/96974/pexels-photo-96974.jpeg',
        isVegetarian: true,
        isVegan: true,
        isGlutenFree: true,
        nutritionInfo: {
          calories: 95,
          protein: 3,
          carbs: 22,
          fat: 0.5,
          fiber: 4
        },
        isAvailable: true,
        stock: 50,
        averageRating: 4.3,
        preparationTime: 5,
        tags: ['smoothie', 'detox', 'healthy', 'vegan']
      },
      {
        restaurant: createdRestaurants[0]._id, // Bella Italia
        name: 'Tiramisu',
        description: 'Classic Italian dessert with coffee-soaked ladyfingers and mascarpone cream',
        ingredients: ['Ladyfingers', 'Espresso', 'Mascarpone', 'Eggs', 'Sugar', 'Cocoa powder'],
        price: 7.99,
        category: 'dessert',
        image: 'https://images.pexels.com/photos/45202/brownie-dessert-cake-sweet-45202.jpeg',
        isVegetarian: true,
        isAvailable: true,
        stock: 15,
        averageRating: 4.8,
        preparationTime: 5,
        tags: ['dessert', 'italian', 'coffee', 'classic']
      },
      {
        restaurant: createdRestaurants[1]._id, // Spice Garden
        name: 'Mango Lassi',
        description: 'Traditional Indian yogurt drink blended with fresh mango and cardamom',
        ingredients: ['Fresh mango', 'Yogurt', 'Milk', 'Sugar', 'Cardamom'],
        price: 4.99,
        category: 'beverage',
        image: 'https://images.pexels.com/photos/96974/pexels-photo-96974.jpeg',
        isVegetarian: true,
        isGlutenFree: true,
        isAvailable: true,
        stock: 40,
        averageRating: 4.4,
        preparationTime: 3,
        tags: ['lassi', 'mango', 'traditional', 'refreshing']
      }
    ];

    await Product.insertMany(products);
    console.log('Sample products created');

    console.log('Seed data created successfully!');
    console.log('Admin Login: admin@foodorder.com / 123456');
    console.log('User Login: user@foodorder.com / 123456');
    
    mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();