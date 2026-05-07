import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import { removeFromCart, updateQuantity } from '../store/cartSlice';
import { Trash2, Plus, Minus, ArrowRight } from 'lucide-react';

const Cart: React.FC = () => {
  const cartItems = useSelector((state: RootState) => state.cart.items);
  // Lấy stock hiện tại từ Redux (được cập nhật mỗi khi fetchProducts chạy)
  // thay vì dùng item.stock (snapshot lúc add vào cart, có thể đã lỗi thời)
  const productStock = useSelector((state: RootState) => state.products.stock);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const totalPrice = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);

  if (cartItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-grow min-h-[60vh] px-6 text-center">
        <h1 className="text-3xl md:text-5xl font-display uppercase font-bold text-rs-black mb-6 tracking-wide">
          Giỏ hàng của bạn
        </h1>
        <p className="text-gray-500 mb-10 font-sans">Hiện chưa có sản phẩm nào trong giỏ hàng.</p>
        <Link
          to="/vinyl"
          className="bg-rs-black text-white px-10 py-4 uppercase tracking-widest text-xs font-bold hover:bg-gray-800 transition-colors font-sans"
        >
          Tiếp tục mua sắm
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-12 md:py-20 w-full flex-grow">
      <h1 className="text-3xl md:text-4xl font-display uppercase font-bold text-rs-black mb-10 pb-4 border-b border-rs-border tracking-wide">
        Giỏ hàng ({cartItems.reduce((acc, item) => acc + item.quantity, 0)})
      </h1>

      <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
        {/* Cart Items */}
        <div className="w-full lg:w-2/3">
          {cartItems.map((item) => (
            <div key={item.id} className="flex gap-6 py-6 border-b border-rs-border group">
              <Link to={`/product/${item.id}`} className="w-24 md:w-32 aspect-square bg-rs-gray-light flex-shrink-0">
                <img src={item.imgUrl} alt={item.title} className="w-full h-full object-cover mix-blend-multiply" />
              </Link>

              <div className="flex flex-col justify-between flex-grow">
                <div>
                  <div className="flex justify-between items-start gap-4">
                    <Link to={`/product/${item.id}`}>
                      <h3 className="font-bold text-lg md:text-xl uppercase font-display text-rs-black hover:opacity-70 transition-opacity leading-tight">
                        {item.title}
                      </h3>
                    </Link>
                    <p className="font-bold font-sans text-rs-black text-lg whitespace-nowrap">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                  <p className="text-sm text-gray-500 font-sans mt-1">{item.artist}</p>
                  <p className="text-xs text-gray-400 font-sans mt-2 uppercase tracking-wider">
                    Format: {item.category || 'vinyl'}
                  </p>
                </div>

                <div className="flex justify-between items-end mt-4">
                  <div className="flex items-center border border-rs-border">
                    <button
                      onClick={() => dispatch(updateQuantity({ id: item.id, quantity: item.quantity - 1 }))}
                      className="p-2 hover:bg-gray-100 transition-colors disabled:opacity-30"
                      disabled={item.quantity <= 1}
                    >
                      <Minus size={14} />
                    </button>
                    <span className="px-4 text-sm font-semibold font-sans">{item.quantity}</span>
                    <button
                      onClick={() => dispatch(updateQuantity({ id: item.id, quantity: item.quantity + 1 }))}
                      className="p-2 hover:bg-gray-100 transition-colors disabled:opacity-30"
                      disabled={item.quantity >= (productStock[item.id] ?? item.stock)}
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  <button
                    onClick={() => dispatch(removeFromCart(item.id))}
                    className="text-gray-400 hover:text-rs-black transition-colors flex items-center gap-1.5 text-xs font-sans uppercase tracking-widest"
                  >
                    <Trash2 size={16} strokeWidth={1.5} /> Xóa
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="w-full lg:w-1/3">
          <div className="bg-rs-gray-light p-8 sticky top-28">
            <h2 className="text-xl font-bold uppercase font-display text-rs-black mb-6 pb-4 border-b border-gray-200 tracking-wide">
              Tổng đơn hàng
            </h2>

            <div className="flex justify-between text-gray-600 font-sans mb-4 text-sm">
              <span>Tạm tính</span>
              <span>${totalPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600 font-sans mb-6 pb-6 border-b border-gray-200 text-sm">
              <span>Giao hàng</span>
              <span className="uppercase text-xs tracking-wider font-semibold text-rs-black">Miễn phí</span>
            </div>

            <div className="flex justify-between font-bold text-xl font-sans text-rs-black mb-8">
              <span>Tổng cộng</span>
              <span>${totalPrice.toFixed(2)}</span>
            </div>

            {/* ✅ FIX: Navigate to /checkout */}
            <button
              onClick={() => navigate('/checkout')}
              className="w-full bg-rs-black text-white py-4 uppercase tracking-widest text-xs font-bold hover:bg-zinc-800 transition-colors font-sans flex items-center justify-center gap-2"
            >
              Thanh toán an toàn <ArrowRight size={14} />
            </button>

            <Link
              to="/vinyl"
              className="block text-center mt-4 text-[10px] uppercase tracking-widest font-bold text-gray-400 hover:text-black transition-colors"
            >
              Tiếp tục mua sắm
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;