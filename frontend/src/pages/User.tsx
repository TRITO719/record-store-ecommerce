import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { login, logout, updateProfile } from '../store/userSlice';
import type { RootState } from '../store';
import toast from 'react-hot-toast';
import api from '../services/api';

const User: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoggedIn, profile } = useSelector((state: RootState) => state.user);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [address, setAddress] = useState('');
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    if (isLoggedIn) {
      api.get('/orders/my-orders')
        .then((data: any) => setOrders(data))
        .catch(console.error);
    } else {
      setOrders([]);
    }
  }, [isLoggedIn]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email || !password || (!isLoginMode && !name)) {
      toast.error('Vui lòng điền đầy đủ thông tin', { duration: 2000 });
      return;
    }

    try {
      if (isLoginMode) {
        const res: any = await api.post('/auth/login', { email, password });
        localStorage.setItem('token', res.token);
        dispatch(login({ name: res.user.fullName || 'Khách hàng', email: res.user.email, address: '', role: res.user.role }));
        toast.success('Đăng nhập thành công', { duration: 2000 });
        
        if (res.user.role && res.user.role.toUpperCase() === 'ADMIN') {
          navigate('/admin');
        }
      } else {
        const res: any = await api.post('/auth/register', { email, password, fullName: name });
        toast.success('Đăng ký thành công! Vui lòng đăng nhập.', { duration: 3000 });
        setIsLoginMode(true);
        setPassword('');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại!', { duration: 3000 });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    dispatch(logout());
    toast.success('Đã đăng xuất', { duration: 2000 });
  };

  const handleUpdateProfile = () => {
    if (profile) {
      dispatch(updateProfile({ address }));
      toast.success('Cập nhật thông tin thành công', { duration: 2000 });
    }
  };

  if (!isLoggedIn || !profile) {
    return (
      <div className="flex-grow flex items-center justify-center px-6 py-20 bg-white">
        <div className="w-full max-w-[420px]">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold uppercase tracking-[0.2em] font-display mb-2">
              {isLoginMode ? 'Đăng nhập' : 'Tạo tài khoản'}
            </h1>
            <p className="text-[11px] text-gray-500 uppercase tracking-widest">
              {isLoginMode ? 'Đăng nhập để quản lý tài khoản và đơn hàng của bạn' : 'Tạo tài khoản để nhận ưu đãi và theo dõi đơn hàng'}
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {!isLoginMode && (
              <input
                type="text"
                placeholder="Họ và tên"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-rs-border p-4 text-[12px] font-sans focus:outline-none focus:border-black transition-colors"
              />
            )}
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-rs-border p-4 text-[12px] font-sans focus:outline-none focus:border-black transition-colors"
            />
            <input
              type="password"
              placeholder="Mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-rs-border p-4 text-[12px] font-sans focus:outline-none focus:border-black transition-colors"
            />

            {isLoginMode && (
              <div className="text-right">
                <button className="text-[10px] uppercase tracking-widest font-bold text-gray-400 hover:text-black transition-colors">
                  Quên mật khẩu?
                </button>
              </div>
            )}

            <button className="w-full bg-black text-white py-5 text-[11px] font-bold uppercase tracking-[0.3em] hover:bg-zinc-800 transition-colors mt-4">
              {isLoginMode ? 'Đăng nhập' : 'Tạo tài khoản'}
            </button>
          </form>

          <div className="mt-10 text-center border-t border-rs-border pt-8">
            <p className="text-[11px] text-gray-500 uppercase tracking-widest mb-4">
              {isLoginMode ? 'Bạn chưa có tài khoản?' : 'Bạn đã có tài khoản?'}
            </p>
            <button
              onClick={() => setIsLoginMode(!isLoginMode)}
              className="text-[11px] font-bold uppercase tracking-widest border-b border-black pb-1 hover:opacity-50 transition-opacity"
            >
              {isLoginMode ? 'Đăng ký ngay' : 'Quay lại đăng nhập'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-grow bg-white px-6 py-20">
      <div className="max-w-[1200px] mx-auto grid lg:grid-cols-[1.3fr_0.7fr] gap-10">
        <div>
          <div className="flex flex-col gap-6 mb-10">
            <div className="bg-rs-gray-light p-8 border border-rs-border">
              <div className="flex flex-col gap-3">
                <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500 font-bold">Tài khoản của bạn</p>
                <h1 className="text-4xl font-display font-bold uppercase tracking-tight">Xin chào, {profile.name}</h1>
                <p className="text-sm text-gray-500">Email: {profile.email}</p>
                <p className="text-sm text-gray-500">Địa chỉ: {profile.address}</p>
                <p className="text-sm text-gray-500">Số điện thoại: {profile.phone || 'Chưa cập nhật'}</p>
              </div>
            </div>

            <div className="bg-white border border-rs-border p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500 font-bold">Lịch sử đơn hàng</p>
                  <h2 className="text-2xl font-bold uppercase tracking-tight">Đơn hàng gần đây</h2>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-[10px] uppercase tracking-[0.3em] font-bold text-gray-600 hover:text-black transition-colors"
                >
                  Đăng xuất
                </button>
              </div>
              
              {profile.role?.toUpperCase() === 'ADMIN' && (
                <div className="mb-6 p-4 bg-black text-white flex justify-between items-center">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] font-bold">Quyền Quản Trị</p>
                    <p className="text-xs">Bạn đang đăng nhập dưới tư cách Admin.</p>
                  </div>
                  <button 
                    onClick={() => navigate('/admin')}
                    className="bg-white text-black px-4 py-2 text-[10px] uppercase tracking-widest font-bold hover:bg-gray-200 transition-colors"
                  >
                    Vào Bảng Điều Khiển
                  </button>
                </div>
              )}

              {orders.length === 0 ? (
                <p className="text-sm text-gray-500">Bạn chưa có đơn hàng nào.</p>
              ) : (
                <div className="space-y-6">
                  {orders.map((order) => (
                    <div key={order.id} className="border border-rs-border p-6 rounded-md">
                      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500 font-bold">Mã đơn hàng</p>
                          <p className="text-sm font-bold">#{order.id.split('-')[0]}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500 font-bold">Ngày đặt</p>
                          <p className="text-sm">{new Date(order.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500 font-bold">Tình trạng</p>
                          <p className="text-sm">{order.status}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500 font-bold">Tổng giá</p>
                          <p className="text-sm font-bold">${order.totalAmount.toFixed(2)}</p>
                        </div>
                      </div>
                      <div className="mt-6 space-y-3">
                        {order.orderItems.map((item: any) => (
                          <div key={item.id} className="flex justify-between text-sm text-gray-600">
                            <span>{item.product.title} x{item.quantity}</span>
                            <span>${(item.priceAtTime * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="bg-rs-gray-light p-8 border border-rs-border">
            <h2 className="text-xl font-bold uppercase tracking-[0.2em] mb-4">Cập nhật thông tin</h2>
            <div className="space-y-4">
              <label className="block text-[10px] uppercase tracking-[0.3em] text-gray-500">Tên</label>
              <input
                type="text"
                value={profile.name}
                disabled
                className="w-full border border-rs-border p-3 text-[12px] bg-white/80"
              />
              <label className="block text-[10px] uppercase tracking-[0.3em] text-gray-500">Email</label>
              <input
                type="email"
                value={profile.email}
                disabled
                className="w-full border border-rs-border p-3 text-[12px] bg-white/80"
              />
              <label className="block text-[10px] uppercase tracking-[0.3em] text-gray-500">Địa chỉ</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={profile.address}
                className="w-full border border-rs-border p-3 text-[12px]"
              />
              <button
                onClick={handleUpdateProfile}
                className="w-full bg-black text-white py-3 uppercase tracking-[0.3em] text-[11px] font-bold hover:bg-zinc-800 transition-colors"
              >
                Lưu thay đổi
              </button>
            </div>
          </div>

          <div className="bg-black text-white p-8 text-center">
            <h3 className="text-sm uppercase tracking-[0.3em] font-bold mb-3">Lợi ích thành viên</h3>
            <p className="text-sm leading-relaxed">Nhận thông báo sớm, mã giảm giá và ưu đãi đặc biệt mỗi khi bạn thanh toán.</p>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default User;
