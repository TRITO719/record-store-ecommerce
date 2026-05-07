import React, { useEffect, useState } from 'react';
import { DollarSign, ShoppingBag, Users, Disc3 } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({ revenue: 0, orders: 0, users: 0, products: 0 });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const statsData: any = await api.get('/admin/stats');
        setStats(statsData);

        const ordersData: any = await api.get('/admin/orders');
        setRecentOrders(ordersData.slice(0, 5));
      } catch (error) {
        toast.error('Không thể tải dữ liệu Dashboard');
      }
    };
    fetchDashboardData();
  }, []);

  const statCards = [
    { title: 'Tổng doanh thu', value: `$${stats.revenue.toFixed(2)}`, icon: <DollarSign size={24} className="text-black" /> },
    { title: 'Tổng đơn hàng', value: stats.orders, icon: <ShoppingBag size={24} className="text-black" /> },
    { title: 'Khách hàng', value: stats.users, icon: <Users size={24} className="text-black" /> },
    { title: 'Sản phẩm', value: stats.products, icon: <Disc3 size={24} className="text-black" /> },
  ];

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-display font-bold uppercase tracking-tight mb-2">Dashboard</h1>
        <p className="text-[11px] uppercase tracking-widest text-gray-500">Tổng quan hoạt động kinh doanh</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, idx) => (
          <div key={idx} className="bg-white p-6 border border-rs-border flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold mb-2">{stat.title}</p>
              <p className="text-3xl font-display font-bold">{stat.value}</p>
            </div>
            <div className="bg-rs-gray-light p-4 rounded-full">
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-rs-border p-8">
          <h2 className="text-lg font-bold uppercase tracking-widest mb-6 border-b border-rs-border pb-4">Đơn hàng gần đây</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-gray-500 border-b border-rs-border">
                  <th className="pb-4 font-bold">Mã Đơn</th>
                  <th className="pb-4 font-bold">Khách Hàng</th>
                  <th className="pb-4 font-bold">Ngày</th>
                  <th className="pb-4 font-bold">Tổng Tiền</th>
                  <th className="pb-4 font-bold text-right">Trạng Thái</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-rs-border last:border-0">
                    <td className="py-4 font-bold">#{order.id.split('-')[0]}...</td>
                    <td className="py-4">{order.user?.fullName || order.customerEmail}</td>
                    <td className="py-4">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="py-4 font-bold">${order.totalAmount.toFixed(2)}</td>
                    <td className="py-4 text-right">
                      <span className="inline-block bg-rs-gray-light border border-rs-border px-3 py-1 text-[10px] uppercase tracking-widest font-bold">
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {recentOrders.length === 0 && <p className="text-sm text-gray-500 mt-4">Chưa có đơn hàng nào.</p>}
          </div>
        </div>

        <div className="bg-white border border-rs-border p-8">
          <h2 className="text-lg font-bold uppercase tracking-widest mb-6 border-b border-rs-border pb-4">Thông báo</h2>
          <div className="space-y-6">
             <p className="text-sm text-gray-500">Mọi thứ đang hoạt động tốt.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
