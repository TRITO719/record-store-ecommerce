import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../store/cartSlice';
import { Minus, Plus, ShoppingBag, Heart, Share2, Truck, RefreshCw, Shield } from 'lucide-react';
import FeaturedProducts from '../components/FeaturedProducts';
import type { RootState } from '../store';
import toast from 'react-hot-toast';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch();
  const [isAdded, setIsAdded] = useState(false);
  const [selectedQty, setSelectedQty] = useState(1);
  const [wished, setWished] = useState(false);

  const allProducts = useSelector((state: RootState) => state.products.items);
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const productsStatus = useSelector((state: RootState) => state.products.status);

  const currentProduct = useMemo(() => {
    if (!allProducts.length) return null;
    return allProducts.find(p => p.id === Number(id)) ?? null;
  }, [id, allProducts]);

  const currentStock = useSelector((state: RootState) =>
    currentProduct ? (state.products.stock[currentProduct.id] ?? currentProduct.stock) : 0
  );
  const inCartQty = useMemo(() => cartItems.find(i => i.id === currentProduct?.id)?.quantity ?? 0, [cartItems, currentProduct]);
  const maxAddable = Math.max(0, currentStock - inCartQty);

  const relatedProducts = useMemo(() => {
    if (!currentProduct) return [];
    return allProducts.filter(p => p.category === currentProduct.category && p.id !== currentProduct.id).slice(0, 4);
  }, [currentProduct, allProducts]);

  if (productsStatus === 'loading' || productsStatus === 'idle') {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div className="animate-spin-slow" style={{ width: 48, height: 48, borderRadius: '50%', background: 'radial-gradient(circle, #333 0%, #333 28%, var(--accent) 28%, var(--accent) 32%, #1a1a1a 32%)' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!currentProduct) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, padding: 32 }}>
        <span style={{ fontSize: 56 }}>🎵</span>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, color: 'var(--text-primary)' }}>404</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 15 }}>Product not found.</p>
        <Link to="/vinyl" style={{ background: 'var(--accent)', color: '#000', borderRadius: 'var(--radius-full)', padding: '12px 24px', textDecoration: 'none', fontWeight: 700, fontSize: 14 }}>
          Browse Collection
        </Link>
      </div>
    );
  }

  const availableStock = maxAddable;
  const isOutOfStock = currentStock <= 0;
  const isAtMax = maxAddable <= 0 && !isOutOfStock;

  const handleAddToCart = () => {
    if (isOutOfStock || isAtMax) return;
    if (inCartQty + selectedQty > currentStock) { toast.error('Exceeds available stock'); return; }
    dispatch(addToCart({ product: currentProduct, quantity: selectedQty }));
    setIsAdded(true);
    setSelectedQty(1);
    toast.success(`Added ${selectedQty > 1 ? `${selectedQty}× ` : ''}${currentProduct.title}`, {
      style: { borderRadius: '12px', background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border)' },
    });
    setTimeout(() => setIsAdded(false), 2500);
  };

  const catColors: Record<string, string> = { vinyl: 'var(--warm-purple)', cd: 'var(--accent)', merch: 'var(--warm-amber)' };
  const catColor = catColors[currentProduct.category || 'vinyl'] || 'var(--accent)';

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>
      <div className="container-main" style={{ paddingTop: 32, paddingBottom: 80 }}>
        {/* Breadcrumb */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32, fontSize: 13, color: 'var(--text-muted)' }}>
          <Link to="/" style={{ color: 'var(--text-muted)', textDecoration: 'none', transition: 'color 0.2s' }}
            onMouseEnter={e => ((e.target as HTMLElement).style.color = 'var(--text-primary)')}
            onMouseLeave={e => ((e.target as HTMLElement).style.color = 'var(--text-muted)')}>
            Home
          </Link>
          <span>/</span>
          <Link to={`/${currentProduct.category}`} style={{ color: 'var(--text-muted)', textDecoration: 'none', textTransform: 'capitalize', transition: 'color 0.2s' }}
            onMouseEnter={e => ((e.target as HTMLElement).style.color = 'var(--text-primary)')}
            onMouseLeave={e => ((e.target as HTMLElement).style.color = 'var(--text-muted)')}>
            {currentProduct.category}
          </Link>
          <span>/</span>
          <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{currentProduct.title}</span>
        </nav>

        {/* Main layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 56, alignItems: 'start' }}>
          {/* Image */}
          <div style={{ position: 'sticky', top: 96 }}>
            <div style={{
              borderRadius: 'var(--radius-xl)',
              overflow: 'hidden',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              aspectRatio: '1',
              position: 'relative',
            }}>
              <img
                src={currentProduct.imgUrl}
                alt={currentProduct.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.5s ease' }}
                onMouseEnter={e => ((e.currentTarget as HTMLImageElement).style.transform = 'scale(1.04)')}
                onMouseLeave={e => ((e.currentTarget as HTMLImageElement).style.transform = 'scale(1)')}
              />

              {isOutOfStock && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ background: 'rgba(244,63,94,0.9)', color: '#fff', fontSize: 14, fontWeight: 700, padding: '8px 20px', borderRadius: 'var(--radius-full)', letterSpacing: '0.08em' }}>
                    SOLD OUT
                  </span>
                </div>
              )}

              {/* Category pill */}
              <div style={{
                position: 'absolute', top: 16, left: 16,
                background: `${catColor}22`, backdropFilter: 'blur(12px)',
                color: catColor,
                border: `1px solid ${catColor}44`,
                borderRadius: 'var(--radius-full)',
                padding: '4px 14px',
                fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
              }}>
                {currentProduct.category}
              </div>
            </div>
          </div>

          {/* Info */}
          <div style={{ animation: 'fadeUp 0.5s ease both' }}>
            {/* Artist */}
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 8, fontStyle: 'italic' }}>{currentProduct.artist}</p>

            {/* Title */}
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 3.5vw, 44px)', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1, marginBottom: 20, letterSpacing: '-0.02em' }}>
              {currentProduct.title}
            </h1>

            {/* Price + stock row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 800, color: 'var(--text-primary)' }}>
                ${currentProduct.price.toFixed(2)}
              </span>
              <span style={{
                padding: '4px 12px',
                borderRadius: 'var(--radius-full)',
                fontSize: 12, fontWeight: 700,
                background: isOutOfStock ? 'rgba(244,63,94,0.12)' : 'var(--accent-soft)',
                color: isOutOfStock ? 'var(--warm-rose)' : 'var(--accent)',
                border: `1px solid ${isOutOfStock ? 'rgba(244,63,94,0.3)' : 'rgba(29,185,84,0.3)'}`,
              }}>
                {isOutOfStock ? 'Out of Stock' : `${availableStock} in stock`}
              </span>
            </div>

            {/* Description */}
            {currentProduct.description && (
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: 28 }}>
                {currentProduct.description}
              </p>
            )}

            {/* Qty selector */}
            {!isOutOfStock && (
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>Quantity</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    display: 'flex', alignItems: 'center',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-full)',
                    overflow: 'hidden',
                    background: 'var(--bg-secondary)',
                  }}>
                    <button onClick={() => setSelectedQty(q => Math.max(1, q - 1))} disabled={selectedQty <= 1}
                      style={{ width: 42, height: 42, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: selectedQty <= 1 ? 0.3 : 1 }}>
                      <Minus size={16} />
                    </button>
                    <span style={{ padding: '0 20px', fontWeight: 700, fontSize: 16, color: 'var(--text-primary)', minWidth: 32, textAlign: 'center' }}>{selectedQty}</span>
                    <button onClick={() => setSelectedQty(q => Math.min(maxAddable, q + 1))} disabled={selectedQty >= maxAddable}
                      style={{ width: 42, height: 42, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: selectedQty >= maxAddable ? 0.3 : 1 }}>
                      <Plus size={16} />
                    </button>
                  </div>
                  {isAtMax && <p style={{ fontSize: 12, color: 'var(--warm-amber)' }}>Maximum quantity reached</p>}
                </div>
              </div>
            )}

            {/* CTA buttons */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 32 }}>
              <button
                onClick={handleAddToCart}
                disabled={isAdded || isOutOfStock || isAtMax}
                style={{
                  flex: 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  background: isOutOfStock ? 'var(--bg-secondary)' : isAtMax ? 'rgba(245,158,11,0.15)' : isAdded ? 'rgba(29,185,84,0.15)' : 'var(--accent)',
                  color: isOutOfStock ? 'var(--text-muted)' : isAtMax ? 'var(--warm-amber)' : isAdded ? 'var(--accent)' : '#000',
                  border: `1px solid ${isAdded || isAtMax ? (isAtMax ? 'rgba(245,158,11,0.4)' : 'rgba(29,185,84,0.4)') : 'transparent'}`,
                  borderRadius: 'var(--radius-full)',
                  padding: '16px 28px',
                  fontSize: 15, fontWeight: 700,
                  cursor: isOutOfStock || isAtMax ? 'not-allowed' : 'pointer',
                  boxShadow: !isOutOfStock && !isAtMax && !isAdded ? 'var(--shadow-accent)' : 'none',
                  transition: 'all 0.25s ease',
                }}
                onMouseEnter={e => { if (!isOutOfStock && !isAtMax && !isAdded) (e.currentTarget as HTMLElement).style.background = 'var(--accent-dim)'; }}
                onMouseLeave={e => { if (!isOutOfStock && !isAtMax && !isAdded) (e.currentTarget as HTMLElement).style.background = 'var(--accent)'; }}
              >
                <ShoppingBag size={18} />
                {isOutOfStock ? 'Out of Stock' : isAtMax ? 'Cart Limit Reached' : isAdded ? '✓ Added!' : `Add to Cart — $${(currentProduct.price * selectedQty).toFixed(2)}`}
              </button>

              <button
                onClick={() => setWished(w => !w)}
                style={{
                  width: 52, height: 52,
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--border)',
                  background: wished ? 'rgba(244,63,94,0.1)' : 'var(--bg-secondary)',
                  color: wished ? 'var(--warm-rose)' : 'var(--text-muted)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s',
                  flexShrink: 0,
                }}
              >
                <Heart size={20} fill={wished ? 'var(--warm-rose)' : 'none'} />
              </button>

              <button
                style={{
                  width: 52, height: 52,
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-muted)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s',
                  flexShrink: 0,
                }}
              >
                <Share2 size={18} />
              </button>
            </div>

            {/* Benefits */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { Icon: Truck, text: 'Free shipping on orders over $100' },
                { Icon: RefreshCw, text: '30-day returns for sealed items' },
                { Icon: Shield, text: 'Authentic products guaranteed' },
              ].map(({ Icon, text }, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Icon size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Related products */}
        {relatedProducts.length > 0 && (
          <div style={{ marginTop: 80, paddingTop: 64, borderTop: '1px solid var(--border)' }}>
            <FeaturedProducts
              products={relatedProducts}
              title="You Might Also Like"
              subtitle="Related Items"
              viewAllLink={`/${currentProduct.category}`}
              columns={4}
            />
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 900px) {
          .container-main > div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
          .container-main > div[style*="position: sticky"] {
            position: static !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ProductDetail;