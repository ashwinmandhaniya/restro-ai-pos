export const menuCategories = [
  { id: 'all', name: 'All Items', icon: '🍽️', count: 48 },
  { id: 'starters', name: 'Starters', icon: '🥗', count: 12 },
  { id: 'main-course', name: 'Main Course', icon: '🍛', count: 15 },
  { id: 'breads', name: 'Breads', icon: '🫓', count: 8 },
  { id: 'rice', name: 'Rice & Biryani', icon: '🍚', count: 6 },
  { id: 'beverages', name: 'Beverages', icon: '🥤', count: 10 },
  { id: 'desserts', name: 'Desserts', icon: '🍨', count: 7 },
  { id: 'chinese', name: 'Chinese', icon: '🥢', count: 9 },
]

export const menuItems = [
  // Starters
  { id: 1, name: 'Paneer Tikka', price: 280, category: 'starters', veg: true, image: '🧀', popular: true, available: true, description: 'Marinated cottage cheese grilled in tandoor' },
  { id: 2, name: 'Chicken Seekh Kebab', price: 320, category: 'starters', veg: false, image: '🍢', popular: true, available: true, description: 'Spiced minced chicken kebabs' },
  { id: 3, name: 'Hara Bhara Kebab', price: 220, category: 'starters', veg: true, image: '🥬', popular: false, available: true, description: 'Spinach and green pea patties' },
  { id: 4, name: 'Chicken Wings', price: 350, category: 'starters', veg: false, image: '🍗', popular: true, available: true, description: 'Crispy fried chicken wings with hot sauce' },
  { id: 5, name: 'Tandoori Mushroom', price: 240, category: 'starters', veg: true, image: '🍄', popular: false, available: true, description: 'Mushrooms marinated in tandoori spices' },
  { id: 6, name: 'Fish Amritsari', price: 380, category: 'starters', veg: false, image: '🐟', popular: false, available: true, description: 'Punjab-style fried fish' },
  { id: 7, name: 'Dahi Kebab', price: 260, category: 'starters', veg: true, image: '🫕', popular: false, available: true, description: 'Creamy hung curd kebabs' },
  { id: 8, name: 'Mutton Galouti', price: 420, category: 'starters', veg: false, image: '🥩', popular: true, available: true, description: 'Lucknowi style melt-in-mouth kebabs' },
  { id: 9, name: 'Veg Spring Roll', price: 200, category: 'starters', veg: true, image: '🌯', popular: false, available: true, description: 'Crispy rolls with vegetable stuffing' },
  { id: 10, name: 'Chicken Malai Tikka', price: 340, category: 'starters', veg: false, image: '🍖', popular: true, available: true, description: 'Cream marinated chicken tikka' },

  // Main Course
  { id: 11, name: 'Butter Chicken', price: 380, category: 'main-course', veg: false, image: '🍲', popular: true, available: true, description: 'Classic creamy tomato-based chicken curry' },
  { id: 12, name: 'Paneer Butter Masala', price: 320, category: 'main-course', veg: true, image: '🧈', popular: true, available: true, description: 'Rich and creamy paneer curry' },
  { id: 13, name: 'Dal Makhani', price: 280, category: 'main-course', veg: true, image: '🫘', popular: true, available: true, description: 'Slow-cooked black lentils with butter' },
  { id: 14, name: 'Chicken Biryani', price: 350, category: 'main-course', veg: false, image: '🍛', popular: true, available: true, description: 'Aromatic basmati rice with spiced chicken' },
  { id: 15, name: 'Kadhai Paneer', price: 300, category: 'main-course', veg: true, image: '🫕', popular: false, available: true, description: 'Paneer cooked with bell peppers in kadhai masala' },
  { id: 16, name: 'Mutton Rogan Josh', price: 450, category: 'main-course', veg: false, image: '🍖', popular: true, available: true, description: 'Kashmiri-style slow-cooked mutton' },
  { id: 17, name: 'Palak Paneer', price: 280, category: 'main-course', veg: true, image: '🥬', popular: false, available: true, description: 'Cottage cheese in spinach gravy' },
  { id: 18, name: 'Chole Bhature', price: 220, category: 'main-course', veg: true, image: '🫓', popular: true, available: true, description: 'Spiced chickpeas with fried bread' },
  { id: 19, name: 'Fish Curry', price: 400, category: 'main-course', veg: false, image: '🐟', popular: false, available: true, description: 'Coastal-style fish curry with coconut' },
  { id: 20, name: 'Shahi Paneer', price: 320, category: 'main-course', veg: true, image: '👑', popular: false, available: true, description: 'Royal paneer in rich cashew gravy' },
  { id: 21, name: 'Egg Curry', price: 240, category: 'main-course', veg: false, image: '🥚', popular: false, available: true, description: 'Boiled eggs in spicy onion-tomato gravy' },
  { id: 22, name: 'Mix Veg', price: 240, category: 'main-course', veg: true, image: '🥘', popular: false, available: true, description: 'Mixed seasonal vegetables' },
  { id: 23, name: 'Chicken Do Pyaza', price: 360, category: 'main-course', veg: false, image: '🧅', popular: false, available: true, description: 'Chicken curry with double onion' },

  // Breads
  { id: 24, name: 'Butter Naan', price: 60, category: 'breads', veg: true, image: '🫓', popular: true, available: true, description: 'Soft tandoori naan with butter' },
  { id: 25, name: 'Garlic Naan', price: 80, category: 'breads', veg: true, image: '🧄', popular: true, available: true, description: 'Naan topped with garlic and coriander' },
  { id: 26, name: 'Tandoori Roti', price: 40, category: 'breads', veg: true, image: '🫓', popular: false, available: true, description: 'Whole wheat bread from tandoor' },
  { id: 27, name: 'Cheese Naan', price: 100, category: 'breads', veg: true, image: '🧀', popular: false, available: true, description: 'Naan stuffed with melted cheese' },
  { id: 28, name: 'Laccha Paratha', price: 70, category: 'breads', veg: true, image: '🫓', popular: false, available: true, description: 'Layered flaky paratha' },
  { id: 29, name: 'Missi Roti', price: 50, category: 'breads', veg: true, image: '🫓', popular: false, available: true, description: 'Gram flour mixed bread' },
  { id: 30, name: 'Kulcha', price: 80, category: 'breads', veg: true, image: '🫓', popular: false, available: true, description: 'Leavened bread from tandoor' },

  // Rice & Biryani
  { id: 31, name: 'Veg Biryani', price: 280, category: 'rice', veg: true, image: '🍚', popular: true, available: true, description: 'Fragrant rice with mixed vegetables' },
  { id: 32, name: 'Mutton Biryani', price: 420, category: 'rice', veg: false, image: '🍛', popular: true, available: true, description: 'Hyderabadi-style mutton biryani' },
  { id: 33, name: 'Jeera Rice', price: 180, category: 'rice', veg: true, image: '🍚', popular: false, available: true, description: 'Cumin-tempered basmati rice' },
  { id: 34, name: 'Steamed Rice', price: 140, category: 'rice', veg: true, image: '🍚', popular: false, available: true, description: 'Plain steamed basmati rice' },
  { id: 35, name: 'Egg Fried Rice', price: 220, category: 'rice', veg: false, image: '🥚', popular: false, available: true, description: 'Wok-tossed rice with scrambled egg' },

  // Beverages
  { id: 36, name: 'Masala Chai', price: 60, category: 'beverages', veg: true, image: '☕', popular: true, available: true, description: 'Traditional spiced Indian tea' },
  { id: 37, name: 'Mango Lassi', price: 120, category: 'beverages', veg: true, image: '🥭', popular: true, available: true, description: 'Sweet yogurt shake with mango' },
  { id: 38, name: 'Fresh Lime Soda', price: 80, category: 'beverages', veg: true, image: '🍋', popular: false, available: true, description: 'Freshly squeezed lime with soda' },
  { id: 39, name: 'Cold Coffee', price: 150, category: 'beverages', veg: true, image: '🧊', popular: false, available: true, description: 'Chilled blended coffee with ice cream' },
  { id: 40, name: 'Buttermilk', price: 60, category: 'beverages', veg: true, image: '🥛', popular: false, available: true, description: 'Spiced chilled buttermilk' },
  { id: 41, name: 'Soft Drink', price: 60, category: 'beverages', veg: true, image: '🥤', popular: false, available: true, description: 'Coca-Cola / Pepsi / Sprite' },
  { id: 42, name: 'Water Bottle', price: 30, category: 'beverages', veg: true, image: '💧', popular: false, available: true, description: '1L packaged drinking water' },

  // Desserts
  { id: 43, name: 'Gulab Jamun', price: 120, category: 'desserts', veg: true, image: '🟤', popular: true, available: true, description: 'Deep-fried milk dumplings in sugar syrup' },
  { id: 44, name: 'Rasmalai', price: 150, category: 'desserts', veg: true, image: '🍮', popular: true, available: true, description: 'Cottage cheese dumplings in saffron milk' },
  { id: 45, name: 'Kulfi', price: 100, category: 'desserts', veg: true, image: '🍦', popular: false, available: true, description: 'Traditional Indian ice cream' },
  { id: 46, name: 'Brownie with Ice Cream', price: 200, category: 'desserts', veg: true, image: '🍫', popular: false, available: true, description: 'Warm chocolate brownie with vanilla ice cream' },

  // Chinese
  { id: 47, name: 'Veg Manchurian', price: 220, category: 'chinese', veg: true, image: '🥡', popular: true, available: true, description: 'Crispy veg balls in tangy sauce' },
  { id: 48, name: 'Chilli Chicken', price: 300, category: 'chinese', veg: false, image: '🌶️', popular: true, available: true, description: 'Spicy Indo-Chinese chicken' },
  { id: 49, name: 'Hakka Noodles', price: 200, category: 'chinese', veg: true, image: '🍜', popular: false, available: true, description: 'Stir-fried noodles with vegetables' },
  { id: 50, name: 'Chicken Fried Rice', price: 260, category: 'chinese', veg: false, image: '🍳', popular: false, available: true, description: 'Wok-tossed rice with chicken and vegetables' },
  { id: 51, name: 'Paneer Chilli', price: 260, category: 'chinese', veg: true, image: '🌶️', popular: false, available: true, description: 'Crispy paneer in chilli sauce' },
  { id: 52, name: 'Sweet Corn Soup', price: 140, category: 'chinese', veg: true, image: '🌽', popular: false, available: true, description: 'Creamy sweet corn soup' },
]

