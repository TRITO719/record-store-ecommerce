import { createSlice } from '@reduxjs/toolkit';
import type { Product, CartItem } from '../types';
import type { PayloadAction } from '@reduxjs/toolkit';

interface CartState {
  items: CartItem[];
}

// Đọc giỏ hàng từ localStorage khi khởi động — persist qua reload
const loadCartFromStorage = (): CartState => {
  try {
    const raw = localStorage.getItem('cart');
    if (!raw) return { items: [] };
    const parsed = JSON.parse(raw);
    // Validate shape: phải có items là array để tránh crash nếu dữ liệu bị corrupt
    if (!parsed || !Array.isArray(parsed.items)) return { items: [] };
    return parsed as CartState;
  } catch {
    return { items: [] };
  }
};

// Hàm này được gọi từ main.tsx qua store.subscribe() để tự động lưu mỗi khi cart thay đổi
export const saveCartToStorage = (state: CartState) => {
  try {
    localStorage.setItem('cart', JSON.stringify(state));
  } catch {
    // Bỏ qua lỗi quota exceeded
  }
};

const initialState: CartState = loadCartFromStorage();

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    // quantity: số lượng muốn thêm vào (mặc định 1). Stock check thực hiện tại component.
    addToCart: (state, action: PayloadAction<{ product: Product; quantity?: number }>) => {
      const { product, quantity = 1 } = action.payload;
      const existingItem = state.items.find(item => item.id === product.id);
      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        state.items.push({ ...product, quantity });
      }
    },
    removeFromCart: (state, action: PayloadAction<number>) => {
      state.items = state.items.filter(item => item.id !== action.payload);
    },
    updateQuantity: (state, action: PayloadAction<{ id: number; quantity: number }>) => {
      const item = state.items.find(item => item.id === action.payload.id);
      if (item && action.payload.quantity > 0) {
        item.quantity = action.payload.quantity;
      }
    },
    clearCart: (state) => {
      state.items = [];
    }
  },
});

export const { addToCart, removeFromCart, updateQuantity, clearCart } = cartSlice.actions;
export default cartSlice.reducer;