import React, { useEffect, useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useDispatch } from 'react-redux';
import { fetchProducts as fetchGlobalProducts } from '../../store/productSlice';
import type { AppDispatch } from '../../store';

const AdminProducts: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [products, setProducts] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '', artist: '', price: '', imgUrl: '', category: 'vinyl', stock: '', description: ''
  });
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const data: any = await api.get('/products');
      setProducts(data);
    } catch (error) {
      toast.error('Lỗi khi tải danh sách sản phẩm');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const uploadData = new FormData();
    uploadData.append('image', file);
    
    setIsUploading(true);
    try {
      const res: any = await api.post('/upload', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFormData(prev => ({ ...prev, imgUrl: res.imgUrl }));
      toast.success('Tải ảnh lên thành công');
    } catch (err) {
      toast.error('Lỗi khi tải ảnh lên');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Bạn có chắc muốn xóa sản phẩm này không?')) {
      try {
        await api.delete(`/products/${id}`);
        toast.success('Xóa thành công');
        fetchProducts();
        dispatch(fetchGlobalProducts());
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Lỗi khi xóa sản phẩm');
      }
    }
  };

  const handleOpenModal = (product: any = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        title: product.title,
        artist: product.artist,
        price: product.price.toString(),
        imgUrl: product.imgUrl,
        category: product.category,
        stock: product.stock.toString(),
        description: product.description || ''
      });
    } else {
      setEditingProduct(null);
      setFormData({ title: '', artist: '', price: '', imgUrl: '', category: 'vinyl', stock: '', description: '' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, formData);
        toast.success('Cập nhật thành công');
      } else {
        await api.post('/products', formData);
        toast.success('Thêm thành công');
      }
      fetchProducts();
      dispatch(fetchGlobalProducts());
      handleCloseModal();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <div>
          <h1 className="text-3xl font-display font-bold uppercase tracking-tight mb-2" style={{ color: 'var(--text-primary)' }}>Quản lý Sản phẩm</h1>
          <p className="text-[11px] uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>Danh sách Vinyl, CD và Merchandise</p>
        </div>
        <button onClick={() => handleOpenModal()} className="flex items-center gap-2 px-5 py-3 text-[11px] font-bold uppercase tracking-widest transition-colors" style={{ background: 'var(--text-primary)', color: 'var(--text-inverse)' }}>
          <Plus size={16} />
          Thêm sản phẩm
        </button>
      </div>

      <div className="overflow-x-auto" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] uppercase tracking-[0.2em]" style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
              <th className="p-5 font-bold">ID</th>
              <th className="p-5 font-bold">Hình ảnh</th>
              <th className="p-5 font-bold">Tên sản phẩm / Nghệ sĩ</th>
              <th className="p-5 font-bold">Danh mục</th>
              <th className="p-5 font-bold">Giá</th>
              <th className="p-5 font-bold">Tồn kho</th>
              <th className="p-5 font-bold text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="text-sm" style={{ color: 'var(--text-primary)' }}>
            {products.map((item) => (
              <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td className="p-5 font-bold">#{item.id}</td>
                <td className="p-5">
                  <div className="w-12 h-12 overflow-hidden" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                    <img src={item.imgUrl} alt={item.title} className="w-full h-full object-cover" />
                  </div>
                </td>
                <td className="p-5">
                  <p className="font-bold uppercase tracking-wider text-sm mb-1">{item.title}</p>
                  <p className="text-[10px] uppercase tracking-[0.2em] font-bold" style={{ color: 'var(--text-secondary)' }}>{item.artist}</p>
                </td>
                <td className="p-5">
                  <span className="inline-block px-2 py-1 text-[9px] uppercase tracking-widest font-bold" style={{ background: 'var(--text-primary)', color: 'var(--text-inverse)' }}>{item.category}</span>
                </td>
                <td className="p-5 font-bold">${item.price.toFixed(2)}</td>
                <td className="p-5 font-bold">{item.stock}</td>
                <td className="p-5">
                  <div className="flex justify-end gap-3">
                    <button onClick={() => handleOpenModal(item)} className="transition-colors" style={{ color: 'var(--text-secondary)' }}><Edit size={16} /></button>
                    <button onClick={() => handleDelete(item.id)} className="hover:text-red-500 transition-colors" style={{ color: 'var(--text-secondary)' }}><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {products.length === 0 && <p className="text-sm p-5 text-center" style={{ color: 'var(--text-secondary)' }}>Không có sản phẩm nào.</p>}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-sm max-h-[85vh] flex flex-col" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <h2 className="text-lg font-bold uppercase tracking-widest px-6 pt-6 pb-4" style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border)' }}>
              {editingProduct ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}
            </h2>
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
              <div className="overflow-y-auto flex-1 px-6 py-4 space-y-3">
                <input type="text" placeholder="Tên sản phẩm" required className="w-full p-2.5 text-sm focus:outline-none" style={{ border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }} value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                <input type="text" placeholder="Nghệ sĩ" required className="w-full p-2.5 text-sm focus:outline-none" style={{ border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }} value={formData.artist} onChange={e => setFormData({...formData, artist: e.target.value})} />
                <div className="flex gap-3">
                  <input type="number" step="0.01" placeholder="Giá ($)" required className="w-1/2 p-2.5 text-sm focus:outline-none" style={{ border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }} value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                  <input type="number" placeholder="Tồn kho" required className="w-1/2 p-2.5 text-sm focus:outline-none" style={{ border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }} value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} />
                </div>
                <textarea placeholder="Mô tả sản phẩm" className="w-full p-2.5 text-sm focus:outline-none h-20 resize-none" style={{ border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                
                <div className="flex flex-col gap-2 p-3" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                  <label className="text-[10px] uppercase tracking-widest font-bold" style={{ color: 'var(--text-secondary)' }}>Hình ảnh sản phẩm</label>
                  <div className="flex items-center gap-3">
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="text-xs w-full file:mr-3 file:py-1.5 file:px-3 file:border-0 file:text-[10px] file:uppercase file:tracking-widest file:font-bold file:bg-black file:text-white hover:file:bg-zinc-800 cursor-pointer" style={{ color: 'var(--text-primary)' }} disabled={isUploading} />
                    {isUploading && <span className="text-[10px] uppercase tracking-widest whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>Đang tải...</span>}
                  </div>
                  <input type="text" placeholder="Hoặc nhập URL Hình ảnh" required className="w-full p-2.5 text-sm focus:outline-none" style={{ border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }} value={formData.imgUrl} onChange={e => setFormData({...formData, imgUrl: e.target.value})} />
                  {formData.imgUrl && (
                    <div className="mt-1 w-16 h-16 overflow-hidden" style={{ border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
                      <img src={formData.imgUrl} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                <select className="w-full p-2.5 text-sm focus:outline-none uppercase tracking-widest" style={{ border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }} value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                  <option value="vinyl">Vinyl</option>
                  <option value="cd">CD</option>
                  <option value="merch">Merch</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 px-6 py-4" style={{ borderTop: '1px solid var(--border)' }}>
                <button type="button" onClick={handleCloseModal} className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest transition-colors" style={{ border: '1px solid var(--border)', color: 'var(--text-primary)', background: 'transparent' }}>Hủy</button>
                <button type="submit" className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest transition-colors" style={{ background: 'var(--text-primary)', color: 'var(--text-inverse)' }}>Lưu</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
