import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, Users, LogOut, Disc3 } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { logout } from '../store/userSlice';
import toast from 'react-hot-toast';

const AdminLayout: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    dispatch(logout());
    toast.success('Đã đăng xuất', { duration: 2000 });
    navigate('/');
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: <LayoutDashboard size={18} /> },
    { name: 'Sản phẩm', path: '/admin/products', icon: <Package size={18} /> },
    { name: 'Đơn hàng', path: '/admin/orders', icon: <ShoppingCart size={18} /> },
    { name: 'Khách hàng', path: '/admin/users', icon: <Users size={18} /> },
  ];

  return (
    <div className="flex h-screen bg-rs-gray-light font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-rs-border flex flex-col">
        <div className="p-6 border-b border-rs-border flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
          <Disc3 className="w-8 h-8" strokeWidth={1.5} />
          <div>
            <h1 className="font-display font-bold text-xl uppercase tracking-tighter">Record Store</h1>
            <p className="text-[9px] uppercase tracking-[0.3em] text-gray-500 font-bold">Admin Panel</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.path === '/admin'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 text-sm font-bold uppercase tracking-widest transition-colors ${
                  isActive
                    ? 'bg-black text-white'
                    : 'text-gray-500 hover:bg-rs-gray-light hover:text-black'
                }`
              }
            >
              {item.icon}
              <span className="text-[11px]">{item.name}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-rs-border">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-4 py-3 text-sm font-bold uppercase tracking-widest text-red-500 hover:bg-red-50 transition-colors"
          >
            <LogOut size={18} />
            <span className="text-[11px]">Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-rs-gray-light">
        <div className="p-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
