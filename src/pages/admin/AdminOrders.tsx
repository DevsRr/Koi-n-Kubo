import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Package, 
  MapPin,
  Phone,
  User
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Navbar from '@/components/Navbar';
import { subscribeToOrders, updateOrderStatus } from '@/services/orderService';
import type { Order } from '@/types';

const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToOrders((updatedOrders) => {
      console.log('Orders:', updatedOrders); // DEBUG
      setOrders(updatedOrders || []);
      setFilteredOrders(updatedOrders || []);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let filtered = orders;

    if (searchQuery) {
      filtered = filtered.filter(order =>
        (order.id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (order.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (order.customerEmail || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    setFilteredOrders(filtered);
  }, [orders, searchQuery, statusFilter]);

  const handleStatusChange = async (orderId: string, newStatus: Order['status']) => {
    try {
      await updateOrderStatus(orderId, newStatus);
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

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

  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'preparing', label: 'Preparing' },
    { value: 'ready', label: 'Ready' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  // ✅ SAFE DATE HANDLER
  const formatDate = (date: any) => {
    try {
      if (!date) return 'N/A';
      if (date?.toDate) return date.toDate().toLocaleString('en-PH');
      return new Date(date).toLocaleString('en-PH');
    } catch {
      return 'Invalid Date';
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
            <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
            <p className="text-gray-600">View and manage customer orders</p>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col md:flex-row gap-4 mb-6"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {statusOptions.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </motion.div>

          {/* Orders */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOrders.map((order, index) => (
              <Card
                key={order.id || index}
                className="cursor-pointer hover:shadow-lg"
                onClick={() => {
                  setSelectedOrder(order);
                  setIsDetailOpen(true);
                }}
              >
                <CardContent className="p-4">

                  <div className="flex justify-between mb-3">
                    <div>
                      <p className="font-mono text-sm">{order.id || 'N/A'}</p>
                      <p className="text-xs text-gray-500">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <Badge className={`${getStatusColor(order.status)} text-white`}>
                      {order.status}
                    </Badge>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4 text-gray-400" />
                      {order.customerName || 'N/A'}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-gray-400" />
                      {order.customerPhone || 'N/A'}
                    </div>
                  </div>

                  <div className="flex justify-between pt-3 border-t">
                    <span className="text-sm text-gray-600">
                      {(order.items || []).length} item(s)
                    </span>
                    <span className="font-bold">
                      ₱{(order.total ?? 0).toFixed(2)}
                    </span>
                  </div>

                </CardContent>
              </Card>
            ))}
          </div>

          {filteredOrders.length === 0 && (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p>No orders found</p>
            </div>
          )}

        </div>
      </div>

      {/* Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent>
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle>Order Details</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">

                <p><strong>ID:</strong> {selectedOrder.id}</p>
                <p><strong>Date:</strong> {formatDate(selectedOrder.createdAt)}</p>

                <div>
                  <h3>Items</h3>
                  {(selectedOrder.items || []).map((item, i) => (
                    <div key={i} className="flex justify-between">
                      <span>{item.name}</span>
                      <span>
                        ₱{((item.price ?? 0) * (item.quantity ?? 0)).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="font-bold">
                  Total: ₱{(selectedOrder.total ?? 0).toFixed(2)}
                </div>

              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOrders;