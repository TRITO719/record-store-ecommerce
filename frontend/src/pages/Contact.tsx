import React from 'react';

const Contact: React.FC = () => {
  return (
    <div className="flex-grow text-primary bg-primary">
      <section className="pt-20 pb-16 px-6 text-center border-b border-token">
        <span className="text-[10px] font-bold tracking-[0.4em] uppercase text-muted mb-4 block">Giúp đỡ khách hàng</span>
        <h1 className="text-5xl md:text-7xl font-bold uppercase tracking-[0.1em] font-display text-primary">Liên hệ</h1>
      </section>

      <div className="max-w-[1200px] mx-auto py-16 px-6">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="h-[420px] rounded-[32px] overflow-hidden border border-token shadow-sm">
            <iframe
              title="Bản đồ TP.HCM"
              src="https://www.openstreetmap.org/export/embed.html?bbox=106.688%2C10.788%2C106.714%2C10.816&layer=mapnik&marker=10.802%2C106.701"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
            />
          </div>

          <div className="bg-card border border-token rounded-3xl p-10 shadow-sm text-primary">
            <h2 className="text-2xl font-bold uppercase tracking-[0.2em] mb-6 text-primary">Cần hỗ trợ?</h2>
            <p className="text-sm text-secondary leading-relaxed mb-8">
              Nếu bạn có câu hỏi về đơn hàng, sản phẩm, chính sách hoặc bất kỳ vấn đề nào khác, hãy liên hệ với chúng tôi. Chúng tôi sẽ phản hồi trong vòng 24 giờ làm việc.
            </p>

            <div className="space-y-6">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-muted mb-2">Email</p>
                <p className="text-base font-semibold text-primary">support@recordstore.vn</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-muted mb-2">Điện thoại</p>
                <p className="text-base font-semibold text-primary">+84 123 456 789</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-muted mb-2">Giờ làm việc</p>
                <p className="text-base font-semibold text-primary">Thứ 2 - Thứ 7: 9:00 - 18:00</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-muted mb-2">Địa chỉ</p>
                <p className="text-base font-semibold text-primary">123 Đường Âm Nhạc, Quận 1, TP.HCM</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
