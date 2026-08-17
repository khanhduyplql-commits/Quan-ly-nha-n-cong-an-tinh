import React, { useState } from 'react';
import { X, Trash2, Plus, Minus, Send, ShoppingCart, Sparkles, MapPin, RefreshCw, QrCode } from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { formatVND } from '../../utils/format';
import { TableSelectModal } from './TableSelectModal';
import confetti from 'canvas-confetti';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderSubmitted: () => void;
  onOpenPayment?: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose, onOrderSubmitted, onOpenPayment }) => {
  const { 
    cart, 
    removeFromCart, 
    updateCartItemQuantity, 
    clearCart, 
    cartTotal, 
    submitOrder, 
    currentTable,
    activeTableNumber
  } = useRestaurant();

  const [customerName, setCustomerName] = useState('');
  const [orderNote, setOrderNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);

  if (!isOpen) return null;

  const handleSendOrder = () => {
    if (cart.length === 0 || isSubmitting) return;

    setIsSubmitting(true);
    setTimeout(() => {
      submitOrder(customerName.trim(), orderNote.trim());
      setIsSubmitting(false);

      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.7 }
        });
      } catch {
        // Safe fallback
      }

      onClose();
      onOrderSubmitted();
    }, 500);
  };

  const handlePayImmediately = () => {
    if (cart.length === 0 || isSubmitting) return;

    setIsSubmitting(true);
    setTimeout(() => {
      submitOrder(customerName.trim(), orderNote.trim());
      setIsSubmitting(false);
      onClose();
      if (onOpenPayment) {
        onOpenPayment();
      } else {
        onOrderSubmitted();
      }
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div 
        id="cart-drawer-panel"
        className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between border-l border-stone-200 animate-in slide-in-from-right duration-300"
      >
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-stone-900 text-base">Bàn {activeTableNumber}</h2>
                <button
                  type="button"
                  onClick={() => setIsTableModalOpen(true)}
                  className="px-2 py-0.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 text-3xs font-extrabold border border-amber-300 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <RefreshCw className="w-2.5 h-2.5" />
                  <span>Đổi Bàn</span>
                </button>
              </div>
              <p className="text-xs text-stone-500">{currentTable.zone} • {cart.length} món đang chọn</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-stone-200 text-stone-500 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 divide-y divide-stone-100">
          {cart.length === 0 ? (
            <div className="py-16 text-center text-stone-400 space-y-3">
              <div className="w-16 h-16 mx-auto rounded-full bg-stone-100 flex items-center justify-center text-stone-300">
                <ShoppingCart className="w-8 h-8" />
              </div>
              <p className="text-sm font-medium">Chưa có món nào trong giỏ</p>
              <p className="text-xs text-stone-400 max-w-xs mx-auto">
                Hãy dạo quanh thực đơn và chọn món ăn yêu thích của bạn nhé!
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Danh sách món</span>
                <button
                  onClick={clearCart}
                  className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1 font-medium cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa hết</span>
                </button>
              </div>

              {cart.map((item) => (
                <div key={item.id} className="pt-3.5 flex gap-3 items-start">
                  <img
                    src={item.image}
                    alt={item.name}
                    referrerPolicy="no-referrer"
                    className="w-16 h-16 rounded-xl object-cover border border-stone-200 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-stone-900 text-xs sm:text-sm truncate">
                        {item.name}
                      </h4>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-stone-400 hover:text-red-500 p-0.5 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Options summary */}
                    {item.selectedOptions && item.selectedOptions.length > 0 && (
                      <p className="text-2xs text-stone-500 mt-0.5 line-clamp-1">
                        {item.selectedOptions.map(o => o.choiceName).join(' • ')}
                      </p>
                    )}

                    {item.note && (
                      <p className="text-2xs text-amber-700 italic mt-0.5 line-clamp-1">
                        Ghi chú: {item.note}
                      </p>
                    )}

                    {/* Price and Quantity controls */}
                    <div className="flex items-center justify-between mt-2">
                      <span className="font-extrabold text-amber-600 text-xs sm:text-sm">
                        {formatVND(item.price * item.quantity)}
                      </span>

                      <div className="flex items-center bg-stone-100 rounded-lg p-0.5 border border-stone-200">
                        <button
                          onClick={() => updateCartItemQuantity(item.id, -1)}
                          className="w-6 h-6 flex items-center justify-center text-stone-600 hover:bg-white rounded transition-all cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-7 text-center font-bold text-xs text-stone-900">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateCartItemQuantity(item.id, 1)}
                          className="w-6 h-6 flex items-center justify-center text-stone-600 hover:bg-white rounded transition-all cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Customer information & overall note */}
              <div className="pt-4 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Tên người đặt (Tùy chọn)
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="VD: Anh Minh / Chị Lan..."
                    className="w-full text-xs px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-stone-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Ghi chú chung cho đơn hàng
                  </label>
                  <input
                    type="text"
                    value={orderNote}
                    onChange={(e) => setOrderNote(e.target.value)}
                    placeholder="VD: Lên nước uống trước, mang chén thêm..."
                    className="w-full text-xs px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-stone-50"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Drawer Footer with Calculation & Confirm Button */}
        {cart.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-stone-200 bg-stone-50/90 space-y-3">
            <div className="space-y-1.5 text-xs text-stone-600">
              <div className="flex justify-between">
                <span>Tạm tính ({cart.length} món):</span>
                <span className="font-semibold text-stone-900">{formatVND(cartTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Thuế VAT (8%) & Phí phục vụ:</span>
                <span className="text-emerald-600 font-semibold">Miễn phí</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-stone-200 text-sm font-extrabold text-stone-900">
                <span>Tổng thanh toán:</span>
                <span className="text-amber-600 text-base">{formatVND(cartTotal)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <button
                id="btn-pay-and-send-order"
                onClick={handlePayImmediately}
                disabled={isSubmitting}
                className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-98 text-white rounded-2xl font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <QrCode className="w-4 h-4" />
                    <span>Thanh Toán Ngay & Gửi Bếp ({formatVND(cartTotal)})</span>
                  </>
                )}
              </button>

              <button
                id="btn-submit-order"
                onClick={handleSendOrder}
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 bg-stone-100 hover:bg-stone-200 active:scale-98 text-stone-800 rounded-2xl font-semibold text-xs border border-stone-300 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5 text-orange-600" />
                <span>Gửi đơn xuống bếp (Thanh toán sau)</span>
              </button>
            </div>
            <p className="text-center text-3xs text-stone-400 flex items-center justify-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Bếp nhận đơn tức thì • Doanh thu & Thu chi cập nhật tự động</span>
            </p>
          </div>
        )}
      </div>

      <TableSelectModal
        isOpen={isTableModalOpen}
        onClose={() => setIsTableModalOpen(false)}
      />
    </div>
  );
};
