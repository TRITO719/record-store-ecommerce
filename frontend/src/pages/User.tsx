import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  User as UserIcon,
  Package,
  Lock,
  Settings,
  LogOut,
  ChevronRight,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Clock,
  Truck,
  XCircle,
  Check,
  LayoutDashboard,
  MapPin,
  Mail,
  RefreshCw,
  Shield,
} from 'lucide-react';
import { login, logout, updateProfile as updateReduxProfile } from '../store/userSlice';
import type { RootState } from '../store';
import toast from 'react-hot-toast';
import api from '../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'overview' | 'profile' | 'orders' | 'security' | 'settings';

interface Order {
  id: string;
  status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED';
  totalAmount: number;
  createdAt: string;
  shippingAddr: string;
  customerEmail: string;
  customerPhone: string;
  orderItems: {
    id: number;
    productId: number;
    quantity: number;
    priceAtTime: number;
    product: { id: number; title: string; artist: string; imgUrl: string; category: string };
  }[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ORDER_STATUS_CONFIG = {
  PENDING:    { label: 'Chờ xác nhận', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', icon: <Clock size={13} /> },
  PROCESSING: { label: 'Đang xử lý',   color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', icon: <AlertCircle size={13} /> },
  SHIPPED:    { label: 'Đang giao',    color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', icon: <Truck size={13} /> },
  COMPLETED:  { label: 'Đã giao',      color: '#1db954', bg: 'rgba(29,185,84,0.12)',  icon: <CheckCircle size={13} /> },
  CANCELLED:  { label: 'Đã hủy',       color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  icon: <XCircle size={13} /> },
};

const StatusBadge: React.FC<{ status: keyof typeof ORDER_STATUS_CONFIG }> = ({ status }) => {
  const cfg = ORDER_STATUS_CONFIG[status] ?? ORDER_STATUS_CONFIG.PENDING;
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
        onChange={(e) => onChange?.(e.target.value)}
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
        onFocus={(e) => { if (!disabled) e.target.style.borderColor = 'var(--accent)'; }}
        onBlur={(e) => { e.target.style.borderColor = error ? 'var(--warm-rose)' : 'var(--border)'; }}
      />
      {suffix && (
        <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}>
          {suffix}
        </div>
      )}
    </div>
    {error && <p style={{ fontSize: 11, color: 'var(--warm-rose)', marginTop: 5 }}>{error}</p>}
  </div>
);

const SectionCard: React.FC<{
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}> = ({ children, title, subtitle, action }) => (
  <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
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

const OverviewTab: React.FC<{
  orders: Order[];
  ordersLoading: boolean;
  setTab: (t: Tab) => void;
}> = ({ orders, ordersLoading, setTab }) => {
  const { profile: reduxProfile } = useSelector((s: RootState) => s.user);

  const stats = [
    { label: 'Tổng đơn hàng', value: orders.length, icon: <Package size={20} />, color: 'var(--accent)' },
    { label: 'Đã giao thành công', value: orders.filter((o) => o.status === 'COMPLETED').length, icon: <CheckCircle size={20} />, color: '#1db954' },
    { label: 'Đang xử lý', value: orders.filter((o) => ['PENDING', 'PROCESSING', 'SHIPPED'].includes(o.status)).length, icon: <Clock size={20} />, color: '#f59e0b' },
  ];

  const recentOrders = orders.slice(0, 3);
  const initials = (reduxProfile?.name || 'U').charAt(0).toUpperCase();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Welcome */}
      <div style={{ background: 'linear-gradient(135deg, rgba(29,185,84,0.12) 0%, rgba(139,92,246,0.06) 100%)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '28px', display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-dim) 100%)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-display)', flexShrink: 0 }}>
          {initials}
        </div>
        <div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Xin chào trở lại 👋</p>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, color: 'var(--text-primary)', marginBottom: 4 }}>{reduxProfile?.name || 'Khách hàng'}</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{reduxProfile?.email}</p>
        </div>
        {reduxProfile?.role?.toUpperCase() === 'ADMIN' && (
          <div style={{ marginLeft: 'auto' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 'var(--radius-full)', background: 'var(--accent-soft)', color: 'var(--accent)', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', border: '1px solid rgba(29,185,84,0.3)' }}>
              <LayoutDashboard size={12} /> ADMIN
            </span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {stats.map((s, i) => (
          <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
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
            {[0, 1, 2].map((i) => <div key={i} className="skeleton" style={{ height: 60, borderRadius: 'var(--radius-md)' }} />)}
          </div>
        ) : recentOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <Package size={36} style={{ color: 'var(--text-muted)', marginBottom: 10 }} strokeWidth={1} />
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Chưa có đơn hàng nào</p>
            <button onClick={() => (window.location.href = '/vinyl')} style={{ marginTop: 12, fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
              Bắt đầu mua sắm →
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {recentOrders.map((order) => (
              <div key={order.id} onClick={() => setTab('orders')} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}>
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
            { icon: <Lock size={18} />,    label: 'Đổi mật khẩu',       tab: 'security' as Tab },
            { icon: <Settings size={18} />, label: 'Cài đặt',            tab: 'settings' as Tab },
          ].map((item, i) => (
            <button key={i} onClick={() => setTab(item.tab)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '20px 16px', borderRadius: 'var(--radius-lg)', background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 500, transition: 'all 0.2s ease' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.background = 'var(--accent-soft)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'var(--bg-secondary)'; }}
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

// ─── Tab: Profile (merged with Address) ──────────────────────────────────────

const ProfileTab: React.FC = () => {
  const dispatch = useDispatch();
  const { profile: reduxProfile } = useSelector((s: RootState) => s.user);

  const [fullName, setFullName] = useState(reduxProfile?.name || '');
  const [phone, setPhone] = useState(reduxProfile?.phone || '');
  const [address, setAddress] = useState(reduxProfile?.address || '');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Sync from Redux when profile is hydrated after login
  useEffect(() => {
    if (reduxProfile) {
      setFullName((prev) => prev || reduxProfile.name || '');
      setPhone((prev) => prev || reduxProfile.phone || '');
      setAddress((prev) => prev || reduxProfile.address || '');
    }
  }, [reduxProfile]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!fullName.trim()) e.fullName = 'Vui lòng nhập họ tên';
    if (phone && !/^(0|\+84)[0-9]{9,10}$/.test(phone.replace(/\s/g, '')))
      e.phone = 'Số điện thoại không hợp lệ';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      // Real API call — updates DB via PUT /api/auth/profile
      const result: any = await api.put('/auth/profile', {
        fullName: fullName.trim(),
        phone: phone.trim(),
        address: address.trim(),
      });

      // Update Redux + localStorage so data persists across refreshes
      dispatch(
        updateReduxProfile({
          name: result.user?.fullName || fullName,
          phone: result.user?.phone || phone,
          address: result.user?.address || address,
        }),
      );

      // Persist to localStorage
      const stored = localStorage.getItem('user');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          localStorage.setItem(
            'user',
            JSON.stringify({
              ...parsed,
              name: result.user?.fullName || fullName,
              phone: result.user?.phone || phone,
              address: result.user?.address || address,
            }),
          );
        } catch {/* ignore */}
      }

      toast.success('Thông tin đã được cập nhật');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi khi cập nhật thông tin');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <SectionCard
        title="Thông tin cá nhân & Địa chỉ"
        subtitle="Thông tin này sẽ được tự động điền vào form thanh toán"
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <FormField
              label="Họ và tên"
              value={fullName}
              onChange={setFullName}
              placeholder="Nguyễn Văn A"
              error={errors.fullName}
            />
          </div>
          <FormField
            label="Email"
            value={reduxProfile?.email || ''}
            disabled
          />
          <FormField
            label="Số điện thoại"
            value={phone}
            onChange={setPhone}
            type="tel"
            placeholder="0901234567"
            error={errors.phone}
          />
          <div style={{ gridColumn: '1 / -1' }}>
            <FormField
              label="Địa chỉ giao hàng mặc định"
              value={address}
              onChange={setAddress}
              placeholder="123 Đường ABC, Quận 1, TP.HCM"
            />
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5 }}>
              <MapPin size={10} style={{ display: 'inline', marginRight: 4 }} />
              Địa chỉ này sẽ được dùng mặc định khi thanh toán
            </p>
          </div>
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
          {saving ? 'Đang lưu...' : (
            <><Check size={14} /> Lưu thay đổi</>
          )}
        </button>
      </SectionCard>

      {/* Non-editable account info */}
      <SectionCard title="Thông tin tài khoản" subtitle="Thông tin không thể thay đổi">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { label: 'Email đăng nhập', value: reduxProfile?.email, badge: 'ĐÃ XÁC NHẬN' },
            { label: 'Vai trò', value: reduxProfile?.role === 'ADMIN' ? 'Quản trị viên' : 'Khách hàng' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
              <div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>{item.label}</p>
                <p style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 600 }}>{item.value}</p>
              </div>
              {item.badge && <span style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.06em' }}>{item.badge}</span>}
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
};

// ─── Tab: Orders ──────────────────────────────────────────────────────────────

const OrdersTab: React.FC<{ orders: Order[]; ordersLoading: boolean }> = ({ orders, ordersLoading }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (ordersLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {[0, 1, 2].map((i) => (
          <div key={i} className="skeleton" style={{ height: 80, borderRadius: 'var(--radius-lg)' }} />
        ))}
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
      {orders.map((order) => {
        const isExpanded = expandedId === order.id;
        return (
          <div key={order.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', overflow: 'hidden', transition: 'border-color 0.2s' }}>
            <div onClick={() => setExpandedId(isExpanded ? null : order.id)} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 22px', cursor: 'pointer' }}>
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
                  {order.orderItems.map((item) => (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <img src={item.product?.imgUrl} alt={item.product?.title} style={{ width: 48, height: 48, borderRadius: 'var(--radius-sm)', objectFit: 'cover', border: '1px solid var(--border)', flexShrink: 0 }} />
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
    try {
      await api.put('/auth/password', {
        currentPassword: current,
        newPassword: next,
      });
      toast.success('Mật khẩu đã được thay đổi');
      setCurrent(''); setNext(''); setConfirm('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi khi đổi mật khẩu');
    } finally {
      setSaving(false);
    }
  };

  const EyeToggle: React.FC<{ show: boolean; toggle: () => void }> = ({ show, toggle }) => (
    <button onClick={toggle} type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 0 }}>
      {show ? <EyeOff size={15} /> : <Eye size={15} />}
    </button>
  );

  return (
    <SectionCard title="Đổi mật khẩu" subtitle="Để bảo mật, hãy dùng mật khẩu mạnh">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 420 }}>
        <FormField label="Mật khẩu hiện tại" value={current} onChange={setCurrent} type={showCurrent ? 'text' : 'password'} placeholder="••••••••" error={errors.current} suffix={<EyeToggle show={showCurrent} toggle={() => setShowCurrent((s) => !s)} />} />
        <FormField label="Mật khẩu mới" value={next} onChange={setNext} type={showNext ? 'text' : 'password'} placeholder="Tối thiểu 6 ký tự" error={errors.next} suffix={<EyeToggle show={showNext} toggle={() => setShowNext((s) => !s)} />} />
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
    <button onClick={() => onChange(!value)} style={{ width: 44, height: 24, borderRadius: 12, background: value ? 'var(--accent)' : 'var(--border)', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
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

// ─── OTP Verification Component ───────────────────────────────────────────────

const maskEmail = (email: string): string => {
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local[0]}${local[1]}${'*'.repeat(Math.min(local.length - 2, 6))}@${domain}`;
};

const OtpVerification: React.FC<{
  email: string;
  onVerified: (data: { token: string; user: any }) => void;
  onBack: () => void;
}> = ({ email, onVerified, onBack }) => {
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [error, setError] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleChange = (index: number, value: string) => {
    // Only allow digits
    const digit = value.replace(/\D/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== 6) {
      setError('Vui lòng nhập đủ 6 chữ số');
      return;
    }
    setVerifying(true);
    setError('');
    try {
      const res: any = await api.post('/auth/verify-otp', { email, code });
      toast.success('Xác thực thành công!');
      onVerified({ token: res.token, user: res.user });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Mã OTP không chính xác');
      setOtp(Array(6).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || resending) return;
    setResending(true);
    setError('');
    try {
      await api.post('/auth/resend-otp', { email });
      toast.success('Mã OTP mới đã được gửi');
      setCountdown(60);
      setOtp(Array(6).fill(''));
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể gửi lại OTP');
    } finally {
      setResending(false);
    }
  };

  // Auto-submit when all 6 digits entered
  useEffect(() => {
    if (otp.every((d) => d !== '') && otp.join('').length === 6) {
      handleVerify();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp]);

  return (
    <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', background: 'var(--bg-primary)' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(29,185,84,0.15) 0%, rgba(139,92,246,0.1) 100%)',
            border: '2px solid rgba(29,185,84,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <Shield size={28} style={{ color: 'var(--accent)' }} />
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26, color: 'var(--text-primary)', marginBottom: 8 }}>
            Xác thực email
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Chúng tôi đã gửi mã xác thực 6 số đến
          </p>
          <p style={{
            fontSize: 14, fontWeight: 700, color: 'var(--accent)',
            display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 4,
          }}>
            <Mail size={14} /> {maskEmail(email)}
          </p>
        </div>

        {/* OTP Inputs */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 20 }} onPaste={handlePaste}>
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onFocus={(e) => e.target.select()}
              style={{
                width: 50, height: 58,
                textAlign: 'center',
                fontSize: 22, fontWeight: 800,
                fontFamily: "'Courier New', monospace",
                color: 'var(--text-primary)',
                background: digit ? 'rgba(29,185,84,0.06)' : 'var(--bg-card)',
                border: `2px solid ${error ? 'var(--warm-rose)' : digit ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-lg)',
                outline: 'none',
                transition: 'all 0.2s',
                caretColor: 'var(--accent)',
              }}
            />
          ))}
        </div>

        {/* Error message */}
        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 14px', marginBottom: 16,
            background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)',
            borderRadius: 'var(--radius-md)',
          }}>
            <AlertCircle size={14} style={{ color: 'var(--warm-rose)', flexShrink: 0 }} />
            <p style={{ fontSize: 12, color: 'var(--warm-rose)', fontWeight: 500 }}>{error}</p>
          </div>
        )}

        {/* Verify button */}
        <button
          onClick={handleVerify}
          disabled={verifying || otp.some((d) => !d)}
          style={{
            width: '100%', padding: '14px',
            background: otp.every((d) => d) ? 'var(--accent)' : 'var(--border)',
            color: otp.every((d) => d) ? '#000' : 'var(--text-muted)',
            border: 'none', borderRadius: 'var(--radius-full)',
            fontSize: 14, fontWeight: 700,
            cursor: verifying || otp.some((d) => !d) ? 'not-allowed' : 'pointer',
            opacity: verifying ? 0.7 : 1,
            fontFamily: 'var(--font-sans)',
            boxShadow: otp.every((d) => d) ? 'var(--shadow-accent)' : 'none',
            transition: 'all 0.3s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          {verifying ? (
            <><RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> Đang xác thực...</>
          ) : (
            <><CheckCircle size={14} /> Xác nhận</>
          )}
        </button>

        {/* Resend */}
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          {countdown > 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Gửi lại mã sau <span style={{ color: 'var(--accent)', fontWeight: 700, fontFamily: "'Courier New', monospace" }}>
                {String(Math.floor(countdown / 60)).padStart(2, '0')}:{String(countdown % 60).padStart(2, '0')}
              </span>
            </p>
          ) : (
            <button
              onClick={handleResend}
              disabled={resending}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                fontSize: 13, fontWeight: 600, color: 'var(--accent)',
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                opacity: resending ? 0.6 : 1,
              }}
            >
              <RefreshCw size={13} style={resending ? { animation: 'spin 1s linear infinite' } : undefined} />
              {resending ? 'Đang gửi...' : 'Gửi lại mã OTP'}
            </button>
          )}
        </div>

        {/* Back */}
        <div style={{ textAlign: 'center', marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
          <button
            onClick={onBack}
            style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}
          >
            ← Quay lại đăng nhập
          </button>
        </div>

        {/* Spin animation */}
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
};

// ─── Auth Page ────────────────────────────────────────────────────────────────

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

  // OTP step
  const [otpStep, setOtpStep] = useState(false);
  const [otpEmail, setOtpEmail] = useState('');

  const validate = () => {
    const e: Record<string, string> = {};
    if (!isLogin && !name.trim()) e.name = 'Nhập họ tên';
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Email không hợp lệ';
    if (!password || password.length < 8) e.password = 'Mật khẩu ít nhất 8 ký tự';
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
        const u = res.user;

        // Persist full profile to localStorage
        localStorage.setItem('token', res.token);
        localStorage.setItem(
          'user',
          JSON.stringify({
            id: u.id,
            name: u.fullName || 'Khách hàng',
            email: u.email,
            phone: u.phone || '',
            address: u.address || '',
            role: u.role,
          }),
        );

        dispatch(
          login({
            id: u.id,
            name: u.fullName || 'Khách hàng',
            email: u.email,
            phone: u.phone || '',
            address: u.address || '',
            role: u.role,
          }),
        );

        toast.success('Đăng nhập thành công');
        if (u.role?.toUpperCase() === 'ADMIN') navigate('/admin');
      } else {
        await api.post('/auth/register', { email, password, fullName: name });
        toast.success('Vui lòng kiểm tra email để lấy mã OTP!');
        setOtpEmail(email);
        setOtpStep(true);
      }
    } catch (error: any) {
      // Handle unverified account — redirect to OTP screen
      if (error.response?.status === 403 && error.response?.data?.requireOtp) {
        const unverifiedEmail = error.response.data.email || email;
        toast('Tài khoản chưa xác thực. Vui lòng nhập mã OTP.', { icon: '🔒' });
        setOtpEmail(unverifiedEmail);
        setOtpStep(true);
        // Auto-resend OTP for convenience
        try {
          await api.post('/auth/resend-otp', { email: unverifiedEmail });
          toast.success('Đã gửi lại mã OTP đến email của bạn');
        } catch {
          // Silently ignore resend error (might be in cooldown)
        }
      } else {
        toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Show OTP verification screen
  if (otpStep) {
    return (
      <OtpVerification
        email={otpEmail}
        onVerified={({ token, user: u }) => {
          // Auto-login: persist token + user, dispatch Redux, navigate
          localStorage.setItem('token', token);
          localStorage.setItem(
            'user',
            JSON.stringify({
              id: u.id,
              name: u.fullName || 'Khách hàng',
              email: u.email,
              phone: u.phone || '',
              address: u.address || '',
              role: u.role,
            }),
          );
          dispatch(
            login({
              id: u.id,
              name: u.fullName || 'Khách hàng',
              email: u.email,
              phone: u.phone || '',
              address: u.address || '',
              role: u.role,
            }),
          );
          if (u.role?.toUpperCase() === 'ADMIN') navigate('/admin');
        }}
        onBack={() => {
          setOtpStep(false);
          setIsLogin(true);
        }}
      />
    );
  }

  return (
    <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', background: 'var(--bg-primary)' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {!isLogin && (
            <FormField label="Họ và tên" value={name} onChange={setName} placeholder="Nguyễn Văn A" error={errors.name} />
          )}
          <FormField label="Email" value={email} onChange={setEmail} type="email" placeholder="email@example.com" error={errors.email} />
          <FormField
            label="Mật khẩu"
            value={password}
            onChange={setPassword}
            type={showPw ? 'text' : 'password'}
            placeholder="••••••••"
            error={errors.password}
            suffix={
              <button type="button" onClick={() => setShowPw((s) => !s)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 0 }}>
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            }
          />

          <button
            type="submit"
            disabled={submitting}
            style={{ marginTop: 4, width: '100%', padding: '14px', background: 'var(--accent)', color: '#000', border: 'none', borderRadius: 'var(--radius-full)', fontSize: 14, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1, fontFamily: 'var(--font-sans)', boxShadow: 'var(--shadow-accent)', transition: 'all 0.2s' }}
          >
            {submitting ? 'Đang xử lý...' : isLogin ? 'Đăng nhập' : 'Tạo tài khoản'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 28, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 10 }}>
            {isLogin ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}
          </p>
          <button onClick={() => { setIsLogin((l) => !l); setErrors({}); }} style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
            {isLogin ? 'Đăng ký ngay →' : '← Quay lại đăng nhập'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main User Page ───────────────────────────────────────────────────────────

const NAV_ITEMS: { tab: Tab; label: string; icon: React.ReactNode }[] = [
  { tab: 'overview',  label: 'Tổng quan',     icon: <LayoutDashboard size={17} /> },
  { tab: 'profile',   label: 'Thông tin',      icon: <UserIcon size={17} /> },
  { tab: 'orders',    label: 'Đơn hàng',       icon: <Package size={17} /> },
  { tab: 'security',  label: 'Bảo mật',        icon: <Lock size={17} /> },
  { tab: 'settings',  label: 'Cài đặt',        icon: <Settings size={17} /> },
];

const User: React.FC = () => {
  const { isLoggedIn, profile: reduxProfile } = useSelector((s: RootState) => s.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const urlTab = searchParams.get('tab') as Tab | null;
  const [tab, setTabState] = useState<Tab>(urlTab || 'overview');

  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const setTab = (t: Tab) => {
    setTabState(t);
    navigate(`/account?tab=${t}`, { replace: true });
  };

  useEffect(() => {
    if (urlTab && urlTab !== tab) setTabState(urlTab);
  }, [urlTab]);

  const fetchOrders = useCallback(async () => {
    if (!isLoggedIn) return;
    setOrdersLoading(true);
    try {
      const data = (await api.get('/orders/my-orders')) as Order[];
      setOrders(data);
    } catch {
      // silently fail
    } finally {
      setOrdersLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn) fetchOrders();
    else setOrders([]);
  }, [isLoggedIn, fetchOrders]);

  if (!isLoggedIn || !reduxProfile) return <AuthPage />;

  const pendingCount = orders.filter(
    (o) => o.status === 'PENDING' || o.status === 'PROCESSING',
  ).length;
  const initials = (reduxProfile.name || 'U').charAt(0).toUpperCase();

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
                {initials}
              </div>
              <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{reduxProfile.name || 'Khách hàng'}</p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{reduxProfile.email}</p>
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
                  <button key={item.tab} onClick={() => setTab(item.tab)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '13px 18px', background: isActive ? 'var(--accent-soft)' : 'none', border: 'none', borderBottom: i < NAV_ITEMS.length - 1 ? '1px solid var(--border)' : 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: isActive ? 700 : 500, color: isActive ? 'var(--accent)' : 'var(--text-secondary)', transition: 'all 0.15s', textAlign: 'left' }}
                    onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'var(--bg-secondary)'; }}
                    onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'none'; }}
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
              <button onClick={handleLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '13px 18px', background: 'none', border: 'none', borderTop: '1px solid var(--border)', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 500, color: 'var(--warm-rose)', transition: 'all 0.15s', textAlign: 'left' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(244,63,94,0.06)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
              >
                <LogOut size={17} style={{ flexShrink: 0 }} />
                Đăng xuất
              </button>
            </nav>
          </aside>

          {/* Main content */}
          <main style={{ minWidth: 0 }}>
            {tab === 'overview' && <OverviewTab orders={orders} ordersLoading={ordersLoading} setTab={setTab} />}
            {tab === 'profile'  && <ProfileTab />}
            {tab === 'orders'   && <OrdersTab orders={orders} ordersLoading={ordersLoading} />}
            {tab === 'security' && <SecurityTab />}
            {tab === 'settings' && <SettingsTab />}
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
      `}</style>
    </div>
  );
};

export default User;