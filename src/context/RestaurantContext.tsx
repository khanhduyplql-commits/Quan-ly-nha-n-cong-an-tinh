import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  MenuItem, 
  RestaurantTable, 
  TableOrder, 
  CartItem, 
  ServiceCall, 
  OrderStatus,
  ServiceCallType,
  CashTransaction,
  UserRole,
  ActiveTab
} from '../types';
import { INITIAL_MENU_ITEMS, INITIAL_TABLES, INITIAL_ORDERS, INITIAL_TRANSACTIONS, DEFAULT_ACCOUNTS } from '../data/mockData';
import { broadcastRealtimeEvent, subscribeToRealtimeSync, CloudSyncEvent } from '../services/cloudSync';
import { getLocalDateString } from '../utils/format';
import { UserAccount } from '../types';

export interface RoleDefinition {
  id: UserRole;
  title: string;
  shortTitle: string;
  description: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  defaultPin: string;
  allowedTabs: ActiveTab[];
  defaultTab: ActiveTab;
}

export const ROLE_CONFIGS: Record<UserRole, RoleDefinition> = {
  admin: {
    id: 'admin',
    title: 'Quản Trị Viên (Toàn Quyền)',
    shortTitle: 'Quản Lý',
    description: 'Toàn quyền truy cập tất cả chức năng: Bán hàng, Thu ngân, Sơ đồ bàn, Bếp KDS, Sổ Quỹ Thu Chi, Quản lý món và Hướng dẫn.',
    badgeBg: 'bg-rose-100',
    badgeText: 'text-rose-900',
    badgeBorder: 'border-rose-300',
    defaultPin: '8888',
    allowedTabs: ['pos_counter', 'tables', 'kitchen', 'cashflow', 'menu_manage', 'guide'],
    defaultTab: 'pos_counter'
  },
  cashier: {
    id: 'cashier',
    title: 'Bộ Phận Bán Hàng & Thu Ngân',
    shortTitle: 'Thu Ngân',
    description: 'Quản lý quầy bán hàng (POS), sơ đồ bàn, thanh toán và in phiếu thu hóa đơn cho khách.',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-900',
    badgeBorder: 'border-amber-300',
    defaultPin: '2222',
    allowedTabs: ['pos_counter', 'tables'],
    defaultTab: 'pos_counter'
  },
  finance: {
    id: 'finance',
    title: 'Quản Lý Thu Chi & Kế Toán',
    shortTitle: 'Quản Lý Thu Chi',
    description: 'Quản lý Sổ Quỹ Tiền Mặt, Lập phiếu Thu/Chi, Báo cáo dòng tiền, thống kê Doanh thu & Lợi nhuận.',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-900',
    badgeBorder: 'border-emerald-300',
    defaultPin: '6666',
    allowedTabs: ['cashflow', 'guide'],
    defaultTab: 'cashflow'
  },
  kitchen: {
    id: 'kitchen',
    title: 'Bộ Phận Bếp & Chế Biến (KDS)',
    shortTitle: 'Bộ Phận Bếp',
    description: 'Màn hình Bếp KDS: Tiếp nhận đơn chế biến từ các bàn/quầy thu ngân, nấu món và thông báo trả món.',
    badgeBg: 'bg-orange-100',
    badgeText: 'text-orange-900',
    badgeBorder: 'border-orange-300',
    defaultPin: '3333',
    allowedTabs: ['kitchen'],
    defaultTab: 'kitchen'
  }
};

interface RestaurantContextType {
  // Authentication & Roles
  isAuthenticated: boolean;
  currentUser: UserAccount | null;
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  isRoleAllowedTab: (role: UserRole, tab: ActiveTab) => boolean;
  switchRole: (role: UserRole) => void;
  loginWithAccount: (role: UserRole, pin: string, remember?: boolean) => { success: boolean; message?: string };
  loginWithPin: (pin: string) => { success: boolean; role?: UserRole; message?: string };
  logoutUser: () => void;
  isManagerAuthenticated: boolean;
  setIsManagerAuthenticated: (auth: boolean) => void;
  loginAsManager: (pin: string) => boolean;
  logoutManager: () => void;

  // Menu
  menuItems: MenuItem[];
  setMenuItems: React.Dispatch<React.SetStateAction<MenuItem[]>>;
  toggleDishAvailability: (id: string) => void;
  updateDish: (dish: MenuItem) => void;
  addNewDish: (dish: Omit<MenuItem, 'id'>) => void;
  deleteDish: (id: string) => void;
  resetMenuToDefault: () => void;

  // Tables
  tables: RestaurantTable[];
  activeTableNumber: string;
  setActiveTableNumber: (tbl: string) => void;
  currentTable: RestaurantTable;
  updateTableStatus: (tableId: string, status: RestaurantTable['status']) => void;
  resetTableSession: (tableNumber: string) => void;

