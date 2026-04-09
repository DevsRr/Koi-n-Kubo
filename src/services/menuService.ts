import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  onSnapshot,
  type Unsubscribe
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { MenuItem, StockAlert } from '@/types';

const MENU_COLLECTION = 'menuItems';
const ALERTS_COLLECTION = 'stockAlerts';

// Initialize menu items in Firestore (run once)
export const initializeMenuItems = async (items: MenuItem[]) => {
  try {
    for (const item of items) {
      const itemRef = doc(db, MENU_COLLECTION, item.id);
      const itemDoc = await getDoc(itemRef);
      
      if (!itemDoc.exists()) {
        await setDoc(itemRef, {
          ...item,
          createdAt: new Date()
        });
      }
    }
    console.log('Menu items initialized successfully');
  } catch (error) {
    console.error('Error initializing menu items:', error);
    throw error;
  }
};

// Get all menu items
export const getMenuItems = async (): Promise<MenuItem[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, MENU_COLLECTION));
    return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as MenuItem));
  } catch (error) {
    console.error('Error getting menu items:', error);
    throw error;
  }
};

// Get menu items by category
export const getMenuItemsByCategory = async (category: string): Promise<MenuItem[]> => {
  try {
    const q = query(collection(db, MENU_COLLECTION), where('category', '==', category));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as MenuItem));
  } catch (error) {
    console.error('Error getting menu items by category:', error);
    throw error;
  }
};

// Get single menu item
export const getMenuItem = async (id: string): Promise<MenuItem | null> => {
  try {
    const docRef = doc(db, MENU_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { ...docSnap.data(), id: docSnap.id } as MenuItem;
    }
    return null;
  } catch (error) {
    console.error('Error getting menu item:', error);
    throw error;
  }
};

// Update menu item
export const updateMenuItem = async (id: string, updates: Partial<MenuItem>): Promise<void> => {
  try {
    const itemRef = doc(db, MENU_COLLECTION, id);
    await updateDoc(itemRef, {
      ...updates,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating menu item:', error);
    throw error;
  }
};

// Update stock
export const updateStock = async (id: string, newStock: number): Promise<void> => {
  try {
    const itemRef = doc(db, MENU_COLLECTION, id);
    const itemDoc = await getDoc(itemRef);
    
    if (!itemDoc.exists()) {
      throw new Error('Item not found');
    }
    
    const item = itemDoc.data() as MenuItem;
    
    await updateDoc(itemRef, {
      stock: newStock,
      updatedAt: new Date()
    });
    
    // Check if stock is low and create alert
    if (newStock <= item.lowStockThreshold) {
      await createStockAlert(id, item.name, newStock, item.lowStockThreshold);
    }
  } catch (error) {
    console.error('Error updating stock:', error);
    throw error;
  }
};

// Decrement stock (when order is placed)
export const decrementStock = async (id: string, quantity: number): Promise<void> => {
  try {
    const itemRef = doc(db, MENU_COLLECTION, id);
    const itemDoc = await getDoc(itemRef);
    
    if (!itemDoc.exists()) {
      throw new Error('Item not found');
    }
    
    const item = itemDoc.data() as MenuItem;
    const newStock = Math.max(0, item.stock - quantity);
    
    await updateDoc(itemRef, {
      stock: newStock,
      updatedAt: new Date()
    });
    
    // Check if stock is low and create alert
    if (newStock <= item.lowStockThreshold) {
      await createStockAlert(id, item.name, newStock, item.lowStockThreshold);
    }
  } catch (error) {
    console.error('Error decrementing stock:', error);
    throw error;
  }
};

// Create stock alert
export const createStockAlert = async (
  itemId: string, 
  itemName: string, 
  currentStock: number, 
  threshold: number
): Promise<void> => {
  try {
    // Check if alert already exists
    const q = query(
      collection(db, ALERTS_COLLECTION),
      where('itemId', '==', itemId),
      where('isRead', '==', false)
    );
    const existingAlerts = await getDocs(q);
    
    if (!existingAlerts.empty) {
      return; // Alert already exists
    }
    
    const alertRef = doc(collection(db, ALERTS_COLLECTION));
    const alert: Omit<StockAlert, 'id'> = {
      itemId,
      itemName,
      currentStock,
      threshold,
      createdAt: new Date(),
      isRead: false
    };
    
    await setDoc(alertRef, alert);
  } catch (error) {
    console.error('Error creating stock alert:', error);
    throw error;
  }
};

// Get stock alerts
export const getStockAlerts = async (): Promise<StockAlert[]> => {
  try {
    const q = query(collection(db, ALERTS_COLLECTION), where('isRead', '==', false));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as StockAlert));
  } catch (error) {
    console.error('Error getting stock alerts:', error);
    throw error;
  }
};

// Mark alert as read
export const markAlertAsRead = async (alertId: string): Promise<void> => {
  try {
    const alertRef = doc(db, ALERTS_COLLECTION, alertId);
    await updateDoc(alertRef, { isRead: true });
  } catch (error) {
    console.error('Error marking alert as read:', error);
    throw error;
  }
};

// Subscribe to menu items (real-time updates)
export const subscribeToMenuItems = (callback: (items: MenuItem[]) => void): Unsubscribe => {
  return onSnapshot(collection(db, MENU_COLLECTION), (snapshot) => {
    const items = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as MenuItem));
    callback(items);
  });
};

// Subscribe to stock alerts
export const subscribeToStockAlerts = (callback: (alerts: StockAlert[]) => void): Unsubscribe => {
  const q = query(collection(db, ALERTS_COLLECTION), where('isRead', '==', false));
  return onSnapshot(q, (snapshot) => {
    const alerts = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as StockAlert));
    callback(alerts);
  });
};

// Delete menu item
export const deleteMenuItem = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, MENU_COLLECTION, id));
  } catch (error) {
    console.error('Error deleting menu item:', error);
    throw error;
  }
};

// Add new menu item
export const addMenuItem = async (item: Omit<MenuItem, 'id'>): Promise<string> => {
  try {
    const itemRef = doc(collection(db, MENU_COLLECTION));
    await setDoc(itemRef, {
      ...item,
      id: itemRef.id,
      createdAt: new Date()
    });
    return itemRef.id;
  } catch (error) {
    console.error('Error adding menu item:', error);
    throw error;
  }
};
