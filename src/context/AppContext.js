// Global app state shared by all the screens (user, cart, wallet, orders).
//
// The cart, the wallet and the orders are needed by many screens in
// different tabs, so instead of passing them as props through every
// navigator we keep them in one place (React Context) and every screen
// reads them with the useApp() hook.
//
// Everything is saved with AsyncStorage so it survives closing the app.
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { allBuildings, allStores, couriers, demoUser } from '../api/campusApi';
import { cartSubtotal, getDeliveryFee, MIN_ORDER, round2 } from '../utils/pricing';
import { getSlotStatus, isStoreOpen, todayAt } from '../utils/time';

const AppContext = createContext(null);

export const useApp = () => useContext(AppContext);

// ---- Order status simulation --------------------------------------------
export const ORDER_STATUSES = ['Received', 'Preparing', 'On the way', 'Delivered'];
// How long (ms) an order stays in each status before moving to the next one
const STATUS_DURATIONS = [10000, 8000, 8000];

const STARTING_BALANCE = 20;

// ---- AsyncStorage keys ---------------------------------------------------
const USERS_KEY = 'campusgo:users';
const SESSION_KEY = 'campusgo:session';
const DEMO_TIME_KEY = 'campusgo:demoTime';
const userDataKey = (email) => `campusgo:data:${email}`;

const emptyCart = { storeId: null, items: [] };
const newWallet = () => ({
  balance: STARTING_BALANCE,
  transactions: [
    {
      id: `t${Date.now()}`,
      type: 'topup',
      label: 'Welcome bonus',
      amount: STARTING_BALANCE,
      date: new Date().toISOString(),
    },
  ],
});

const makeId = (prefix) => `${prefix}${Date.now()}${Math.floor(Math.random() * 1000)}`;

