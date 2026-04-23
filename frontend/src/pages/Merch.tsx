import React, { useMemo, useState } from 'react';
import FeaturedProducts from '../components/FeaturedProducts';
import ProductFilterBar from '../components/ProductFilterBar';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';

const Merch: React.FC = () => {
  const [sortOrder, setSortOrder] = useState<string>('featured');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filterOptions = ['all', 'Record Store Exclusive', 'Eco-friendly', 'Premium Care', 'Turntable Essentials', 'Accessories', 'Home Decor'];

  const allProducts = useSelector((state: RootState) => state.products.items);
  const filteredProducts = useMemo(() => {
    let result = allProducts.filter(p => p.category === 'merch');

    if (searchQuery.trim()) {
      result = result.filter((p) =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.artist.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedBrand !== 'all') {
      result = result.filter((p) => p.artist === selectedBrand);
    }

    if (sortOrder === 'price-low') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortOrder === 'price-high') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortOrder === 'az') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    }

    return result;
  }, [allProducts, sortOrder, selectedBrand, searchQuery]);

  return (
    <div className="flex-grow bg-white">
      <section className="pt-20 pb-10 px-6 text-center border-b border-rs-border">
        <span className="text-[10px] font-bold tracking-[0.4em] uppercase text-gray-400 mb-4 block">Official Collection</span>
        <h1 className="text-5xl md:text-7xl font-bold uppercase tracking-[0.1em] font-display">Merchandise</h1>
      </section>

      <div className="max-w-[1400px] mx-auto py-10 px-6">
        <ProductFilterBar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          sortOrder={sortOrder}
          onSortChange={setSortOrder}
          filterOptions={filterOptions}
          selectedFilter={selectedBrand}
          onFilterSelect={setSelectedBrand}
        />

        <div className="mb-20">
          <FeaturedProducts products={filteredProducts} title="" />
          {filteredProducts.length === 0 && (
            <div className="text-center py-20 text-[11px] uppercase tracking-[0.2em] text-gray-400">
              Không tìm thấy sản phẩm phù hợp.
            </div>
          )}
        </div>
      </div>

      <section className="bg-rs-gray-light py-20 px-6 mt-10">
        <div className="max-w-[800px] mx-auto text-center">
          <h2 className="text-2xl font-bold uppercase tracking-widest font-display mb-6 text-rs-black">Chính sách vận chuyển</h2>
          <p className="text-sm text-gray-500 font-sans leading-relaxed">
            Tất cả các mặt hàng merchandise được vận chuyển toàn quốc. Đối với áo thun và túi tote, vui lòng kiểm tra bảng size kỹ trước khi đặt hàng. 
            Chúng tôi hỗ trợ đổi trả trong vòng 7 ngày nếu có lỗi từ nhà sản xuất.
          </p>
        </div>
      </section>
    </div>
  );
};

export default Merch;