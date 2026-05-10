import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../store/cartSlice';
import { Plus, Minus, X } from 'lucide-react';
import type { Product } from '../types';
import type { RootState } from '../store';
import toast from 'react-hot-toast';

interface FeaturedProductsProps {
  products: Product[];
  title: string;
}

interface ModalState {
  open: boolean;
  product: Product | null;
  qty: number;
}

const TOAST_STYLE = { borderRadius: '0px', background: '#000', color: '#fff', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase' as const };
const ERROR_STYLE = { ...TOAST_STYLE, background: '#dc2626' };

const FeaturedProducts: React.FC<FeaturedProductsProps> = ({ products, title }) => {
  const dispatch = useDispatch();
  const productStocks = useSelector((state: RootState) => state.products.stock);
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const [modal, setModal] = useState<ModalState>({ open: false, product: null, qty: 1 });

  const openQuickAdd = (product: Product) => {
    const currentStock = productStocks[product.id] ?? product.stock;
    const inCartQty = cartItems.find(i => i.id === product.id)?.quantity ?? 0;
    const maxAddable = Math.max(0, currentStock - inCartQty);

    if (currentStock <= 0) {
      toast.error(`${product.title} đã hết hàng`, { style: ERROR_STYLE });
      return;
    }

    if (maxAddable <= 0) {
      toast.error(
        `Bạn đã có ${inCartQty} sản phẩm trong giỏ hàng. Không thể thêm vào giỏ vì sẽ vượt quá giới hạn mua hàng.`,
        { style: ERROR_STYLE }
      );
      return;
    }

    setModal({ open: true, product, qty: 1 });
  };

  const closeModal = () => setModal({ open: false, product: null, qty: 1 });

  const confirmQuickAdd = () => {
    if (!modal.product) return;
    const { product, qty } = modal;
    const currentStock = productStocks[product.id] ?? product.stock;
    const inCartQty = cartItems.find(i => i.id === product.id)?.quantity ?? 0;

    if (inCartQty + qty > currentStock) {
      toast.error(
        `Bạn đã có ${inCartQty} sản phẩm trong giỏ hàng. Không thể thêm vào giỏ vì sẽ vượt quá giới hạn mua hàng.`,
        { style: ERROR_STYLE }
      );
      closeModal();
      return;
    }

    dispatch(addToCart({ product, quantity: qty }));
    toast.success(`Đã thêm ${qty > 1 ? `${qty}x ` : ''}${product.title} vào giỏ hàng`, {
      style: TOAST_STYLE,
      iconTheme: { primary: '#fff', secondary: '#000' },
    });
    closeModal();
  };

  // Tính maxAddable cho modal product
  const modalStock = modal.product ? (productStocks[modal.product.id] ?? modal.product.stock) : 0;
  const modalInCart = modal.product ? (cartItems.find(i => i.id === modal.product!.id)?.quantity ?? 0) : 0;
  const modalMaxAddable = Math.max(0, modalStock - modalInCart);

  return (
    <>
      <section className="px-6 py-20 max-w-[1400px] mx-auto">
        {title && (
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-xl font-bold uppercase tracking-[0.2em] font-display">{title}</h2>
            <Link to="/vinyl" className="text-[10px] font-bold uppercase tracking-widest border-b border-black pb-1 hover:opacity-50 transition-opacity">
              Xem tất cả
            </Link>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-16">
          {products.map((product) => {
            const currentStock = productStocks[product.id] ?? product.stock;
            const isOutOfStock = currentStock <= 0;

            return (
              <div key={product.id} className="group flex flex-col">
                <div className="aspect-square bg-rs-gray-light mb-6 overflow-hidden relative">
                  <Link to={`/product/${product.id}`}>
                    <img
                      src={product.imgUrl}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                  </Link>

                  {isOutOfStock && (
                    <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                      <span className="text-white text-sm font-bold uppercase tracking-widest">Hết hàng</span>
                    </div>
                  )}

                  <button
                    onClick={() => openQuickAdd(product)}
                    disabled={isOutOfStock}
                    className={`absolute bottom-0 left-0 right-0 py-4 text-[10px] font-bold tracking-[0.2em] uppercase flex items-center justify-center gap-2 transition-all duration-300 ease-in-out ${
                      isOutOfStock
                        ? 'bg-gray-400 text-gray-600 cursor-not-allowed translate-y-0'
                        : 'bg-black text-white translate-y-full group-hover:translate-y-0 hover:bg-zinc-800'
                    }`}
                  >
                    <Plus size={14} /> {isOutOfStock ? 'Hết hàng' : 'Quick Add'}
                  </button>
                </div>

                <div className="space-y-1">
                  <Link to={`/product/${product.id}`}>
                    <h3 className="text-[11px] font-bold uppercase tracking-wider leading-tight line-clamp-1 hover:opacity-60 transition-opacity">{product.title}</h3>
                  </Link>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest">{product.artist}</p>
                  <p className="text-[11px] font-medium pt-2">${product.price.toFixed(2)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Quick Add Modal */}
      {modal.open && modal.product && (
        <div className="fixed inset-0 bg-black/5 backdrop-blur-xs z-50 flex items-center justify-center p-6" onClick={closeModal}>
          <div className="bg-white max-w-sm w-full p-8 relative" onClick={e => e.stopPropagation()}>
            <button onClick={closeModal} className="absolute top-4 right-4 text-gray-400 hover:text-black transition-colors">
              <X size={18} />
            </button>

            <div className="flex gap-4 mb-6">
              <img src={modal.product.imgUrl} alt={modal.product.title} className="w-20 h-20 object-cover bg-rs-gray-light flex-shrink-0" />
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider leading-tight">{modal.product.title}</h3>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">{modal.product.artist}</p>
                <p className="text-sm font-bold mt-2">${modal.product.price.toFixed(2)}</p>
              </div>
            </div>

            <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold mb-3">Số lượng</p>
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center border border-rs-border">
                <button
                  onClick={() => setModal(m => ({ ...m, qty: Math.max(1, m.qty - 1) }))}
                  disabled={modal.qty <= 1}
                  className="px-4 py-3 hover:bg-gray-100 transition-colors disabled:opacity-30"
                >
                  <Minus size={14} />
                </button>
                <span className="px-6 py-3 text-sm font-semibold font-sans min-w-[3rem] text-center">{modal.qty}</span>
                <button
                  onClick={() => setModal(m => ({ ...m, qty: Math.min(modalMaxAddable, m.qty + 1) }))}
                  disabled={modal.qty >= modalMaxAddable}
                  className="px-4 py-3 hover:bg-gray-100 transition-colors disabled:opacity-30"
                >
                  <Plus size={14} />
                </button>
              </div>
              <span className="text-[10px] text-gray-400 uppercase tracking-wider">
                Còn {modalStock} · Giỏ: {modalInCart}
              </span>
            </div>

            <button
              onClick={confirmQuickAdd}
              className="w-full bg-black text-white py-4 uppercase tracking-[0.3em] text-[11px] font-bold hover:bg-zinc-800 transition-colors"
            >
              Thêm vào giỏ hàng — ${(modal.product.price * modal.qty).toFixed(2)}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default FeaturedProducts;