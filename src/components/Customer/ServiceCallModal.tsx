import React, { useState } from 'react';
import { X, Bell, GlassWater, Snowflake, Receipt, Sparkles, Check, MessageSquare } from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { ServiceCallType } from '../../types';

interface ServiceCallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ServiceCallModal: React.FC<ServiceCallModalProps> = ({ isOpen, onClose }) => {
  const { requestService, activeTableNumber, currentTable } = useRestaurant();
  const [customMsg, setCustomMsg] = useState('');
  const [isSent, setIsSent] = useState(false);

  if (!isOpen) return null;

  const handleCall = (type: ServiceCallType, text?: string) => {
    requestService(type, text);
    setIsSent(true);
    setTimeout(() => {
      setIsSent(false);
      onClose();
    }, 1500);
  };

  const serviceOptions = [
    {
      type: 'call_waiter' as ServiceCallType,
      title: 'Gọi nhân viên đến bàn',
      desc: 'Cần hỗ trợ trực tiếp',
      icon: Bell,
      color: 'bg-amber-500 text-white'
    },
    {
      type: 'refill_water' as ServiceCallType,
      title: 'Xin thêm nước lọc / trà đá',
      desc: 'Bình nước mát lạnh',
      icon: GlassWater,
      color: 'bg-blue-500 text-white'
    },
    {
      type: 'extra_ice' as ServiceCallType,
      title: 'Xin thêm xô đá',
      desc: 'Đá viên sạch',
      icon: Snowflake,
      color: 'bg-cyan-600 text-white'
    },
    {
      type: 'request_bill' as ServiceCallType,
      title: 'Yêu cầu tính tiền',
      desc: 'Mang hóa đơn và máy POS',
      icon: Receipt,
      color: 'bg-emerald-600 text-white'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        id="modal-service-call"
        className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl border border-stone-200 animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-stone-900 text-base">Hỗ Trợ & Phục Vụ</h2>
              <p className="text-xs text-stone-500">Bàn {activeTableNumber} • {currentTable.zone}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-stone-200 text-stone-500 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {isSent ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto animate-bounce">
                <Check className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-stone-900 text-base">Đã gửi yêu cầu thành công!</h3>
              <p className="text-xs text-stone-500">
                Nhân viên phục vụ đang di chuyển đến <strong>Bàn {activeTableNumber}</strong> ngay ạ.
              </p>
            </div>
          ) : (
            <>
              <p className="text-xs text-stone-500">
                Chạm nhanh vào yêu cầu bên dưới để thông báo ngay cho đội ngũ phục vụ:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {serviceOptions.map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.type}
                      onClick={() => handleCall(opt.type)}
                      className="flex items-start gap-3 p-3.5 rounded-2xl border border-stone-200 bg-stone-50/70 hover:bg-amber-50/80 hover:border-amber-300 transition-all text-left group active:scale-98 cursor-pointer"
                    >
                      <div className={`p-2 rounded-xl ${opt.color} shrink-0 group-hover:scale-110 transition-transform shadow-2xs`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-xs sm:text-sm text-stone-900 group-hover:text-amber-800 leading-snug">
                          {opt.title}
                        </div>
                        <div className="text-2xs text-stone-400 mt-0.5">
                          {opt.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Custom input */}
              <div className="pt-2 space-y-2">
                <label className="block text-xs font-bold text-stone-700 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-stone-400" />
                  <span>Yêu cầu khác</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customMsg}
                    onChange={(e) => setCustomMsg(e.target.value)}
                    placeholder="VD: Cho mượn gắp đá, xin thêm tương ớt..."
                    className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-stone-50"
                  />
                  <button
                    onClick={() => {
                      if (customMsg.trim()) {
                        handleCall('other', customMsg.trim());
                      }
                    }}
                    disabled={!customMsg.trim()}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs"
                  >
                    Gửi
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-stone-50 border-t border-stone-200 text-center text-3xs text-stone-400 flex items-center justify-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-500" />
          <span>Tín hiệu gọi bàn gửi trực tiếp qua hệ thống POS & đồng hồ nhân viên</span>
        </div>
      </div>
    </div>
  );
};
