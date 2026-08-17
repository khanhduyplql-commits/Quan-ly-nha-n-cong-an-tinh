import React, { useState } from 'react';
import { 
  UtensilsCrossed, 
  ChefHat, 
  LayoutGrid, 
  BookOpen, 
  Bell, 
  Layers, 
  Sparkles, 
  RefreshCw, 
  Wallet,
  Calculator,
  ShieldCheck,
  KeyRound,
  Shield,
  UserCheck,
  Lock,
  LogOut
} from 'lucide-react';
import { ActiveTab, UserRole } from '../types';
import { useRestaurant, ROLE_CONFIGS } from '../context/RestaurantContext';
import { RoleSwitchModal } from './Auth/RoleSwitchModal';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenAiAdvisor?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onOpenAiAdvisor }) => {
  const { 
    orders, 
    serviceCalls,
    playNotificationSound,
    restaurantInfo,
    refreshServerState,
    userRole,
    currentUser,
    logoutUser,
    isRoleAllowedTab
  } = useRestaurant();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);

  const pendingOrdersCount = orders.filter(o => o.status === 'pending' || o.status === 'cooking').length;
  const pendingCallsCount = serviceCalls.filter(c => c.status === 'pending').length;

  const currentRoleConfig = ROLE_CONFIGS[userRole] || ROLE_CONFIGS.admin;

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await refreshServerState();
    setTimeout(() => setIsRefreshing(false), 400);
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'kitchen': return ChefHat;
      case 'cashier': return Calculator;
      case 'finance': return Wallet;
      case 'admin': return ShieldCheck;
      default: return Shield;
    }
  };

  const RoleIcon = getRoleIcon(userRole);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-xs">
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 to-orange-600 text-white flex items-center justify-center shadow-sm shadow-orange-500/20">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-extrabold text-stone-900 text-base sm:text-lg tracking-tight">
                {restaurantInfo.name}
              </span>
              
              {/* Active Role Indicator Badge */}
              <button
                onClick={() => setIsRoleModalOpen(true)}
                title="Bấm để đổi vai trò hoặc đăng nhập phân quyền"
                className={`px-2.5 py-0.5 text-2xs font-extrabold rounded-full flex items-center gap-1.5 border shadow-2xs transition-all hover:scale-105 cursor-pointer ${currentRoleConfig.badgeBg} ${currentRoleConfig.badgeText} ${currentRoleConfig.badgeBorder}`}
              >
                <RoleIcon className="w-3.5 h-3.5" />
                <span>{currentRoleConfig.shortTitle}</span>
                <span className="text-3xs opacity-60 font-mono">⟳ Đổi</span>
              </button>
            </div>
            <p className="text-2xs text-stone-500 hidden md:block">
              {currentUser?.displayName ? `Đang đăng nhập: ${currentUser.displayName} • ` : ''}
              {userRole === 'kitchen' 
                ? 'Bộ phận Bếp: Tiếp nhận đơn chế biến và báo hoàn thành món' 
                : userRole === 'cashier'
                ? 'Bộ phận Bán Hàng: Quầy POS & Sơ đồ bàn ăn, thu tiền xuất phiếu thu'
                : userRole === 'finance'
                ? 'Bộ phận Tài Chính: Sổ Quỹ Thu - Chi, Dòng tiền & Báo cáo kế toán'
                : 'Ban Quản Trị: Toàn quyền quản lý Bán hàng, Bàn, Bếp, Sổ Quỹ Thu Chi & Thực đơn'}
            </p>
          </div>
        </div>

        {/* Action Controls: Role switch, Sound test, AI Advisor, Refresh, Logout */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
          {/* Switch Role Quick Button */}
          <button
            onClick={() => setIsRoleModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Phân Quyền</span>
            <span className="sm:hidden">Quyền</span>
          </button>

          {/* AI Advisor Button */}
          {onOpenAiAdvisor && userRole !== 'kitchen' && (
            <button
              onClick={onOpenAiAdvisor}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Gợi ý AI</span>
            </button>
          )}

          {/* Manual sync refresh */}
          <button
            onClick={handleManualRefresh}
            title="Đồng bộ lại dữ liệu tức thì"
            className="p-2 rounded-xl text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors border border-stone-200 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-600' : ''}`} />
          </button>

          {/* Sound test button */}
          <button
            onClick={() => playNotificationSound('bell')}
            title="Thử chuông gọi bàn"
            className="p-2 rounded-xl text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors border border-stone-200 cursor-pointer"
          >
            <Bell className="w-3.5 h-3.5" />
          </button>

          {/* Logout Button */}
          <button
            onClick={logoutUser}
            title="Đăng xuất khỏi hệ thống"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold shadow-2xs transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Đăng Xuất</span>
          </button>
        </div>
      </div>

      {/* Navigation Mode Tabs (Strictly filtered by role) */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 overflow-x-auto scrollbar-none border-t border-stone-100">
        <nav className="flex space-x-1 sm:space-x-2 py-1.5 min-w-max">
          {/* Tab: Counter POS (Bán hàng & Thu ngân tại quầy) - Cashier & Admin */}
          {isRoleAllowedTab(userRole, 'pos_counter') && (
            <button
              id="nav-tab-pos-counter"
              onClick={() => setActiveTab('pos_counter')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                activeTab === 'pos_counter'
                  ? 'bg-amber-500 text-white shadow-xs scale-100'
                  : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900 font-bold'
              }`}
            >
              <Calculator className="w-4 h-4" />
              <span>🛒 Bán Hàng & Thu Ngân (POS)</span>
            </button>
          )}

          {/* Tab: Tables & POS - Cashier & Admin */}
          {isRoleAllowedTab(userRole, 'tables') && (
            <button
              id="nav-tab-tables"
              onClick={() => setActiveTab('tables')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer relative ${
                activeTab === 'tables'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span>🏢 Sơ Đồ Bàn & Đơn Bán</span>
              {pendingCallsCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
              )}
            </button>
          )}

          {/* Tab: Kitchen KDS - Kitchen & Admin */}
          {isRoleAllowedTab(userRole, 'kitchen') && (
            <button
              id="nav-tab-kitchen"
              onClick={() => setActiveTab('kitchen')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer relative ${
                activeTab === 'kitchen'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
              }`}
            >
              <ChefHat className="w-4 h-4" />
              <span>🍳 Màn Hình Bếp (KDS)</span>
              {pendingOrdersCount > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-3xs font-black ${
                  activeTab === 'kitchen' ? 'bg-white text-amber-600' : 'bg-red-500 text-white'
                }`}>
                  {pendingOrdersCount}
                </span>
              )}
            </button>
          )}

          {/* Tab: Cashflow (Thu - Chi / Sổ Quỹ) - Admin Only */}
          {isRoleAllowedTab(userRole, 'cashflow') && (
            <button
              id="nav-tab-cashflow"
              onClick={() => setActiveTab('cashflow')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'cashflow'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-emerald-700 bg-emerald-50/60 hover:bg-emerald-100 font-bold'
              }`}
            >
              <Wallet className="w-4 h-4" />
              <span>💰 Quản Lý Thu - Chi (Sổ Quỹ)</span>
            </button>
          )}

          {/* Tab: Menu Admin - Admin Only */}
          {isRoleAllowedTab(userRole, 'menu_manage') && (
            <button
              id="nav-tab-menu-manage"
              onClick={() => setActiveTab('menu_manage')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'menu_manage'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>📋 Quản Lý Món Ăn</span>
            </button>
          )}

          {/* Tab: Guide - Admin Only */}
          {isRoleAllowedTab(userRole, 'guide') && (
            <button
              id="nav-tab-guide"
              onClick={() => setActiveTab('guide')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'guide'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>📚 Hướng Dẫn & Cài Đặt</span>
            </button>
          )}
        </nav>
      </div>

      {/* Role Switch Modal */}
      <RoleSwitchModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        onRoleChanged={(newRole) => {
          const config = ROLE_CONFIGS[newRole];
          if (!config.allowedTabs.includes(activeTab)) {
            setActiveTab(config.defaultTab);
          }
        }}
      />
    </header>
  );
};