  // Cart
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (cartItemId: string) => void;
  updateCartItemQuantity: (cartItemId: string, delta: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartItemCount: number;

  // Orders
  orders: TableOrder[];
  activeTableOrders: TableOrder[];
  submitOrder: (customerName?: string, orderNote?: string) => TableOrder;
  submitDirectOrder: (order: TableOrder) => TableOrder;
  createQuickTestOrder: (targetTableNumber?: string) => TableOrder;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  updateOrderItemStatus: (orderId: string, itemId: string, status: 'pending' | 'cooking' | 'served' | 'cancelled') => void;
  payOrder: (
    orderId: string, 
    paymentMethod: 'vietqr' | 'momo' | 'cash' | 'card', 
    customAmount?: number, 
    explicitOrder?: TableOrder
  ) => void;
  payMultipleOrders: (
    ordersToPay: { id: string; amount: number; paymentMethod?: 'vietqr' | 'momo' | 'cash' | 'card'; order?: TableOrder }[]
  ) => Promise<void>;

  // Service Calls
  serviceCalls: ServiceCall[];
  requestService: (type: ServiceCallType, customMsg?: string) => void;
  resolveServiceCall: (callId: string) => void;

  // Cashflow (Thu - Chi)
  transactions: CashTransaction[];
  addTransaction: (tx: Omit<CashTransaction, 'id' | 'receiptNumber' | 'createdAt' | 'dateString'>) => Promise<CashTransaction>;
  deleteTransaction: (id: string) => Promise<void>;
  clearAllTransactions: () => Promise<void>;
  resetTransactionsToDefault: () => Promise<void>;

  // Real-time synchronization
  isLiveSynced: boolean;
  lastSyncedTime: number;
  refreshServerState: () => Promise<void>;

  // Live Kitchen Notifications for Customer
  kitchenLiveAlert: {
    tableNumber: string;
    orderId: string;
    orderNumber: string;
    status: OrderStatus;
    message: string;
    timestamp: number;
  } | null;
  dismissKitchenAlert: () => void;

  // Utilities
  playNotificationSound: (type?: 'order' | 'bell' | 'success') => void;
  restaurantInfo: {
    name: string;
    brandSlogan: string;
    address: string;
    hotline: string;
    bankInfo: {
      bankName: string;
      accountNumber: string;
      accountName: string;
      bankBin: string;
    }
  };
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

export const RestaurantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // User Authentication & Roles
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const sessionAuth = sessionStorage.getItem('qr_auth_user');
      if (sessionAuth) return true;
      const localAuth = localStorage.getItem('qr_auth_remember');
      if (localAuth) return true;
    } catch {}
    return false;
  });

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const sessionUser = sessionStorage.getItem('qr_auth_user');
      if (sessionUser) return JSON.parse(sessionUser);
      const localUser = localStorage.getItem('qr_auth_remember');
      if (localUser) return JSON.parse(localUser);
    } catch {}
    return null;
  });

  const [isManagerAuthenticated, setIsManagerAuthenticated] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('qr_manager_auth') === 'true';
    } catch {
      return false;
    }
  });

  const [userRole, setUserRoleState] = useState<UserRole>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('qr_current_role') as UserRole;
      if (saved && (saved === 'admin' || saved === 'cashier' || saved === 'finance' || saved === 'kitchen')) {
        return saved;
      }
      const params = new URLSearchParams(window.location.search);
      const roleParam = params.get('role') as UserRole;
      if (roleParam && (roleParam === 'kitchen' || roleParam === 'cashier' || roleParam === 'finance' || roleParam === 'admin')) {
        return roleParam;
      }
    }
    return 'admin';
  });

  const setUserRole = (role: UserRole) => {
    setUserRoleState(role);
    try {
      localStorage.setItem('qr_current_role', role);
    } catch {}
  };

  const switchRole = (role: UserRole) => {
    setUserRole(role);
    const targetAcc = DEFAULT_ACCOUNTS.find(a => a.role === role);
    if (targetAcc) {
      setCurrentUser(targetAcc);
    }
  };

  const isRoleAllowedTab = (role: UserRole, tab: ActiveTab): boolean => {
    const config = ROLE_CONFIGS[role];
    if (!config) return true;
    return config.allowedTabs.includes(tab);
  };

  const loginWithAccount = (role: UserRole, pin: string, remember: boolean = true): { success: boolean; message?: string } => {
    const cleanPin = pin.trim();
    const config = ROLE_CONFIGS[role];
    const targetAcc = DEFAULT_ACCOUNTS.find(a => a.role === role);

    const validPinsForRole: Record<UserRole, string[]> = {
      admin: ['8888', '1234', 'admin', '0000', '9999', 'admin123'],
      cashier: ['2222', '2026', 'thungan', 'cashier', '1122', '1234'],
      finance: ['6666', 'ketoan', 'finance', '1234', '8888'],
      kitchen: ['3333', 'bep', 'kitchen', '1111', '3344']
    };

    const isMatch = validPinsForRole[role]?.includes(cleanPin) || cleanPin === config?.defaultPin || (targetAcc && cleanPin === targetAcc.password);

    if (isMatch) {
      const user: UserAccount = targetAcc || {
        username: role,
        displayName: config.title,
        role,
        pin: cleanPin,
        description: config.description
      };
      setIsAuthenticated(true);
      setCurrentUser(user);
      setUserRole(role);
      setIsManagerAuthenticated(role === 'admin' || role === 'finance');

      try {
        sessionStorage.setItem('qr_auth_user', JSON.stringify(user));
        if (remember) {
          localStorage.setItem('qr_auth_remember', JSON.stringify(user));
        } else {
          localStorage.removeItem('qr_auth_remember');
        }
        localStorage.setItem('qr_current_role', role);
      } catch {}

      return { success: true };
    }

    return { success: false, message: `Mã PIN hoặc mật khẩu không đúng cho vai trò ${config?.shortTitle || role}!` };
  };

  const loginWithPin = (pin: string): { success: boolean; role?: UserRole; message?: string } => {
    const cleanPin = pin.trim();
    if (['8888', '1234', '6789', '0000', '9999', 'admin'].includes(cleanPin)) {
      setUserRole('admin');
      setIsManagerAuthenticated(true);
      setIsAuthenticated(true);
      const acc = DEFAULT_ACCOUNTS.find(a => a.role === 'admin');
      if (acc) setCurrentUser(acc);
      return { success: true, role: 'admin' };
    }
    if (['2222', '2026', '1122', 'thungan', 'cashier'].includes(cleanPin)) {
      setUserRole('cashier');
      setIsManagerAuthenticated(false);
      setIsAuthenticated(true);
      const acc = DEFAULT_ACCOUNTS.find(a => a.role === 'cashier');
      if (acc) setCurrentUser(acc);
      return { success: true, role: 'cashier' };
    }
    if (['6666', 'ketoan', 'finance'].includes(cleanPin)) {
      setUserRole('finance');
      setIsManagerAuthenticated(true);
      setIsAuthenticated(true);
      const acc = DEFAULT_ACCOUNTS.find(a => a.role === 'finance');
      if (acc) setCurrentUser(acc);
      return { success: true, role: 'finance' };
    }
    if (['3333', '1111', '3344', 'bep', 'kitchen'].includes(cleanPin)) {
      setUserRole('kitchen');
      setIsManagerAuthenticated(false);
      setIsAuthenticated(true);
      const acc = DEFAULT_ACCOUNTS.find(a => a.role === 'kitchen');
      if (acc) setCurrentUser(acc);
      return { success: true, role: 'kitchen' };
    }
    return { success: false, message: 'Mã PIN không hợp lệ! Vui lòng thử lại.' };
  };

  const loginAsManager = (pin: string): boolean => {
    const res = loginWithPin(pin);
    return res.success;
  };

  const logoutManager = () => {
    setIsManagerAuthenticated(false);
    setUserRoleState('cashier');
    try {
      sessionStorage.removeItem('qr_manager_auth');
      localStorage.setItem('qr_current_role', 'cashier');
    } catch {}
  };

  const logoutUser = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setIsManagerAuthenticated(false);
    try {
      sessionStorage.removeItem('qr_auth_user');
      sessionStorage.removeItem('qr_manager_auth');
      localStorage.removeItem('qr_auth_remember');
    } catch {}
  };

  // Menu state
  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => {
    const saved = localStorage.getItem('qr_dinein_menu');
    return saved ? JSON.parse(saved) : INITIAL_MENU_ITEMS;
  });

  // Tables state
  const [tables, setTables] = useState<RestaurantTable[]>(() => {
    try {
      const saved = localStorage.getItem('qr_dinein_tables');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 30) {
          return parsed;
        }
      }
    } catch {}
    return INITIAL_TABLES;
  });

  // Cashflow Transactions (Thu - Chi) - Start clean without fake mock data
  const [transactions, setTransactions] = useState<CashTransaction[]>(() => {
    try {
      const saved = localStorage.getItem('qr_dinein_transactions');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Filter out legacy mock data if any
          const realTxs = parsed.filter((t: CashTransaction) => !t.id?.startsWith('tx-y2025') && !t.id?.startsWith('tx-m') && t.id !== 'tx-1' && t.id !== 'tx-2');
          return realTxs;
        }
      }
    } catch {}
    return INITIAL_TRANSACTIONS;
  });

  // Active customer table (checks URL param ?table=... then localStorage, default to '01')
  const [activeTableNumber, setActiveTableNumberState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlTable = params.get('table');
      if (urlTable && urlTable.trim()) {
        return urlTable.trim();
      }
      const saved = localStorage.getItem('qr_active_table');
      if (saved && saved.trim()) {
        return saved.trim();
      }
    }
    return '01';
  });

  const setActiveTableNumber = (tblNum: string) => {
    const cleanNum = tblNum.trim();
    setActiveTableNumberState(cleanNum);
    try {
      localStorage.setItem('qr_active_table', cleanNum);
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.set('table', cleanNum);
        window.history.replaceState({}, '', url.toString());
      }
    } catch {}
  };

  // Cart state for active table - Always start fresh upon reload
  const [cart, setCart] = useState<CartItem[]>([]);

  // Orders state
  const [orders, setOrders] = useState<TableOrder[]>(() => {
    const saved = localStorage.getItem('qr_dinein_orders');
    return saved ? JSON.parse(saved) : INITIAL_ORDERS;
  });

  // Service Calls
  const [serviceCalls, setServiceCalls] = useState<ServiceCall[]>(() => {
    const saved = localStorage.getItem('qr_dinein_service_calls');
    return saved ? JSON.parse(saved) : [
      {
        id: 'sc-1',
        tableNumber: '03',
        tableName: 'Bàn 03',
        type: 'refill_water',
        message: 'Xin thêm bình trà đá',
        createdAt: Date.now() - 1000 * 60 * 5,
        status: 'pending'
      }
    ];
  });

  const restaurantInfo = {
    name: 'Nhà ăn Công an tỉnh Quảng Ngãi',
    brandSlogan: 'Phục vụ tận tâm - Đảm bảo dinh dưỡng & Vệ sinh an toàn thực phẩm',
    address: 'Số 174 Đường Hùng Vương, TP. Quảng Ngãi, Tỉnh Quảng Ngãi',
    hotline: '0255 3822 841',
    bankInfo: {
      bankName: 'MB Bank (Ngân hàng Quân Đội)',
      accountNumber: '999988886666',
      accountName: 'NHA AN CONG AN TINH QUANG NGAI',
      bankBin: '970422'
    }
  };

  const [isLiveSynced, setIsLiveSynced] = useState<boolean>(true);
  const [lastSyncedTime, setLastSyncedTime] = useState<number>(Date.now());

  // Kitchen live alert feedback state for customer
  const [kitchenLiveAlert, setKitchenLiveAlert] = useState<{
    tableNumber: string;
    orderId: string;
    orderNumber: string;
    status: OrderStatus;
    message: string;
    timestamp: number;
  } | null>(null);

  const dismissKitchenAlert = () => {
    setKitchenLiveAlert(null);
  };

  // Broadcast channel for multi-tab zero latency local sync
  const broadcastChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window
    ? new BroadcastChannel('qr_dinein_broadcast')
    : null;

  const fetchServerState = async () => {
    try {
      const res = await fetch('/api/state', { cache: 'no-store' });
      if (!res.ok) {
        // If deployed to Cloudflare Pages or Static CDN (where /api/state is not hosted as Node),
        // we still have Cloud Relay (P2P + Cloud SSE) active and healthy.
        setLastSyncedTime(Date.now());
        return;
      }
      const data = await res.json();
      setIsLiveSynced(true);
      setLastSyncedTime(Date.now());

      if (Array.isArray(data.orders)) {
        setOrders(prev => {
          // Check if there are new orders to ring chime
          const hasNewPending = data.orders.some(
            (o: TableOrder) => o.status === 'pending' && !prev.some(p => p.id === o.id)
          );
          if (hasNewPending) {
            playNotificationSound('order');
          }

          // Smart merge: preserve any local unsynced orders that are not yet in server list
          const serverOrderIds = new Set(data.orders.map((o: TableOrder) => o.id));
          const localOnlyOrders = prev.filter(p => !serverOrderIds.has(p.id));

          // Also sync localOnlyOrders to server in background
          if (localOnlyOrders.length > 0) {
            localOnlyOrders.forEach(lo => {
              fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(lo)
              }).catch(() => {});
            });
          }

          // Merge and sort newest first
          const merged = [...data.orders, ...localOnlyOrders].sort((a, b) => b.createdAt - a.createdAt);
          return merged;
        });
      }

      if (Array.isArray(data.tables)) {
        setTables(data.tables);
      }

      if (Array.isArray(data.transactions)) {
        setTransactions(prev => {
          const serverTxIds = new Set(data.transactions.map((t: CashTransaction) => t.id));
          const serverOrderTxIds = new Set(
            data.transactions
              .filter((t: CashTransaction) => Boolean(t.orderId))
              .map((t: CashTransaction) => t.orderId)
          );

          // Find local transactions that are not yet on the server
          const localOnlyTx = prev.filter(
            p => !serverTxIds.has(p.id) && (!p.orderId || !serverOrderTxIds.has(p.orderId))
          );

          // Push any local-only transactions to the server in the background
          if (localOnlyTx.length > 0) {
            localOnlyTx.forEach(ltx => {
              fetch('/api/cashflow', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(ltx)
              }).catch(() => {});
            });
          }

          const merged = [...data.transactions, ...localOnlyTx].sort((a, b) => b.createdAt - a.createdAt);
          try {
            localStorage.setItem('qr_dinein_transactions', JSON.stringify(merged));
          } catch {}
          return merged;
        });
      }

      if (Array.isArray(data.serviceCalls)) {
        setServiceCalls(prev => {
          if (data.serviceCalls.length > prev.length) {
            playNotificationSound('bell');
          }
          return data.serviceCalls;
        });
      }

      if (Array.isArray(data.menuItems) && data.menuItems.length > 0) {
        setMenuItems(data.menuItems);
      }
    } catch {
      // Keep isLiveSynced true if cloud/P2P channel is alive
    }
  };

  // Sync from server API periodically and subscribe to cross-device Cloud Sync
  useEffect(() => {
    let isMounted = true;

    fetchServerState();

    // Fast 1.5s background polling
    const interval = setInterval(() => {
      if (isMounted) fetchServerState();
    }, 1500);

    // Refresh immediately when window/tab is focused
    const handleFocus = () => {
      if (isMounted) fetchServerState();
    };
    window.addEventListener('focus', handleFocus);

    // Real-Time Cross-Device & Cloud Sync Listener (works on Cloudflare, 4G, Wifi, iPhone, Android, PC)
    const unsubscribeCloud = subscribeToRealtimeSync(
      (event: any) => {
        if (!isMounted) return;
        setIsLiveSynced(true);
        setLastSyncedTime(Date.now());

      const type = event.type?.toLowerCase() || '';

      if (type === 'new_order') {
        const incomingOrder = event.order || event.data?.order || event.data;
        if (incomingOrder && incomingOrder.id) {
          setOrders(prev => {
            if (prev.some(o => o.id === incomingOrder.id)) return prev;
            playNotificationSound('order');
            return [incomingOrder, ...prev];
          });
          setTables(prev => prev.map(t => {
            if (t.number === incomingOrder.tableNumber) {
              return { ...t, status: 'eating', activeOrderId: incomingOrder.id };
            }
            return t;
          }));
        }
      } else if (type === 'order_status') {
        const orderId = event.orderId || event.data?.orderId || event.data?.id;
        const status = event.status || event.data?.status;
        const itemId = event.itemId || event.data?.itemId;
        const itemStatus = event.itemStatus || event.data?.itemStatus;
        const tableNumber = event.tableNumber || event.data?.tableNumber;
        const orderNumber = event.orderNumber || event.data?.orderNumber;
        const message = event.message || event.data?.message;

        if (orderId) {
          setOrders(prev => prev.map(o => {
            if (o.id === orderId) {
              if (itemId && itemStatus) {
                const nextItems = o.items.map(i => i.id === itemId ? { ...i, status: itemStatus as any } : i);
                const allServed = nextItems.every(i => i.status === 'served' || i.status === 'cancelled');
                const anyCooking = nextItems.some(i => i.status === 'cooking');
                const nextStatus: OrderStatus = allServed ? 'served' : (anyCooking ? 'cooking' : o.status);
                return { ...o, items: nextItems, status: nextStatus };
              } else if (status) {
                const updatedItems = o.items.map(item => ({
                  ...item,
                  status: status === 'served' ? ('served' as const) : (status === 'cooking' && item.status === 'pending' ? 'cooking' as const : item.status)
                }));
                return { ...o, status, items: updatedItems };
              }
            }
            return o;
          }));

          if (status === 'cooking' || status === 'served') {
            const autoMsg = status === 'cooking' 
              ? `Bếp đã tiếp nhận đơn và đang thực hiện chế biến!`
              : `Bếp đã trả đơn và lên đủ món cho bàn của quý khách!`;
            
            setKitchenLiveAlert({
              tableNumber: tableNumber || '',
              orderId,
              orderNumber: orderNumber || '',
              status,
              message: message || autoMsg,
              timestamp: Date.now()
            });

            if (status === 'served') {
              playNotificationSound('success');
            } else if (status === 'cooking') {
              playNotificationSound('order');
            }
          }
        }
      } else if (type === 'pay_order' || type === 'order_paid' || type === 'orders_paid_batch') {
        const payments = event.data?.payments || (event.orderId ? [{ id: event.orderId, paymentMethod: event.paymentMethod, tableNumber: event.tableNumber }] : []);
        if (Array.isArray(payments) && payments.length > 0) {
          const pOrderIds = new Set(payments.map((p: any) => p.id));
          setOrders(prev => prev.map(o => {
            if (pOrderIds.has(o.id)) {
              const pItem = payments.find((p: any) => p.id === o.id);
              return { 
                ...o, 
                paymentStatus: 'paid', 
                paymentMethod: pItem?.paymentMethod || o.paymentMethod || 'vietqr',
                status: (o.status === 'served' || o.status === 'cancelled') ? o.status : (o.status || 'cooking')
              };
            }
            return o;
          }));
        } else if (event.orderId || event.id) {
          const oId = event.orderId || event.id;
          setOrders(prev => prev.map(o => o.id === oId ? { 
            ...o, 
            paymentStatus: 'paid', 
            paymentMethod: event.paymentMethod || 'vietqr',
            status: (o.status === 'served' || o.status === 'cancelled') ? o.status : (o.status || 'cooking')
          } : o));
        }

        const tableNum = event.tableNumber || event.data?.tableNumber;
        if (tableNum) {
          setTables(prev => prev.map(t => {
            if (t.number === tableNum) {
              const otherUnpaid = orders.filter(o => o.tableNumber === tableNum && o.paymentStatus === 'unpaid');
              if (otherUnpaid.length <= 1) {
                return { ...t, status: 'empty', activeOrderId: undefined };
              }
            }
            return t;
          }));
        }

        // Direct cashflow receipt ingestion from pay event
        const incomingTxs: CashTransaction[] = [];
        if (event.transaction) incomingTxs.push(event.transaction);
        if (event.data?.transaction) incomingTxs.push(event.data.transaction);
        if (Array.isArray(event.transactions)) incomingTxs.push(...event.transactions);
        if (Array.isArray(event.data?.transactions)) incomingTxs.push(...event.data.transactions);

        if (incomingTxs.length > 0) {
          setTransactions(prev => {
            const incomingIds = new Set(incomingTxs.map(t => t.id));
            const filtered = prev.filter(t => !incomingIds.has(t.id));
            return [...incomingTxs, ...filtered];
          });
        }

        playNotificationSound('success');
        fetchServerState();
      } else if (type === 'reset_table') {
        const tableNumber = event.tableNumber || event.data?.tableNumber;
        if (tableNumber) {
          setTables(prev => prev.map(t => t.number === tableNumber ? { ...t, status: 'empty', activeOrderId: undefined } : t));
        }
      } else if (type === 'service_call') {
        const sc = event.serviceCall || event.data?.serviceCall || event.data;
        if (sc && sc.id) {
          setServiceCalls(prev => {
            if (prev.some(c => c.id === sc.id)) return prev;
            playNotificationSound('bell');
            return [sc, ...prev];
          });
        }
      } else if (type === 'resolve_service_call' || type === 'service_call_resolved') {
        const callId = event.callId || event.data?.callId || event.data?.id;
        if (callId) {
          setServiceCalls(prev => prev.map(c => c.id === callId ? { ...c, status: 'resolved' } : c));
        }
      } else if (type === 'menu_update' || type === 'menu_updated') {
        const menuItems = event.menuItems || event.data?.menuItems || event.data;
        if (Array.isArray(menuItems) && menuItems.length > 0) {
          setMenuItems(menuItems);
        }
      } else if (type === 'tables_update' || type === 'tables_updated') {
        const tables = event.tables || event.data?.tables || event.data;
        if (Array.isArray(tables)) {
          setTables(tables);
        }
      } else if (type === 'cashflow_add' || type === 'cashflow_updated' || type === 'cashflow_update' || type === 'cashflow_bulk_updated') {
        if (Array.isArray(event.data)) {
          setTransactions(event.data);
        } else if (Array.isArray(event.transactions)) {
          setTransactions(event.transactions);
        } else if (Array.isArray(event.data?.transactions)) {
          setTransactions(event.data.transactions);
        } else {
          const tx = event.transaction || event.data?.transaction || event.data;
          if (tx && tx.id) {
            setTransactions(prev => {
              const existingIdx = prev.findIndex(t => t.id === tx.id || (tx.orderId && t.orderId === tx.orderId));
              if (existingIdx !== -1) {
                const next = [...prev];
                next[existingIdx] = tx;
                return next;
              }
              return [tx, ...prev];
            });
          }
        }
      } else if (type === 'cashflow_delete' || type === 'cashflow_deleted') {
        const txId = event.transactionId || event.data?.id || event.data?.transactionId;
        if (txId) {
          setTransactions(prev => prev.filter(t => t.id !== txId));
        }
      } else if (type === 'cashflow_clear' || type === 'cashflow_cleared') {
        setTransactions([]);
      } else if (type === 'cashflow_reset') {
        const txs = event.transactions || event.data?.transactions || event.data;
        if (Array.isArray(txs)) {
          setTransactions(txs);
        }
      }
    });

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      unsubscribeCloud();
    };
  }, []);

  const refreshServerState = async () => {
    await fetchServerState();
  };

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('qr_dinein_menu', JSON.stringify(menuItems));
  }, [menuItems]);

  useEffect(() => {
    localStorage.setItem('qr_dinein_tables', JSON.stringify(tables));
  }, [tables]);

  useEffect(() => {
    localStorage.setItem('qr_dinein_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('qr_dinein_service_calls', JSON.stringify(serviceCalls));
  }, [serviceCalls]);

  useEffect(() => {
    localStorage.setItem('qr_dinein_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(`qr_cart_${activeTableNumber}`, JSON.stringify(cart));
  }, [cart, activeTableNumber]);

  // Audio chime synthesizer using Web Audio API
  const playNotificationSound = (type: 'order' | 'bell' | 'success' = 'order') => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      if (type === 'bell') {
        // High pitch ding for service call
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
        osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 1.2);
      } else if (type === 'success') {
        // Upbeat chime
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08);
          gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.4);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + i * 0.08);
          osc.stop(ctx.currentTime + i * 0.08 + 0.4);
        });
      } else {
        // Kitchen order alert (2-tone chime)
        [587.33, 880].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.15);
          gain.gain.setValueAtTime(0.25, ctx.currentTime + i * 0.15);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.5);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + i * 0.15);
          osc.stop(ctx.currentTime + i * 0.15 + 0.5);
        });
      }
    } catch {
      // Audio context might be restricted before user gesture
    }
  };

  // Find current table
  const currentTable = tables.find(t => t.number === activeTableNumber) || {
    id: 'tbl-custom',
    number: activeTableNumber,
    name: `Bàn ${activeTableNumber}`,
    capacity: 4,
    zone: 'Tầng 1',
    status: 'ordering'
  };

  // Helper to persist menu changes to LocalStorage, Server API, and Cloud Real-time
  const syncMenuToServerAndCloud = (updatedMenu: MenuItem[]) => {
    try {
      localStorage.setItem('qr_dinein_menu', JSON.stringify(updatedMenu));
    } catch {}

    // Broadcast globally to other connected devices
    broadcastRealtimeEvent({ type: 'MENU_UPDATE', menuItems: updatedMenu }).catch(console.error);

    // Save permanently to server backend and disk storage
    fetch('/api/menu', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedMenu)
    }).catch(err => {
      console.warn('[MENU SYNC] Server sync fallback:', err);
    });
  };

  // Menu actions
  const toggleDishAvailability = (id: string) => {
    setMenuItems(prev => {
      const next = prev.map(m => m.id === id ? { ...m, isAvailable: !m.isAvailable } : m);
      syncMenuToServerAndCloud(next);
      return next;
    });
  };

  const updateDish = (dish: MenuItem) => {
    setMenuItems(prev => {
      const next = prev.map(m => m.id === dish.id ? dish : m);
      syncMenuToServerAndCloud(next);
      return next;
    });
  };

  const addNewDish = (dishData: Omit<MenuItem, 'id'>) => {
    const newDish: MenuItem = {
      ...dishData,
      id: `m-${Date.now()}`
    };
    setMenuItems(prev => {
      const next = [newDish, ...prev];
      syncMenuToServerAndCloud(next);
      return next;
    });
  };

  const deleteDish = (id: string) => {
    setMenuItems(prev => {
      const next = prev.filter(m => m.id !== id);
      syncMenuToServerAndCloud(next);
      return next;
    });
  };

  const resetMenuToDefault = () => {
    setMenuItems(INITIAL_MENU_ITEMS);
    syncMenuToServerAndCloud(INITIAL_MENU_ITEMS);
  };

  // Cart actions
  const addToCart = (item: CartItem) => {
    setCart(prev => {
      // Check if identical item with identical options already in cart
      const existingIdx = prev.findIndex(p => 
        p.menuItemId === item.menuItemId && 
        JSON.stringify(p.selectedOptions) === JSON.stringify(item.selectedOptions) &&
        p.note === item.note
      );
      if (existingIdx > -1) {
        const next = [...prev];
        next[existingIdx].quantity += item.quantity;
        return next;
      }
      return [...prev, item];
    });
    playNotificationSound('success');
  };

  const removeFromCart = (cartItemId: string) => {
    setCart(prev => prev.filter(item => item.id !== cartItemId));
  };

  const updateCartItemQuantity = (cartItemId: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.id === cartItemId) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean) as CartItem[];
    });
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Orders for current active table
  const activeTableOrders = orders.filter(
    o => o.tableNumber === activeTableNumber && o.paymentStatus === 'unpaid'
  );

  // Submit Order
  const submitOrder = (customerName?: string, orderNote?: string): TableOrder => {
    const orderNum = `#${Math.floor(100 + Math.random() * 900)}`;
    const newOrder: TableOrder = {
      id: `ord-${Date.now()}`,
      orderNumber: orderNum,
      tableNumber: activeTableNumber,
      tableName: currentTable.name,
      customerName: customerName || `Khách ${currentTable.name}`,
      createdAt: Date.now(),
      status: 'pending',
      paymentStatus: 'unpaid',
      totalAmount: cartTotal,
      note: orderNote || '',
      items: cart.map(c => ({
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

    setOrders(prev => [newOrder, ...prev]);
    setCart([]);

    // Update table status to eating
    setTables(prev => prev.map(t => {
      if (t.number === activeTableNumber) {
        return {
          ...t,
          status: 'eating',
          activeOrderId: newOrder.id
        };
      }
      return t;
    }));

    playNotificationSound('order');

    // Broadcast globally to all connected devices via Cloud Real-time PubSub
    broadcastRealtimeEvent({ type: 'NEW_ORDER', order: newOrder }).catch(console.error);

    // Asynchronously dispatch to server API
    fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newOrder)
    }).catch(err => {
      console.warn('Sync order to server failed, stored locally:', err);
    });

    return newOrder;
  };

  // Submit Direct Order (from Counter POS, Table Map, Waiter, or Customer Phone)
  const submitDirectOrder = (order: TableOrder): TableOrder => {
    // 1. Update React state immediately
    setOrders(prev => {
      const exists = prev.some(o => o.id === order.id);
      if (exists) {
        return prev.map(o => o.id === order.id ? order : o);
      }
      return [order, ...prev];
    });

    // 2. Update table status if dine-in
    if (order.tableNumber && order.tableNumber !== 'counter') {
      setTables(prev => prev.map(t => {
        if (t.number === order.tableNumber) {
          return {
            ...t,
            status: 'eating',
            activeOrderId: order.id
          };
        }
        return t;
      }));
    }

    // 3. Play audio chime
    playNotificationSound('order');

    // 4. Broadcast global Real-time event (KDS Kitchen, Counter, Manager)
    broadcastRealtimeEvent({ type: 'NEW_ORDER', order }).catch(console.error);

    // 5. Post to backend server
    fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order)
    }).catch(err => {
      console.warn('Sync direct order to server failed, stored locally:', err);
    });

    return order;
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    let affectedTableNumber = '';
    let affectedOrderNumber = '';
    let statusMessage = '';

    if (status === 'cooking') {
      statusMessage = '👨‍🍳 Bếp đã tiếp nhận đơn và đang thực hiện chế biến món!';
    } else if (status === 'served') {
      statusMessage = '🍽️ Bếp đã trả đơn và lên đủ món cho bàn của quý khách!';
    }

    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        affectedTableNumber = o.tableNumber;
        affectedOrderNumber = o.orderNumber;
        // also update items if order is marked served or cooking
        const updatedItems = o.items.map(item => ({
          ...item,
          status: status === 'served' 
            ? ('served' as const) 
            : (status === 'cooking' && item.status === 'pending' ? ('cooking' as const) : item.status)
        }));
        return { ...o, status, items: updatedItems };
      }
      return o;
    }));

    if (status === 'cooking' || status === 'served') {
      setKitchenLiveAlert({
        tableNumber: affectedTableNumber,
        orderId,
        orderNumber: affectedOrderNumber,
        status,
        message: statusMessage,
        timestamp: Date.now()
      });
      playNotificationSound(status === 'served' ? 'success' : 'order');
    }

    broadcastRealtimeEvent({ 
      type: 'ORDER_STATUS', 
      orderId, 
      status, 
      tableNumber: affectedTableNumber,
      orderNumber: affectedOrderNumber,
      message: statusMessage 
    }).catch(console.error);

    fetch(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    }).catch(console.error);
  };

  const updateOrderItemStatus = (orderId: string, itemId: string, status: 'pending' | 'cooking' | 'served' | 'cancelled') => {
    let affectedTableNumber = '';
    let affectedOrderNumber = '';
    let newOrderStatus: OrderStatus = 'pending';

    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        affectedTableNumber = o.tableNumber;
        affectedOrderNumber = o.orderNumber;
        const nextItems = o.items.map(item => item.id === itemId ? { ...item, status } : item);
        const allServed = nextItems.every(i => i.status === 'served' || i.status === 'cancelled');
        const anyCooking = nextItems.some(i => i.status === 'cooking');
        newOrderStatus = allServed ? 'served' : (anyCooking ? 'cooking' : o.status);
        return { ...o, items: nextItems, status: newOrderStatus };
      }
      return o;
    }));

    const statusMessage = status === 'cooking' 
      ? '👨‍🍳 Bếp đang thực hiện nấu món cho bàn của bạn!' 
      : status === 'served' 
      ? '🍽️ Món ăn đã được đầu bếp chế biến xong và mang lên bàn!' 
      : '';

    if (statusMessage) {
      setKitchenLiveAlert({
        tableNumber: affectedTableNumber,
        orderId,
        orderNumber: affectedOrderNumber,
        status: newOrderStatus,
        message: statusMessage,
        timestamp: Date.now()
      });
    }

    broadcastRealtimeEvent({ 
      type: 'ORDER_STATUS', 
      orderId, 
      status: newOrderStatus, 
      itemId, 
      itemStatus: status,
      tableNumber: affectedTableNumber,
      orderNumber: affectedOrderNumber,
      message: statusMessage
    }).catch(console.error);

    fetch(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId, itemStatus: status })
    }).catch(console.error);
  };

  const payOrder = (
    orderId: string, 
    paymentMethod: 'vietqr' | 'momo' | 'cash' | 'card' = 'vietqr', 
    customAmount?: number,
    explicitOrder?: TableOrder
  ) => {
    // 1. Find the target order immediately
    const currentOrder = explicitOrder || orders.find(o => o.id === orderId);
    const tableNum = currentOrder?.tableNumber || activeTableNumber;
    const effectiveAmount = typeof customAmount === 'number' && customAmount > 0 
      ? customAmount 
      : (currentOrder?.totalAmount || (cart.length > 0 ? cartTotal : 0));

    // 2. Mark order paid in state
    setOrders(prev => {
      const exists = prev.some(o => o.id === orderId);
      if (!exists && explicitOrder) {
        return [{ 
          ...explicitOrder, 
          paymentStatus: 'paid', 
          paymentMethod,
          status: (explicitOrder.status === 'served' || explicitOrder.status === 'cancelled') ? explicitOrder.status : (explicitOrder.status || 'cooking')
        }, ...prev];
      }
      return prev.map(o => {
        if (o.id === orderId) {
          return {
            ...o,
            paymentStatus: 'paid',
            paymentMethod,
            status: (o.status === 'served' || o.status === 'cancelled') ? o.status : (o.status || 'cooking')
          };
        }
        return o;
      });
    });

    // 3. Reset table status only if no other unpaid orders remain for this table
    if (tableNum) {
      setTables(prev => prev.map(t => {
        if (t.number === tableNum) {
          const otherUnpaid = orders.filter(o => o.tableNumber === tableNum && o.id !== orderId && o.paymentStatus === 'unpaid');
          if (otherUnpaid.length === 0) {
            return { ...t, status: 'empty', activeOrderId: undefined };
          }
        }
        return t;
      }));
    }

    // 4. Automatically record Income transaction in Cashflow ledger
    let autoTx: CashTransaction | null = null;
    if (effectiveAmount > 0) {
      const d = new Date();
      const dateStr = getLocalDateString(d);
      const tableName = currentOrder?.tableName || `Bàn ${tableNum}`;
      const orderNumber = currentOrder?.orderNumber || `#${orderId.slice(-4)}`;
      const itemsList = currentOrder?.items && currentOrder.items.length > 0 
        ? currentOrder.items.map(i => `${i.name} x${i.quantity}`).join(', ') 
        : 'Thực đơn gọi món';
      const customerPayer = currentOrder?.customerName || `Khách ${tableName}`;

      autoTx = {
        id: `tx-auto-${orderId}-${Date.now()}`,
        receiptNumber: `PT-${dateStr.replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`,
        type: 'income',
        category: 'sales',
        categoryName: 'Doanh thu bán hàng',
        amount: effectiveAmount,
        title: `Thu tiền ${tableName} (${orderNumber})`,
        description: `Thanh toán ${paymentMethod.toUpperCase()}. Món: ${itemsList}`,
        paymentMethod: paymentMethod || 'vietqr',
        recordedBy: 'Hệ thống POS Thu ngân',
        payerOrRecipient: customerPayer,
        createdAt: Date.now(),
        dateString: dateStr,
        orderId: orderId,
        tableNumber: tableNum
      };

      setTransactions(prev => {
        // Prevent duplicate only for the exact same order re-paid, keep all other orders/transactions
        const filtered = prev.filter(t => t.id !== autoTx!.id && (!autoTx!.orderId || t.orderId !== autoTx!.orderId));
        const next = [autoTx!, ...filtered];
        try {
          localStorage.setItem('qr_dinein_transactions', JSON.stringify(next));
        } catch {}
        return next;
      });

      broadcastRealtimeEvent({ type: 'CASHFLOW_ADD', transaction: autoTx }).catch(() => {});

      fetch('/api/cashflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(autoTx)
      }).catch(() => {});
    }

    playNotificationSound('success');

    broadcastRealtimeEvent({ 
      type: 'PAY_ORDER', 
      orderId, 
      paymentMethod, 
      tableNumber: tableNum, 
      amount: effectiveAmount,
      order: currentOrder,
      transaction: autoTx || undefined
    }).catch(console.error);

    fetch(`/api/orders/${orderId}/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        paymentMethod, 
        amount: effectiveAmount,
        order: currentOrder
      })
    })
    .then(res => res.json())
    .then(data => {
      if (data && Array.isArray(data.transactions)) {
        setTransactions(data.transactions);
      }
    })
    .catch(console.error);
  };

  // Pay multiple orders at once (e.g. paying for all batches / multiple guests at the same table)
  const payMultipleOrders = async (
    ordersToPay: { id: string; amount: number; paymentMethod?: 'vietqr' | 'momo' | 'cash' | 'card'; order?: TableOrder }[]
  ) => {
    if (!ordersToPay || ordersToPay.length === 0) return;

    const d = new Date();
    const dateStr = getLocalDateString(d);
    const orderIds = new Set(ordersToPay.map(p => p.id));
    const affectedTableNumbers = new Set<string>();
    const generatedReceipts: CashTransaction[] = [];

    // 1. Update orders status in React state
    setOrders(prev => prev.map(o => {
      if (orderIds.has(o.id)) {
        const item = ordersToPay.find(p => p.id === o.id);
        return {
          ...o,
          paymentStatus: 'paid',
          paymentMethod: (item?.paymentMethod || o.paymentMethod || 'vietqr') as any,
          status: (o.status === 'served' || o.status === 'cancelled') ? o.status : (o.status || 'cooking')
        };
      }
      return o;
    }));

    // 2. Generate separate transaction receipt for EACH order batch
    ordersToPay.forEach((item, idx) => {
      const order = item.order || orders.find(o => o.id === item.id);
      const tableNum = order?.tableNumber || activeTableNumber;
      affectedTableNumbers.add(tableNum);
      const tableName = order?.tableName || `Bàn ${tableNum}`;
      const orderNumber = order?.orderNumber || `#${item.id.slice(-4)}`;
      const itemsList = order?.items && order.items.length > 0 
        ? order.items.map(i => `${i.name} x${i.quantity}`).join(', ') 
        : 'Thực đơn gọi món';
      const customerPayer = order?.customerName || `Khách ${tableName}`;
      const effectiveAmount = typeof item.amount === 'number' && item.amount > 0 ? item.amount : (order?.totalAmount || 0);

      if (effectiveAmount > 0) {
        const receipt: CashTransaction = {
          id: `tx-auto-${item.id}-${Date.now()}-${idx}`,
          receiptNumber: `PT-${dateStr.replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`,
          type: 'income',
          category: 'sales',
          categoryName: 'Doanh thu bán hàng',
          amount: effectiveAmount,
          title: `Thu tiền ${tableName} (${orderNumber})`,
          description: `Thanh toán ${(item.paymentMethod || order?.paymentMethod || 'vietqr').toUpperCase()}. Món: ${itemsList}`,
          paymentMethod: (item.paymentMethod || order?.paymentMethod || 'vietqr') as any,
          recordedBy: 'Hệ thống POS Thu ngân',
          payerOrRecipient: customerPayer,
          createdAt: Date.now() + idx,
          dateString: dateStr,
          orderId: item.id,
          tableNumber: tableNum
        };
        generatedReceipts.push(receipt);
      }
    });

    // 3. Reset table status if all orders at table are paid
    setTables(prev => prev.map(t => {
      if (affectedTableNumbers.has(t.number)) {
        const otherUnpaid = orders.filter(o => o.tableNumber === t.number && !orderIds.has(o.id) && o.paymentStatus === 'unpaid');
        if (otherUnpaid.length === 0) {
          return { ...t, status: 'empty', activeOrderId: undefined };
        }
      }
      return t;
    }));

    // 4. Update transactions state & localStorage
    if (generatedReceipts.length > 0) {
      setTransactions(prev => {
        const newOrderIds = new Set(generatedReceipts.map(r => r.orderId));
        const filtered = prev.filter(t => !t.orderId || !newOrderIds.has(t.orderId));
        const next = [...generatedReceipts, ...filtered];
        try {
          localStorage.setItem('qr_dinein_transactions', JSON.stringify(next));
        } catch {}
        return next;
      });
    }

    playNotificationSound('success');

    // 5. Broadcast to cloud sync
    broadcastRealtimeEvent({
      type: 'PAY_ORDER',
      data: {
        payments: ordersToPay,
        transactions: generatedReceipts
      }
    }).catch(console.error);

    // 6. Post to batch pay API
    try {
      const res = await fetch('/api/orders/pay-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payments: ordersToPay })
      });
      const data = await res.json();
      if (data && Array.isArray(data.transactions)) {
        setTransactions(data.transactions);
      }
    } catch (err) {
      console.warn('Batch pay API error:', err);
    }
  };

  // Cashflow Management functions
  const addTransaction = async (tx: Omit<CashTransaction, 'id' | 'receiptNumber' | 'createdAt' | 'dateString'>): Promise<CashTransaction> => {
    const d = new Date();
    const dateStr = getLocalDateString(d);
    const prefix = tx.type === 'income' ? 'PT' : 'PC';
    const count = transactions.length + 1;
    const receiptNumber = `${prefix}-${dateStr.replace(/-/g, '')}-${String(count).padStart(3, '0')}`;

    const newTx: CashTransaction = {
      ...tx,
      id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      receiptNumber,
      createdAt: Date.now(),
      dateString: dateStr
    };

    setTransactions(prev => [newTx, ...prev]);
    broadcastRealtimeEvent({ type: 'CASHFLOW_ADD', transaction: newTx }).catch(console.error);

    fetch('/api/cashflow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTx)
    }).catch(console.error);

    return newTx;
  };

  const deleteTransaction = async (id: string): Promise<void> => {
    setTransactions(prev => {
      const next = prev.filter(t => t.id !== id);
      try { localStorage.setItem('qr_dinein_transactions', JSON.stringify(next)); } catch {}
      return next;
    });
    broadcastRealtimeEvent({ type: 'CASHFLOW_DELETE', transactionId: id }).catch(console.error);

    fetch(`/api/cashflow/${id}`, {
      method: 'DELETE'
    }).catch(console.error);
  };

  const clearAllTransactions = async (): Promise<void> => {
    setTransactions([]);
    try { localStorage.setItem('qr_dinein_transactions', JSON.stringify([])); } catch {}
    broadcastRealtimeEvent({ type: 'CASHFLOW_CLEAR' }).catch(console.error);

    fetch('/api/cashflow/all', {
      method: 'DELETE'
    }).catch(console.error);
  };

  const resetTransactionsToDefault = async (): Promise<void> => {
    setTransactions(INITIAL_TRANSACTIONS);
    try { localStorage.setItem('qr_dinein_transactions', JSON.stringify(INITIAL_TRANSACTIONS)); } catch {}
    broadcastRealtimeEvent({ type: 'CASHFLOW_RESET', transactions: INITIAL_TRANSACTIONS }).catch(console.error);

    fetch('/api/cashflow/reset', {
      method: 'POST'
    }).catch(console.error);
  };

  const updateTableStatus = (tableId: string, status: RestaurantTable['status']) => {
    setTables(prev => prev.map(t => t.id === tableId ? { ...t, status } : t));
  };

  const resetTableSession = (tableNumber: string) => {
    setTables(prev => prev.map(t => t.number === tableNumber ? { ...t, status: 'empty', activeOrderId: undefined } : t));
    setOrders(prev => prev.map(o => (o.tableNumber === tableNumber && o.paymentStatus === 'unpaid') ? { ...o, paymentStatus: 'paid', status: 'paid' } : o));
    setCart([]);

    broadcastRealtimeEvent({ type: 'RESET_TABLE', tableNumber }).catch(console.error);

    fetch(`/api/tables/${tableNumber}/reset`, {
      method: 'POST'
    }).catch(console.error);
  };

  // Service Requests
  const requestService = (type: ServiceCallType, customMsg?: string) => {
    const titles: Record<ServiceCallType, string> = {
      call_waiter: 'Gọi nhân viên hỗ trợ',
      refill_water: 'Xin thêm trà đá / nước lọc',
      extra_ice: 'Xin thêm xô đá lạnh',
      request_bill: 'Yêu cầu tính tiền & hóa đơn',
      clean_table: 'Nhờ dọn bàn / lau bàn',
      other: customMsg || 'Yêu cầu hỗ trợ'
    };

    const newCall: ServiceCall = {
      id: `sc-${Date.now()}`,
      tableNumber: activeTableNumber,
      tableName: currentTable.name,
      type,
      message: customMsg || titles[type],
      createdAt: Date.now(),
      status: 'pending'
    };

    setServiceCalls(prev => [newCall, ...prev]);

    // Update table status if calling
    setTables(prev => prev.map(t => {
      if (t.number === activeTableNumber) {
        return {
          ...t,
          status: type === 'request_bill' ? 'waiting_bill' : 'calling_staff'
        };
      }
      return t;
    }));

    playNotificationSound('bell');

    broadcastRealtimeEvent({ type: 'SERVICE_CALL', serviceCall: newCall }).catch(console.error);

    fetch('/api/service-calls', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCall)
    }).catch(console.error);
  };

  const resolveServiceCall = (callId: string) => {
    setServiceCalls(prev => prev.map(c => c.id === callId ? { ...c, status: 'resolved' } : c));
    
    broadcastRealtimeEvent({ type: 'RESOLVE_SERVICE_CALL', callId }).catch(console.error);

    fetch(`/api/service-calls/${callId}/resolve`, {
      method: 'PATCH'
    }).catch(console.error);
  };

  // Quick Test Order Creator (for testing kitchen chime & instant connection)
  const createQuickTestOrder = (targetTableNumber = '05') => {
    const tableObj = tables.find(t => t.number === targetTableNumber) || tables[0];
    const sampleDishes = [
      menuItems.find(m => m.id === 'm1') || menuItems[0],
      menuItems.find(m => m.id === 'm5') || menuItems[1]
    ].filter(Boolean);

    const orderNum = `#${Math.floor(100 + Math.random() * 900)}`;
    const newOrder: TableOrder = {
      id: `ord-test-${Date.now()}`,
      orderNumber: orderNum,
      tableNumber: tableObj.number,
      tableName: tableObj.name,
      customerName: `Khách Thử Nghiệm (${tableObj.name})`,
      createdAt: Date.now(),
      status: 'pending',
      paymentStatus: 'unpaid',
      totalAmount: sampleDishes.reduce((s, d) => s + d.price, 0),
      note: 'Gửi thử nghiệm từ hệ thống để kiểm tra kết nối Bếp',
      items: sampleDishes.map((d, i) => ({
        id: `oi-test-${Date.now()}-${i}`,
        menuItemId: d.id,
        name: d.name,
        price: d.price,
        quantity: 1,
        selectedOptions: [],
        note: '',
        status: 'pending'
      }))
    };

    setOrders(prev => [newOrder, ...prev]);

    setTables(prev => prev.map(t => {
      if (t.number === targetTableNumber) {
        return { ...t, status: 'eating', activeOrderId: newOrder.id };
      }
      return t;
    }));

    playNotificationSound('order');

    broadcastRealtimeEvent({ type: 'NEW_ORDER', order: newOrder }).catch(console.error);

    fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newOrder)
    }).catch(() => {});

    return newOrder;
  };

  return (
    <RestaurantContext.Provider
      value={{
        isAuthenticated,
        currentUser,
        userRole,
        setUserRole,
        switchRole,
        isRoleAllowedTab,
        loginWithAccount,
        loginWithPin,
        logoutUser,
        isManagerAuthenticated,
        setIsManagerAuthenticated,
        loginAsManager,
        logoutManager,
        menuItems,
        setMenuItems,
        toggleDishAvailability,
        updateDish,
        addNewDish,
        deleteDish,
        resetMenuToDefault,
        tables,
        activeTableNumber,
        setActiveTableNumber,
        currentTable,
        updateTableStatus,
        resetTableSession,
        cart,
        addToCart,
        removeFromCart,
        updateCartItemQuantity,
        clearCart,
        cartTotal,
        cartItemCount,
        orders,
        activeTableOrders,
        submitOrder,
        submitDirectOrder,
        createQuickTestOrder,
        updateOrderStatus,
        updateOrderItemStatus,
        payOrder,
        payMultipleOrders,
        serviceCalls,
        requestService,
        resolveServiceCall,
        transactions,
        addTransaction,
        deleteTransaction,
        clearAllTransactions,
        resetTransactionsToDefault,
        isLiveSynced,
        lastSyncedTime,
        refreshServerState,
        kitchenLiveAlert,
        dismissKitchenAlert,
        playNotificationSound,
        restaurantInfo
      }}
    >
      {children}
    </RestaurantContext.Provider>
  );
};

export const useRestaurant = () => {
  const context = useContext(RestaurantContext);
  if (!context) {
    throw new Error('useRestaurant must be used within a RestaurantProvider');
  }
  return context;
};
