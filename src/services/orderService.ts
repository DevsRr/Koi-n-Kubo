import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  query,
  where,
  orderBy,
  onSnapshot,
  type Unsubscribe,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Order, CartItem, DeliveryAddress } from '@/types';
import { decrementStock } from './menuService';

const ORDERS_COLLECTION = 'orders';

// Create new order
export const createOrder = async (
  userId: string,
  customerName: string,
  customerEmail: string,
  customerPhone: string,
  items: CartItem[],
  total: number,
  deliveryAddress: DeliveryAddress,
  notes?: string
): Promise<string> => {
  try {
    // Create order document
    const orderData = {
      userId,
      customerName,
      customerEmail,
      customerPhone,
      items: items.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity
      })),
      total,
      deliveryAddress,
      paymentMethod: 'cod',
      status: 'pending',
      notes: notes || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const orderRef = await addDoc(collection(db, ORDERS_COLLECTION), orderData);
    
    // Decrement stock for each item
    for (const item of items) {
      await decrementStock(item.id, item.quantity);
    }
    
    return orderRef.id;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};

// Get order by ID
export const getOrder = async (orderId: string): Promise<Order | null> => {
  try {
    const orderDoc = await getDoc(doc(db, ORDERS_COLLECTION, orderId));
    
    if (orderDoc.exists()) {
      const data = orderDoc.data();
      return {
        ...data,
        id: orderDoc.id,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as Order;
    }
    return null;
  } catch (error) {
    console.error('Error getting order:', error);
    throw error;
  }
};

// Get orders by user
export const getOrdersByUser = async (userId: string): Promise<Order[]> => {
  try {
    const q = query(
      collection(db, ORDERS_COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as Order;
    });
  } catch (error) {
    console.error('Error getting user orders:', error);
    throw error;
  }
};

// Get all orders (for admin)
export const getAllOrders = async (status?: string): Promise<Order[]> => {
  try {
    let q;
    
    if (status) {
      q = query(
        collection(db, ORDERS_COLLECTION),
        where('status', '==', status),
        orderBy('createdAt', 'desc')
      );
    } else {
      q = query(
        collection(db, ORDERS_COLLECTION),
        orderBy('createdAt', 'desc')
      );
    }
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as Order;
    });
  } catch (error) {
    console.error('Error getting all orders:', error);
    throw error;
  }
};

// Update order status
export const updateOrderStatus = async (
  orderId: string, 
  status: Order['status']
): Promise<void> => {
  try {
    const orderRef = doc(db, ORDERS_COLLECTION, orderId);
    await updateDoc(orderRef, {
      status,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
};

// Get today's orders
export const getTodayOrders = async (): Promise<Order[]> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const q = query(
      collection(db, ORDERS_COLLECTION),
      where('createdAt', '>=', Timestamp.fromDate(today)),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as Order;
    });
  } catch (error) {
    console.error('Error getting today orders:', error);
    throw error;
  }
};

// Get pending orders count
export const getPendingOrdersCount = async (): Promise<number> => {
  try {
    const q = query(
      collection(db, ORDERS_COLLECTION),
      where('status', 'in', ['pending', 'confirmed', 'preparing'])
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error) {
    console.error('Error getting pending orders count:', error);
    throw error;
  }
};

// Subscribe to orders (real-time updates for admin)
export const subscribeToOrders = (
  callback: (orders: Order[]) => void,
  status?: string
): Unsubscribe => {
  let q;
  
  if (status) {
    q = query(
      collection(db, ORDERS_COLLECTION),
      where('status', '==', status),
      orderBy('createdAt', 'desc')
    );
  } else {
    q = query(
      collection(db, ORDERS_COLLECTION),
      orderBy('createdAt', 'desc')
    );
  }
  
  return onSnapshot(q, (snapshot) => {
    const orders = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as Order;
    });
    callback(orders);
  });
};

// Subscribe to user's orders
export const subscribeToUserOrders = (
  userId: string,
  callback: (orders: Order[]) => void
): Unsubscribe => {
  const q = query(
    collection(db, ORDERS_COLLECTION),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const orders = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as Order;
    });
    callback(orders);
  });
};

// Get sales analytics
export const getSalesAnalytics = async (days: number = 30) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);
    
    const q = query(
      collection(db, ORDERS_COLLECTION),
      where('createdAt', '>=', Timestamp.fromDate(startDate)),
      where('status', 'in', ['confirmed', 'preparing', 'ready', 'delivered'])
    );
    
    const querySnapshot = await getDocs(q);
    const orders = querySnapshot.docs.map(doc => doc.data());
    
    // Calculate totals
    const totalSales = orders.reduce((sum, order) => sum + order.total, 0);
    const totalOrders = orders.length;
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
    
    // Get top selling items
    const itemCounts: { [key: string]: { name: string; quantity: number } } = {};
    orders.forEach(order => {
      order.items.forEach((item: any) => {
        if (!itemCounts[item.id]) {
          itemCounts[item.id] = { name: item.name, quantity: 0 };
        }
        itemCounts[item.id].quantity += item.quantity;
      });
    });
    
    const topSellingItems = Object.entries(itemCounts)
      .map(([itemId, data]) => ({ itemId, ...data }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
    
    // Sales by date
    const salesByDate: { [key: string]: { sales: number; orders: number } } = {};
    orders.forEach(order => {
      const date = order.createdAt.toDate().toISOString().split('T')[0];
      if (!salesByDate[date]) {
        salesByDate[date] = { sales: 0, orders: 0 };
      }
      salesByDate[date].sales += order.total;
      salesByDate[date].orders += 1;
    });
    
    const salesByDateArray = Object.entries(salesByDate)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));
    
    return {
      totalSales,
      totalOrders,
      averageOrderValue,
      topSellingItems,
      salesByDate: salesByDateArray
    };
  } catch (error) {
    console.error('Error getting sales analytics:', error);
    throw error;
  }
};
