import React, { useState, useMemo } from 'react';
import FeaturedProducts from '../components/FeaturedProducts';
import ProductFilterBar from '../components/ProductFilterBar';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';

const Vinyl: React.FC = () => {
  const [sortOrder, setSortOrder] = useState<string>('featured');
  const [selectedArtist, setSelectedArtist] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filterOptions = ['all', 'The Beatles', 'Pink Floyd', 'Taylor Swift', 'Mac Miller', 'John Coltrane', 'Miles Davis'];

  const allProducts = useSelector((state: RootState) => state.products.items);
  const filteredProducts = useMemo(() => {
    let result = allProducts.filter(p => p.category === 'vinyl');

    if (searchQuery.trim()) {
      result = result.filter((p) =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.artist.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedArtist !== 'all') {
      result = result.filter((p) => p.artist === selectedArtist);
    }

    if (sortOrder === 'price-low') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortOrder === 'price-high') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortOrder === 'az') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    }

    return result;
  }, [allProducts, sortOrder, selectedArtist, searchQuery]);

  return (
    <div className="flex-grow bg-white">
      <div className="max-w-[1400px] mx-auto px-6 pt-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold uppercase tracking-[0.2em] font-display mb-4">Vinyl</h1>
          <p className="text-[11px] text-gray-500 uppercase tracking-[0.3em]">Discover our full collection</p>
        </div>

        <ProductFilterBar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          sortOrder={sortOrder}
          onSortChange={setSortOrder}
          filterOptions={filterOptions}
          selectedFilter={selectedArtist}
          onFilterSelect={setSelectedArtist}
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
    </div>
  );
};

export default Vinyl;