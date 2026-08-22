import React, { useState } from 'react';
import { X, Minus, Plus, ShoppingBag, Clock, Info, User, Sparkles, Check } from 'lucide-react';
import { MenuItem, CartItem, CartItemOption, OptionGroup } from '../../types';
import { formatVND } from '../../utils/format';

interface FoodDetailModalProps {
  item: MenuItem;
  onClose: () => void;
  onAddToCart: (cartItem: CartItem) => void;
}

const COMMON_SIDE_ADDONS: OptionGroup = {
  id: 'common_side_addons',
  name: 'Món ăn kèm & Gọi thêm (Topping)',
  required: false,
  maxSelect: 5,
  choices: [
    { id: 'com_them', name: '🍚 Thêm chén cơm trắng ST25 dẻo nóng', price: 10000 },
    { id: 'trung_opla', name: '🍳 Thêm trứng gà ốp la lòng đào', price: 10000 },
    { id: 'canh_them', name: '🥣 Thêm chén canh rong biển thịt bằm', price: 15000 },
    { id: 'rau_them', name: '🥗 Thêm đĩa rau luộc / kim chi chua giòn', price: 10000 },
    { id: 'tra_da', name: '🥤 Thêm ly trà đá hoa lài tươi mát', price: 5000 },
  ]
};

const DINER_PRESETS = [
  'Khách 1',
  'Khách 2',
  'Khách 3',
  'Khách 4',
  'Món dùng chung cả bàn'
];

