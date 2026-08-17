import React, { useState, useMemo } from 'react';
import { 
  LayoutGrid, 
  Users, 
  Clock, 
  CreditCard, 
  Printer, 
  RotateCcw, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  Bell,
  Eye,
  DollarSign,
  RefreshCw,
  Wifi,
  WifiOff,
  Plus,
  Send,
  ChefHat,
  Search,
  Check
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { RestaurantTable, TableOrder, MenuItem, CartItem } from '../../types';
import { formatVND, formatTimeHM } from '../../utils/format';

interface TableMapPOSProps {
  onSelectTableForPos?: (tableNumber: string) => void;
}

export const TableMapPOS: React.FC<TableMapPOSProps> = ({ onSelectTableForPos }) => {
  const { 
    tables, 
    orders, 
    serviceCalls, 
    updateTableStatus, 
    resetTableSession, 
    payOrder, 
    payMultipleOrders,
    setActiveTableNumber,
    restaurantInfo,
    isLiveSynced,
    refreshServerState,
    menuItems,
    submitDirectOrder,
    playNotificationSound
  } = useRestaurant();

  const [selectedZone, setSelectedZone] = useState<string>('all');
  const [activeInspectTable, setActiveInspectTable] = useState<RestaurantTable | null>(null);
  const [posPayMethod, setPosPayMethod] = useState<'cash' | 'vietqr' | 'card'>('cash');
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Quick Dish Ordering State inside Table Modal
  const [quickDishSearch, setQuickDishSearch] = useState<string>('');
  const [quickCart, setQuickCart] = useState<{ dish: MenuItem; qty: number }[]>([]);
  const [quickOrderToast, setQuickOrderToast] = useState<string | null>(null);

  const showQuickToast = (msg: string) => {
    setQuickOrderToast(msg);
    setTimeout(() => setQuickOrderToast(null), 2500);
  };

  const handleAddQuickDish = (dish: MenuItem) => {
    if (!dish.isAvailable) return;
    setQuickCart(prev => {
      const existing = prev.find(i => i.dish.id === dish.id);
      if (existing) {
        return prev.map(i => i.dish.id === dish.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { dish, qty: 1 }];
    });
  };

  const handleSendQuickToKitchen = () => {
    if (!activeInspectTable || quickCart.length === 0) return;

    const orderNum = `#${Math.floor(100 + Math.random() * 900)}`;
    const totalAmount = quickCart.reduce((sum, item) => sum + (item.dish.price * item.qty), 0);
    const newOrderId = `ord-${Date.now()}`;

    const newOrder: TableOrder = {
      id: newOrderId,
      orderNumber: orderNum,
      tableNumber: activeInspectTable.number,
      tableName: activeInspectTable.name,
      customerName: `Khách ${activeInspectTable.name}`,
      createdAt: Date.now(),
      status: 'pending',
      paymentStatus: 'unpaid',
      totalAmount,
      note: 'Gọi món nhanh từ Sơ Đồ Bàn',
      items: quickCart.map(c => ({
        id: `oi-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        menuItemId: c.dish.id,
        name: c.dish.name,
        price: c.dish.price,
        quantity: c.qty,
        selectedOptions: [],
        note: '',
        status: 'pending'
      }))
    };

    submitDirectOrder(newOrder);
    playNotificationSound('order');
    updateTableStatus(activeInspectTable.id, 'eating');
    showQuickToast(`👨‍🍳 Đã bắn ${quickCart.length} món xuống Bếp thành công!`);
    setQuickCart([]);
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshServerState();
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const dynamicZones = Array.from(new Set(tables.map(t => t.zone)));
  const zones = ['all', ...dynamicZones];

  const filteredTables = tables.filter(t => {
    if (selectedZone !== 'all' && t.zone !== selectedZone) return false;
    return true;
  });

  const getTableOrders = (tableNum: string): TableOrder[] => {
    return orders.filter(o => o.tableNumber === tableNum && o.paymentStatus === 'unpaid');
  };

  const getTableTotal = (tableNum: string): number => {
    const tableOrds = getTableOrders(tableNum);
    return tableOrds.reduce((sum, o) => sum + o.totalAmount, 0);
  };

  // Status visual mapping
  const getStatusBadge = (status: RestaurantTable['status']) => {
    switch (status) {
      case 'empty':
        return { label: 'Bàn Trống', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
      case 'ordering':
        return { label: 'Đang Xem Menu', bg: 'bg-amber-100 text-amber-800 border-amber-200' };
      case 'eating':
        return { label: 'Đang Dùng Bữa', bg: 'bg-blue-100 text-blue-800 border-blue-200' };
      case 'calling_staff':
        return { label: 'Cần Phục Vụ', bg: 'bg-red-100 text-red-800 border-red-200 animate-pulse' };
      case 'waiting_bill':
        return { label: 'Chờ Tính Tiền', bg: 'bg-purple-100 text-purple-800 border-purple-200' };
    }
  };

  return (
    <div className="min-h-screen bg-stone-100/70 pb-24">
      {/* Top Header */}
      <div className="bg-white border-b border-stone-200 sticky top-[88px] sm:top-[92px] z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-extrabold text-base sm:text-lg text-stone-900 flex items-center gap-2">
              <LayoutGrid className="w-5 h-5 text-amber-600" />
              <span>Sơ Đồ Bàn & Thu Ngân (POS)</span>
            </h1>
            <p className="text-xs text-stone-500">
              Giám sát trạng thái bàn thời gian thực và quản lý hóa đơn
            </p>
          </div>

          {/* Zone Selector & Live Sync */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
            {/* Live Server Sync Indicator Button */}
            <button
              onClick={handleManualRefresh}
              title={isLiveSynced ? "Máy chủ đang đồng bộ trực tiếp • Bấm để tải lại" : "Mất kết nối máy chủ • Bấm để thử lại"}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                isLiveSynced 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100' 
                  : 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
              }`}
            >
              {isLiveSynced ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="hidden sm:inline text-3xs">Trực Tiếp</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-red-500" />
                  <span className="hidden sm:inline text-3xs">Offline</span>
                </>
              )}
              <RefreshCw className={`w-3.5 h-3.5 ml-0.5 ${isRefreshing ? 'animate-spin text-amber-600' : 'text-stone-400'}`} />
            </button>

            <div className="flex items-center space-x-1">
              {zones.map((zone) => (
                <button
                  key={zone}
                  onClick={() => setSelectedZone(zone)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    selectedZone === zone
                      ? 'bg-stone-900 text-white shadow-2xs'
                      : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                  }`}
                >
                  {zone === 'all' ? 'Tất cả khu vực' : zone}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="max-w-7xl mx-auto px-4 py-2 border-t border-stone-100 flex items-center gap-3 sm:gap-6 text-2xs overflow-x-auto scrollbar-none">
          <span className="text-stone-400 font-bold uppercase tracking-wider">Chú thích:</span>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> <span>Trống</span></div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> <span>Đang xem</span></div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> <span>Đang ăn</span></div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> <span>Cần hỗ trợ</span></div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span> <span>Chờ hóa đơn</span></div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="max-w-7xl mx-auto px-4 pt-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4">
          {filteredTables.map((table) => {
            const tableOrders = getTableOrders(table.number);
            const total = getTableTotal(table.number);
            const statusInfo = getStatusBadge(table.status);

            return (
              <div
                key={table.id}
                id={`table-pos-${table.number}`}
                onClick={() => setActiveInspectTable(table)}
                className={`bg-white rounded-3xl border p-4 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between relative group ${
                  table.status === 'calling_staff'
                    ? 'border-red-400 ring-2 ring-red-300'
                    : table.status === 'eating'
                    ? 'border-blue-300'
                    : table.status === 'waiting_bill'
                    ? 'border-purple-300'
                    : 'border-stone-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-base sm:text-lg text-stone-900 group-hover:text-amber-600 transition-colors">
                      {table.name}
                    </span>
                    <span className="text-2xs text-stone-400 flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {table.capacity} chỗ
                    </span>
                  </div>

                  <span className="text-3xs font-medium text-stone-400 mt-0.5 block">
                    {table.zone}
                  </span>

                  <div className="mt-2.5">
                    <span className={`inline-block text-3xs font-bold px-2 py-0.5 rounded-full border ${statusInfo.bg}`}>
                      {statusInfo.label}
                    </span>
                  </div>
                </div>

                {/* Bottom billing indicator */}
                <div className="pt-3 mt-3 border-t border-stone-100 flex items-center justify-between">
                  {total > 0 ? (
                    <div>
                      <span className="text-3xs text-stone-400 block font-medium">Tạm tính ({tableOrders.length} đơn)</span>
                      <span className="font-extrabold text-amber-600 text-xs sm:text-sm">{formatVND(total)}</span>
                    </div>
                  ) : (
                    <span className="text-3xs text-stone-400 italic">Chưa có đơn</span>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onSelectTableForPos) {
                        onSelectTableForPos(table.number);
                      } else {
                        setActiveTableNumber(table.number);
                      }
                    }}
                    title="Mở Quầy POS tạo đơn / thêm món cho bàn này"
                    className="px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-500 hover:text-white text-amber-800 text-2xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Gọi món</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Table Inspection Modal */}
      {activeInspectTable && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] border border-stone-200">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-extrabold text-stone-900 text-lg">
                    Chi Tiết {activeInspectTable.name}
                  </h2>
                  <span className="text-xs bg-stone-200 text-stone-700 font-bold px-2 py-0.5 rounded-md">
                    {activeInspectTable.zone}
                  </span>
                </div>
                <p className="text-xs text-stone-500">Quản lý hóa đơn & trạng thái phiên bàn</p>
              </div>

              <button
                onClick={() => setActiveInspectTable(null)}
                className="p-2 rounded-full hover:bg-stone-200 text-stone-500 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {/* Change status buttons */}
              <div>
                <label className="block text-2xs font-bold text-stone-500 uppercase tracking-wider mb-2">
                  Chuyển trạng thái bàn:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['empty', 'eating', 'waiting_bill'] as RestaurantTable['status'][]).map(st => (
                    <button
                      key={st}
                      onClick={() => updateTableStatus(activeInspectTable.id, st)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        activeInspectTable.status === st
                          ? 'bg-stone-900 text-white border-stone-900 shadow-2xs'
                          : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      {st === 'empty' ? 'Bàn trống' : st === 'eating' ? 'Đang ăn' : 'Chờ hóa đơn'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Call & Send to Kitchen Section */}
              <div className="p-3.5 bg-amber-50/60 rounded-2xl border border-amber-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-2xs font-black text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                    <ChefHat className="w-3.5 h-3.5 text-amber-600" />
                    <span>Gọi Món & Báo Bếp Nhanh Tại Bàn</span>
                  </span>
                  {quickCart.length > 0 && (
                    <button
                      onClick={() => setQuickCart([])}
                      className="text-3xs text-rose-600 font-bold hover:underline cursor-pointer"
                    >
                      Xóa chọn
                    </button>
                  )}
                </div>

                {quickOrderToast && (
                  <div className="text-2xs font-bold text-emerald-800 bg-emerald-100 p-2 rounded-xl border border-emerald-300 flex items-center gap-1.5 animate-in fade-in">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{quickOrderToast}</span>
                  </div>
                )}

                {/* Quick search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={quickDishSearch}
                    onChange={(e) => setQuickDishSearch(e.target.value)}
                    placeholder="Tìm món gọi nhanh cho bàn này..."
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-amber-200 rounded-xl text-2xs focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
                  />
                </div>

                {/* Quick Dish Pills */}
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                  {menuItems
                    .filter(m => m.isAvailable && (!quickDishSearch || m.name.toLowerCase().includes(quickDishSearch.toLowerCase())))
                    .slice(0, 10)
                    .map(dish => (
                      <button
                        key={dish.id}
                        type="button"
                        onClick={() => handleAddQuickDish(dish)}
                        className="px-2.5 py-1 bg-white hover:bg-amber-500 hover:text-white text-stone-700 rounded-xl border border-amber-200 text-3xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                      >
                        <Plus className="w-2.5 h-2.5" />
                        <span>{dish.name} ({formatVND(dish.price)})</span>
                      </button>
                    ))}
                </div>

                {/* Quick Cart Preview & Dispatch Button */}
                {quickCart.length > 0 && (
                  <div className="pt-2 border-t border-amber-200/80 space-y-2">
                    <div className="space-y-1 text-2xs">
                      {quickCart.map(item => (
                        <div key={item.dish.id} className="flex justify-between items-center bg-white px-2 py-1 rounded-lg border border-amber-100 font-medium">
                          <span>{item.qty}x {item.dish.name}</span>
                          <span className="font-bold text-amber-800">{formatVND(item.dish.price * item.qty)}</span>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={handleSendQuickToKitchen}
                      className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-98 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>⚡ BÁO BẾP NGAY ({quickCart.reduce((s, i) => s + i.qty, 0)} MÓN - {formatVND(quickCart.reduce((s, i) => s + (i.dish.price * i.qty), 0))})</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Order history list */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-2xs font-bold text-stone-500 uppercase tracking-wider">
                    Các đợt gọi món tại bàn:
                  </label>
                  <span className="text-xs font-bold text-stone-900">
                    Tổng: {formatVND(getTableTotal(activeInspectTable.number))}
                  </span>
                </div>

                {getTableOrders(activeInspectTable.number).length === 0 ? (
                  <div className="p-6 text-center text-stone-400 bg-stone-50 rounded-2xl border border-stone-200 text-xs">
                    Bàn hiện chưa có món ăn nào được gọi
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {getTableOrders(activeInspectTable.number).map((order, idx) => (
                      <div key={order.id} className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200 space-y-2 text-xs">
                        <div className="flex items-center justify-between font-bold text-stone-800">
                          <div className="flex items-center gap-1.5">
                            <span className="bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded text-3xs font-black">
                              Đợt {idx + 1}
                            </span>
                            <span>{order.orderNumber} ({formatTimeHM(order.createdAt)})</span>
                          </div>
                          <span className="text-amber-600 font-extrabold">{formatVND(order.totalAmount)}</span>
                        </div>
                        
                        <div className="space-y-1">
                          {order.items.map(item => (
                            <div key={item.id} className="flex justify-between text-stone-600 text-2xs">
                              <span>{item.quantity}x {item.name}</span>
                              <span>{formatVND(item.price * item.quantity)}</span>
                            </div>
                          ))}
                        </div>

                        {/* Individual batch payment trigger */}
                        <div className="pt-2 border-t border-stone-200/80 flex items-center justify-between">
                          <span className="text-3xs text-stone-400">Ghi nhận riêng vào Thu Chi</span>
                          <button
                            onClick={() => {
                              payOrder(order.id, posPayMethod, order.totalAmount, order);
                              if (getTableOrders(activeInspectTable.number).length <= 1) {
                                setActiveInspectTable(null);
                              }
                            }}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-3xs font-bold rounded-lg border border-emerald-200 transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <DollarSign className="w-3 h-3 text-emerald-600" />
                            <span>Thu riêng đợt này ({formatVND(order.totalAmount)})</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Payment Method selector for POS */}
              {getTableTotal(activeInspectTable.number) > 0 && (
                <div>
                  <label className="block text-2xs font-bold text-stone-500 uppercase tracking-wider mb-1.5">
                    Phương thức thanh toán:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'cash' as const, label: 'Tiền mặt' },
                      { id: 'vietqr' as const, label: 'VietQR' },
                      { id: 'card' as const, label: 'Quẹt thẻ' }
                    ].map(pm => (
                      <button
                        key={pm.id}
                        type="button"
                        onClick={() => setPosPayMethod(pm.id)}
                        className={`py-1.5 px-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer text-center ${
                          posPayMethod === pm.id
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs font-bold'
                            : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        {pm.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-4 sm:p-5 border-t border-stone-200 bg-stone-50 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    resetTableSession(activeInspectTable.number);
                    setActiveInspectTable(null);
                  }}
                  className="px-3 py-2 rounded-xl border border-red-300 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Dọn Bàn</span>
                </button>

                {onSelectTableForPos && (
                  <button
                    onClick={() => {
                      const tbl = activeInspectTable.number;
                      setActiveInspectTable(null);
                      onSelectTableForPos(tbl);
                    }}
                    className="px-3 py-2 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-amber-600" />
                    <span>Lên Món Tại Quầy</span>
                  </button>
                )}
              </div>

              {getTableTotal(activeInspectTable.number) > 0 && (
                <button
                  onClick={async () => {
                    const tableOrders = getTableOrders(activeInspectTable.number);
                    const batchPayments = tableOrders.map(o => ({
                      id: o.id,
                      amount: o.totalAmount,
                      paymentMethod: posPayMethod,
                      order: o
                    }));
                    await payMultipleOrders(batchPayments);
                    setActiveInspectTable(null);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                >
                  <DollarSign className="w-4 h-4" />
                  <span>Thu Toàn Bộ ({formatVND(getTableTotal(activeInspectTable.number))})</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
