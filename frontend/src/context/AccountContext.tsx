import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import api from '../services/api';
import toast from 'react-hot-toast';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SavedAddress {
  id: string;
  label: string; // "Home", "Work", etc.
  fullName: string;
  phone: string;
  address: string;
  city: string;
  isDefault: boolean;
}

export interface AccountProfile {
  fullName: string;
  email: string;
  phone: string;
  avatarInitials: string;
}

export interface OrderItem {
  id: number;
  productId: number;
  quantity: number;
  priceAtTime: number;
  product: {
    id: number;
    title: string;
    artist: string;
    imgUrl: string;
    category: string;
  };
}

export interface Order {
  id: string;
  status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED';
  totalAmount: number;
  createdAt: string;
  shippingAddr: string;
  customerEmail: string;
  customerPhone: string;
  orderItems: OrderItem[];
}

interface AccountContextValue {
  profile: AccountProfile | null;
  addresses: SavedAddress[];
  orders: Order[];
  ordersLoading: boolean;
  defaultAddress: SavedAddress | null;
  addAddress: (addr: Omit<SavedAddress, 'id'>) => void;
  updateAddress: (id: string, addr: Partial<SavedAddress>) => void;
  deleteAddress: (id: string) => void;
  setDefaultAddress: (id: string) => void;
  updateProfile: (data: Partial<AccountProfile>) => void;
  refreshOrders: () => Promise<void>;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const AccountContext = createContext<AccountContextValue>({
  profile: null,
  addresses: [],
  orders: [],
  ordersLoading: false,
  defaultAddress: null,
  addAddress: () => {},
  updateAddress: () => {},
  deleteAddress: () => {},
  setDefaultAddress: () => {},
  updateProfile: () => {},
  refreshOrders: async () => {},
});

// ─── Storage helpers ──────────────────────────────────────────────────────────

const ADDRESSES_KEY = 'rs_saved_addresses';

const loadAddresses = (): SavedAddress[] => {
  try {
    const raw = localStorage.getItem(ADDRESSES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveAddresses = (addrs: SavedAddress[]) => {
  try {
    localStorage.setItem(ADDRESSES_KEY, JSON.stringify(addrs));
  } catch {}
};

// ─── Provider ────────────────────────────────────────────────────────────────

export const AccountProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoggedIn, profile: reduxProfile } = useSelector((s: RootState) => s.user);

  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [localProfile, setLocalProfile] = useState<AccountProfile | null>(null);

  // Sync profile from Redux
  useEffect(() => {
    if (reduxProfile) {
      setLocalProfile({
        fullName: reduxProfile.name || '',
        email: reduxProfile.email || '',
        phone: reduxProfile.phone || '',
        avatarInitials: (reduxProfile.name || 'U').charAt(0).toUpperCase(),
      });
      // Load addresses from localStorage per user email
      setAddresses(loadAddresses());
    } else {
      setLocalProfile(null);
      setAddresses([]);
      setOrders([]);
    }
  }, [reduxProfile]);

  const refreshOrders = useCallback(async () => {
    if (!isLoggedIn) return;
    setOrdersLoading(true);
    try {
      const data = await api.get('/orders/my-orders') as Order[];
      setOrders(data);
    } catch {
      // silently fail — user sees empty state
    } finally {
      setOrdersLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn) refreshOrders();
    else setOrders([]);
  }, [isLoggedIn, refreshOrders]);

  const addAddress = (addr: Omit<SavedAddress, 'id'>) => {
    const newAddr: SavedAddress = { ...addr, id: Date.now().toString() };
    let updated = [...addresses];
    if (addr.isDefault) {
      updated = updated.map(a => ({ ...a, isDefault: false }));
    }
    updated.push(newAddr);
    setAddresses(updated);
    saveAddresses(updated);
    toast.success('Địa chỉ đã được lưu');
  };

  const updateAddress = (id: string, data: Partial<SavedAddress>) => {
    let updated = addresses.map(a => a.id === id ? { ...a, ...data } : a);
    if (data.isDefault) {
      updated = updated.map(a => a.id === id ? { ...a, isDefault: true } : { ...a, isDefault: false });
    }
    setAddresses(updated);
    saveAddresses(updated);
    toast.success('Địa chỉ đã được cập nhật');
  };

  const deleteAddress = (id: string) => {
    const updated = addresses.filter(a => a.id !== id);
    setAddresses(updated);
    saveAddresses(updated);
    toast.success('Đã xóa địa chỉ');
  };

  const setDefaultAddress = (id: string) => {
    const updated = addresses.map(a => ({ ...a, isDefault: a.id === id }));
    setAddresses(updated);
    saveAddresses(updated);
    toast.success('Đã đặt làm địa chỉ mặc định');
  };

  const updateProfile = (data: Partial<AccountProfile>) => {
    setLocalProfile(prev => prev ? { ...prev, ...data, avatarInitials: (data.fullName || prev.fullName || 'U').charAt(0).toUpperCase() } : null);
  };

  const defaultAddress = addresses.find(a => a.isDefault) || addresses[0] || null;

  return (
    <AccountContext.Provider value={{
      profile: localProfile,
      addresses,
      orders,
      ordersLoading,
      defaultAddress,
      addAddress,
      updateAddress,
      deleteAddress,
      setDefaultAddress,
      updateProfile,
      refreshOrders,
    }}>
      {children}
    </AccountContext.Provider>
  );
};

export const useAccount = () => useContext(AccountContext);