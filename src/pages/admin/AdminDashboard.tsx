import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  TrendingUp,
  AlertTriangle,
  ChevronRight,
  DollarSign
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Navbar from '@/components/Navbar';
import { collection, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { subscribeToOrders } from '@/services/orderService';
import { subscribeToStockAlerts } from '@/services/menuService';
import type { Order, StockAlert, DashboardStats } from '@/types';

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    todaySales: 0,
    todayOrders: 0,
    pendingOrders: 0,
    lowStockItems: 0,
    totalCustomers: 0
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [lowStockAlerts, setLowStockAlerts] = useState<StockAlert[]>([]);

  useEffect(() => {
    // ── Real-time today's orders (includes both online + POS source) ──────
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Listen to ALL orders (online + POS) for today's sales total
    const todayQ = query(
      collection(db, 'orders'),
      where('createdAt', '>=', Timestamp.fromDate(today)),
      orderBy('createdAt', 'desc')
    );
    const unsubToday = onSnapshot(todayQ, (snap) => {
      const todayOrders = snap.docs.map(d => ({ ...d.data(), id: d.id })) as Order[];
      const todaySales = todayOrders.reduce((s, o) => s + ((o as any).total || 0), 0);
      setStats(prev => ({
        ...prev,
        todaySales,
        todayOrders: todayOrders.length,
      }));
    });

    // Listen to pending/confirmed/preparing orders for live pending count
    const pendingQ = query(
      collection(db, 'orders'),
      where('status', 'in', ['pending', 'confirmed', 'preparing']),
      orderBy('createdAt', 'desc')
    );
    const unsubPending = onSnapshot(pendingQ, (snap) => {
      setStats(prev => ({ ...prev, pendingOrders: snap.size }));
    });

    // All orders feed (recent 5 for dashboard)
    const unsubscribeOrders = subscribeToOrders((orders) => {
      setRecentOrders(orders.slice(0, 5));
    });

    const unsubscribeAlerts = subscribeToStockAlerts((alerts) => {
      setLowStockAlerts(alerts.slice(0, 5));
      setStats(prev => ({ ...prev, lowStockItems: alerts.length }));
    });

    return () => {
      unsubToday();
      unsubPending();
      unsubscribeOrders();
      unsubscribeAlerts();
    };
  }, []);

  const statCards = [
    {
      title: "Today's Sales",
      value: `₱${(stats?.todaySales || 0).toFixed(2)}`,
      icon: DollarSign,
      color: 'bg-green-500',
      link: '/admin/analytics'
    },
    {
      title: "Today's Orders",
      value: stats.todayOrders.toString(),
      icon: ShoppingCart,
      color: 'bg-blue-500',
      link: '/admin/orders'
    },
    {
      title: 'Pending Orders',
      value: stats.pendingOrders.toString(),
      icon: Package,
      color: 'bg-orange-500',
      link: '/admin/orders'
    },
    {
      title: 'Low Stock Alerts',
      value: stats.lowStockItems.toString(),
      icon: AlertTriangle,
      color: 'bg-red-500',
      link: '/admin/stock'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'confirmed': return 'bg-blue-500';
      case 'preparing': return 'bg-orange-500';
      case 'ready': return 'bg-purple-500';
      case 'delivered': return 'bg-green-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

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
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600">Welcome back! Here&apos;s what&apos;s happening today.</p>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statCards.map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link to={stat.link}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500 mb-1">{stat.title}</p>
                          <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                        </div>
                        <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                          <stat.icon className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Orders */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg font-bold">Recent Orders</CardTitle>
                  <Link to="/admin/orders" className="text-orange-500 hover:text-orange-600 text-sm flex items-center">
                    View All
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
                </CardHeader>
                <CardContent>
                  {recentOrders.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No recent orders</p>
                  ) : (
                    <div className="space-y-4">
                      {recentOrders.map((order) => (
                        <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-sm">{order.id}</p>
                            <p className="text-xs text-gray-500">{order.customerName}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">₱{(order?.total || 0).toFixed(2)}</p>
                            <Badge className={`${getStatusColor(order.status)} text-white text-xs`}>
                              {order.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Low Stock Alerts */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg font-bold">Low Stock Alerts</CardTitle>
                  <Link to="/admin/stock" className="text-orange-500 hover:text-orange-600 text-sm flex items-center">
                    Manage Stock
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
                </CardHeader>
                <CardContent>
                  {lowStockAlerts.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No low stock alerts</p>
                  ) : (
                    <div className="space-y-4">
                      {lowStockAlerts.map((alert) => (
                        <div key={alert.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                          <div className="flex items-center gap-3">
                            <AlertTriangle className="w-5 h-5 text-red-500" />
                            <div>
                              <p className="font-medium text-sm">{alert.itemName}</p>
                              <p className="text-xs text-red-600">
                                Only {alert.currentStock} left (threshold: {alert.threshold})
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-8"
          >
            <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Manage Orders', icon: ShoppingCart, link: '/admin/orders' },
                { label: 'Update Menu', icon: LayoutDashboard, link: '/admin/menu' },
                { label: 'Check Stock', icon: Package, link: '/admin/stock' },
                { label: 'View Analytics', icon: TrendingUp, link: '/admin/analytics' }
              ].map((action) => (
                <Link key={action.label} to={action.link}>
                  <div className="flex flex-col items-center p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
                    <action.icon className="w-8 h-8 text-orange-500 mb-2" />
                    <span className="text-sm font-medium text-gray-700">{action.label}</span>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;