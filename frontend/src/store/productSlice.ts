import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import api from '../services/api';
import type { Product } from '../types';

interface ProductStock {
  [key: number]: number;
}

interface ProductState {
  items: Product[];
  stock: ProductStock;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
}

export const fetchProducts = createAsyncThunk('products/fetchProducts', async () => {
  const response = await api.get('/products');
  return response as unknown as Product[];
});

const initialState: ProductState = {
  items: [],
  stock: {},
  status: 'idle',
};

const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
        action.payload.forEach((product) => {
          state.stock[product.id] = product.stock;
        });
      })
      .addCase(fetchProducts.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchProducts.rejected, (state) => {
        state.status = 'failed';
      });
  },
});

export default productSlice.reducer;
