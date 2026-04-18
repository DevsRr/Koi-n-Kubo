import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import {
  ShoppingCart, Trash2, Plus, Minus, Printer, X,
  UtensilsCrossed, Package, ArrowLeft, CreditCard,
  Banknote, Star, Search, Users, CheckCircle,
  TrendingUp, ClipboardList, ChevronUp, ChevronDown
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import Navbar from '@/components/Navbar';
import { subscribeToMenuItems } from '@/services/menuService';
import {
  collection, addDoc, serverTimestamp, doc,
  updateDoc, getDoc, query, where, orderBy, onSnapshot
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { MenuItem } from '@/types';
import { auth } from '@/lib/firebase';

type OrderType = 'dine-in' | 'take-out' | 'delivery';
type PaymentMethod = 'cash' | 'card';
type Discount = 'none' | 'pwd' | 'senior';
type POSScreen = 'home' | 'order' | 'checkout' | 'receipt';
interface CartItem extends MenuItem { qty: number; }
interface CompletedOrder {
  id: string; items: CartItem[]; subtotal: number; discountAmt: number;
  total: number; payment: PaymentMethod; change: number;
  orderType: OrderType; discountType: Discount; tableNo: string; createdAt: Date;
}

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
  return { subtotal, discountAmt, total: subtotal - discountAmt };
}

// Swipeable cart row — swipe left to delete
function SwipeableCartItem({ item, onRemove, onQtyChange }: {
  item: CartItem; onRemove: () => void; onQtyChange: (delta: number) => void;
}) {
  const x = useMotionValue(0);
  const deleteBg = useTransform(x, [-80, 0], ['#ef4444', '#fff7ed']);
  const iconOpacity = useTransform(x, [-80, -20], [1, 0]);

  return (
    <div className="relative overflow-hidden rounded-2xl mb-2">
      <motion.div className="absolute inset-0 flex items-center justify-end pr-5 rounded-2xl" style={{ backgroundColor: deleteBg }}>
        <motion.div style={{ opacity: iconOpacity }}><Trash2 className="w-5 h-5 text-white" /></motion.div>
      </motion.div>
      <motion.div
        style={{ x }}
        drag="x"
        dragConstraints={{ left: -80, right: 0 }}
        dragElastic={0.08}
        onDragEnd={(_, info) => {
          if (info.offset.x < -55) { animate(x, -80, { duration: 0.12 }); setTimeout(onRemove, 150); }
          else animate(x, 0, { duration: 0.2 });
        }}
        className="relative bg-white border border-gray-100 rounded-2xl p-3 flex items-center gap-3 shadow-sm select-none touch-pan-y"
      >
        <img src={item.image} alt={item.name} className="w-12 h-12 rounded-xl object-cover shrink-0"
          onError={e => { (e.target as HTMLImageElement).src = `https://placehold.co/48x48/f3f4f6/6b7280?text=${item.name[0]}`; }} />
        <div className="flex-1 min-w-0">
          <p className="text-gray-900 font-semibold text-sm truncate">{item.name}</p>
          <p className="text-orange-500 font-bold text-sm">₱{item.price.toFixed(2)}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button onClick={() => onQtyChange(-1)} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 transition-colors min-w-[44px] min-h-[44px] -mx-1">
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="w-7 text-center font-bold text-gray-900 text-sm">{item.qty}</span>
          <button onClick={() => onQtyChange(1)} disabled={item.qty >= item.stock}
            className="w-8 h-8 rounded-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-200 disabled:text-gray-400 flex items-center justify-center text-white transition-colors min-w-[44px] min-h-[44px] -mx-1">
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
        <p className="text-gray-900 font-bold text-sm w-16 text-right shrink-0">₱{(item.price * item.qty).toFixed(2)}</p>
      </motion.div>
    </div>
  );
}

export default function POSPage() {
  const [posScreen, setPosScreen] = useState<POSScreen>('home');
  const [orderType, setOrderType] = useState<OrderType>('dine-in');
  const [tableNo, setTableNo] = useState('');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [payment, setPayment] = useState<PaymentMethod>('cash');
  const [discount, setDiscount] = useState<Discount>('none');
  const [cashInput, setCashInput] = useState('');
  const [lastOrder, setLastOrder] = useState<CompletedOrder | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [todaySales, setTodaySales] = useState(0);
  const [todayOrders, setTodayOrders] = useState(0);

  // Real-time menu from Firestore
  useEffect(() => {
    const unsub = subscribeToMenuItems(items => { setMenuItems(items); setMenuLoading(false); });
    return () => unsub();
  }, []);

  // Real-time POS sales via onSnapshot
  useEffect(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    try {
      const q = query(collection(db, 'posOrders'), where('createdAt', '>=', today), orderBy('createdAt', 'desc'));
      const unsub = onSnapshot(q, snap => {
        const docs = snap.docs.map(d => d.data());
        setTodayOrders(docs.length);
        setTodaySales(docs.reduce((s, o) => s + (o.total || 0), 0));
      });
      return () => unsub();
    } catch (e) { console.error('POS sales listener:', e); }
  }, []);

  const addToCart = useCallback((item: MenuItem) => {
    if (item.stock <= 0 || !item.isAvailable) return;
    setCart(prev => {
      const exists = prev.find(c => c.id === item.id);
      if (exists) {
        if (exists.qty >= item.stock) { toast.error(`Only ${item.stock} left`); return prev; }
        return prev.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c);
      }
      toast.success(`${item.name} added`, { duration: 1200 });
      return [...prev, { ...item, qty: 1 }];
    });
  }, []);

  const updateQty = useCallback((id: string, delta: number) => {
    setCart(prev => prev.map(c => c.id === id ? { ...c, qty: c.qty + delta } : c).filter(c => c.qty > 0));
  }, []);

  const removeItem = useCallback((id: string) => setCart(prev => prev.filter(c => c.id !== id)), []);

  const { subtotal, discountAmt, total } = calcTotals(cart, discount);
  const cashAmt = parseFloat(cashInput) || 0;
  const change = cashAmt - total;
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  const filtered = menuItems.filter(item => {
    const matchCat = category === 'all' || item.category === category;
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const cats = [
    { id: 'all', label: 'All', icon: '🍽️' },
    { id: 'katsu-bowls', label: 'Katsu', icon: '🍱' },
    { id: 'ramen', label: 'Ramen', icon: '🍜' },
    { id: 'rice-meals', label: 'Rice', icon: '🍚' },
    { id: 'extras', label: 'Extras', icon: '➕' },
  ];

  // Server-side stock decrement via Cloud Function (triggered by status change)
  // Client-side fallback for development (Cloud Function handles production)
  const decrementStockClientFallback = async (cartItems: CartItem[]) => {
    const ingredientUsage: Record<string, number> = {};
    for (const item of cartItems) {
      for (const [ingredient, ids] of Object.entries(INGREDIENT_GROUPS)) {
        if (ids.includes(item.id)) { ingredientUsage[ingredient] = (ingredientUsage[ingredient] || 0) + item.qty; }
      }
    }
    for (const [ingredient, qty] of Object.entries(ingredientUsage)) {
      for (const itemId of INGREDIENT_GROUPS[ingredient]) {
        const ref = doc(db, 'menuItems', itemId);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const newStock = Math.max(0, (snap.data().stock || 0) - qty);
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

  // ✅ Use auth properly (fixes TS warning)
  const currentUser = auth.currentUser;

  if (!currentUser) {
    console.error("User not authenticated");
    toast.error("Please log in first");
    return;
  }

  if (payment === 'cash' && cashAmt < total) return;

  setIsProcessing(true);

  try {
    const orderPayload = {
      // ✅ REQUIRED BY FIRESTORE RULES
      userId: currentUser.uid,

      items: cart.map(i => ({
        id: i.id,
        name: i.name,
        price: i.price,
        qty: i.qty,
        quantity: i.qty,
      })),

      subtotal,
      discountType: discount,
      discountAmt,
      total,

      payment,
      change: payment === 'cash' ? change : 0,

      orderType,
      tableNo,

      createdAt: serverTimestamp(),

      source: 'pos',

      // ✅ REQUIRED
      status: 'pending',

      customerName: 'Walk-in Customer',
      customerEmail: '',
      customerPhone: '',

      deliveryAddress: orderType === 'dine-in'
        ? {
            street: tableNo || 'Dine In',
            barangay: '',
            city: '',
            province: '',
            zipCode: ''
          }
        : {
            street: '',
            barangay: '',
            city: '',
            province: '',
            zipCode: ''
          },

      paymentMethod: payment === 'cash' ? 'cod' : 'card',
      notes: `POS Order — ${orderType}${tableNo ? ` — ${tableNo}` : ''}`,
    };

    const orderRef = await addDoc(collection(db, 'orders'), orderPayload);

    await addDoc(collection(db, 'posOrders'), {
      ...orderPayload,
      orderId: orderRef.id,
      status: 'confirmed',
    });

    await updateDoc(orderRef, {
      status: 'confirmed',
      updatedAt: serverTimestamp(),
    });

    // Optional stock fallback
    try {
      await decrementStockClientFallback(cart);
    } catch (e) {
      console.warn('Stock fallback failed:', e);
    }

    setLastOrder({
      id: orderRef.id,
      items: [...cart],
      subtotal,
      discountAmt,
      total,
      payment,
      change: payment === 'cash' ? change : 0,
      orderType,
      discountType: discount,
      tableNo,
      createdAt: new Date(),
    });

    setCart([]);
    setDiscount('none');
    setCashInput('');
    setPayment('cash');
    setPosScreen('receipt');

  } catch (err) {
    console.error('Order error:', err);
    toast.error('Order failed. Check permissions.');
  } finally {
    setIsProcessing(false);
  }
};

  const printReceipt = (order: CompletedOrder) => {
    const w = window.open('', '_blank', 'width=380,height=650');
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>Receipt #${order.id.slice(-8).toUpperCase()}</title>
    <style>
      *{margin:0;padding:0;box-sizing:border-box;}
      body{font-family:'Courier New',monospace;font-size:12px;padding:20px;width:320px;background:#fff;color:#000;}
      .c{text-align:center;} .b{font-weight:bold;}
      hr{border:none;border-top:1px dashed #888;margin:10px 0;}
      .row{display:flex;justify-content:space-between;margin:4px 0;}
      .logo{font-size:22px;font-weight:900;letter-spacing:3px;margin-bottom:4px;}
      .total-row{font-size:16px;font-weight:900;margin-top:4px;}
      .badge{background:#1a1a1a;color:#fff;padding:3px 10px;border-radius:20px;font-size:10px;display:inline-block;margin:4px 0;}
    </style></head><body>
    <div class="c">
      <div class="logo">KOI 'N KUBO</div>
      <div style="font-size:10px;color:#555;margin-bottom:6px">Japanese-Filipino Cuisine</div>
      <div class="badge">${order.orderType.toUpperCase().replace('-',' ')}</div>
      ${order.tableNo ? `<div style="font-size:11px;margin-top:2px">📍 ${order.tableNo}</div>` : ''}
      <div style="font-size:10px;color:#777;margin-top:4px">${order.createdAt.toLocaleString('en-PH')}</div>
      <div style="font-size:10px;font-weight:bold;letter-spacing:1px;margin-top:2px">#${order.id.slice(-8).toUpperCase()}</div>
    </div>
    <hr>
    <div style="margin:8px 0">
      ${order.items.map(i => `
        <div class="row">
          <span>${i.name}</span><span></span>
        </div>
        <div class="row" style="color:#555;font-size:11px;padding-left:8px">
          <span>× ${i.qty} @ ₱${i.price.toFixed(2)}</span>
          <span>₱${(i.price * i.qty).toFixed(2)}</span>
        </div>
      `).join('')}
    </div>
    <hr>
    <div class="row"><span>Subtotal</span><span>₱${order.subtotal.toFixed(2)}</span></div>
    ${order.discountAmt > 0 ? `<div class="row" style="color:#16a34a"><span>${order.discountType === 'pwd' ? 'PWD' : 'Senior'} Discount (20%)</span><span>-₱${order.discountAmt.toFixed(2)}</span></div>` : ''}
    <hr>
    <div class="row total-row"><span>TOTAL</span><span>₱${order.total.toFixed(2)}</span></div>
    <div class="row"><span>Payment</span><span>${order.payment === 'cash' ? 'Cash' : 'Card/GCash'}</span></div>
    ${order.payment === 'cash' ? `
      <div class="row"><span>Cash Tendered</span><span>₱${(order.change + order.total).toFixed(2)}</span></div>
      <div class="row b" style="color:#16a34a"><span>Change</span><span>₱${order.change.toFixed(2)}</span></div>
    ` : ''}
    <hr>
    <div class="c" style="font-size:11px;line-height:1.8;color:#555">
      Thank you for dining with us!<br>Please come again 🍜<br>
      <span style="font-size:9px">KOI 'N KUBO — Japanese-Filipino Cuisine</span>
    </div>
    <script>window.onload=()=>{window.print();window.onafterprint=()=>window.close();}</script>
    </body></html>`);
    w.document.close();
  };

  // ─── HOME SCREEN ───────────────────────────────────────────────────────────
  if (posScreen === 'home') return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      {/* Same dark gradient header as MenuPage */}
      <div className="pt-20 pb-8 bg-gradient-to-b from-gray-900 to-gray-800">
        <div className="max-w-2xl mx-auto px-4 pt-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-1">
              Point of <span className="text-orange-500">Sale</span>
            </h1>
            <p className="text-gray-400 text-sm mb-6">Select order type to begin</p>

            {/* Stats bar */}
            <div className="flex gap-3 justify-center mb-8">
              <div className="bg-white/10 backdrop-blur rounded-2xl px-5 py-3">
                <p className="text-gray-400 text-xs">Today's Sales</p>
                <p className="text-green-400 font-bold text-xl">₱{todaySales.toFixed(2)}</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-2xl px-5 py-3">
                <p className="text-gray-400 text-xs">POS Orders</p>
                <p className="text-orange-400 font-bold text-xl">{todayOrders}</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Order type cards — same card style as MenuPage */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {([
            { type: 'dine-in' as OrderType, icon: UtensilsCrossed, label: 'Dine In', emoji: '🍽️' },
            { type: 'take-out' as OrderType, icon: Package, label: 'Take Out', emoji: '📦' },
            { type: 'delivery' as OrderType, icon: TrendingUp, label: 'Delivery', emoji: '🛵' },
          ] as const).map(({ type, icon: Icon, label, emoji }) => (
            <motion.button key={type} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => setOrderType(type)}
              className={`rounded-2xl p-4 flex flex-col items-center gap-2 border-2 transition-all min-h-[100px] ${
                orderType === type
                  ? 'bg-orange-500 border-orange-500 shadow-lg shadow-orange-200'
                  : 'bg-white border-gray-100 shadow-sm hover:border-orange-200 hover:shadow-md'
              }`}>
              <span className="text-2xl">{emoji}</span>
              <span className={`font-bold text-sm ${orderType === type ? 'text-white' : 'text-gray-800'}`}>{label}</span>
            </motion.button>
          ))}
        </div>

        {/* Table number — same Input style as site */}
        <AnimatePresence>
          {orderType === 'dine-in' && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-6 overflow-hidden">
              <label className="block text-sm font-medium text-gray-700 mb-2">Table Number (optional)</label>
              <input type="text" value={tableNo} onChange={e => setTableNo(e.target.value)} placeholder="e.g. Table 3, Counter"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-base focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white shadow-sm" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Start order button — same as MenuPage's Add to Cart style */}
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => setPosScreen('order')}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg py-4 rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-orange-200 transition-colors min-h-[56px]">
          <ClipboardList className="w-5 h-5" />
          Start Order
        </motion.button>
      </div>
    </div>
  );

  // ─── ORDER SCREEN ──────────────────────────────────────────────────────────
  if (posScreen === 'order') return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      {/* Same dark header as MenuPage */}
      <div className="pt-16 md:pt-20 bg-gradient-to-b from-gray-900 to-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setPosScreen('home')} className="text-gray-300 hover:text-white transition-colors p-2 -ml-2 min-w-[44px] min-h-[44px] flex items-center justify-center">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-white font-bold text-lg">
                {orderType === 'dine-in' ? `Dine In${tableNo ? ` — ${tableNo}` : ''}` : orderType === 'take-out' ? 'Take Out' : 'Delivery'}
              </h2>
              <p className="text-gray-400 text-xs">Tap an item to add to order</p>
            </div>
          </div>
        </div>

        {/* Category filter — exact same pills as MenuPage */}
        <div className="sticky top-16 md:top-20 z-40 bg-white shadow-md">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center gap-2 py-3 overflow-x-auto scrollbar-hide">
              {cats.map(cat => (
                <button key={cat.id} onClick={() => setCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all min-h-[44px] ${
                    category === cat.id ? 'bg-orange-500 text-white shadow-lg' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}>
                  <span>{cat.icon}</span><span>{cat.label}</span>
                </button>
              ))}
              {/* Search in the pill bar on mobile */}
              <div className="relative ml-auto shrink-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
                  className="pl-8 pr-3 py-2 rounded-full text-sm border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 w-32 md:w-48" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Two-column layout: menu grid + cart sidebar (desktop only) */}
      <div className="flex flex-1 max-w-7xl mx-auto w-full px-4 py-6 gap-6">

        {/* Menu grid — same grid as MenuPage */}
        <div className="flex-1">
          {menuLoading ? (
            <div className="flex items-center justify-center py-24">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div key={category}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 pb-36 md:pb-6">
                {filtered.map((item, i) => {
                  const inCart = cart.find(c => c.id === item.id);
                  const soldOut = item.stock <= 0 || !item.isAvailable;
                  const isLow = !soldOut && item.stock <= item.lowStockThreshold;
                  return (
                    <motion.div key={item.id}
                      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: i * 0.03 } }}
                      onClick={() => addToCart(item)}
                      className={`group bg-white rounded-2xl shadow-sm overflow-hidden transition-all ${
                        soldOut ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:shadow-xl hover:-translate-y-0.5'
                      } ${inCart ? 'ring-2 ring-orange-500 shadow-orange-100' : ''}`}>
                      {/* Image — same aspect-square as MenuPage */}
                      <div className="relative aspect-square overflow-hidden">
                        <img src={item.image} alt={item.name}
                          className={`w-full h-full object-cover transition-transform duration-500 ${!soldOut ? 'group-hover:scale-110' : ''}`}
                          onError={e => { (e.target as HTMLImageElement).src = `https://placehold.co/400x400/f3f4f6/374151?text=${encodeURIComponent(item.name)}`; }} />

                        {/* Sold out ribbon */}
                        {soldOut && (
                          <div className="absolute top-4 right-0 bg-red-600 text-white text-xs font-bold px-4 py-1 shadow-md tracking-widest uppercase">Sold Out</div>
                        )}

                        {/* Badges — same as MenuPage */}
                        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                          {item.isBestSeller && !soldOut && (
                            <Badge className="bg-orange-500 text-white flex items-center gap-1 text-xs">
                              <Star className="w-3 h-3 fill-current" />Best Seller
                            </Badge>
                          )}
                          {isLow && (
                            <Badge className="bg-yellow-500 text-white text-xs">Only {item.stock} left!</Badge>
                          )}
                        </div>

                        {/* Cart qty bubble */}
                        {inCart && (
                          <div className="absolute top-3 right-3 bg-orange-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg">
                            {inCart.qty}
                          </div>
                        )}

                        {/* Price tag — same as MenuPage */}
                        {!soldOut && (
                          <div className="absolute bottom-3 right-3">
                            <span className="bg-white/90 backdrop-blur-sm text-gray-900 font-bold px-3 py-1 rounded-full shadow-lg text-sm">
                              ₱{item.price.toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-3">
                        <h3 className={`font-bold text-sm leading-tight mb-1 transition-colors ${soldOut ? 'text-gray-400' : 'text-gray-900 group-hover:text-orange-500'}`}>
                          {item.name}
                        </h3>
                        <div className="flex items-center gap-1.5">
                          <div className={`w-1.5 h-1.5 rounded-full ${soldOut ? 'bg-red-400' : isLow ? 'bg-yellow-400' : 'bg-green-400'}`} />
                          <span className={`text-xs ${soldOut ? 'text-red-400' : isLow ? 'text-yellow-600' : 'text-gray-400'}`}>
                            {soldOut ? 'Sold Out' : isLow ? `${item.stock} left` : 'In Stock'}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        {/* Desktop cart sidebar */}
        <div className="hidden lg:flex w-80 flex-col">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col max-h-[calc(100vh-10rem)] sticky top-32">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-orange-500" />
                <h3 className="font-bold text-gray-900">Order ({cartCount})</h3>
              </div>
              {cart.length > 0 && (
                <button onClick={() => setCart([])} className="text-red-400 hover:text-red-600 text-xs flex items-center gap-1 transition-colors">
                  <Trash2 className="w-3 h-3" />Clear
                </button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-0">
              {cart.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-25" />
                  <p className="text-sm">Tap items to add</p>
                </div>
              ) : cart.map(item => (
                <SwipeableCartItem key={item.id} item={item}
                  onRemove={() => removeItem(item.id)} onQtyChange={d => updateQty(item.id, d)} />
              ))}
            </div>
            {cart.length > 0 && (
              <div className="p-4 border-t border-gray-100 space-y-3">
                <div className="flex justify-between text-sm text-gray-500"><span>Subtotal</span><span className="text-gray-900 font-medium">₱{subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between text-xl font-bold"><span className="text-gray-900">Total</span><span className="text-orange-500">₱{total.toFixed(2)}</span></div>
                <button onClick={() => setPosScreen('checkout')}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors min-h-[52px]">
                  <CreditCard className="w-4 h-4" />Checkout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile: sticky bottom cart bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
        {/* Expandable cart drawer */}
        <AnimatePresence>
          {cartOpen && cart.length > 0 && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="bg-white border-t border-gray-200 shadow-2xl max-h-72 overflow-y-auto p-4 space-y-0">
              {cart.map(item => (
                <SwipeableCartItem key={item.id} item={item}
                  onRemove={() => removeItem(item.id)} onQtyChange={d => updateQty(item.id, d)} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sticky checkout bar */}
        <div className="bg-white border-t border-gray-200 px-4 py-3 flex items-center gap-3 shadow-xl">
          <button onClick={() => setCartOpen(o => !o)}
            className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 rounded-xl px-4 py-3 transition-colors min-h-[52px]">
            <div className="relative">
              <ShoppingCart className="w-5 h-5 text-gray-700" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                  {cartCount}
                </span>
              )}
            </div>
            {cartOpen ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronUp className="w-4 h-4 text-gray-500" />}
          </button>
          <div className="flex-1">
            <p className="text-xs text-gray-500">{cartCount} item{cartCount !== 1 ? 's' : ''}</p>
            <p className="font-bold text-gray-900 text-lg leading-tight">₱{total.toFixed(2)}</p>
          </div>
          <button onClick={() => setPosScreen('checkout')} disabled={cart.length === 0}
            className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold px-8 py-3 rounded-xl flex items-center gap-2 transition-colors min-h-[52px] shrink-0">
            <CreditCard className="w-4 h-4" />Checkout
          </button>
        </div>
      </div>
    </div>
  );

  // ─── CHECKOUT SCREEN ───────────────────────────────────────────────────────
  if (posScreen === 'checkout') {
    const canPay = payment === 'card' || (payment === 'cash' && cashAmt >= total);
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="pt-20 bg-gradient-to-b from-gray-900 to-gray-800 pb-6">
          <div className="max-w-lg mx-auto px-4 pt-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setPosScreen('order')} className="text-gray-300 hover:text-white p-2 -ml-2 min-w-[44px] min-h-[44px] flex items-center">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-white font-bold text-xl">Checkout</h1>
            </div>
          </div>
        </div>

        <div className="max-w-lg mx-auto px-4 py-6 space-y-4 pb-32">
          {/* Order summary card — same card style as site */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <h3 className="font-bold text-gray-900 mb-3">Order Summary</h3>
            <div className="space-y-2">
              {cart.map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-gray-600">{item.name} <span className="text-gray-400">× {item.qty}</span></span>
                  <span className="font-medium text-gray-900">₱{(item.price * item.qty).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Discount */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-orange-500" />Discount
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {([
                { value: 'none' as Discount, label: 'None', sub: 'Regular' },
                { value: 'pwd' as Discount, label: 'PWD', sub: '20% off' },
                { value: 'senior' as Discount, label: 'Senior', sub: '20% off' },
              ]).map(d => (
                <button key={d.value} onClick={() => setDiscount(d.value)}
                  className={`rounded-xl p-3 text-center border-2 transition-all min-h-[60px] ${
                    discount === d.value ? 'border-orange-500 bg-orange-50' : 'border-gray-100 bg-gray-50 hover:border-gray-300'
                  }`}>
                  <p className={`font-bold text-sm ${discount === d.value ? 'text-orange-500' : 'text-gray-800'}`}>{d.label}</p>
                  <p className="text-gray-400 text-xs">{d.sub}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Payment */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <h3 className="font-bold text-gray-900 mb-3">Payment</h3>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {([
                { value: 'cash' as PaymentMethod, icon: Banknote, label: 'Cash', sub: 'Bills & coins' },
                { value: 'card' as PaymentMethod, icon: CreditCard, label: 'Card / GCash', sub: 'Tap or scan' },
              ]).map(p => (
                <button key={p.value} onClick={() => setPayment(p.value)}
                  className={`rounded-xl p-4 flex flex-col gap-1.5 border-2 transition-all min-h-[80px] ${
                    payment === p.value ? 'border-orange-500 bg-orange-50' : 'border-gray-100 bg-gray-50 hover:border-gray-300'
                  }`}>
                  <p.icon className={`w-5 h-5 ${payment === p.value ? 'text-orange-500' : 'text-gray-500'}`} />
                  <span className={`font-bold text-sm ${payment === p.value ? 'text-orange-500' : 'text-gray-800'}`}>{p.label}</span>
                  <span className="text-gray-400 text-xs">{p.sub}</span>
                </button>
              ))}
            </div>

            <AnimatePresence>
              {payment === 'cash' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-3 overflow-hidden">
                  <label className="block text-sm font-medium text-gray-700">Cash Received</label>
                  <input type="number" value={cashInput} onChange={e => setCashInput(e.target.value)} placeholder="0.00"
                    className="w-full border-2 border-gray-200 focus:border-orange-500 rounded-xl px-4 py-3 text-gray-900 text-2xl font-bold focus:outline-none text-center" />
                  {/* Quick amounts */}
                  <div className="grid grid-cols-4 gap-2">
                    {[100, 200, 500, 1000].map(amt => (
                      <button key={amt} onClick={() => setCashInput(String(amt))}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium text-sm py-2.5 rounded-xl transition-colors min-h-[44px]">
                        ₱{amt}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => setCashInput(String(Math.ceil(total / 50) * 50))}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm py-2.5 rounded-xl transition-colors min-h-[44px]">
                    Exact: ₱{Math.ceil(total / 50) * 50}
                  </button>
                  <AnimatePresence>
                    {cashAmt >= total && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="flex justify-between bg-green-50 border border-green-200 rounded-xl p-3">
                        <span className="text-green-700 font-bold">Change</span>
                        <span className="text-green-700 font-bold text-lg">₱{change.toFixed(2)}</span>
                      </motion.div>
                    )}
                    {cashAmt > 0 && cashAmt < total && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="flex justify-between bg-red-50 border border-red-200 rounded-xl p-3">
                        <span className="text-red-600 text-sm">Short by</span>
                        <span className="text-red-600 font-bold">₱{(total - cashAmt).toFixed(2)}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bill summary */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-2">
            <div className="flex justify-between text-sm text-gray-500"><span>Subtotal</span><span className="text-gray-900">₱{subtotal.toFixed(2)}</span></div>
            {discountAmt > 0 && (
              <div className="flex justify-between text-sm"><span className="text-green-600">{discount === 'pwd' ? 'PWD' : 'Senior'} Discount (20%)</span><span className="text-green-600 font-medium">−₱{discountAmt.toFixed(2)}</span></div>
            )}
            <div className="flex justify-between text-xl font-bold pt-2 border-t border-gray-100">
              <span className="text-gray-900">Total</span><span className="text-orange-500">₱{total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Sticky confirm button */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 shadow-2xl">
          <div className="max-w-lg mx-auto">
            <button onClick={processOrder} disabled={!canPay || isProcessing}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold text-lg py-4 rounded-2xl flex items-center justify-center gap-3 transition-colors shadow-lg shadow-orange-200 min-h-[56px]">
              <CheckCircle className="w-5 h-5" />
              {isProcessing ? 'Processing…' : `Confirm — ₱${total.toFixed(2)}`}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── RECEIPT SCREEN ────────────────────────────────────────────────────────
  if (posScreen === 'receipt' && lastOrder) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-20 bg-gradient-to-b from-gray-900 to-gray-800 pb-6">
        <div className="max-w-lg mx-auto px-4 pt-4 text-center">
          <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', duration: 0.5 }}>
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h1 className="text-white text-2xl font-bold">Order Complete!</h1>
            <p className="text-gray-400 text-sm mt-1">#{lastOrder.id.slice(-8).toUpperCase()}</p>
            <span className="inline-block mt-2 bg-orange-500 text-white text-xs font-bold px-4 py-1.5 rounded-full">
              {lastOrder.orderType.toUpperCase().replace('-', ' ')}
              {lastOrder.tableNo ? ` — ${lastOrder.tableNo}` : ''}
            </span>
          </motion.div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4 pb-32">
        {/* Receipt card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="space-y-1.5 mb-4">
            {lastOrder.items.map(item => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-gray-600">{item.name} × {item.qty}</span>
                <span className="font-medium text-gray-900">₱{(item.price * item.qty).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-dashed border-gray-200 pt-3 space-y-1.5">
            <div className="flex justify-between text-sm text-gray-500"><span>Subtotal</span><span>₱{lastOrder.subtotal.toFixed(2)}</span></div>
            {lastOrder.discountAmt > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>{lastOrder.discountType === 'pwd' ? 'PWD' : 'Senior'} Discount</span>
                <span>−₱{lastOrder.discountAmt.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-xl pt-1 border-t border-gray-100">
              <span>Total</span><span className="text-orange-500">₱{lastOrder.total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500"><span>Payment</span><span>{lastOrder.payment === 'cash' ? 'Cash' : 'Card/GCash'}</span></div>
            {lastOrder.payment === 'cash' && (
              <div className="flex justify-between text-sm font-bold text-green-600"><span>Change</span><span>₱{lastOrder.change.toFixed(2)}</span></div>
            )}
          </div>
        </div>
      </div>

      {/* Sticky action buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 shadow-2xl">
        <div className="max-w-lg mx-auto flex gap-3">
          <button onClick={() => printReceipt(lastOrder)}
            className="flex-1 bg-gray-900 hover:bg-gray-800 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors min-h-[52px]">
            <Printer className="w-4 h-4" />Print
          </button>
          <button onClick={() => { setPosScreen('home'); setTableNo(''); }}
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl transition-colors min-h-[52px]">
            New Order
          </button>
        </div>
      </div>
    </div>
  );

  return null;
}