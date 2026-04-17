import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart, Trash2, Plus, Minus, Printer,
  UtensilsCrossed, Package, ArrowLeft, CreditCard,
  Banknote, Star, Search, Users, X, CheckCircle,
  TrendingUp, ClipboardList, Monitor
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { subscribeToMenuItems } from '@/services/menuService';
import {
  collection, addDoc, serverTimestamp, doc,
  updateDoc, getDoc, query, where, orderBy, onSnapshot
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { MenuItem } from '@/types';

type OrderType = 'dine-in' | 'take-out' | 'delivery';
type PaymentMethod = 'cash' | 'card';
type Discount = 'none' | 'pwd' | 'senior';
type POSScreen = 'home' | 'order' | 'checkout' | 'receipt';

interface CartItem extends MenuItem { qty: number; }

interface CompletedOrder {
  id: string;
  items: CartItem[];
  subtotal: number;
  discountAmt: number;
  total: number;
  payment: PaymentMethod;
  change: number;
  orderType: OrderType;
  discountType: Discount;
  tableNo: string;
  createdAt: Date;
}

// Shared ingredient groups - when one item is ordered, all sharing the
// same ingredient get their stock decremented
const INGREDIENT_GROUPS: Record<string, string[]> = {
  chicken: ['chicken-katsu', 'katsu-curry', 'chicken-katsu-salad'],
  pork: ['pork-katsu', 'pork-bistek-gyudon', 'humba-katsu', 'katsu-kare'],
  shrimp: ['shrimp-katsu'],
  dory: ['doriyaki-katsu'],
};

const DISCOUNT_RATE: Record<Discount, number> = { none: 0, pwd: 0.2, senior: 0.2 };

function calcTotals(cart: CartItem[], discount: Discount) {
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const discountAmt = subtotal * DISCOUNT_RATE[discount];
  const total = subtotal - discountAmt;
  return { subtotal, discountAmt, total };
}

export default function POSPage() {
  const [posScreen, setPosScreen] = useState<POSScreen>('home');
  const [orderType, setOrderType] = useState<OrderType>('dine-in');
  const [tableNo, setTableNo] = useState('');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [payment, setPayment] = useState<PaymentMethod>('cash');
  const [discount, setDiscount] = useState<Discount>('none');
  const [cashInput, setCashInput] = useState('');
  const [lastOrder, setLastOrder] = useState<CompletedOrder | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [todaySales, setTodaySales] = useState(0);
  const [todayOrders, setTodayOrders] = useState(0);

  useEffect(() => {
    const unsub = subscribeToMenuItems((items) => setMenuItems(items));
    return () => unsub();
  }, []);

  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    try {
      const q = query(
        collection(db, 'posOrders'),
        where('createdAt', '>=', today),
        orderBy('createdAt', 'desc')
      );
      const unsub = onSnapshot(q, (snap) => {
        const orders = snap.docs.map(d => d.data());
        setTodayOrders(orders.length);
        setTodaySales(orders.reduce((s, o) => s + (o.total || 0), 0));
      });
      return () => unsub();
    } catch (e) {
      console.error('Sales query error:', e);
    }
  }, []);

  const addToCart = (item: MenuItem) => {
    if (item.stock <= 0 || !item.isAvailable) return;
    setCart(prev => {
      const exists = prev.find(c => c.id === item.id);
      if (exists) {
        if (exists.qty >= item.stock) return prev;
        return prev.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c);
      }
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev
      .map(c => c.id === id ? { ...c, qty: c.qty + delta } : c)
      .filter(c => c.qty > 0)
    );
  };

  const removeItem = (id: string) => setCart(prev => prev.filter(c => c.id !== id));

  const { subtotal, discountAmt, total } = calcTotals(cart, discount);
  const cashAmt = parseFloat(cashInput) || 0;
  const change = cashAmt - total;

  const filtered = menuItems.filter(item => {
    const matchCat = category === 'all' || item.category === category;
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const categories = [
    { id: 'all', label: 'All', emoji: '🍽️' },
    { id: 'katsu-bowls', label: 'Katsu', emoji: '🍱' },
    { id: 'ramen', label: 'Ramen', emoji: '🍜' },
    { id: 'rice-meals', label: 'Rice', emoji: '🍚' },
    { id: 'extras', label: 'Extras', emoji: '➕' },
  ];

  const decrementSharedStock = async (cartItems: CartItem[]) => {
    const ingredientUsage: Record<string, number> = {};
    for (const item of cartItems) {
      for (const [ingredient, itemIds] of Object.entries(INGREDIENT_GROUPS)) {
        if (itemIds.includes(item.id)) {
          ingredientUsage[ingredient] = (ingredientUsage[ingredient] || 0) + item.qty;
        }
      }
    }
    for (const [ingredient, qtyUsed] of Object.entries(ingredientUsage)) {
      const affectedIds = INGREDIENT_GROUPS[ingredient];
      for (const itemId of affectedIds) {
        const ref = doc(db, 'menuItems', itemId);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const newStock = Math.max(0, (snap.data().stock || 0) - qtyUsed);
          await updateDoc(ref, { stock: newStock, isAvailable: newStock > 0, updatedAt: new Date() });
        }
      }
    }
    for (const item of cartItems) {
      const isShared = Object.values(INGREDIENT_GROUPS).some(ids => ids.includes(item.id));
      if (!isShared) {
        const ref = doc(db, 'menuItems', item.id);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const newStock = Math.max(0, (snap.data().stock || 0) - item.qty);
          await updateDoc(ref, { stock: newStock, isAvailable: newStock > 0, updatedAt: new Date() });
        }
      }
    }
  };

  const processOrder = async () => {
    if (cart.length === 0 || isProcessing) return;
    if (payment === 'cash' && cashAmt < total) return;
    setIsProcessing(true);
    try {
      const ref = await addDoc(collection(db, 'posOrders'), {
        items: cart.map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty })),
        subtotal, discountType: discount, discountAmt, total,
        payment, change: payment === 'cash' ? change : 0,
        orderType, tableNo,
        createdAt: serverTimestamp(),
        source: 'pos', status: 'completed',
      });
      await decrementSharedStock(cart);
      setLastOrder({
        id: ref.id, items: [...cart], subtotal, discountAmt, total,
        payment, change: payment === 'cash' ? change : 0,
        orderType, discountType: discount, tableNo, createdAt: new Date(),
      });
      setCart([]);
      setDiscount('none');
      setCashInput('');
      setPayment('cash');
      setPosScreen('receipt');
    } catch (err) {
      console.error('Order error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const printReceipt = (order: CompletedOrder) => {
    const w = window.open('', '_blank', 'width=380,height=650');
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>Receipt</title>
    <style>
      *{margin:0;padding:0;box-sizing:border-box;}
      body{font-family:'Courier New',monospace;font-size:12px;padding:16px;width:320px;}
      .c{text-align:center;}.b{font-weight:bold;}
      .div{border-top:1px dashed #000;margin:8px 0;}
      .row{display:flex;justify-content:space-between;margin:3px 0;}
      .logo{font-size:18px;font-weight:bold;letter-spacing:2px;}
      .big{font-size:15px;font-weight:bold;}
    </style></head><body>
    <div class="c">
      <div class="logo">KOI 'N KUBO</div>
      <div style="font-size:10px">Japanese-Filipino Cuisine</div>
      <div style="margin:4px 0;font-size:11px;font-weight:bold;background:#000;color:#fff;padding:2px 8px;display:inline-block;border-radius:4px">
        ${order.orderType.toUpperCase().replace('-', ' ')}
      </div>
      ${order.tableNo ? `<div style="font-size:11px">Table: ${order.tableNo}</div>` : ''}
      <div style="font-size:10px;color:#555">${order.createdAt.toLocaleString('en-PH')}</div>
      <div style="font-size:10px;font-family:monospace">#${order.id.slice(-8).toUpperCase()}</div>
    </div>
    <div class="div"></div>
    ${order.items.map(i => `<div class="row"><span>${i.name} x${i.qty}</span><span>₱${(i.price * i.qty).toFixed(2)}</span></div>`).join('')}
    <div class="div"></div>
    <div class="row"><span>Subtotal</span><span>₱${order.subtotal.toFixed(2)}</span></div>
    ${order.discountAmt > 0 ? `<div class="row"><span>${order.discountType === 'pwd' ? 'PWD' : 'Senior'} Discount (20%)</span><span>-₱${order.discountAmt.toFixed(2)}</span></div>` : ''}
    <div class="div"></div>
    <div class="row big"><span>TOTAL</span><span>₱${order.total.toFixed(2)}</span></div>
    <div class="row"><span>Payment</span><span>${order.payment === 'cash' ? 'Cash' : 'Card'}</span></div>
    ${order.payment === 'cash' ? `
      <div class="row"><span>Cash</span><span>₱${(order.change + order.total).toFixed(2)}</span></div>
      <div class="row b"><span>Change</span><span>₱${order.change.toFixed(2)}</span></div>
    ` : ''}
    <div class="div"></div>
    <div class="c" style="font-size:11px">Thank you for dining with us!<br>Please come again 🍜</div>
    <script>window.onload=()=>{window.print();window.onafterprint=()=>window.close();}</script>
    </body></html>`);
    w.document.close();
  };

  // ── HOME SCREEN ────────────────────────────────────────────────────────────
  if (posScreen === 'home') {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-8 pt-24">
          {/* Stats */}
          <div className="flex gap-4 mb-10 w-full max-w-lg">
            <div className="flex-1 bg-gray-800 rounded-2xl p-4 text-center">
              <p className="text-gray-400 text-xs mb-1">Today's POS Sales</p>
              <p className="text-green-400 font-bold text-2xl">₱{todaySales.toFixed(2)}</p>
            </div>
            <div className="flex-1 bg-gray-800 rounded-2xl p-4 text-center">
              <p className="text-gray-400 text-xs mb-1">POS Orders</p>
              <p className="text-orange-400 font-bold text-2xl">{todayOrders}</p>
            </div>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg">
            <h2 className="text-white text-3xl font-bold text-center mb-2">New Order</h2>
            <p className="text-gray-400 text-center mb-8">Select order type to begin</p>

            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { type: 'dine-in' as OrderType, icon: UtensilsCrossed, label: 'Dine In', color: 'from-orange-500 to-orange-600', desc: 'Seat customer' },
                { type: 'take-out' as OrderType, icon: Package, label: 'Take Out', color: 'from-blue-500 to-blue-600', desc: 'Pack for customer' },
                { type: 'delivery' as OrderType, icon: TrendingUp, label: 'Delivery', color: 'from-green-500 to-green-600', desc: 'Send to address' },
              ].map(({ type, icon: Icon, label, color, desc }) => (
                <motion.button
                  key={type}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setOrderType(type)}
                  className={`rounded-2xl p-6 flex flex-col items-center gap-2 border-2 transition-all ${
                    orderType === type
                      ? `bg-gradient-to-br ${color} border-transparent shadow-2xl`
                      : 'bg-gray-800 border-gray-700 hover:border-gray-500'
                  }`}
                >
                  <Icon className={`w-8 h-8 ${orderType === type ? 'text-white' : 'text-gray-400'}`} />
                  <span className={`font-bold ${orderType === type ? 'text-white' : 'text-gray-300'}`}>{label}</span>
                  <span className={`text-xs ${orderType === type ? 'text-white/80' : 'text-gray-500'}`}>{desc}</span>
                </motion.button>
              ))}
            </div>

            {orderType === 'dine-in' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
                <label className="text-gray-400 text-sm block mb-2 text-center">Table Number (optional)</label>
                <input
                  type="text"
                  value={tableNo}
                  onChange={e => setTableNo(e.target.value)}
                  placeholder="e.g. Table 3"
                  className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-white text-center text-lg focus:outline-none focus:border-orange-500"
                />
              </motion.div>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setPosScreen('order')}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold text-xl py-5 rounded-2xl flex items-center justify-center gap-3 shadow-xl"
            >
              <ClipboardList className="w-6 h-6" />
              Start Order
            </motion.button>
          </motion.div>
        </div>
      </div>
    );
  }

  // ── ORDER SCREEN ───────────────────────────────────────────────────────────
  if (posScreen === 'order') {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col">
        <Navbar />
        <div className="flex flex-1 overflow-hidden pt-16 md:pt-20">
          {/* Left: Menu */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center gap-3">
              <button onClick={() => setPosScreen('home')} className="text-gray-400 hover:text-white">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-white font-bold text-sm">
                  {orderType === 'dine-in' ? `Dine In${tableNo ? ` — ${tableNo}` : ''}` : orderType === 'take-out' ? 'Take Out' : 'Delivery'}
                </h2>
                <p className="text-gray-400 text-xs">Tap item to add to order</p>
              </div>
            </div>

            <div className="bg-gray-800 px-4 py-3 space-y-2 border-b border-gray-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search menu..."
                  className="w-full bg-gray-700 border border-gray-600 rounded-xl pl-9 pr-4 py-2 text-white text-sm focus:outline-none focus:border-orange-500" />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {categories.map(cat => (
                  <button key={cat.id} onClick={() => setCategory(cat.id)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-all ${
                      category === cat.id ? 'bg-orange-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}>
                    <span>{cat.emoji}</span><span>{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {filtered.map(item => {
                const inCart = cart.find(c => c.id === item.id);
                const soldOut = item.stock <= 0 || !item.isAvailable;
                return (
                  <motion.button key={item.id} whileTap={{ scale: 0.96 }} onClick={() => addToCart(item)} disabled={soldOut}
                    className={`relative rounded-xl overflow-hidden text-left transition-all ${
                      soldOut ? 'opacity-50 cursor-not-allowed' : 'hover:ring-2 hover:ring-orange-500'
                    } ${inCart ? 'ring-2 ring-orange-500' : ''}`}>
                    <div className="aspect-square relative">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover"
                        onError={e => { (e.target as HTMLImageElement).src = `https://placehold.co/200x200/374151/9ca3af?text=${encodeURIComponent(item.name)}`; }} />
                      {soldOut && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <span className="text-white font-bold text-xs bg-red-600 px-2 py-1 rounded">SOLD OUT</span>
                        </div>
                      )}
                      {inCart && (
                        <div className="absolute top-2 right-2 bg-orange-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                          {inCart.qty}
                        </div>
                      )}
                      {item.isBestSeller && !soldOut && (
                        <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs px-1.5 py-0.5 rounded flex items-center gap-0.5">
                          <Star className="w-3 h-3 fill-current" />
                        </div>
                      )}
                    </div>
                    <div className="bg-gray-800 p-2">
                      <p className="text-white text-xs font-semibold line-clamp-1">{item.name}</p>
                      <p className="text-orange-400 text-sm font-bold">₱{item.price.toFixed(2)}</p>
                      <p className={`text-xs ${item.stock <= item.lowStockThreshold && !soldOut ? 'text-yellow-400' : 'text-gray-500'}`}>
                        {soldOut ? 'Out of stock' : item.stock <= item.lowStockThreshold ? `${item.stock} left` : `Stock: ${item.stock}`}
                      </p>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Right: Cart */}
          <div className="w-72 bg-gray-800 border-l border-gray-700 flex flex-col">
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-orange-400" />
                <h2 className="text-white font-bold">Order</h2>
                <span className="text-orange-400 text-sm">({cart.reduce((s, i) => s + i.qty, 0)})</span>
              </div>
              {cart.length > 0 && (
                <button onClick={() => setCart([])} className="text-red-400 hover:text-red-300 text-xs flex items-center gap-1">
                  <Trash2 className="w-3 h-3" /> Clear
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {cart.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No items yet</p>
                  <p className="text-xs mt-1">Tap menu items to add</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="bg-gray-700 rounded-xl p-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="text-white text-sm font-medium leading-tight">{item.name}</p>
                      <button onClick={() => removeItem(item.id)} className="text-gray-400 hover:text-red-400 shrink-0">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 bg-gray-600 hover:bg-gray-500 rounded-lg flex items-center justify-center text-white">
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-white text-sm font-bold w-5 text-center">{item.qty}</span>
                        <button onClick={() => updateQty(item.id, 1)} disabled={item.qty >= item.stock}
                          className="w-6 h-6 bg-gray-600 hover:bg-gray-500 disabled:opacity-40 rounded-lg flex items-center justify-center text-white">
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="text-orange-400 font-bold text-sm">₱{(item.price * item.qty).toFixed(2)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-4 border-t border-gray-700 space-y-3">
                <div className="flex justify-between text-sm text-gray-400">
                  <span>Subtotal</span>
                  <span className="text-white">₱{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-white">Total</span>
                  <span className="text-orange-400">₱{total.toFixed(2)}</span>
                </div>
                <button onClick={() => setPosScreen('checkout')}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2">
                  <CreditCard className="w-4 h-4" />Checkout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── CHECKOUT SCREEN ────────────────────────────────────────────────────────
  if (posScreen === 'checkout') {
    const canPay = payment === 'card' || (payment === 'cash' && cashAmt >= total);
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col">
        <Navbar />
        <div className="flex-1 overflow-y-auto pt-24 pb-8 px-4">
          <div className="max-w-lg mx-auto space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <button onClick={() => setPosScreen('order')} className="text-gray-400 hover:text-white">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-white font-bold text-xl">Checkout</h1>
            </div>

            {/* Order Summary */}
            <div className="bg-gray-800 rounded-2xl p-4">
              <h3 className="text-white font-bold mb-3 text-sm">Order Summary</h3>
              <div className="space-y-2">
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-300">{item.name} × {item.qty}</span>
                    <span className="text-white font-medium">₱{(item.price * item.qty).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Discount */}
            <div className="bg-gray-800 rounded-2xl p-4">
              <h3 className="text-white font-bold mb-3 text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-orange-400" />Discount
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'none' as Discount, label: 'None', sub: 'Regular' },
                  { value: 'pwd' as Discount, label: 'PWD', sub: '20% off' },
                  { value: 'senior' as Discount, label: 'Senior', sub: '20% off' },
                ].map(d => (
                  <button key={d.value} onClick={() => setDiscount(d.value)}
                    className={`rounded-xl p-3 text-center border-2 transition-all ${
                      discount === d.value ? 'border-orange-500 bg-orange-500/20' : 'border-gray-700 bg-gray-700 hover:border-gray-500'
                    }`}>
                    <p className={`font-bold text-sm ${discount === d.value ? 'text-orange-400' : 'text-white'}`}>{d.label}</p>
                    <p className="text-gray-400 text-xs">{d.sub}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Payment */}
            <div className="bg-gray-800 rounded-2xl p-4">
              <h3 className="text-white font-bold mb-3 text-sm">Payment Method</h3>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { value: 'cash' as PaymentMethod, icon: Banknote, label: 'Cash' },
                  { value: 'card' as PaymentMethod, icon: CreditCard, label: 'Card' },
                ].map(p => (
                  <button key={p.value} onClick={() => setPayment(p.value)}
                    className={`rounded-xl p-4 flex items-center gap-3 border-2 transition-all ${
                      payment === p.value ? 'border-orange-500 bg-orange-500/20' : 'border-gray-700 bg-gray-700 hover:border-gray-500'
                    }`}>
                    <p.icon className={`w-5 h-5 ${payment === p.value ? 'text-orange-400' : 'text-gray-400'}`} />
                    <span className={`font-bold ${payment === p.value ? 'text-orange-400' : 'text-white'}`}>{p.label}</span>
                  </button>
                ))}
              </div>

              {payment === 'cash' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                  <label className="text-gray-400 text-sm">Cash Received</label>
                  <input type="number" value={cashInput} onChange={e => setCashInput(e.target.value)} placeholder="0.00"
                    className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white text-2xl font-bold focus:outline-none focus:border-orange-500" />
                  <div className="grid grid-cols-4 gap-2">
                    {[100, 200, 500, 1000].map(amt => (
                      <button key={amt} onClick={() => setCashInput(amt.toString())}
                        className="bg-gray-700 hover:bg-gray-600 text-white text-sm py-2 rounded-lg">
                        ₱{amt}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => setCashInput(Math.ceil(total / 50) * 50 + '')}
                    className="w-full bg-gray-700 hover:bg-gray-600 text-white text-sm py-2 rounded-lg">
                    Exact: ₱{Math.ceil(total / 50) * 50}
                  </button>
                  {cashAmt >= total && (
                    <div className="flex justify-between bg-green-900/40 border border-green-700 rounded-xl p-3">
                      <span className="text-green-400 font-bold">Change</span>
                      <span className="text-green-400 font-bold text-lg">₱{change.toFixed(2)}</span>
                    </div>
                  )}
                  {cashAmt > 0 && cashAmt < total && (
                    <p className="text-red-400 text-sm text-center">Short by ₱{(total - cashAmt).toFixed(2)}</p>
                  )}
                </motion.div>
              )}
            </div>

            {/* Bill */}
            <div className="bg-gray-800 rounded-2xl p-4 space-y-2">
              <div className="flex justify-between text-sm text-gray-400">
                <span>Subtotal</span><span className="text-white">₱{subtotal.toFixed(2)}</span>
              </div>
              {discountAmt > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-green-400">{discount === 'pwd' ? 'PWD' : 'Senior'} Discount (20%)</span>
                  <span className="text-green-400">-₱{discountAmt.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-xl font-bold pt-2 border-t border-gray-700">
                <span className="text-white">Total</span>
                <span className="text-orange-400">₱{total.toFixed(2)}</span>
              </div>
            </div>

            <button onClick={processOrder} disabled={!canPay || isProcessing}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-700 disabled:text-gray-500 text-white font-bold text-lg py-5 rounded-2xl flex items-center justify-center gap-3 transition-all">
              <CheckCircle className="w-5 h-5" />
              {isProcessing ? 'Processing...' : 'Confirm Payment'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── RECEIPT SCREEN ─────────────────────────────────────────────────────────
  if (posScreen === 'receipt' && lastOrder) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-6 pt-24">
        <Navbar />
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl mt-4">
          <div className="text-center mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Order Complete!</h2>
            <p className="text-gray-500 text-sm">#{lastOrder.id.slice(-8).toUpperCase()}</p>
            <span className="inline-block mt-1 bg-gray-900 text-white text-xs px-3 py-1 rounded-full">
              {lastOrder.orderType.toUpperCase().replace('-', ' ')}
              {lastOrder.tableNo ? ` — ${lastOrder.tableNo}` : ''}
            </span>
          </div>

          <div className="border-t border-dashed border-gray-300 pt-3 mb-3 space-y-1">
            {lastOrder.items.map(item => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-gray-600">{item.name} × {item.qty}</span>
                <span className="text-gray-900 font-medium">₱{(item.price * item.qty).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-gray-300 pt-3 space-y-1">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Subtotal</span><span>₱{lastOrder.subtotal.toFixed(2)}</span>
            </div>
            {lastOrder.discountAmt > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>{lastOrder.discountType === 'pwd' ? 'PWD' : 'Senior'} Discount</span>
                <span>-₱{lastOrder.discountAmt.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg pt-1">
              <span>Total</span><span className="text-orange-500">₱{lastOrder.total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>Payment</span><span>{lastOrder.payment === 'cash' ? 'Cash' : 'Card'}</span>
            </div>
            {lastOrder.payment === 'cash' && (
              <div className="flex justify-between text-sm font-bold text-green-600">
                <span>Change</span><span>₱{lastOrder.change.toFixed(2)}</span>
              </div>
            )}
          </div>

          <div className="mt-5 space-y-2">
            <button onClick={() => printReceipt(lastOrder)}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2">
              <Printer className="w-4 h-4" />Print Receipt
            </button>
            <button onClick={() => { setPosScreen('home'); setTableNo(''); }}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl">
              New Order
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return null;
}