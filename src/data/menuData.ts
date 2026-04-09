import type { MenuItem } from '@/types';

export const menuItems: MenuItem[] = [
  // KATSU BOWLS
  {
    id: 'pork-katsu',
    name: 'Pork Katsu',
    description: 'Breaded pork cutlet with a special sauce',
    price: 149.00,
    category: 'katsu-bowls',
    image: '/images/pork-katsu.jpg',
    stock: 50,
    lowStockThreshold: 10,
    isAvailable: true
  },
  {
    id: 'chicken-katsu',
    name: 'Chicken Katsu',
    description: 'Japanese-style chicken cutlet (tori katsu) served with tonkatsu sauce',
    price: 139.00,
    category: 'katsu-bowls',
    image: '/images/chicken-katsu.jpg',
    stock: 50,
    lowStockThreshold: 10,
    isAvailable: true
  },
  {
    id: 'katsu-curry',
    name: 'Katsu Curry',
    description: 'Breaded chicken cutlet served with Japanese curry sauce',
    price: 149.00,
    category: 'katsu-bowls',
    image: '/images/katsu-curry.jpg',
    stock: 45,
    lowStockThreshold: 10,
    isAvailable: true
  },
  {
    id: 'doriyaki-katsu',
    name: 'Doriyaki Katsu',
    description: 'Breaded dory fish with teriyaki sauce, garnished with bonito flakes',
    price: 139.00,
    category: 'katsu-bowls',
    image: '/images/doriyaki-katsu.jpg',
    stock: 40,
    lowStockThreshold: 10,
    isAvailable: true
  },
  {
    id: 'shrimp-katsu',
    name: 'Shrimp Katsu',
    description: 'Breaded shrimp (Ebi Katsu) served with a spicy mayonnaise sauce',
    price: 189.00,
    category: 'katsu-bowls',
    image: '/images/shrimp-katsu.jpg',
    stock: 35,
    lowStockThreshold: 8,
    isAvailable: true
  },
  
  // RAMEN - BEST SELLERS
  {
    id: 'tonkotsu-ramen',
    name: 'Tonkotsu Ramen',
    description: 'Noodle in a savory pork bone soup, topped with a slice of chashu and ajitsuke tamago',
    price: 160.00,
    category: 'ramen',
    image: '/images/tonkotsu-ramen.jpg',
    stock: 40,
    lowStockThreshold: 10,
    isAvailable: true,
    isBestSeller: true
  },
  {
    id: 'shoyu-ramen',
    name: 'Shoyu Ramen',
    description: 'Noodle in a tangy, salty, and savory soup, topped with a slice of chashu, narutomaki, and ajitsuke tamago',
    price: 160.00,
    category: 'ramen',
    image: '/images/shoyu-ramen.jpg',
    stock: 40,
    lowStockThreshold: 10,
    isAvailable: true,
    isBestSeller: true
  },
  {
    id: 'tantamen',
    name: 'Tantamen',
    description: 'Noodle in a reddish, spicy chili, and sesame soup, topped with a slice of chashu and ajitsuke tamago',
    price: 180.00,
    category: 'ramen',
    image: '/images/tantamen.jpg',
    stock: 35,
    lowStockThreshold: 8,
    isAvailable: true,
    isBestSeller: true
  },
  {
    id: 'curry-ramen',
    name: 'Curry Ramen',
    description: 'Ramen in a cream curry soup, topped with a slice of chashu and ajitsuke tamago',
    price: 180.00,
    category: 'ramen',
    image: '/images/curry-ramen.jpg',
    stock: 35,
    lowStockThreshold: 8,
    isAvailable: true,
    isBestSeller: true
  },
  {
    id: 'spicy-miso',
    name: 'Spicy Miso',
    description: 'Noodle in a spicy miso soup, topped with a slice of chashu and ajitsuke tamago. Perfect for spicy food lovers',
    price: 170.00,
    category: 'ramen',
    image: '/images/spicy-miso.jpg',
    stock: 38,
    lowStockThreshold: 10,
    isAvailable: true
  },
  {
    id: 'miso-ramen',
    name: 'Miso Ramen',
    description: 'Noodle in a creamy, nutty, and heaty miso soup, topped with a slice of chashu and ajitsuke tamago',
    price: 160.00,
    category: 'ramen',
    image: '/images/miso-ramen.jpg',
    stock: 40,
    lowStockThreshold: 10,
    isAvailable: true
  },
  
  // RICE MEALS
  {
    id: 'chicken-katsu-salad',
    name: 'Chicken Katsu Salad',
    description: 'Breaded chicken cutlet served with corn, lettuce, fresh cucumber slices, and egg',
    price: 149.00,
    category: 'rice-meals',
    image: '/images/chicken-katsu.jpg',
    stock: 45,
    lowStockThreshold: 10,
    isAvailable: true
  },
  {
    id: 'katsu-kare',
    name: 'Katsu Kare',
    description: 'A traditional Filipino stew complimented with a thick savory peanut sauce with katsu toppings. You can choose between Pork, Chicken or Dory',
    price: 169.00,
    category: 'rice-meals',
    image: '/images/katsu-curry.jpg',
    stock: 40,
    lowStockThreshold: 10,
    isAvailable: true
  },
  {
    id: 'pork-bistek-gyudon',
    name: 'Pork Bistek Gyudon',
    description: 'Pork Bistek is a delicious take on the classic Filipino beef steak. With tender pork katsu and a tangy and savory sauce',
    price: 159.00,
    category: 'rice-meals',
    image: '/images/pork-katsu.jpg',
    stock: 42,
    lowStockThreshold: 10,
    isAvailable: true
  },
  {
    id: 'humba-katsu',
    name: 'Humba Katsu',
    description: 'A savory Filipino dish made from tender pork bits in a flavorful sauce of soy sauce, brown sugar, vinegar, and spices',
    price: 159.00,
    category: 'rice-meals',
    image: '/images/pork-katsu.jpg',
    stock: 40,
    lowStockThreshold: 10,
    isAvailable: true
  },
  
  // EXTRAS
  {
    id: 'extra-chashu',
    name: 'Chashu',
    description: 'Extra slice of tender braised pork',
    price: 40.00,
    category: 'extras',
    image: '/images/tonkotsu-ramen.jpg',
    stock: 100,
    lowStockThreshold: 20,
    isAvailable: true
  },
  {
    id: 'extra-noodles',
    name: 'Noodles',
    description: 'Extra serving of ramen noodles',
    price: 35.00,
    category: 'extras',
    image: '/images/tonkotsu-ramen.jpg',
    stock: 100,
    lowStockThreshold: 20,
    isAvailable: true
  },
  {
    id: 'extra-ajitsuke-tamago',
    name: 'Ajitsuke Tamago',
    description: 'Extra seasoned soft-boiled egg',
    price: 20.00,
    category: 'extras',
    image: '/images/tonkotsu-ramen.jpg',
    stock: 80,
    lowStockThreshold: 15,
    isAvailable: true
  },
  {
    id: 'extra-rice',
    name: 'Japanese Rice',
    description: 'Extra serving of Japanese rice',
    price: 30.00,
    category: 'extras',
    image: '/images/pork-katsu.jpg',
    stock: 150,
    lowStockThreshold: 30,
    isAvailable: true
  },
  {
    id: 'extra-japmayo',
    name: 'JapMayo',
    description: 'Japanese mayonnaise',
    price: 15.00,
    category: 'extras',
    image: '/images/shrimp-katsu.jpg',
    stock: 100,
    lowStockThreshold: 20,
    isAvailable: true
  },
  {
    id: 'extra-sauce',
    name: 'Extra Sauce',
    description: 'Additional sauce of your choice',
    price: 15.00,
    category: 'extras',
    image: '/images/katsu-curry.jpg',
    stock: 100,
    lowStockThreshold: 20,
    isAvailable: true
  }
];

export const categories = [
  { id: 'all', name: 'All Items', icon: '🍽️' },
  { id: 'katsu-bowls', name: 'Katsu Bowls', icon: '🍱' },
  { id: 'ramen', name: 'Ramen', icon: '🍜' },
  { id: 'rice-meals', name: 'Rice Meals', icon: '🍚' },
  { id: 'extras', name: 'Extras', icon: '➕' }
];
