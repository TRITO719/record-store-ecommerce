import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../store/cartSlice';
import { Minus, Plus } from 'lucide-react';
import FeaturedProducts from '../components/FeaturedProducts';

import type { RootState } from '../store';
import toast from 'react-hot-toast';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch();
  const [isAdded, setIsAdded] = useState(false);
  const [selectedQty, setSelectedQty] = useState(1);

  const allProducts = useSelector((state: RootState) => state.products.items);
  const cartItems = useSelector((state: RootState) => state.cart.items);

  const currentProduct = useMemo(() => {
    if (allProducts.length === 0) return null;
    return allProducts.find(p => p.id === Number(id)) ?? null;
  }, [id, allProducts]);

  // Stock thực tế từ backend (qua Redux)
  const currentStock = useSelector((state: RootState) =>
    currentProduct ? (state.products.stock[currentProduct.id] ?? currentProduct.stock) : 0
  );

  // Số lượng đang có trong giỏ hàng
  const inCartQty = useMemo(() =>
    cartItems.find(i => i.id === currentProduct?.id)?.quantity ?? 0,
    [cartItems, currentProduct]
  );

  // Số lượng tối đa còn có thể thêm
  const maxAddable = Math.max(0, currentStock - inCartQty);

  const relatedProducts = useMemo(() => {
    if (!currentProduct) return [];
    return allProducts.filter(p => p.id !== currentProduct.id).slice(0, 4);
  }, [currentProduct, allProducts]);

  const productsLoaded = useSelector((state: RootState) => state.products.status);

  if (productsLoaded === 'loading' || productsLoaded === 'idle') {
    return <div className="py-40 text-center uppercase tracking-widest text-gray-500 text-sm">Đang tải...</div>;
  }

  if (!currentProduct) {
    return (
      <div className="py-40 text-center">
        <p className="text-4xl font-bold uppercase font-display mb-4">404</p>
        <p className="text-sm uppercase tracking-widest text-gray-500 mb-8">Không tìm thấy sản phẩm này.</p>
        <a href="/vinyl" className="text-[10px] font-bold uppercase tracking-widest border-b border-black pb-1 hover:opacity-50 transition-opacity">
          Quay lại cửa hàng
        </a>
      </div>
    );
  }

  const handleAddToCart = () => {
    if (currentStock <= 0) {
      toast.error('Sản phẩm đã hết hàng', {
        style: { borderRadius: '0px', background: '#dc2626', color: '#fff', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase' }
      });
      return;
    }

    if (inCartQty + selectedQty > currentStock) {
      toast.error(
        inCartQty > 0
          ? `Bạn đã có ${inCartQty} sản phẩm trong giỏ hàng. Không thể thêm vào giỏ vì sẽ vượt quá giới hạn mua hàng.`
          : 'Số lượng vượt quá tồn kho.',
        { style: { borderRadius: '0px', background: '#dc2626', color: '#fff', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase' } }
      );
      return;
    }

    dispatch(addToCart({ product: currentProduct, quantity: selectedQty }));
    setIsAdded(true);
    setSelectedQty(1);

    toast.success(`Đã thêm ${selectedQty > 1 ? `${selectedQty}x ` : ''}${currentProduct.title} vào giỏ hàng`, {
      style: { borderRadius: '0px', background: '#000', color: '#fff', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase' }
    });

    setTimeout(() => setIsAdded(false), 2000);
  };

  const isOutOfStock = currentStock <= 0;
  const isAtMax = maxAddable <= 0 && !isOutOfStock;

  return (
    <div className="flex flex-col w-full">
      <div className="max-w-[1200px] mx-auto px-6 py-12 md:py-20 w-full">
        <div className="flex flex-col md:flex-row gap-10 md:gap-16">
          <div className="w-full md:w-1/2 bg-rs-gray-light border border-rs-border overflow-hidden relative">
            <img
              src={currentProduct.imgUrl}
              alt={currentProduct.title}
              className="w-full h-auto object-cover hover:scale-105 transition-transform duration-700"
            />
            {isOutOfStock && (
              <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center">
                <p className="text-white text-2xl font-bold uppercase tracking-widest">Hết hàng</p>
              </div>
            )}
          </div>

          <div className="w-full md:w-1/2 flex flex-col justify-start pt-4 md:pt-8">
            <nav className="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-8 font-sans">
              <Link to="/" className="hover:text-black transition-colors">Home</Link>
              <span className="mx-2">/</span>
              <Link to={`/${currentProduct.category}`} className="hover:text-black transition-colors uppercase">{currentProduct.category}</Link>
            </nav>

            <h1 className="text-4xl md:text-5xl font-bold uppercase tracking-wide font-display text-rs-black mb-2 leading-[1.1]">
              {currentProduct.title}
            </h1>
            <h2 className="text-xl md:text-2xl text-gray-400 font-sans mb-8 italic">
              {currentProduct.artist}
            </h2>

            <div className="text-2xl font-bold font-sans text-rs-black mb-4 pb-6 border-b border-rs-border flex justify-between items-center">
              <span>${currentProduct.price.toFixed(2)}</span>
              <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1 ${
                isOutOfStock ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
              }`}>
                {isOutOfStock ? 'Hết hàng' : `Còn ${currentStock}`}
              </span>
            </div>

            <div className="mb-10">
              <p className="text-sm text-gray-600 font-sans leading-relaxed">
                {currentProduct.description}
              </p>
            </div>

            {/* Quantity Selector */}
            {!isOutOfStock && (
              <div className="mb-6">
                <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold mb-3">Số lượng</p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center border border-rs-border">
                    <button
                      onClick={() => setSelectedQty(q => Math.max(1, q - 1))}
                      disabled={selectedQty <= 1}
                      className="px-4 py-3 hover:bg-gray-100 transition-colors disabled:opacity-30"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="px-6 py-3 text-sm font-semibold font-sans min-w-[3rem] text-center">{selectedQty}</span>
                    <button
                      onClick={() => setSelectedQty(q => Math.min(maxAddable, q + 1))}
                      disabled={selectedQty >= maxAddable}
                      className="px-4 py-3 hover:bg-gray-100 transition-colors disabled:opacity-30"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  {isAtMax && (
                    <p className="text-[10px] text-amber-600 uppercase tracking-wider font-bold">
                      Số lượng bạn chọn đã đạt mức tối đa của sản phẩm này
                    </p>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={handleAddToCart}
              disabled={isAdded || isOutOfStock || isAtMax}
              className={`w-full py-5 uppercase tracking-[0.3em] text-[11px] font-bold transition-all duration-500 ${
                isOutOfStock
                  ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                  : isAtMax
                  ? 'bg-amber-100 text-amber-700 cursor-not-allowed'
                  : isAdded
                  ? 'bg-green-600 text-white cursor-default'
                  : 'bg-black text-white hover:bg-zinc-800'
              }`}
            >
              {isOutOfStock
                ? 'Hết hàng'
                : isAtMax
                ? 'Đã đạt giới hạn trong giỏ'
                : isAdded
                ? 'Đã thêm thành công'
                : 'Thêm vào giỏ hàng'}
            </button>

            <div className="mt-12 pt-8 border-t border-rs-border">
              <div className="grid grid-cols-2 gap-8 text-[10px] uppercase tracking-widest font-bold text-gray-400">
                <div>
                  <p className="mb-2 text-black">Vận chuyển</p>
                  <p className="font-medium leading-relaxed">Giao hàng miễn phí cho đơn hàng trên $100.</p>
                </div>
                <div>
                  <p className="mb-2 text-black">Đổi trả</p>
                  <p className="font-medium leading-relaxed">Hoàn trả trong vòng 30 ngày nếu còn nguyên seal.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-rs-border mt-10">
        <FeaturedProducts products={relatedProducts} title="Có thể bạn cũng thích" />
      </div>
    </div>
  );
};

export default ProductDetail;