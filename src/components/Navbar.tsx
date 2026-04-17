import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingCart, Menu, X, LogOut, ChefHat, 
  LayoutDashboard, ClipboardList, Package,
  BarChart3, Monitor
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { currentUser, isAdmin, isCashier, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setIsMobileMenuOpen(false);
  };

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/menu', label: 'Menu' },
  ];

  const adminLinks = [
    { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/orders', label: 'Orders', icon: ClipboardList },
    { path: '/admin/menu', label: 'Menu', icon: ChefHat },
    { path: '/admin/stock', label: 'Stock', icon: Package },
    { path: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  ];

  const cashierLinks = [
    { path: '/cashier', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/cashier/pos', label: 'POS', icon: Monitor },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white/95 backdrop-blur-md shadow-lg' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="relative w-10 h-10 md:w-12 md:h-12">
              <img
                src="/images/logo.png"
                alt="KOI 'N KUBO"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🍜</text></svg>';
                }}
              />
            </div>
            <span className={`font-bold text-lg md:text-xl transition-colors ${
              isScrolled ? 'text-gray-900' : 'text-white'
            }`}>
              KOI &apos;N KUBO
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {/* Customer links */}
            {!isAdmin && !isCashier && navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`relative font-medium transition-colors hover:text-orange-500 ${
                  isActive(link.path) ? 'text-orange-500' : isScrolled ? 'text-gray-700' : 'text-white'
                }`}
              >
                {link.label}
                {isActive(link.path) && (
                  <motion.div layoutId="navbar-underline" className="absolute -bottom-1 left-0 right-0 h-0.5 bg-orange-500" />
                )}
              </Link>
            ))}

            {/* Admin links */}
            {isAdmin && adminLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`relative font-medium transition-colors hover:text-orange-500 ${
                  isActive(link.path) ? 'text-orange-500' : isScrolled ? 'text-gray-700' : 'text-white'
                }`}
              >
                <span className="flex items-center space-x-1">
                  <link.icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </span>
                {isActive(link.path) && (
                  <motion.div layoutId="navbar-underline" className="absolute -bottom-1 left-0 right-0 h-0.5 bg-orange-500" />
                )}
              </Link>
            ))}

            {/* Cashier links */}
            {isCashier && cashierLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`relative font-medium transition-colors hover:text-orange-500 ${
                  isActive(link.path) ? 'text-orange-500' : isScrolled ? 'text-gray-700' : 'text-white'
                }`}
              >
                <span className="flex items-center space-x-1">
                  <link.icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </span>
                {isActive(link.path) && (
                  <motion.div layoutId="navbar-underline" className="absolute -bottom-1 left-0 right-0 h-0.5 bg-orange-500" />
                )}
              </Link>
            ))}
          </div>

          {/* Right Side */}
          <div className="flex items-center space-x-2 md:space-x-4">
            {!isAdmin && !isCashier && (
              <Link to="/cart">
                <Button variant="ghost" size="icon" className={`relative ${isScrolled ? 'text-gray-700' : 'text-white'}`}>
                  <ShoppingCart className="w-5 h-5" />
                  {itemCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
                    >
                      {itemCount}
                    </motion.span>
                  )}
                </Button>
              </Link>
            )}

            {currentUser ? (
              <div className="hidden md:flex items-center space-x-2">
                {!isAdmin && !isCashier && (
                  <Link to="/orders">
                    <Button variant="ghost" size="sm" className={isScrolled ? 'text-gray-700' : 'text-white'}>
                      My Orders
                    </Button>
                  </Link>
                )}
                <Button variant="ghost" size="icon" onClick={handleLogout} className={isScrolled ? 'text-gray-700' : 'text-white'}>
                  <LogOut className="w-5 h-5" />
                </Button>
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm" className={isScrolled ? 'text-gray-700' : 'text-white'}>Login</Button>
                </Link>
                <Link to="/signup">
                  <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white">Sign Up</Button>
                </Link>
              </div>
            )}

            <Button
              variant="ghost" size="icon"
              className={`md:hidden ${isScrolled ? 'text-gray-700' : 'text-white'}`}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t shadow-lg"
          >
            <div className="px-4 py-4 space-y-2">
              {!isAdmin && !isCashier && navLinks.map((link) => (
                <Link key={link.path} to={link.path} onClick={() => setIsMobileMenuOpen(false)}
                  className={`block py-2 px-4 rounded-lg font-medium ${isActive(link.path) ? 'bg-orange-50 text-orange-500' : 'text-gray-700 hover:bg-gray-50'}`}>
                  {link.label}
                </Link>
              ))}

              {isAdmin && adminLinks.map((link) => (
                <Link key={link.path} to={link.path} onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center space-x-2 py-2 px-4 rounded-lg font-medium ${isActive(link.path) ? 'bg-orange-50 text-orange-500' : 'text-gray-700 hover:bg-gray-50'}`}>
                  <link.icon className="w-4 h-4" /><span>{link.label}</span>
                </Link>
              ))}

              {isCashier && cashierLinks.map((link) => (
                <Link key={link.path} to={link.path} onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center space-x-2 py-2 px-4 rounded-lg font-medium ${isActive(link.path) ? 'bg-orange-50 text-orange-500' : 'text-gray-700 hover:bg-gray-50'}`}>
                  <link.icon className="w-4 h-4" /><span>{link.label}</span>
                </Link>
              ))}

              {!isAdmin && !isCashier && currentUser && (
                <Link to="/orders" onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center space-x-2 py-2 px-4 rounded-lg font-medium text-gray-700 hover:bg-gray-50">
                  <ClipboardList className="w-4 h-4" /><span>My Orders</span>
                </Link>
              )}

              {currentUser ? (
                <button onClick={handleLogout}
                  className="w-full flex items-center space-x-2 py-2 px-4 rounded-lg font-medium text-red-600 hover:bg-red-50">
                  <LogOut className="w-4 h-4" /><span>Logout</span>
                </button>
              ) : (
                <>
                  <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}
                    className="block py-2 px-4 rounded-lg font-medium text-gray-700 hover:bg-gray-50">Login</Link>
                  <Link to="/signup" onClick={() => setIsMobileMenuOpen(false)}
                    className="block py-2 px-4 rounded-lg font-medium bg-orange-500 text-white text-center">Sign Up</Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;