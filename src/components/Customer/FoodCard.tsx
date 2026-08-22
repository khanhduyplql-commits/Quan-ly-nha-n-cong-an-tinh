import React from 'react';
import { Plus, Minus, Flame, Clock, Leaf, Sparkles, ShoppingBag } from 'lucide-react';
import { MenuItem } from '../../types';
import { formatVND } from '../../utils/format';

interface FoodCardProps {
  item: MenuItem;
  cartCount?: number;
  onSelect: (item: MenuItem) => void;
  onQuickAdd: (item: MenuItem) => void;
  onRemoveOne?: (item: MenuItem) => void;
}

export const FoodCard: React.FC<FoodCardProps> = ({ 
  item, 
  cartCount = 0, 
  onSelect, 
  onQuickAdd,
  onRemoveOne 
}) => {
  const hasOptions = item.optionGroups && item.optionGroups.length > 0;

  return (
    <div
      id={`dish-card-${item.id}`}
      className={`group bg-white rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md ${
        cartCount > 0 ? 'border-amber-400 ring-2 ring-amber-400/20' : 'border-stone-200/80'
      } ${!item.isAvailable ? 'opacity-60 grayscale-50' : ''}`}
    >
      <div 
        onClick={() => item.isAvailable && onSelect(item)}
        className="cursor-pointer relative"
      >
        {/* Image & Badges */}
        <div className="relative aspect-4/3 w-full overflow-hidden bg-stone-100">
          <img
            src={item.image}
            alt={item.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />

          {/* Floating Badges */}
          <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5 z-10">
            {item.isPopular && (
              <span className="flex items-center gap-1 bg-amber-500/95 text-white text-2xs font-bold px-2 py-0.5 rounded-full shadow-xs backdrop-blur-xs">
                <Flame className="w-3 h-3 fill-white" />
                Bán chạy
              </span>
            )}
            {item.isVegetarian && (
              <span className="flex items-center gap-1 bg-emerald-600/90 text-white text-2xs font-bold px-2 py-0.5 rounded-full shadow-xs backdrop-blur-xs">
                <Leaf className="w-3 h-3 fill-white" />
                Ăn chay
              </span>
            )}
            {item.isSpicy && (
              <span className="bg-red-500/90 text-white text-2xs font-bold px-2 py-0.5 rounded-full shadow-xs backdrop-blur-xs">
                🌶️ Cay
              </span>
            )}
            {item.category === 'sides_addons' && (
              <span className="flex items-center gap-1 bg-teal-600/90 text-white text-2xs font-bold px-2 py-0.5 rounded-full shadow-xs backdrop-blur-xs">
                <Sparkles className="w-3 h-3 fill-white" />
                Món thêm
              </span>
            )}
          </div>

          {/* Cart count badge */}
          {cartCount > 0 && (
            <div className="absolute top-2.5 right-2.5 bg-amber-600 text-white text-xs font-black px-2 py-0.5 rounded-full shadow-md z-10 flex items-center gap-1 animate-in zoom-in">
              <ShoppingBag className="w-3 h-3" />
              <span>x{cartCount}</span>
            </div>
          )}

          {/* Prep time badge */}
          <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/60 text-white text-2xs px-2 py-0.5 rounded-md backdrop-blur-xs">
            <Clock className="w-3 h-3" />
            <span>~{item.prepTimeMinutes}p</span>
          </div>

          {!item.isAvailable && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-2xs">
              <span className="bg-red-600 text-white font-bold text-xs uppercase tracking-wider px-3 py-1 rounded-full shadow-md">
                Tạm hết món
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3.5 sm:p-4">
          <h3 className="font-bold text-stone-900 text-sm sm:text-base leading-snug line-clamp-1 group-hover:text-amber-600 transition-colors">
            {item.name}
          </h3>
          <p className="text-stone-500 text-xs mt-1 line-clamp-2 leading-relaxed">
            {item.description}
          </p>

          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {item.tags.slice(0, 2).map((t, idx) => (
                <span key={idx} className="text-3xs font-medium px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 border border-stone-200">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Pricing & Quick Multi-Add Buttons */}
      <div className="px-3.5 pb-3.5 sm:px-4 sm:pb-4 pt-1 flex items-center justify-between border-t border-stone-100 gap-2">
        <div>
          <div className="font-extrabold text-amber-600 text-sm sm:text-base">
            {formatVND(item.price)}
          </div>
          {item.originalPrice && item.originalPrice > item.price && (
            <div className="text-stone-400 text-3xs line-through">
              {formatVND(item.originalPrice)}
            </div>
          )}
        </div>

        {item.isAvailable && (
          <div className="flex items-center gap-1.5">
            {cartCount > 0 && onRemoveOne && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveOne(item);
                }}
                className="w-7 h-7 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center transition-all active:scale-95 cursor-pointer"
                title="Giảm 1"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
            )}

            {cartCount > 0 && (
              <span className="font-black text-xs text-amber-700 px-1">
                {cartCount}
              </span>
            )}

            <button
              id={`btn-add-${item.id}`}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (hasOptions) {
                  onSelect(item);
                } else {
                  onQuickAdd(item);
                }
              }}
              className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl transition-all shadow-xs active:scale-95 cursor-pointer ${
                cartCount > 0
                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                  : 'bg-amber-500 hover:bg-amber-600 text-white'
              }`}
              title={hasOptions ? 'Chọn tùy chọn & Món thêm' : 'Thêm vào giỏ'}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{hasOptions ? 'Tùy chọn' : 'Thêm'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
