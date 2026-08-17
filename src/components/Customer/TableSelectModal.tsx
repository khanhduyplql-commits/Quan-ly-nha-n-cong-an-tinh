import React, { useState } from 'react';
import { X, Check, MapPin, Users, Sparkles, Building2, Crown } from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { RestaurantTable } from '../../types';

interface TableSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSuccess?: (tableNumber: string) => void;
}

export const TableSelectModal: React.FC<TableSelectModalProps> = ({
  isOpen,
  onClose,
  onSelectSuccess
}) => {
  const { tables, activeTableNumber, setActiveTableNumber } = useRestaurant();
  const [selectedZone, setSelectedZone] = useState<string>('all');
  const [tempSelectedTable, setTempSelectedTable] = useState<string>(activeTableNumber);

  if (!isOpen) return null;

  const floor1Tables = tables.filter((t) => t.zone === 'Tầng 1');
  const vipTables = tables.filter((t) => t.zone.includes('VIP') || t.zone === 'Tầng 2' || t.zone === 'Tầng 2 (VIP)');

  const displayedTables = tables.filter((t) => {
    if (selectedZone === 'Tầng 1') return t.zone === 'Tầng 1';
    if (selectedZone === 'Tầng 2 (VIP)') {
      return t.zone.includes('VIP') || t.zone === 'Tầng 2' || t.zone === 'Tầng 2 (VIP)';
    }
    return true;
  });

  const handleConfirm = () => {
    setActiveTableNumber(tempSelectedTable);
    if (onSelectSuccess) {
      onSelectSuccess(tempSelectedTable);
    }
    onClose();
  };

  const getStatusBadge = (status: RestaurantTable['status']) => {
    switch (status) {
      case 'empty':
        return <span className="text-3xs font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200">Trống</span>;
      case 'eating':
        return <span className="text-3xs font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded-md border border-blue-200">Có khách</span>;
      case 'ordering':
        return <span className="text-3xs font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200">Đang chọn</span>;
      case 'waiting_bill':
        return <span className="text-3xs font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded-md border border-purple-200">Chờ thanh toán</span>;
      case 'calling_staff':
        return <span className="text-3xs font-semibold text-red-700 bg-red-50 px-1.5 py-0.5 rounded-md border border-red-200">Gọi phục vụ</span>;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div 
        id="table-select-modal"
        className="bg-white rounded-3xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 bg-linear-to-r from-amber-500/10 via-amber-500/5 to-transparent flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-stone-900 text-base sm:text-lg">
                Chọn Số Bàn Ngồi Của Quý Khách
              </h2>
              <p className="text-xs text-stone-500">
                Tầng 1 (Bàn 01 - 25) • Tầng 2 (Bàn VIP)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Zone Tabs Filter */}
        <div className="px-4 sm:px-5 pt-3 pb-1 border-b border-stone-100 flex gap-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setSelectedZone('all')}
            className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedZone === 'all'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            <span>Tất Cả Các Bàn ({tables.length})</span>
          </button>
          <button
            onClick={() => setSelectedZone('Tầng 1')}
            className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedZone === 'Tầng 1'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Tầng 1 ({floor1Tables.length} bàn: 01 - 25)</span>
          </button>
          <button
            onClick={() => setSelectedZone('Tầng 2 (VIP)')}
            className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedZone === 'Tầng 2 (VIP)'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            <Crown className="w-3.5 h-3.5 text-amber-300" />
            <span>Tầng 2 VIP ({vipTables.length} bàn)</span>
          </button>
        </div>

        {/* Table Grid list */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
            {displayedTables.map((tbl) => {
              const isSelected = tempSelectedTable === tbl.number;
              const isCurrentActive = activeTableNumber === tbl.number;
              const isVip = tbl.zone.includes('VIP') || tbl.number.startsWith('VIP');

              return (
                <button
                  key={tbl.id}
                  type="button"
                  onClick={() => setTempSelectedTable(tbl.number)}
                  className={`p-3 rounded-2xl border text-left transition-all relative cursor-pointer flex flex-col justify-between min-h-[92px] ${
                    isSelected
                      ? 'border-amber-500 bg-amber-50/70 shadow-sm ring-2 ring-amber-500/30 scale-[1.02]'
                      : 'border-stone-200 hover:border-amber-300 bg-white hover:bg-stone-50'
                  }`}
                >
                  {/* Top line with table number & indicator */}
                  <div className="flex items-start justify-between gap-1">
                    <div>
                      <div className="flex items-center gap-1.5">
                        {isVip && <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                        <span className={`font-extrabold text-sm sm:text-base ${isVip ? 'text-amber-800' : 'text-stone-900'}`}>
                          {tbl.name}
                        </span>
                      </div>
                      <span className="text-3xs text-stone-500 font-medium block">
                        {tbl.zone}
                      </span>
                    </div>

                    {isSelected ? (
                      <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                    ) : isCurrentActive ? (
                      <span className="text-3xs bg-stone-200 text-stone-700 px-1.5 py-0.5 rounded font-bold">
                        Đang chọn
                      </span>
                    ) : null}
                  </div>

                  {/* Bottom line with capacity & status */}
                  <div className="flex items-center justify-between pt-2 border-t border-stone-100/80 mt-2">
                    <div className="flex items-center gap-1 text-3xs font-medium text-stone-500">
                      <Users className="w-3 h-3 text-stone-400" />
                      <span>{tbl.capacity} ghế</span>
                    </div>
                    <div>
                      {getStatusBadge(tbl.status)}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-stone-200 bg-stone-50/80 flex items-center justify-between gap-3">
          <div className="text-xs">
            <span className="text-stone-500">Bàn đã chọn: </span>
            <span className="font-extrabold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-lg border border-amber-200">
              {tables.find(t => t.number === tempSelectedTable)?.name || `Bàn ${tempSelectedTable}`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-700 text-xs font-bold hover:bg-stone-100 transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold shadow-sm active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Xác Nhận Ngồi Bàn Này</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
