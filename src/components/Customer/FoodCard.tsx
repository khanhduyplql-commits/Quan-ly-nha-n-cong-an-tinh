import React from 'react';
import { Plus, Flame, Clock, Leaf } from 'lucide-react';
import { MenuItem } from '../../types';
import { formatVND } from '../../utils/format';

interface FoodCardProps {
  item: MenuItem;
  onSelect: (item: MenuItem) => void;
  onQuickAdd: (item: MenuItem) => void;
}

export const FoodCard: React.FC<FoodCardProps> = ({ item, onSelect, onQuickAdd }) => {
  const hasOptions = item.optionGroups && item.optionGroups.length > 0;

  return (
    <div
      id={`dish-card-${item.id}`}
      className={`group bg-white rounded-2xl border border-stone-200/80 overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between ${
        !item.isAvailable ? 'opacity-60 grayscale-50' : ''
      }`}
    >
      <div 
        onClick={() => item.isAvailable && onSelect(item)}
        className="cursor-pointer"
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
          </div>

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
            <div className="flex flex-wrap gap-1 mt-2.5">
              {item.tags.slice(0, 2).map((t, idx) => (
                <span key={idx} className="text-3xs font-medium px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 border border-stone-200">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Pricing & Add button */}
      <div className="px-3.5 pb-3.5 sm:px-4 sm:pb-4 pt-1 flex items-center justify-between border-t border-stone-100">
        <div>
          <div className="font-extrabold text-amber-600 text-base sm:text-lg">
            {formatVND(item.price)}
          </div>
          {item.originalPrice && item.originalPrice > item.price && (
            <div className="text-stone-400 text-xs line-through">
              {formatVND(item.originalPrice)}
            </div>
          )}
        </div>

        {item.isAvailable && (
          <button
            id={`btn-add-${item.id}`}
            onClick={(e) => {
              e.stopPropagation();
              if (hasOptions) {
                onSelect(item);
              } else {
                onQuickAdd(item);
              }
            }}
            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{hasOptions ? 'Chọn món' : 'Thêm'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
