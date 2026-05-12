import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  User as UserIcon, Package, MapPin, Lock, Settings, LogOut,
  Plus, Edit2, Trash2, Star, ChevronRight, Eye,
  EyeOff, CheckCircle, AlertCircle, Clock, Truck,
  XCircle, Home, Briefcase, Check, X, LayoutDashboard,
} from 'lucide-react';
import { login, logout, updateProfile as updateReduxProfile } from '../store/userSlice';
import type { RootState } from '../store';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAccount, type SavedAddress } from '../context/AccountContext';

// ─── Helpers ──────────────────────────────────────────────────────────────────

type Tab = 'overview' | 'profile' | 'orders' | 'addresses' | 'security' | 'settings';

const ORDER_STATUS_CONFIG = {
  PENDING:    { label: 'Chờ xác nhận', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', icon: <Clock size={13} /> },
  PROCESSING: { label: 'Đang xử lý',   color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', icon: <AlertCircle size={13} /> },
  SHIPPED:    { label: 'Đang giao',    color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', icon: <Truck size={13} /> },
  COMPLETED:  { label: 'Đã giao',      color: '#1db954', bg: 'rgba(29,185,84,0.12)',  icon: <CheckCircle size={13} /> },
  CANCELLED:  { label: 'Đã hủy',       color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  icon: <XCircle size={13} /> },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatusBadge: React.FC<{ status: keyof typeof ORDER_STATUS_CONFIG }> = ({ status }) => {
  const cfg = ORDER_STATUS_CONFIG[status] || ORDER_STATUS_CONFIG.PENDING;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 'var(--radius-full)',
      fontSize: 11, fontWeight: 700,
      color: cfg.color, background: cfg.bg,
      border: `1px solid ${cfg.color}33`,
    }}>
      {cfg.icon} {cfg.label}
    </span>
  );
};

const FormField: React.FC<{
  label: string;
  value: string;
  onChange?: (v: string) => void;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  suffix?: React.ReactNode;
}> = ({ label, value, onChange, type = 'text', placeholder, disabled, error, suffix }) => (
  <div>
    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 7 }}>
      {label}
    </label>
    <div style={{ position: 'relative' }}>
      <input
        type={type}
        value={value}
        onChange={e => onChange?.(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        style={{
          width: '100%',
          background: disabled ? 'var(--bg-secondary)' : 'var(--bg-card)',
          border: `1.5px solid ${error ? 'var(--warm-rose)' : 'var(--border)'}`,
          borderRadius: 'var(--radius-md)',
          padding: suffix ? '11px 44px 11px 14px' : '11px 14px',
          fontSize: 14,
          color: disabled ? 'var(--text-muted)' : 'var(--text-primary)',
          outline: 'none',
          fontFamily: 'var(--font-sans)',
          transition: 'border-color 0.2s',
          cursor: disabled ? 'not-allowed' : 'auto',
        }}
        onFocus={e => { if (!disabled) e.target.style.borderColor = 'var(--accent)'; }}
        onBlur={e => { e.target.style.borderColor = error ? 'var(--warm-rose)' : 'var(--border)'; }}
      />
      {suffix && <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}>{suffix}</div>}
    </div>
    {error && <p style={{ fontSize: 11, color: 'var(--warm-rose)', marginTop: 5 }}>{error}</p>}
  </div>
);

const SectionCard: React.FC<{ children: React.ReactNode; title?: string; subtitle?: string; action?: React.ReactNode }> = ({ children, title, subtitle, action }) => (
  <div style={{
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-xl)',
    overflow: 'hidden',
  }}>
    {(title || action) && (
      <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div>
          {title && <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>{title}</h3>}
          {subtitle && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>{subtitle}</p>}
        </div>
        {action}
      </div>
    )}
    <div style={{ padding: '24px' }}>{children}</div>
  </div>
);

// ─── Tab: Overview ────────────────────────────────────────────────────────────

