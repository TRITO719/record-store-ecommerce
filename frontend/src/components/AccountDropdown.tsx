import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  User, Package, MapPin, Lock, LogOut,
  ChevronRight, Settings, LayoutDashboard,
} from 'lucide-react';
import { logout } from '../store/userSlice';
import type { RootState } from '../store';
import { useAccount } from '../context/AccountContext';
import toast from 'react-hot-toast';

interface AccountDropdownProps {
  onNavigate?: (tab: string) => void;
}

const AccountDropdown: React.FC<AccountDropdownProps> = () => {
  const [open, setOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isLoggedIn, profile: reduxProfile } = useSelector((s: RootState) => s.user);
  const { profile, orders } = useAccount();

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    dispatch(logout());
    toast.success('Đã đăng xuất');
    setShowLogoutModal(false);
    setOpen(false);
    navigate('/');
  };

  const go = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  const pendingOrders = orders.filter(o => o.status === 'PENDING' || o.status === 'PROCESSING').length;

  if (!isLoggedIn || !reduxProfile) {
    return (
      <button
        onClick={() => navigate('/account')}
        className="btn btn-icon btn"
        title="Account"
        style={{ position: 'relative' }}
      >
        <User size={18} />
      </button>
    );
  }

  const initials = profile?.avatarInitials || (reduxProfile.name?.charAt(0).toUpperCase()) || 'U';

  return (
    <>
      <div ref={ref} style={{ position: 'relative' }}>
        {/* Trigger */}
        <button
          onClick={() => setOpen(o => !o)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: open ? 'var(--accent-soft)' : 'var(--bg-secondary)',
            border: `1px solid ${open ? 'var(--accent)' : 'var(--border)'}`,
            borderRadius: 'var(--radius-full)',
            padding: '5px 12px 5px 5px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <div style={{
            width: 30,
            height: 30,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-dim) 100%)',
            color: '#000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            fontWeight: 800,
            fontFamily: 'var(--font-display)',
            flexShrink: 0,
          }}>
            {initials}
          </div>
          <span style={{
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--text-primary)',
            maxWidth: 80,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {profile?.fullName?.split(' ')[0] || 'Tài khoản'}
          </span>
          {pendingOrders > 0 && (
            <span style={{
              background: 'var(--warm-rose)',
              color: '#fff',
              borderRadius: '50%',
              width: 16,
              height: 16,
              fontSize: 9,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {pendingOrders}
            </span>
          )}
        </button>

        {/* Dropdown */}
        {open && (
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 10px)',
            right: 0,
            width: 280,
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-xl)',
            zIndex: 500,
            overflow: 'hidden',
            animation: 'fadeUp 0.18s ease both',
          }}>
            {/* User info header */}
            <div style={{
              padding: '16px 18px',
              background: 'var(--bg-secondary)',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}>
              <div style={{
                width: 42,
                height: 42,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-dim) 100%)',
                color: '#000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
                fontWeight: 800,
                fontFamily: 'var(--font-display)',
                flexShrink: 0,
              }}>
                {initials}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {profile?.fullName || 'Tài khoản'}
                </p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {profile?.email}
                </p>
              </div>
            </div>

            {/* Menu items */}
            <div style={{ padding: '8px 0' }}>
              {reduxProfile?.role?.toUpperCase() === 'ADMIN' && (
                <>
                  <DropdownItem icon={<LayoutDashboard size={15} />} label="Admin Dashboard" onClick={() => go('/admin')} accent />
                  <div style={{ height: 1, background: 'var(--border)', margin: '6px 0' }} />
                </>
              )}
              <DropdownItem icon={<User size={15} />} label="Thông tin cá nhân" onClick={() => go('/account?tab=profile')} />
              <DropdownItem
                icon={<Package size={15} />}
                label="Đơn hàng của tôi"
                onClick={() => go('/account?tab=orders')}
                badge={pendingOrders > 0 ? pendingOrders.toString() : undefined}
              />
              <DropdownItem icon={<MapPin size={15} />} label="Địa chỉ đã lưu" onClick={() => go('/account?tab=addresses')} />
              <DropdownItem icon={<Lock size={15} />} label="Bảo mật" onClick={() => go('/account?tab=security')} />
              <DropdownItem icon={<Settings size={15} />} label="Cài đặt tài khoản" onClick={() => go('/account?tab=settings')} />
            </div>

            {/* Logout */}
            <div style={{ padding: '8px', borderTop: '1px solid var(--border)' }}>
              <button
                onClick={() => { setOpen(false); setShowLogoutModal(true); }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 12px',
                  background: 'none',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  color: 'var(--warm-rose)',
                  fontSize: 13,
                  fontWeight: 600,
                  fontFamily: 'var(--font-sans)',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(244,63,94,0.08)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                <LogOut size={15} />
                Đăng xuất
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div
          onClick={() => setShowLogoutModal(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(6px)',
            zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--bg-card)',
              borderRadius: 'var(--radius-xl)',
              padding: '32px 28px',
              maxWidth: 360,
              width: '100%',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-xl)',
              textAlign: 'center',
              animation: 'fadeUp 0.2s ease both',
            }}
          >
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(244,63,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <LogOut size={24} style={{ color: 'var(--warm-rose)' }} />
            </div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-primary)', marginBottom: 8 }}>
              Đăng xuất?
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24, lineHeight: 1.6 }}>
              Bạn có chắc muốn đăng xuất khỏi tài khoản này?
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setShowLogoutModal(false)}
                style={{
                  flex: 1, padding: '12px', borderRadius: 'var(--radius-full)',
                  background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                  color: 'var(--text-primary)', fontWeight: 600, fontSize: 13,
                  cursor: 'pointer', fontFamily: 'var(--font-sans)',
                }}
              >
                Hủy
              </button>
              <button
                onClick={handleLogout}
                style={{
                  flex: 1, padding: '12px', borderRadius: 'var(--radius-full)',
                  background: 'var(--warm-rose)', border: 'none',
                  color: '#fff', fontWeight: 700, fontSize: 13,
                  cursor: 'pointer', fontFamily: 'var(--font-sans)',
                }}
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const DropdownItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  badge?: string;
  accent?: boolean;
}> = ({ icon, label, onClick, badge, accent }) => (
  <button
    onClick={onClick}
    style={{
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '10px 18px',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      fontFamily: 'var(--font-sans)',
      fontSize: 13,
      fontWeight: 500,
      color: accent ? 'var(--accent)' : 'var(--text-primary)',
      transition: 'background 0.15s',
      textAlign: 'left',
    }}
    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-secondary)')}
    onMouseLeave={e => (e.currentTarget.style.background = 'none')}
  >
    <span style={{ color: accent ? 'var(--accent)' : 'var(--text-muted)', flexShrink: 0 }}>{icon}</span>
    <span style={{ flex: 1 }}>{label}</span>
    {badge && (
      <span style={{
        background: 'var(--accent)', color: '#000',
        borderRadius: 'var(--radius-full)',
        padding: '1px 7px', fontSize: 10, fontWeight: 700,
      }}>
        {badge}
      </span>
    )}
    <ChevronRight size={13} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
  </button>
);

export default AccountDropdown;