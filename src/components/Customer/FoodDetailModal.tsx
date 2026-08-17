import React, { useState } from 'react';
import { X, Minus, Plus, ShoppingBag, Clock, Info } from 'lucide-react';
import { MenuItem, CartItem, CartItemOption } from '../../types';
import { formatVND } from '../../utils/format';

interface FoodDetailModalProps {
  item: MenuItem;
  onClose: () => void;
  onAddToCart: (cartItem: CartItem) => void;
}

export const FoodDetailModal: React.FC<FoodDetailModalProps> = ({ item, onClose, onAddToCart }) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedChoices, setSelectedChoices] = useState<Record<string, string[]>>(() => {
    const initial: Record<string, string[]> = {};
    item.optionGroups?.forEach(group => {
      if (group.choices.length > 0) {
        // default select first choice for any required group
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

  item.optionGroups?.forEach(group => {
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
  const isRequiredFilled = item.optionGroups?.every(group => {
    if (!group.required) return true;
    const chosen = selectedChoices[group.id] || [];
    return chosen.length > 0;
  }) ?? true;

  const handleConfirm = () => {
    if (!isRequiredFilled) return;

    const cartItem: CartItem = {
      id: `ci-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      menuItemId: item.id,
      name: item.name,
      price: unitPrice,
      image: item.image,
      quantity,
      selectedOptions: chosenOptionsList,
      note: note.trim()
    };

    onAddToCart(cartItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        id="modal-food-detail"
        className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] border border-stone-200"
      >
        {/* Modal Header & Hero Image */}
        <div className="relative h-52 sm:h-60 w-full overflow-hidden bg-stone-100 shrink-0">
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
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5 divide-y divide-stone-100">
          {/* Main Info */}
          <div>
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg sm:text-xl font-bold text-stone-900 leading-snug">
                {item.name}
              </h2>
              <div className="text-right shrink-0">
                <div className="text-lg sm:text-xl font-extrabold text-amber-600">
                  {formatVND(item.price)}
                </div>
              </div>
            </div>
            <p className="text-stone-500 text-xs sm:text-sm mt-1.5 leading-relaxed">
              {item.description}
            </p>
          </div>

          {/* Option Groups */}
          {item.optionGroups && item.optionGroups.map((group) => {
            const chosen = selectedChoices[group.id] || [];
            return (
              <div key={group.id} className="pt-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-stone-800 text-sm">{group.name}</span>
                    {group.required ? (
                      <span className="text-3xs font-semibold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700">
                        Bắt buộc
                      </span>
                    ) : (
                      <span className="text-3xs font-medium text-stone-400">
                        Tùy chọn (Tối đa {group.maxSelect})
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
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer select-none text-xs sm:text-sm ${
                          isSelected
                            ? 'bg-amber-50/80 border-amber-400 font-semibold text-amber-950 shadow-2xs'
                            : 'bg-stone-50/60 hover:bg-stone-100/70 border-stone-200 text-stone-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type={group.maxSelect === 1 ? 'radio' : 'checkbox'}
                            name={group.id}
                            checked={isSelected}
                            onChange={() => {}}
                            className="text-amber-600 focus:ring-amber-500 rounded"
                          />
                          <span>{choice.name}</span>
                        </div>
                        {choice.price > 0 && (
                          <span className="text-amber-700 font-semibold text-xs">
                            +{formatVND(choice.price)}
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Kitchen Note */}
          <div className="pt-4 space-y-2">
            <label className="block text-xs sm:text-sm font-bold text-stone-800 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-stone-400" />
              <span>Ghi chú riêng cho đầu bếp</span>
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

        {/* Modal Footer (Quantity + Confirm Add) */}
        <div className="p-4 sm:p-5 border-t border-stone-200 bg-stone-50/80 flex items-center gap-3 sm:gap-4 shrink-0">
          {/* Quantity Stepper */}
          <div className="flex items-center bg-white border border-stone-300 rounded-2xl p-1 shadow-2xs">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
              className="w-8 h-8 flex items-center justify-center text-stone-600 hover:bg-stone-100 rounded-xl disabled:opacity-30 cursor-pointer"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 text-center font-bold text-sm text-stone-900">
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
            className={`flex-1 flex items-center justify-between px-4 py-3 rounded-2xl font-bold text-xs sm:text-sm text-white shadow-md transition-all active:scale-98 cursor-pointer ${
              isRequiredFilled
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-orange-500/20'
                : 'bg-stone-400 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center gap-2">
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