export const FoodDetailModal: React.FC<FoodDetailModalProps> = ({ item, onClose, onAddToCart }) => {
  const [quantity, setQuantity] = useState(1);
  const [dinerTag, setDinerTag] = useState<string>('');

  // Prepare all option groups including common side add-ons if suitable
  const combinedGroups: OptionGroup[] = React.useMemo(() => {
    const existing = item.optionGroups ? [...item.optionGroups] : [];
    const hasAddonsGroup = existing.some(g => 
      g.name.toLowerCase().includes('kèm') || 
      g.name.toLowerCase().includes('thêm') || 
      g.name.toLowerCase().includes('nhúng') ||
      g.name.toLowerCase().includes('nem')
    );
    
    // If not a drink/dessert and does not have dedicated add-on group, attach common add-ons
    if (!hasAddonsGroup && item.category !== 'drinks' && item.category !== 'dessert' && item.category !== 'sides_addons') {
      existing.push(COMMON_SIDE_ADDONS);
    }
    return existing;
  }, [item]);

  const [selectedChoices, setSelectedChoices] = useState<Record<string, string[]>>(() => {
    const initial: Record<string, string[]> = {};
    combinedGroups.forEach(group => {
      if (group.choices.length > 0) {
        if (group.required) {
          initial[group.id] = [group.choices[0].id];
        } else {
          initial[group.id] = [];
        }
      }
    });
    return initial;
  });
  const [note, setNote] = useState('');

  // Toggle or select option
  const handleToggleChoice = (groupId: string, choiceId: string, maxSelect: number) => {
    setSelectedChoices(prev => {
      const current = prev[groupId] || [];
      if (maxSelect === 1) {
        return { ...prev, [groupId]: [choiceId] };
      }
      if (current.includes(choiceId)) {
        return { ...prev, [groupId]: current.filter(id => id !== choiceId) };
      } else {
        if (current.length < maxSelect) {
          return { ...prev, [groupId]: [...current, choiceId] };
        }
        return prev;
      }
    });
  };

  // Calculate calculated extra price
  let extraPrice = 0;
  const chosenOptionsList: CartItemOption[] = [];

  combinedGroups.forEach(group => {
    const chosenIds = selectedChoices[group.id] || [];
    chosenIds.forEach(id => {
      const choice = group.choices.find(c => c.id === id);
      if (choice) {
        extraPrice += choice.price;
        chosenOptionsList.push({
          groupName: group.name,
          choiceName: choice.name,
          price: choice.price
        });
      }
    });
  });

  const unitPrice = item.price + extraPrice;
  const totalPrice = unitPrice * quantity;

  // Validation
  const isRequiredFilled = combinedGroups.every(group => {
    if (!group.required) return true;
    const chosen = selectedChoices[group.id] || [];
    return chosen.length > 0;
  });

  const handleConfirm = () => {
    if (!isRequiredFilled) return;

    let finalNote = note.trim();
    if (dinerTag.trim()) {
      finalNote = `[${dinerTag.trim()}] ${finalNote}`.trim();
    }

    const cartItem: CartItem = {
      id: `ci-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      menuItemId: item.id,
      name: item.name,
      price: unitPrice,
      image: item.image,
      quantity,
      selectedOptions: chosenOptionsList,
      note: finalNote
    };

    onAddToCart(cartItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        id="modal-food-detail"
        className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] border border-stone-200 animate-in zoom-in-95 duration-200"
      >
        {/* Modal Header & Hero Image */}
        <div className="relative h-48 sm:h-56 w-full overflow-hidden bg-stone-100 shrink-0">
          <img
            src={item.image}
            alt={item.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-all cursor-pointer backdrop-blur-xs"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="absolute bottom-3 left-3 bg-black/60 text-white text-xs px-2.5 py-1 rounded-lg backdrop-blur-xs flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>Thời gian chuẩn bị: ~{item.prepTimeMinutes} phút</span>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4 divide-y divide-stone-100">
          {/* Main Info */}
          <div>
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg sm:text-xl font-black text-stone-900 leading-snug">
                {item.name}
              </h2>
              <div className="text-right shrink-0">
                <div className="text-lg sm:text-xl font-extrabold text-amber-600">
                  {formatVND(item.price)}
                </div>
              </div>
            </div>
            <p className="text-stone-500 text-xs sm:text-sm mt-1 leading-relaxed">
              {item.description}
            </p>
          </div>

          {/* Diner Assignment: 01 Khách chọn nhiều món & phân biệt suất ăn */}
          <div className="pt-3 space-y-2">
            <label className="block text-xs font-bold text-stone-800 flex items-center gap-1.5">
              <User className="w-4 h-4 text-amber-600" />
              <span>Phần ăn của ai / Suất ăn (Tùy chọn):</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {DINER_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setDinerTag(dinerTag === preset ? '' : preset)}
                  className={`text-2xs font-semibold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                    dinerTag === preset
                      ? 'bg-amber-600 border-amber-600 text-white shadow-xs font-bold'
                      : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  {dinerTag === preset && '✓ '}
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Option Groups & Side Add-ons */}
          {combinedGroups.map((group) => {
            const chosen = selectedChoices[group.id] || [];
            const isAddonGroup = group.id === 'common_side_addons' || group.name.toLowerCase().includes('thêm') || group.name.toLowerCase().includes('kèm');

            return (
              <div key={group.id} className="pt-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-stone-900 text-xs sm:text-sm flex items-center gap-1">
                      {isAddonGroup && <Sparkles className="w-3.5 h-3.5 text-amber-500" />}
                      {group.name}
                    </span>
                    {group.required ? (
                      <span className="text-3xs font-semibold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700">
                        Bắt buộc
                      </span>
                    ) : (
                      <span className="text-3xs font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200">
                        Chọn nhiều món thêm (Tối đa {group.maxSelect})
                      </span>
                    )}
                  </div>
                </div>

                {/* Choices list */}
                <div className="space-y-1.5">
                  {group.choices.map((choice) => {
                    const isSelected = chosen.includes(choice.id);
                    return (
                      <label
                        key={choice.id}
                        onClick={() => handleToggleChoice(group.id, choice.id, group.maxSelect)}
                        className={`flex items-center justify-between p-2.5 sm:p-3 rounded-xl border transition-all cursor-pointer select-none text-xs sm:text-sm ${
                          isSelected
                            ? 'bg-amber-50/90 border-amber-500 font-bold text-amber-950 shadow-2xs'
                            : 'bg-stone-50/70 hover:bg-stone-100 border-stone-200 text-stone-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type={group.maxSelect === 1 ? 'radio' : 'checkbox'}
                            name={group.id}
                            checked={isSelected}
                            onChange={() => {}}
                            className="text-amber-600 focus:ring-amber-500 rounded"
                          />
                          <span>{choice.name}</span>
                        </div>
                        {choice.price > 0 ? (
                          <span className="text-amber-700 font-extrabold text-xs">
                            +{formatVND(choice.price)}
                          </span>
                        ) : (
                          <span className="text-stone-400 text-2xs">Miễn phí</span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Kitchen Note */}
          <div className="pt-3 space-y-1.5">
            <label className="block text-xs font-bold text-stone-800 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-stone-400" />
              <span>Ghi chú cho bếp (ít cay, không hành, làm riêng...)</span>
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="VD: Không hành lá, bớt ngọt, cho ớt riêng..."
              maxLength={100}
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-stone-50"
            />
          </div>
        </div>

        {/* Modal Footer (Quantity + Price + Confirm Add) */}
        <div className="p-3.5 sm:p-4 border-t border-stone-200 bg-stone-50 flex items-center gap-3 shrink-0">
          {/* Quantity Stepper */}
          <div className="flex items-center bg-white border border-stone-300 rounded-2xl p-1 shadow-2xs">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
              className="w-8 h-8 flex items-center justify-center text-stone-600 hover:bg-stone-100 rounded-xl disabled:opacity-30 cursor-pointer"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 text-center font-black text-sm text-stone-900">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="w-8 h-8 flex items-center justify-center text-stone-600 hover:bg-stone-100 rounded-xl cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Add to Cart Button */}
          <button
            id="btn-confirm-add-cart"
            onClick={handleConfirm}
            disabled={!isRequiredFilled}
            className={`flex-1 flex items-center justify-between px-4 py-3 rounded-2xl font-black text-xs sm:text-sm text-white shadow-md transition-all active:scale-98 cursor-pointer ${
              isRequiredFilled
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-orange-500/20'
                : 'bg-stone-400 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4" />
              <span>{isRequiredFilled ? 'Thêm vào giỏ hàng' : 'Vui lòng chọn tùy chọn bắt buộc'}</span>
            </div>
            {isRequiredFilled && <span>{formatVND(totalPrice)}</span>}
          </button>
        </div>
      </div>
    </div>
  );
};
