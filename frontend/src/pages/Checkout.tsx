import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { RootState } from '../store';
import { clearCart } from '../store/cartSlice';
import { fetchProducts } from '../store/productSlice';
import api from '../services/api';
import toast from 'react-hot-toast';

interface FormData {
  fullName: string;
  email: string;
  address: string;
  city: string;
  phone: string;
  payment: string;
}

interface FormErrors {
  fullName?: string;
  email?: string;
  address?: string;
  city?: string;
  phone?: string;
}

const Checkout: React.FC = () => {
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const totalPrice = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);

  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    address: '',
    city: '',
    phone: '',
    payment: 'card',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = (): FormErrors => {
    const newErrors: FormErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Vui lòng nhập họ và tên.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Vui lòng nhập email.';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ.';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Vui lòng nhập địa chỉ.';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'Vui lòng nhập thành phố.';
    }

    const phoneRegex = /^(0|\+84)[0-9]{9,10}$/;
    if (!formData.phone.trim()) {
      newErrors.phone = 'Vui lòng nhập số điện thoại.';
    } else if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Số điện thoại không hợp lệ (VD: 0901234567).';
    }

    return newErrors;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Xoá lỗi của field đang sửa
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        customerEmail: formData.email,
        customerPhone: formData.phone,
        shippingAddr: `${formData.address}, ${formData.city}`,
        items: cartItems.map(item => ({ id: item.id, quantity: item.quantity }))
      };

      await api.post('/orders/checkout', payload);
      
      dispatch(clearCart());
      dispatch(fetchProducts());
      toast.success('Đặt hàng thành công!', {
        style: {
          borderRadius: '0px',
          background: '#000',
          color: '#fff',
          fontSize: '10px',
          letterSpacing: '0.1em',
          textTransform: 'uppercase'
        }
      });
      navigate('/order-success');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi đặt hàng');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = (field: keyof FormErrors) =>
    `border p-3 w-full font-sans text-sm focus:outline-none transition-colors ${
      errors[field] ? 'border-red-500 bg-red-50' : 'border-rs-border focus:border-black'
    }`;

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-12 md:py-20 w-full">
      <h1 className="text-3xl font-display uppercase font-bold text-rs-black mb-10 tracking-widest">
        Thanh toán
      </h1>

      <div className="flex flex-col lg:flex-row gap-16">
        {/* Form */}
        <div className="w-full lg:w-2/3">
          <form onSubmit={handleSubmit} noValidate className="space-y-8">
            {/* Thông tin giao hàng */}
            <section>
              <h2 className="text-lg font-bold uppercase font-display mb-6 pb-2 border-b border-rs-border tracking-wider">
                Thông tin giao hàng
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Họ và tên */}
                <div className="md:col-span-2">
                  <input
                    type="text"
                    name="fullName"
                    placeholder="Họ và tên *"
                    value={formData.fullName}
                    onChange={handleChange}
                    className={inputClass('fullName')}
                  />
                  {errors.fullName && (
                    <p className="text-red-500 text-[10px] mt-1 uppercase tracking-wider">{errors.fullName}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <input
                    type="email"
                    name="email"
                    placeholder="Email *"
                    value={formData.email}
                    onChange={handleChange}
                    className={inputClass('email')}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-[10px] mt-1 uppercase tracking-wider">{errors.email}</p>
                  )}
                </div>

                {/* Số điện thoại */}
                <div>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="Số điện thoại * (VD: 0901234567)"
                    value={formData.phone}
                    onChange={handleChange}
                    className={inputClass('phone')}
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-[10px] mt-1 uppercase tracking-wider">{errors.phone}</p>
                  )}
                </div>

                {/* Địa chỉ */}
                <div className="md:col-span-2">
                  <input
                    type="text"
                    name="address"
                    placeholder="Địa chỉ *"
                    value={formData.address}
                    onChange={handleChange}
                    className={inputClass('address')}
                  />
                  {errors.address && (
                    <p className="text-red-500 text-[10px] mt-1 uppercase tracking-wider">{errors.address}</p>
                  )}
                </div>

                {/* Thành phố */}
                <div>
                  <input
                    type="text"
                    name="city"
                    placeholder="Thành phố *"
                    value={formData.city}
                    onChange={handleChange}
                    className={inputClass('city')}
                  />
                  {errors.city && (
                    <p className="text-red-500 text-[10px] mt-1 uppercase tracking-wider">{errors.city}</p>
                  )}
                </div>
              </div>
            </section>

            {/* Phương thức thanh toán */}
            <section>
              <h2 className="text-lg font-bold uppercase font-display mb-6 pb-2 border-b border-rs-border tracking-wider">
                Phương thức thanh toán
              </h2>
              <div className="space-y-3">
                <label className="flex items-center gap-3 border border-rs-border p-4 cursor-pointer hover:bg-rs-gray-light transition-colors">
                  <input
                    type="radio"
                    name="payment"
                    value="card"
                    checked={formData.payment === 'card'}
                    onChange={handleChange}
                    className="accent-black"
                  />
                  <span className="text-sm font-sans">Thẻ tín dụng / Ghi nợ</span>
                </label>
                <label className="flex items-center gap-3 border border-rs-border p-4 cursor-pointer hover:bg-rs-gray-light transition-colors">
                  <input
                    type="radio"
                    name="payment"
                    value="bank"
                    checked={formData.payment === 'bank'}
                    onChange={handleChange}
                    className="accent-black"
                  />
                  <span className="text-sm font-sans">Chuyển khoản ngân hàng</span>
                </label>
                <label className="flex items-center gap-3 border border-rs-border p-4 cursor-pointer hover:bg-rs-gray-light transition-colors">
                  <input
                    type="radio"
                    name="payment"
                    value="cod"
                    checked={formData.payment === 'cod'}
                    onChange={handleChange}
                    className="accent-black"
                  />
                  <span className="text-sm font-sans">Thanh toán khi nhận hàng (COD)</span>
                </label>
              </div>
            </section>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-rs-black text-white py-4 uppercase tracking-widest text-sm font-bold hover:bg-zinc-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Đang xử lý...' : 'Xác nhận đặt hàng'}
            </button>
          </form>
        </div>

        {/* Order Summary */}
        <div className="w-full lg:w-1/3 bg-rs-gray-light p-8 h-fit border border-rs-border">
          <h2 className="text-lg font-bold uppercase font-display mb-6 tracking-wider">
            Tóm tắt đơn hàng
          </h2>
          <div className="space-y-4 mb-6">
            {cartItems.map((item) => (
              <div key={item.id} className="flex gap-3 items-center">
                <img
                  src={item.imgUrl}
                  alt={item.title}
                  className="w-12 h-12 object-cover bg-white flex-shrink-0"
                />
                <div className="flex-grow min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-wider truncate">{item.title}</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest">x{item.quantity}</p>
                </div>
                <span className="font-semibold text-sm font-sans whitespace-nowrap">
                  ${(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-200 pt-4 space-y-2 mb-4">
            <div className="flex justify-between text-sm font-sans text-gray-500">
              <span>Tạm tính</span>
              <span>${totalPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-sans text-gray-500">
              <span>Giao hàng</span>
              <span className="text-rs-black font-bold text-xs uppercase tracking-wider">Miễn phí</span>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-4 flex justify-between font-bold text-lg font-sans">
            <span>Tổng cộng</span>
            <span>${totalPrice.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;