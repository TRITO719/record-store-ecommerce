import React, { useCallback } from 'react';
import { Calendar, Download, Loader2 } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

// ─── Types ─────────────────────────────────────────────────────────────────────
export type Period = 'today' | 'week' | 'month' | 'year' | 'custom';

export interface DateFilter {
  period: Period;
  startDate: string;
  endDate: string;
}

// ─── Colors ────────────────────────────────────────────────────────────────────
export const CHART_COLORS = {
  accent: '#1db954',
  purple: '#8b5cf6',
  amber: '#f59e0b',
  rose: '#f43f5e',
  blue: '#3b82f6',
  teal: '#14b8a6',
};

export const PIE_COLORS = ['#1db954', '#8b5cf6', '#f59e0b', '#3b82f6', '#f43f5e'];

// ─── Date Filter Component ─────────────────────────────────────────────────────
interface TimeFilterProps {
  value: DateFilter;
  onChange: (filter: DateFilter) => void;
}

const PERIODS: { label: string; value: Period }[] = [
  { label: 'Hôm nay', value: 'today' },
  { label: 'Tuần này', value: 'week' },
  { label: 'Tháng này', value: 'month' },
  { label: 'Năm này', value: 'year' },
  { label: 'Tùy chỉnh', value: 'custom' },
];

export const TimeFilter: React.FC<TimeFilterProps> = ({ value, onChange }) => {
  const today = new Date().toISOString().split('T')[0];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <Calendar size={15} style={{ color: 'var(--text-muted)' }} />
      {PERIODS.map((p) => (
        <button
          key={p.value}
          onClick={() => onChange({ ...value, period: p.value })}
          style={{
            padding: '6px 14px',
            borderRadius: 20,
            border: `1px solid ${value.period === p.value ? '#1db954' : 'var(--border-strong)'}`,
            background: value.period === p.value ? 'rgba(29,185,84,0.1)' : 'var(--bg-card)',
            color: value.period === p.value ? '#1db954' : 'var(--text-secondary)',
            fontSize: 12.5,
            fontWeight: value.period === p.value ? 700 : 500,
            cursor: 'pointer',
            transition: 'all 0.15s',
            fontFamily: 'inherit',
          }}
        >
          {p.label}
        </button>
      ))}

      {value.period === 'custom' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 4 }}>
          <input
            type="date"
            max={today}
            value={value.startDate}
            onChange={(e) => onChange({ ...value, startDate: e.target.value })}
            style={{ padding: '5px 10px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, fontFamily: 'inherit', outline: 'none', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
          />
          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>đến</span>
          <input
            type="date"
            max={today}
            value={value.endDate}
            onChange={(e) => onChange({ ...value, endDate: e.target.value })}
            style={{ padding: '5px 10px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, fontFamily: 'inherit', outline: 'none', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
          />
        </div>
      )}
    </div>
  );
};

// ─── Stat Card ─────────────────────────────────────────────────────────────────
interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color?: string;
  trend?: { value: number; label: string };
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon, color = '#1db954', trend }) => (
  <div style={{
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 14,
    padding: '20px 22px',
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
    transition: 'box-shadow 0.2s',
  }}
    onMouseEnter={(e) => (e.currentTarget.style.boxShadow = 'var(--shadow-md)')}
    onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'none')}
  >
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        {title}
      </span>
      <div style={{
        width: 38, height: 38, borderRadius: 10,
        background: `${color}18`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color,
      }}>
        {icon}
      </div>
    </div>
    <div>
      <p style={{
        fontFamily: 'Plus Jakarta Sans, sans-serif',
        fontWeight: 800, fontSize: 28,
        color: 'var(--text-primary)', lineHeight: 1, marginBottom: 4,
      }}>
        {value}
      </p>
      {subtitle && <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{subtitle}</p>}
    </div>
    {trend && (
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{
          fontSize: 11, fontWeight: 700,
          color: trend.value >= 0 ? '#1db954' : '#ef4444',
        }}>
          {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%
        </span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{trend.label}</span>
      </div>
    )}
  </div>
);

// ─── Page Header ───────────────────────────────────────────────────────────────
interface StatsPageHeaderProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  filter: DateFilter;
  onFilterChange: (f: DateFilter) => void;
  onExport: () => void;
  exporting?: boolean;
}

