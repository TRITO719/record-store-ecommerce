import React, { useEffect, useState } from 'react';
import { Eye } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const data: any = await api.get('/admin/orders');
      setOrders(data);
    } catch (error) {
      toast.error('Lỗi khi tải danh sách đơn hàng');
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await api.put(`/admin/orders/${id}`, { status: newStatus });
      toast.success('Cập nhật trạng thái thành công');
      fetchOrders();
    } catch (error) {
      toast.error('Lỗi khi cập nhật trạng thái');
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-rs-border pb-4">
        <h1 className="text-3xl font-display font-bold uppercase tracking-tight mb-2">Quản lý Đơn hàng</h1>
        <p className="text-[11px] uppercase tracking-widest text-gray-500">Theo dõi và cập nhật trạng thái đơn hàng</p>
      </div>

      <div className="bg-white border border-rs-border overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] uppercase tracking-[0.2em] text-gray-500 border-b border-rs-border bg-rs-gray-light">
              <th className="p-5 font-bold">Mã Đơn</th>
              <th className="p-5 font-bold">Khách hàng</th>
              <th className="p-5 font-bold">Ngày đặt</th>
              <th className="p-5 font-bold">Tổng tiền</th>
              <th className="p-5 font-bold">Trạng thái</th>
              <th className="p-5 font-bold text-right">Chi tiết</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {orders.map((item) => (
              <tr key={item.id} className="border-b border-rs-border last:border-0 hover:bg-rs-gray-light/50">
                <td className="p-5 font-bold">#{item.id.substring(0, 8)}...</td>
                <td className="p-5">
                  <p className="font-bold mb-1">{item.user?.fullName || 'Khách Vãng Lai'}</p>
                  <p className="text-[10px] text-gray-500">{item.customerEmail}</p>
                </td>
                <td className="p-5">{new Date(item.createdAt).toLocaleDateString()}</td>
                <td className="p-5 font-bold">${item.totalAmount.toFixed(2)}</td>
                <td className="p-5">
                  <select 
                    value={item.status}
                    onChange={(e) => handleStatusChange(item.id, e.target.value)}
                    className="border border-rs-border bg-transparent p-2 text-[10px] uppercase tracking-widest font-bold focus:outline-none focus:border-black cursor-pointer"
                  >
                    <option value="PENDING">Đang xử lý</option>
                    <option value="SHIPPED">Đã gửi hàng</option>
                    <option value="COMPLETED">Đã giao</option>
                    <option value="CANCELLED">Đã hủy</option>
                  </select>
                </td>
                <td className="p-5 text-right">
                  <button onClick={() => setSelectedOrder(item)} className="inline-flex text-gray-500 hover:text-black transition-colors">
                    <Eye size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && <p className="text-sm text-gray-500 p-5 text-center">Không có đơn hàng nào.</p>}
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-8 w-full max-w-2xl border border-rs-border max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold uppercase tracking-widest mb-6 border-b border-rs-border pb-4">
              Chi tiết đơn hàng #{selectedOrder.id.substring(0, 8)}
            </h2>
            
            <div className="grid grid-cols-2 gap-6 text-sm mb-8 bg-rs-gray-light p-6 border border-rs-border">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold mb-1">Khách hàng</p>
                <p className="font-bold">{selectedOrder.user?.fullName || 'Khách vãng lai'}</p>
                <p className="text-gray-600">{selectedOrder.customerEmail}</p>
                <p className="text-gray-600">{selectedOrder.customerPhone || 'Không có sđt'}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold mb-1">Giao đến</p>
                <p className="text-gray-600 leading-relaxed">{selectedOrder.shippingAddr || 'Không có địa chỉ'}</p>
              </div>
            </div>
            
            <h3 className="text-[10px] font-bold uppercase tracking-widest mb-4 text-gray-500">Sản phẩm đã đặt</h3>
            <div className="border border-rs-border mb-8">
              {selectedOrder.orderItems?.map((item: any) => (
                <div key={item.id} className="flex justify-between items-center p-4 border-b border-rs-border last:border-0 text-sm">
                  <div className="flex gap-4 items-center">
                    <img src={item.product?.imgUrl} alt={item.product?.title} className="w-10 h-10 object-cover border border-rs-border" />
                    <div className="flex flex-col">
                      <span className="font-bold uppercase tracking-wider text-[11px]">{item.product?.title || `Sản phẩm #${item.productId}`}</span>
                      <span className="text-gray-500 text-[9px] uppercase tracking-widest">{item.product?.artist} | SỐ LƯỢNG: {item.quantity}</span>
                    </div>
                  </div>
                  <span className="font-bold">${(item.priceAtTime * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="bg-rs-gray-light p-4 flex justify-between items-center">
                <span className="font-bold uppercase tracking-widest text-[11px]">Tổng cộng</span>
                <span className="font-bold text-lg">${selectedOrder.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-end border-t border-rs-border pt-6">
              <button onClick={() => setSelectedOrder(null)} className="px-6 py-3 text-[11px] font-bold uppercase tracking-widest bg-black text-white hover:bg-zinc-800 transition-colors">
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
