import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Flame, 
  Leaf, 
  ShoppingCart, 
  Bell, 
  Clock, 
  CreditCard, 
  Utensils, 
  Soup, 
  ChefHat, 
  Salad, 
  Coffee, 
  IceCream,
  Sparkles,
  MapPin,
  Heart,
  ChevronRight,
  RefreshCw,
  Building2,
  Crown,
  CheckCircle2,
  Volume2,
  X
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { MenuItem, MealCategory, CartItem, TableOrder } from '../../types';
import { FoodCard } from './FoodCard';
import { FoodDetailModal } from './FoodDetailModal';
import { CartDrawer } from './CartDrawer';
import { OrderTrackerModal } from './OrderTrackerModal';
import { ServiceCallModal } from './ServiceCallModal';
import { PaymentModal } from './PaymentModal';
import { ReviewFeedbackModal } from './ReviewFeedbackModal';
import { TableSelectModal } from './TableSelectModal';
import { formatVND } from '../../utils/format';

export const CustomerApp: React.FC = () => {
  const { 
    menuItems, 
    activeTableNumber, 
    currentTable, 
    cart, 
    cartTotal, 
    cartItemCount, 
    addToCart, 
    activeTableOrders,
    restaurantInfo,
    kitchenLiveAlert,
    dismissKitchenAlert
  } = useRestaurant();

  // Filter & Search states
  const [selectedCategory, setSelectedCategory] = useState<MealCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVegetarian, setFilterVegetarian] = useState(false);
  const [filterSpicy, setFilterSpicy] = useState(false);
  const [filterPopular, setFilterPopular] = useState(false);

  // Modals
  const [selectedDish, setSelectedDish] = useState<MenuItem | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isOrderTrackerOpen, setIsOrderTrackerOpen] = useState(false);
  const [isServiceCallOpen, setIsServiceCallOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentTargetOrder, setPaymentTargetOrder] = useState<TableOrder | null>(null);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isTableSelectOpen, setIsTableSelectOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 2800);
  };

  const categories = [
    { id: 'all' as MealCategory, label: 'Tất cả món', icon: Utensils },
    { id: 'hotpot_grill' as MealCategory, label: 'Lẩu & Nướng', icon: Flame },
    { id: 'rice_noodles' as MealCategory, label: 'Cơm & Phở Mì', icon: Soup },
    { id: 'main' as MealCategory, label: 'Món Chính', icon: ChefHat },
    { id: 'appetizer' as MealCategory, label: 'Khai Vị', icon: Salad },
    { id: 'drinks' as MealCategory, label: 'Đồ Uống', icon: Coffee },
    { id: 'dessert' as MealCategory, label: 'Tráng Miệng', icon: IceCream },
  ];

  // Filtered menu
  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }
      if (filterVegetarian && !item.isVegetarian) return false;
      if (filterSpicy && !item.isSpicy) return false;
      if (filterPopular && !item.isPopular) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchDesc = item.description.toLowerCase().includes(q);
        const matchTag = item.tags.some(t => t.toLowerCase().includes(q));
        if (!matchName && !matchDesc && !matchTag) return false;
      }

      return true;
    });
  }, [menuItems, selectedCategory, filterVegetarian, filterSpicy, filterPopular, searchQuery]);

  const handleQuickAdd = (item: MenuItem) => {
    const cartItem: CartItem = {
      id: `ci-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      menuItemId: item.id,
      name: item.name,
      price: item.price,
      image: item.image,
      quantity: 1,
      selectedOptions: [],
      note: ''
    };
    addToCart(cartItem);
    showToast(`Đã thêm 1 "${item.name}" vào giỏ hàng`);
  };

  const handleAddFromModal = (cartItem: CartItem) => {
    addToCart(cartItem);
    showToast(`Đã thêm "${cartItem.name}" vào giỏ hàng`);
  };

  const totalActiveOrdered = activeTableOrders.reduce((sum, ord) => sum + ord.items.reduce((s, i) => s + i.quantity, 0), 0);

  return (
    <div className="min-h-screen bg-stone-100/60 pb-32">
      {/* Table Greeting & Restaurant Info Card */}
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-4xl mx-auto px-4 py-4 sm:py-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  id="btn-select-table-badge"
                  onClick={() => setIsTableSelectOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs sm:text-sm shadow-xs tracking-wide transition-all active:scale-95 cursor-pointer"
                  title="Nhấn để đổi bàn"
                >
                  <span>BÀN SỐ {activeTableNumber}</span>
                  <RefreshCw className="w-3.5 h-3.5 opacity-80" />
                </button>
                <span className="text-xs font-semibold text-stone-500 bg-stone-100 px-2.5 py-1 rounded-lg border border-stone-200">
                  {currentTable.zone}
                </span>
                <button
                  onClick={() => setIsTableSelectOpen(true)}
                  className="text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span>Chọn số bàn</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <h1 className="text-lg sm:text-xl font-extrabold text-stone-900 mt-1.5">
                Kính chào quý khách tại {restaurantInfo.name}
              </h1>
              <p className="text-xs text-stone-500 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-stone-400" />
                <span>{restaurantInfo.address}</span>
              </p>
            </div>

            {/* Quick Action Buttons for Table: Cart, Call Staff, Order Progress, Feedback */}
            <div className="flex items-center gap-2 pt-1 sm:pt-0">
              <button
                id="btn-open-cart-header"
                onClick={() => setIsCartOpen(true)}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-xs relative"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Giỏ hàng</span>
                {cartItemCount > 0 && (
                  <span className="px-1.5 py-0.2 bg-red-600 text-white rounded-full text-3xs font-extrabold">
                    {cartItemCount}
                  </span>
                )}
              </button>

              <button
                id="btn-call-service"
                onClick={() => setIsServiceCallOpen(true)}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-2xs"
              >
                <Bell className="w-4 h-4 text-amber-600 animate-bounce" />
                <span>Gọi Phục Vụ</span>
              </button>

              {activeTableOrders.length > 0 && (
                <>
                  <button
                    id="btn-track-active-orders"
                    onClick={() => setIsOrderTrackerOpen(true)}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-900 border border-orange-200 text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-2xs relative"
                  >
                    <Clock className="w-4 h-4 text-orange-600" />
                    <span>Tiến độ ({totalActiveOrdered})</span>
                    <span className="w-2 h-2 rounded-full bg-orange-500 absolute -top-1 -right-1 animate-ping"></span>
                  </button>

                  <button
                    id="btn-quick-pay-header"
                    onClick={() => setIsPaymentOpen(true)}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-2xs"
                  >
                    <CreditCard className="w-4 h-4 text-emerald-600" />
                    <span>Thanh Toán</span>
                  </button>
                </>
              )}

              <button
                onClick={() => setIsFeedbackOpen(true)}
                title="Đánh giá chất lượng"
                className="p-2 rounded-xl bg-stone-100 hover:bg-pink-50 text-stone-600 hover:text-pink-600 border border-stone-200 text-xs font-bold transition-colors cursor-pointer"
              >
                <Heart className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="mt-4 relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm tên món, hương vị (phở bò, lẩu thái, bò nướng, cà phê, gỏi cuốn...)"
              className="w-full pl-10 pr-4 py-2.5 bg-stone-50 hover:bg-stone-100/60 focus:bg-white text-xs sm:text-sm rounded-2xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 text-xs px-1.5 py-0.5 rounded-full hover:bg-stone-200 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Realtime Live Kitchen Alert for this Table */}
          {kitchenLiveAlert && (kitchenLiveAlert.tableNumber === activeTableNumber || !kitchenLiveAlert.tableNumber) && (
            <div className={`mt-3.5 p-3 rounded-2xl border flex items-center justify-between gap-3 shadow-md animate-in fade-in slide-in-from-top-2 ${
              kitchenLiveAlert.type === 'served'
                ? 'bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100 border-emerald-300 text-emerald-950'
                : 'bg-gradient-to-r from-orange-50 via-amber-50 to-orange-100 border-orange-300 text-orange-950'
            }`}>
              <div 
                onClick={() => setIsOrderTrackerOpen(true)}
                className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0"
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                  kitchenLiveAlert.type === 'served' ? 'bg-emerald-600 text-white' : 'bg-orange-600 text-white animate-bounce'
                }`}>
                  {kitchenLiveAlert.type === 'served' ? <CheckCircle2 className="w-5 h-5" /> : <Flame className="w-5 h-5" />}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-2xs font-extrabold uppercase tracking-wide px-2 py-0.5 rounded-full bg-white/80 border border-current shadow-2xs">
                      {kitchenLiveAlert.type === 'served' ? '✨ Bếp đã lên món' : '🔥 Bếp đã tiếp nhận'}
                    </span>
                  </div>
                  <p className="text-xs font-bold truncate mt-0.5">
                    {kitchenLiveAlert.message}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setIsOrderTrackerOpen(true)}
                  className="text-2xs font-extrabold px-2.5 py-1.5 rounded-xl bg-white text-stone-800 hover:bg-stone-100 border border-stone-200 shadow-xs cursor-pointer"
                >
                  Xem tiến độ
                </button>
                <button
                  onClick={dismissKitchenAlert}
                  title="Đóng thông báo"
                  className="p-1 rounded-lg hover:bg-black/10 text-stone-500 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Active Orders Quick Progress Banner (if no active popup alert) */}
          {!kitchenLiveAlert && activeTableOrders.length > 0 && (
            <div 
              onClick={() => setIsOrderTrackerOpen(true)}
              className="mt-3.5 p-2.5 bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 border border-amber-200 rounded-2xl flex items-center justify-between gap-2 text-xs cursor-pointer transition-all shadow-2xs"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded-lg bg-orange-500 text-white flex items-center justify-center shrink-0">
                  <ChefHat className="w-3.5 h-3.5" />
                </div>
                <div className="truncate">
                  <span className="font-extrabold text-stone-900">Tiến độ bếp: </span>
                  <span className="text-stone-600">
                    {activeTableOrders.every(o => o.status === 'served') 
                      ? '✨ Bếp đã lên đủ món cho bàn của bạn'
                      : activeTableOrders.some(o => o.status === 'cooking')
                      ? '🔥 Bếp đang thực hiện chế biến món'
                      : '⏳ Đơn đã gửi tới bếp, chờ tiếp nhận'
                    }
                  </span>
                </div>
              </div>
              <span className="text-2xs font-extrabold text-orange-700 underline shrink-0">Chi tiết →</span>
            </div>
          )}
        </div>
      </div>

      {/* Category Pills Slider */}
      <div className="sticky top-[88px] sm:top-[92px] z-30 bg-white/95 backdrop-blur-md border-b border-stone-200 py-2 shadow-2xs">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center space-x-2 overflow-x-auto scrollbar-none pb-1">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-stone-900 text-white shadow-xs scale-102'
                      : 'bg-stone-100 hover:bg-stone-200/80 text-stone-700'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-amber-400' : 'text-stone-500'}`} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Quick Dietary Filter Toggles */}
          <div className="flex items-center gap-2 pt-2 text-2xs overflow-x-auto scrollbar-none">
            <span className="text-stone-400 font-medium">Lọc nhanh:</span>
            <button
              onClick={() => setFilterPopular(!filterPopular)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border transition-all cursor-pointer font-medium ${
                filterPopular
                  ? 'bg-amber-100 border-amber-300 text-amber-900 font-bold'
                  : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
              }`}
            >
              <Flame className="w-3 h-3 text-amber-500" />
              <span>Món Bán chạy</span>
            </button>

            <button
              onClick={() => setFilterVegetarian(!filterVegetarian)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border transition-all cursor-pointer font-medium ${
                filterVegetarian
                  ? 'bg-emerald-100 border-emerald-300 text-emerald-900 font-bold'
                  : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
              }`}
            >
              <Leaf className="w-3 h-3 text-emerald-600" />
              <span>Ăn chay</span>
            </button>

            <button
              onClick={() => setFilterSpicy(!filterSpicy)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border transition-all cursor-pointer font-medium ${
                filterSpicy
                  ? 'bg-red-100 border-red-300 text-red-900 font-bold'
                  : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
              }`}
            >
              <span>🌶️ Món cay</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Food Menu Grid */}
      <main className="max-w-4xl mx-auto px-4 pt-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm sm:text-base font-bold text-stone-800">
            {categories.find(c => c.id === selectedCategory)?.label} ({filteredItems.length} món)
          </h2>
          <span className="text-2xs text-stone-500">Chạm vào món để chọn hương vị & topping</span>
        </div>

        {filteredItems.length === 0 ? (
          <div className="py-16 text-center text-stone-400 space-y-3 bg-white rounded-2xl border border-stone-200">
            <Utensils className="w-10 h-10 mx-auto text-stone-300" />
            <p className="text-sm font-semibold text-stone-700">Không tìm thấy món ăn phù hợp</p>
            <p className="text-xs text-stone-400">Hãy thử đổi danh mục hoặc tìm kiếm từ khóa khác nhé!</p>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
                setFilterVegetarian(false);
                setFilterSpicy(false);
                setFilterPopular(false);
              }}
              className="px-4 py-1.5 bg-stone-900 text-white rounded-xl text-xs font-medium hover:bg-stone-800 transition-colors cursor-pointer"
            >
              Xem tất cả món
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-4">
            {filteredItems.map((item) => (
              <FoodCard
                key={item.id}
                item={item}
                onSelect={(dish) => setSelectedDish(dish)}
                onQuickAdd={(dish) => handleQuickAdd(dish)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Bottom Sticky Action / Cart Bar */}
      {cartItemCount > 0 && (
        <div className="fixed bottom-3 left-3 right-3 sm:bottom-5 sm:left-auto sm:right-5 sm:w-96 z-40 animate-in slide-in-from-bottom-5 duration-300">
          <div className="bg-gradient-to-r from-stone-900 to-stone-800 text-white rounded-2xl p-3.5 shadow-2xl border border-stone-700 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-11 h-11 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-3xs font-extrabold w-5 h-5 rounded-full flex items-center justify-center border-2 border-stone-900">
                  {cartItemCount}
                </span>
              </div>
              <div>
                <span className="text-2xs text-stone-400 block font-medium">Bàn {activeTableNumber} • {cart.length} loại món</span>
                <span className="text-sm font-extrabold text-amber-400">{formatVND(cartTotal)}</span>
              </div>
            </div>

            <button
              id="btn-view-cart-sticky"
              onClick={() => setIsCartOpen(true)}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>Xem Giỏ & Gửi</span>
              <span className="text-xs">→</span>
            </button>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 fade-in duration-200">
          <div className="bg-stone-900/95 backdrop-blur-md text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 border border-stone-700 text-xs sm:text-sm font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Modals */}
      {selectedDish && (
        <FoodDetailModal
          item={selectedDish}
          onClose={() => setSelectedDish(null)}
          onAddToCart={(cartItem) => handleAddFromModal(cartItem)}
        />
      )}

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onOrderSubmitted={() => setIsOrderTrackerOpen(true)}
        onOpenPayment={() => {
          setPaymentTargetOrder(null);
          setIsPaymentOpen(true);
        }}
      />

      <OrderTrackerModal
        isOpen={isOrderTrackerOpen}
        onClose={() => setIsOrderTrackerOpen(false)}
        onOpenPayment={(targetOrd) => {
          setPaymentTargetOrder(targetOrd || null);
          setIsPaymentOpen(true);
        }}
      />

      <ServiceCallModal
        isOpen={isServiceCallOpen}
        onClose={() => setIsServiceCallOpen(false)}
      />

      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => {
          setIsPaymentOpen(false);
          setPaymentTargetOrder(null);
        }}
        targetOrder={paymentTargetOrder}
      />

      <ReviewFeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
      />

      <TableSelectModal
        isOpen={isTableSelectOpen}
        onClose={() => setIsTableSelectOpen(false)}
        onSelectSuccess={(num) => showToast(`Quý khách đã chuyển sang Bàn ${num}`)}
      />
    </div>
  );
};