export const StatsPageHeader: React.FC<StatsPageHeaderProps> = ({
  title, subtitle, icon, color, filter, onFilterChange, onExport, exporting,
}) => (
  <div style={{ marginBottom: 28 }}>
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 12,
          background: `${color}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color, flexShrink: 0,
        }}>
          {icon}
        </div>
        <div>
          <h1 style={{
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            fontWeight: 800, fontSize: 24,
            color: 'var(--text-primary)', marginBottom: 2,
            letterSpacing: '-0.02em',
          }}>
            {title}
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{subtitle}</p>
        </div>
      </div>

      <button
        onClick={onExport}
        disabled={exporting}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '9px 18px',
          background: exporting ? 'var(--bg-secondary)' : 'var(--text-primary)',
          color: exporting ? 'var(--text-muted)' : 'var(--text-inverse)',
          border: 'none', borderRadius: 10,
          fontSize: 12.5, fontWeight: 700,
          cursor: exporting ? 'not-allowed' : 'pointer',
          fontFamily: 'inherit',
          transition: 'all 0.15s',
          whiteSpace: 'nowrap',
        }}
      >
        {exporting ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={14} />}
        Xuất Excel
      </button>
    </div>

    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      padding: '12px 16px',
    }}>
      <TimeFilter value={filter} onChange={onFilterChange} />
    </div>
  </div>
);

// ─── Loading Skeleton ───────────────────────────────────────────────────────────
export const StatsSkeleton: React.FC = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} style={{
          height: 120, borderRadius: 14,
          background: 'linear-gradient(90deg, var(--bg-secondary) 25%, var(--bg-card) 50%, var(--bg-secondary) 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.4s infinite',
        }} />
      ))}
    </div>
    <div style={{ height: 320, borderRadius: 14, background: 'linear-gradient(90deg, var(--bg-secondary) 25%, var(--bg-card) 50%, var(--bg-secondary) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
  </div>
);

// ─── Empty State ───────────────────────────────────────────────────────────────
export const EmptyState: React.FC<{ message?: string }> = ({ message = 'Không có dữ liệu cho khoảng thời gian này.' }) => (
  <div style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    padding: '60px 24px', color: 'var(--text-muted)', textAlign: 'center',
    background: 'var(--bg-card)', borderRadius: 14, border: '1px solid var(--border)',
  }}>
    <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>Chưa có dữ liệu</p>
    <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{message}</p>
  </div>
);

// ─── useStatsData hook ──────────────────────────────────────────────────────────
export const useStatsData = <T,>(endpoint: string, filter: DateFilter) => {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ period: filter.period });
      if (filter.period === 'custom') {
        if (filter.startDate) params.set('startDate', filter.startDate);
        if (filter.endDate) params.set('endDate', filter.endDate);
      }
      const result = await api.get(`/admin/statistics/${endpoint}?${params}`);
      setData(result as T);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Lỗi tải dữ liệu');
      toast.error('Không thể tải dữ liệu thống kê');
    } finally {
      setLoading(false);
    }
  }, [endpoint, filter]);

  React.useEffect(() => { fetch(); }, [fetch]);
  return { data, loading, error, refetch: fetch };
};

// ─── Excel Export ───────────────────────────────────────────────────────────────
type ExportRow = Record<string, string | number | null | undefined>;

export const exportToExcel = async (
  endpoint: string,
  params: Record<string, string>,
  filename: string,
  columns: { key: string; label: string; format?: (v: any) => string }[],
  transformRows: (data: any) => ExportRow[],
) => {
  try {
    const query = new URLSearchParams(params).toString();
    const data = await api.get(`/admin/statistics/${endpoint}?${query}`);
    const rows = transformRows(data);

    if (!rows.length) {
      toast.error('Không có dữ liệu để xuất');
      return;
    }

    // Build CSV (browsers can open as spreadsheet)
    const header = columns.map((c) => `"${c.label}"`).join(',');
    const body = rows
      .map((row) =>
        columns
          .map((c) => {
            const val = c.format ? c.format(row[c.key]) : row[c.key];
            return `"${String(val ?? '').replace(/"/g, '""')}"`;
          })
          .join(','),
      )
      .join('\n');

    const csv = '\uFEFF' + header + '\n' + body; // BOM for Excel UTF-8
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Đã xuất file thành công!');
  } catch {
    toast.error('Lỗi khi xuất file');
  }
};

// ─── Chart wrapper card ─────────────────────────────────────────────────────────
export const ChartCard: React.FC<{ title: string; subtitle?: string; children: React.ReactNode; minHeight?: number }> = ({
  title, subtitle, children, minHeight = 300,
}) => (
  <div style={{
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 14,
    padding: '20px 22px',
    overflow: 'hidden',
  }}>
    <div style={{ marginBottom: 16 }}>
      <h3 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>{title}</h3>
      {subtitle && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{subtitle}</p>}
    </div>
    <div style={{ minHeight }}>{children}</div>
  </div>
);

// ─── Status Badge ───────────────────────────────────────────────────────────────
const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  PENDING:    { label: 'Chờ xử lý', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  PROCESSING: { label: 'Đang xử lý', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  SHIPPED:    { label: 'Đang giao', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
  COMPLETED:  { label: 'Đã giao', color: '#1db954', bg: 'rgba(29,185,84,0.1)' },
  CANCELLED:  { label: 'Đã hủy', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
};

export const OrderStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const cfg = STATUS_MAP[status] || { label: status, color: 'var(--text-muted)', bg: 'var(--bg-secondary)' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 8px', borderRadius: 999,
      fontSize: 11, fontWeight: 700,
      color: cfg.color, background: cfg.bg,
    }}>
      {cfg.label}
    </span>
  );
};

export const fmtCurrency = (v: number) => `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const fmtDate = (d: string) => new Date(d).toLocaleDateString('vi-VN');

// Add shimmer keyframe via style tag (called once)
if (typeof document !== 'undefined') {
  const id = 'stats-shimmer-style';
  if (!document.getElementById(id)) {
    const style = document.createElement('style');
    style.id = id;
    style.textContent = `
      @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
      @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
    `;
    document.head.appendChild(style);
  }
}