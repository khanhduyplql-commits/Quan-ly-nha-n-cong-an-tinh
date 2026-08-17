import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Calculator, 
  Wallet, 
  ChefHat, 
  Lock, 
  KeyRound, 
  ArrowRight, 
  CheckCircle2, 
  UtensilsCrossed, 
  Building2,
  Phone,
  MapPin,
  Eye,
  EyeOff,
  AlertCircle
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { UserRole } from '../../types';

export const LoginScreen: React.FC = () => {
  const { loginWithAccount, restaurantInfo } = useRestaurant();

  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');
  const [pinInput, setPinInput] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const roleOptions: { 
    id: UserRole; 
    title: string; 
    roleName: string;
    description: string; 
    icon: React.FC<{ className?: string }>; 
    defaultPin: string;
    themeColor: string;
    borderColor: string;
    bgHover: string;
    badgeBg: string;
    badgeText: string;
    tabsSummary: string;
  }[] = [
    {
      id: 'admin',
      title: 'Quản Lý',
      roleName: 'Đ/c Quản Lý (Admin)',
      description: 'Toàn quyền quản trị: Bán hàng, Thu ngân, Sơ đồ bàn, Bếp KDS, Sổ Quỹ Thu Chi & Thực đơn.',
      icon: ShieldCheck,
      defaultPin: '8888',
      themeColor: 'text-rose-700 bg-rose-50',
      borderColor: 'border-rose-300 ring-rose-500/20',
      bgHover: 'hover:border-rose-400 hover:bg-rose-50/40',
      badgeBg: 'bg-rose-100',
      badgeText: 'text-rose-900 border-rose-200',
      tabsSummary: 'POS, Bàn, Bếp, Sổ Quỹ, Thực đơn, HD'
    },
    {
      id: 'cashier',
      title: 'Thu Ngân',
      roleName: 'Nhân Viên Thu Ngân',
      description: 'Quầy Bán Hàng (POS), Sơ Đồ Bàn, Thu tiền xuất phiếu thu và hóa đơn bán hàng.',
      icon: Calculator,
      defaultPin: '2222',
      themeColor: 'text-amber-700 bg-amber-50',
      borderColor: 'border-amber-300 ring-amber-500/20',
      bgHover: 'hover:border-amber-400 hover:bg-amber-50/40',
      badgeBg: 'bg-amber-100',
      badgeText: 'text-amber-900 border-amber-200',
      tabsSummary: 'Quầy Bán Hàng & Sơ Đồ Bàn'
    },
    {
      id: 'finance',
      title: 'Quản Lý Thu Chi',
      roleName: 'Quản Lý Thu Chi & Kế Toán',
      description: 'Quản lý Sổ Quỹ Tiền Mặt, Lập phiếu Thu/Chi, Báo cáo dòng tiền, Doanh thu & Lợi nhuận.',
      icon: Wallet,
      defaultPin: '6666',
      themeColor: 'text-emerald-700 bg-emerald-50',
      borderColor: 'border-emerald-300 ring-emerald-500/20',
      bgHover: 'hover:border-emerald-400 hover:bg-emerald-50/40',
      badgeBg: 'bg-emerald-100',
      badgeText: 'text-emerald-900 border-emerald-200',
      tabsSummary: 'Sổ Quỹ Thu Chi & Báo Cáo Dòng Tiền'
    },
    {
      id: 'kitchen',
      title: 'Bộ Phận Bếp',
      roleName: 'Bộ Phận Bếp & Pha Chế (KDS)',
      description: 'Màn hình Bếp KDS: Tiếp nhận yêu cầu chế biến từ bàn/quầy, nấu món và trả món.',
      icon: ChefHat,
      defaultPin: '3333',
      themeColor: 'text-orange-700 bg-orange-50',
      borderColor: 'border-orange-300 ring-orange-500/20',
      bgHover: 'hover:border-orange-400 hover:bg-orange-50/40',
      badgeBg: 'bg-orange-100',
      badgeText: 'text-orange-900 border-orange-200',
      tabsSummary: 'Màn Hình Bếp KDS'
    }
  ];

  const currentRoleOpt = roleOptions.find(r => r.id === selectedRole) || roleOptions[0];

  const handleSelectRole = (role: UserRole) => {
    setSelectedRole(role);
    setErrorMessage('');
    setPinInput('');
  };

  const handleFormLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const cleanPin = pinInput.trim();

    if (!cleanPin) {
      setErrorMessage('Vui lòng nhập mã PIN hoặc mật khẩu đăng nhập!');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const res = loginWithAccount(selectedRole, cleanPin, rememberMe);
      setIsLoading(false);
      if (!res.success) {
        setErrorMessage(res.message || 'Mã PIN không chính xác! Vui lòng thử lại.');
      }
    }, 200);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-900 via-stone-800 to-stone-950 text-stone-100 flex flex-col justify-between p-4 sm:p-6 lg:p-8 font-sans selection:bg-amber-500 selection:text-white">
      {/* Top Header */}
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between py-2 border-b border-stone-700/60 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 to-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/20 border border-amber-400/30">
            <UtensilsCrossed className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-2">
              <span>{restaurantInfo.name}</span>
            </h1>
            <p className="text-2xs sm:text-xs text-stone-400">
              Hệ Thống Bán Hàng POS • Sơ Đồ Bàn • Bếp KDS • Sổ Quỹ Thu Chi
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-2xs text-stone-400 bg-stone-800/80 px-3 py-1.5 rounded-xl border border-stone-700">
          <Building2 className="w-3.5 h-3.5 text-amber-400" />
          <span>Phiên bản v2.6 • Phân Quyền Bảo Mật</span>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="max-w-5xl w-full mx-auto my-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Side: Role Selector Grid */}
        <div className="lg:col-span-7 bg-stone-850/80 backdrop-blur-md rounded-3xl p-6 sm:p-7 border border-stone-700/80 shadow-2xl flex flex-col justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Phân Quyền Truy Cập Hệ Thống
            </h2>
            <p className="text-xs text-stone-400 mt-1 mb-5">
              Chọn vai trò tài khoản để đăng nhập vào phân hệ làm việc:
            </p>

            {/* 4 Role Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {roleOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = selectedRole === opt.id;
                return (
                  <div
                    key={opt.id}
                    onClick={() => handleSelectRole(opt.id)}
                    className={`relative p-4 rounded-2xl border cursor-pointer transition-all duration-200 text-left flex flex-col justify-between ${
                      isSelected
                        ? `bg-stone-800 border-amber-500/80 ring-2 ring-amber-500/30 shadow-lg shadow-amber-500/10`
                        : `bg-stone-900/60 border-stone-700/70 hover:border-stone-500/60 hover:bg-stone-800/40`
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${opt.themeColor}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                      </div>

                      <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                        <span>{opt.roleName}</span>
                      </h3>
                      <p className="text-2xs text-stone-400 mt-1 line-clamp-2 leading-relaxed">
                        {opt.description}
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-stone-800/80 flex items-center justify-between">
                      <span className="text-3xs text-stone-400 truncate max-w-[150px]">
                        {opt.tabsSummary}
                      </span>
                      {isSelected ? (
                        <span className="text-2xs font-extrabold text-amber-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Đã chọn
                        </span>
                      ) : (
                        <span className="text-3xs text-stone-500 font-medium group-hover:text-stone-300">
                          Nhấn để chọn
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side: PIN Form & Authentication Box */}
        <div className="lg:col-span-5 bg-stone-850/90 backdrop-blur-md rounded-3xl p-6 sm:p-7 border border-stone-700/80 shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-stone-900/80 border border-stone-700/80 mb-5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${currentRoleOpt.themeColor}`}>
                {React.createElement(currentRoleOpt.icon, { className: 'w-5 h-5' })}
              </div>
              <div className="min-w-0">
                <span className="text-3xs font-bold text-amber-400 uppercase tracking-wider block">
                  Đang đăng nhập vào:
                </span>
                <p className="text-sm font-black text-white truncate">
                  {currentRoleOpt.roleName}
                </p>
                <p className="text-2xs text-stone-400 truncate">
                  {currentRoleOpt.tabsSummary}
                </p>
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/80 border border-rose-700/80 text-rose-200 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleFormLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1.5 flex items-center justify-between">
                  <span>Mã PIN / Mật Khẩu Tài Khoản</span>
                </label>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPin ? 'text' : 'password'}
                    value={pinInput}
                    onChange={(e) => {
                      setPinInput(e.target.value);
                      setErrorMessage('');
                    }}
                    placeholder="Nhập mã PIN hoặc mật khẩu..."
                    className="w-full pl-10 pr-10 py-3 bg-stone-900 border border-stone-700 rounded-xl text-white placeholder-stone-500 text-sm font-mono tracking-wider focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-white cursor-pointer"
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember checkbox */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 text-stone-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-stone-600 bg-stone-900 text-amber-600 focus:ring-amber-500 focus:ring-offset-stone-900"
                  />
                  <span>Ghi nhớ phiên đăng nhập</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-extrabold text-sm shadow-lg shadow-orange-600/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <span>Đang đăng nhập...</span>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>Đăng Nhập Vào Hệ Thống</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* Footer Info */}
      <footer className="max-w-6xl w-full mx-auto py-3 border-t border-stone-800 text-center sm:flex sm:items-center sm:justify-between text-2xs text-stone-400 gap-3">
        <div className="flex items-center justify-center sm:justify-start gap-3 flex-wrap">
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3 text-amber-400" /> {restaurantInfo.address}
          </span>
          <span className="hidden md:inline">•</span>
          <span className="flex items-center gap-1">
            <Phone className="w-3 h-3 text-amber-400" /> Hotline: {restaurantInfo.hotline}
          </span>
        </div>
        <div className="mt-2 sm:mt-0 font-medium">
          {restaurantInfo.brandSlogan}
        </div>
      </footer>
    </div>
  );
};
