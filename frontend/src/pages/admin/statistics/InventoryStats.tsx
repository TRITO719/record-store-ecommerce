import React, { useState } from 'react';
import { Boxes, AlertTriangle, XCircle, DollarSign } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  StatCard, ChartCard, StatsSkeleton, EmptyState,
  useStatsData, exportToExcel, fmtCurrency,
  CHART_COLORS, PIE_COLORS, type DateFilter,
} from '../../../components/admin/StatsUtils';

interface InventoryData {
  summary: {
    totalProducts: number;
    totalStockValue: number;
    lowStockCount: number;
    outOfStockCount: number;
  };
  allProducts: any[];
  lowStockProducts: any[];
  outOfStockProducts: any[];
  categoryBreakdown: { category: string; count: number; value: number; items: number }[];
}

const CATEGORY_LABELS: Record<string, string> = {
  vinyl: 'Vinyl', cd: 'CD', merch: 'Merch',
};

// Fixed placeholder filter (inventory has no date range)
const STATIC_FILTER: DateFilter = { period: 'month', startDate: '', endDate: '' };

const InventoryStats: React.FC = () => {
  const [exporting, setExporting] = useState(false);

  const { data, loading } = useStatsData<InventoryData>('inventory', STATIC_FILTER);

  const handleExport = async () => {
    setExporting(true);
    await exportToExcel(
      'export/inventory',
      {},
      'ton-kho',
      [
        { key: 'id', label: 'ID' },
        { key: 'title', label: 'Tên sản phẩm' },
        { key: 'artist', label: 'Nghệ sĩ' },
        { key: 'category', label: 'Danh mục' },
        { key: 'price', label: 'Giá ($)', format: (v: unknown) => Number(v).toFixed(2) },
        { key: 'stock', label: 'Tồn kho' },
        { key: 'stockValue', label: 'Giá trị tồn ($)', format: (v: unknown) => Number(v).toFixed(2) },
      ],
      (products: any[]) =>
        products.map((p: any) => ({ ...p, stockValue: p.price * p.stock })),
    );
    setExporting(false);
  };

  const categoryBreakdown = data?.categoryBreakdown || [];
  const allProducts = data?.allProducts || [];
  const lowStock = data?.lowStockProducts || [];
  const outOfStock = data?.outOfStockProducts || [];

  const barData = categoryBreakdown.map((c) => ({
    name: CATEGORY_LABELS[c.category] || c.category,
    products: c.count,
    items: c.items,
    value: Math.round(c.value * 100) / 100,
  }));

  const pieData = categoryBreakdown.map((c) => ({
    name: CATEGORY_LABELS[c.category] || c.category,
    value: c.items,
  }));

  // Stock status bar data (top 10 lowest non-zero stock)
  const stockBarData = [...allProducts]
    .filter((p) => p.stock > 0)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 10)
    .map((p) => ({
      name: p.title.length > 18 ? p.title.slice(0, 18) + '…' : p.title,
      stock: p.stock,
    }));

  const tooltipStyle = { borderRadius: 10, border: '1px solid var(--border)', fontSize: 12, background: 'var(--bg-card)', color: 'var(--text-primary)' };

  return (
    <div>
      {/* Custom header — no time filter for inventory */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16, gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: 'rgba(20,184,166,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#14b8a6', flexShrink: 0,
            }}>
              <Boxes size={22} />
            </div>
            <div>
              <h1 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800, fontSize: 24, color: 'var(--text-primary)', marginBottom: 2, letterSpacing: '-0.02em' }}>
                Thống kê Kho hàng
              </h1>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Tổng quan tồn kho, cảnh báo hàng sắp hết</p>
            </div>
          </div>
          <button
            onClick={handleExport}
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
              whiteSpace: 'nowrap',
            }}
          >
            📥 Xuất Excel
          </button>
        </div>
      </div>

      {loading ? (
        <StatsSkeleton />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            <StatCard
              title="Tổng sản phẩm"
              value={data?.summary.totalProducts ?? 0}
              icon={<Boxes size={18} />}
              color="#14b8a6"
            />
            <StatCard
              title="Giá trị kho"
              value={fmtCurrency(data?.summary.totalStockValue ?? 0)}
              icon={<DollarSign size={18} />}
              color={CHART_COLORS.accent}
            />
            <StatCard
              title="Sắp hết hàng"
              value={data?.summary.lowStockCount ?? 0}
              icon={<AlertTriangle size={18} />}
              color={CHART_COLORS.amber}
              subtitle="Tồn kho ≤ 5"
            />
            <StatCard
              title="Hết hàng"
              value={data?.summary.outOfStockCount ?? 0}
              icon={<XCircle size={18} />}
              color={CHART_COLORS.rose}
              subtitle="Tồn kho = 0"
            />
          </div>

          {/* Charts row */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
            {/* Low stock bar */}
            <ChartCard title="Sản phẩm tồn kho thấp nhất" subtitle="Top 10 sản phẩm cần nhập hàng sớm" minHeight={280}>
              {stockBarData.length === 0 ? (
                <EmptyState />
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={stockBarData} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      formatter={(value: unknown) => [String(value), 'Tồn kho']}
                      contentStyle={tooltipStyle}
                    />
                    <Bar dataKey="stock" fill={CHART_COLORS.amber} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            {/* Category pie */}
            <ChartCard title="Phân bổ danh mục" subtitle="Tổng số lượng theo danh mục" minHeight={280}>
              {pieData.length === 0 ? (
                <EmptyState />
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" outerRadius={95} dataKey="value" paddingAngle={4}>
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: unknown) => [String(value), 'Số lượng']}
                      contentStyle={tooltipStyle}
                    />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: 'var(--text-secondary)' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </div>

          {/* Category breakdown bar */}
          <ChartCard title="Giá trị kho theo danh mục" minHeight={220}>
            {barData.length === 0 ? <EmptyState /> : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={barData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(v: number) => `$${v}`} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(value: unknown, name: unknown) => {
                      if (String(name) === 'value') return [`$${Number(value).toFixed(2)}`, 'Giá trị kho'];
                      return [String(value), String(name) === 'products' ? 'Số SP' : 'Số lượng'];
                    }}
                    contentStyle={tooltipStyle}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text-secondary)' }} />
                  <Bar dataKey="value" name="Giá trị ($)" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="items" name="Số lượng" fill={CHART_COLORS.blue} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          {/* Warning: Low stock */}
          {lowStock.length > 0 && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid #fde68a', borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #fde68a', background: 'rgba(245,158,11,0.06)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={16} style={{ color: CHART_COLORS.amber }} />
                <h3 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, fontSize: 14, color: CHART_COLORS.amber }}>
                  Cảnh báo: Sắp hết hàng ({lowStock.length} sản phẩm)
                </h3>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'rgba(245,158,11,0.04)' }}>
                      {['Sản phẩm', 'Danh mục', 'Giá', 'Tồn kho', 'Giá trị'].map((h) => (
                        <th key={h} style={{ padding: '9px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: CHART_COLORS.amber, letterSpacing: '0.06em', textTransform: 'uppercase', borderBottom: '1px solid #fde68a' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {lowStock.map((p: any, i: number) => (
                      <tr key={p.id} style={{ borderBottom: i < lowStock.length - 1 ? '1px solid rgba(245,158,11,0.15)' : 'none' }}>
                        <td style={{ padding: '10px 16px' }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{p.title}</p>
                          <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.artist}</p>
                        </td>
                        <td style={{ padding: '10px 16px' }}>
                          <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '2px 8px', borderRadius: 4, background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                            {p.category}
                          </span>
                        </td>
                        <td style={{ padding: '10px 16px', fontSize: 13, color: 'var(--text-secondary)' }}>{fmtCurrency(p.price)}</td>
                        <td style={{ padding: '10px 16px' }}>
                          <span style={{ fontSize: 13, fontWeight: 800, color: CHART_COLORS.amber, background: 'rgba(245,158,11,0.1)', padding: '2px 10px', borderRadius: 6 }}>
                            {p.stock}
                          </span>
                        </td>
                        <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>
                          {fmtCurrency(p.price * p.stock)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Warning: Out of stock */}
          {outOfStock.length > 0 && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid #fecaca', borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #fecaca', background: 'rgba(239,68,68,0.05)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <XCircle size={16} style={{ color: CHART_COLORS.rose }} />
                <h3 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, fontSize: 14, color: CHART_COLORS.rose }}>
                  Hết hàng: Cần nhập ngay ({outOfStock.length} sản phẩm)
                </h3>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'rgba(244,63,94,0.04)' }}>
                      {['Sản phẩm', 'Nghệ sĩ', 'Danh mục', 'Giá', 'Trạng thái'].map((h) => (
                        <th key={h} style={{ padding: '9px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: CHART_COLORS.rose, letterSpacing: '0.06em', textTransform: 'uppercase', borderBottom: '1px solid #fecaca' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {outOfStock.map((p: any, i: number) => (
                      <tr key={p.id} style={{ borderBottom: i < outOfStock.length - 1 ? '1px solid rgba(244,63,94,0.12)' : 'none' }}>
                        <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{p.title}</td>
                        <td style={{ padding: '10px 16px', fontSize: 12, color: 'var(--text-muted)' }}>{p.artist}</td>
                        <td style={{ padding: '10px 16px' }}>
                          <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '2px 8px', borderRadius: 4, background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                            {p.category}
                          </span>
                        </td>
                        <td style={{ padding: '10px 16px', fontSize: 13, color: 'var(--text-secondary)' }}>{fmtCurrency(p.price)}</td>
                        <td style={{ padding: '10px 16px' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: CHART_COLORS.rose, background: 'rgba(244,63,94,0.1)', padding: '2px 10px', borderRadius: 6 }}>
                            HẾT HÀNG
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Full inventory table */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>
                Toàn bộ sản phẩm ({allProducts.length})
              </h3>
            </div>
            <div style={{ overflowX: 'auto', maxHeight: 400 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                  <tr style={{ background: 'var(--bg-secondary)' }}>
                    {['ID', 'Sản phẩm', 'Danh mục', 'Giá', 'Tồn kho', 'Giá trị', 'Trạng thái'].map((h) => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allProducts.map((p: any, i: number) => {
                    const isOut = p.stock === 0;
                    const isLow = p.stock > 0 && p.stock <= 5;
                    return (
                      <tr key={p.id} style={{ borderBottom: i < allProducts.length - 1 ? '1px solid var(--border)' : 'none' }}>
                        <td style={{ padding: '9px 14px', fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>#{p.id}</td>
                        <td style={{ padding: '9px 14px' }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{p.title}</p>
                          <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.artist}</p>
                        </td>
                        <td style={{ padding: '9px 14px' }}>
                          <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '2px 7px', borderRadius: 4, background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                            {p.category}
                          </span>
                        </td>
                        <td style={{ padding: '9px 14px', fontSize: 13, color: 'var(--text-secondary)' }}>{fmtCurrency(p.price)}</td>
                        <td style={{ padding: '9px 14px', fontSize: 13, fontWeight: 700, color: isOut ? CHART_COLORS.rose : isLow ? CHART_COLORS.amber : 'var(--text-primary)' }}>
                          {p.stock}
                        </td>
                        <td style={{ padding: '9px 14px', fontSize: 13, color: 'var(--text-secondary)' }}>{fmtCurrency(p.price * p.stock)}</td>
                        <td style={{ padding: '9px 14px' }}>
                          {isOut ? (
                            <span style={{ fontSize: 10, fontWeight: 700, color: CHART_COLORS.rose, background: 'rgba(244,63,94,0.1)', padding: '2px 8px', borderRadius: 5 }}>HẾT HÀNG</span>
                          ) : isLow ? (
                            <span style={{ fontSize: 10, fontWeight: 700, color: CHART_COLORS.amber, background: 'rgba(245,158,11,0.1)', padding: '2px 8px', borderRadius: 5 }}>SẮP HẾT</span>
                          ) : (
                            <span style={{ fontSize: 10, fontWeight: 700, color: CHART_COLORS.accent, background: 'rgba(29,185,84,0.1)', padding: '2px 8px', borderRadius: 5 }}>CÒN HÀNG</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryStats;