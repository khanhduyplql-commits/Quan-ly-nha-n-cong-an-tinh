import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ChefHat, 
  Calculator, 
  Wallet, 
  Lock, 
  KeyRound, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  Shield,
  Layers,
  Sparkles,
  Check,
  LogOut
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
  const { userRole, switchRole, loginWithPin, logoutUser, currentUser } = useRestaurant();
  const [selectedRole, setSelectedRole] = useState<UserRole>(userRole);
  const [pinInput, setPinInput] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  if (!isOpen) return null;

  const roleList: { id: UserRole; icon: React.FC<{ className?: string }>; color: string }[] = [
    { id: 'admin', icon: ShieldCheck, color: 'text-rose-600 bg-rose-50 border-rose-200' },
    { id: 'cashier', icon: Calculator, color: 'text-amber-600 bg-amber-50 border-amber-200' },
    { id: 'finance', icon: Wallet, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    { id: 'kitchen', icon: ChefHat, color: 'text-orange-600 bg-orange-50 border-orange-200' },
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

    const targetConfig = ROLE_CONFIGS[selectedRole];
    const pin = pinInput.trim();

    if (pin) {
      const res = loginWithPin(pin);
      if (res.success && res.role === selectedRole) {
        setSuccessMessage(`Đã chuyển sang vai trò: ${targetConfig.title}`);
        setTimeout(() => {
          setSuccessMessage('');
          if (onRoleChanged) onRoleChanged(selectedRole);
          onClose();
        }, 400);
        return;
      } else if (res.success && res.role) {
        setSuccessMessage(`Đã xác thực vai trò: ${ROLE_CONFIGS[res.role].title}`);
        setTimeout(() => {
          setSuccessMessage('');
          if (onRoleChanged) onRoleChanged(res.role!);
          onClose();
        }, 400);
        return;
      } else {
        setErrorMessage(res.message || `Mã PIN không đúng cho vai trò ${targetConfig.shortTitle}`);
        return;
      }
    }

    // Direct switch with default role config
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

  const handleLogout = () => {
    logoutUser();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-stone-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base">Phân Quyền & Đổi Vai Trò Làm Việc</h3>
              <p className="text-2xs text-stone-400">
                {currentUser?.displayName ? `Đang đăng nhập: ${currentUser.displayName}` : 'Chuyển đổi quyền hạn truy cập các phân hệ'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 text-xs overflow-y-auto">
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
              Chọn vai trò làm việc muốn chuyển đến:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {roleList.map(r => {
                const config = ROLE_CONFIGS[r.id];
                const Icon = r.icon;
                const isSelected = selectedRole === r.id;
                const isCurrent = userRole === r.id;

                return (
                  <div
                    key={r.id}
                    onClick={() => handleSelectRole(r.id)}
                    className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between relative ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50/40 shadow-xs ring-2 ring-amber-500/20'
                        : 'border-stone-200 hover:border-stone-300 bg-white'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${r.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex items-center gap-1">
                          {isCurrent && (
                            <span className="px-1.5 py-0.5 rounded-md text-3xs font-black bg-stone-900 text-white uppercase">
                              Hiện tại
                            </span>
                          )}
                          <span className="px-1.5 py-0.5 rounded-md text-3xs font-mono font-bold bg-stone-100 text-stone-700 border border-stone-200">
                            PIN: {config.defaultPin}
                          </span>
                        </div>
                      </div>

                      <h4 className="font-extrabold text-stone-900 text-xs sm:text-sm">
                        {config.title}
                      </h4>
                      <p className="text-2xs text-stone-600 mt-1 leading-relaxed line-clamp-2">
                        {config.description}
                      </p>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-stone-100 flex items-center justify-between">
                      <span className="text-3xs text-stone-500 font-bold truncate">
                        {config.allowedTabs.length} phân hệ
                      </span>
                      {isSelected && (
                        <span className="text-3xs font-extrabold text-amber-600 flex items-center gap-1">
                          <Check className="w-3 h-3 stroke-[3]" /> Đã chọn
                        </span>
                      )}
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
                <span>Chuyển Nhanh Bằng Mã PIN:</span>
              </span>
              <span className="text-3xs text-stone-400 font-mono">Bấm để đổi ngay</span>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickPin('8888')}
                className="p-2 bg-white hover:bg-rose-500 hover:text-white border border-stone-200 rounded-xl text-center transition-all shadow-2xs cursor-pointer group"
              >
                <span className="font-black text-rose-600 group-hover:text-white block text-2xs">Quản Lý</span>
                <span className="font-mono text-3xs opacity-80 block">8888</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickPin('2222')}
                className="p-2 bg-white hover:bg-amber-500 hover:text-white border border-stone-200 rounded-xl text-center transition-all shadow-2xs cursor-pointer group"
              >
                <span className="font-black text-amber-600 group-hover:text-white block text-2xs">Thu Ngân</span>
                <span className="font-mono text-3xs opacity-80 block">2222</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickPin('6666')}
                className="p-2 bg-white hover:bg-emerald-500 hover:text-white border border-stone-200 rounded-xl text-center transition-all shadow-2xs cursor-pointer group"
              >
                <span className="font-black text-emerald-600 group-hover:text-white block text-2xs">Thu Chi</span>
                <span className="font-mono text-3xs opacity-80 block">6666</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickPin('3333')}
                className="p-2 bg-white hover:bg-orange-500 hover:text-white border border-stone-200 rounded-xl text-center transition-all shadow-2xs cursor-pointer group"
              >
                <span className="font-black text-orange-600 group-hover:text-white block text-2xs">Bếp KDS</span>
                <span className="font-mono text-3xs opacity-80 block">3333</span>
              </button>
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleLogout}
            className="px-3.5 py-2 text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl font-bold flex items-center gap-1.5 transition-colors cursor-pointer text-xs"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Đăng Xuất</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-stone-300 rounded-xl font-bold text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer text-xs"
            >
              Đóng
            </button>

            <button
              type="button"
              onClick={() => handleConfirmSwitch()}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-black flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer active:scale-98 text-xs"
            >
              <span>Xác Nhận Đổi</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
