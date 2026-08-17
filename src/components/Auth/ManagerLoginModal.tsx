import React, { useState } from 'react';
import { 
  Lock, 
  KeyRound, 
  X, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';

interface ManagerLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ManagerLoginModal: React.FC<ManagerLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { loginAsManager } = useRestaurant();
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!pin.trim()) {
      setErrorMsg('Vui lòng nhập mã PIN');
      return;
    }

    const success = loginAsManager(pin.trim());
    if (success) {
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setPin('');
        onClose();
        if (onSuccess) onSuccess();
      }, 500);
    } else {
      setErrorMsg('Mã PIN không đúng. Vui lòng thử 1234, 8888 hoặc 6789.');
    }
  };

  const handleQuickLogin = (quickPin: string) => {
    setPin(quickPin);
    const success = loginAsManager(quickPin);
    if (success) {
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setPin('');
        onClose();
        if (onSuccess) onSuccess();
      }, 500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 bg-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-sm">Đăng Nhập Quản Lý</h3>
              <p className="text-2xs text-stone-400">Xem Bếp, POS, Thu - Chi & Quản Trị</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-2.5 bg-rose-50 text-rose-700 rounded-xl border border-rose-200 flex items-center gap-2 text-2xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {isSuccess && (
            <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200 flex items-center gap-2 text-2xs">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span className="font-bold">Đăng nhập thành công! Đang chuyển trang...</span>
            </div>
          )}

          <div>
            <label className="block font-bold text-stone-700 mb-1.5">
              Nhập mã PIN Quản trị viên
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                maxLength={8}
                autoFocus
                placeholder="Nhập PIN (VD: 1234)"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setErrorMsg('');
                }}
                className="w-full text-center text-lg font-black tracking-widest bg-stone-50 border border-stone-300 rounded-xl py-2.5 pl-9 pr-3 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Quick Demo PIN Chips */}
          <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200 space-y-1.5">
            <span className="text-3xs font-bold text-stone-500 uppercase tracking-wider block">
              Mã PIN mẫu (nhấn để vào nhanh):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {['1234', '8888', '6789'].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => handleQuickLogin(p)}
                  className="px-2.5 py-1 bg-white hover:bg-amber-500 hover:text-white border border-stone-300 rounded-lg text-2xs font-mono font-bold text-stone-700 transition-colors shadow-2xs cursor-pointer"
                >
                  PIN: {p}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 border border-stone-300 rounded-xl font-bold text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm shadow-amber-500/20 transition-all cursor-pointer"
            >
              <span>Vào Quản Lý</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