const OverviewTab: React.FC<{ setTab: (t: Tab) => void }> = ({ setTab }) => {
  const { profile, orders, addresses, ordersLoading } = useAccount();
  const { profile: reduxProfile } = useSelector((s: RootState) => s.user);

  const stats = [
    { label: 'Tổng đơn hàng', value: orders.length, icon: <Package size={20} />, color: 'var(--accent)' },
    { label: 'Đã giao thành công', value: orders.filter(o => o.status === 'COMPLETED').length, icon: <CheckCircle size={20} />, color: '#1db954' },
    { label: 'Đang xử lý', value: orders.filter(o => ['PENDING','PROCESSING','SHIPPED'].includes(o.status)).length, icon: <Clock size={20} />, color: '#f59e0b' },
    { label: 'Địa chỉ đã lưu', value: addresses.length, icon: <MapPin size={20} />, color: '#8b5cf6' },
  ];

  const recentOrders = [...orders].slice(0, 3);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Welcome */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(29,185,84,0.12) 0%, rgba(139,92,246,0.06) 100%)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)',
        padding: '28px 28px',
        display: 'flex',
        alignItems: 'center',
        gap: 20,
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-dim) 100%)',
          color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-display)', flexShrink: 0,
        }}>
          {profile?.avatarInitials || 'U'}
        </div>
        <div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Xin chào trở lại 👋</p>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, color: 'var(--text-primary)', marginBottom: 4 }}>
            {profile?.fullName || 'Khách hàng'}
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{profile?.email}</p>
        </div>
        {reduxProfile?.role?.toUpperCase() === 'ADMIN' && (
          <div style={{ marginLeft: 'auto' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', borderRadius: 'var(--radius-full)',
              background: 'var(--accent-soft)', color: 'var(--accent)',
              fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
              border: '1px solid rgba(29,185,84,0.3)',
            }}>
              <LayoutDashboard size={12} /> ADMIN
            </span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {stats.map((s, i) => (
          <div key={i} style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}>
            <div style={{ color: s.color, opacity: 0.8 }}>{s.icon}</div>
            <div>
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, color: 'var(--text-primary)', lineHeight: 1 }}>{s.value}</p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent orders */}
      <SectionCard
        title="Đơn hàng gần đây"
        action={
          <button onClick={() => setTab('orders')} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
            Xem tất cả <ChevronRight size={14} />
          </button>
        }
      >
        {ordersLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[0,1,2].map(i => <div key={i} className="skeleton" style={{ height: 60, borderRadius: 'var(--radius-md)' }} />)}
          </div>
        ) : recentOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <Package size={36} style={{ color: 'var(--text-muted)', marginBottom: 10 }} strokeWidth={1} />
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Chưa có đơn hàng nào</p>
            <button onClick={() => window.location.href = '/vinyl'} style={{ marginTop: 12, fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
              Bắt đầu mua sắm →
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {recentOrders.map(order => (
              <div key={order.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', cursor: 'pointer' }} onClick={() => setTab('orders')}>
                <Package size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>#{order.id.split('-')[0].toUpperCase()}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(order.createdAt).toLocaleDateString('vi-VN')} · {order.orderItems.length} sản phẩm</p>
                </div>
                <StatusBadge status={order.status} />
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>${order.totalAmount.toFixed(2)}</span>
                <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Quick actions */}
      <SectionCard title="Thao tác nhanh">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {[
            { icon: <UserIcon size={18} />, label: 'Cập nhật thông tin', tab: 'profile' as Tab },
            { icon: <MapPin size={18} />, label: 'Quản lý địa chỉ', tab: 'addresses' as Tab },
            { icon: <Lock size={18} />, label: 'Đổi mật khẩu', tab: 'security' as Tab },
          ].map((item, i) => (
            <button
              key={i}
              onClick={() => setTab(item.tab)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '20px 16px', borderRadius: 'var(--radius-lg)',
                background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'var(--font-sans)',
                fontSize: 13, fontWeight: 500, transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.background = 'var(--accent-soft)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'var(--bg-secondary)'; }}
            >
              {item.icon}
              <span style={{ textAlign: 'center', lineHeight: 1.3 }}>{item.label}</span>
            </button>
          ))}
        </div>
      </SectionCard>
    </div>
  );
};

// ─── Tab: Profile ─────────────────────────────────────────────────────────────

const ProfileTab: React.FC = () => {
  const dispatch = useDispatch();
  const { profile: reduxProfile } = useSelector((s: RootState) => s.user);
  const { updateProfile } = useAccount();
  const [fullName, setFullName] = useState(reduxProfile?.name || '');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!fullName.trim()) e.fullName = 'Vui lòng nhập họ tên';
    if (phone && !/^(0|\+84)[0-9]{9,10}$/.test(phone.replace(/\s/g, ''))) e.phone = 'Số điện thoại không hợp lệ';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    await new Promise(r => setTimeout(r, 600)); // simulate API
    dispatch(updateReduxProfile({ name: fullName }));
    updateProfile({ fullName, phone });
    toast.success('Thông tin đã được cập nhật');
    setSaving(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <SectionCard title="Thông tin cá nhân" subtitle="Cập nhật thông tin hồ sơ của bạn">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <FormField label="Họ và tên" value={fullName} onChange={setFullName} placeholder="Nguyễn Văn A" error={errors.fullName} />
          </div>
          <FormField label="Email" value={reduxProfile?.email || ''} disabled />
          <FormField label="Số điện thoại" value={phone} onChange={setPhone} type="tel" placeholder="0901234567" error={errors.phone} />
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'var(--accent)', color: '#000',
            border: 'none', borderRadius: 'var(--radius-full)',
            padding: '11px 24px', fontSize: 13, fontWeight: 700,
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.7 : 1,
            fontFamily: 'var(--font-sans)',
            transition: 'all 0.2s',
          }}
        >
          {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
        </button>
      </SectionCard>

      <SectionCard title="Thông tin tài khoản" subtitle="Thông tin không thể thay đổi">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
            <div>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>Email đăng nhập</p>
              <p style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 600 }}>{reduxProfile?.email}</p>
            </div>
            <span style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.06em' }}>ĐÃ XÁC NHẬN</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
            <div>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>Vai trò</p>
              <p style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 600 }}>{reduxProfile?.role === 'ADMIN' ? 'Quản trị viên' : 'Khách hàng'}</p>
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
};

