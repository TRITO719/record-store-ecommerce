import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Search, User, X } from 'lucide-react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import type { Product } from '../types';



const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const cartItems = useSelector((state: RootState) => state.cart.items);
  const cartItemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
    if (isSearchOpen) setSearchQuery('');
  };

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  const allProducts = useSelector((state: RootState) => state.products.items);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSuggestions([]);
      return;
    }
    const filtered = allProducts.filter(p => 
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.artist.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setSuggestions(filtered);
  }, [searchQuery, allProducts]);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-rs-border px-8 py-5">
      <div className="max-w-[1600px] mx-auto flex justify-between items-center relative h-8">
        
        <div className="flex items-center gap-6 w-1/3 z-20">
          <button 
            onClick={toggleSearch} 
            className={`hover:opacity-50 transition-all duration-300 ${isSearchOpen ? 'text-black' : ''}`}
          >
            <Search size={20} strokeWidth={1.2} />
          </button>
          
          <nav className={`hidden lg:flex gap-6 transition-opacity duration-300 ${isSearchOpen ? 'opacity-0 invisible' : 'opacity-100 visible'}`}>
            <Link to="/vinyl" className="nav-link hover:opacity-50 transition-opacity">VINYL</Link>
            <Link to="/cd" className="nav-link hover:opacity-50 transition-opacity">CDs</Link>
            <Link to="/merch" className="nav-link hover:opacity-50 transition-opacity">MERCH</Link>
          </nav>
        </div>

        <div className={`w-1/3 flex justify-center transition-opacity duration-300 ${isSearchOpen ? 'opacity-0 invisible' : 'opacity-100 visible'}`}>
          <Link to="/" className="text-2xl font-bold tracking-[0.3em] font-display">RECORD STORE</Link>
        </div>

        <div className={`w-1/3 flex justify-end items-center gap-6 transition-opacity duration-300 ${isSearchOpen ? 'opacity-0 invisible' : 'opacity-100 visible'}`}>
          <Link to="/account"><User size={20} strokeWidth={1.2} /></Link>
          <Link to="/cart" className="flex items-center gap-2">
            <div className="relative">
              <ShoppingBag size={20} strokeWidth={1.2} />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-black text-white text-[8px] w-3.5 h-3.5 flex items-center justify-center rounded-full font-bold">
                  {cartItemCount}
                </span>
              )}
            </div>
          </Link>
        </div>

        <div className={`absolute left-10 right-0 h-full bg-white flex items-center z-10 transition-all duration-300 ease-in-out ${isSearchOpen ? 'opacity-100 visible translate-x-0' : 'opacity-0 invisible -translate-x-4'}`}>
          <div className="w-full flex items-center gap-4 pl-2">
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="TÌM KIẾM THEO TÊN ALBUM HOẶC NGHỆ SĨ..."
              className="flex-grow text-sm font-sans tracking-widest uppercase focus:outline-none"
            />
            <button 
              onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={18} strokeWidth={1.5} />
            </button>
          </div>

          {suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 bg-white border-x border-b border-rs-border shadow-2xl max-h-[400px] overflow-y-auto z-50">
              {suggestions.map((product) => (
                <button
                  key={product.id}
                  onClick={() => {
                    navigate(`/product/${product.id}`);
                    setIsSearchOpen(false);
                    setSearchQuery('');
                  }}
                  className="w-full flex items-center gap-4 p-4 hover:bg-rs-gray-light border-b border-rs-border last:border-0 transition-colors"
                >
                  <img src={product.imgUrl} alt={product.title} className="w-12 h-12 object-cover bg-gray-100" />
                  <div className="text-left">
                    <p className="text-[10px] font-bold uppercase tracking-wider">{product.title}</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">{product.artist}</p>
                  </div>
                  <span className="ml-auto text-[10px] font-bold">${product.price.toFixed(2)}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;