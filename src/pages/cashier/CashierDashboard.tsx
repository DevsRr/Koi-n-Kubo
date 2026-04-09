import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Filter,
  Package,
  MapPin,
  Phone,
  User,
  Printer,
  CheckCircle,
  Clock,
  ChefHat,
  Truck,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

const CashierDashboard = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = subscribeToOrders((updatedOrders) => {
      setOrders(updatedOrders);
      setFilteredOrders(updatedOrders);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let filtered = orders;
    if (searchQuery) {
      filtered = filtered.filter(order =>
        order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customerPhone.includes(searchQuery)
      );
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }
    setFilteredOrders(filtered);
  }, [orders, searchQuery, statusFilter]);

  const handleStatusChange = async (orderId: string, newStatus: Order['status']) => {
    setIsUpdating(true);
    try {
      await updateOrderStatus(orderId, newStatus);
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (error) {
      console.error('Error updating order status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePrintReceipt = () => {
    if (!selectedOrder) return;

    const receiptWindow = window.open('', '_blank', 'width=400,height=600');
    if (!receiptWindow) return;

    const receiptHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt - ${selectedOrder.id}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Courier New', monospace; font-size: 13px; padding: 20px; width: 300px; }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .divider { border-top: 1px dashed #000; margin: 8px 0; }
            .row { display: flex; justify-content: space-between; margin: 4px 0; }
            .logo { font-size: 20px; font-weight: bold; margin-bottom: 4px; }
            .small { font-size: 11px; color: #555; }
            .total-row { font-size: 15px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="center">
            <div class="logo">KOI 'N KUBO</div>
            <div class="small">Japanese-Filipino Cuisine</div>
            <div class="small">Cash on Delivery</div>
          </div>

          <div class="divider"></div>

          <div class="small">Order ID: ${selectedOrder.id}</div>
          <div class="small">Date: ${selectedOrder.createdAt.toLocaleString('en-PH')}</div>
          <div class="small">Status: ${selectedOrder.status.toUpperCase()}</div>

          <div class="divider"></div>

          <div class="bold">Customer Info</div>
          <div class="small">Name: ${selectedOrder.customerName}</div>
          <div class="small">Phone: ${selectedOrder.customerPhone}</div>
          <div class="small">Address: ${selectedOrder.deliveryAddress.street}, ${selectedOrder.deliveryAddress.barangay}, ${selectedOrder.deliveryAddress.city}</div>
          ${selectedOrder.deliveryAddress.landmark ? `<div class="small">Landmark: ${selectedOrder.deliveryAddress.landmark}</div>` : ''}

          <div class="divider"></div>

          <div class="bold">Order Items</div>
          <div style="margin-top: 6px;">
            ${(selectedOrder?.items || []).map(item => `
              <div class="row">
                <span>${item.name} x${item.quantity}</span>
                <span>₱${((item?.price || 0) * (item?.quantity || 0)).toFixed(2)}</span>
              </div>
            `).join('')}
          </div>

          <div class="divider"></div>

          <div class="row total-row">
            <span>TOTAL</span>
            <span>₱${(selectedOrder?.total || 0).toFixed(2)}</span>
          </div>
          <div class="row small">
            <span>Payment Method</span>
            <span>Cash on Delivery</span>
          </div>

          ${selectedOrder.notes ? `
            <div class="divider"></div>
            <div class="small bold">Notes:</div>
            <div class="small">${selectedOrder.notes}</div>
          ` : ''}

          <div class="divider"></div>
          <div class="center small">Thank you for ordering!</div>
          <div class="center small">Please enjoy your meal 🍜</div>

          <script>window.onload = () => { window.print(); window.onafterprint = () => window.close(); }</script>
        </body>
      </html>
    `;

    receiptWindow.document.write(receiptHTML);
    receiptWindow.document.close();
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'confirmed': return <CheckCircle className="w-4 h-4" />;
      case 'preparing': return <ChefHat className="w-4 h-4" />;
      case 'ready': return <Package className="w-4 h-4" />;
      case 'delivered': return <Truck className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'preparing', label: 'Preparing' },
    { value: 'ready', label: 'Ready' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  const statusCounts = {
    pending: orders.filter(o => o.status === 'pending').length,
    confirmed: orders.filter(o => o.status === 'confirmed').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    ready: orders.filter(o => o.status === 'ready').length,
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
            <h1 className="text-3xl font-bold text-gray-900">Cashier Dashboard</h1>
            <p className="text-gray-600">Manage orders and print receipts</p>
          </motion.div>

          {/* Status Summary Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          >
            {[
              { label: 'Pending', count: statusCounts.pending, color: 'bg-yellow-500', status: 'pending' },
              { label: 'Confirmed', count: statusCounts.confirmed, color: 'bg-blue-500', status: 'confirmed' },
              { label: 'Preparing', count: statusCounts.preparing, color: 'bg-orange-500', status: 'preparing' },
              { label: 'Ready', count: statusCounts.ready, color: 'bg-purple-500', status: 'ready' },
            ].map((item) => (
              <Card
                key={item.status}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setStatusFilter(item.status)}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{item.label}</p>
                    <p className="text-2xl font-bold">{item.count}</p>
                  </div>
                  <div className={`w-10 h-10 ${item.color} rounded-lg flex items-center justify-center text-white`}>
                    {getStatusIcon(item.status)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col md:flex-row gap-4 mb-6"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by order ID, name, or phone..."
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
                <SelectItem value="all">All Orders</SelectItem>
                {statusOptions.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => { setSearchQuery(''); setStatusFilter('all'); }}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </motion.div>

          {/* Orders Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredOrders.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
              >
                <Card
                  className="cursor-pointer hover:shadow-lg transition-shadow border-l-4"
                  style={{ borderLeftColor: order.status === 'pending' ? '#EAB308' : order.status === 'confirmed' ? '#3B82F6' : order.status === 'preparing' ? '#F97316' : order.status === 'ready' ? '#A855F7' : order.status === 'delivered' ? '#22C55E' : '#EF4444' }}
                  onClick={() => {
                    setSelectedOrder(order);
                    setIsDetailOpen(true);
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-mono font-medium text-sm text-gray-700">#{order.id.slice(-8).toUpperCase()}</p>
                        <p className="text-xs text-gray-400">
                          {order.createdAt.toLocaleString('en-PH', { dateStyle: 'short', timeStyle: 'short' })}
                        </p>
                      </div>
                      <Badge className={`${getStatusColor(order.status)} text-white flex items-center gap-1`}>
                        {getStatusIcon(order.status)}
                        {order.status}
                      </Badge>
                    </div>

                    <div className="space-y-1 mb-3">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="font-medium truncate">{order.customerName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span>{order.customerPhone}</span>
                      </div>
                    </div>

                    <div className="text-xs text-gray-500 mb-3">
                      {( order?.items || []).map(i => `${i.name} x${i.quantity}`).join(', ')}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t">
                      <span className="text-sm text-gray-500">{(order?.items || []).length} item(s)</span>
                      <span className="font-bold text-lg text-orange-600">₱{(order?.total || 0).toFixed(2)}</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {filteredOrders.length === 0 && (
            <div className="text-center py-16">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No orders found</p>
              <p className="text-gray-400 text-sm">Try adjusting your search or filter</p>
            </div>
          )}
        </div>
      </div>

      {/* Order Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span>Order #{selectedOrder.id.slice(-8).toUpperCase()}</span>
                  <Badge className={`${getStatusColor(selectedOrder.status)} text-white flex items-center gap-1`}>
                    {getStatusIcon(selectedOrder.status)}
                    {selectedOrder.status}
                  </Badge>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-5" ref={receiptRef}>

                {/* Order Meta */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Order ID</p>
                    <p className="font-mono font-medium">{selectedOrder.id}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Date & Time</p>
                    <p>{selectedOrder.createdAt.toLocaleString('en-PH')}</p>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <User className="w-4 h-4 text-orange-500" /> Customer Information
                  </h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-gray-500">Name:</span> {selectedOrder.customerName}</p>
                    <p><span className="text-gray-500">Phone:</span> {selectedOrder.customerPhone}</p>
                    <p><span className="text-gray-500">Email:</span> {selectedOrder.customerEmail}</p>
                  </div>
                </div>

                {/* Delivery Address */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-orange-500" /> Delivery Address
                  </h3>
                  <div className="text-sm space-y-1">
                    <p>{selectedOrder.deliveryAddress.street}</p>
                    <p>{selectedOrder.deliveryAddress.barangay}, {selectedOrder.deliveryAddress.city}</p>
                    <p>{selectedOrder.deliveryAddress.province}, {selectedOrder.deliveryAddress.zipCode}</p>
                    {selectedOrder.deliveryAddress.landmark && (
                      <p className="text-gray-500">Landmark: {selectedOrder.deliveryAddress.landmark}</p>
                    )}
                  </div>
                </div>

                {/* Order Items */}
                <div>
                  <h3 className="font-semibold mb-3">Order Items</h3>
                  <div className="space-y-2">
                    {(selectedOrder?.items || []).map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center py-2 border-b last:border-0">
                        <div>
                          <p className="font-medium text-sm">{item.name}</p>
                          <p className="text-xs text-gray-500">₱{(item?.price || 0).toFixed(2)} × {item.quantity}</p>
                        </div>
                        <p className="font-semibold">₱{((item?.price || 0) * (item?.quantity || 0)).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-lg font-bold mt-4 pt-4 border-t border-gray-300">
                    <span>Total</span>
                    <span className="text-orange-600">₱{(selectedOrder?.total || 0).toFixed(2)}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Payment: Cash on Delivery</p>
                </div>

                {/* Notes */}
                {selectedOrder.notes && (
                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <h3 className="font-semibold mb-1 text-yellow-800">Order Notes</h3>
                    <p className="text-sm text-yellow-700">{selectedOrder.notes}</p>
                  </div>
                )}

                {/* Update Status */}
                <div>
                  <h3 className="font-semibold mb-3">Update Order Status</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {statusOptions.map((s) => (
                      <Button
                        key={s.value}
                        variant={selectedOrder.status === s.value ? 'default' : 'outline'}
                        size="sm"
                        disabled={isUpdating || selectedOrder.status === s.value}
                        onClick={() => handleStatusChange(selectedOrder.id, s.value as Order['status'])}
                        className={selectedOrder.status === s.value ? 'bg-orange-500 hover:bg-orange-600' : ''}
                      >
                        {getStatusIcon(s.value)}
                        <span className="ml-1">{s.label}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Print Receipt */}
                <Button
                  onClick={handlePrintReceipt}
                  className="w-full bg-gray-800 hover:bg-gray-900 text-white"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Print Receipt
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CashierDashboard;