// ─── Tab: Orders ──────────────────────────────────────────────────────────────

const OrdersTab: React.FC = () => {
  const { orders, ordersLoading } = useAccount();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (ordersLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {[0,1,2].map(i => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 'var(--radius-lg)' }} />)}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <SectionCard>
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Package size={52} style={{ color: 'var(--text-muted)', marginBottom: 16 }} strokeWidth={1} />
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-primary)', marginBottom: 8 }}>Chưa có đơn hàng nào</h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>Hãy khám phá bộ sưu tập của chúng tôi</p>
          <a href="/vinyl" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--accent)', color: '#000', borderRadius: 'var(--radius-full)', padding: '11px 24px', textDecoration: 'none', fontWeight: 700, fontSize: 13 }}>
            Mua sắm ngay
          </a>
        </div>
      </SectionCard>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {orders.map(order => {
        const isExpanded = expandedId === order.id;
        return (
          <div key={order.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', overflow: 'hidden', transition: 'border-color 0.2s' }}>
            {/* Order header */}
            <div
              onClick={() => setExpandedId(isExpanded ? null : order.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 22px', cursor: 'pointer' }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5, flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>
                    #{order.id.split('-')[0].toUpperCase()}
                  </span>
                  <StatusBadge status={order.status} />
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {new Date(order.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  {' · '}{order.orderItems.length} sản phẩm
                </p>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: 'var(--text-primary)' }}>${order.totalAmount.toFixed(2)}</p>
              </div>
              <ChevronRight size={16} style={{ color: 'var(--text-muted)', transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
            </div>

            {/* Order details */}
            {isExpanded && (
              <div style={{ borderTop: '1px solid var(--border)', padding: '18px 22px' }}>
                {order.shippingAddr && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 16, padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                    <MapPin size={14} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Địa chỉ giao hàng</p>
                      <p style={{ fontSize: 13, color: 'var(--text-primary)' }}>{order.shippingAddr}</p>
                    </div>
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {order.orderItems.map(item => (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <img
                        src={item.product?.imgUrl}
                        alt={item.product?.title}
                        style={{ width: 48, height: 48, borderRadius: 'var(--radius-sm)', objectFit: 'cover', border: '1px solid var(--border)', flexShrink: 0 }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.product?.title || `Sản phẩm #${item.productId}`}
                        </p>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.product?.artist} · x{item.quantity}</p>
                      </div>
                      <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', flexShrink: 0 }}>
                        ${(item.priceAtTime * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 6, alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Tổng cộng:</span>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: 'var(--text-primary)' }}>${order.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ─── Tab: Addresses ───────────────────────────────────────────────────────────

const LABEL_ICONS: Record<string, React.ReactNode> = {
  'Nhà riêng': <Home size={14} />,
  'Văn phòng': <Briefcase size={14} />,
};

const AddressCard: React.FC<{
  addr: SavedAddress;
  onEdit: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
}> = ({ addr, onEdit, onDelete, onSetDefault }) => (
  <div style={{
    border: `1.5px solid ${addr.isDefault ? 'var(--accent)' : 'var(--border)'}`,
    borderRadius: 'var(--radius-lg)',
    padding: '18px 20px',
    background: addr.isDefault ? 'var(--accent-soft)' : 'var(--bg-card)',
    position: 'relative',
    transition: 'border-color 0.2s',
  }}>
    {addr.isDefault && (
      <div style={{ position: 'absolute', top: 14, right: 14 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, color: 'var(--accent)', background: 'var(--accent-soft)', padding: '3px 9px', borderRadius: 'var(--radius-full)', border: '1px solid rgba(29,185,84,0.3)' }}>
          <Star size={10} fill="currentColor" /> Mặc định
        </span>
      </div>
    )}
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
      <span style={{ color: 'var(--text-muted)' }}>{LABEL_ICONS[addr.label] || <MapPin size={14} />}</span>
      <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{addr.label}</span>
    </div>
    <p style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 600, marginBottom: 4 }}>{addr.fullName}</p>
    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 3 }}>{addr.phone}</p>
    <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>{addr.address}, {addr.city}</p>
    <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
      {!addr.isDefault && (
        <button onClick={onSetDefault} style={{ fontSize: 11, color: 'var(--accent)', background: 'none', border: '1px solid var(--accent)', borderRadius: 'var(--radius-full)', padding: '4px 12px', cursor: 'pointer', fontWeight: 600, fontFamily: 'var(--font-sans)' }}>
          Đặt mặc định
        </button>
      )}
      <button onClick={onEdit} style={{ fontSize: 11, color: 'var(--text-secondary)', background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius-full)', padding: '4px 12px', cursor: 'pointer', fontWeight: 600, fontFamily: 'var(--font-sans)', display: 'flex', alignItems: 'center', gap: 4 }}>
        <Edit2 size={11} /> Sửa
      </button>
      <button onClick={onDelete} style={{ fontSize: 11, color: 'var(--warm-rose)', background: 'none', border: '1px solid rgba(244,63,94,0.3)', borderRadius: 'var(--radius-full)', padding: '4px 12px', cursor: 'pointer', fontWeight: 600, fontFamily: 'var(--font-sans)', display: 'flex', alignItems: 'center', gap: 4 }}>
        <Trash2 size={11} /> Xóa
      </button>
    </div>
  </div>
);

const AddressForm: React.FC<{
  initial?: Partial<SavedAddress>;
  onSave: (data: Omit<SavedAddress, 'id'>) => void;
  onCancel: () => void;
}> = ({ initial, onSave, onCancel }) => {
  const [form, setForm] = useState({
    label: initial?.label || 'Nhà riêng',
    fullName: initial?.fullName || '',
    phone: initial?.phone || '',
    address: initial?.address || '',
    city: initial?.city || '',
    isDefault: initial?.isDefault || false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (k: string, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.fullName.trim()) e.fullName = 'Nhập họ tên';
    if (!form.phone.trim()) e.phone = 'Nhập số điện thoại';
    if (!form.address.trim()) e.address = 'Nhập địa chỉ';
    if (!form.city.trim()) e.city = 'Nhập thành phố';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSave(form);
  };

  return (
    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '22px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 7 }}>Nhãn địa chỉ</label>
          <select value={form.label} onChange={e => set('label', e.target.value)} style={{ width: '100%', background: 'var(--bg-card)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '11px 14px', fontSize: 14, color: 'var(--text-primary)', outline: 'none', fontFamily: 'var(--font-sans)' }}>
            <option>Nhà riêng</option>
            <option>Văn phòng</option>
            <option>Khác</option>
          </select>
        </div>
        <FormField label="Họ và tên" value={form.fullName} onChange={v => set('fullName', v)} placeholder="Nguyễn Văn A" error={errors.fullName} />
        <FormField label="Số điện thoại" value={form.phone} onChange={v => set('phone', v)} placeholder="0901234567" error={errors.phone} />
        <FormField label="Thành phố" value={form.city} onChange={v => set('city', v)} placeholder="TP.HCM" error={errors.city} />
        <div style={{ gridColumn: '1 / -1' }}>
          <FormField label="Địa chỉ" value={form.address} onChange={v => set('address', v)} placeholder="123 Đường ABC, Quận 1" error={errors.address} />
        </div>
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 16 }}>
        <input type="checkbox" checked={form.isDefault} onChange={e => set('isDefault', e.target.checked)} style={{ accentColor: 'var(--accent)', width: 15, height: 15 }} />
        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Đặt làm địa chỉ mặc định</span>
      </label>
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={handleSubmit} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--accent)', color: '#000', border: 'none', borderRadius: 'var(--radius-full)', padding: '10px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
          <Check size={14} /> Lưu địa chỉ
        </button>
        <button onClick={onCancel} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius-full)', padding: '10px 20px', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
          <X size={14} /> Hủy
        </button>
      </div>
    </div>
  );
};

const AddressesTab: React.FC = () => {
  const { addresses, addAddress, updateAddress, deleteAddress, setDefaultAddress } = useAccount();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleSave = (data: Omit<SavedAddress, 'id'>) => {
    if (editingId) {
      updateAddress(editingId, data);
      setEditingId(null);
    } else {
      addAddress(data);
      setShowForm(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-primary)' }}>Địa chỉ giao hàng</h2>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>Quản lý các địa chỉ giao hàng của bạn</p>
        </div>
        {!showForm && !editingId && (
          <button onClick={() => setShowForm(true)} style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'var(--accent)', color: '#000', border: 'none', borderRadius: 'var(--radius-full)', padding: '10px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
            <Plus size={15} /> Thêm địa chỉ
          </button>
        )}
      </div>

      {showForm && !editingId && (
        <div style={{ marginBottom: 20 }}>
          <AddressForm onSave={handleSave} onCancel={() => setShowForm(false)} />
        </div>
      )}

      {addresses.length === 0 && !showForm ? (
        <div style={{ textAlign: 'center', padding: '60px 0', border: '1px dashed var(--border)', borderRadius: 'var(--radius-xl)' }}>
          <MapPin size={42} style={{ color: 'var(--text-muted)', marginBottom: 14 }} strokeWidth={1} />
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--text-primary)', marginBottom: 8 }}>Chưa có địa chỉ nào</h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 18 }}>Thêm địa chỉ để thanh toán nhanh hơn</p>
          <button onClick={() => setShowForm(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'var(--accent)', color: '#000', border: 'none', borderRadius: 'var(--radius-full)', padding: '11px 22px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
            <Plus size={15} /> Thêm địa chỉ đầu tiên
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
          {addresses.map(addr => (
            <div key={addr.id}>
              {editingId === addr.id ? (
                <AddressForm initial={addr} onSave={handleSave} onCancel={() => setEditingId(null)} />
              ) : (
                <AddressCard
                  addr={addr}
                  onEdit={() => setEditingId(addr.id)}
                  onDelete={() => setDeleteConfirmId(addr.id)}
                  onSetDefault={() => setDefaultAddress(addr.id)}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirmId && (
        <div onClick={() => setDeleteConfirmId(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)', padding: '32px 28px', maxWidth: 340, width: '100%', border: '1px solid var(--border)', boxShadow: 'var(--shadow-xl)', textAlign: 'center' }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(244,63,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Trash2 size={22} style={{ color: 'var(--warm-rose)' }} />
            </div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Xóa địa chỉ?</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>Hành động này không thể hoàn tác.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setDeleteConfirmId(null)} style={{ flex: 1, padding: '11px', borderRadius: 'var(--radius-full)', background: 'var(--bg-secondary)', border: '1px solid var(--border)', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>Hủy</button>
              <button onClick={() => { deleteAddress(deleteConfirmId); setDeleteConfirmId(null); }} style={{ flex: 1, padding: '11px', borderRadius: 'var(--radius-full)', background: 'var(--warm-rose)', border: 'none', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>Xóa</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Tab: Security ────────────────────────────────────────────────────────────

const SecurityTab: React.FC = () => {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!current) e.current = 'Nhập mật khẩu hiện tại';
    if (!next || next.length < 8) e.next = 'Mật khẩu mới ít nhất 8 ký tự';
    if (next !== confirm) e.confirm = 'Mật khẩu xác nhận không khớp';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    await new Promise(r => setTimeout(r, 800));
    toast.success('Mật khẩu đã được thay đổi');
    setCurrent(''); setNext(''); setConfirm('');
    setSaving(false);
  };

  const EyeToggle: React.FC<{ show: boolean; toggle: () => void }> = ({ show, toggle }) => (
    <button onClick={toggle} type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 0 }}>
      {show ? <EyeOff size={15} /> : <Eye size={15} />}
    </button>
  );

  return (
    <SectionCard title="Đổi mật khẩu" subtitle="Để bảo mật, hãy dùng mật khẩu mạnh">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 420 }}>
        <FormField label="Mật khẩu hiện tại" value={current} onChange={setCurrent} type={showCurrent ? 'text' : 'password'} placeholder="••••••••" error={errors.current} suffix={<EyeToggle show={showCurrent} toggle={() => setShowCurrent(s => !s)} />} />
        <FormField label="Mật khẩu mới" value={next} onChange={setNext} type={showNext ? 'text' : 'password'} placeholder="Tối thiểu 8 ký tự" error={errors.next} suffix={<EyeToggle show={showNext} toggle={() => setShowNext(s => !s)} />} />
        <FormField label="Xác nhận mật khẩu mới" value={confirm} onChange={setConfirm} type="password" placeholder="••••••••" error={errors.confirm} />

        {next && (
          <div style={{ display: 'flex', gap: 4, marginTop: -8 }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: next.length > i * 2 ? (next.length >= 8 ? 'var(--accent)' : '#f59e0b') : 'var(--border)', transition: 'background 0.3s' }} />
            ))}
          </div>
        )}

        <button onClick={handleSave} disabled={saving} style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 8, background: 'var(--accent)', color: '#000', border: 'none', borderRadius: 'var(--radius-full)', padding: '11px 24px', fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, fontFamily: 'var(--font-sans)' }}>
          {saving ? 'Đang lưu...' : 'Đổi mật khẩu'}
        </button>
      </div>
    </SectionCard>
  );
};

// ─── Tab: Settings ────────────────────────────────────────────────────────────

const SettingsTab: React.FC = () => {
  const [notifyOrders, setNotifyOrders] = useState(true);
  const [notifyPromos, setNotifyPromos] = useState(false);

  const Toggle: React.FC<{ value: boolean; onChange: (v: boolean) => void }> = ({ value, onChange }) => (
    <button
      onClick={() => onChange(!value)}
      style={{
        width: 44, height: 24, borderRadius: 12,
        background: value ? 'var(--accent)' : 'var(--border)',
        border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0,
      }}
    >
      <div style={{ position: 'absolute', top: 3, left: value ? 22 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.2)', transition: 'left 0.2s' }} />
    </button>
  );

  return (
    <SectionCard title="Cài đặt tài khoản" subtitle="Tùy chỉnh trải nghiệm của bạn">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {[
          { label: 'Thông báo đơn hàng', desc: 'Nhận thông báo về trạng thái đơn hàng', value: notifyOrders, onChange: setNotifyOrders },
          { label: 'Khuyến mãi & Ưu đãi', desc: 'Nhận email về sản phẩm mới và ưu đãi đặc biệt', value: notifyPromos, onChange: setNotifyPromos },
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '18px 0', borderBottom: i < 1 ? '1px solid var(--border)' : 'none' }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>{item.label}</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.desc}</p>
            </div>
            <Toggle value={item.value} onChange={item.onChange} />
          </div>
        ))}
      </div>
    </SectionCard>
  );
};

// ─── Login/Register UI ────────────────────────────────────────────────────────

const AuthPage: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!isLogin && !name.trim()) e.name = 'Nhập họ tên';
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Email không hợp lệ';
    if (!password || password.length < 6) e.password = 'Mật khẩu ít nhất 6 ký tự';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      if (isLogin) {
        const res: any = await api.post('/auth/login', { email, password });
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify({ name: res.user.fullName || 'Khách hàng', email: res.user.email, role: res.user.role }));
        dispatch(login({ name: res.user.fullName || 'Khách hàng', email: res.user.email, role: res.user.role }));
        toast.success('Đăng nhập thành công');
        if (res.user.role?.toUpperCase() === 'ADMIN') navigate('/admin');
      } else {
        await api.post('/auth/register', { email, password, fullName: name });
        toast.success('Đăng ký thành công! Vui lòng đăng nhập.');
        setIsLogin(true);
        setPassword('');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', background: 'var(--bg-primary)' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-dim) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: 'var(--shadow-accent)' }}>
            <UserIcon size={24} color="#000" />
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, color: 'var(--text-primary)', marginBottom: 6 }}>
            {isLogin ? 'Đăng nhập' : 'Tạo tài khoản'}
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {isLogin ? 'Chào mừng trở lại với Classic Records' : 'Tham gia cộng đồng nhạc của chúng tôi'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {!isLogin && (
            <FormField label="Họ và tên" value={name} onChange={setName} placeholder="Nguyễn Văn A" error={errors.name} />
          )}
          <FormField label="Email" value={email} onChange={setEmail} type="email" placeholder="email@example.com" error={errors.email} />
          <FormField label="Mật khẩu" value={password} onChange={setPassword} type={showPw ? 'text' : 'password'} placeholder="••••••••" error={errors.password}
            suffix={
              <button type="button" onClick={() => setShowPw(s => !s)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 0 }}>
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            }
          />

          <button
            type="submit"
            disabled={submitting}
            style={{
              marginTop: 4,
              width: '100%',
              padding: '14px',
              background: 'var(--accent)',
              color: '#000',
              border: 'none',
              borderRadius: 'var(--radius-full)',
              fontSize: 14,
              fontWeight: 700,
              cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.7 : 1,
              fontFamily: 'var(--font-sans)',
              boxShadow: 'var(--shadow-accent)',
              transition: 'all 0.2s',
            }}
          >
            {submitting ? 'Đang xử lý...' : (isLogin ? 'Đăng nhập' : 'Tạo tài khoản')}
          </button>
        </form>

        {/* Toggle */}
        <div style={{ textAlign: 'center', marginTop: 28, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 10 }}>
            {isLogin ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}
          </p>
          <button
            onClick={() => { setIsLogin(l => !l); setErrors({}); }}
            style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}
          >
            {isLogin ? 'Đăng ký ngay →' : '← Quay lại đăng nhập'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main User Page ───────────────────────────────────────────────────────────

const NAV_ITEMS: { tab: Tab; label: string; icon: React.ReactNode }[] = [
  { tab: 'overview',   label: 'Tổng quan',       icon: <LayoutDashboard size={17} /> },
  { tab: 'profile',    label: 'Thông tin',        icon: <UserIcon size={17} /> },
  { tab: 'orders',     label: 'Đơn hàng',         icon: <Package size={17} /> },
  { tab: 'addresses',  label: 'Địa chỉ',          icon: <MapPin size={17} /> },
  { tab: 'security',   label: 'Bảo mật',          icon: <Lock size={17} /> },
  { tab: 'settings',   label: 'Cài đặt',          icon: <Settings size={17} /> },
];

const User: React.FC = () => {
  const { isLoggedIn, profile: reduxProfile } = useSelector((s: RootState) => s.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, orders } = useAccount();

  // Parse tab from URL query
  const searchParams = new URLSearchParams(location.search);
  const urlTab = searchParams.get('tab') as Tab | null;
  const [tab, setTabState] = useState<Tab>(urlTab || 'overview');

  const setTab = (t: Tab) => {
    setTabState(t);
    navigate(`/account?tab=${t}`, { replace: true });
  };

  useEffect(() => {
    if (urlTab && urlTab !== tab) setTabState(urlTab);
  }, [urlTab]);

  if (!isLoggedIn || !reduxProfile) return <AuthPage />;

  const pendingCount = orders.filter(o => o.status === 'PENDING' || o.status === 'PROCESSING').length;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    dispatch(logout());
    toast.success('Đã đăng xuất');
    navigate('/');
  };

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', flexGrow: 1 }}>
      <div className="container-main" style={{ paddingTop: 40, paddingBottom: 80 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 28, alignItems: 'start' }}>
          {/* Sidebar */}
          <aside style={{ position: 'sticky', top: 96 }}>
            {/* Profile card */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '22px', marginBottom: 12, textAlign: 'center' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-dim) 100%)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-display)', margin: '0 auto 12px', boxShadow: 'var(--shadow-accent)' }}>
                {profile?.avatarInitials || 'U'}
              </div>
              <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile?.fullName || 'Khách hàng'}</p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile?.email}</p>
              {reduxProfile?.role?.toUpperCase() === 'ADMIN' && (
                <div style={{ marginTop: 10 }}>
                  <button onClick={() => navigate('/admin')} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 700, color: 'var(--accent)', background: 'var(--accent-soft)', border: '1px solid rgba(29,185,84,0.3)', borderRadius: 'var(--radius-full)', padding: '4px 12px', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
                    <LayoutDashboard size={11} /> Trang Admin
                  </button>
                </div>
              )}
            </div>

            {/* Nav */}
            <nav style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
              {NAV_ITEMS.map((item, i) => {
                const isActive = tab === item.tab;
                return (
                  <button
                    key={item.tab}
                    onClick={() => setTab(item.tab)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '13px 18px',
                      background: isActive ? 'var(--accent-soft)' : 'none',
                      border: 'none',
                      borderBottom: i < NAV_ITEMS.length - 1 ? '1px solid var(--border)' : 'none',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-sans)',
                      fontSize: 13,
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                      transition: 'all 0.15s',
                      textAlign: 'left',
                    }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--bg-secondary)'; }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'none'; }}
                  >
                    <span style={{ color: isActive ? 'var(--accent)' : 'var(--text-muted)', flexShrink: 0 }}>{item.icon}</span>
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {item.tab === 'orders' && pendingCount > 0 && (
                      <span style={{ background: 'var(--accent)', color: '#000', borderRadius: 'var(--radius-full)', padding: '1px 7px', fontSize: 10, fontWeight: 700 }}>{pendingCount}</span>
                    )}
                    {isActive && <ChevronRight size={13} style={{ color: 'var(--accent)', opacity: 0.7 }} />}
                  </button>
                );
              })}

              {/* Logout */}
              <button
                onClick={handleLogout}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '13px 18px',
                  background: 'none',
                  border: 'none',
                  borderTop: '1px solid var(--border)',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 13,
                  fontWeight: 500,
                  color: 'var(--warm-rose)',
                  transition: 'all 0.15s',
                  textAlign: 'left',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(244,63,94,0.06)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <LogOut size={17} style={{ flexShrink: 0 }} />
                Đăng xuất
              </button>
            </nav>
          </aside>

          {/* Main content */}
          <main style={{ minWidth: 0 }}>
            {tab === 'overview'  && <OverviewTab setTab={setTab} />}
            {tab === 'profile'   && <ProfileTab />}
            {tab === 'orders'    && <OrdersTab />}
            {tab === 'addresses' && <AddressesTab />}
            {tab === 'security'  && <SecurityTab />}
            {tab === 'settings'  && <SettingsTab />}
          </main>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .container-main > div[style*="grid-template-columns: 260px"] {
            grid-template-columns: 1fr !important;
          }
          aside { position: static !important; }
        }
        @media (max-width: 640px) {
          aside nav { display: flex; overflow-x: auto; border-radius: var(--radius-lg) !important; }
          aside nav button { flex-shrink: 0; border-bottom: none !important; border-right: 1px solid var(--border); min-width: 120px; }
        }
      `}</style>
    </div>
  );
};

export default User;