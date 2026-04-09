import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Package, 
  AlertTriangle, 
  Plus, 
  Minus, 
  Search,
  Check,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import Navbar from '@/components/Navbar';
import { subscribeToMenuItems, subscribeToStockAlerts, updateStock, markAlertAsRead } from '@/services/menuService';
import type { MenuItem, StockAlert } from '@/types';

const AdminStock = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<MenuItem[]>([]);
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isAdjustDialogOpen, setIsAdjustDialogOpen] = useState(false);
  const [adjustmentAmount, setAdjustmentAmount] = useState(0);

  useEffect(() => {
    const unsubscribeItems = subscribeToMenuItems((items) => {
      setMenuItems(items);
      setFilteredItems(items);
    });

    const unsubscribeAlerts = subscribeToStockAlerts((alertsData) => {
      setAlerts(alertsData);
    });

    return () => {
      unsubscribeItems();
      unsubscribeAlerts();
    };
  }, []);

  useEffect(() => {
    if (searchQuery) {
      setFilteredItems(menuItems.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      ));
    } else {
      setFilteredItems(menuItems);
    }
  }, [menuItems, searchQuery]);

  const handleAdjustStock = (item: MenuItem) => {
    setSelectedItem(item);
    setAdjustmentAmount(0);
    setIsAdjustDialogOpen(true);
  };

  const handleSaveAdjustment = async () => {
    if (!selectedItem) return;

    try {
      const newStock = selectedItem.stock + adjustmentAmount;
      if (newStock < 0) {
        alert('Stock cannot be negative');
        return;
      }
      await updateStock(selectedItem.id, newStock);
      setIsAdjustDialogOpen(false);
      setSelectedItem(null);
    } catch (error) {
      console.error('Error updating stock:', error);
    }
  };

  const handleDismissAlert = async (alertId: string) => {
    try {
      await markAlertAsRead(alertId);
    } catch (error) {
      console.error('Error dismissing alert:', error);
    }
  };

  const getStockStatus = (item: MenuItem) => {
    if (item.stock === 0) return { label: 'Out of Stock', color: 'bg-red-500' };
    if (item.stock <= item.lowStockThreshold) return { label: 'Low Stock', color: 'bg-yellow-500' };
    return { label: 'In Stock', color: 'bg-green-500' };
  };

  const getStockPercentage = (item: MenuItem) => {
    const maxStock = Math.max(item.stock, item.lowStockThreshold * 2);
    return Math.min(100, (item.stock / maxStock) * 100);
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
            <h1 className="text-3xl font-bold text-gray-900">Stock Management</h1>
            <p className="text-gray-600">Monitor and manage inventory levels</p>
          </motion.div>

          {/* Alerts Section */}
          {alerts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-8"
            >
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Low Stock Alerts ({alerts.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {alerts.map((alert) => (
                  <Card key={alert.id} className="border-red-200 bg-red-50">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-red-900">{alert.itemName}</p>
                          <p className="text-sm text-red-600">
                            Only {alert.currentStock} left (threshold: {alert.threshold})
                          </p>
                        </div>
                        <button
                          onClick={() => handleDismissAlert(alert.id)}
                          className="p-1 hover:bg-red-100 rounded"
                        >
                          <X className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.div>
          )}

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </motion.div>

          {/* Stock Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredItems.map((item, index) => {
              const status = getStockStatus(item);
              const percentage = getStockPercentage(item);
              
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-12 h-12 rounded-lg object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://placehold.co/100x100/f3f4f6/374151?text=${encodeURIComponent(item.name.charAt(0))}`;
                            }}
                          />
                          <div>
                            <p className="font-medium text-gray-900">{item.name}</p>
                            <p className="text-sm text-gray-500">₱{item.price.toFixed(2)}</p>
                          </div>
                        </div>
                        <Badge className={`${status.color} text-white`}>
                          {status.label}
                        </Badge>
                      </div>

                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Stock Level</span>
                          <span className="font-medium">{item.stock} units</span>
                        </div>
                        <Progress 
                          value={percentage} 
                          className={`h-2 ${
                            item.stock <= item.lowStockThreshold 
                              ? 'bg-red-100' 
                              : 'bg-green-100'
                          }`}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Threshold: {item.lowStockThreshold} units
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleAdjustStock(item)}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Adjust
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>

          {filteredItems.length === 0 && (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No items found</p>
            </div>
          )}
        </div>
      </div>

      {/* Adjust Stock Dialog */}
      <Dialog open={isAdjustDialogOpen} onOpenChange={setIsAdjustDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Stock - {selectedItem?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-gray-500">Current Stock</p>
              <p className="text-3xl font-bold text-gray-900">{selectedItem?.stock}</p>
            </div>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => setAdjustmentAmount(prev => prev - 1)}
                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
              >
                <Minus className="w-5 h-5" />
              </button>
              <div className="text-center">
                <p className={`text-2xl font-bold ${
                  adjustmentAmount > 0 ? 'text-green-500' : 
                  adjustmentAmount < 0 ? 'text-red-500' : 'text-gray-900'
                }`}>
                  {adjustmentAmount > 0 ? '+' : ''}{adjustmentAmount}
                </p>
                <p className="text-sm text-gray-500">Adjustment</p>
              </div>
              <button
                onClick={() => setAdjustmentAmount(prev => prev + 1)}
                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">New Stock Level</p>
              <p className="text-2xl font-bold text-gray-900">
                {(selectedItem?.stock || 0) + adjustmentAmount}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAdjustDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveAdjustment}
              className="bg-orange-500 hover:bg-orange-600 text-white"
              disabled={adjustmentAmount === 0}
            >
              <Check className="w-4 h-4 mr-2" />
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminStock;
