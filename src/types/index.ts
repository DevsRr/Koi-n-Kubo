// Menu Item Types
export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'katsu-bowls' | 'ramen' | 'rice-meals' | 'extras';
  image: string;
  stock: number;
  lowStockThreshold: number;
  isAvailable: boolean;
  isBestSeller?: boolean;
}

// Cart Types
export interface CartItem extends MenuItem {
  quantity: number;
}

export interface Cart {
  items: CartItem[];
  total: number;
}

// User Types
export interface User {
  uid: string;
  email: string;
  displayName: string;
  phoneNumber: string;
  role: 'customer' | 'admin' | 'cashier';
  createdAt: Date;
}

// Delivery Address Type
export interface DeliveryAddress {
  street: string;
  barangay: string;
  city: string;
  province: string;
  zipCode: string;
  landmark?: string;
}

// Order Types
export interface Order {
  id: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: CartItem[];
  total: number;
  deliveryAddress: DeliveryAddress;
  paymentMethod: 'cod';
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Stock Alert Type
export interface StockAlert {
  id: string;
  itemId: string;
  itemName: string;
  currentStock: number;
  threshold: number;
  createdAt: Date;
  isRead: boolean;
}

// Analytics Types
export interface SalesAnalytics {
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  topSellingItems: { itemId: string; name: string; quantity: number }[];
  salesByDate: { date: string; sales: number; orders: number }[];
}

// Admin Dashboard Stats
export interface DashboardStats {
  todaySales: number;
  todayOrders: number;
  pendingOrders: number;
  lowStockItems: number;
  totalCustomers: number;
}