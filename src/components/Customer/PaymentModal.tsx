import React, { useState, useEffect } from 'react';
import { 
  X, 
  QrCode, 
  CheckCircle2, 
  ShieldCheck, 
  Copy, 
  Check, 
  Banknote, 
  CreditCard, 
  Sparkles, 
  Receipt, 
  Layers, 
  CheckSquare, 
  Square,
  Maximize2,
  ZoomIn,
  Flame,
  ChefHat
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { TableOrder } from '../../types';
import { formatVND, getVietQRUrl, formatTimeHM } from '../../utils/format';
import confetti from 'canvas-confetti';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess?: () => void;
  onOpenOrderTracker?: () => void;
  targetOrder?: TableOrder | null;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ 
  isOpen, 
  onClose, 
  onPaymentSuccess,
  onOpenOrderTracker,
  targetOrder 
}) => {
  const { 
    activeTableOrders, 
    activeTableNumber, 
    currentTable, 
    payOrder, 
    payMultipleOrders,
    submitOrder,
    cart,
    cartTotal,
    restaurantInfo 
  } = useRestaurant();

  const [paymentMethod, setPaymentMethod] = useState<'vietqr' | 'momo' | 'cash'>('vietqr');
  const [copied, setCopied] = useState(false);
  const [voucherCode, setVoucherCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [isZoomedQR, setIsZoomedQR] = useState(false);
  const [paidSummary, setPaidSummary] = useState<{
    orderNumber: string;
    amount: number;
    itemsSummary: string;
  } | null>(null);
  
  // Selected orders to pay (default to unpaid orders or targetOrder)
  const unpaidOrders = activeTableOrders.filter(o => o.paymentStatus === 'unpaid');
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);

  useEffect(() => {
    if (targetOrder) {
      setSelectedOrderIds([targetOrder.id]);
    } else if (unpaidOrders.length > 0) {
      setSelectedOrderIds(unpaidOrders.map(o => o.id));
    } else if (activeTableOrders.length > 0) {
      setSelectedOrderIds([activeTableOrders[0].id]);
    } else {
      setSelectedOrderIds([]);
    }
  }, [isOpen, targetOrder, activeTableOrders.length]);

  if (!isOpen) return null;

  const ordersToPay = activeTableOrders.filter(o => selectedOrderIds.includes(o.id));
  const ordersTotal = ordersToPay.reduce((sum, ord) => sum + ord.totalAmount, 0);
  const rawTotal = ordersToPay.length > 0 ? ordersTotal : (activeTableOrders.length === 0 ? cartTotal : 0);
  const discountAmount = Math.round(rawTotal * (discountPercent / 100));
  const finalTotal = Math.max(0, rawTotal - discountAmount);

  const transferMemo = `BAN${activeTableNumber.replace(/\s+/g, '')} THANHTOAN`;
  const vietQrUrl = getVietQRUrl(
    restaurantInfo.bankInfo.bankBin,
    restaurantInfo.bankInfo.accountNumber,
    finalTotal,
    transferMemo,
    restaurantInfo.bankInfo.accountName
  );

  const toggleSelectOrder = (orderId: string) => {
    setSelectedOrderIds(prev => {
      if (prev.includes(orderId)) {
        if (prev.length === 1) return prev; // Keep at least one selected
        return prev.filter(id => id !== orderId);
      } else {
        return [...prev, orderId];
      }
    });
  };

  const handleSelectAllOrders = () => {
    setSelectedOrderIds(activeTableOrders.map(o => o.id));
  };

  const handleApplyVoucher = () => {
    const code = voucherCode.trim().toUpperCase();
    if (code === 'GIAM10' || code === 'WELCOME') {
      setDiscountPercent(10);
    } else if (code === 'VIP20') {
      setDiscountPercent(20);
    } else {
      alert('Mã giảm giá không hợp lệ. Hãy thử: GIAM10 hoặc VIP20');
    }
  };

  const handleCopyAccount = () => {
    navigator.clipboard.writeText(restaurantInfo.bankInfo.accountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirmPaid = async () => {
    setIsProcessing(true);
    
    setTimeout(async () => {
      let orderNumForSummary = '';
      let itemsListSummary = '';

      if (ordersToPay.length > 0) {
        orderNumForSummary = ordersToPay.map(o => o.orderNumber).join(', ');
        itemsListSummary = ordersToPay.flatMap(o => o.items.map(i => `${i.name} (x${i.quantity})`)).join(', ');
        
        const batchPayments = ordersToPay.map(o => {
          const oDiscount = Math.round(o.totalAmount * (discountPercent / 100));
          const oFinal = Math.max(0, o.totalAmount - oDiscount);
          return {
            id: o.id,
            amount: oFinal,
            paymentMethod,
            order: o
          };
        });

        await payMultipleOrders(batchPayments);
      } else if (cart.length > 0) {
        itemsListSummary = cart.map(i => `${i.name} (x${i.quantity})`).join(', ');
        const newOrder = submitOrder();
        orderNumForSummary = newOrder.orderNumber;
        payOrder(newOrder.id, paymentMethod, finalTotal, newOrder);
      } else {
        // Fallback for direct table billing
        const directOrderId = `ord-direct-${Date.now()}`;
        orderNumForSummary = `#${Math.floor(100 + Math.random() * 900)}`;
        const dummyOrder: TableOrder = {
          id: directOrderId,
          orderNumber: orderNumForSummary,
          tableNumber: activeTableNumber,
          tableName: currentTable.name,
          customerName: `Khách ${currentTable.name}`,
          createdAt: Date.now(),
          status: 'cooking',
          paymentStatus: 'paid',
          totalAmount: finalTotal > 0 ? finalTotal : 100000,
          items: [],
          paymentMethod
        };
        payOrder(directOrderId, paymentMethod, finalTotal > 0 ? finalTotal : 100000, dummyOrder);
      }

      setPaidSummary({
        orderNumber: orderNumForSummary || `#${activeTableNumber}`,
        amount: finalTotal,
        itemsSummary: itemsListSummary || 'Các món ăn tại bàn'
      });

      setIsProcessing(false);
      setIsPaid(true);

      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {
        // Safe fallback
      }

      if (onPaymentSuccess) {
        onPaymentSuccess();
      }
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div 
        id="modal-payment-qr"
        className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] border border-stone-200 animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-stone-900 text-base">Thanh Toán Hóa Đơn</h2>
              <p className="text-xs text-stone-500">Bàn {activeTableNumber} • {currentTable.zone}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-stone-200 text-stone-500 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {isPaid ? (
            <div className="py-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              
              <div>
                <h3 className="font-extrabold text-stone-900 text-lg sm:text-xl">
                  Thanh Toán Thành Công!
                </h3>
                <p className="text-xs text-emerald-700 font-bold mt-1">
                  Đã ghi nhận số tiền {formatVND(paidSummary?.amount || finalTotal)}
                </p>
              </div>

              {/* Kitchen Confirmation Card */}
              <div className="p-3.5 bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl border border-orange-200 text-left space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xs font-extrabold px-2.5 py-0.5 rounded-full bg-orange-600 text-white flex items-center gap-1">
                    <Flame className="w-3 h-3 animate-bounce" />
                    <span>ĐÃ CHUYỂN TỚI BẾP (KDS)</span>
                  </span>
                  <span className="text-2xs font-bold text-stone-600">
                    Bàn {activeTableNumber}
                  </span>
                </div>
                <p className="text-xs font-bold text-stone-800">
                  ⚡ Bếp đã nhận đơn <span className="text-orange-600">{paidSummary?.orderNumber}</span> và đang chuẩn bị chế biến!
                </p>
                {paidSummary?.itemsSummary && (
                  <p className="text-2xs text-stone-600 line-clamp-2 bg-white/70 p-2 rounded-xl border border-orange-100">
                    🍲 <strong>Món:</strong> {paidSummary.itemsSummary}
                  </p>
                )}
              </div>

              <div className="pt-2 space-y-2">
                {onOpenOrderTracker && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenOrderTracker();
                    }}
                    className="w-full py-3 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl font-bold text-xs sm:text-sm shadow-md shadow-orange-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <ChefHat className="w-4 h-4" />
                    <span>👨‍🍳 Xem Tiến Độ Nấu Món Tại Bếp</span>
                  </button>
                )}

                <button
                  onClick={onClose}
                  className="w-full py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-2xl font-semibold text-xs border border-stone-300 transition-colors cursor-pointer"
                >
                  ➕ Tiếp Tục Gọi Thêm Món Vào Bàn
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Payment Method Selector */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setPaymentMethod('vietqr')}
                  className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${
                    paymentMethod === 'vietqr'
                      ? 'border-emerald-500 bg-emerald-50/80 text-emerald-900 font-bold shadow-2xs'
                      : 'border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  <CreditCard className="w-4 h-4 mx-auto mb-1 text-emerald-600" />
                  <span className="text-2xs sm:text-xs block">VietQR Banking</span>
                </button>

                <button
                  onClick={() => setPaymentMethod('momo')}
                  className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${
                    paymentMethod === 'momo'
                      ? 'border-pink-500 bg-pink-50/80 text-pink-900 font-bold shadow-2xs'
                      : 'border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  <div className="w-4 h-4 mx-auto mb-1 bg-pink-600 text-white rounded-full text-3xs flex items-center justify-center font-black">
                    M
                  </div>
                  <span className="text-2xs sm:text-xs block">Ví MoMo</span>
                </button>

                <button
                  onClick={() => setPaymentMethod('cash')}
                  className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${
                    paymentMethod === 'cash'
                      ? 'border-amber-500 bg-amber-50/80 text-amber-900 font-bold shadow-2xs'
                      : 'border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  <Banknote className="w-4 h-4 mx-auto mb-1 text-amber-600" />
                  <span className="text-2xs sm:text-xs block">Tiền mặt</span>
                </button>
              </div>

              {/* QR Code Canvas / Display */}
              {paymentMethod === 'vietqr' && (
                <div className="bg-stone-50 border border-emerald-200 rounded-3xl p-4 sm:p-5 text-center space-y-3.5 shadow-xs">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-2xs font-extrabold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                      <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                      Mã VietQR Chuyển Khoản Tự Động
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsZoomedQR(true)}
                      className="px-2 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg text-2xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                      <span>Phóng to mã QR</span>
                    </button>
                  </div>

                  {/* Large High-Contrast QR Code */}
                  <div 
                    onClick={() => setIsZoomedQR(true)}
                    className="inline-block bg-white p-3.5 sm:p-4 rounded-2xl shadow-md border-2 border-emerald-500/30 cursor-pointer hover:border-emerald-600 transition-all hover:scale-[1.01]"
                    title="Nhấn để phóng to toàn màn hình"
                  >
                    <img
                      src={vietQrUrl}
                      alt="VietQR Payment"
                      className="w-56 h-56 sm:w-64 sm:h-64 object-contain mx-auto rounded-lg"
                    />
                    <div className="mt-2 text-3xs font-bold text-stone-500 flex items-center justify-center gap-1">
                      <Maximize2 className="w-3 h-3 text-emerald-600" />
                      <span>Nhấn vào mã QR để phóng to toàn màn hình</span>
                    </div>
                  </div>

                  {/* Account Information Card */}
                  <div className="space-y-1.5 text-xs bg-white p-3 rounded-2xl border border-stone-200 text-left">
                    <div className="flex items-center justify-between text-stone-600">
                      <span>Ngân hàng:</span>
                      <span className="font-bold text-emerald-900">{restaurantInfo.bankInfo.bankName}</span>
                    </div>
                    <div className="flex items-center justify-between text-stone-600">
                      <span>Chủ tài khoản:</span>
                      <span className="font-bold text-stone-900">{restaurantInfo.bankInfo.accountName}</span>
                    </div>
                    <div className="flex items-center justify-between text-stone-600 pt-1 border-t border-stone-100">
                      <span>Số tài khoản:</span>
                      <div className="flex items-center gap-1.5 font-mono font-black text-sm text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                        <span>{restaurantInfo.bankInfo.accountNumber}</span>
                        <button
                          onClick={handleCopyAccount}
                          className="p-1 text-emerald-800 hover:text-emerald-950 cursor-pointer"
                          title="Sao chép số tài khoản"
                        >
                          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-stone-600 pt-1 border-t border-stone-100">
                      <span>Số tiền thanh toán:</span>
                      <span className="font-mono font-black text-base text-amber-700">{formatVND(finalTotal)}</span>
                    </div>
                    <div className="flex items-center justify-between text-stone-600">
                      <span>Nội dung chuyển khoản:</span>
                      <span className="font-mono font-bold text-xs text-stone-800 bg-stone-100 px-2 py-0.5 rounded">{transferMemo}</span>
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === 'momo' && (
                <div className="bg-pink-50/50 border border-pink-200 rounded-3xl p-4 sm:p-5 text-center space-y-3.5">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-2xs font-extrabold text-pink-900 uppercase tracking-wider">
                      Mã MoMo / VietQR
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsZoomedQR(true)}
                      className="px-2 py-1 bg-pink-100 hover:bg-pink-200 text-pink-800 rounded-lg text-2xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                      <span>Phóng to</span>
                    </button>
                  </div>

                  <div 
                    onClick={() => setIsZoomedQR(true)}
                    className="inline-block bg-white p-3.5 sm:p-4 rounded-2xl shadow-md border-2 border-pink-400/30 cursor-pointer hover:scale-[1.01] transition-all"
                  >
                    <img
                      src={vietQrUrl}
                      alt="MoMo Payment"
                      className="w-56 h-56 sm:w-64 sm:h-64 object-contain mx-auto rounded-lg"
                    />
                  </div>
                  <p className="text-xs text-pink-900 font-medium">
                    Mở ứng dụng Ví MoMo hoặc bất kỳ App Ngân hàng nào để quét mã thanh toán tự động {formatVND(finalTotal)}
                  </p>
                </div>
              )}

              {paymentMethod === 'cash' && (
                <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-5 text-center space-y-2">
                  <Banknote className="w-10 h-10 text-amber-600 mx-auto" />
                  <h4 className="font-bold text-sm text-stone-800">Thanh toán bằng tiền mặt tại bàn</h4>
                  <p className="text-xs text-stone-500">
                    Bấm xác nhận bên dưới, nhân viên thu ngân sẽ mang hóa đơn và tiền thừa đến Bàn {activeTableNumber} phục vụ quý khách.
                  </p>
                </div>
              )}

              {/* Order Batches Breakdown for Multi-Order Tables */}
              {activeTableOrders.length > 0 && (
                <div className="bg-stone-50 rounded-2xl p-3.5 border border-stone-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800">
                      <Layers className="w-4 h-4 text-orange-600" />
                      <span>Đợt gọi món tại bàn ({activeTableOrders.length} đợt)</span>
                    </div>
                    {activeTableOrders.length > 1 && (
                      <button
                        type="button"
                        onClick={handleSelectAllOrders}
                        className="text-3xs font-semibold text-emerald-600 hover:text-emerald-700 cursor-pointer"
                      >
                        Chọn tất cả đợt
                      </button>
                    )}
                  </div>

                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {activeTableOrders.map((ord, idx) => {
                      const isSelected = selectedOrderIds.includes(ord.id);
                      return (
                        <div
                          key={ord.id}
                          onClick={() => toggleSelectOrder(ord.id)}
                          className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                            isSelected
                              ? 'border-emerald-400 bg-emerald-50/50 text-emerald-950 shadow-2xs'
                              : 'border-stone-200 bg-white text-stone-500 opacity-60'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0 pr-2">
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                            ) : (
                              <Square className="w-4 h-4 text-stone-400 shrink-0" />
                            )}
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-stone-900">{ord.orderNumber}</span>
                                <span className="text-3xs text-stone-400">Đợt {idx + 1} ({formatTimeHM(ord.createdAt)})</span>
                              </div>
                              <p className="text-3xs text-stone-500 truncate">
                                {ord.items.map(i => `${i.name} (x${i.quantity})`).join(', ')}
                              </p>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="font-bold text-stone-900 block">{formatVND(ord.totalAmount)}</span>
                            <span className="text-3xs text-emerald-600">Phiếu thu riêng</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-3xs text-stone-500 italic">
                    💡 Mỗi đợt gọi món / khách đặt món sẽ được tự động ghi nhận thành 01 Phiếu thu riêng biệt trong Quản lý Thu Chi.
                  </p>
                </div>
              )}

              {/* Voucher Code Input */}
              <div className="space-y-1.5 pt-1">
                <label className="block text-2xs font-bold text-stone-600 uppercase tracking-wider">
                  Mã ưu đãi / Voucher (Thử: GIAM10 hoặc VIP20)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={voucherCode}
                    onChange={(e) => setVoucherCode(e.target.value)}
                    placeholder="Nhập mã ưu đãi..."
                    className="flex-1 text-xs px-3 py-2 rounded-xl border border-stone-300 uppercase focus:outline-none focus:ring-2 focus:ring-amber-500 bg-stone-50"
                  />
                  <button
                    onClick={handleApplyVoucher}
                    className="px-3.5 py-2 bg-stone-800 hover:bg-stone-900 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Áp dụng
                  </button>
                </div>
              </div>

              {/* Bill summary breakdown */}
              <div className="bg-stone-50 rounded-2xl p-3.5 border border-stone-200 space-y-1.5 text-xs">
                <div className="flex justify-between text-stone-600">
                  <span>Tiền món ({ordersToPay.length} đợt thanh toán):</span>
                  <span className="font-semibold text-stone-800">{formatVND(rawTotal)}</span>
                </div>
                {discountPercent > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Giảm giá khuyến mãi ({discountPercent}%):</span>
                    <span className="font-semibold">-{formatVND(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-stone-200 text-sm font-extrabold text-stone-900">
                  <span>Số tiền cần thanh toán:</span>
                  <span className="text-amber-600 text-base">{formatVND(finalTotal)}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!isPaid && (
          <div className="p-4 sm:p-5 border-t border-stone-200 bg-stone-50 space-y-2">
            <button
              id="btn-confirm-payment-done"
              onClick={handleConfirmPaid}
              disabled={isProcessing}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer text-xs sm:text-sm disabled:opacity-50"
            >
              {isProcessing ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Xác Nhận Đã Thanh Toán ({formatVND(finalTotal)})</span>
                </>
              )}
            </button>
            <p className="text-center text-3xs text-stone-400 flex items-center justify-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Hệ thống POS sẽ tự động lưu biên lai hóa đơn điện tử</span>
            </p>
          </div>
        )}
      </div>

      {/* Fullscreen Zoomed QR Lightbox Modal */}
      {isZoomedQR && (
        <div 
          className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setIsZoomedQR(false)}
        >
          <div 
            className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center space-y-4 border-2 border-emerald-500 relative animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsZoomedQR(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-2xs font-extrabold text-emerald-700 uppercase tracking-wider bg-emerald-100 px-3 py-1 rounded-full">
                MÃ QR CHUYỂN KHOẢN PHÓNG TO
              </span>
              <h3 className="text-lg font-black text-stone-900 mt-2">
                Quét Mã Thanh Toán VietQR
              </h3>
              <p className="text-xs text-stone-500">
                Bàn {activeTableNumber} • {restaurantInfo.name}
              </p>
            </div>

            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 inline-block shadow-inner">
              <img
                src={vietQrUrl}
                alt="VietQR Super Large"
                className="w-72 h-72 sm:w-80 sm:h-80 object-contain mx-auto rounded-xl"
              />
            </div>

            <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-200 text-xs space-y-1 text-emerald-950">
              <p className="font-bold text-sm text-emerald-900">{restaurantInfo.bankInfo.bankName}</p>
              <p className="font-mono font-black text-base text-emerald-800 tracking-wider">
                STK: {restaurantInfo.bankInfo.accountNumber}
              </p>
              <p className="font-medium text-xs text-stone-600">{restaurantInfo.bankInfo.accountName}</p>
              <div className="pt-1 text-base font-black text-amber-700">
                Số tiền: {formatVND(finalTotal)}
              </div>
            </div>

            <button
              onClick={() => setIsZoomedQR(false)}
              className="w-full py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-2xl font-bold text-xs transition-colors cursor-pointer"
            >
              Thu Nhỏ / Quay Lại
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
