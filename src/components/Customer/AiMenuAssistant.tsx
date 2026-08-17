import React, { useState } from 'react';
import { X, Sparkles, Utensils, Users, Wallet, ChefHat, Plus, Check } from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { MenuItem, CartItem } from '../../types';
import { formatVND } from '../../utils/format';

interface AiMenuAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AiMenuAssistant: React.FC<AiMenuAssistantProps> = ({ isOpen, onClose }) => {
  const { menuItems, addToCart } = useRestaurant();
  const [partySize, setPartySize] = useState<number>(2);
  const [dietary, setDietary] = useState<'all' | 'spicy' | 'healthy' | 'meat_lover'>('all');
  const [budget, setBudget] = useState<'all' | 'economy' | 'premium'>('all');
  const [suggestedCombo, setSuggestedCombo] = useState<{ title: string; desc: string; items: MenuItem[]; total: number } | null>(null);
  const [addedCombo, setAddedCombo] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = () => {
    // Smart recommendation logic
    let available = menuItems.filter(m => m.isAvailable);

    if (dietary === 'healthy') {
      available = available.filter(m => m.isVegetarian || m.category === 'appetizer' || m.tags.includes('Healthy'));
    } else if (dietary === 'spicy') {
      available = available.filter(m => m.isSpicy || m.category === 'hotpot_grill');
    }

    const selected: MenuItem[] = [];

    // Find main dish
    const mains = available.filter(m => m.category === 'hotpot_grill' || m.category === 'main' || m.category === 'rice_noodles');
    if (partySize >= 3) {
      const hotpot = mains.find(m => m.category === 'hotpot_grill') || mains[0];
      if (hotpot) selected.push(hotpot);
    } else {
      const noodle = mains.find(m => m.category === 'rice_noodles') || mains[0];
      if (noodle) selected.push(noodle);
      const secondMain = mains.find(m => m.id !== noodle?.id);
      if (secondMain) selected.push(secondMain);
    }

    // Find appetizer
    const app = available.find(m => m.category === 'appetizer');
    if (app && !selected.some(s => s.id === app.id)) selected.push(app);

    // Find drink
    const drink = available.find(m => m.category === 'drinks');
    if (drink && !selected.some(s => s.id === drink.id)) selected.push(drink);

    // Find dessert
    if (budget === 'premium') {
      const dessert = available.find(m => m.category === 'dessert');
      if (dessert && !selected.some(s => s.id === dessert.id)) selected.push(dessert);
    }

    const total = selected.reduce((sum, item) => sum + item.price, 0);

    setSuggestedCombo({
      title: `Set Thực Đơn Hoàn Hảo Cho ${partySize} Người`,
      desc: `Được AI cân đối dinh dưỡng giữa món khai vị thanh đạm, món chính đậm đà chuẩn vị và đồ uống giải nhiệt.`,
      items: selected,
      total
    });
    setAddedCombo(false);
  };

  const handleAddAllToCart = () => {
    if (!suggestedCombo) return;
    suggestedCombo.items.forEach(item => {
      const cartItem: CartItem = {
        id: `ci-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        menuItemId: item.id,
        name: item.name,
        price: item.price,
        image: item.image,
        quantity: 1,
        selectedOptions: [],
        note: 'Gợi ý từ AI Sommelier'
      };
      addToCart(cartItem);
    });
    setAddedCombo(true);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div 
        id="modal-ai-menu-advisor"
        className="w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] border border-amber-200 animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
              <Sparkles className="w-5 h-5 fill-white" />
            </div>
            <div>
              <h2 className="font-bold text-base sm:text-lg">AI Menu Advisor & Sommelier</h2>
              <p className="text-xs text-amber-100">Gợi ý món ăn thông minh theo sở thích và số người</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Options input */}
          <div className="space-y-3 bg-stone-50 p-3.5 rounded-2xl border border-stone-200">
            {/* Party size */}
            <div>
              <label className="block text-2xs font-bold text-stone-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-amber-600" />
                <span>Số lượng người dùng bữa:</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 4, 6].map(num => (
                  <button
                    key={num}
                    onClick={() => setPartySize(num)}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      partySize === num
                        ? 'bg-amber-500 text-white border-amber-600 shadow-2xs'
                        : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {num === 6 ? '5+ người' : `${num} người`}
                  </button>
                ))}
              </div>
            </div>

            {/* Dietary */}
            <div>
              <label className="block text-2xs font-bold text-stone-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Utensils className="w-3.5 h-3.5 text-amber-600" />
                <span>Khẩu vị yêu thích:</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {[
                  { id: 'all', label: 'Tất cả' },
                  { id: 'healthy', label: 'Thanh đạm / Chay' },
                  { id: 'spicy', label: 'Chua cay nồng' },
                  { id: 'meat_lover', label: 'Nhiều thịt & nướng' },
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setDietary(opt.id as typeof dietary)}
                    className={`py-1.5 px-2 text-2xs font-bold rounded-xl border transition-all cursor-pointer truncate ${
                      dietary === opt.id
                        ? 'bg-amber-500 text-white border-amber-600 shadow-2xs'
                        : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Budget */}
            <div>
              <label className="block text-2xs font-bold text-stone-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-amber-600" />
                <span>Phân khúc ngân sách:</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'all', label: 'Tiêu chuẩn' },
                  { id: 'economy', label: 'Tiết kiệm' },
                  { id: 'premium', label: 'Cao cấp / Sang xịn' },
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setBudget(opt.id as typeof budget)}
                    className={`py-1.5 px-2 text-2xs font-bold rounded-xl border transition-all cursor-pointer ${
                      budget === opt.id
                        ? 'bg-amber-500 text-white border-amber-600 shadow-2xs'
                        : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleGenerate}
              className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
            >
              <Sparkles className="w-4 h-4" />
              <span>Phân Tích & Gợi Ý Combo Phù Hợp</span>
            </button>
          </div>

          {/* Result Display */}
          {suggestedCombo && (
            <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 space-y-3 animate-in fade-in">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                    <ChefHat className="w-4 h-4 text-amber-600" />
                    <span>{suggestedCombo.title}</span>
                  </h4>
                  <p className="text-xs text-stone-500 mt-0.5">{suggestedCombo.desc}</p>
                </div>
              </div>

              {/* Items in Combo */}
              <div className="space-y-2 pt-1">
                {suggestedCombo.items.map(item => (
                  <div key={item.id} className="flex items-center justify-between bg-white p-2 rounded-xl border border-amber-100 text-xs">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={item.image}
                        alt={item.name}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                      <div>
                        <div className="font-semibold text-stone-800 line-clamp-1">{item.name}</div>
                        <div className="text-2xs text-stone-400">~{item.prepTimeMinutes} phút chuẩn bị</div>
                      </div>
                    </div>
                    <span className="font-bold text-amber-600">{formatVND(item.price)}</span>
                  </div>
                ))}
              </div>

              {/* Total & Add All */}
              <div className="pt-2 border-t border-amber-200/80 flex items-center justify-between">
                <div>
                  <span className="text-xs text-stone-500 block">Tổng trọn gói:</span>
                  <span className="font-extrabold text-amber-700 text-base">{formatVND(suggestedCombo.total)}</span>
                </div>

                <button
                  onClick={handleAddAllToCart}
                  disabled={addedCombo}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                    addedCombo
                      ? 'bg-emerald-600 text-white'
                      : 'bg-amber-600 hover:bg-amber-700 text-white active:scale-95'
                  }`}
                >
                  {addedCombo ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Đã thêm vào giỏ!</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Chọn Toàn Bộ Combo</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
