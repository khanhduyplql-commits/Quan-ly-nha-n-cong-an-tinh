import React, { useState } from 'react';
import { X, Trash2, Plus, Minus, Send, ShoppingCart, Sparkles, RefreshCw, QrCode, PlusCircle } from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { formatVND } from '../../utils/format';
import { TableSelectModal } from './TableSelectModal';
import { CartItem } from '../../types';
import confetti from 'canvas-confetti';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderSubmitted: () => void;
  onOpenPayment?: () => void;
}

const QUICK_ADDONS = [
  {
    id: 'm13',
    name: 'Chén Cơm Trắng Dẻo Thơm Thêm',
    price: 10000,
    image: 'https://images.unsplash.com/photo-1516684732162-798a0062be99?auto=format&fit=crop&w=600&q=80',
    shortName: '🍚 Cơm thêm',
  },
  {
    id: 'm14',
    name: 'Trứng Gà Ốp La Lòng Đào Thêm',
    price: 10000,
    image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=600&q=80',
    shortName: '🍳 Trứng ốp la',
  },
  {
    id: 'm18',
    name: 'Ly Trà Đá Hoa Lài Tươi Mát Thêm',
    price: 5000,
    image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80',
    shortName: '🥤 Trà đá',
  },
  {
    id: 'm17',
    name: 'Chén Canh Rong Biển Thịt Bằm Thêm',
    price: 15000,
    image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=600&q=80',
    shortName: '🥣 Canh thêm',
  },
  {
    id: 'm19',
    name: 'Đĩa Kim Chi / Dưa Chua Ăn Kèm Thêm',
    price: 10000,
    image: 'https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?auto=format&fit=crop&w=600&q=80',
    shortName: '🥗 Kim chi thêm',
  },
];

export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose, onOrderSubmitted, onOpenPayment }) => {
  const { 
    cart, 
    addToCart,
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
    submitOrder(customerName.trim(), orderNote.trim());
    setIsSubmitting(false);

    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 }
      });
    } catch {}

    onClose();
    onOrderSubmitted();
  };

  const handlePayImmediately = () => {
    if (cart.length === 0 || isSubmitting) return;

    setIsSubmitting(true);
    submitOrder(customerName.trim(), orderNote.trim());
    setIsSubmitting(false);
    onClose();
    if (onOpenPayment) {
      onOpenPayment();
    } else {
      onOrderSubmitted();
    }
  };

  const handleQuickAddSide = (side: typeof QUICK_ADDONS[0]) => {
    const item: CartItem = {
      id: `ci-side-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      menuItemId: side.id,
      name: side.name,
      price: side.price,
      image: side.image,
      quantity: 1,
      selectedOptions: [{ groupName: 'Món ăn kèm', choiceName: 'Gọi thêm', price: 0 }],
      note: 'Món ăn kèm thêm'
    };
    addToCart(item);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div 
        id="cart-drawer-panel"
        className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between border-l border-stone-200 animate-in slide-in-from-right duration-300"
      >
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50/90">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-stone-900 text-base">Bàn {activeTableNumber}</h2>
                <button
                  type="button"
                  onClick={() => setIsTableModalOpen(true)}
                  className="px-2 py-0.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 text-3xs font-extrabold border border-amber-300 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <RefreshCw className="w-2.5 h-2.5" />
                  <span>Đổi Bàn</span>
                </button>
              </div>
              <p className="text-xs text-stone-500">{currentTable.zone} • {cart.reduce((s, i) => s + i.quantity, 0)} phần món đang chọn</p>
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
        <div className="flex-1 overflow-y-auto p-4 space-y-4 divide-y divide-stone-100">
          {cart.length === 0 ? (
            <div className="py-16 text-center text-stone-400 space-y-3">
              <div className="w-16 h-16 mx-auto rounded-full bg-stone-100 flex items-center justify-center text-stone-300">
                <ShoppingCart className="w-8 h-8" />
              </div>
              <p className="text-sm font-bold text-stone-600">Chưa có món nào trong giỏ</p>
              <p className="text-xs text-stone-400 max-w-xs mx-auto">
                Hãy chọn các món ăn và món thêm yêu thích trong thực đơn nhé!
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-bold text-stone-600 uppercase tracking-wider">
                  Món đã chọn ({cart.reduce((s, i) => s + i.quantity, 0)} món)
                </span>
                <button
                  onClick={clearCart}
                  className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa hết</span>
                </button>
              </div>

              {cart.map((item) => (
                <div key={item.id} className="pt-3 flex gap-3 items-start">
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

                    {/* Options / Side dishes summary */}
                    {item.selectedOptions && item.selectedOptions.length > 0 && (
                      <div className="mt-0.5 flex flex-wrap gap-1">
                        {item.selectedOptions.map((o, idx) => (
                          <span key={idx} className="text-3xs font-medium text-amber-900 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                            +{o.choiceName} {o.price > 0 ? `(${formatVND(o.price)})` : ''}
                          </span>
                        ))}
                      </div>
                    )}

                    {item.note && (
                      <p className="text-2xs text-stone-600 italic mt-0.5 line-clamp-1">
                        📝 {item.note}
                      </p>
                    )}

                    {/* Price and Quantity controls */}
                    <div className="flex items-center justify-between mt-2">
                      <span className="font-extrabold text-amber-600 text-xs sm:text-sm">
                        {formatVND(item.price * item.quantity)}
                      </span>

                      <div className="flex items-center bg-stone-100 rounded-xl p-0.5 border border-stone-200">
                        <button
                          onClick={() => updateCartItemQuantity(item.id, -1)}
                          className="w-6 h-6 flex items-center justify-center text-stone-600 hover:bg-white rounded-lg transition-all cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-7 text-center font-black text-xs text-stone-900">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateCartItemQuantity(item.id, 1)}
                          className="w-6 h-6 flex items-center justify-center text-stone-600 hover:bg-white rounded-lg transition-all cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Quick Add-ons Shelf: Gọi thêm món ăn kèm nhanh */}
              <div className="pt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-800 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Gợi ý gọi thêm món ăn kèm nhanh:</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {QUICK_ADDONS.map((side) => (
                    <button
                      key={side.id}
                      type="button"
                      onClick={() => handleQuickAddSide(side)}
                      className="p-2 rounded-xl bg-amber-50/70 hover:bg-amber-100/90 border border-amber-200 text-left transition-all active:scale-95 flex flex-col justify-between cursor-pointer group"
                    >
                      <span className="font-bold text-xs text-stone-800 group-hover:text-amber-700">
                        {side.shortName}
                      </span>
                      <div className="flex items-center justify-between mt-1 pt-1 border-t border-amber-200/60">
                        <span className="text-2xs font-extrabold text-amber-700">
                          +{formatVND(side.price)}
                        </span>
                        <PlusCircle className="w-3.5 h-3.5 text-amber-600 group-hover:scale-110 transition-transform" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Customer information & overall note */}
              <div className="pt-4 space-y-2.5">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Tên người đặt / Người phụ trách bàn (Tùy chọn)
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="VD: Đ/c Minh / Bàn khách VIP..."
                    className="w-full text-xs px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-stone-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Ghi chú chung cho toàn bộ đơn hàng
                  </label>
                  <input
                    type="text"
                    value={orderNote}
                    onChange={(e) => setOrderNote(e.target.value)}
                    placeholder="VD: Lên trà đá trước, chuẩn bị thêm chén đũa..."
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
                <span>Tạm tính ({cart.reduce((s, i) => s + i.quantity, 0)} phần món):</span>
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
              <span>Bếp nhận đơn tức thì • Cập nhật trực tiếp lên hệ thống</span>
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
