import React from 'react';
import { X, Clock, CheckCircle2, Flame, CreditCard, RefreshCw, ChefHat, Sparkles, BellRing, Utensils, Plus } from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { TableOrder } from '../../types';
import { formatVND, formatTimeHM } from '../../utils/format';

interface OrderTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPayment: (targetOrder?: TableOrder) => void;
}

export const OrderTrackerModal: React.FC<OrderTrackerModalProps> = ({ isOpen, onClose, onOpenPayment }) => {
  const { activeTableOrders, activeTableNumber, currentTable, kitchenLiveAlert } = useRestaurant();

  if (!isOpen) return null;

  const totalAmount = activeTableOrders.reduce((sum, ord) => sum + ord.totalAmount, 0);
  const totalUnpaid = activeTableOrders
    .filter(ord => ord.paymentStatus === 'unpaid')
    .reduce((sum, ord) => sum + ord.totalAmount, 0);
  const totalItemsCount = activeTableOrders.reduce((sum, ord) => sum + ord.items.reduce((s, i) => s + i.quantity, 0), 0);
  
  // Calculate overall progress across all batches
  const isAnyCooking = activeTableOrders.some(o => o.status === 'cooking' || o.items.some(i => i.status === 'cooking'));
  const isAllServed = activeTableOrders.length > 0 && activeTableOrders.every(o => o.status === 'served');
  const isPending = activeTableOrders.length > 0 && activeTableOrders.every(o => o.status === 'pending');

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div 
        id="modal-order-tracker"
        className="w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[88vh] border border-stone-200"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shadow-xs">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-stone-900 text-base sm:text-lg">
                Tiến Độ Món Bàn {activeTableNumber}
              </h2>
              <p className="text-xs text-stone-500">{currentTable.name} • {totalItemsCount} món đã gọi</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-stone-200 text-stone-500 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Real-time Kitchen Status Feedback Banner */}
        {activeTableOrders.length > 0 && (
          <div className="px-4 pt-3">
            {isAllServed ? (
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-300 p-3.5 rounded-2xl flex items-start gap-3 shadow-xs animate-in fade-in slide-in-from-top-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs sm:text-sm text-emerald-900">
                    🍽️ Bếp Đã Trả Đơn • Đã Lên Đủ Món!
                  </h4>
                  <p className="text-2xs sm:text-xs text-emerald-800 mt-0.5 leading-relaxed">
                    Toàn bộ món ăn cho bàn của quý khách đã được chế biến xong và mang lên bàn. Chúc quý khách có bữa ăn ngon miệng!
                  </p>
                </div>
              </div>
            ) : isAnyCooking ? (
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-300 p-3.5 rounded-2xl flex items-start gap-3 shadow-xs animate-in fade-in slide-in-from-top-2">
                <div className="w-8 h-8 rounded-xl bg-orange-600 text-white flex items-center justify-center shrink-0 shadow-xs animate-bounce">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs sm:text-sm text-orange-950">
                    👨‍🍳 Bếp Đã Tiếp Nhận & Đang Thực Hiện!
                  </h4>
                  <p className="text-2xs sm:text-xs text-orange-800 mt-0.5 leading-relaxed">
                    Đầu bếp đang thực hiện chế biến món tươi ngon cho bàn của bạn. Các món sẽ được lần lượt mang lên ngay khi hoàn thành.
                  </p>
                </div>
              </div>
            ) : isPending ? (
              <div className="bg-amber-50 border border-amber-300 p-3.5 rounded-2xl flex items-start gap-3 shadow-xs">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs animate-pulse">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs sm:text-sm text-amber-950">
                    ⏳ Đã Gửi Tới Bếp • Chờ Tiếp Nhận
                  </h4>
                  <p className="text-2xs sm:text-xs text-amber-800 mt-0.5 leading-relaxed">
                    Đơn hàng đã được truyền xuống màn hình bếp KDS. Bếp sẽ tiếp nhận và nổi lửa ngay trong giây lát.
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {activeTableOrders.length === 0 ? (
            <div className="py-12 text-center text-stone-400 space-y-2">
              <Utensils className="w-10 h-10 mx-auto text-stone-300" />
              <p className="font-medium text-sm text-stone-600">Bàn hiện chưa có đơn gọi món nào</p>
              <p className="text-xs text-stone-400">Chọn món trong thực đơn để gửi đơn xuống bếp nhé</p>
            </div>
          ) : (
            activeTableOrders.map((order, idx) => {
              const allServed = order.status === 'served' || order.items.every(i => i.status === 'served');
              const isCooking = order.status === 'cooking' || order.items.some(i => i.status === 'cooking');

              return (
                <div key={order.id} className="bg-stone-50 rounded-2xl p-4 border border-stone-200 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-stone-200/80 pb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-stone-900 text-sm">{order.orderNumber}</span>
                      <span className="text-xs text-stone-400">• Đợt {idx + 1} ({formatTimeHM(order.createdAt)})</span>
                      <span className={`text-3xs font-extrabold px-2 py-0.5 rounded-full border ${
                        order.paymentStatus === 'paid'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'bg-amber-100 text-amber-800 border-amber-300'
                      }`}>
                        {order.paymentStatus === 'paid' ? '💳 Đã TT' : '⏳ Chưa TT'}
                      </span>
                    </div>

                    {/* Overall order status badge */}
                    <div>
                      {allServed ? (
                        <span className="inline-flex items-center gap-1 text-2xs font-extrabold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-2xs">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Đã lên món
                        </span>
                      ) : isCooking ? (
                        <span className="inline-flex items-center gap-1 text-2xs font-extrabold px-2.5 py-1 rounded-full bg-orange-100 text-orange-800 border border-orange-200 animate-pulse shadow-2xs">
                          <Flame className="w-3 h-3 text-orange-600" />
                          Đang thực hiện
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-2xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                          <Clock className="w-3 h-3 text-amber-600" />
                          Chờ bếp nhận
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Items in this order batch */}
                  <div className="space-y-2 divide-y divide-stone-100">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-xs pt-1.5 first:pt-0">
                        <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
                          <span className="font-extrabold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100 shrink-0">
                            {item.quantity}x
                          </span>
                          <div className="min-w-0">
                            <span className="font-semibold text-stone-800 truncate block">{item.name}</span>
                            {item.selectedOptions && item.selectedOptions.length > 0 && (
                              <span className="text-3xs text-stone-500 block">
                                {item.selectedOptions.map(o => o.choiceName).join(', ')}
                              </span>
                            )}
                            {item.note && (
                              <span className="text-3xs text-amber-700 italic block">
                                Ghi chú: {item.note}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-medium text-stone-700">{formatVND(item.price * item.quantity)}</span>
                          {/* Item status badge */}
                          {item.status === 'served' ? (
                            <span className="text-3xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              <span>Đã lên</span>
                            </span>
                          ) : item.status === 'cooking' ? (
                            <span className="text-3xs font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200 animate-pulse flex items-center gap-1">
                              <Flame className="w-2.5 h-2.5" />
                              <span>Đang nấu</span>
                            </span>
                          ) : (
                            <span className="text-3xs font-medium text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md border border-stone-200">
                              Chờ nấu
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {order.note && (
                    <div className="pt-2 border-t border-stone-200/60 text-2xs text-stone-500">
                      <strong>Ghi chú đơn:</strong> {order.note}
                    </div>
                  )}

                  {/* Per-batch subtotal and payment option */}
                  <div className="pt-2 border-t border-stone-200 flex items-center justify-between">
                    <span className="text-2xs font-semibold text-stone-600">
                      Tổng đợt {idx + 1}: <strong className="text-stone-900">{formatVND(order.totalAmount)}</strong>
                    </span>

                    {activeTableOrders.length > 1 && (
                      <button
                        onClick={() => {
                          onClose();
                          onOpenPayment(order);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-3xs font-bold border border-emerald-200 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <CreditCard className="w-3 h-3 text-emerald-600" />
                        <span>Thanh toán riêng đợt này</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer with Payment Trigger */}
        {activeTableOrders.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-stone-200 bg-stone-50 space-y-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-stone-900 font-extrabold text-sm">
                <span>Tổng giá trị ({totalItemsCount} món):</span>
                <span className="text-stone-900 font-black">{formatVND(totalAmount)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span>Trạng thái thanh toán:</span>
                {totalUnpaid === 0 ? (
                  <span className="text-emerald-700 font-extrabold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Đã thanh toán đủ ({formatVND(totalAmount)})
                  </span>
                ) : (
                  <span className="text-orange-600 font-extrabold">
                    Chưa thanh toán: {formatVND(totalUnpaid)}
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                id="btn-order-more-tracker"
                onClick={onClose}
                className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 active:scale-98 text-white font-extrabold rounded-2xl shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer text-xs sm:text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Chọn & Gọi Thêm Món</span>
              </button>

              {totalUnpaid > 0 ? (
                <button
                  id="btn-open-payment-modal"
                  onClick={() => {
                    onClose();
                    onOpenPayment();
                  }}
                  className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-98 text-white font-extrabold rounded-2xl shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer text-xs sm:text-sm"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Thanh Toán ({formatVND(totalUnpaid)})</span>
                </button>
              ) : (
                <button
                  id="btn-view-invoice-tracker"
                  onClick={() => {
                    onClose();
                    onOpenPayment();
                  }}
                  className="flex-1 py-3 bg-stone-800 hover:bg-stone-900 active:scale-98 text-white font-extrabold rounded-2xl shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer text-xs sm:text-sm"
                >
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                  <span>Xem Lại Hóa Đơn / QR</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
