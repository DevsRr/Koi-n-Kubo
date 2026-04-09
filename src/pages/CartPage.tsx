import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Navbar from '@/components/Navbar';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';

const CartPage = () => {
  const { items, total, updateQuantity, removeFromCart, clearCart } = useCart();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const handleCheckout = () => {
    if (!currentUser) {
      navigate('/login');
    } else {
      navigate('/checkout');
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="pt-24 pb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShoppingBag className="w-12 h-12 text-gray-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
              <p className="text-gray-600 mb-6">Looks like you haven't added any items yet.</p>
              <Link to="/menu">
                <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                  Browse Menu
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Link to="/menu" className="inline-flex items-center text-gray-600 hover:text-orange-500 mb-4 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Continue Shopping
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
            <p className="text-gray-600">{items.length} item(s) in your cart</p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <AnimatePresence mode="popLayout">
                {items.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="mb-4 overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          {/* Image */}
                          <div className="w-24 h-24 flex-shrink-0">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover rounded-lg"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = `https://placehold.co/200x200/f3f4f6/374151?text=${encodeURIComponent(item.name)}`;
                              }}
                            />
                          </div>

                          {/* Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-bold text-gray-900 truncate">{item.name}</h3>
                                <p className="text-sm text-gray-600 line-clamp-1">{item.description}</p>
                              </div>
                              <button
                                onClick={() => removeFromCart(item.id)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="flex items-center justify-between mt-4">
                              {/* Quantity Controls */}
                              <div className="flex items-center bg-gray-100 rounded-lg">
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                  className="p-2 hover:bg-gray-200 rounded-l-lg transition-colors"
                                >
                                  <Minus className="w-4 h-4" />
                                </button>
                                <span className="w-10 text-center font-medium">{item.quantity}</span>
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                  className="p-2 hover:bg-gray-200 rounded-r-lg transition-colors"
                                  disabled={item.quantity >= item.stock}
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              </div>

                              {/* Price */}
                              <div className="text-right">
                                <p className="font-bold text-gray-900">
                                  ₱{(item.price * item.quantity).toFixed(2)}
                                </p>
                                <p className="text-sm text-gray-500">
                                  ₱{item.price.toFixed(2)} each
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Clear Cart */}
              <Button
                variant="outline"
                onClick={clearCart}
                className="text-red-500 border-red-200 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear Cart
              </Button>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="sticky top-24">
                  <CardContent className="p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>
                    
                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between text-gray-600">
                        <span>Subtotal ({items.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
                        <span>₱{total.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Delivery Fee</span>
                        <span className="text-green-600">FREE</span>
                      </div>
                      <div className="border-t pt-3">
                        <div className="flex justify-between text-lg font-bold text-gray-900">
                          <span>Total</span>
                          <span>₱{total.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={handleCheckout}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white py-6 text-lg"
                    >
                      {currentUser ? (
                        <>
                          Proceed to Checkout
                          <ArrowRight className="w-5 h-5 ml-2" />
                        </>
                      ) : (
                        'Login to Checkout'
                      )}
                    </Button>

                    {!currentUser && (
                      <p className="text-center text-sm text-gray-500 mt-3">
                        Don't have an account?{' '}
                        <Link to="/signup" className="text-orange-500 hover:text-orange-600">
                          Sign up
                        </Link>
                      </p>
                    )}

                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Payment Method:</span> Cash on Delivery
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Pay when your order arrives at your doorstep.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
