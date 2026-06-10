import React from 'react';

const ShippingReturns: React.FC = () => {
  return (
    <div className="flex-grow text-primary bg-primary">
      <section className="pt-20 pb-16 px-6 text-center border-b border-token">
        <span className="text-[10px] font-bold tracking-[0.4em] uppercase text-muted mb-4 block">Chính sách cửa hàng</span>
        <h1 className="text-5xl md:text-7xl font-bold uppercase tracking-[0.1em] font-display text-primary">Vận chuyển & Đổi trả</h1>
      </section>

      <div className="max-w-[900px] mx-auto py-16 px-6 space-y-12">
        <div className="bg-card border border-token rounded-3xl p-10 shadow-sm text-primary">
          <h2 className="text-2xl font-bold uppercase tracking-[0.2em] mb-6 text-primary">Vận chuyển</h2>
          <p className="text-sm text-secondary leading-relaxed mb-4">
            Chúng tôi giao hàng toàn quốc bằng đối tác vận chuyển uy tín. Thời gian giao hàng thông thường từ 2 - 5 ngày làm việc tùy khu vực.
          </p>
          <ul className="list-disc pl-5 space-y-3 text-sm text-secondary">
            <li>Miễn phí giao hàng cho đơn hàng từ 1.000.000đ.</li>
            <li>Phí vận chuyển cho đơn hàng dưới 1.000.000đ được tính tự động khi thanh toán.</li>
            <li>Theo dõi đơn hàng sẽ được gửi qua email hoặc SMS.</li>
          </ul>
        </div>

        <div className="bg-card border border-token rounded-3xl p-10 shadow-sm text-primary">
          <h2 className="text-2xl font-bold uppercase tracking-[0.2em] mb-6 text-primary">Đổi trả</h2>
          <p className="text-sm text-secondary leading-relaxed mb-4">
            Nếu sản phẩm bị lỗi hoặc không đúng mô tả, bạn có thể yêu cầu đổi trả trong vòng 7 ngày kể từ ngày nhận hàng.
          </p>
          <ul className="list-disc pl-5 space-y-3 text-sm text-secondary">
            <li>Giữ nguyên tình trạng sản phẩm và bao bì gốc.</li>
            <li>Liên hệ với bộ phận chăm sóc khách hàng trước khi gửi trả.</li>
            <li>Chi phí đổi trả do cửa hàng chịu nếu lỗi do nhà sản xuất.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ShippingReturns;
