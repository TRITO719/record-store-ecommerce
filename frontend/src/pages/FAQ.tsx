import React from 'react';

const FAQ: React.FC = () => {
  return (
    <div className="flex-grow text-primary bg-primary">
      <section className="pt-20 pb-16 px-6 text-center border-b border-token">
        <span className="text-[10px] font-bold tracking-[0.4em] uppercase text-muted mb-4 block">Thông tin thường gặp</span>
        <h1 className="text-5xl md:text-7xl font-bold uppercase tracking-[0.1em] font-display text-primary">Câu hỏi thường gặp</h1>
      </section>

      <div className="max-w-[900px] mx-auto py-16 px-6 space-y-8">
        <div className="bg-card border border-token rounded-3xl p-10 shadow-sm">
          <h2 className="text-xl font-bold uppercase tracking-[0.2em] mb-4 text-primary">1. Làm sao để theo dõi đơn hàng?</h2>
          <p className="text-sm text-secondary leading-relaxed">
            Sau khi đặt hàng, bạn sẽ nhận được email xác nhận và thông tin theo dõi từ đối tác vận chuyển. Nếu bạn cần hỗ trợ thêm, vui lòng liên hệ với bộ phận chăm sóc khách hàng.
          </p>
        </div>

        <div className="bg-card border border-token rounded-3xl p-10 shadow-sm">
          <h2 className="text-xl font-bold uppercase tracking-[0.2em] mb-4 text-primary">2. Tôi có thể huỷ đơn hàng không?</h2>
          <p className="text-sm text-secondary leading-relaxed">
            Bạn có thể huỷ đơn hàng trước khi sản phẩm được đóng gói và chuyển đi. Vui lòng liên hệ ngay để chúng tôi kiểm tra trạng thái đơn hàng giúp bạn.
          </p>
        </div>

        <div className="bg-card border border-token rounded-3xl p-10 shadow-sm">
          <h2 className="text-xl font-bold uppercase tracking-[0.2em] mb-4 text-primary">3. Sản phẩm có được bảo hành không?</h2>
          <p className="text-sm text-secondary leading-relaxed">
            Sản phẩm merch cơ bản không áp dụng bảo hành. Vinyl và CD vẫn có thể được đổi trả nếu lỗi sản phẩm hoặc giao không đúng như mô tả.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FAQ;
