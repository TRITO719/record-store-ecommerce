import React, { useState, useRef, useEffect } from 'react';

// ============================================================
// TYPES
// ============================================================
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Product {
  id: number;
  title: string;
  artist: string;
  price: number;
  imgUrl: string;
  category: string;
  stock: number;
  description?: string;
}

// ============================================================
// CHATBOT LOGIC (rule-based + AI-enhanced)
// Tích hợp với dữ liệu thực từ API backend
// ============================================================

const API_BASE = 'http://localhost:3000'; // đổi theo PORT backend

async function fetchProducts(): Promise<Product[]> {
  try {
    const res = await fetch(`${API_BASE}/api/products`);
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

// Gọi Anthropic API (qua proxy - tích hợp vào backend)
// Hoặc dùng rule-based nếu không có API key
async function getAIResponse(
  messages: { role: string; content: string }[],
  products: Product[]
): Promise<string> {
  const systemPrompt = `Bạn là trợ lý bán hàng thân thiện của Classic Records - một cửa hàng âm nhạc chuyên bán Vinyl, CD và Merch.

Thông tin sản phẩm hiện có:
${products
  .map(
    (p) =>
      `- [${p.category.toUpperCase()}] ${p.title} - ${p.artist} | Giá: ${p.price.toLocaleString('vi-VN')}đ | Tồn kho: ${p.stock}`
  )
  .join('\n')}

Nhiệm vụ của bạn:
- Tư vấn sản phẩm phù hợp với nhu cầu khách hàng
- Trả lời câu hỏi về đơn hàng, giao hàng, đổi trả
- Giới thiệu sản phẩm nổi bật
- Hướng dẫn đặt hàng

Chính sách:
- Giao hàng toàn quốc 3-7 ngày làm việc
- Đổi trả trong 7 ngày nếu lỗi sản phẩm
- Thanh toán: COD, chuyển khoản
- Hotline: 1800-CLASSIC (hỗ trợ 9h-21h)

Trả lời ngắn gọn, thân thiện bằng tiếng Việt. Nếu không biết, hướng dẫn khách liên hệ hotline.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: systemPrompt,
        messages: messages.map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
      }),
    });

    if (!response.ok) throw new Error('API error');
    const data = await response.json();
    return data.content?.[0]?.text || 'Xin lỗi, tôi không hiểu câu hỏi của bạn. Vui lòng thử lại.';
  } catch {
    // Fallback rule-based
    return getRuleBasedResponse(messages[messages.length - 1]?.content || '', products);
  }
}

function getRuleBasedResponse(input: string, products: Product[]): string {
  const q = input.toLowerCase();

  if (q.includes('vinyl') || q.includes('đĩa than')) {
    const vinyls = products.filter((p) => p.category === 'vinyl');
    if (vinyls.length === 0) return 'Hiện tại chúng tôi chưa có sản phẩm Vinyl. Vui lòng quay lại sau!';
    const list = vinyls
      .slice(0, 3)
      .map((p) => `• ${p.title} - ${p.artist}: ${p.price.toLocaleString('vi-VN')}đ`)
      .join('\n');
    return `🎵 Chúng tôi có ${vinyls.length} sản phẩm Vinyl:\n${list}\n\nXem toàn bộ tại trang /vinyl`;
  }

  if (q.includes('cd')) {
    const cds = products.filter((p) => p.category === 'cd');
    if (cds.length === 0) return 'Hiện tại chúng tôi chưa có sản phẩm CD. Vui lòng quay lại sau!';
    const list = cds
      .slice(0, 3)
      .map((p) => `• ${p.title} - ${p.artist}: ${p.price.toLocaleString('vi-VN')}đ`)
      .join('\n');
    return `💿 Chúng tôi có ${cds.length} sản phẩm CD:\n${list}\n\nXem toàn bộ tại trang /cd`;
  }

  if (q.includes('merch') || q.includes('áo') || q.includes('phụ kiện')) {
    const merch = products.filter((p) => p.category === 'merch');
    if (merch.length === 0) return 'Hiện tại chúng tôi chưa có Merch. Vui lòng quay lại sau!';
    const list = merch
      .slice(0, 3)
      .map((p) => `• ${p.title}: ${p.price.toLocaleString('vi-VN')}đ`)
      .join('\n');
    return `👕 Merch của chúng tôi:\n${list}\n\nXem toàn bộ tại trang /merch`;
  }

  if (q.includes('giao hàng') || q.includes('ship') || q.includes('vận chuyển')) {
    return '🚚 Chính sách giao hàng:\n• Toàn quốc: 3-7 ngày làm việc\n• TP.HCM & Hà Nội: 1-2 ngày\n• Phí ship: tính theo địa chỉ giao hàng\n• Hỗ trợ COD và chuyển khoản';
  }

  if (q.includes('đổi trả') || q.includes('hoàn tiền') || q.includes('bảo hành')) {
    return '🔄 Chính sách đổi trả:\n• Đổi trả trong 7 ngày nếu lỗi sản phẩm\n• Vinyl & CD: đổi nếu giao không đúng mô tả\n• Merch: không áp dụng bảo hành cơ bản\n• Liên hệ hotline 1800-CLASSIC để được hỗ trợ';
  }

  if (q.includes('thanh toán') || q.includes('payment') || q.includes('trả tiền')) {
    return '💳 Phương thức thanh toán:\n• COD (trả tiền khi nhận hàng)\n• Chuyển khoản ngân hàng\n• Momo, ZaloPay (sắp ra mắt)';
  }

  if (q.includes('đơn hàng') || q.includes('order') || q.includes('theo dõi')) {
    return '📦 Theo dõi đơn hàng:\n• Đăng nhập vào tài khoản → mục "Đơn hàng của tôi"\n• Hoặc kiểm tra email xác nhận\n• Hỗ trợ: 1800-CLASSIC (9h-21h hàng ngày)';
  }

  if (q.includes('giá') || q.includes('price') || q.includes('bao nhiêu') || q.includes('rẻ') || q.includes('đắt')) {
    const cheapest = [...products].sort((a, b) => a.price - b.price)[0];
    const expensive = [...products].sort((a, b) => b.price - a.price)[0];
    if (!cheapest) return 'Vui lòng xem giá sản phẩm trực tiếp trên website!';
    return `💰 Giá sản phẩm của chúng tôi:\n• Rẻ nhất: ${cheapest.title} - ${cheapest.price.toLocaleString('vi-VN')}đ\n• Cao nhất: ${expensive.title} - ${expensive.price.toLocaleString('vi-VN')}đ\n\nXem toàn bộ sản phẩm để tìm lựa chọn phù hợp!`;
  }

  if (q.includes('liên hệ') || q.includes('contact') || q.includes('hotline') || q.includes('hỗ trợ')) {
    return '📞 Liên hệ Classic Records:\n• Hotline: 1800-CLASSIC\n• Giờ hỗ trợ: 9h-21h hàng ngày\n• Email: support@classicrecords.vn\n• Hoặc để lại tin nhắn tại trang /contact';
  }

  if (q.includes('xin chào') || q.includes('hello') || q.includes('hi') || q.includes('chào')) {
    return '👋 Xin chào! Tôi là trợ lý ảo của Classic Records.\n\nTôi có thể giúp bạn:\n• Tìm kiếm sản phẩm Vinyl, CD, Merch\n• Tư vấn lựa chọn sản phẩm\n• Giải đáp thắc mắc về đơn hàng\n\nBạn cần tôi hỗ trợ điều gì?';
  }

  if (q.includes('cảm ơn') || q.includes('thanks') || q.includes('thank you')) {
    return '😊 Không có gì! Rất vui được phục vụ bạn. Chúc bạn mua sắm vui vẻ tại Classic Records! 🎵';
  }

  // Default
  const totalProducts = products.length;
  return `Tôi có thể giúp bạn tìm hiểu về:\n• 🎵 Sản phẩm Vinyl, CD, Merch (${totalProducts} sản phẩm)\n• 🚚 Chính sách giao hàng & đổi trả\n• 📦 Theo dõi đơn hàng\n• 📞 Liên hệ hỗ trợ\n\nBạn muốn biết điều gì?`;
}

// ============================================================
// QUICK REPLY SUGGESTIONS
// ============================================================
const QUICK_REPLIES = [
  { label: '🎵 Xem Vinyl', text: 'Tôi muốn xem sản phẩm Vinyl' },
  { label: '💿 Xem CD', text: 'Cho tôi xem các đĩa CD' },
  { label: '👕 Xem Merch', text: 'Có những Merch gì?' },
  { label: '🚚 Giao hàng', text: 'Chính sách giao hàng như thế nào?' },
  { label: '🔄 Đổi trả', text: 'Chính sách đổi trả ra sao?' },
  { label: '📦 Đơn hàng', text: 'Tôi muốn theo dõi đơn hàng' },
];

// ============================================================
// CHATBOT COMPONENT
// ============================================================
const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: '👋 Xin chào! Tôi là trợ lý ảo của **Classic Records**.\n\nTôi có thể giúp bạn tìm sản phẩm, tư vấn mua hàng và giải đáp thắc mắc. Bạn cần gì không?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProducts().then(setProducts);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const history = [...messages, userMessage].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await getAIResponse(history, products);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      if (!isOpen) setUnreadCount((c) => c + 1);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Xin lỗi, có lỗi xảy ra. Vui lòng thử lại hoặc liên hệ hotline 1800-CLASSIC.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const formatContent = (text: string) => {
    // Simple markdown-like formatting
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <>
      {/* CHAT WINDOW */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '88px',
            right: '24px',
            width: '380px',
            height: isMinimized ? '60px' : '560px',
            background: '#fff',
            borderRadius: '20px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.18), 0 4px 20px rgba(0,0,0,0.08)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            zIndex: 9999,
            fontFamily: "'Syne', 'DM Sans', system-ui, sans-serif",
            transition: 'height 0.3s cubic-bezier(0.4,0,0.2,1)',
            border: '1px solid rgba(0,0,0,0.08)',
          }}
        >
          {/* HEADER */}
          <div
            style={{
              background: '#0a0a0a',
              color: '#fff',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              flexShrink: 0,
              cursor: 'pointer',
            }}
            onClick={() => setIsMinimized(!isMinimized)}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #333 0%, #000 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                flexShrink: 0,
                border: '1.5px solid rgba(255,255,255,0.15)',
              }}
            >
              🎵
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '14px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Classic Records
              </div>
              <div style={{ fontSize: '11px', color: '#aaa', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
                Trực tuyến · Phản hồi ngay
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  color: '#fff',
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                }}
                title={isMinimized ? 'Mở rộng' : 'Thu nhỏ'}
              >
                {isMinimized ? '▲' : '▼'}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  color: '#fff',
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                }}
                title="Đóng"
              >
                ×
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* MESSAGES */}
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  background: '#fafafa',
                }}
              >
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    style={{
                      display: 'flex',
                      flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                      alignItems: 'flex-end',
                      gap: '8px',
                    }}
                  >
                    {msg.role === 'assistant' && (
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          background: '#0a0a0a',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          flexShrink: 0,
                        }}
                      >
                        🎵
                      </div>
                    )}
                    <div
                      style={{
                        maxWidth: '75%',
                        padding: '10px 14px',
                        borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                        background: msg.role === 'user' ? '#0a0a0a' : '#fff',
                        color: msg.role === 'user' ? '#fff' : '#1a1a1a',
                        fontSize: '13px',
                        lineHeight: '1.6',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                        border: msg.role === 'assistant' ? '1px solid rgba(0,0,0,0.06)' : 'none',
                      }}
                      dangerouslySetInnerHTML={{ __html: formatContent(msg.content) }}
                    />
                  </div>
                ))}

                {isLoading && (
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: '#0a0a0a',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                      }}
                    >
                      🎵
                    </div>
                    <div
                      style={{
                        padding: '10px 16px',
                        background: '#fff',
                        borderRadius: '18px 18px 18px 4px',
                        border: '1px solid rgba(0,0,0,0.06)',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                        display: 'flex',
                        gap: '4px',
                        alignItems: 'center',
                      }}
                    >
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: '#999',
                            animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                            display: 'inline-block',
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* QUICK REPLIES */}
              {messages.length <= 2 && (
                <div
                  style={{
                    padding: '8px 12px',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '6px',
                    borderTop: '1px solid rgba(0,0,0,0.06)',
                    background: '#fff',
                  }}
                >
                  {QUICK_REPLIES.map((qr) => (
                    <button
                      key={qr.label}
                      onClick={() => sendMessage(qr.text)}
                      style={{
                        background: '#f4f4f4',
                        border: '1px solid rgba(0,0,0,0.1)',
                        borderRadius: '20px',
                        padding: '5px 12px',
                        fontSize: '11px',
                        cursor: 'pointer',
                        color: '#333',
                        fontWeight: 500,
                        transition: 'all 0.15s',
                        whiteSpace: 'nowrap',
                      }}
                      onMouseOver={(e) => {
                        (e.target as HTMLButtonElement).style.background = '#0a0a0a';
                        (e.target as HTMLButtonElement).style.color = '#fff';
                      }}
                      onMouseOut={(e) => {
                        (e.target as HTMLButtonElement).style.background = '#f4f4f4';
                        (e.target as HTMLButtonElement).style.color = '#333';
                      }}
                    >
                      {qr.label}
                    </button>
                  ))}
                </div>
              )}

              {/* INPUT */}
              <div
                style={{
                  padding: '12px 16px',
                  borderTop: '1px solid rgba(0,0,0,0.08)',
                  background: '#fff',
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'center',
                }}
              >
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Nhập tin nhắn..."
                  disabled={isLoading}
                  style={{
                    flex: 1,
                    border: '1.5px solid rgba(0,0,0,0.1)',
                    borderRadius: '24px',
                    padding: '10px 16px',
                    fontSize: '13px',
                    outline: 'none',
                    background: '#f9f9f9',
                    fontFamily: 'inherit',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => ((e.target as HTMLInputElement).style.borderColor = '#0a0a0a')}
                  onBlur={(e) => ((e.target as HTMLInputElement).style.borderColor = 'rgba(0,0,0,0.1)')}
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={isLoading || !input.trim()}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: input.trim() && !isLoading ? '#0a0a0a' : '#e5e5e5',
                    border: 'none',
                    cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                    flexShrink: 0,
                    transition: 'background 0.2s',
                  }}
                  title="Gửi"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill={input.trim() && !isLoading ? '#fff' : '#999'}>
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* TOGGLE BUTTON */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: '#0a0a0a',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 32px rgba(0,0,0,0.25), 0 2px 8px rgba(0,0,0,0.15)',
          zIndex: 10000,
          transition: 'transform 0.2s, box-shadow 0.2s',
          fontSize: '24px',
        }}
        onMouseOver={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.1)';
          (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 12px 40px rgba(0,0,0,0.3)';
        }}
        onMouseOut={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
          (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 32px rgba(0,0,0,0.25), 0 2px 8px rgba(0,0,0,0.15)';
        }}
        title="Trò chuyện với Classic Records"
        aria-label="Mở chat hỗ trợ"
      >
        {isOpen ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        ) : (
          <span>💬</span>
        )}
        {unreadCount > 0 && !isOpen && (
          <span
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              background: '#ef4444',
              color: '#fff',
              borderRadius: '50%',
              width: '20px',
              height: '20px',
              fontSize: '11px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid #fff',
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {/* BOUNCE ANIMATION */}
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </>
  );
};

export default ChatBot;