export function AppProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState(emptyCart);
  const [wallet, setWallet] = useState(newWallet());
  const [orders, setOrders] = useState([]);
  const [savedLocations, setSavedLocations] = useState([]);
  const [demoTime, setDemoTimeState] = useState(null); // "HH:MM" or null
  const [clock, setClock] = useState(new Date());

  // ---- 1. Restore the session when the app starts ------------------------
  useEffect(() => {
    const restore = async () => {
      try {
        const users = await AsyncStorage.getItem(USERS_KEY);
        if (!users) {
          // first launch: create the demo account
          await AsyncStorage.setItem(USERS_KEY, JSON.stringify([demoUser]));
        }
        const savedDemoTime = await AsyncStorage.getItem(DEMO_TIME_KEY);
        if (savedDemoTime) setDemoTimeState(savedDemoTime);

        const email = await AsyncStorage.getItem(SESSION_KEY);
        if (email) {
          const list = JSON.parse(users || JSON.stringify([demoUser]));
          const found = list.find((u) => u.email === email);
          if (found) await loadUserData(found);
        }
      } catch (e) {
        console.warn('Could not restore data', e);
      } finally {
        setLoading(false);
      }
    };
    restore();
  }, []);

  // ---- 2. Save the user's data each time it changes ----------------------
  useEffect(() => {
    if (!user) return;
    const data = { cart, wallet, orders, savedLocations };
    AsyncStorage.setItem(userDataKey(user.email), JSON.stringify(data)).catch((e) =>
      console.warn('Could not save data', e)
    );
  }, [user, cart, wallet, orders, savedLocations]);

  // ---- 3. Live clock (used for Open/Closed badges and delivery slots) ----
  useEffect(() => {
    const id = setInterval(() => setClock(new Date()), 15000);
    return () => clearInterval(id); // cleanup
  }, []);

  // ---- 4. Simulated order tracking: move orders to the next status ------
  useEffect(() => {
    const id = setInterval(() => {
      setOrders((prev) => {
        let changed = false;
        const next = prev.map((order) => {
          const index = ORDER_STATUSES.indexOf(order.status);
          if (index === -1 || index >= ORDER_STATUSES.length - 1) return order; // cancelled or delivered
          const last = order.statusHistory[order.statusHistory.length - 1];
          const elapsed = Date.now() - new Date(last.at).getTime();
          if (elapsed < STATUS_DURATIONS[index]) return order;
          changed = true;
          const status = ORDER_STATUSES[index + 1];
          return {
            ...order,
            status,
            statusHistory: [...order.statusHistory, { status, at: new Date().toISOString() }],
          };
        });
        return changed ? next : prev; // returning prev = no re-render
      });
    }, 1000);
    return () => clearInterval(id); // cleanup
  }, []);

  // "now" is the real time, or the demo time chosen in the profile
  // (useMemo keeps the same Date object between renders until the time changes)
  const now = useMemo(() => (demoTime ? todayAt(demoTime) : clock), [demoTime, clock]);
  const getNow = () => (demoTime ? todayAt(demoTime) : new Date());

  // ======================================================================
  // Auth
  // ======================================================================
  const loadUserData = async (account) => {
    const raw = await AsyncStorage.getItem(userDataKey(account.email));
    const data = raw ? JSON.parse(raw) : null;
    setCart(data?.cart || emptyCart);
    setWallet(data?.wallet || newWallet());
    setOrders(data?.orders || []);
    setSavedLocations(data?.savedLocations || []);
    setUser(account);
  };

  const getUsers = async () => {
    const raw = await AsyncStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : [demoUser];
  };

  // returns an error message, or null when it worked
  const login = async (email, password) => {
    const users = await getUsers();
    const account = users.find((u) => u.email === email.trim().toLowerCase());
    if (!account) return 'No account found with this email. Please sign up first.';
    if (account.password !== password) return 'Wrong password';
    await AsyncStorage.setItem(SESSION_KEY, account.email);
    await loadUserData(account);
    return null;
  };

  const signUp = async (form) => {
    const users = await getUsers();
    const email = form.email.trim().toLowerCase();
    if (users.some((u) => u.email === email)) return 'An account with this email already exists';
    if (users.some((u) => u.universityId === form.universityId)) return 'This university ID is already registered';
    const account = {
      fullName: form.fullName.trim(),
      email,
      password: form.password,
      universityId: form.universityId,
      faculty: form.faculty,
      phone: form.phone,
    };
    await AsyncStorage.setItem(USERS_KEY, JSON.stringify([...users, account]));
    await AsyncStorage.setItem(SESSION_KEY, email);
    await loadUserData(account);
    return null;
  };

  const logout = async () => {
    await AsyncStorage.removeItem(SESSION_KEY);
    setUser(null);
    setCart(emptyCart);
    setOrders([]);
  };

  // ======================================================================
  // Cart  (rule: products from ONE store only)
  // ======================================================================
  const cartStoreId = cart.items.length > 0 ? cart.storeId : null;

  // true when adding from this store would break the one-store rule
  const isOtherStore = (storeId) => cartStoreId !== null && cartStoreId !== storeId;

  const addToCart = (storeId, item) => {
    setCart((prev) => {
      const sameStore = prev.items.length === 0 || prev.storeId === storeId;
      const items = sameStore ? prev.items : [];
      const existing = items.find((i) => i.key === item.key);
      const newItems = existing
        ? items.map((i) => (i.key === item.key ? { ...i, qty: i.qty + item.qty } : i))
        : [...items, item];
      return { storeId, items: newItems };
    });
  };

  const changeQty = (key, delta) => {
    setCart((prev) => ({
      ...prev,
      items: prev.items
        .map((i) => (i.key === key ? { ...i, qty: i.qty + delta } : i))
        .filter((i) => i.qty > 0),
    }));
  };

  const removeFromCart = (key) => {
    setCart((prev) => ({ ...prev, items: prev.items.filter((i) => i.key !== key) }));
  };

  const clearCart = () => setCart(emptyCart);

  // Copies a previous order into the cart (replaces the current cart)
  const reorder = (order) => {
    const items = order.items.map((i) => ({ ...i, key: i.key }));
    setCart({ storeId: order.storeId, items });
  };

  // ======================================================================
  // Wallet
  // ======================================================================
  const addTransaction = (type, label, amount) => {
    setWallet((prev) => ({
      balance: round2(prev.balance + amount),
      transactions: [
        { id: makeId('t'), type, label, amount: round2(amount), date: new Date().toISOString() },
        ...prev.transactions,
      ],
    }));
  };

  const topUp = (amount) => addTransaction('topup', 'Wallet top-up', amount);

  // ======================================================================
  // Orders
  // ======================================================================
  // Checks every business rule, then creates the order.
  // Returns { error } or { order }.
  const placeOrder = ({ buildingId, room, slot, paymentMethod }) => {
    const store = allStores.find((s) => s.id === cart.storeId);
    const current = getNow();
    const subtotal = cartSubtotal(cart.items);
    const fee = getDeliveryFee(subtotal);
    const total = round2(subtotal + fee);

    if (!store || cart.items.length === 0) return { error: 'Your cart is empty' };
    if (!isStoreOpen(store, current)) return { error: `${store.name} is closed right now` };
    if (subtotal < MIN_ORDER) return { error: `Minimum order is $${MIN_ORDER.toFixed(2)}` };
    if (!buildingId) return { error: 'Choose a building' };
    if (!room.trim()) return { error: 'Enter the room number' };
    if (!slot) return { error: 'Choose a delivery slot' };
    if (!getSlotStatus(slot, current, store.prepTime).available)
      return { error: 'This slot is no longer available, please choose another one' };
    if (!paymentMethod) return { error: 'Choose a payment method' };
    if (paymentMethod === 'wallet' && wallet.balance < total)
      return { error: `Insufficient wallet balance ($${wallet.balance.toFixed(2)}). Top up or pay cash.` };

    const building = allBuildings.find((b) => b.id === buildingId);
    const createdAt = new Date().toISOString();
    const order = {
      id: `CG-${Math.floor(1000 + Math.random() * 9000)}`,
      storeId: store.id,
      storeName: store.name,
      storeLogo: store.logo,
      items: cart.items,
      subtotal,
      deliveryFee: fee,
      total,
      building,
      room: room.trim(),
      slot,
      paymentMethod,
      courier: couriers[Math.floor(Math.random() * couriers.length)],
      status: 'Received',
      statusHistory: [{ status: 'Received', at: createdAt }],
      createdAt,
      rating: null,
    };

    if (paymentMethod === 'wallet') {
      addTransaction('payment', `Order ${order.id} – ${store.name}`, -total);
    }
    setOrders((prev) => [order, ...prev]);
    clearCart();
    return { order };
  };

  // Cancel is only allowed while the order is still "Received"
  const cancelOrder = (orderId) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order || order.status !== 'Received') return false;
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: 'Cancelled',
              statusHistory: [...o.statusHistory, { status: 'Cancelled', at: new Date().toISOString() }],
            }
          : o
      )
    );
    if (order.paymentMethod === 'wallet') {
      addTransaction('refund', `Refund ${order.id}`, order.total);
    }
    return true;
  };

  const rateOrder = (orderId, stars, comment) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, rating: { stars, comment: comment.trim() } } : o))
    );
  };

  // ======================================================================
  // Profile: saved delivery locations + demo clock
  // ======================================================================
  const addLocation = (location) => {
    setSavedLocations((prev) => [...prev, { ...location, id: makeId('l') }]);
  };

  const removeLocation = (id) => {
    setSavedLocations((prev) => prev.filter((l) => l.id !== id));
  };

  const setDemoTime = async (value) => {
    setDemoTimeState(value);
    if (value) await AsyncStorage.setItem(DEMO_TIME_KEY, value);
    else await AsyncStorage.removeItem(DEMO_TIME_KEY);
  };

  const value = {
    loading,
    user,
    login,
    signUp,
    logout,
    // cart
    cart,
    isOtherStore,
    addToCart,
    changeQty,
    removeFromCart,
    clearCart,
    reorder,
    // wallet
    wallet,
    topUp,
    // orders
    orders,
    placeOrder,
    cancelOrder,
    rateOrder,
    // profile
    savedLocations,
    addLocation,
    removeLocation,
    // time
    now,
    demoTime,
    setDemoTime,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
