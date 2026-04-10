import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, ShoppingCart, Star, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import Navbar from '@/components/Navbar';
import { categories, menuItems as localMenuItems } from '@/data/menuData';
import { subscribeToMenuItems, initializeMenuItems } from '@/services/menuService';
import { useCart } from '@/contexts/CartContext';
import type { MenuItem } from '@/types';

const MenuPage = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({});
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart, isItemInCart } = useCart();

  useEffect(() => {
    const unsubscribe = subscribeToMenuItems(async (items) => {
      if (items.length === 0) {
        // Firestore is empty — initialize from local data
        await initializeMenuItems(localMenuItems);
      } else {
        setMenuItems(items);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const filteredItems = selectedCategory === 'all'
    ? menuItems
    : menuItems.filter(item => item.category === selectedCategory);

  const handleQuantityChange = (itemId: string, delta: number) => {
    setQuantities(prev => ({
      ...prev,
      [itemId]: Math.max(1, (prev[itemId] || 1) + delta)
    }));
  };

  const handleAddToCart = (item: MenuItem) => {
    const quantity = quantities[item.id] || 1;
    if (quantity > item.stock) {
      toast.error(`Only ${item.stock} items available`);
      return;
    }
    addToCart(item, quantity);
    setQuantities(prev => ({ ...prev, [item.id]: 1 }));
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Header */}
      <div className="pt-24 pb-8 bg-gradient-to-b from-gray-900 to-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Our <span className="text-orange-500">Menu</span>
            </h1>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Discover our delicious selection of Japanese-Filipino fusion dishes,
              crafted with love and the freshest ingredients.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="sticky top-16 z-40 bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 py-4 overflow-x-auto scrollbar-hide">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                  selectedCategory === category.id
                    ? 'bg-orange-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span>{category.icon}</span>
                <span className="font-medium">{category.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedCategory}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {filteredItems.map((item) => {
                const isSoldOut = item.stock <= 0 || !item.isAvailable;
                const isLowStock = item.stock > 0 && item.stock <= item.lowStockThreshold;

                return (
                  <motion.div
                    key={item.id}
                    variants={itemVariants}
                    layout
                    className="group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300"
                  >
                    {/* Image */}
                    <div className="relative aspect-square overflow-hidden">
                      <img
                        src={item.image}
                        alt={item.name}
                        className={`w-full h-full object-cover transition-transform duration-500 ${isSoldOut ? 'grayscale opacity-60' : 'group-hover:scale-110'}`}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://placehold.co/400x400/f3f4f6/374151?text=${encodeURIComponent(item.name)}`;
                        }}
                      />

                      {/* Sold Out Overlay */}
                      {isSoldOut && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <div className="bg-red-600 text-white font-bold text-xl px-6 py-2 rounded-full rotate-[-15deg] shadow-lg">
                            SOLD OUT
                          </div>
                        </div>
                      )}

                      {/* Badges */}
                      <div className="absolute top-3 left-3 flex flex-col gap-2">
                        {item.isBestSeller && !isSoldOut && (
                          <Badge className="bg-orange-500 text-white flex items-center gap-1">
                            <Star className="w-3 h-3 fill-current" />
                            Best Seller
                          </Badge>
                        )}
                        {isLowStock && !isSoldOut && (
                          <Badge className="bg-yellow-500 text-white">
                            Only {item.stock} left!
                          </Badge>
                        )}
                      </div>

                      {/* Price Tag */}
                      {!isSoldOut && (
                        <div className="absolute bottom-3 right-3">
                          <span className="bg-white/90 backdrop-blur-sm text-gray-900 font-bold px-3 py-1 rounded-full shadow-lg">
                            ₱{(item?.price || 0).toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className={`font-bold text-lg transition-colors ${isSoldOut ? 'text-gray-400' : 'text-gray-900 group-hover:text-orange-500'}`}>
                          {item.name}
                        </h3>
                        <span className={`font-bold ${isSoldOut ? 'text-gray-400' : 'text-orange-500'}`}>
                          ₱{(item?.price || 0).toFixed(2)}
                        </span>
                      </div>

                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {item.description}
                      </p>

                      {/* Stock Indicator */}
                      <div className="flex items-center gap-2 mb-4">
                        <div className={`w-2 h-2 rounded-full ${
                          isSoldOut ? 'bg-red-500' : isLowStock ? 'bg-yellow-500' : 'bg-green-500'
                        }`} />
                        <span className={`text-xs font-medium ${
                          isSoldOut ? 'text-red-500' : isLowStock ? 'text-yellow-600' : 'text-gray-500'
                        }`}>
                          {isSoldOut
                            ? 'Sold Out'
                            : isLowStock
                              ? `Only ${item.stock} left`
                              : 'In Stock'}
                        </span>
                      </div>

                      {/* Add to Cart */}
                      {!isSoldOut ? (
                        <div className="flex items-center gap-2">
                          <div className="flex items-center bg-gray-100 rounded-lg">
                            <button
                              onClick={() => handleQuantityChange(item.id, -1)}
                              className="p-2 hover:bg-gray-200 rounded-l-lg transition-colors"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-8 text-center font-medium">
                              {quantities[item.id] || 1}
                            </span>
                            <button
                              onClick={() => handleQuantityChange(item.id, 1)}
                              className="p-2 hover:bg-gray-200 rounded-r-lg transition-colors"
                              disabled={(quantities[item.id] || 1) >= item.stock}
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>

                          <Button
                            onClick={() => handleAddToCart(item)}
                            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                            disabled={isItemInCart(item.id)}
                          >
                            {isItemInCart(item.id) ? (
                              <><Check className="w-4 h-4 mr-2" />Added</>
                            ) : (
                              <><ShoppingCart className="w-4 h-4 mr-2" />Add</>
                            )}
                          </Button>
                        </div>
                      ) : (
                        <Button disabled className="w-full bg-gray-200 text-gray-400 cursor-not-allowed">
                          Sold Out
                        </Button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        )}

        {!loading && filteredItems.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
            <p className="text-gray-500 text-lg">No items found in this category.</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default MenuPage;