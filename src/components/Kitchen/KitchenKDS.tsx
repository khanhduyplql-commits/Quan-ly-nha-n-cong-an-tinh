import React, { useState } from 'react';
import { 
  ChefHat, 
  Clock, 
  Flame, 
  CheckCircle2, 
  AlertTriangle, 
  Bell, 
  Printer, 
  Check,
  Search,
  Filter,
  Layers,
  Volume2,
  RefreshCw,
  Wifi,
  WifiOff,
  Zap,
  Sparkles,
  RotateCcw,
  UtensilsCrossed,
  Send,
  Timer
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { OrderStatus, TableOrder } from '../../types';
import { formatTimeAgo, formatTimeHM, formatVND } from '../../utils/format';

export const KitchenKDS: React.FC = () => {
  const { 
    orders, 
    updateOrderStatus, 
    updateOrderItemStatus, 
    serviceCalls, 
    resolveServiceCall,
    playNotificationSound,
    isLiveSynced,
    refreshServerState,
    createQuickTestOrder
  } = useRestaurant();

  const [statusFilter, setStatusFilter] = useState<'active' | 'pending' | 'cooking' | 'served' | 'all'>('active');
  const [searchTable, setSearchTable] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [justSimulated, setJustSimulated] = useState(false);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshServerState();
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const handleSimulateOrder = () => {
    createQuickTestOrder('05');
    setJustSimulated(true);
    setTimeout(() => setJustSimulated(false), 3000);
  };

  // Pending service calls
  const pendingCalls = serviceCalls.filter(c => c.status === 'pending');

  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const cookingCount = orders.filter(o => o.status === 'cooking' || (o.status as string === 'paid' && o.items.some(i => i.status !== 'served'))).length;
  const servedCount = orders.filter(o => o.status === 'served' || (o.items.length > 0 && o.items.every(i => i.status === 'served'))).length;
  const activeOrdersCount = pendingCount + cookingCount;

  // Filter orders
  const filteredOrders = orders.filter(order => {
    if (order.status === 'cancelled') {
      if (statusFilter !== 'all') return false;
    }

    const isOrderCooking = order.status === 'cooking' || (order.status as string === 'paid' && order.items.some(i => i.status !== 'served'));
    const isOrderPending = order.status === 'pending';
    const isOrderServed = order.status === 'served' || (order.items.length > 0 && order.items.every(i => i.status === 'served'));

    if (statusFilter === 'active' && !isOrderPending && !isOrderCooking) {
      return false;
    }
    if (statusFilter === 'pending' && !isOrderPending) {
      return false;
    }
    if (statusFilter === 'cooking' && !isOrderCooking) {
      return false;
    }
    if (statusFilter === 'served' && !isOrderServed) {
      return false;
    }

    if (searchTable.trim()) {
      const q = searchTable.toLowerCase();
      if (!order.tableNumber.toLowerCase().includes(q) && !order.tableName.toLowerCase().includes(q) && !order.orderNumber.toLowerCase().includes(q)) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100 pb-24">
      {/* KDS Top Header */}
      <div className="bg-stone-950 border-b border-stone-800 sticky top-[88px] sm:top-[92px] z-30 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center shadow-lg shadow-orange-600/30">
              <ChefHat className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-extrabold text-base sm:text-lg text-white">
                  Màn Hình Quản Lý Bếp (KDS)
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  {activeOrdersCount} đơn đang xử lý
                </span>
              </div>
              <p className="text-2xs text-stone-400">
                Tự động nhận đơn QR tại bàn • Báo trạng thái tiếp nhận & lên món cho khách tức thì
              </p>
            </div>
          </div>

          {/* Search, Filter, Live status & Sound button */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm bàn / mã đơn..."
                value={searchTable}
                onChange={(e) => setSearchTable(e.target.value)}
                className="w-32 sm:w-40 px-3 py-1.5 pl-8 rounded-xl bg-stone-900 border border-stone-800 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-orange-500"
              />
              <Search className="w-3.5 h-3.5 text-stone-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>

            {/* Live Server Sync Indicator Button */}
            <button
              onClick={handleManualRefresh}
              title={isLiveSynced ? "Máy chủ đang đồng bộ trực tiếp • Bấm để tải lại" : "Mất kết nối máy chủ • Bấm để thử lại"}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                isLiveSynced 
                  ? 'bg-emerald-950/70 border-emerald-800 text-emerald-300 hover:bg-emerald-900/80' 
                  : 'bg-red-950/70 border-red-800 text-red-300 hover:bg-red-900/80'
              }`}
            >
              {isLiveSynced ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="hidden sm:inline text-3xs font-bold">Trực Tiếp</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-red-400" />
                  <span className="hidden sm:inline text-3xs font-bold">Offline</span>
                </>
              )}
              <RefreshCw className={`w-3.5 h-3.5 ml-0.5 ${isRefreshing ? 'animate-spin text-orange-400' : 'text-stone-400'}`} />
            </button>

            {/* Filter Tabs */}
            <div className="flex bg-stone-900 rounded-xl p-1 border border-stone-800 text-xs overflow-x-auto scrollbar-none">
              <button
                onClick={() => setStatusFilter('active')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === 'active'
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                Đang Làm ({activeOrdersCount})
              </button>
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                  statusFilter === 'pending'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                Chờ Nhận ({pendingCount})
              </button>
              <button
                onClick={() => setStatusFilter('cooking')}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                  statusFilter === 'cooking'
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                <Flame className="w-3 h-3" />
                Đang Nấu ({cookingCount})
              </button>
              <button
                onClick={() => setStatusFilter('served')}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === 'served'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                Đã Lên Món ({servedCount})
              </button>
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === 'all'
                    ? 'bg-stone-700 text-white shadow-xs'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                Tất Cả
              </button>
            </div>

            <button
              onClick={() => playNotificationSound('order')}
              title="Thử chuông bếp"
              className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 cursor-pointer"
            >
              <Volume2 className="w-4 h-4" />
            </button>

            <button
              onClick={handleSimulateOrder}
              title="Bấm để tạo ngay 1 đơn khách Bàn 05 kiểm tra chuông và hiển thị"
              className={`px-3 py-1.5 rounded-xl border font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                justSimulated
                  ? 'bg-emerald-600 text-white border-emerald-500 scale-105'
                  : 'bg-amber-500 hover:bg-amber-600 text-stone-950 border-amber-400'
              }`}
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>{justSimulated ? 'Đã Gửi Đơn!' : '⚡ Thử Bắn Đơn'}</span>
            </button>
          </div>
        </div>

        {/* Pending Service Calls Alert Banner */}
        {pendingCalls.length > 0 && (
          <div className="bg-amber-950/80 border-t border-amber-800/80 px-4 py-2">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 overflow-x-auto scrollbar-none">
              <div className="flex items-center gap-2 text-xs text-amber-300 font-medium shrink-0">
                <Bell className="w-4 h-4 text-amber-400 animate-bounce shrink-0" />
                <span>Yêu cầu hỗ trợ mới ({pendingCalls.length}):</span>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto">
                {pendingCalls.map((call) => (
                  <div 
                    key={call.id}
                    className="flex items-center gap-2 bg-amber-900/60 border border-amber-700/80 px-2.5 py-1 rounded-lg text-2xs text-amber-200 shrink-0"
                  >
                    <strong>{call.tableName}:</strong>
                    <span>{call.message}</span>
                    <button
                      onClick={() => resolveServiceCall(call.id)}
                      className="ml-1 px-1.5 py-0.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-3xs font-bold cursor-pointer"
                    >
                      Đã xử lý
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Orders Grid */}
      <div className="max-w-7xl mx-auto px-4 pt-6">
        {filteredOrders.length === 0 ? (
          <div className="py-24 text-center text-stone-500 space-y-3 bg-stone-950/50 rounded-3xl border border-stone-800/60">
            <ChefHat className="w-12 h-12 mx-auto text-stone-700" />
            <h3 className="text-base font-bold text-stone-300">Không có đơn hàng nào theo bộ lọc này</h3>
            <p className="text-xs text-stone-500 max-w-md mx-auto">
              Khi khách hàng tại bàn quét mã QR và gửi đơn, phiếu món sẽ lập tức xuất hiện tại đây kèm âm thanh chuông báo.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {filteredOrders.map((order) => {
              const elapsedMinutes = Math.floor((Date.now() - order.createdAt) / (1000 * 60));
              const isUrgent = elapsedMinutes > 15 && order.status !== 'served' && order.status !== 'paid';
              const servedItemsCount = order.items.filter(i => i.status === 'served').length;
              const totalItemsCount = order.items.length;

              return (
                <div
                  key={order.id}
                  id={`kds-card-${order.id}`}
                  className={`rounded-3xl border flex flex-col justify-between overflow-hidden shadow-xl transition-all ${
                    isUrgent
                      ? 'bg-stone-950 border-red-500/80 ring-2 ring-red-500/30 shadow-red-950/40'
                      : order.status === 'pending'
                      ? 'bg-stone-950 border-amber-600/80 ring-1 ring-amber-500/30'
                      : order.status === 'cooking'
                      ? 'bg-stone-950 border-orange-600/80'
                      : order.status === 'served'
                      ? 'bg-stone-950/80 border-emerald-800/60 opacity-90'
                      : 'bg-stone-950 border-stone-800'
                  }`}
                >
                  {/* Card Header */}
                  <div className={`p-4 border-b ${
                    isUrgent 
                      ? 'bg-red-950/60 border-red-900/60' 
                      : order.status === 'pending'
                      ? 'bg-amber-950/50 border-amber-900/60'
                      : order.status === 'cooking'
                      ? 'bg-orange-950/40 border-orange-900/40'
                      : order.status === 'served'
                      ? 'bg-emerald-950/40 border-emerald-900/40'
                      : 'bg-stone-900/80 border-stone-800'
                  }`}>
                    {/* Live State Badge Banner */}
                    <div className="mb-2 space-y-1">
                      {Date.now() - order.createdAt < 60000 && order.status !== 'served' && (
                        <div className="flex items-center gap-1.5 text-3xs font-black text-white bg-gradient-to-r from-red-600 to-amber-600 px-2.5 py-1 rounded-lg border border-amber-400 shadow-sm animate-pulse">
                          <Zap className="w-3 h-3 fill-current text-yellow-300" />
                          <span>⚡ VỪA NHẬN TỨC THÌ (DƯỚI 1 PHÚT)</span>
                        </div>
                      )}

                      {order.status === 'pending' && (
                        <div className="flex items-center gap-1.5 text-2xs font-extrabold text-amber-400 bg-amber-900/50 px-2.5 py-1 rounded-lg border border-amber-700/50 animate-pulse">
                          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                          <span>⏳ ĐƠN MỚI • CHỜ BẾP TIẾP NHẬN</span>
                        </div>
                      )}
                      {order.status === 'cooking' && (
                        <div className="flex items-center justify-between text-2xs font-extrabold text-orange-400 bg-orange-900/40 px-2.5 py-1 rounded-lg border border-orange-700/50">
                          <div className="flex items-center gap-1.5">
                            <Flame className="w-3.5 h-3.5 text-orange-400 animate-bounce" />
                            <span>🔥 ĐÃ TIẾP NHẬN • ĐANG THỰC HIỆN CHẾ BIẾN</span>
                          </div>
                          <span className="text-3xs text-stone-400">
                            {servedItemsCount}/{totalItemsCount} món
                          </span>
                        </div>
                      )}
                      {order.status === 'served' && (
                        <div className="flex items-center gap-1.5 text-2xs font-extrabold text-emerald-400 bg-emerald-900/40 px-2.5 py-1 rounded-lg border border-emerald-700/50">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>✨ ĐÃ TRẢ ĐƠN • ĐÃ LÊN ĐỦ MÓN CHO BÀN</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-lg font-black text-white px-2.5 py-0.5 rounded-xl bg-orange-600 shadow-xs">
                          {order.tableName}
                        </span>
                        <span className="font-bold text-sm text-stone-300">
                          {order.orderNumber}
                        </span>
                        <span className={`text-3xs font-extrabold px-2 py-0.5 rounded-full border ${
                          order.paymentStatus === 'paid'
                            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/80'
                            : 'bg-amber-950/80 text-amber-300 border-amber-700/80'
                        }`}>
                          {order.paymentStatus === 'paid' ? 'ĐÃ THU TIỀN' : 'CHƯA THU'}
                        </span>
                      </div>

                      {/* Timer */}
                      <div className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
                        isUrgent 
                          ? 'bg-red-600 text-white animate-pulse'
                          : 'bg-stone-800 text-stone-300'
                      }`}>
                        <Clock className="w-3.5 h-3.5" />
                        <span>{formatTimeAgo(order.createdAt)}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-2xs text-stone-400 mt-2">
                      <span>Khách: <strong>{order.customerName || 'Khách tại bàn'}</strong></span>
                      <span>Giờ đặt: {formatTimeHM(order.createdAt)}</span>
                    </div>

                    {order.note && (
                      <div className="mt-2 text-xs bg-amber-950/60 border border-amber-700/60 text-amber-300 p-2 rounded-xl font-medium">
                        <strong>Ghi chú đơn:</strong> {order.note}
                      </div>
                    )}
                  </div>

                  {/* Dishes Item Checklist */}
                  <div className="p-4 flex-1 space-y-2.5 divide-y divide-stone-800/80">
                    <div className="flex items-center justify-between text-2xs text-stone-400 pb-1">
                      <span>Chạm vào từng món để đổi trạng thái nhanh:</span>
                      <span className="font-bold text-orange-400">{servedItemsCount}/{totalItemsCount} đã lên</span>
                    </div>

                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          const nextStatus = item.status === 'pending' ? 'cooking' : item.status === 'cooking' ? 'served' : 'pending';
                          updateOrderItemStatus(order.id, item.id, nextStatus);
                        }}
                        className={`pt-2.5 first:pt-0 flex items-start justify-between gap-2 cursor-pointer group select-none transition-all p-1.5 rounded-xl hover:bg-stone-900/60 ${
                          item.status === 'served' ? 'opacity-50' : ''
                        }`}
                      >
                        <div className="flex items-start gap-2.5 min-w-0">
                          <span className={`font-extrabold text-base px-2 py-0.5 rounded-lg shrink-0 ${
                            item.status === 'served'
                              ? 'text-emerald-400 bg-emerald-950/80 border border-emerald-800/80'
                              : item.status === 'cooking'
                              ? 'text-orange-400 bg-orange-950/80 border border-orange-800/80'
                              : 'text-stone-300 bg-stone-800 border border-stone-700'
                          }`}>
                            {item.quantity}x
                          </span>
                          <div className="min-w-0">
                            <h4 className={`font-bold text-sm transition-colors ${
                              item.status === 'served' ? 'text-stone-400 line-through' : 'text-stone-100 group-hover:text-orange-400'
                            }`}>
                              {item.name}
                            </h4>
                            {item.selectedOptions && item.selectedOptions.length > 0 && (
                              <p className="text-2xs text-stone-400 mt-0.5">
                                {item.selectedOptions.map(o => o.choiceName).join(' • ')}
                              </p>
                            )}
                            {item.note && (
                              <p className="text-2xs text-amber-400 italic mt-0.5">
                                Ghi chú: {item.note}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Dish status badge */}
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className={`text-3xs font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                            item.status === 'served'
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                              : item.status === 'cooking'
                              ? 'bg-orange-950 text-orange-300 border-orange-800 animate-pulse'
                              : 'bg-stone-800 text-stone-400 border-stone-700'
                          }`}>
                            {item.status === 'served' ? (
                              <>
                                <Check className="w-2.5 h-2.5" />
                                <span>Đã lên món</span>
                              </>
                            ) : item.status === 'cooking' ? (
                              <>
                                <Flame className="w-2.5 h-2.5 text-orange-400" />
                                <span>Đang nấu</span>
                              </>
                            ) : (
                              <>
                                <Clock className="w-2.5 h-2.5 text-stone-400" />
                                <span>Chờ nấu</span>
                              </>
                            )}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Card Bottom Actions */}
                  <div className="p-4 border-t border-stone-800 bg-stone-900/80 space-y-2.5">
                    <div className="flex items-center justify-between text-xs text-stone-400">
                      <span>Tổng giá trị: <strong className="text-stone-200">{formatVND(order.totalAmount)}</strong></span>
                      <span className="text-2xs">Trạng thái: 
                        <strong className={order.paymentStatus === 'paid' ? 'text-emerald-400 ml-1' : 'text-amber-400 ml-1'}>
                          {order.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                        </strong>
                      </span>
                    </div>

                    {/* Action button with direct feedback to customer */}
                    <div className="space-y-1.5 pt-1">
                      {order.status === 'pending' && (
                        <div>
                          <button
                            onClick={() => updateOrderStatus(order.id, 'cooking')}
                            className="w-full py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-2xl text-sm font-extrabold shadow-lg shadow-orange-950/50 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
                          >
                            <ChefHat className="w-5 h-5" />
                            <span>👨‍🍳 Tiếp Nhận Đơn & Bắt Đầu Chế Biến</span>
                          </button>
                          <p className="text-3xs text-stone-400 text-center mt-1">
                            Bấm để báo cho khách: "Bếp đã tiếp nhận & đang thực hiện"
                          </p>
                        </div>
                      )}

                      {order.status === 'cooking' && (
                        <div>
                          <button
                            onClick={() => updateOrderStatus(order.id, 'served')}
                            className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl text-sm font-extrabold shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
                          >
                            <CheckCircle2 className="w-5 h-5" />
                            <span>🍽️ Trả Đơn • Đã Lên Đủ Món Cho Khách</span>
                          </button>
                          <p className="text-3xs text-stone-400 text-center mt-1">
                            Bấm để báo cho khách: "Bếp đã hoàn tất & đã lên món"
                          </p>
                        </div>
                      )}

                      {order.status === 'served' && (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 py-2.5 bg-emerald-950/90 border border-emerald-800 text-emerald-300 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1.5">
                            <Check className="w-4 h-4 text-emerald-400" />
                            <span>✅ Đã lên món hoàn tất</span>
                          </div>
                          <button
                            onClick={() => updateOrderStatus(order.id, 'cooking')}
                            title="Hoàn tác trạng thái về đang nấu"
                            className="px-3 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors border border-stone-700"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Nấu thêm</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
