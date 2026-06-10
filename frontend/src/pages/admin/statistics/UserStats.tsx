import React, { useState } from 'react';
import { Users, UserPlus, Crown } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  StatCard, StatsPageHeader, ChartCard, StatsSkeleton, EmptyState,
  useStatsData, exportToExcel, fmtCurrency, fmtDate,
  CHART_COLORS, type DateFilter,
} from '../../../components/admin/StatsUtils';

interface UserStatsData {
  summary: { totalUsers: number; newUsersInPeriod: number };
  chartData: { date: string; revenue: number; count: number }[];
  topCustomers: {
    userId: string | null;
    totalSpent: number;
    orderCount: number;
    user: { id: string; fullName: string | null; email: string; createdAt: string } | undefined;
  }[];
  period: { start: string; end: string };
}

const today = new Date().toISOString().split('T')[0];
const firstDayMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

const UserStats: React.FC = () => {
  const [filter, setFilter] = useState<DateFilter>({
    period: 'month',
    startDate: firstDayMonth,
    endDate: today,
  });
  const [exporting, setExporting] = useState(false);

  const { data, loading } = useStatsData<UserStatsData>('users', filter);

  const handleExport = async () => {
    setExporting(true);
    await exportToExcel(
      'export/users',
      {},
      'khach-hang',
      [
        { key: 'id', label: 'ID' },
        { key: 'fullName', label: 'Họ tên' },
        { key: 'email', label: 'Email' },
        { key: 'role', label: 'Vai trò' },
        { key: 'createdAt', label: 'Ngày đăng ký', format: (v) => fmtDate(v) },
      ],
      (users: any[]) => users,
    );
    setExporting(false);
  };

  const chartData = data?.chartData || [];
  const topCustomers = data?.topCustomers || [];

  const topBarData = topCustomers.slice(0, 8).map((c) => ({
    name: c.user?.fullName ? (c.user.fullName.length > 16 ? c.user.fullName.slice(0, 16) + '…' : c.user.fullName) : 'Ẩn danh',
    spent: c.totalSpent,
  }));

  const tooltipStyle = { borderRadius: 10, border: '1px solid var(--border)', fontSize: 12, background: 'var(--bg-card)', color: 'var(--text-primary)' };

  return (
    <div>
      <StatsPageHeader
        title="Thống kê Khách hàng"
        subtitle="Phân tích tăng trưởng và hành vi khách hàng"
        icon={<Users size={22} />}
        color="#8b5cf6"
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
              title="Tổng khách hàng"
              value={data?.summary.totalUsers ?? 0}
              icon={<Users size={18} />}
              color={CHART_COLORS.purple}
              subtitle="Tài khoản đã đăng ký"
            />
            <StatCard
              title="Khách mới kỳ này"
              value={data?.summary.newUsersInPeriod ?? 0}
              icon={<UserPlus size={18} />}
              color={CHART_COLORS.accent}
            />
            <StatCard
              title="Khách mua nhiều nhất"
              value={topCustomers[0] ? fmtCurrency(topCustomers[0].totalSpent) : '$0'}
              icon={<Crown size={18} />}
              color={CHART_COLORS.amber}
              subtitle={topCustomers[0]?.user?.fullName || 'Chưa có dữ liệu'}
            />
          </div>

          {/* Line chart — User growth */}
          <ChartCard title="Tăng trưởng khách hàng" subtitle="Số khách đăng ký mới theo ngày" minHeight={280}>
            {chartData.length === 0 ? (
              <EmptyState />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(d) => new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                    tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false}
                  />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    formatter={(value: unknown) => [String(value), 'Khách mới']}
                    labelFormatter={(label) => fmtDate(label)}
                    contentStyle={tooltipStyle}
                  />
                  <Line type="monotone" dataKey="count" stroke={CHART_COLORS.purple} strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          {/* Top customers bar */}
          <ChartCard title="Top khách hàng chi tiêu cao nhất" subtitle="Tổng giá trị mua hàng (đơn COMPLETED)" minHeight={260}>
            {topBarData.length === 0 ? (
              <EmptyState />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={topBarData} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" tickFormatter={(v) => `$${v}`} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(value: unknown) => [fmtCurrency(Number(value)), 'Chi tiêu']}
                    contentStyle={tooltipStyle}
                  />
                  <Bar dataKey="spent" fill={CHART_COLORS.purple} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          {/* Top customers table */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>
                Bảng xếp hạng khách hàng
              </h3>
            </div>
            {topCustomers.length === 0 ? (
              <div style={{ padding: 32 }}><EmptyState /></div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-secondary)' }}>
                      {['#', 'Khách hàng', 'Email', 'Số đơn', 'Tổng chi tiêu'].map((h) => (
                        <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {topCustomers.map((c, i) => (
                      <tr key={c.userId || i} style={{ borderBottom: i < topCustomers.length - 1 ? '1px solid var(--border)' : 'none' }}>
                        <td style={{ padding: '11px 16px', fontSize: 13, fontWeight: 700, color: i < 3 ? CHART_COLORS.purple : 'var(--text-muted)' }}>
                          {i === 0 ? '👑' : `#${i + 1}`}
                        </td>
                        <td style={{ padding: '11px 16px', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                          {c.user?.fullName || 'Ẩn danh'}
                        </td>
                        <td style={{ padding: '11px 16px', fontSize: 12, color: 'var(--text-muted)' }}>{c.user?.email || '-'}</td>
                        <td style={{ padding: '11px 16px', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>{c.orderCount} đơn</td>
                        <td style={{ padding: '11px 16px', fontSize: 14, fontWeight: 800, color: CHART_COLORS.purple }}>{fmtCurrency(c.totalSpent)}</td>
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

export default UserStats;