import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Vinyl from './pages/Vinyl';
import Checkout from './pages/Checkout';
import User from './pages/User';
import Merch from './pages/Merch';
import CD from './pages/CD';
import Contact from './pages/Contact';
import ShippingReturns from './pages/ShippingReturns';
import FAQ from './pages/FAQ';
import OrderSuccess from './pages/OrderSuccess';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminOrders from './pages/admin/AdminOrders';
import AdminUsers from './pages/admin/AdminUsers';
import ScrollToTop from './components/ScrollToTop';
import { Toaster } from 'react-hot-toast';

import { useDispatch } from 'react-redux';
import { fetchProducts } from './store/productSlice';
import type { AppDispatch } from './store';

const App: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();

  React.useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  return (
    <Router>
      <ScrollToTop />
      <Toaster position="bottom-right" toastOptions={{ duration: 2000 }} />
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="vinyl" element={<Vinyl />} />
          <Route path="cd" element={<CD />} />
          <Route path="merch" element={<Merch />} />
          <Route path="product/:id" element={<ProductDetail />} />
          <Route path="cart" element={<Cart />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="contact" element={<Contact />} />
          <Route path="shipping-returns" element={<ShippingReturns />} />
          <Route path="faq" element={<FAQ />} />
          <Route path="order-success" element={<OrderSuccess />} />
          <Route path="account" element={<User />} />
        </Route>

        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="users" element={<AdminUsers />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;