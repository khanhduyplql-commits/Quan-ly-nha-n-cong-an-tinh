import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ChefHat, 
  Calculator, 
  Lock, 
  KeyRound, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  Shield,
  Layers,
  Sparkles,
  Check
} from 'lucide-react';
import { useRestaurant, ROLE_CONFIGS } from '../../context/RestaurantContext';
import { UserRole } from '../../types';

interface RoleSwitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRoleChanged?: (newRole: UserRole) => void;
}

export const RoleSwitchModal: React.FC<RoleSwitchModalProps> = ({
  isOpen,
  onClose,
  onRoleChanged
}) => {
  const { userRole, switchRole, loginWithPin } = useRestaurant();
  const [selectedRole, setSelectedRole] = useState<UserRole>(userRole);
  const [pinInput, setPinInput] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  if (!isOpen) return null;

  const roleList: { id: UserRole; icon: React.FC<{ className?: string }>; color: string }[] = [
    { id: 'kitchen', icon: ChefHat, color: 'text-orange-600 bg-orange-50 border-orange-200' },
    { id: 'cashier', icon: Calculator, color: 'text-amber-600 bg-amber-50 border-amber-200' },
    { id: 'admin', icon: ShieldCheck, color: 'text-rose-600 bg-rose-50 border-rose-200' },
  ];

  const handleSelectRole = (role: UserRole) => {
    setSelectedRole(role);
    setErrorMessage('');
    setPinInput('');
  };

  const handleConfirmSwitch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage('');

    // If already in that role and no pin needed
    if (selectedRole === userRole) {
      onClose();
      return;
    }

    // Role default PIN check
    const targetConfig = ROLE_CONFIGS[selectedRole];
    const pin = pinInput.trim();

    // If user provided a PIN or used quick button
    if (pin) {
      const res = loginWithPin(pin);
      if (res.success && res.role === selectedRole) {
        setSuccessMessage(`Đã chuyển sang vai trò: ${targetConfig.title}`);
        setTimeout(() => {
          setSuccessMessage('');
          if (onRoleChanged) onRoleChanged(selectedRole);
          onClose();
        }, 500);
        return;
      } else if (res.success && res.role) {
        // Logged in with different valid role PIN
        setSuccessMessage(`Đã đăng nhập vai trò: ${ROLE_CONFIGS[res.role].title}`);
        setTimeout(() => {
          setSuccessMessage('');
          if (onRoleChanged) onRoleChanged(res.role!);
          onClose();
        }, 500);
        return;
      } else {
        setErrorMessage(res.message || `Mã PIN không đúng cho vai trò ${targetConfig.shortTitle}`);
        return;
      }
    }

    // Direct switch with role default PIN
    switchRole(selectedRole);
    setSuccessMessage(`Đã kích hoạt: ${targetConfig.title}`);
    setTimeout(() => {
      setSuccessMessage('');
      if (onRoleChanged) onRoleChanged(selectedRole);
      onClose();
    }, 400);
  };

  const handleQuickPin = (pin: string) => {
    setPinInput(pin);
    const res = loginWithPin(pin);
    if (res.success && res.role) {
      setSelectedRole(res.role);
      setSuccessMessage(`Đã xác thực vai trò: ${ROLE_CONFIGS[res.role].title}`);
      setTimeout(() => {
        setSuccessMessage('');
        if (onRoleChanged) onRoleChanged(res.role!);
        onClose();
      }, 400);
    } else {
      setErrorMessage(res.message || 'Mã PIN không hợp lệ');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base">Phân Quyền & Chuyển Vai Trò</h3>
              <p className="text-2xs text-stone-400">Thiết lập quyền truy cập theo từng bộ phận làm việc</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active Role Notice */}
        <div className="p-5 space-y-4 text-xs">
          {errorMessage && (
            <div className="p-3 bg-rose-50 text-rose-800 rounded-2xl border border-rose-200 flex items-center gap-2 text-xs font-bold animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-200 flex items-center gap-2 text-xs font-bold animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Role Selection Cards */}
          <div className="space-y-2">
            <label className="text-2xs font-extrabold uppercase tracking-wider text-stone-500 block">
              Chọn vai trò làm việc:
            </label>
            <div className="grid grid-cols-1 gap-2.5">
              {roleList.map(r => {
                const config = ROLE_CONFIGS[r.id];
                const Icon = r.icon;
                const isSelected = selectedRole === r.id;
                const isCurrent = userRole === r.id;

                return (
                  <div
                    key={r.id}
                    onClick={() => handleSelectRole(r.id)}
                    className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3 relative ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50/40 shadow-xs'
                        : 'border-stone-200 hover:border-stone-300 bg-white'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${r.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0 pr-6">
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-stone-900 text-xs sm:text-sm">
                          {config.title}
                        </h4>
                        {isCurrent && (
                          <span className="px-2 py-0.5 rounded-full text-3xs font-black bg-stone-900 text-white uppercase">
                            Đang dùng
                          </span>
                        )}
                      </div>
                      <p className="text-2xs text-stone-600 mt-1 leading-relaxed">
                        {config.description}
                      </p>

                      {/* Allowed Modules Summary Badges */}
                      <div className="flex flex-wrap gap-1 mt-2">
                        <span className="text-3xs font-black text-stone-500 uppercase mr-1 self-center">Quyền:</span>
                        {config.allowedTabs.map(t => {
                          const tabLabels: Record<string, string> = {
                            pos_counter: '🛒 Quầy POS',
                            tables: '🏢 Sơ Đồ Bàn',
                            kitchen: '🍳 Màn Hình Bếp KDS',
                            cashflow: '💰 Sổ Quỹ Thu Chi',
                            menu_manage: '📋 Quản Lý Món',
                            guide: '📚 Hướng Dẫn'
                          };
                          return (
                            <span
                              key={t}
                              className="px-2 py-0.5 rounded-md text-3xs font-bold bg-stone-100 text-stone-700 border border-stone-200"
                            >
                              {tabLabels[t] || t}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* Radio indicator */}
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center absolute top-3.5 right-3.5 ${
                      isSelected ? 'border-amber-500 bg-amber-500 text-white' : 'border-stone-300 bg-white'
                    }`}>
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick PIN Code Input & Buttons */}
          <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-2xs font-extrabold uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-stone-500" />
                <span>Mã PIN Xác Thực Nhanh:</span>
              </span>
              <span className="text-3xs text-stone-400 font-mono">Bấm PIN để chuyển tức thì</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickPin('3333')}
                className="p-2 bg-white hover:bg-orange-500 hover:text-white border border-stone-300 rounded-xl text-2xs font-bold transition-all shadow-2xs cursor-pointer text-left"
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-orange-600 group-hover:text-white">Bếp (KDS)</span>
                  <span className="font-mono text-3xs opacity-80">3333</span>
                </div>
                <span className="text-3xs text-stone-500 block truncate">Chỉ màn hình bếp</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickPin('2222')}
                className="p-2 bg-white hover:bg-amber-500 hover:text-white border border-stone-300 rounded-xl text-2xs font-bold transition-all shadow-2xs cursor-pointer text-left"
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-amber-600">Thu Ngân</span>
                  <span className="font-mono text-3xs opacity-80">2222</span>
                </div>
                <span className="text-3xs text-stone-500 block truncate">Quầy POS & Bàn</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickPin('8888')}
                className="p-2 bg-white hover:bg-rose-500 hover:text-white border border-stone-300 rounded-xl text-2xs font-bold transition-all shadow-2xs cursor-pointer text-left"
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-rose-600">Quản Trị</span>
                  <span className="font-mono text-3xs opacity-80">8888</span>
                </div>
                <span className="text-3xs text-stone-500 block truncate">Toàn quyền admin</span>
              </button>
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-stone-300 rounded-xl font-bold text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
            >
              Đóng
            </button>

            <button
              type="button"
              onClick={() => handleConfirmSwitch()}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-black flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer active:scale-98"
            >
              <span>Kích Hoạt Vai Trò Này</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
