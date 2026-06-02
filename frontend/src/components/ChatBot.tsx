import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import type { Product } from '../types';
import { addToCart } from '../store/cartSlice';

// ============================================================
// TYPES
// ============================================================
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatAction {
  type: 'add_to_cart';
  product: Product;
  quantity: number;
}

interface ChatApiResponse {
  response: string;
  actions?: ChatAction[];
  role?: string;
}

// ============================================================
// CHATBOT LOGIC (DeepSeek V3.2 via Backend with Function Calling)
// ============================================================

const API_BASE = '/api'; // Sử dụng proxy hoặc đường dẫn tương đối

async function getChatResponse(
  message: string,
  history: { role: string; content: string }[],
  cartItems: any[]
): Promise<ChatApiResponse> {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        message,
        history,
        context: {
          path: typeof window !== 'undefined' ? window.location.pathname : undefined,
          cart: cartItems,
        },
      }),
    });

    if (!response.ok) throw new Error('API error');
    const data: ChatApiResponse = await response.json();
    return {
      response: data.response || 'Xin lỗi, tôi không hiểu câu hỏi của bạn. Vui lòng thử lại.',
      actions: Array.isArray(data.actions) ? data.actions : [],
      role: data.role,
    };
  } catch (error) {
    console.error('Chat Error:', error);
    return {
      response:
        'Xin lỗi, tôi gặp trục trặc khi kết nối với máy chủ. Vui lòng thử lại sau hoặc liên hệ hotline 1800-CLASSIC.',
      actions: [],
    };
  }
}

// ============================================================
// QUICK REPLY SUGGESTIONS
// ============================================================
const QUICK_REPLIES = [
  { label: '🎵 Xem Vinyl', text: 'Tôi muốn xem sản phẩm Vinyl' },
  { label: '💿 Xem CD', text: 'Cho tôi xem các đĩa CD dưới 30$' },
  { label: '👕 Xem Merch', text: 'Có những Merch gì?' },
  { label: '📦 Đơn của tôi', text: 'Cho tôi xem các đơn hàng của tôi' },
  { label: '📊 Thống kê (admin)', text: 'Cho tôi xem thống kê doanh thu' },
  { label: '🚚 Giao hàng', text: 'Chính sách giao hàng như thế nào?' },
];

// ============================================================
// CHATBOT COMPONENT
// ============================================================
const MAX_HISTORY_ITEMS = 12;
const IDLE_CLEAR_MS = 30 * 60 * 1000; // 30 phút
const MESSAGES_STORAGE_KEY = 'classic_records_chat_messages';
const LAST_ACTIVITY_KEY = 'classic_records_chat_last_activity';

const INITIAL_GREETING: Message = {
  id: '0',
  role: 'assistant',
  content:
    '👋 Xin chào! Tôi là trợ lý ảo của **Classic Records**, chạy bằng DeepSeek V3.2.\n\nTôi có thể giúp bạn:\n• Tìm sản phẩm (Vinyl/CD/Merch, theo nghệ sĩ, giá…)\n• Thêm sản phẩm vào giỏ hàng (sẽ hỏi xác nhận trước)\n• Xem đơn hàng của bạn (cần đăng nhập)\n• Quản lý đơn (sửa trạng thái, xóa) — admin\n\nBạn cần gì?',
  timestamp: new Date(),
};

const getRecentHistory = (messages: Message[]) =>
  messages.slice(-MAX_HISTORY_ITEMS).map((m) => ({ role: m.role, content: m.content }));

