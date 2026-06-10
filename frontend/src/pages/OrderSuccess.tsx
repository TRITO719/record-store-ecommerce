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
            <CheckCircle size={64} strokeWidth={1} className="text-accent" />
          </div>
        </div>

        {/* Title */}
        <div
          className={`transition-all duration-500 delay-300 ${
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <span className="text-[10px] font-bold tracking-[0.4em] uppercase text-muted mb-4 block">
            Đặt hàng thành công
          </span>
          <h1 className="text-4xl md:text-5xl font-bold uppercase tracking-wide font-display mb-4 text-primary">
            Cảm ơn bạn!
          </h1>
          <p className="text-sm text-secondary font-sans leading-relaxed mb-2">
            Đơn hàng của bạn đã được tiếp nhận và đang được xử lý.
          </p>
          <p className="text-sm text-secondary font-sans">
            Chúng tôi sẽ gửi email xác nhận sớm nhất có thể.
          </p>
        </div>

        {/* Order Code */}
        <div
          className={`my-10 py-6 px-8 bg-card border border-token text-primary transition-all duration-500 delay-[400ms] ${
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted mb-2">Mã đơn hàng</p>
          <p className="text-2xl font-bold font-display tracking-widest text-primary">{orderCode}</p>
        </div>

        {/* Info boxes */}
        <div
          className={`grid grid-cols-2 gap-4 mb-10 text-left transition-all duration-500 delay-500 ${
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <div className="border border-token bg-card p-5 text-primary">
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted mb-2">Giao hàng</p>
            <p className="text-xs font-sans text-secondary leading-relaxed">
              Dự kiến 3–5 ngày làm việc
            </p>
          </div>
          <div className="border border-token bg-card p-5 text-primary">
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted mb-2">Hỗ trợ</p>
            <p className="text-xs font-sans text-secondary leading-relaxed">
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
            className="px-10 py-4 uppercase tracking-widest text-[10px] font-bold transition-all duration-300 font-sans text-center"
            style={{
              background: 'var(--accent)',
              color: '#000',
              boxShadow: 'var(--shadow-accent)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--accent-dim)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--accent)';
            }}
          >
            Về trang chủ
          </Link>
          <Link
            to="/vinyl"
            className="border border-token px-10 py-4 uppercase tracking-widest text-[10px] font-bold transition-all duration-300 font-sans bg-card text-primary text-center"
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent)';
              e.currentTarget.style.color = 'var(--accent)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
          >
            Tiếp tục mua sắm
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;