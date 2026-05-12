import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import type { RootState, AppDispatch } from '../store';
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
  const userProfile = useSelector((state: RootState) => state.user.profile);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();

  // ── Determine which items are being checked out ──────────────────────────
  // Cart page passes selectedIds via navigate state. If missing, default to all.
  const passedSelectedIds: number[] | undefined = (location.state as any)?.selectedIds;

  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => {
    if (passedSelectedIds && passedSelectedIds.length > 0) {
      // Only include IDs that are actually in the cart
      const cartIdSet = new Set(cartItems.map((i) => i.id));
      const valid = passedSelectedIds.filter((id) => cartIdSet.has(id));
      return new Set(valid.length > 0 ? valid : cartItems.map((i) => i.id));
    }
    return new Set(cartItems.map((i) => i.id));
  });

  // If cart changes while on this page, remove stale IDs
  useEffect(() => {
    const cartIdSet = new Set(cartItems.map((i) => i.id));
    setSelectedIds((prev) => {
      const next = new Set<number>();
      prev.forEach((id) => {
        if (cartIdSet.has(id)) next.add(id);
      });
      return next;
    });
  }, [cartItems]);

  const selectedItems = cartItems.filter((item) => selectedIds.has(item.id));
  const totalPrice = selectedItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );

  const isAllSelected =
    cartItems.length > 0 && selectedIds.size === cartItems.length;

  const toggleAll = () => {
    setSelectedIds(
      isAllSelected ? new Set() : new Set(cartItems.map((i) => i.id)),
    );
  };

  const toggleItem = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ── Autofill form from saved user profile ────────────────────────────────
  const [formData, setFormData] = useState<FormData>(() => {
    // Try to parse city out of stored address: "Street, City"
    let street = '';
    let city = '';
    if (userProfile?.address) {
      const parts = userProfile.address.split(',');
      street = parts[0]?.trim() || '';
      city = parts.slice(1).join(',').trim() || '';
    }

    return {
      fullName: userProfile?.name || '',
      email: userProfile?.email || '',
      address: street,
      city: city,
      phone: userProfile?.phone || '',
      payment: 'cod',
    };
  });

  // Re-autofill whenever profile loads (e.g. after async auth restore)
  useEffect(() => {
    if (!userProfile) return;
    let street = '';
    let city = '';
    if (userProfile.address) {
      const parts = userProfile.address.split(',');
      street = parts[0]?.trim() || '';
      city = parts.slice(1).join(',').trim() || '';
    }
    setFormData((prev) => ({
      ...prev,
      fullName: prev.fullName || userProfile.name || '',
      email: prev.email || userProfile.email || '',
      phone: prev.phone || userProfile.phone || '',
      address: prev.address || street,
      city: prev.city || city,
    }));
  }, [userProfile]);

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = (): FormErrors => {
    const newErrors: FormErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Vui lòng nhập họ và tên.';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) newErrors.email = 'Vui lòng nhập email.';
    else if (!emailRegex.test(formData.email)) newErrors.email = 'Email không hợp lệ.';
    if (!formData.address.trim()) newErrors.address = 'Vui lòng nhập địa chỉ.';
    if (!formData.city.trim()) newErrors.city = 'Vui lòng nhập thành phố.';
    const phoneRegex = /^(0|\+84)[0-9]{9,10}$/;
    if (!formData.phone.trim()) newErrors.phone = 'Vui lòng nhập số điện thoại.';
    else if (!phoneRegex.test(formData.phone.replace(/\s/g, '')))
      newErrors.phone = 'Số điện thoại không hợp lệ (VD: 0901234567).';
    return newErrors;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    if (selectedItems.length === 0) {
      toast.error('Vui lòng chọn ít nhất một sản phẩm để thanh toán.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        customerEmail: formData.email,
        customerPhone: formData.phone,
        shippingAddr: `${formData.address}, ${formData.city}`,
        paymentMethod: formData.payment,
        // Send ONLY the selected items — deduplication handled server-side too.
        items: selectedItems.map((item) => ({ id: item.id, quantity: item.quantity })),
      };

      const result: any = await api.post('/orders/checkout', payload);

      // Clear cart and refresh product stock from DB
      dispatch(clearCart());
      dispatch(fetchProducts());

      toast.success('Đặt hàng thành công!', {
        style: {
          borderRadius: '0px',
          background: '#000',
          color: '#fff',
          fontSize: '10px',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        },
      });

      navigate('/order-success', { state: { orderId: result?.order?.id } });
    } catch (error: any) {
      const msg =
        error.response?.data?.message ||
        error.message ||
        'Có lỗi xảy ra khi đặt hàng';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = (field: keyof FormErrors) =>
    `border p-3 w-full font-sans text-sm focus:outline-none transition-colors ${
      errors[field]
        ? 'border-red-500 bg-red-50'
        : 'border-rs-border focus:border-black'
    }`;

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-12 md:py-20 w-full">
      <h1 className="text-3xl font-display uppercase font-bold text-rs-black mb-10 tracking-widest">
        Thanh toán
      </h1>

      <div className="flex flex-col lg:flex-row gap-16">
        {/* ── Form ────────────────────────────────────────────────────────── */}
        <div className="w-full lg:w-2/3">
          <form onSubmit={handleSubmit} noValidate className="space-y-8">
            {/* Shipping info */}
            <section>
              <h2 className="text-lg font-bold uppercase font-display mb-6 pb-2 border-b border-rs-border tracking-wider">
                Thông tin giao hàng
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <p className="text-red-500 text-[10px] mt-1 uppercase tracking-wider">
                      {errors.fullName}
                    </p>
                  )}
                </div>

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
                    <p className="text-red-500 text-[10px] mt-1 uppercase tracking-wider">
                      {errors.email}
                    </p>
                  )}
                </div>

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
                    <p className="text-red-500 text-[10px] mt-1 uppercase tracking-wider">
                      {errors.phone}
                    </p>
                  )}
                </div>

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
                    <p className="text-red-500 text-[10px] mt-1 uppercase tracking-wider">
                      {errors.address}
                    </p>
                  )}
                </div>

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
                    <p className="text-red-500 text-[10px] mt-1 uppercase tracking-wider">
                      {errors.city}
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* Payment method */}
            <section>
              <h2 className="text-lg font-bold uppercase font-display mb-6 pb-2 border-b border-rs-border tracking-wider">
                Phương thức thanh toán
              </h2>
              <div className="space-y-3">
                {[
                  { value: 'card', label: 'Thẻ tín dụng / Ghi nợ' },
                  { value: 'bank', label: 'Chuyển khoản ngân hàng' },
                  { value: 'cod', label: 'Thanh toán khi nhận hàng (COD)' },
                ].map(({ value, label }) => (
                  <label
                    key={value}
                    className="flex items-center gap-3 border border-rs-border p-4 cursor-pointer hover:bg-rs-gray-light transition-colors"
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={value}
                      checked={formData.payment === value}
                      onChange={handleChange}
                      className="accent-black"
                    />
                    <span className="text-sm font-sans">{label}</span>
                  </label>
                ))}
              </div>
            </section>

            <button
              type="submit"
              disabled={isSubmitting || selectedItems.length === 0}
              className="w-full bg-rs-black text-white py-4 uppercase tracking-widest text-sm font-bold hover:bg-zinc-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Đang xử lý...' : 'Xác nhận đặt hàng'}
            </button>
          </form>
        </div>

        {/* ── Order Summary ────────────────────────────────────────────────── */}
        <div className="w-full lg:w-1/3 bg-rs-gray-light p-8 h-fit border border-rs-border">
          <h2 className="text-lg font-bold uppercase font-display mb-4 tracking-wider">
            Tóm tắt đơn hàng
          </h2>

          {/* Select all */}
          <label className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200 cursor-pointer group">
            <input
              type="checkbox"
              checked={isAllSelected}
              onChange={toggleAll}
              className="w-4 h-4 accent-black cursor-pointer"
            />
            <span className="text-[10px] font-bold uppercase tracking-widest group-hover:opacity-60 transition-opacity">
              Chọn tất cả ({cartItems.length} sản phẩm)
            </span>
          </label>

          <div className="space-y-3 mb-6">
            {cartItems.map((item) => {
              const isSelected = selectedIds.has(item.id);
              return (
                <label
                  key={item.id}
                  className={`flex gap-3 items-center cursor-pointer rounded transition-opacity ${
                    isSelected ? '' : 'opacity-40'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleItem(item.id)}
                    className="w-4 h-4 accent-black cursor-pointer flex-shrink-0"
                  />
                  <img
                    src={item.imgUrl}
                    alt={item.title}
                    className="w-12 h-12 object-cover bg-white flex-shrink-0"
                  />
                  <div className="flex-grow min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-wider truncate">
                      {item.title}
                    </p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">
                      x{item.quantity}
                    </p>
                  </div>
                  <span
                    className={`font-semibold text-sm font-sans whitespace-nowrap ${
                      isSelected ? '' : 'line-through text-gray-400'
                    }`}
                  >
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                </label>
              );
            })}
          </div>

          <div className="border-t border-gray-200 pt-4 space-y-2 mb-4">
            <div className="flex justify-between text-sm font-sans text-gray-500">
              <span>Tạm tính ({selectedItems.length} sản phẩm)</span>
              <span>${totalPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-sans text-gray-500">
              <span>Giao hàng</span>
              <span className="text-rs-black font-bold text-xs uppercase tracking-wider">
                Miễn phí
              </span>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-4 flex justify-between font-bold text-lg font-sans">
            <span>Tổng cộng</span>
            <span>${totalPrice.toFixed(2)}</span>
          </div>

          {selectedItems.length === 0 && (
            <p className="text-red-500 text-xs mt-3 text-center font-semibold">
              Vui lòng chọn ít nhất 1 sản phẩm
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Checkout;