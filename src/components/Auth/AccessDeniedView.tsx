import React from 'react';
import { Lock, ShieldAlert, KeyRound, ArrowRight, ShieldCheck } from 'lucide-react';
import { useRestaurant, ROLE_CONFIGS } from '../../context/RestaurantContext';
import { ActiveTab } from '../../types';

interface AccessDeniedViewProps {
  attemptedTab: ActiveTab;
  onOpenRoleSwitch: () => void;
}

export const AccessDeniedView: React.FC<AccessDeniedViewProps> = ({
  attemptedTab,
  onOpenRoleSwitch
}) => {
  const { userRole } = useRestaurant();
  const currentConfig = ROLE_CONFIGS[userRole];

  const tabLabels: Record<ActiveTab, string> = {
    pos_counter: 'Quầy Bán Hàng & Thu Ngân (POS)',
    tables: 'Sơ Đồ Bàn & Đơn Bán',
    kitchen: 'Màn Hình Bếp (KDS)',
    cashflow: 'Quản Lý Thu - Chi (Sổ Quỹ)',
    menu_manage: 'Quản Lý Món Ăn',
    guide: 'Hướng Dẫn Quản Trị'
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-stone-200 shadow-xl text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div>
          <span className="px-3 py-1 rounded-full text-2xs font-extrabold uppercase bg-rose-50 text-rose-700 border border-rose-200 inline-block mb-2">
            Không đủ quyền truy cập
          </span>
          <h2 className="text-lg font-black text-stone-900">
            Chức Năng Đã Bị Khóa
          </h2>
          <p className="text-xs text-stone-600 mt-2 leading-relaxed">
            Bạn đang đăng nhập với vai trò <strong className="text-stone-900 font-extrabold">{currentConfig.title}</strong>.
            Chức năng <strong className="text-stone-900">{tabLabels[attemptedTab] || attemptedTab}</strong> chỉ dành cho vai trò có thẩm quyền.
          </p>
        </div>

        {/* Permissions reminder card */}
        <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 text-left space-y-2">
          <div className="flex items-center gap-2 text-2xs font-extrabold text-stone-700">
            <Lock className="w-3.5 h-3.5 text-stone-500" />
            <span>Phân quyền hệ thống:</span>
          </div>
          <ul className="text-2xs text-stone-600 space-y-1 pl-4 list-disc">
            <li><strong>Bộ Phận Bếp (KDS)</strong>: Chỉ xem màn hình chế biến Bếp (PIN 3333).</li>
            <li><strong>Bán Hàng & Thu Ngân</strong>: Chỉ xem Quầy POS & Sơ đồ bàn (PIN 2222).</li>
            <li><strong>Quản Trị Viên (Admin)</strong>: Xem toàn bộ các chức năng (PIN 8888).</li>
          </ul>
        </div>

        <button
          onClick={onOpenRoleSwitch}
          className="w-full py-3 px-5 bg-stone-900 hover:bg-stone-800 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
        >
          <KeyRound className="w-4 h-4 text-amber-400" />
          <span>Đăng Nhập / Đổi Vai Trò Làm Việc</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
