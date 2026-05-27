import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../store';
import { removeFromCart, updateQuantity } from '../store/cartSlice';
import { fetchProducts } from '../store/productSlice';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, AlertTriangle } from 'lucide-react';

const Cart: React.FC = () => {
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const productStock = useSelector((state: RootState) => state.products.stock);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  // Re-fetch stock mới nhất từ server mỗi khi vào trang Cart
  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  const [selectedIds, setSelectedIds] = useState<Set<number>>(
    () => new Set(cartItems.map(i => i.id))
  );

  useEffect(() => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      cartItems.forEach(item => {
        const stock = productStock[item.id] ?? item.stock;
        // Chỉ auto-add nếu còn hàng
        if (!next.has(item.id) && stock > 0) next.add(item.id);
        // Auto-deselect nếu hết hàng
        if (stock <= 0) next.delete(item.id);
      });
      // Remove IDs that no longer exist in cart
      next.forEach(id => {
        if (!cartItems.find(i => i.id === id)) next.delete(id);
      });
      return next;
    });
  }, [cartItems, productStock]);

  // Auto-clamp quantity khi stock giảm (ví dụ: user có 5 trong giỏ nhưng stock chỉ còn 2)
  useEffect(() => {
    cartItems.forEach(item => {
      const stock = productStock[item.id];
      if (stock !== undefined && stock > 0 && item.quantity > stock) {
        dispatch(updateQuantity({ id: item.id, quantity: stock }));
      }
    });
  }, [productStock, cartItems, dispatch]);

  // Chỉ tính những item còn hàng VÀ được chọn
  const selectedItems = cartItems.filter(i => {
    const stock = productStock[i.id] ?? i.stock;
    return selectedIds.has(i.id) && stock > 0;
  });
  const totalPrice = selectedItems.reduce((t, i) => t + i.price * i.quantity, 0);
  const outOfStockCount = cartItems.filter(i => (productStock[i.id] ?? i.stock) <= 0).length;
  const isAllSelected = cartItems.length > 0 && selectedIds.size === cartItems.length;

  const toggleAll = () => {
    setSelectedIds(isAllSelected ? new Set() : new Set(cartItems.map(i => i.id)));
  };

  const toggleItem = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  if (cartItems.length === 0) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        flexGrow: 1,
        minHeight: '60vh',
        padding: '24px',
        textAlign: 'center',
        background: 'var(--bg-primary)',
      }}>
        <ShoppingBag size={56} style={{ color: 'var(--text-muted)', marginBottom: 24, strokeWidth: 1 }} />
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(28px, 4vw, 40px)',
          fontWeight: 800,
          color: 'var(--text-primary)',
          marginBottom: 12,
          letterSpacing: '-0.02em',
        }}>
          Giỏ hàng trống
        </h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: 32, fontSize: 15 }}>
          Chưa có sản phẩm nào trong giỏ hàng.
        </p>
        <Link
          to="/vinyl"
          style={{
            background: 'var(--accent)',
            color: '#000',
            padding: '14px 32px',
            borderRadius: 'var(--radius-full)',
            textDecoration: 'none',
            fontWeight: 700,
            fontSize: 14,
            boxShadow: 'var(--shadow-accent)',
          }}
        >
          Tiếp tục mua sắm
        </Link>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: 1200,
      margin: '0 auto',
      padding: '48px 32px 80px',
      width: '100%',
      flexGrow: 1,
      background: 'var(--bg-primary)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 40,
        paddingBottom: 20,
        borderBottom: '1px solid var(--border)',
      }}>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(24px, 3.5vw, 36px)',
          fontWeight: 800,
          color: 'var(--text-primary)',
          letterSpacing: '-0.02em',
        }}>
          Giỏ hàng
          <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.6em', marginLeft: 12 }}>
            ({cartItems.reduce((a, i) => a + i.quantity, 0)} sản phẩm)
          </span>
        </h1>

        {/* Select all */}
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          cursor: 'pointer',
          fontSize: 13,
          color: 'var(--text-secondary)',
          fontWeight: 500,
          userSelect: 'none',
        }}>
          <input
            type="checkbox"
            checked={isAllSelected}
            onChange={toggleAll}
            style={{
              width: 16,
              height: 16,
              accentColor: 'var(--accent)',
              cursor: 'pointer',
            }}
          />
          Chọn tất cả ({cartItems.length})
        </label>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
        <div style={{ display: 'flex', gap: 48, alignItems: 'flex-start' }}>
          {/* Cart items */}
          <div style={{ flex: '1 1 0', minWidth: 0 }}>
            {cartItems.map((item, index) => {
              const isSelected = selectedIds.has(item.id);
              const currentStock = productStock[item.id] ?? item.stock;
              const isOutOfStock = currentStock <= 0;
              const isOverStock = !isOutOfStock && item.quantity > currentStock;
              return (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    gap: 16,
                    padding: '20px 0',
                    borderBottom: index < cartItems.length - 1 ? '1px solid var(--border)' : 'none',
                    opacity: isOutOfStock ? 0.4 : isSelected ? 1 : 0.45,
                    transition: 'opacity 0.3s ease',
                    position: 'relative',
                    pointerEvents: isOutOfStock ? 'none' : 'auto',
                  }}
                >
                  {/* Checkbox */}
                  <div style={{ display: 'flex', alignItems: 'center', paddingTop: 4, pointerEvents: 'auto' }}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleItem(item.id)}
                      disabled={isOutOfStock}
                      style={{
                        width: 16,
                        height: 16,
                        accentColor: 'var(--accent)',
                        cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                        flexShrink: 0,
                        opacity: isOutOfStock ? 0.3 : 1,
                      }}
                    />
                  </div>

                  {/* Image */}
                  <Link
                    to={`/product/${item.id}`}
                    style={{
                      width: 96,
                      height: 96,
                      flexShrink: 0,
                      borderRadius: 'var(--radius-md)',
                      overflow: 'hidden',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-secondary)',
                      display: 'block',
                      position: 'relative',
                      pointerEvents: 'auto',
                    }}
                  >
                    <img
                      src={item.imgUrl}
                      alt={item.title}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        filter: isOutOfStock ? 'grayscale(100%)' : 'none',
                        transition: 'filter 0.3s ease',
                      }}
                    />
                    {isOutOfStock && (
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(0,0,0,0.55)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <span style={{
                          fontSize: 9,
                          fontWeight: 800,
                          color: '#fff',
                          textTransform: 'uppercase',
                          letterSpacing: '0.1em',
                        }}>Hết hàng</span>
                      </div>
                    )}
                  </Link>

                  {/* Info */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0 }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                        <Link to={`/product/${item.id}`} style={{ textDecoration: 'none', pointerEvents: 'auto' }}>
                          <h3 style={{
                            fontFamily: 'var(--font-display)',
                            fontWeight: 700,
                            fontSize: 16,
                            color: isOutOfStock ? 'var(--text-muted)' : 'var(--text-primary)',
                            lineHeight: 1.25,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: '300px',
                            textDecoration: isOutOfStock ? 'line-through' : 'none',
                          }}>{item.title}</h3>
                        </Link>
                        <span style={{
                          fontFamily: 'var(--font-display)',
                          fontWeight: 700,
                          fontSize: 17,
                          color: isOutOfStock ? 'var(--text-muted)' : isSelected ? 'var(--text-primary)' : 'var(--text-muted)',
                          whiteSpace: 'nowrap',
                          textDecoration: isOutOfStock ? 'line-through' : 'none',
                        }}>
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{item.artist}</p>

                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 6, flexWrap: 'wrap' }}>
                        <span style={{
                          display: 'inline-block',
                          fontSize: 10,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          color: 'var(--accent)',
                          background: 'var(--accent-soft)',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-full)',
                        }}>
                          {item.category || 'vinyl'}
                        </span>

                        {/* Badge hết hàng */}
                        {isOutOfStock && (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: 10,
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                            color: '#ef4444',
                            background: 'rgba(239,68,68,0.1)',
                            border: '1px solid rgba(239,68,68,0.25)',
                            padding: '2px 10px',
                            borderRadius: 'var(--radius-full)',
                          }}>
                            <AlertTriangle size={10} /> Hết hàng
                          </span>
                        )}

                        {/* Cảnh báo stock giảm */}
                        {isOverStock && (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: 10,
                            fontWeight: 700,
                            color: '#f59e0b',
                            background: 'rgba(245,158,11,0.1)',
                            border: '1px solid rgba(245,158,11,0.25)',
                            padding: '2px 10px',
                            borderRadius: 'var(--radius-full)',
                          }}>
                            <AlertTriangle size={10} /> Chỉ còn {currentStock}
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                      {/* Qty control — ẩn khi hết hàng */}
                      {isOutOfStock ? (
                        <span style={{
                          fontSize: 12,
                          color: '#ef4444',
                          fontWeight: 600,
                          fontStyle: 'italic',
                        }}>Sản phẩm này đã hết hàng</span>
                      ) : (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-full)',
                          overflow: 'hidden',
                          background: 'var(--bg-secondary)',
                        }}>
                          <button
                            onClick={() => dispatch(updateQuantity({ id: item.id, quantity: item.quantity - 1 }))}
                            disabled={item.quantity <= 1}
                            style={{
                              width: 34, height: 34,
                              background: 'none', border: 'none',
                              cursor: item.quantity <= 1 ? 'not-allowed' : 'pointer',
                              color: 'var(--text-primary)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              opacity: item.quantity <= 1 ? 0.3 : 1,
                            }}
                          >
                            <Minus size={13} />
                          </button>
                          <span style={{
                            padding: '0 14px',
                            fontWeight: 700,
                            fontSize: 14,
                            color: 'var(--text-primary)',
                            minWidth: 28,
                            textAlign: 'center',
                          }}>
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => dispatch(updateQuantity({ id: item.id, quantity: item.quantity + 1 }))}
                            disabled={item.quantity >= currentStock}
                            style={{
                              width: 34, height: 34,
                              background: 'none', border: 'none',
                              cursor: item.quantity >= currentStock ? 'not-allowed' : 'pointer',
                              color: 'var(--text-primary)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              opacity: item.quantity >= currentStock ? 0.3 : 1,
                            }}
                          >
                            <Plus size={13} />
                          </button>
                        </div>
                      )}

                      <button
                        onClick={() => dispatch(removeFromCart(item.id))}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 6,
                          background: 'none', border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          fontSize: 12,
                          fontWeight: 600,
                          transition: 'color 0.2s',
                          pointerEvents: 'auto',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.color = 'var(--warm-rose)')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                      >
                        <Trash2 size={15} strokeWidth={1.5} />
                        Xóa
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div style={{
            width: 320,
            flexShrink: 0,
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)',
            padding: '28px',
            position: 'sticky',
            top: 96,
          }}>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 18,
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: 20,
              paddingBottom: 16,
              borderBottom: '1px solid var(--border)',
            }}>
              Tổng đơn hàng
            </h2>

            {/* Selected items summary */}
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                {selectedItems.length} / {cartItems.length} sản phẩm được chọn
              </p>
              {outOfStockCount > 0 && (
                <p style={{ fontSize: 11, color: '#ef4444', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                  <AlertTriangle size={12} />
                  {outOfStockCount} sản phẩm đã hết hàng
                </p>
              )}
              {selectedItems.length === 0 && (
                <p style={{ fontSize: 12, color: 'var(--warm-rose)', fontWeight: 600 }}>
                  Vui lòng chọn ít nhất 1 sản phẩm
                </p>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: 'var(--text-secondary)', marginBottom: 10 }}>
              <span>Tạm tính</span>
              <span>${totalPrice.toFixed(2)}</span>
            </div>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              fontSize: 14, color: 'var(--text-secondary)',
              marginBottom: 20, paddingBottom: 20,
              borderBottom: '1px solid var(--border)',
            }}>
              <span>Giao hàng</span>
              <span style={{ color: 'var(--accent)', fontWeight: 600, fontSize: 12 }}>Miễn phí</span>
            </div>

            <div style={{
              display: 'flex', justifyContent: 'space-between',
              fontFamily: 'var(--font-display)',
              fontWeight: 700, fontSize: 20,
              color: 'var(--text-primary)',
              marginBottom: 24,
            }}>
              <span>Tổng cộng</span>
              <span style={{ color: selectedItems.length > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                ${totalPrice.toFixed(2)}
              </span>
            </div>

            <button
              onClick={() => navigate('/checkout', { state: { selectedIds: Array.from(selectedIds) } })}
              disabled={selectedItems.length === 0}
              style={{
                width: '100%',
                background: selectedItems.length > 0 ? 'var(--accent)' : 'var(--bg-secondary)',
                color: selectedItems.length > 0 ? '#000' : 'var(--text-muted)',
                border: 'none',
                borderRadius: 'var(--radius-full)',
                padding: '15px 24px',
                fontSize: 14, fontWeight: 700,
                cursor: selectedItems.length > 0 ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: selectedItems.length > 0 ? 'var(--shadow-accent)' : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              Thanh toán an toàn <ArrowRight size={15} />
            </button>

            <Link
              to="/vinyl"
              style={{
                display: 'block',
                textAlign: 'center',
                marginTop: 14,
                fontSize: 12,
                color: 'var(--text-muted)',
                textDecoration: 'none',
                fontWeight: 600,
                transition: 'color 0.2s',
              }}
              onMouseEnter={e => ((e.target as HTMLElement).style.color = 'var(--text-primary)')}
              onMouseLeave={e => ((e.target as HTMLElement).style.color = 'var(--text-muted)')}
            >
              Tiếp tục mua sắm
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .cart-layout { flex-direction: column !important; }
          .cart-summary { width: 100% !important; position: static !important; }
        }
      `}</style>
    </div>
  );
};

export default Cart;