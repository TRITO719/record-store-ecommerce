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
      <div className="pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <h1 className="text-3xl font-display font-bold uppercase tracking-tight mb-2" style={{ color: 'var(--text-primary)' }}>Quản lý Khách hàng</h1>
        <p className="text-[11px] uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>Danh sách tài khoản đã đăng ký</p>
      </div>

      <div className="overflow-x-auto" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] uppercase tracking-[0.2em]" style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
              <th className="p-5 font-bold">ID / Tên</th>
              <th className="p-5 font-bold">Email</th>
              <th className="p-5 font-bold">Ngày tham gia</th>
              <th className="p-5 font-bold">Vai trò</th>
              <th className="p-5 font-bold text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="text-sm" style={{ color: 'var(--text-primary)' }}>
            {users.map((item) => (
              <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td className="p-5">
                  <p className="font-bold mb-1">{item.fullName || 'Chưa cập nhật'}</p>
                  <p className="text-[10px] tracking-widest" style={{ color: 'var(--text-secondary)' }}>ID: {item.id.substring(0, 8)}...</p>
                </td>
                <td className="p-5">{item.email}</td>
                <td className="p-5">{new Date(item.createdAt).toLocaleDateString()}</td>
                <td className="p-5">
                  {item.role === 'ADMIN' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-[9px] uppercase tracking-widest font-bold" style={{ background: 'var(--text-primary)', color: 'var(--text-inverse)' }}>
                      <Shield size={10} /> Admin
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-[9px] uppercase tracking-widest font-bold" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
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
        {users.length === 0 && <p className="text-sm p-5 text-center" style={{ color: 'var(--text-secondary)' }}>Không có người dùng nào.</p>}
      </div>
    </div>
  );
};

export default AdminUsers;
