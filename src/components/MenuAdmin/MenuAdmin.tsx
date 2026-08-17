import React, { useState } from 'react';
import { 
  Layers, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Flame, 
  Leaf, 
  Clock, 
  Sparkles,
  UtensilsCrossed,
  X,
  RotateCcw,
  Check,
  Image as ImageIcon,
  AlertTriangle
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { MenuItem, MealCategory } from '../../types';
import { formatVND } from '../../utils/format';

const SAMPLE_FOOD_IMAGES = [
  { label: 'Cơm / Mì', url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80' },
  { label: 'Lẩu hải sản', url: 'https://images.unsplash.com/photo-1555126634-323283e090fa?auto=format&fit=crop&w=600&q=80' },
  { label: 'Bò nướng / Bò xào', url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80' },
  { label: 'Gà nướng lu', url: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=600&q=80' },
  { label: 'Khai vị / Gỏi', url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80' },
  { label: 'Nước uống / Trà đá', url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80' },
  { label: 'Cà phê / Nước ép', url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80' },
  { label: 'Tráng miệng / Chè', url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80' },
];

export const MenuAdmin: React.FC = () => {
  const { 
    menuItems, 
    toggleDishAvailability, 
    updateDish, 
    addNewDish, 
    deleteDish, 
    resetMenuToDefault 
  } = useRestaurant();

  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState<MealCategory>('all');
  const [editingDish, setEditingDish] = useState<MenuItem | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [deletingDishId, setDeletingDishId] = useState<string | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3000);
  };

  // New dish form state
  const [formData, setFormData] = useState<Omit<MenuItem, 'id'>>({
    name: '',
    category: 'main',
    price: 65000,
    originalPrice: 0,
    description: '',
    image: SAMPLE_FOOD_IMAGES[0].url,
    isPopular: false,
    isVegetarian: false,
    isSpicy: false,
    isAvailable: true,
    prepTimeMinutes: 10,
    tags: ['Món mới']
  });

  const filteredItems = menuItems.filter(item => {
    if (selectedCat !== 'all' && item.category !== selectedCat) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q);
    }
    return true;
  });

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingDish) {
      updateDish(editingDish);
      showToast(`Đã cập nhật món "${editingDish.name}" thành công!`);
      setEditingDish(null);
    }
  };

  const handleSaveNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    addNewDish(formData);
    showToast(`Đã thêm món mới "${formData.name}" vào thực đơn!`);
    setIsCreatingNew(false);
    // Reset form
    setFormData({
      name: '',
      category: 'main',
      price: 65000,
      originalPrice: 0,
      description: '',
      image: SAMPLE_FOOD_IMAGES[0].url,
      isPopular: false,
      isVegetarian: false,
      isSpicy: false,
      isAvailable: true,
      prepTimeMinutes: 10,
      tags: ['Món mới']
    });
  };

  const handleConfirmDelete = () => {
    if (deletingDishId) {
      const dish = menuItems.find(m => m.id === deletingDishId);
      deleteDish(deletingDishId);
      showToast(`Đã xóa món "${dish?.name || 'món ăn'}" khỏi thực đơn`);
      setDeletingDishId(null);
    }
  };

  const handleConfirmResetMenu = () => {
    resetMenuToDefault();
    showToast('Đã khôi phục thực đơn về danh sách chuẩn gốc');
    setIsResetConfirmOpen(false);
  };

  const getCategoryLabel = (cat: MealCategory) => {
    switch (cat) {
      case 'hotpot_grill': return 'Lẩu & Nướng';
      case 'rice_noodles': return 'Cơm & Mì';
      case 'main': return 'Món Chính';
      case 'appetizer': return 'Khai Vị';
      case 'drinks': return 'Đồ Uống';
      case 'dessert': return 'Tráng Miệng';
      default: return 'Khác';
    }
  };

  return (
    <div className="min-h-screen bg-stone-100/70 pb-24 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-stone-700 flex items-center gap-2.5 text-xs font-bold animate-in slide-in-from-bottom-5 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="bg-white border-b border-stone-200 sticky top-[88px] sm:top-[92px] z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-extrabold text-base sm:text-lg text-stone-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-600" />
              <span>Quản Lý Thực Đơn & Món Ăn</span>
              <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-200">
                {menuItems.length} món
              </span>
            </h1>
            <p className="text-xs text-stone-500">
              Cập nhật giá bán, thêm món mới, chỉnh sửa và tự động đồng bộ vĩnh viễn
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsResetConfirmOpen(true)}
              className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-stone-200"
              title="Khôi phục danh sách món mẫu gốc"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Khôi Phục Gốc</span>
            </button>

            <button
              id="btn-add-new-dish"
              onClick={() => setIsCreatingNew(true)}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Món Ăn Mới</span>
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="max-w-7xl mx-auto px-4 py-2.5 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-1 overflow-x-auto scrollbar-none">
            {[
              { id: 'all', label: 'Tất cả' },
              { id: 'hotpot_grill', label: 'Lẩu & Nướng' },
              { id: 'rice_noodles', label: 'Cơm & Mì' },
              { id: 'main', label: 'Món Chính' },
              { id: 'appetizer', label: 'Khai Vị' },
              { id: 'drinks', label: 'Đồ Uống' },
              { id: 'dessert', label: 'Tráng Miệng' },
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCat(cat.id as MealCategory)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCat === cat.id
                    ? 'bg-stone-900 text-white shadow-2xs'
                    : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm tên món ăn..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-stone-50 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>
      </div>

      {/* Main Table / Grid */}
      <div className="max-w-7xl mx-auto px-4 pt-6">
        <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Món Ăn</th>
                  <th className="py-3.5 px-4">Danh Mục</th>
                  <th className="py-3.5 px-4">Giá Bán</th>
                  <th className="py-3.5 px-4">Đặc Điểm</th>
                  <th className="py-3.5 px-4">Trạng Thái Kho</th>
                  <th className="py-3.5 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-700 font-medium">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-stone-50/80 transition-colors">
                    {/* Dish & Image */}
                    <td className="py-3 px-4 flex items-center gap-3">
                      <img
                        src={item.image}
                        alt={item.name}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-xl object-cover border border-stone-200 shrink-0"
                      />
                      <div>
                        <div className="font-bold text-stone-900 text-xs sm:text-sm">{item.name}</div>
                        <div className="text-2xs text-stone-400 line-clamp-1 max-w-xs">{item.description}</div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 rounded-lg bg-stone-100 text-stone-800 font-semibold text-2xs border border-stone-200">
                        {getCategoryLabel(item.category)}
                      </span>
                    </td>

                    {/* Price */}
                    <td className="py-3 px-4 font-extrabold text-amber-600 text-sm">
                      {formatVND(item.price)}
                    </td>

                    {/* Features */}
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {item.isPopular && <span className="text-3xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">Hot</span>}
                        {item.isVegetarian && <span className="text-3xs bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">Chay</span>}
                        {item.isSpicy && <span className="text-3xs bg-red-100 text-red-800 px-1.5 py-0.5 rounded font-bold">Cay</span>}
                      </div>
                    </td>

                    {/* Availability toggle */}
                    <td className="py-3 px-4">
                      <button
                        onClick={() => {
                          toggleDishAvailability(item.id);
                          showToast(`Đã chuyển trạng thái món "${item.name}"`);
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-2xs font-bold transition-all cursor-pointer ${
                          item.isAvailable
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200'
                            : 'bg-red-100 text-red-800 border border-red-300 hover:bg-red-200'
                        }`}
                      >
                        {item.isAvailable ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Đang phục vụ</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Tạm hết món</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setEditingDish({ ...item })}
                          className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg font-semibold text-2xs transition-colors cursor-pointer"
                          title="Chỉnh sửa món"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingDishId(item.id)}
                          className="p-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg font-semibold text-2xs transition-colors cursor-pointer"
                          title="Xóa món ăn"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit Dish Modal */}
      {editingDish && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl border border-stone-200 animate-in zoom-in-95 duration-200">
            <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <h3 className="font-bold text-stone-900 text-base flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-600" />
                <span>Chỉnh Sửa Món Ăn</span>
              </h3>
              <button onClick={() => setEditingDish(null)} className="p-1 text-stone-400 hover:text-stone-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="p-5 space-y-3.5 text-xs max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Tên món (*):</label>
                <input
                  type="text"
                  required
                  value={editingDish.name}
                  onChange={(e) => setEditingDish({ ...editingDish, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Danh mục:</label>
                  <select
                    value={editingDish.category}
                    onChange={(e) => setEditingDish({ ...editingDish, category: e.target.value as MealCategory })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
                  >
                    <option value="hotpot_grill">Lẩu & Nướng</option>
                    <option value="rice_noodles">Cơm & Phở Mì</option>
                    <option value="main">Món Chính</option>
                    <option value="appetizer">Khai Vị</option>
                    <option value="drinks">Đồ Uống</option>
                    <option value="dessert">Tráng Miệng</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Giá bán (VNĐ):</label>
                  <input
                    type="number"
                    required
                    min={0}
                    step={1000}
                    value={editingDish.price}
                    onChange={(e) => setEditingDish({ ...editingDish, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Mô tả món:</label>
                <textarea
                  rows={2}
                  value={editingDish.description}
                  onChange={(e) => setEditingDish({ ...editingDish, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Hình ảnh món (URL):</label>
                <input
                  type="text"
                  value={editingDish.image}
                  onChange={(e) => setEditingDish({ ...editingDish, image: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:ring-2 focus:ring-amber-500 focus:outline-none mb-2"
                />
                {/* Image samples */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {SAMPLE_FOOD_IMAGES.map((sample, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setEditingDish({ ...editingDish, image: sample.url })}
                      className="px-2 py-1 bg-stone-100 hover:bg-amber-100 text-stone-600 hover:text-amber-800 rounded-lg text-3xs font-semibold whitespace-nowrap border border-stone-200 cursor-pointer"
                    >
                      {sample.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingDish.isPopular}
                    onChange={(e) => setEditingDish({ ...editingDish, isPopular: e.target.checked })}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span>Bán chạy</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingDish.isVegetarian}
                    onChange={(e) => setEditingDish({ ...editingDish, isVegetarian: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Ăn chay</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingDish.isSpicy}
                    onChange={(e) => setEditingDish({ ...editingDish, isSpicy: e.target.checked })}
                    className="rounded text-red-600 focus:ring-red-500"
                  />
                  <span>Món cay</span>
                </label>
              </div>

              <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingDish(null)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Lưu Thay Đổi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create New Dish Modal */}
      {isCreatingNew && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl border border-stone-200 animate-in zoom-in-95 duration-200">
            <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <h3 className="font-bold text-stone-900 text-base flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-600" />
                <span>Thêm Món Ăn Mới Vào Thực Đơn</span>
              </h3>
              <button onClick={() => setIsCreatingNew(false)} className="p-1 text-stone-400 hover:text-stone-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveNew} className="p-5 space-y-3.5 text-xs max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Tên món ăn (*):</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Cá bống sông Trà kho tiêu"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Danh mục:</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as MealCategory })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
                  >
                    <option value="hotpot_grill">Lẩu & Nướng</option>
                    <option value="rice_noodles">Cơm & Phở Mì</option>
                    <option value="main">Món Chính</option>
                    <option value="appetizer">Khai Vị</option>
                    <option value="drinks">Đồ Uống</option>
                    <option value="dessert">Tráng Miệng</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Giá bán (VNĐ):</label>
                  <input
                    type="number"
                    required
                    min={0}
                    step={1000}
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Mô tả món:</label>
                <textarea
                  rows={2}
                  placeholder="Mô tả nguyên liệu tươi ngon, cách chế biến đặc trưng..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Link hình ảnh món ăn:</label>
                <input
                  type="text"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:ring-2 focus:ring-amber-500 focus:outline-none mb-2"
                />
                {/* Image samples */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {SAMPLE_FOOD_IMAGES.map((sample, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFormData({ ...formData, image: sample.url })}
                      className="px-2 py-1 bg-stone-100 hover:bg-amber-100 text-stone-600 hover:text-amber-800 rounded-lg text-3xs font-semibold whitespace-nowrap border border-stone-200 cursor-pointer"
                    >
                      {sample.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isPopular}
                    onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span>Bán chạy</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isVegetarian}
                    onChange={(e) => setFormData({ ...formData, isVegetarian: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Ăn chay</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isSpicy}
                    onChange={(e) => setFormData({ ...formData, isSpicy: e.target.checked })}
                    className="rounded text-red-600 focus:ring-red-500"
                  />
                  <span>Món cay</span>
                </label>
              </div>

              <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingNew(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-bold cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tạo Món Mới</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingDishId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-stone-200 text-center animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-stone-900 text-base mb-1">
              Xóa Món Ăn Này?
            </h3>
            <p className="text-xs text-stone-500 mb-4">
              Món "{menuItems.find(m => m.id === deletingDishId)?.name}" sẽ bị xóa khỏi thực đơn và không hiển thị cho khách hàng nữa.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDeletingDishId(null)}
                className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-700 text-xs font-bold hover:bg-stone-100 transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold transition-all cursor-pointer shadow-xs"
              >
                Xác Nhận Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Menu Confirmation Modal */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-stone-200 text-center animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-3">
              <RotateCcw className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-stone-900 text-base mb-1">
              Khôi Phục Thực Đơn Gốc?
            </h3>
            <p className="text-xs text-stone-500 mb-4">
              Thực đơn sẽ được khôi phục về danh mục và các món ăn mẫu chuẩn ban đầu.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-700 text-xs font-bold hover:bg-stone-100 transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmResetMenu}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold transition-all cursor-pointer shadow-xs"
              >
                Khôi Phục
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

