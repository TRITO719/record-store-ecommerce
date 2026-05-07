import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';

const OrderSuccess: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  // Lấy orderId thật từ Checkout qua navigate state
  const orderId: string | undefined = (location.state as any)?.orderId;
  const orderCode = orderId ? `#${orderId.split('-')[0].toUpperCase()}` : '—';

  return (
    <div className="flex-grow flex items-center justify-center px-6 py-20">
      <div
        className={`w-full max-w-[520px] text-center transition-all duration-700 ease-out ${
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        }`}
      >
        {/* Icon */}
        <div className="flex justify-center mb-8">
          <div
            className={`transition-all duration-500 delay-200 ${
              visible ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
            }`}
          >
            <CheckCircle size={64} strokeWidth={1} className="text-black" />
          </div>
        </div>

        {/* Title */}
        <div
          className={`transition-all duration-500 delay-300 ${
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <span className="text-[10px] font-bold tracking-[0.4em] uppercase text-gray-400 mb-4 block">
            Đặt hàng thành công
          </span>
          <h1 className="text-4xl md:text-5xl font-bold uppercase tracking-wide font-display mb-4">
            Cảm ơn bạn!
          </h1>
          <p className="text-sm text-gray-500 font-sans leading-relaxed mb-2">
            Đơn hàng của bạn đã được tiếp nhận và đang được xử lý.
          </p>
          <p className="text-sm text-gray-500 font-sans">
            Chúng tôi sẽ gửi email xác nhận sớm nhất có thể.
          </p>
        </div>

        {/* Order Code */}
        <div
          className={`my-10 py-6 px-8 bg-rs-gray-light border border-rs-border transition-all duration-500 delay-[400ms] ${
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400 mb-2">Mã đơn hàng</p>
          <p className="text-2xl font-bold font-display tracking-widest">{orderCode}</p>
        </div>

        {/* Info boxes */}
        <div
          className={`grid grid-cols-2 gap-4 mb-10 text-left transition-all duration-500 delay-500 ${
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <div className="border border-rs-border p-5">
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 mb-2">Giao hàng</p>
            <p className="text-xs font-sans text-gray-600 leading-relaxed">
              Dự kiến 3–5 ngày làm việc
            </p>
          </div>
          <div className="border border-rs-border p-5">
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 mb-2">Hỗ trợ</p>
            <p className="text-xs font-sans text-gray-600 leading-relaxed">
              support@recordstore.vn
            </p>
          </div>
        </div>

        {/* Actions */}
        <div
          className={`flex flex-col sm:flex-row gap-3 justify-center transition-all duration-500 delay-[600ms] ${
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <Link
            to="/"
            className="bg-rs-black text-white px-10 py-4 uppercase tracking-widest text-[10px] font-bold hover:bg-zinc-800 transition-colors font-sans"
          >
            Về trang chủ
          </Link>
          <Link
            to="/vinyl"
            className="border border-rs-black text-rs-black px-10 py-4 uppercase tracking-widest text-[10px] font-bold hover:bg-rs-black hover:text-white transition-all duration-300 font-sans"
          >
            Tiếp tục mua sắm
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;