import React, { useState, useMemo, useRef } from 'react';
import { 
  Search, 
  Utensils, 
  Flame, 
  Soup, 
  ChefHat, 
  Salad, 
  Coffee, 
  IceCream,
  Plus, 
  Minus, 
  Trash2, 
  DollarSign, 
  CreditCard, 
  QrCode, 
  Printer, 
  CheckCircle2, 
  Sparkles, 
  Clock, 
  Tag, 
  Users, 
  Building2, 
  Receipt, 
  ArrowRight,
  Send,
  RotateCcw,
  Percent,
  Calculator,
  Eye,
  FileText,
  TrendingUp,
  X,
  Check,
  Volume2,
  Maximize2,
  ZoomIn,
  Copy
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { MenuItem, MealCategory, CartItem, RestaurantTable, TableOrder, CashTransaction } from '../../types';
import { formatVND, formatTimeHM, getLocalDateString } from '../../utils/format';
import { ReceiptDetailModal } from '../Cashflow/ReceiptDetailModal';

export const CounterPOS: React.FC = () => {
  const { 
    menuItems, 
    tables, 
    orders, 
    transactions,
    restaurantInfo,
    payOrder,
    submitOrder,
    submitDirectOrder,
    playNotificationSound,
    addTransaction
  } = useRestaurant();

  // Selected destination (Table or Counter/Takeaway)
  const [selectedTableNumber, setSelectedTableNumber] = useState<string>('counter'); // 'counter' or table number
  const [customerName, setCustomerName] = useState<string>('');
  const [orderNote, setOrderNote] = useState<string>('');
  const [cashierName, setCashierName] = useState<string>('Thu ngân Nhà ăn');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<MealCategory>('all');
  const [onlyAvailable, setOnlyAvailable] = useState<boolean>(true);

  // Cart / Order at Counter
  const [posCart, setPosCart] = useState<CartItem[]>([]);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [discountVND, setDiscountVND] = useState<number>(0);
  const [discountMode, setDiscountMode] = useState<'none' | 'percent' | 'fixed'>('none');

  // Payment Setup
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'vietqr' | 'card' | 'momo'>('cash');
  const [cashGiven, setCashGiven] = useState<number>(0);
  const [showLargeQRModal, setShowLargeQRModal] = useState<boolean>(false);
  const [copiedSTK, setCopiedSTK] = useState<boolean>(false);

  // Modals & Feedback
  const [selectedDishForOptions, setSelectedDishForOptions] = useState<MenuItem | null>(null);
  const [dishOptionsNote, setDishOptionsNote] = useState<string>('');
  const [selectedOptionsState, setSelectedOptionsState] = useState<{ [groupId: string]: { choiceId: string; choiceName: string; price: number } }>({});
  
  const [completedTransaction, setCompletedTransaction] = useState<CashTransaction | null>(null);
  const [completedOrder, setCompletedOrder] = useState<TableOrder | null>(null);
  const [showCompletedReceiptModal, setShowCompletedReceiptModal] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(curr => (curr === msg ? null : curr));
    }, 2800);
  };

  const categories = [
    { id: 'all' as MealCategory, label: 'Tất cả món', icon: Utensils },
    { id: 'sides_addons' as MealCategory, label: '🍚 Món Thêm & Ăn Kèm', icon: Sparkles },
    { id: 'rice_noodles' as MealCategory, label: 'Cơm & Phở Mì', icon: Soup },
    { id: 'main' as MealCategory, label: 'Món Chính', icon: ChefHat },
    { id: 'hotpot_grill' as MealCategory, label: 'Lẩu & Nướng', icon: Flame },
    { id: 'appetizer' as MealCategory, label: 'Khai Vị', icon: Salad },
    { id: 'drinks' as MealCategory, label: 'Đồ Uống', icon: Coffee },
    { id: 'dessert' as MealCategory, label: 'Tráng Miệng', icon: IceCream },
  ];

  // Filter menu items
  const filteredMenuItems = useMemo(() => {
    return menuItems.filter(item => {
      if (onlyAvailable && !item.isAvailable) return false;
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = item.name.toLowerCase().includes(q);
        const matchDesc = item.description.toLowerCase().includes(q);
        const matchTags = item.tags.some(t => t.toLowerCase().includes(q));
        if (!matchName && !matchDesc && !matchTags) return false;
      }
      return true;
    });
  }, [menuItems, selectedCategory, searchQuery, onlyAvailable]);

  // Handle adding dish to POS cart
  const handleAddDish = (dish: MenuItem) => {
    if (!dish.isAvailable) {
      showToast(`Món "${dish.name}" hiện đang tạm hết!`);
      return;
    }

    // If dish has customizable option groups, open modal for choice
    if (dish.optionGroups && dish.optionGroups.length > 0) {
      setSelectedDishForOptions(dish);
      setDishOptionsNote('');
      // set defaults
      const defaults: { [groupId: string]: { choiceId: string; choiceName: string; price: number } } = {};
      dish.optionGroups.forEach(og => {
        if (og.choices.length > 0) {
          defaults[og.id] = {
            choiceId: og.choices[0].id,
            choiceName: og.choices[0].name,
            price: og.choices[0].price
          };
        }
      });
      setSelectedOptionsState(defaults);
      return;
    }

    // Simple add
    addItemToCart({
      id: `ci-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      menuItemId: dish.id,
      name: dish.name,
      price: dish.price,
      image: dish.image,
      quantity: 1,
      selectedOptions: [],
      note: ''
    });
    playNotificationSound('success');
  };

  const handleConfirmCustomDish = () => {
    if (!selectedDishForOptions) return;
    const selectedOptionsList = Object.entries(selectedOptionsState).map(([groupId, opt]) => {
      const optionData = opt as { choiceId: string; choiceName: string; price: number };
      const g = selectedDishForOptions.optionGroups?.find(x => x.id === groupId);
      return {
        groupName: g?.name || '',
        choiceName: optionData.choiceName,
        price: optionData.price
      };
    });

    const extraPrice = selectedOptionsList.reduce((s, o) => s + o.price, 0);

    addItemToCart({
      id: `ci-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      menuItemId: selectedDishForOptions.id,
      name: selectedDishForOptions.name,
      price: selectedDishForOptions.price + extraPrice,
      image: selectedDishForOptions.image,
      quantity: 1,
      selectedOptions: selectedOptionsList,
      note: dishOptionsNote
    });

    setSelectedDishForOptions(null);
    playNotificationSound('success');
  };

  const addItemToCart = (item: CartItem) => {
    setPosCart(prev => {
      const idx = prev.findIndex(p => 
        p.menuItemId === item.menuItemId && 
        JSON.stringify(p.selectedOptions) === JSON.stringify(item.selectedOptions) &&
        p.note === item.note
      );
      if (idx > -1) {
        const next = [...prev];
        next[idx].quantity += item.quantity;
        return next;
      }
      return [...prev, item];
    });
  };

  const updateQuantity = (cartItemId: string, delta: number) => {
    setPosCart(prev => {
      return prev.map(item => {
        if (item.id === cartItemId) {
          const nextQty = item.quantity + delta;
          return nextQty > 0 ? { ...item, quantity: nextQty } : null;
        }
        return item;
      }).filter(Boolean) as CartItem[];
    });
  };

  const removeItem = (cartItemId: string) => {
    setPosCart(prev => prev.filter(i => i.id !== cartItemId));
  };

  const clearPosCart = () => {
    setPosCart([]);
    setDiscountMode('none');
    setDiscountPercent(0);
    setDiscountVND(0);
    setCashGiven(0);
    setOrderNote('');
  };

  // Calculations
  const rawSubtotal = posCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalItemCount = posCart.reduce((sum, item) => sum + item.quantity, 0);

  const discountAmount = useMemo(() => {
    if (discountMode === 'percent') {
      return Math.round((rawSubtotal * discountPercent) / 100);
    } else if (discountMode === 'fixed') {
      return Math.min(discountVND, rawSubtotal);
    }
    return 0;
  }, [rawSubtotal, discountMode, discountPercent, discountVND]);

  const finalTotal = Math.max(0, rawSubtotal - discountAmount);

  const changeDue = Math.max(0, cashGiven - finalTotal);

  // Shift and Today statistics
  const todayStr = getLocalDateString(new Date());
  const todayIncomeTransactions = useMemo(() => {
    return transactions.filter(t => t.type === 'income' && t.dateString === todayStr);
  }, [transactions, todayStr]);

  const todayRevenue = useMemo(() => {
    return todayIncomeTransactions.reduce((s, t) => s + t.amount, 0);
  }, [todayIncomeTransactions]);

  const pendingCookingCount = useMemo(() => {
    return orders.filter(o => o.status === 'pending' || o.status === 'cooking').length;
  }, [orders]);

  // ==========================================
  // ACTION: THU TIỀN & ĐẨY PHIẾU THU NGAY TẠI QUẦY
  // ==========================================
  const handleCollectAndPushReceipt = async () => {
    if (posCart.length === 0) {
      showToast('Vui lòng chọn món ăn trước khi thu tiền!');
      return;
    }

    const orderNum = `#${Math.floor(100 + Math.random() * 900)}`;
    const isTakeaway = selectedTableNumber === 'counter';
    const currentTableName = isTakeaway 
      ? 'Quầy Thu Ngân (Mang về / Vãng lai)' 
      : (tables.find(t => t.number === selectedTableNumber)?.name || `Bàn ${selectedTableNumber}`);

    const customerDisplayName = customerName.trim() || (isTakeaway ? 'Khách mua tại quầy' : `Khách ${currentTableName}`);
    const itemsSummary = posCart.map(i => `${i.name} x${i.quantity}`).join(', ');

    // 1. Create order object marked as PAID
    const newOrderId = `ord-${Date.now()}`;
    const newOrder: TableOrder = {
      id: newOrderId,
      orderNumber: orderNum,
      tableNumber: selectedTableNumber,
      tableName: currentTableName,
      customerName: customerDisplayName,
      createdAt: Date.now(),
      status: 'cooking', // Dispatched straight to kitchen
      paymentStatus: 'paid',
      paymentMethod,
      totalAmount: finalTotal,
      note: orderNote,
      items: posCart.map(c => ({
        id: `oi-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        menuItemId: c.menuItemId,
        name: c.name,
        price: c.price,
        quantity: c.quantity,
        selectedOptions: c.selectedOptions,
        note: c.note,
        status: 'cooking'
      }))
    };

    // 2. Immediately dispatch to Kitchen screen (KDS) & Realtime sync
    submitDirectOrder(newOrder);

    // 3. Generate Receipt / Cash Transaction (PHIẾU THU DOANH THU BÁN HÀNG)
    const newReceipt = await addTransaction({
      type: 'income',
      category: 'sales',
      categoryName: 'Doanh thu bán hàng',
      amount: finalTotal,
      title: `Thu tiền tại quầy - ${currentTableName} (${orderNum})`,
      description: `Thanh toán: ${paymentMethod.toUpperCase()}${discountAmount > 0 ? ` (Đã giảm: ${formatVND(discountAmount)})` : ''}. Món: ${itemsSummary}${orderNote ? ` | Ghi chú: ${orderNote}` : ''}`,
      paymentMethod,
      recordedBy: cashierName || 'Thu ngân tại quầy',
      payerOrRecipient: customerDisplayName,
      orderId: newOrderId,
      tableNumber: isTakeaway ? undefined : selectedTableNumber
    });

    // 4. Mark paid in payment ledger
    payOrder(newOrderId, paymentMethod, finalTotal, newOrder);

    // 5. Feedback & Open Printable Receipt Modal
    setCompletedOrder(newOrder);
    setCompletedTransaction(newReceipt);
    setShowCompletedReceiptModal(true);
    playNotificationSound('success');
    showToast(`Đã thu ${formatVND(finalTotal)}, chuyển món xuống Bếp và xuất Phiếu Thu ${newReceipt.receiptNumber}!`);

    // 6. Clear cart for next sale
    clearPosCart();
  };

  // ==========================================
  // ACTION: GỬI BẾP CHƯA THU (LƯU VÀO BÀN ĂN / QUẦY MANG VỀ)
  // ==========================================
  const handleSendKitchenUnpaid = () => {
    if (posCart.length === 0) {
      showToast('Vui lòng chọn món ăn trước khi báo Bếp!');
      return;
    }

    const orderNum = `#${Math.floor(100 + Math.random() * 900)}`;
    const isTakeaway = selectedTableNumber === 'counter';
    const currentTableName = isTakeaway 
      ? 'Quầy Thu Ngân (Mang về / Vãng lai)' 
      : (tables.find(t => t.number === selectedTableNumber)?.name || `Bàn ${selectedTableNumber}`);
    const customerDisplayName = customerName.trim() || (isTakeaway ? 'Khách mua tại quầy' : `Khách ${currentTableName}`);

    const newOrderId = `ord-${Date.now()}`;
    const newOrder: TableOrder = {
      id: newOrderId,
      orderNumber: orderNum,
      tableNumber: selectedTableNumber,
      tableName: currentTableName,
      customerName: customerDisplayName,
      createdAt: Date.now(),
      status: 'pending',
      paymentStatus: 'unpaid',
      totalAmount: finalTotal,
      note: orderNote,
      items: posCart.map(c => ({
        id: `oi-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        menuItemId: c.menuItemId,
        name: c.name,
        price: c.price,
        quantity: c.quantity,
        selectedOptions: c.selectedOptions,
        note: c.note,
        status: 'pending'
      }))
    };

    // Save to context, broadcast to Kitchen KDS, and save to server
    submitDirectOrder(newOrder);
    playNotificationSound('order');

    showToast(`👨‍🍳 Đã chuyển đơn ${orderNum} (${posCart.length} món) xuống Bếp thành công cho ${currentTableName}!`);
    clearPosCart();
  };

  // Keyboard shortcut: F2 or Ctrl+Enter to send to kitchen
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2' || (e.ctrlKey && e.key === 'Enter')) {
        if (posCart.length > 0) {
          e.preventDefault();
          handleSendKitchenUnpaid();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [posCart, selectedTableNumber, customerName, orderNote, finalTotal]);

  // VietQR Dynamic Link for Counter QR display
  const vietQrUrl = useMemo(() => {
    if (paymentMethod !== 'vietqr' || finalTotal <= 0) return '';
    const bankBin = restaurantInfo.bankInfo.bankBin || '970415'; // VietinBank BIN
    const accNum = restaurantInfo.bankInfo.accountNumber || '102873561674';
    const accName = encodeURIComponent(restaurantInfo.bankInfo.accountName || 'HUYNH THI DIEM');
    const memo = encodeURIComponent(`THANH TOAN BAN ${selectedTableNumber === 'counter' ? 'QUAY' : selectedTableNumber} ${finalTotal}D`);
    return `https://img.vietqr.io/image/${bankBin}-${accNum}-compact2.png?amount=${finalTotal}&addInfo=${memo}&accountName=${accName}`;
  }, [paymentMethod, finalTotal, selectedTableNumber, restaurantInfo]);

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col lg:flex-row gap-4 pb-20 pt-2">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ========================================================= */}
      {/* LEFT SECTION: MENU SELECTION & CATEGORIES (60% width)     */}
      {/* ========================================================= */}
      <div className="flex-1 flex flex-col bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
        {/* Top Header: Shift Stats & Search Bar */}
        <div className="p-4 sm:p-5 border-b border-stone-200 bg-stone-50/70 space-y-3.5">
          {/* Top Row: Title + Today's Shift Metrics */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                  <Calculator className="w-4 h-4" />
                </span>
                <h2 className="font-black text-stone-900 text-base sm:text-lg">
                  Quầy Bán Hàng & Thu Ngân (POS)
                </h2>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                Chọn món, thu tiền trực tiếp tại quầy và đẩy tự động vào Sổ Quỹ Phiếu Thu
              </p>
            </div>

            {/* Quick shift indicators */}
            <div className="flex items-center gap-2 text-2xs">
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 shadow-2xs">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                <span>Hôm nay: {formatVND(todayRevenue)}</span>
              </div>
              <div className="bg-amber-50 border border-amber-200 text-amber-900 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 shadow-2xs">
                <FileText className="w-3.5 h-3.5 text-amber-600" />
                <span>{todayIncomeTransactions.length} Phiếu thu</span>
              </div>
              {pendingCookingCount > 0 && (
                <div className="bg-orange-50 border border-orange-200 text-orange-900 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 shadow-2xs animate-pulse">
                  <ChefHat className="w-3.5 h-3.5 text-orange-600" />
                  <span>{pendingCookingCount} Bếp đang nấu</span>
                </div>
              )}
            </div>
          </div>

          {/* Search Bar & Stock filter */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm nhanh tên món ăn, mã món, đồ uống... (Gõ để lọc)"
                className="w-full pl-10 pr-9 py-2.5 bg-white border border-stone-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 shadow-2xs transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              onClick={() => setOnlyAvailable(!onlyAvailable)}
              className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                onlyAvailable
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-stone-100 text-stone-600 border-stone-300'
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              <span>Chỉ món còn hàng</span>
            </button>
          </div>

          {/* Category Chips Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
            {categories.map(cat => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;
              const count = menuItems.filter(m => cat.id === 'all' || m.category === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cat.label}</span>
                  <span className={`text-3xs px-1.5 py-0.2 rounded-full font-black ${
                    isSelected ? 'bg-amber-700 text-white' : 'bg-stone-100 text-stone-500'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Menu Grid */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto max-h-[600px] lg:max-h-[calc(100vh-280px)]">
          {filteredMenuItems.length === 0 ? (
            <div className="py-16 text-center text-stone-400">
              <Utensils className="w-10 h-10 mx-auto text-stone-300 mb-2" />
              <p className="font-bold text-sm">Không tìm thấy món ăn phù hợp</p>
              <p className="text-xs mt-1">Vui lòng thử từ khóa khác hoặc đổi danh mục</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredMenuItems.map(dish => {
                const inCart = posCart.find(i => i.menuItemId === dish.id);
                return (
                  <div
                    key={dish.id}
                    onClick={() => handleAddDish(dish)}
                    className={`group bg-white rounded-2xl border p-3 flex flex-col justify-between transition-all cursor-pointer shadow-2xs hover:shadow-md hover:border-amber-400 relative overflow-hidden select-none active:scale-[0.98] ${
                      !dish.isAvailable 
                        ? 'opacity-60 grayscale bg-stone-50 border-stone-200' 
                        : inCart 
                        ? 'border-amber-400 ring-2 ring-amber-300/40 bg-amber-50/20' 
                        : 'border-stone-200'
                    }`}
                  >
                    {/* In-cart badge indicator */}
                    {inCart && (
                      <div className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-black flex items-center justify-center shadow-xs">
                        {inCart.quantity}
                      </div>
                    )}

                    {/* Dish Image */}
                    <div className="relative aspect-4/3 rounded-xl overflow-hidden mb-2.5 bg-stone-100">
                      <img
                        src={dish.image}
                        alt={dish.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      {dish.isPopular && (
                        <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 bg-rose-500 text-white text-3xs font-extrabold rounded-md shadow-2xs uppercase">
                          Best Seller
                        </span>
                      )}
                      {!dish.isAvailable && (
                        <div className="absolute inset-0 bg-black/50 text-white font-extrabold text-xs flex items-center justify-center uppercase tracking-wider">
                          Tạm hết
                        </div>
                      )}
                    </div>

                    {/* Dish Name & Price */}
                    <div>
                      <h4 className="font-extrabold text-stone-900 text-xs sm:text-sm line-clamp-2 group-hover:text-amber-700 transition-colors leading-snug">
                        {dish.name}
                      </h4>
                      <p className="text-3xs text-stone-500 line-clamp-1 mt-0.5">
                        {dish.description}
                      </p>
                    </div>

                    {/* Price and Add button */}
                    <div className="mt-3 pt-2 border-t border-stone-100 flex items-center justify-between">
                      <span className="font-black text-amber-600 text-xs sm:text-sm">
                        {formatVND(dish.price)}
                      </span>
                      <button
                        type="button"
                        className="w-7 h-7 rounded-lg bg-amber-50 group-hover:bg-amber-500 text-amber-700 group-hover:text-white flex items-center justify-center transition-colors shadow-2xs cursor-pointer font-black"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* RIGHT SECTION: CASHIER ORDER DESK & CHECKOUT (40% width) */}
      {/* ========================================================= */}
      <div className="w-full lg:w-[460px] xl:w-[500px] flex flex-col bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        {/* Order Destination Selector */}
        <div className="p-4 sm:p-5 border-b border-stone-200 bg-stone-50/90 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-black text-xs uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
              <Receipt className="w-4 h-4 text-amber-600" />
              <span>Hóa Đơn Thu Ngân Tại Quầy</span>
            </span>

            {posCart.length > 0 && (
              <button
                onClick={clearPosCart}
                className="text-2xs font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1 hover:underline cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Xóa làm lại</span>
              </button>
            )}
          </div>

          {/* Table / Takeaway Selector */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setSelectedTableNumber('counter')}
              className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                selectedTableNumber === 'counter'
                  ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                  : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Tại Quầy / Mang Về</span>
            </button>

            <div className="relative">
              <select
                value={selectedTableNumber === 'counter' ? '' : selectedTableNumber}
                onChange={(e) => {
                  if (e.target.value) {
                    setSelectedTableNumber(e.target.value);
                  }
                }}
                className={`w-full py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                  selectedTableNumber !== 'counter'
                    ? 'border-amber-500 text-amber-900 bg-amber-50/40 ring-1 ring-amber-400'
                    : 'border-stone-300 text-stone-700'
                }`}
              >
                <option value="">-- Chọn Bàn Ăn --</option>
                {tables.map(t => (
                  <option key={t.id} value={t.number}>
                    {t.name} ({t.zone}) - {t.status === 'empty' ? 'Trống' : 'Đang dùng'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Customer Name & Staff */}
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Tên khách / Cán bộ..."
              className="py-1.5 px-3 bg-white border border-stone-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs"
            />
            <input
              type="text"
              value={cashierName}
              onChange={(e) => setCashierName(e.target.value)}
              placeholder="Thu ngân ghi nhận..."
              className="py-1.5 px-3 bg-white border border-stone-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs"
            />
          </div>
        </div>

        {/* Top Prompt Banner when items are in cart */}
        {posCart.length > 0 && (
          <div className="mx-3 mt-3 p-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md flex items-center justify-between gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-2 min-w-0">
              <ChefHat className="w-5 h-5 text-amber-100 shrink-0 animate-bounce" />
              <div className="min-w-0 text-left">
                <div className="font-black text-xs leading-tight">
                  Đang có {totalItemCount} món chờ chuyển Bếp
                </div>
                <div className="text-3xs text-amber-100 truncate">
                  {selectedTableNumber === 'counter' ? '📍 Quầy / Mang về' : `📍 Bàn ${selectedTableNumber}`} • Phím tắt: F2
                </div>
              </div>
            </div>

            <button
              id="btn-pos-quick-send-kitchen-top"
              type="button"
              onClick={handleSendKitchenUnpaid}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-amber-50 text-amber-900 text-xs font-black shadow-xs transition-all active:scale-95 cursor-pointer whitespace-nowrap flex items-center gap-1.5 shrink-0"
            >
              <Send className="w-3.5 h-3.5 text-amber-600" />
              <span>BÁO BẾP NGAY</span>
            </button>
          </div>
        )}

        {/* Cart Items List */}
        <div className="flex-1 p-4 overflow-y-auto max-h-[300px] lg:max-h-[260px] space-y-2.5 divide-y divide-stone-100">
          {posCart.length === 0 ? (
            <div className="py-10 text-center text-stone-400 text-xs">
              <Receipt className="w-8 h-8 mx-auto text-stone-300 mb-1.5" />
              <p className="font-bold text-stone-600">Chưa có món ăn trong đơn</p>
              <p className="text-2xs text-stone-400 mt-0.5">Nhấp chọn món từ thực đơn bên trái để thêm vào đơn</p>
            </div>
          ) : (
            posCart.map(item => (
              <div key={item.id} className="pt-2 first:pt-0 flex items-center justify-between gap-2 text-xs">
                <div className="flex-1 min-w-0">
                  <h5 className="font-extrabold text-stone-900 truncate">
                    {item.name}
                  </h5>
                  {item.selectedOptions.length > 0 && (
                    <p className="text-3xs text-stone-500 truncate">
                      {item.selectedOptions.map(o => o.choiceName).join(', ')}
                    </p>
                  )}
                  {item.note && (
                    <p className="text-3xs text-amber-700 italic">
                      Ghi chú: {item.note}
                    </p>
                  )}
                  <span className="font-bold text-stone-600 text-2xs">
                    {formatVND(item.price)}
                  </span>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-1.5 bg-stone-100 rounded-xl p-1 border border-stone-200">
                  <button
                    onClick={() => updateQuantity(item.id, -1)}
                    className="w-6 h-6 rounded-lg bg-white hover:bg-stone-200 text-stone-700 flex items-center justify-center font-bold shadow-2xs cursor-pointer"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-6 text-center font-black text-xs text-stone-900">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.id, 1)}
                    className="w-6 h-6 rounded-lg bg-white hover:bg-stone-200 text-stone-700 flex items-center justify-center font-bold shadow-2xs cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {/* Line Total */}
                <div className="text-right min-w-[70px]">
                  <span className="font-extrabold text-stone-900 text-xs block">
                    {formatVND(item.price * item.quantity)}
                  </span>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-3xs text-rose-500 hover:text-rose-700 font-bold cursor-pointer"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Calculation Summary Box */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 space-y-3">
          {/* Note Input */}
          <input
            type="text"
            value={orderNote}
            onChange={(e) => setOrderNote(e.target.value)}
            placeholder="Ghi chú đơn hàng (ít cay, đóng hộp mang về...)"
            className="w-full py-1.5 px-3 bg-white border border-stone-200 rounded-xl text-2xs font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500"
          />

          {/* Subtotal & Discount rows */}
          <div className="space-y-1.5 text-xs text-stone-600">
            <div className="flex justify-between">
              <span>Tạm tính ({totalItemCount} món):</span>
              <span className="font-bold text-stone-900">{formatVND(rawSubtotal)}</span>
            </div>

            {/* Quick Discount Controls */}
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-stone-200/60">
              <span className="text-2xs font-bold text-stone-500">Giảm giá / Chiết khấu:</span>
              <div className="flex items-center gap-1 text-2xs">
                <button
                  onClick={() => {
                    setDiscountMode(discountMode === 'percent' ? 'none' : 'percent');
                    if (discountMode !== 'percent') setDiscountPercent(10);
                  }}
                  className={`px-2 py-0.5 rounded-md font-bold border transition-colors cursor-pointer ${
                    discountMode === 'percent'
                      ? 'bg-amber-500 text-white border-amber-500'
                      : 'bg-white text-stone-600 border-stone-300'
                  }`}
                >
                  -10%
                </button>
                <button
                  onClick={() => {
                    setDiscountMode(discountMode === 'percent' && discountPercent === 20 ? 'none' : 'percent');
                    setDiscountPercent(20);
                  }}
                  className={`px-2 py-0.5 rounded-md font-bold border transition-colors cursor-pointer ${
                    discountMode === 'percent' && discountPercent === 20
                      ? 'bg-amber-500 text-white border-amber-500'
                      : 'bg-white text-stone-600 border-stone-300'
                  }`}
                >
                  -20%
                </button>
              </div>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-700 font-bold text-2xs">
                <span>Tiền giảm:</span>
                <span>-{formatVND(discountAmount)}</span>
              </div>
            )}

            {/* Total Amount to Pay */}
            <div className="flex justify-between items-baseline pt-2 border-t border-stone-300 text-stone-900">
              <span className="font-black text-sm uppercase tracking-tight">Tổng Thanh Toán:</span>
              <span className="font-black text-xl text-amber-600">
                {formatVND(finalTotal)}
              </span>
            </div>
          </div>

          {/* Payment Method Selector Tabs */}
          <div className="space-y-2 pt-1">
            <span className="text-3xs font-extrabold uppercase tracking-wider text-stone-500 block">
              Hình thức thu tiền:
            </span>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { id: 'cash' as const, label: 'Tiền mặt', icon: DollarSign },
                { id: 'vietqr' as const, label: 'VietQR', icon: QrCode },
                { id: 'card' as const, label: 'Thẻ POS', icon: CreditCard },
                { id: 'momo' as const, label: 'MoMo', icon: DollarSign },
              ].map(pm => {
                const Icon = pm.icon;
                const active = paymentMethod === pm.id;
                return (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => {
                      setPaymentMethod(pm.id);
                      if (pm.id === 'cash') setCashGiven(finalTotal);
                    }}
                    className={`py-2 px-1 rounded-xl text-2xs font-extrabold border transition-all cursor-pointer flex flex-col items-center gap-1 ${
                      active
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs font-black'
                        : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{pm.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Cash specific shortcut buttons & change calculation */}
            {paymentMethod === 'cash' && finalTotal > 0 && (
              <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-2 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-2xs font-bold text-emerald-900">Khách đưa:</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={cashGiven || ''}
                      onChange={(e) => setCashGiven(Number(e.target.value))}
                      placeholder={String(finalTotal)}
                      className="w-28 py-1 px-2 text-right font-black text-xs bg-white border border-emerald-300 rounded-lg text-emerald-950 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    <span className="text-2xs text-stone-500 font-bold">đ</span>
                  </div>
                </div>

                {/* Quick denomination chips */}
                <div className="flex flex-wrap gap-1">
                  <button
                    type="button"
                    onClick={() => setCashGiven(finalTotal)}
                    className="px-2 py-0.5 rounded bg-white text-emerald-800 border border-emerald-200 text-3xs font-bold hover:bg-emerald-100 cursor-pointer"
                  >
                    Đủ {formatVND(finalTotal)}
                  </button>
                  {[100000, 200000, 500000, 1000000].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setCashGiven(val)}
                      className="px-2 py-0.5 rounded bg-white text-emerald-800 border border-emerald-200 text-3xs font-bold hover:bg-emerald-100 cursor-pointer"
                    >
                      {val >= 1000000 ? `${val / 1000000}Tr` : `${val / 1000}k`}
                    </button>
                  ))}
                </div>

                {cashGiven >= finalTotal ? (
                  <div className="flex justify-between items-center text-emerald-900 font-bold text-2xs pt-1 border-t border-emerald-200">
                    <span>Tiền thối lại khách:</span>
                    <span className="font-black text-sm text-emerald-700">
                      {formatVND(changeDue)}
                    </span>
                  </div>
                ) : (
                  <div className="text-rose-600 font-bold text-3xs pt-1">
                    Khách còn thiếu: {formatVND(finalTotal - cashGiven)}
                  </div>
                )}
              </div>
            )}

            {/* VietQR live code preview at counter */}
            {paymentMethod === 'vietqr' && finalTotal > 0 && (
              <div className="p-3.5 bg-stone-900 text-white rounded-3xl space-y-3 border border-stone-800 shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <QrCode className="w-4 h-4 text-emerald-400" />
                    <span className="font-extrabold text-white text-xs">VietQR Tự Động</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowLargeQRModal(true)}
                    className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-2xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                    title="Mở màn hình lớn cho khách quét"
                  >
                    <Maximize2 className="w-3 h-3" />
                    <span>Phóng to cho khách</span>
                  </button>
                </div>

                {/* Big QR Preview */}
                <div 
                  onClick={() => setShowLargeQRModal(true)}
                  className="bg-white p-2.5 rounded-2xl cursor-pointer hover:ring-2 hover:ring-emerald-400 transition-all text-center shadow-inner"
                  title="Nhấn để phóng to toàn màn hình"
                >
                  <img
                    src={vietQrUrl}
                    alt="VietQR Thu Ngân"
                    className="w-44 h-44 sm:w-48 sm:h-48 object-contain mx-auto rounded-lg"
                  />
                  <span className="text-3xs font-bold text-stone-500 block mt-1">
                    🔍 Chạm để mở màn hình quét siêu lớn
                  </span>
                </div>

                <div className="space-y-1 text-2xs bg-stone-850 p-2.5 rounded-xl border border-stone-750">
                  <div className="flex items-center justify-between">
                    <span className="text-stone-400">Số tiền:</span>
                    <span className="font-black text-amber-400 text-sm">{formatVND(finalTotal)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-stone-400">Ngân hàng:</span>
                    <span className="font-bold text-stone-200">{restaurantInfo.bankInfo.bankName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-stone-400">STK:</span>
                    <span className="font-mono font-bold text-emerald-400 text-xs">{restaurantInfo.bankInfo.accountNumber}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-stone-400">Chủ TK:</span>
                    <span className="font-medium text-stone-300 text-3xs">{restaurantInfo.bankInfo.accountName}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons: Dual Big Buttons (THU TIỀN + BÁO BẾP NGAY) */}
          <div className="pt-2 space-y-2">
            <button
              id="btn-pos-collect-push-receipt"
              type="button"
              onClick={handleCollectAndPushReceipt}
              disabled={posCart.length === 0}
              className={`w-full py-3.5 px-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-98 cursor-pointer ${
                posCart.length > 0
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-emerald-600/30'
                  : 'bg-stone-300 text-stone-500 cursor-not-allowed'
              }`}
            >
              <DollarSign className="w-5 h-5" />
              <span>THU TIỀN & XUẤT PHIẾU THU ({formatVND(finalTotal)})</span>
            </button>

            <button
              id="btn-pos-send-kitchen"
              type="button"
              onClick={handleSendKitchenUnpaid}
              disabled={posCart.length === 0}
              className={`w-full py-3 px-4 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 border transition-all active:scale-98 cursor-pointer ${
                posCart.length > 0
                  ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-500/20'
                  : 'bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>⚡ BÁO BẾP NGAY • CHUYỂN BẾP CHẾ BIẾN (F2)</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODAL: CUSTOM OPTIONS PICKER FOR DISHES WITH GROUPS       */}
      {/* ========================================================= */}
      {selectedDishForOptions && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl border border-stone-200 flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <div>
                <h3 className="font-extrabold text-stone-900 text-sm sm:text-base">
                  Tùy Chọn Món: {selectedDishForOptions.name}
                </h3>
                <span className="text-xs font-bold text-amber-600">{formatVND(selectedDishForOptions.price)}</span>
              </div>
              <button
                onClick={() => setSelectedDishForOptions(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-4 flex-1">
              {selectedDishForOptions.optionGroups?.map(group => (
                <div key={group.id} className="space-y-2">
                  <label className="text-2xs font-extrabold uppercase tracking-wider text-stone-500 block">
                    {group.name} {group.required && <span className="text-red-500">*</span>}
                  </label>
                  <div className="grid grid-cols-1 gap-1.5">
                    {group.choices.map(choice => {
                      const isSelected = selectedOptionsState[group.id]?.choiceId === choice.id;
                      return (
                        <button
                          key={choice.id}
                          type="button"
                          onClick={() => {
                            setSelectedOptionsState(prev => ({
                              ...prev,
                              [group.id]: {
                                choiceId: choice.id,
                                choiceName: choice.name,
                                price: choice.price
                              }
                            }));
                          }}
                          className={`p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-amber-50 border-amber-500 text-amber-950 font-bold ring-1 ring-amber-400'
                              : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                          }`}
                        >
                          <span>{choice.name}</span>
                          {choice.price > 0 && (
                            <span className="text-amber-600 font-bold">+{formatVND(choice.price)}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              <div>
                <label className="text-2xs font-extrabold uppercase tracking-wider text-stone-500 block mb-1">
                  Ghi chú riêng cho đầu bếp:
                </label>
                <input
                  type="text"
                  value={dishOptionsNote}
                  onChange={(e) => setDishOptionsNote(e.target.value)}
                  placeholder="Ví dụ: không hành tây, cay vừa, thêm nước tương..."
                  className="w-full py-2 px-3 bg-stone-50 border border-stone-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="p-4 border-t border-stone-200 bg-stone-50 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedDishForOptions(null)}
                className="px-4 py-2 border border-stone-300 hover:bg-stone-100 text-stone-700 text-xs font-bold rounded-xl"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmCustomDish}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-xs"
              >
                Thêm vào đơn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: COMPLETED RECEIPT (PHIẾU THU / HÓA ĐƠN VỪA TẠO)   */}
      {/* ========================================================= */}
      {showCompletedReceiptModal && completedTransaction && (
        <ReceiptDetailModal
          transaction={completedTransaction}
          onClose={() => {
            setShowCompletedReceiptModal(false);
            setCompletedTransaction(null);
            setCompletedOrder(null);
          }}
        />
      )}

      {/* ========================================================= */}
      {/* MODAL: MÀN HÌNH VIETQR SIÊU LỚN CHO KHÁCH QUÉT TẠI QUẦY  */}
      {/* ========================================================= */}
      {showLargeQRModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setShowLargeQRModal(false)}
        >
          <div 
            className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl text-center space-y-4 border-2 border-emerald-500 relative animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowLargeQRModal(false)}
              className="absolute top-4 right-4 p-2.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header with Vietcombank & Restaurant Brand */}
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black uppercase tracking-wider mb-2">
                <QrCode className="w-4 h-4 text-emerald-600" />
                MÃ VIETQR CHUYỂN KHOẢN TỰ ĐỘNG
              </div>
              <h2 className="text-xl font-black text-stone-900">
                {restaurantInfo.name}
              </h2>
              <p className="text-xs text-stone-500">
                {selectedTableNumber === 'counter' ? 'Thanh toán tại Quầy thu ngân' : `Thanh toán Bàn ${selectedTableNumber}`} • {posCart.reduce((s, i) => s + i.quantity, 0)} món
              </p>
            </div>

            {/* Super Large QR Code (300px - 360px) */}
            <div className="bg-stone-50 p-4 rounded-3xl border border-stone-200 inline-block shadow-md">
              <img
                src={vietQrUrl}
                alt="VietQR Super Large Screen"
                className="w-72 h-72 sm:w-88 sm:h-88 object-contain mx-auto rounded-xl"
              />
            </div>

            {/* Payment Details Box */}
            <div className="bg-emerald-50/90 border border-emerald-200 rounded-2xl p-4 text-left space-y-1.5 text-xs">
              <div className="flex justify-between items-center text-emerald-950">
                <span className="text-stone-600">Ngân hàng thụ hưởng:</span>
                <span className="font-bold text-emerald-900">{restaurantInfo.bankInfo.bankName}</span>
              </div>
              <div className="flex justify-between items-center text-emerald-950">
                <span className="text-stone-600">Số tài khoản:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-base text-emerald-800 tracking-wider">
                    {restaurantInfo.bankInfo.accountNumber}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(restaurantInfo.bankInfo.accountNumber);
                      setCopiedSTK(true);
                      setTimeout(() => setCopiedSTK(false), 2000);
                    }}
                    className="p-1 text-emerald-700 hover:text-emerald-900 cursor-pointer"
                    title="Sao chép số tài khoản"
                  >
                    {copiedSTK ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center text-emerald-950">
                <span className="text-stone-600">Chủ tài khoản:</span>
                <span className="font-semibold text-stone-800">{restaurantInfo.bankInfo.accountName}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-emerald-200/80">
                <span className="text-stone-700 font-bold">Số tiền thanh toán:</span>
                <span className="font-mono font-black text-xl text-amber-700">{formatVND(finalTotal)}</span>
              </div>
            </div>

            {/* Close / Action */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => setShowLargeQRModal(false)}
                className="py-3 px-4 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs transition-colors cursor-pointer"
              >
                Thu nhỏ lại
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLargeQRModal(false);
                  handleCollectAndPushReceipt();
                }}
                className="py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-sm"
              >
                Xác nhận đã nhận tiền
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
