import React, { useState } from 'react';
import { DollarSign, TrendingUp, ShoppingBag, BarChart2 } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  StatCard, StatsPageHeader, ChartCard, StatsSkeleton, EmptyState,
  useStatsData, exportToExcel, fmtCurrency, fmtDate,
  CHART_COLORS, type DateFilter,
} from '../../../components/admin/StatsUtils';

interface RevenueData {
  summary: {
    totalRevenue: number;
    completedOrders: number;
    avgOrderValue: number;
    totalOrders: number;
  };
  chartData: { date: string; revenue: number; count: number }[];
  period: { start: string; end: string };
}

const today = new Date().toISOString().split('T')[0];
const firstDayMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

const RevenueStats: React.FC = () => {
  const [filter, setFilter] = useState<DateFilter>({
    period: 'month',
    startDate: firstDayMonth,
    endDate: today,
  });
  const [exporting, setExporting] = useState(false);

  const { data, loading } = useStatsData<RevenueData>('revenue', filter);

  const handleExport = async () => {
    setExporting(true);
    await exportToExcel(
      'export/revenue',
      { period: filter.period, ...(filter.period === 'custom' ? { startDate: filter.startDate, endDate: filter.endDate } : {}) },
      'doanh-thu',
      [
        { key: 'orderId', label: 'Mã đơn hàng' },
        { key: 'customerEmail', label: 'Email khách hàng' },
        { key: 'customerName', label: 'Tên khách hàng' },
        { key: 'totalAmount', label: 'Giá trị ($)', format: (v) => Number(v).toFixed(2) },
        { key: 'itemCount', label: 'Số sản phẩm' },
        { key: 'createdAt', label: 'Ngày đặt', format: (v) => fmtDate(v) },
      ],
      (orders: any[]) =>
        orders.map((o: any) => ({
          orderId: o.id,
          customerEmail: o.customerEmail || o.user?.email || '',
          customerName: o.user?.fullName || 'Khách vãng lai',
          totalAmount: o.totalAmount,
          itemCount: o.orderItems?.length || 0,
          createdAt: o.createdAt,
        })),
    );
    setExporting(false);
  };

  const chartData = data?.chartData || [];

  const tooltipStyle = { borderRadius: 10, border: '1px solid var(--border)', fontSize: 12, background: 'var(--bg-card)', color: 'var(--text-primary)' };

  return (
    <div>
      <StatsPageHeader
        title="Thống kê Doanh thu"
        subtitle="Phân tích doanh thu theo thời gian"
        icon={<DollarSign size={22} />}
        color="#1db954"
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            <StatCard
              title="Tổng doanh thu"
              value={fmtCurrency(data?.summary.totalRevenue ?? 0)}
              icon={<DollarSign size={18} />}
              color="#1db954"
              subtitle="Đơn COMPLETED"
            />
            <StatCard
              title="Đơn hàng hoàn thành"
              value={data?.summary.completedOrders ?? 0}
              icon={<ShoppingBag size={18} />}
              color="#3b82f6"
              subtitle={`/ ${data?.summary.totalOrders ?? 0} tổng đơn`}
            />
            <StatCard
              title="Giá trị TB / Đơn"
              value={fmtCurrency(data?.summary.avgOrderValue ?? 0)}
              icon={<TrendingUp size={18} />}
              color="#8b5cf6"
            />
            <StatCard
              title="Tổng đơn hàng"
              value={data?.summary.totalOrders ?? 0}
              icon={<BarChart2 size={18} />}
              color="#f59e0b"
              subtitle="Mọi trạng thái"
            />
          </div>

          {/* Line chart — Revenue trend */}
          <ChartCard title="Xu hướng Doanh thu" subtitle="Doanh thu theo ngày" minHeight={300}>
            {chartData.length === 0 ? (
              <EmptyState />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(d) => new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                    tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                    tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(v: unknown) => [fmtCurrency(Number(v)), 'Doanh thu']}
                    labelFormatter={(label) => fmtDate(label)}
                    contentStyle={tooltipStyle}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke={CHART_COLORS.accent}
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          {/* Bar chart — Orders per day */}
          <ChartCard title="Số đơn hàng theo ngày" subtitle="Số lượng đơn hàng trong khoảng thời gian" minHeight={260}>
            {chartData.length === 0 ? (
              <EmptyState />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(d) => new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                    tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(v: unknown) => [Number(v), 'Đơn hàng']}
                    labelFormatter={(label) => fmtDate(label)}
                    contentStyle={tooltipStyle}
                  />
                  <Bar dataKey="count" fill={CHART_COLORS.blue} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          {/* Revenue data table */}
          {chartData.length > 0 && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                <h3 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>
                  Chi tiết theo ngày
                </h3>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-secondary)' }}>
                      {['Ngày', 'Số đơn', 'Doanh thu'].map((h) => (
                        <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...chartData].reverse().map((row, i) => (
                      <tr key={row.date} style={{ borderBottom: i < chartData.length - 1 ? '1px solid var(--border)' : 'none' }}>
                        <td style={{ padding: '11px 16px', fontSize: 13, color: 'var(--text-secondary)' }}>{fmtDate(row.date)}</td>
                        <td style={{ padding: '11px 16px', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{row.count}</td>
                        <td style={{ padding: '11px 16px', fontSize: 13, fontWeight: 700, color: '#1db954' }}>{fmtCurrency(row.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RevenueStats;