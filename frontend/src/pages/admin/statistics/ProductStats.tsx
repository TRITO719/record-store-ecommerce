import React, { useState } from 'react';
import { Package, TrendingUp, Tag } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  StatCard, StatsPageHeader, ChartCard, StatsSkeleton, EmptyState,
  useStatsData, exportToExcel, fmtCurrency,
  CHART_COLORS, PIE_COLORS, type DateFilter,
} from '../../../components/admin/StatsUtils';

interface ProductStatsData {
  summary: { totalProducts: number };
  topProducts: {
    productId: number;
    totalQuantity: number;
    totalRevenue: number;
    orderCount: number;
    product: { id: number; title: string; artist: string; category: string; price: number; stock: number } | undefined;
  }[];
  categoryStats: { category: string; count: number; revenue: number }[];
  period: { start: string; end: string };
}

const today = new Date().toISOString().split('T')[0];
const firstDayMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

const CATEGORY_LABELS: Record<string, string> = {
  vinyl: 'Vinyl', cd: 'CD', merch: 'Merch',
};

const ProductStats: React.FC = () => {
  const [filter, setFilter] = useState<DateFilter>({
    period: 'month',
    startDate: firstDayMonth,
    endDate: today,
  });
  const [exporting, setExporting] = useState(false);

  const { data, loading } = useStatsData<ProductStatsData>('products', filter);

  const handleExport = async () => {
    setExporting(true);
    await exportToExcel(
      'export/products',
      {},
      'san-pham',
      [
        { key: 'id', label: 'ID' },
        { key: 'title', label: 'Tên sản phẩm' },
        { key: 'artist', label: 'Nghệ sĩ' },
        { key: 'category', label: 'Danh mục' },
        { key: 'price', label: 'Giá ($)', format: (v) => Number(v).toFixed(2) },
        { key: 'stock', label: 'Tồn kho' },
      ],
      (products: any[]) => products,
    );
    setExporting(false);
  };

  const topProducts = data?.topProducts || [];
  const categoryStats = data?.categoryStats || [];

  const barData = topProducts.slice(0, 8).map((p) => ({
    name: p.product?.title ? (p.product.title.length > 18 ? p.product.title.slice(0, 18) + '…' : p.product.title) : `#${p.productId}`,
    qty: p.totalQuantity,
    revenue: p.totalRevenue,
  }));

  const pieData = categoryStats.map((c) => ({
    name: CATEGORY_LABELS[c.category] || c.category,
    value: c.count,
  }));

  const totalSold = topProducts.reduce((s, p) => s + p.totalQuantity, 0);
  const totalRevenue = topProducts.reduce((s, p) => s + p.totalRevenue, 0);

  const tooltipStyle = { borderRadius: 10, border: '1px solid var(--border)', fontSize: 12, background: 'var(--bg-card)', color: 'var(--text-primary)' };

  return (
    <div>
      <StatsPageHeader
        title="Thống kê Sản phẩm"
        subtitle="Hiệu suất bán hàng theo sản phẩm và danh mục"
        icon={<Package size={22} />}
        color="#f59e0b"
        filter={filter}
        onFilterChange={setFilter}
        onExport={handleExport}
        exporting={exporting}
      />

      {loading ? (
        <StatsSkeleton />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            <StatCard
              title="Tổng sản phẩm"
              value={data?.summary.totalProducts ?? 0}
              icon={<Package size={18} />}
              color={CHART_COLORS.amber}
              subtitle="Trong kho"
            />
            <StatCard
              title="Tổng sản phẩm đã bán"
              value={totalSold}
              icon={<TrendingUp size={18} />}
              color={CHART_COLORS.accent}
              subtitle="Số lượng bán ra"
            />
            <StatCard
              title="Doanh thu từ top SP"
              value={fmtCurrency(totalRevenue)}
              icon={<Tag size={18} />}
              color={CHART_COLORS.purple}
            />
          </div>

          {/* Charts row */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
            {/* Top products bar */}
            <ChartCard title="Top sản phẩm bán chạy" subtitle="Số lượng bán theo sản phẩm" minHeight={300}>
              {barData.length === 0 ? (
                <EmptyState />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={barData} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      formatter={(value: unknown) => [String(value), 'Đã bán']}
                      contentStyle={tooltipStyle}
                    />
                    <Bar dataKey="qty" fill={CHART_COLORS.amber} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            {/* Category pie */}
            <ChartCard title="Theo danh mục" subtitle="Phân bổ số lượng bán" minHeight={300}>
              {pieData.length === 0 ? (
                <EmptyState />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" outerRadius={100} dataKey="value" paddingAngle={4}>
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: 'var(--text-secondary)' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </div>

          {/* Product ranking table */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>
                Bảng xếp hạng sản phẩm
              </h3>
            </div>
            {topProducts.length === 0 ? (
              <div style={{ padding: 32 }}><EmptyState /></div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-secondary)' }}>
                      {['#', 'Sản phẩm', 'Danh mục', 'Giá', 'Đã bán', 'Doanh thu', 'Đơn hàng'].map((h) => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {topProducts.map((item, i) => (
                      <tr key={item.productId} style={{ borderBottom: i < topProducts.length - 1 ? '1px solid var(--border)' : 'none' }}>
                        <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 700, color: i < 3 ? '#1db954' : 'var(--text-muted)' }}>
                          #{i + 1}
                        </td>
                        <td style={{ padding: '11px 14px' }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{item.product?.title || `SP #${item.productId}`}</p>
                          <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.product?.artist}</p>
                        </td>
                        <td style={{ padding: '11px 14px' }}>
                          <span style={{
                            fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                            padding: '2px 8px', borderRadius: 4,
                            background: 'var(--bg-secondary)', color: 'var(--text-secondary)',
                          }}>
                            {item.product?.category || '-'}
                          </span>
                        </td>
                        <td style={{ padding: '11px 14px', fontSize: 13, color: 'var(--text-secondary)' }}>{fmtCurrency(item.product?.price ?? 0)}</td>
                        <td style={{ padding: '11px 14px', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{item.totalQuantity}</td>
                        <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 700, color: '#1db954' }}>{fmtCurrency(item.totalRevenue)}</td>
                        <td style={{ padding: '11px 14px', fontSize: 13, color: 'var(--text-secondary)' }}>{item.orderCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductStats;