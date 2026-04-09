import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  Package,
  Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Navbar from '@/components/Navbar';
import { getSalesAnalytics } from '@/services/orderService';
import { subscribeToMenuItems } from '@/services/menuService';
import type { MenuItem } from '@/types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';

const AdminAnalytics = () => {
  const [analytics, setAnalytics] = useState({
    totalSales: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    topSellingItems: [] as { name: string; quantity: number }[],
    salesByDate: [] as { date: string; sales: number; orders: number }[]
  });
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState(30);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const data = await getSalesAnalytics(dateRange);
        setAnalytics(data);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();

    const unsubscribe = subscribeToMenuItems((items) => {
      setMenuItems(items);
    });

    return () => unsubscribe();
  }, [dateRange]);

  const lowStockItems = menuItems.filter(item => item.stock <= item.lowStockThreshold);
  const outOfStockItems = menuItems.filter(item => item.stock === 0);

  const statCards = [
    {
      title: 'Total Sales',
      value: `₱${analytics.totalSales.toFixed(2)}`,
      icon: DollarSign,
      color: 'bg-green-500'
    },
    {
      title: 'Total Orders',
      value: analytics.totalOrders.toString(),
      icon: ShoppingCart,
      color: 'bg-blue-500'
    },
    {
      title: 'Average Order',
      value: `₱${analytics.averageOrderValue.toFixed(2)}`,
      icon: TrendingUp,
      color: 'bg-orange-500'
    },
    {
      title: 'Menu Items',
      value: menuItems.length.toString(),
      icon: Package,
      color: 'bg-purple-500'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="pt-24 pb-12 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
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
            className="flex flex-col md:flex-row md:items-center md:justify-between mb-8"
          >
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="text-gray-600">Track your restaurant&apos;s performance</p>
            </div>
            <div className="mt-4 md:mt-0 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-400" />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(Number(e.target.value))}
                className="border rounded-lg px-3 py-2 text-sm"
              >
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
              </select>
            </div>
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
                <Card>
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
              </motion.div>
            ))}
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Sales Trend Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-bold">Sales Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analytics.salesByDate}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(date) => new Date(date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                        />
                        <YAxis />
                        <Tooltip 
                          formatter={(value: number) => `₱${value.toFixed(2)}`}
                          labelFormatter={(label) => new Date(label).toLocaleDateString('en-PH')}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="sales" 
                          stroke="#f97316" 
                          strokeWidth={2}
                          dot={{ fill: '#f97316' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Orders Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-bold">Orders Per Day</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.salesByDate}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(date) => new Date(date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                        />
                        <YAxis />
                        <Tooltip 
                          labelFormatter={(label) => new Date(label).toLocaleDateString('en-PH')}
                        />
                        <Bar dataKey="orders" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Bottom Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Top Selling Items */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-bold">Top Selling Items</CardTitle>
                </CardHeader>
                <CardContent>
                  {analytics.topSellingItems.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No sales data yet</p>
                  ) : (
                    <div className="space-y-4">
                      {analytics.topSellingItems.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                              index === 0 ? 'bg-yellow-500' :
                              index === 1 ? 'bg-gray-400' :
                              index === 2 ? 'bg-orange-600' :
                              'bg-gray-300'
                            }`}>
                              {index + 1}
                            </div>
                            <span className="font-medium">{item.name}</span>
                          </div>
                          <Badge variant="secondary">
                            {item.quantity} sold
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Stock Status */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-bold">Stock Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full" />
                        <span>In Stock</span>
                      </div>
                      <Badge className="bg-green-500 text-white">
                        {menuItems.filter(i => i.stock > i.lowStockThreshold).length}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                        <span>Low Stock</span>
                      </div>
                      <Badge className="bg-yellow-500 text-white">
                        {lowStockItems.length}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-red-500 rounded-full" />
                        <span>Out of Stock</span>
                      </div>
                      <Badge className="bg-red-500 text-white">
                        {outOfStockItems.length}
                      </Badge>
                    </div>
                  </div>

                  {lowStockItems.length > 0 && (
                    <div className="mt-6">
                      <p className="text-sm font-medium text-gray-700 mb-2">Low Stock Items:</p>
                      <div className="flex flex-wrap gap-2">
                        {lowStockItems.slice(0, 5).map(item => (
                          <Badge key={item.id} variant="outline" className="text-yellow-600 border-yellow-300">
                            {item.name} ({item.stock})
                          </Badge>
                        ))}
                        {lowStockItems.length > 5 && (
                          <Badge variant="outline">+{lowStockItems.length - 5} more</Badge>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
