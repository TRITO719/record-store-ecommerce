import React, { useEffect, useState } from 'react';
import { Shield, CheckCircle } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data: any = await api.get('/admin/users');
      setUsers(data);
    } catch (error) {
      toast.error('Lỗi khi tải danh sách khách hàng');
    }
  };

  const handleRoleChange = async (id: string, currentRole: string) => {
    const newRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN';
    if (window.confirm(`Bạn có chắc muốn cấp quyền ${newRole} cho người này?`)) {
      try {
        await api.put(`/admin/users/${id}/role`, { role: newRole });
        toast.success('Cập nhật quyền thành công');
        fetchUsers();
      } catch (error) {
        toast.error('Lỗi khi cập nhật quyền');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-rs-border pb-4">
        <h1 className="text-3xl font-display font-bold uppercase tracking-tight mb-2">Quản lý Khách hàng</h1>
        <p className="text-[11px] uppercase tracking-widest text-gray-500">Danh sách tài khoản đã đăng ký</p>
      </div>

      <div className="bg-white border border-rs-border overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] uppercase tracking-[0.2em] text-gray-500 border-b border-rs-border bg-rs-gray-light">
              <th className="p-5 font-bold">ID / Tên</th>
              <th className="p-5 font-bold">Email</th>
              <th className="p-5 font-bold">Ngày tham gia</th>
              <th className="p-5 font-bold">Vai trò</th>
              <th className="p-5 font-bold text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {users.map((item) => (
              <tr key={item.id} className="border-b border-rs-border last:border-0 hover:bg-rs-gray-light/50">
                <td className="p-5">
                  <p className="font-bold mb-1">{item.fullName || 'Chưa cập nhật'}</p>
                  <p className="text-[10px] text-gray-500 tracking-widest">ID: {item.id.substring(0, 8)}...</p>
                </td>
                <td className="p-5">{item.email}</td>
                <td className="p-5">{new Date(item.createdAt).toLocaleDateString()}</td>
                <td className="p-5">
                  {item.role === 'ADMIN' ? (
                    <span className="inline-flex items-center gap-1 bg-black text-white px-2 py-1 text-[9px] uppercase tracking-widest font-bold">
                      <Shield size={10} /> Admin
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 bg-rs-gray-light border border-rs-border px-2 py-1 text-[9px] uppercase tracking-widest font-bold">
                      User
                    </span>
                  )}
                </td>
                <td className="p-5 text-right">
                  <button 
                    onClick={() => handleRoleChange(item.id, item.role)}
                    className="text-[10px] uppercase tracking-widest font-bold text-blue-500 hover:text-blue-700 transition-colors inline-flex items-center gap-1 mr-4"
                  >
                    <CheckCircle size={12} /> {item.role === 'ADMIN' ? 'Hạ xuống User' : 'Lên Admin'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && <p className="text-sm text-gray-500 p-5 text-center">Không có người dùng nào.</p>}
      </div>
    </div>
  );
};

export default AdminUsers;