export const tables = [
  { id: 1, name: 'T1', capacity: 2, status: 'available', floor: 'ground', x: 5, y: 10 },
  { id: 2, name: 'T2', capacity: 2, status: 'occupied', floor: 'ground', x: 25, y: 10, orderId: 'ORD-A1B2C', amount: 780, guests: 2, time: '12:30 PM' },
  { id: 3, name: 'T3', capacity: 4, status: 'occupied', floor: 'ground', x: 45, y: 10, orderId: 'ORD-D3E4F', amount: 1580, guests: 3, time: '12:45 PM' },
  { id: 4, name: 'T4', capacity: 4, status: 'available', floor: 'ground', x: 65, y: 10 },
  { id: 5, name: 'T5', capacity: 6, status: 'reserved', floor: 'ground', x: 5, y: 35, reservedFor: 'Mr. Sharma', reservedTime: '1:00 PM' },
  { id: 6, name: 'T6', capacity: 6, status: 'occupied', floor: 'ground', x: 25, y: 35, orderId: 'ORD-G5H6I', amount: 2340, guests: 5, time: '12:15 PM' },
  { id: 7, name: 'T7', capacity: 4, status: 'billing', floor: 'ground', x: 45, y: 35, orderId: 'ORD-J7K8L', amount: 1920, guests: 4, time: '11:50 AM' },
  { id: 8, name: 'T8', capacity: 8, status: 'available', floor: 'ground', x: 65, y: 35 },
  { id: 9, name: 'T9', capacity: 2, status: 'available', floor: 'ground', x: 5, y: 60 },
  { id: 10, name: 'T10', capacity: 4, status: 'occupied', floor: 'ground', x: 25, y: 60, orderId: 'ORD-M9N0O', amount: 960, guests: 2, time: '1:00 PM' },
  { id: 11, name: 'T11', capacity: 10, status: 'reserved', floor: 'ground', x: 45, y: 60, reservedFor: 'Birthday Party', reservedTime: '7:00 PM' },
  { id: 12, name: 'T12', capacity: 4, status: 'available', floor: 'ground', x: 65, y: 60 },
  { id: 13, name: 'T13', capacity: 2, status: 'available', floor: 'first', x: 10, y: 15 },
  { id: 14, name: 'T14', capacity: 6, status: 'occupied', floor: 'first', x: 35, y: 15, orderId: 'ORD-P1Q2R', amount: 3200, guests: 6, time: '12:00 PM' },
  { id: 15, name: 'T15', capacity: 4, status: 'available', floor: 'first', x: 60, y: 15 },
  { id: 16, name: 'T16', capacity: 8, status: 'reserved', floor: 'first', x: 10, y: 50, reservedFor: 'Corporate Lunch', reservedTime: '1:30 PM' },
]
