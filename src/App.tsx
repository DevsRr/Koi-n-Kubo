import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';

// Pages
import HomePage from '@/pages/HomePage';
import MenuPage from '@/pages/MenuPage';
import CartPage from '@/pages/CartPage';
import CheckoutPage from '@/pages/CheckoutPage';
import OrderSuccessPage from '@/pages/OrderSuccessPage';
import LoginPage from '@/pages/LoginPage';
import SignupPage from '@/pages/SignupPage';
import OrdersPage from '@/pages/OrdersPage';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminOrders from '@/pages/admin/AdminOrders';
import AdminMenu from '@/pages/admin/AdminMenu';
import AdminStock from '@/pages/admin/AdminStock';
import AdminAnalytics from '@/pages/admin/AdminAnalytics';
import CashierDashboard from '@/pages/cashier/CashierDashboard';
import POSPage from '@/pages/cashier/POSPage';

// Protected Route Component
const ProtectedRoute = ({ 
  children, 
  requireAdmin = false,
  requireCashier = false
}: { 
  children: React.ReactNode; 
  requireAdmin?: boolean;
  requireCashier?: boolean;
}) => {
  const { currentUser, loading, isAdmin, isCashier } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }
  
  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" />;
  }

  if (requireCashier && !isCashier && !isAdmin) {
    return <Navigate to="/" />;
  }
  
  return <>{children}</>;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/menu" element={<MenuPage />} />
      <Route path="/cart" element={<CartPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      
      {/* Protected Customer Routes */}
      <Route 
        path="/checkout" 
        element={
          <ProtectedRoute>
            <CheckoutPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/order-success/:orderId" 
        element={
          <ProtectedRoute>
            <OrderSuccessPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/orders" 
        element={
          <ProtectedRoute>
            <OrdersPage />
          </ProtectedRoute>
        } 
      />
      
      {/* Cashier Routes */}
      <Route 
        path="/cashier" 
        element={
          <ProtectedRoute requireCashier>
            <CashierDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/cashier/pos" 
        element={
          <ProtectedRoute requireCashier>
            <POSPage />
          </ProtectedRoute>
        } 
      />

      {/* Admin Routes */}
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute requireAdmin>
            <AdminDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/orders" 
        element={
          <ProtectedRoute requireAdmin>
            <AdminOrders />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/menu" 
        element={
          <ProtectedRoute requireAdmin>
            <AdminMenu />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/stock" 
        element={
          <ProtectedRoute requireAdmin>
            <AdminStock />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/analytics" 
        element={
          <ProtectedRoute requireAdmin>
            <AdminAnalytics />
          </ProtectedRoute>
        } 
      />
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <AppRoutes />
          <Toaster position="top-right" richColors />
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;