const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([INITIAL_GREETING]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const dispatch = useDispatch();
  const idleTimerRef = useRef<number | null>(null);

  const resetHistory = useCallback(() => {
    setMessages([{ ...INITIAL_GREETING, timestamp: new Date() }]);
    try {
      localStorage.removeItem(MESSAGES_STORAGE_KEY);
      localStorage.removeItem(LAST_ACTIVITY_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const armIdleTimer = useCallback(() => {
    if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
    idleTimerRef.current = window.setTimeout(resetHistory, IDLE_CLEAR_MS);
  }, [resetHistory]);

  // Khôi phục history từ localStorage; nếu quá 30p không hoạt động thì reset
  useEffect(() => {
    try {
      const lastTs = Number(localStorage.getItem(LAST_ACTIVITY_KEY) || 0);
      if (lastTs && Date.now() - lastTs > IDLE_CLEAR_MS) {
        resetHistory();
        return;
      }
      const saved = localStorage.getItem(MESSAGES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(
            parsed.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp),
            }))
          );
        }
      }
    } catch (error) {
      console.warn('Không thể load lịch sử chat:', error);
    }
    armIdleTimer();
    return () => {
      if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
    };
  }, [armIdleTimer, resetHistory]);

  // Persist messages + cập nhật timestamp hoạt động cuối + rearm idle timer
  useEffect(() => {
    try {
      localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(messages));
      localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
    } catch (error) {
      console.warn('Không thể lưu lịch sử chat:', error);
    }
    armIdleTimer();
  }, [messages, armIdleTimer]);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Auto-scroll: chỉ cuộn trong khung chat, không kéo cả trang web.
  // 2 lần RAF + listener cho ảnh load xong (vì ảnh sản phẩm làm scrollHeight tăng sau).
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const scrollToBottom = () => {
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    };
    const r1 = requestAnimationFrame(() => {
      requestAnimationFrame(scrollToBottom);
    });

    const imgs = container.querySelectorAll('img');
    const handlers: Array<() => void> = [];
    imgs.forEach((img) => {
      if (!img.complete) {
        const h = () => scrollToBottom();
        img.addEventListener('load', h, { once: true });
        img.addEventListener('error', h, { once: true });
        handlers.push(() => {
          img.removeEventListener('load', h);
          img.removeEventListener('error', h);
        });
      }
    });

    return () => {
      cancelAnimationFrame(r1);
      handlers.forEach((cleanup) => cleanup());
    };
  }, [messages, isLoading, isOpen, isMinimized]);

  const applyChatActions = useCallback(
    (actions: ChatAction[] | undefined) => {
      if (!actions || actions.length === 0) return;
      for (const action of actions) {
        if (action.type === 'add_to_cart' && action.product) {
          dispatch(
            addToCart({
              product: action.product,
              quantity: action.quantity || 1,
            })
          );
        }
      }
    },
    [dispatch]
  );

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
      const history = getRecentHistory(messages);

      const { response, actions } = await getChatResponse(text.trim(), history, cartItems);
      applyChatActions(actions);

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
                ref={messagesContainerRef}
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  background: '#fcfcfc',
                }}
              >
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                      maxWidth: '100%',
                    }}
                  >
                    <div
                      style={{
                        padding: '12px 16px',
                        borderRadius: msg.role === 'user' ? '18px 18px 2px 18px' : '18px 18px 18px 2px',
                        background: msg.role === 'user' ? '#0a0a0a' : '#fff',
                        color: msg.role === 'user' ? '#fff' : '#1a1a1a',
                        fontSize: '13.5px',
                        lineHeight: '1.6',
                        boxShadow: msg.role === 'user' ? 'none' : '0 2px 8px rgba(0,0,0,0.05)',
                        border: msg.role === 'user' ? 'none' : '1px solid rgba(0,0,0,0.05)',
                        whiteSpace: 'pre-wrap',
                      }}
                      dangerouslySetInnerHTML={{ __html: formatContent(msg.content) }}
                    />
                    <div
                      style={{
                        fontSize: '10px',
                        color: '#999',
                        marginTop: '4px',
                        marginRight: msg.role === 'user' ? '4px' : 0,
                        marginLeft: msg.role === 'assistant' ? '4px' : 0,
                      }}
                    >
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div style={{ display: 'flex', gap: '4px', padding: '10px' }}>
                    <div style={{ width: '6px', height: '6px', background: '#ccc', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both' }} />
                    <div style={{ width: '6px', height: '6px', background: '#ccc', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both 0.2s' }} />
                    <div style={{ width: '6px', height: '6px', background: '#ccc', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both 0.4s' }} />
                  </div>
                )}
              </div>

              {/* QUICK REPLIES */}
              {!isLoading && (
                <div
                  style={{
                    padding: '0 16px 12px',
                    display: 'flex',
                    gap: '8px',
                    overflowX: 'auto',
                    whiteSpace: 'nowrap',
                    scrollbarWidth: 'none',
                    background: '#fcfcfc',
                  }}
                >
                  {QUICK_REPLIES.map((qr, idx) => (
                    <button
                      key={idx}
                      onClick={() => sendMessage(qr.text)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '20px',
                        background: '#fff',
                        border: '1px solid rgba(0,0,0,0.1)',
                        fontSize: '12px',
                        cursor: 'pointer',
                        color: '#555',
                        transition: 'all 0.2s',
                        flexShrink: 0,
                      }}
                      onMouseOver={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = '#0a0a0a';
                        (e.currentTarget as HTMLButtonElement).style.color = '#0a0a0a';
                      }}
                      onMouseOut={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(0,0,0,0.1)';
                        (e.currentTarget as HTMLButtonElement).style.color = '#555';
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
                    background: '#000000',
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
