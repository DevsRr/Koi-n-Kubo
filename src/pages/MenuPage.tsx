import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, ShoppingCart, Star, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import Navbar from '@/components/Navbar';
import { menuItems, categories } from '@/data/menuData';
import { useCart } from '@/contexts/CartContext';

const MenuPage = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({});
  const { addToCart, isItemInCart } = useCart();

  const filteredItems = selectedCategory === 'all' 
    ? menuItems 
    : menuItems.filter(item => item.category === selectedCategory);

  const handleQuantityChange = (itemId: string, delta: number) => {
    setQuantities(prev => ({
      ...prev,
      [itemId]: Math.max(1, (prev[itemId] || 1) + delta)
    }));
  };

  const handleAddToCart = (item: typeof menuItems[0]) => {
    const quantity = quantities[item.id] || 1;
    
    // Check stock before adding
    if (quantity > item.stock) {
      toast.error(`Only ${item.stock} items available`);
      return;
    }
    
    addToCart(item, quantity);
    setQuantities(prev => ({ ...prev, [item.id]: 1 }));
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4, ease: 'easeOut' as const }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Header */}
      <div className="pt-24 pb-8 bg-gradient-to-b from-gray-900 to-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
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
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedCategory}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {filteredItems.map((item) => (
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
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://placehold.co/400x400/f3f4f6/374151?text=${encodeURIComponent(item.name)}`;
                    }}
                  />
                  
                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex flex-col gap-2">
                    {item.isBestSeller && (
                      <Badge className="bg-orange-500 text-white flex items-center gap-1">
                        <Star className="w-3 h-3 fill-current" />
                        Best Seller
                      </Badge>
                    )}
                    {!item.isAvailable && (
                      <Badge variant="destructive">Out of Stock</Badge>
                    )}
                  </div>

                  {/* Price Tag */}
                  <div className="absolute bottom-3 right-3">
                    <span className="bg-white/90 backdrop-blur-sm text-gray-900 font-bold px-3 py-1 rounded-full shadow-lg">
                      ₱{item.price.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-lg text-gray-900 group-hover:text-orange-500 transition-colors">
                      {item.name}
                    </h3>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {item.description}
                  </p>

                  {/* Stock Indicator */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className={`w-2 h-2 rounded-full ${
                      item.stock > item.lowStockThreshold 
                        ? 'bg-green-500' 
                        : item.stock > 0 
                          ? 'bg-yellow-500' 
                          : 'bg-red-500'
                    }`} />
                    <span className="text-xs text-gray-500">
                      {item.stock > item.lowStockThreshold 
                        ? 'In Stock' 
                        : item.stock > 0 
                          ? `Only ${item.stock} left` 
                          : 'Out of Stock'}
                    </span>
                  </div>

                  {/* Add to Cart */}
                  {item.isAvailable && item.stock > 0 ? (
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
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            Added
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="w-4 h-4 mr-2" />
                            Add
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <Button
                      disabled
                      className="w-full bg-gray-300 text-gray-500 cursor-not-allowed"
                    >
                      Out of Stock
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Empty State */}
        {filteredItems.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <p className="text-gray-500 text-lg">No items found in this category.</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default MenuPage;
