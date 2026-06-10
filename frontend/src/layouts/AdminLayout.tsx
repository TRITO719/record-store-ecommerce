import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  LogOut,
  Disc3,
  BarChart3,
  ChevronDown,
  DollarSign,
  ShoppingBag,
  UserCheck,
  Boxes,
} from 'lucide-react';
import { useDispatch } from 'react-redux';
import { adminLogout } from '../store/userSlice';
import toast from 'react-hot-toast';

const AdminLayout: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [statsOpen, setStatsOpen] = useState(
    location.pathname.startsWith('/admin/statistics')
  );

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    dispatch(adminLogout());
    toast.success('Đã đăng xuất admin', { duration: 2000 });
    navigate('/');
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: <LayoutDashboard size={18} /> },
    { name: 'Sản phẩm', path: '/admin/products', icon: <Package size={18} /> },
    { name: 'Đơn hàng', path: '/admin/orders', icon: <ShoppingCart size={18} /> },
    { name: 'Khách hàng', path: '/admin/users', icon: <Users size={18} /> },
  ];

  const statsItems = [
    { name: 'Doanh thu', path: '/admin/statistics/revenue', icon: <DollarSign size={15} /> },
    { name: 'Đơn hàng', path: '/admin/statistics/orders', icon: <ShoppingBag size={15} /> },
    { name: 'Sản phẩm', path: '/admin/statistics/products', icon: <Package size={15} /> },
    { name: 'Khách hàng', path: '/admin/statistics/users', icon: <UserCheck size={15} /> },
    { name: 'Kho hàng', path: '/admin/statistics/inventory', icon: <Boxes size={15} /> },
  ];

  const isStatsActive = location.pathname.startsWith('/admin/statistics');

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-secondary)', fontFamily: 'Inter, DM Sans, system-ui, sans-serif' }}>
      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside style={{
        width: 240,
        background: 'var(--bg-card)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        overflow: 'hidden',
      }}>
        {/* Logo */}
        <div
          onClick={() => window.open('/', '_blank')}
          title="Mở trang chủ (tab mới)"
          style={{
            padding: '20px 20px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            cursor: 'pointer',
          }}
        >
          <Disc3 size={28} strokeWidth={1.5} style={{ color: 'var(--text-primary)' }} />
          <div>
            <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800, fontSize: 16, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              Record Store
            </p>
            <p style={{ fontSize: 9, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
              Admin Panel
            </p>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.path === '/admin'}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 12px',
                borderRadius: 8,
                textDecoration: 'none',
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: '0.01em',
                color: isActive ? 'var(--text-inverse)' : 'var(--text-secondary)',
                background: isActive ? 'var(--text-primary)' : 'transparent',
                transition: 'all 0.15s ease',
              })}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                if (el.style.background !== 'var(--text-primary)') {
                  el.style.background = 'var(--bg-secondary)';
                  el.style.color = 'var(--text-primary)';
                }
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                if (el.style.background !== 'var(--text-primary)') {
                  el.style.background = 'transparent';
                  el.style.color = 'var(--text-secondary)';
                }
              }}
            >
              {item.icon}
              <span>{item.name}</span>
            </NavLink>
          ))}

          {/* ── Statistics Group ────────────────────────────────────────────── */}
          <div style={{ marginTop: 8 }}>
            <div style={{ padding: '0 4px 4px', marginBottom: 2 }}>
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Analytics
              </span>
            </div>

            {/* Statistics toggle */}
            <button
              onClick={() => setStatsOpen((o) => !o)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 12px',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
                color: isStatsActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                background: isStatsActive ? 'var(--bg-secondary)' : 'transparent',
                fontFamily: 'inherit',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (!isStatsActive) {
                  (e.currentTarget as HTMLElement).style.background = 'var(--bg-secondary)';
                  (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isStatsActive) {
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                  (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
                }
              }}
            >
              <BarChart3 size={18} style={{ color: isStatsActive ? '#1db954' : 'inherit' }} />
              <span style={{ flex: 1, textAlign: 'left' }}>Thống kê</span>
              <ChevronDown
                size={14}
                style={{
                  transition: 'transform 0.25s ease',
                  transform: statsOpen ? 'rotate(180deg)' : 'none',
                  color: 'var(--text-muted)',
                }}
              />
            </button>

            {/* Submenu with smooth animation */}
            <div
              style={{
                overflow: 'hidden',
                maxHeight: statsOpen ? '280px' : '0px',
                transition: 'max-height 0.3s cubic-bezier(0.4,0,0.2,1)',
              }}
            >
              <div style={{ padding: '4px 0 4px 14px', display: 'flex', flexDirection: 'column', gap: 1 }}>
                {statsItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    style={({ isActive }) => ({
                      display: 'flex',
                      alignItems: 'center',
                      gap: 9,
                      padding: '7px 10px',
                      borderRadius: 6,
                      textDecoration: 'none',
                      fontSize: 12.5,
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? '#1db954' : 'var(--text-secondary)',
                      background: isActive ? 'rgba(29,185,84,0.1)' : 'transparent',
                      borderLeft: isActive ? '2px solid #1db954' : '2px solid transparent',
                      transition: 'all 0.15s ease',
                    })}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget as HTMLElement;
                      if (!el.style.color.includes('29,185,84') && el.style.color !== 'rgb(29, 185, 84)') {
                        el.style.background = 'var(--bg-secondary)';
                        el.style.color = 'var(--text-primary)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget as HTMLElement;
                      const isActive = el.style.borderLeftColor === 'rgb(29, 185, 84)';
                      el.style.background = isActive ? 'rgba(29,185,84,0.1)' : 'transparent';
                      el.style.color = isActive ? '#1db954' : 'var(--text-secondary)';
                    }}
                  >
                    <span style={{ opacity: 0.7 }}>{item.icon}</span>
                    {item.name}
                  </NavLink>
                ))}
              </div>
            </div>
          </div>
        </nav>

        {/* Logout */}
        <div style={{ padding: '12px 10px', borderTop: '1px solid var(--border)' }}>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '9px 12px',
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
              color: '#ef4444',
              background: 'transparent',
              fontFamily: 'inherit',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
          >
            <LogOut size={18} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* ── Main Content ─────────────────────────────────────────────────────── */}
      <main style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-secondary)' }}>
        <div style={{ padding: '32px 36px', minHeight: '100%' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;