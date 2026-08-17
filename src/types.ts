export type MealCategory = 
  | 'all'
  | 'appetizer'
  | 'main'
  | 'hotpot_grill'
  | 'rice_noodles'
  | 'drinks'
  | 'dessert';

export interface OptionChoice {
  id: string;
  name: string;
  price: number;
}

export interface OptionGroup {
  id: string;
  name: string;
  required: boolean;
  maxSelect: number;
  choices: OptionChoice[];
}

export interface MenuItem {
  id: string;
  name: string;
  category: MealCategory;
  price: number;
  originalPrice?: number;
  description: string;
  image: string;
  isPopular?: boolean;
  isVegetarian?: boolean;
  isSpicy?: boolean;
  isAvailable: boolean;
  prepTimeMinutes: number;
  optionGroups?: OptionGroup[];
  tags: string[];
}

export interface CartItemOption {
  groupName: string;
  choiceName: string;
  price: number;
}

export interface CartItem {
  id: string; // unique item instance id
  menuItemId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  selectedOptions: CartItemOption[];
  note: string;
}

export type OrderStatus = 'pending' | 'cooking' | 'served' | 'paid' | 'cancelled';

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  selectedOptions: CartItemOption[];
  note: string;
  status: 'pending' | 'cooking' | 'served' | 'cancelled';
}

export interface TableOrder {
  id: string;
  orderNumber: string;
  tableNumber: string;
  tableName: string;
  customerName?: string;
  createdAt: number;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  paymentMethod?: 'vietqr' | 'momo' | 'cash' | 'card';
  paymentStatus: 'unpaid' | 'paid';
  note?: string;
}

export type ServiceCallType = 'call_waiter' | 'refill_water' | 'extra_ice' | 'request_bill' | 'clean_table' | 'other';

export interface ServiceCall {
  id: string;
  tableNumber: string;
  tableName: string;
  type: ServiceCallType;
  message: string;
  createdAt: number;
  status: 'pending' | 'resolved';
}

export interface RestaurantTable {
  id: string;
  number: string;
  name: string;
  capacity: number;
  zone: 'Tầng 1' | 'Tầng 2' | 'Tầng 2 (VIP)' | 'Sân Vườn' | 'Phòng VIP' | string;
  status: 'empty' | 'ordering' | 'eating' | 'calling_staff' | 'waiting_bill';
  activeOrderId?: string;
  qrCodeUrl?: string;
}

export type ActiveTab = 
  | 'pos_counter'
  | 'tables' 
  | 'kitchen' 
  | 'cashflow' 
  | 'menu_manage' 
  | 'guide';

export type UserRole = 'admin' | 'cashier' | 'kitchen';

export interface UserAccount {
  role: UserRole;
  displayName: string;
  pin: string;
  description: string;
}

// ==========================================
// THU - CHI / SỔ QUỸ TIỀN MẶT & TÀI CHÍNH
// ==========================================

export type CashflowType = 'income' | 'expense';

export type IncomeCategory = 
  | 'sales'             // Doanh thu bán hàng (tự động hoặc thủ công)
  | 'deposit'           // Thu cọc bàn / tiệc
  | 'supplier_refund'   // Nhà cung cấp hoàn tiền
  | 'scrap_sales'       // Bán phế liệu / vỏ bia / dầu ăn thừa
  | 'other_income';     // Thu nhập khác

export type ExpenseCategory =
  | 'food_ingredients'  // Mua thịt cá, rau củ quả, thực phẩm tươi sống
  | 'beverages_alcohol' // Nhập bia, nước ngọt, rượu, trà, cà phê
  | 'staff_salary'      // Lương, thưởng, tạm ứng nhân viên / đầu bếp
  | 'rent_utilities'    // Mặt bằng, điện, nước, internet, rác
  | 'gas_fuel'          // Gas công nghiệp, than nướng, cồn
  | 'supplies_packaging'// Hộp mang về, đũa muỗng, khăn giấy, hóa phẩm
  | 'maintenance_repair'// Sửa chữa tủ lạnh, bảo trì bếp, bàn ghế
  | 'marketing'         // Quảng cáo, in ấn menu, biển bảng
  | 'taxes_fees'        // Thuế, phí môn bài, phí dịch vụ
  | 'other_expense';    // Chi phí phát sinh khác

export interface CashTransaction {
  id: string;
  receiptNumber: string; // Số phiếu: PT-20260813-001 hoặc PC-20260813-001
  type: CashflowType;
  category: IncomeCategory | ExpenseCategory;
  categoryName: string;
  amount: number;
  title: string;
  description?: string;
  paymentMethod: 'cash' | 'vietqr' | 'transfer' | 'card' | 'momo';
  recordedBy: string; // Tên nhân viên / Quản lý ghi nhận
  payerOrRecipient?: string; // Người nộp / Người nhận tiền
  createdAt: number;
  dateString: string; // YYYY-MM-DD
  orderId?: string; // Nếu tạo tự động từ đơn bán hàng
  tableNumber?: string;
}

export interface CashflowFilter {
  timeRange: 'today' | 'yesterday' | '7days' | 'this_month' | 'last_month' | 'all';
  type: 'all' | 'income' | 'expense';
  category: string;
  paymentMethod: 'all' | 'cash' | 'vietqr' | 'transfer' | 'card' | 'momo';
  searchQuery: string;
}
