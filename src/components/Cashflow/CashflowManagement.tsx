import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  PlusCircle, 
  MinusCircle, 
  Search, 
  Filter, 
  Download, 
  FileText, 
  Printer, 
  Trash2, 
  Eye, 
  Calendar, 
  DollarSign, 
  PieChart, 
  BarChart3, 
  Layers, 
  CheckCircle2, 
  AlertCircle,
  Building2,
  QrCode,
  CreditCard,
  Banknote,
  Sparkles,
  RefreshCw,
  RotateCcw,
  AlertTriangle,
  X
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { CashTransaction, CashflowType } from '../../types';
import { formatVND, formatDate, getLocalDateString } from '../../utils/format';
import { NewTransactionModal } from './NewTransactionModal';
import { ReceiptDetailModal } from './ReceiptDetailModal';
import { CashflowAnalyticsCharts } from './CashflowAnalyticsCharts';

type CashflowMainTab = 'all' | 'charts' | 'ledger';

export const CashflowManagement: React.FC = () => {
  const {
    transactions,
    deleteTransaction,
    clearAllTransactions,
    resetTransactionsToDefault,
    refreshServerState,
    restaurantInfo
  } = useRestaurant();

  // Main navigation tab
  const [activeTab, setActiveTab] = useState<CashflowMainTab>('all');

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [timeFilter, setTimeFilter] = useState<'today' | 'yesterday' | '7days' | 'this_month' | 'all'>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Modals state
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newModalType, setNewModalType] = useState<CashflowType>('expense');
  const [selectedTransaction, setSelectedTransaction] = useState<CashTransaction | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Deletion modals state
  const [transactionToDelete, setTransactionToDelete] = useState<CashTransaction | null>(null);
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Time filtering logic
  const now = new Date();
  const todayStr = getLocalDateString(now);
  
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = getLocalDateString(yesterday);

  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const thisMonthStr = todayStr.slice(0, 7); // YYYY-MM

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      // Type filter
      if (typeFilter !== 'all' && t.type !== typeFilter) return false;

      const txLocalDate = t.createdAt ? getLocalDateString(new Date(t.createdAt)) : t.dateString;

      // Time filter
      if (timeFilter === 'today' && t.dateString !== todayStr && txLocalDate !== todayStr) return false;
      if (timeFilter === 'yesterday' && t.dateString !== yesterdayStr && txLocalDate !== yesterdayStr) return false;
      if (timeFilter === '7days' && new Date(t.dateString) < sevenDaysAgo && (!t.createdAt || t.createdAt < sevenDaysAgo.getTime())) return false;
      if (timeFilter === 'this_month' && !t.dateString.startsWith(thisMonthStr) && !txLocalDate.startsWith(thisMonthStr)) return false;

      // Method filter
      if (methodFilter !== 'all' && t.paymentMethod !== methodFilter) return false;

      // Category filter
      if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchTitle = t.title.toLowerCase().includes(query);
        const matchReceipt = t.receiptNumber.toLowerCase().includes(query);
        const matchPayer = t.payerOrRecipient?.toLowerCase().includes(query) || false;
        const matchDesc = t.description?.toLowerCase().includes(query) || false;
        const matchCat = t.categoryName?.toLowerCase().includes(query) || false;
        if (!matchTitle && !matchReceipt && !matchPayer && !matchDesc && !matchCat) return false;
      }

      return true;
    });
  }, [transactions, typeFilter, timeFilter, methodFilter, categoryFilter, searchQuery, todayStr, yesterdayStr, sevenDaysAgo, thisMonthStr]);

  // Overall Financial Calculations
  const stats = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;
    let incomeCount = 0;
    let expenseCount = 0;
    let cashBalance = 0;
    let bankBalance = 0;

    const expenseByCategory: Record<string, { name: string; amount: number }> = {};
    const incomeByCategory: Record<string, { name: string; amount: number }> = {};

    filteredTransactions.forEach(t => {
      if (t.type === 'income') {
        totalIncome += t.amount;
        incomeCount++;
        if (t.paymentMethod === 'cash') cashBalance += t.amount;
        else bankBalance += t.amount;

        const catKey = t.category || 'other';
        const catName = t.categoryName || 'Thu khác';
        if (!incomeByCategory[catKey]) {
          incomeByCategory[catKey] = { name: catName, amount: 0 };
        }
        incomeByCategory[catKey].amount += t.amount;
      } else {
        totalExpense += t.amount;
        expenseCount++;
        if (t.paymentMethod === 'cash') cashBalance -= t.amount;
        else bankBalance -= t.amount;

        const catKey = t.category || 'other';
        const catName = t.categoryName || 'Chi phí khác';
        if (!expenseByCategory[catKey]) {
          expenseByCategory[catKey] = { name: catName, amount: 0 };
        }
        expenseByCategory[catKey].amount += t.amount;
      }
    });

    const netProfit = totalIncome - totalExpense;
    const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

    // Sort categories by highest spend
    const topExpenseCategories = Object.values(expenseByCategory)
      .sort((a, b) => b.amount - a.amount);

    return {
      totalIncome,
      totalExpense,
      netProfit,
      profitMargin,
      incomeCount,
      expenseCount,
      cashBalance,
      bankBalance,
      topExpenseCategories
    };
  }, [filteredTransactions]);

  const handleOpenNewModal = (type: CashflowType) => {
    setNewModalType(type);
    setIsNewModalOpen(true);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshServerState();
    setTimeout(() => {
      setIsRefreshing(false);
      showToast('Đã làm mới dữ liệu thu chi thành công', 'info');
    }, 400);
  };

  // Confirm delete single transaction
  const handleConfirmDeleteTransaction = async () => {
    if (!transactionToDelete) return;
    const receiptNum = transactionToDelete.receiptNumber;
    await deleteTransaction(transactionToDelete.id);
    setTransactionToDelete(null);
    showToast(`Đã xóa phiếu ${receiptNum} thành công`, 'success');
  };

  // Confirm clear all transactions
  const handleConfirmClearAll = async () => {
    await clearAllTransactions();
    setIsClearAllModalOpen(false);
    showToast('Đã xóa toàn bộ phiếu trong sổ quỹ', 'info');
  };

  // Confirm reset to template
  const handleConfirmReset = async () => {
    await resetTransactionsToDefault();
    setIsResetModalOpen(false);
    showToast('Đã khôi phục dữ liệu sổ quỹ mẫu ban đầu', 'success');
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      showToast('Không có giao dịch nào để xuất báo cáo', 'error');
      return;
    }

    const headers = ['Mã phiếu', 'Ngày ghi nhận', 'Loại', 'Tiêu đề / Lý do', 'Danh mục', 'Số tiền (VNĐ)', 'Hình thức', 'Người nộp/nhận', 'Người lập phiếu', 'Ghi chú'];
    const rows = filteredTransactions.map(t => [
      t.receiptNumber,
      formatDate(t.createdAt),
      t.type === 'income' ? 'THU' : 'CHI',
      `"${t.title.replace(/"/g, '""')}"`,
      `"${t.categoryName || t.category}"`,
      t.amount,
      t.paymentMethod,
      `"${(t.payerOrRecipient || '').replace(/"/g, '""')}"`,
      `"${t.recordedBy.replace(/"/g, '""')}"`,
      `"${(t.description || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `So_Quy_Thu_Chi_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Đã tải xuống file Excel/CSV thành công', 'success');
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 animate-in slide-in-from-top-3 fade-in duration-200">
          <div className={`px-4 py-3 rounded-xl shadow-lg border text-xs font-bold flex items-center gap-2.5 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-900 text-emerald-100 border-emerald-700'
              : toastMessage.type === 'error'
              ? 'bg-rose-900 text-rose-100 border-rose-700'
              : 'bg-stone-900 text-stone-100 border-stone-700'
          }`}>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-stone-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-2xs font-extrabold uppercase bg-amber-100 text-amber-900 border border-amber-200">
              Quản Trị Tài Chính & Sổ Quỹ
            </span>
            <span className="text-2xs text-stone-500">
              • Cập nhật thời gian thực & Biểu đồ theo dõi
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
            Quản Lý Thu - Chi & Sổ Quỹ
          </h1>
          <p className="text-sm text-stone-500 mt-1 max-w-2xl">
            Theo dõi chi tiết dòng tiền doanh thu bán hàng, thu cọc, chi phí nhập nguyên liệu thực phẩm, lương nhân viên và biểu đồ doanh thu theo tháng/năm.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleRefresh}
            title="Làm mới sổ quỹ"
            className="p-2.5 border border-stone-200 hover:bg-stone-50 text-stone-700 rounded-xl transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-amber-600' : ''}`} />
          </button>

          <button
            onClick={() => setIsResetModalOpen(true)}
            title="Khôi phục dữ liệu mẫu ban đầu"
            className="px-3 py-2.5 border border-stone-200 hover:bg-stone-50 text-stone-700 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-stone-500" />
            <span className="hidden sm:inline">Khôi Phục Mẫu</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2.5 border border-stone-200 hover:bg-stone-50 text-stone-700 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-stone-500" />
            <span>Xuất CSV</span>
          </button>

          <button
            onClick={() => handleOpenNewModal('income')}
            className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Lập Phiếu Thu</span>
          </button>

          <button
            onClick={() => handleOpenNewModal('expense')}
            className="px-3.5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm shadow-rose-600/20 transition-all cursor-pointer"
          >
            <MinusCircle className="w-4 h-4" />
            <span>- Lập Phiếu Chi</span>
          </button>
        </div>
      </div>

      {/* Main View Mode Tabs */}
      <div className="flex items-center justify-between gap-3 border-b border-stone-200 pb-3">
        <div className="flex items-center bg-stone-100 p-1.5 rounded-2xl border border-stone-200 gap-1 text-xs font-bold">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'all'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Layers className="w-4 h-4 text-amber-600" />
            <span>Xem Toàn Diện (Biểu Đồ & Sổ Cái)</span>
          </button>

          <button
            onClick={() => setActiveTab('charts')}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'charts'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-emerald-600" />
            <span>Biểu Đồ Doanh Thu & Chi Phí</span>
          </button>

          <button
            onClick={() => setActiveTab('ledger')}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'ledger'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <FileText className="w-4 h-4 text-blue-600" />
            <span>Sổ Cái Giao Dịch ({transactions.length})</span>
          </button>
        </div>

        {/* Clear all action */}
        {transactions.length > 0 && (
          <button
            onClick={() => setIsClearAllModalOpen(true)}
            className="px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-transparent hover:border-rose-200"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Xóa Sạch Sổ Quỹ</span>
          </button>
        )}
      </div>

      {/* 1. Charts Section */}
      {(activeTab === 'all' || activeTab === 'charts') && (
        <div className="space-y-6">
          <CashflowAnalyticsCharts transactions={transactions} />
        </div>
      )}

      {/* 2. Ledger & Filters Section */}
      {(activeTab === 'all' || activeTab === 'ledger') && (
        <div className="space-y-6 pt-2">
          {/* Quick Filters Bar */}
          <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs space-y-3">
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              {/* Search input */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  placeholder="Tìm theo mã phiếu, lý do, người nộp/nhận, ghi chú..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all placeholder:text-stone-400"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Type pill filter */}
              <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs font-bold shrink-0">
                <button
                  onClick={() => setTypeFilter('all')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    typeFilter === 'all' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  Tất cả ({transactions.length})
                </button>
                <button
                  onClick={() => setTypeFilter('income')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                    typeFilter === 'income' ? 'bg-emerald-600 text-white shadow-xs' : 'text-emerald-700 hover:bg-emerald-50'
                  }`}
                >
                  <ArrowUpRight className="w-3.5 h-3.5" /> Thu ({stats.incomeCount})
                </button>
                <button
                  onClick={() => setTypeFilter('expense')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                    typeFilter === 'expense' ? 'bg-rose-600 text-white shadow-xs' : 'text-rose-700 hover:bg-rose-50'
                  }`}
                >
                  <ArrowDownRight className="w-3.5 h-3.5" /> Chi ({stats.expenseCount})
                </button>
              </div>
            </div>

            {/* Sub filters */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-stone-100 text-xs">
              <span className="text-2xs font-bold text-stone-400 flex items-center gap-1 uppercase">
                <Filter className="w-3 h-3" /> Bộ lọc:
              </span>

              {/* Time filter */}
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value as any)}
                className="bg-stone-50 border border-stone-200 text-stone-700 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="all">Toàn bộ thời gian</option>
                <option value="today">Hôm nay</option>
                <option value="yesterday">Hôm qua</option>
                <option value="7days">7 ngày qua</option>
                <option value="this_month">Tháng này</option>
              </select>

              {/* Category filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-stone-50 border border-stone-200 text-stone-700 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="all">Tất cả danh mục</option>
                <optgroup label="Danh mục Thu">
                  <option value="sales">Doanh thu bán hàng</option>
                  <option value="deposit">Thu cọc tiệc</option>
                  <option value="other_income">Thu nhập khác</option>
                </optgroup>
                <optgroup label="Danh mục Chi">
                  <option value="food_ingredients">Thực phẩm tươi sống & Rau củ</option>
                  <option value="beverages_alcohol">Nhập đồ uống & Bia</option>
                  <option value="staff_salary">Lương & Tạm ứng nhân sự</option>
                  <option value="rent_utilities">Mặt bằng & Điện nước</option>
                  <option value="gas_fuel">Gas công nghiệp & Than</option>
                  <option value="supplies_packaging">Vật phẩm & Đóng gói</option>
                  <option value="other_expense">Chi phí khác</option>
                </optgroup>
              </select>

              {/* Payment method filter */}
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="bg-stone-50 border border-stone-200 text-stone-700 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="all">Tất cả hình thức</option>
                <option value="cash">💵 Tiền mặt</option>
                <option value="vietqr">📲 VietQR</option>
                <option value="transfer">🏦 Chuyển khoản</option>
                <option value="card">💳 Quẹt thẻ</option>
                <option value="momo">🟣 Ví MoMo</option>
              </select>

              {/* Reset filter button */}
              {(typeFilter !== 'all' || timeFilter !== 'all' || methodFilter !== 'all' || categoryFilter !== 'all' || searchQuery) && (
                <button
                  onClick={() => {
                    setTypeFilter('all');
                    setTimeFilter('all');
                    setMethodFilter('all');
                    setCategoryFilter('all');
                    setSearchQuery('');
                  }}
                  className="text-2xs text-amber-700 hover:text-amber-800 font-bold ml-auto underline cursor-pointer"
                >
                  Xóa bộ lọc
                </button>
              )}
            </div>
          </div>

          {/* Transactions Ledger Table */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-stone-50/50">
              <div>
                <h3 className="font-bold text-stone-900 text-base">
                  Sổ Cái Giao Dịch Thu - Chi ({filteredTransactions.length})
                </h3>
                <p className="text-2xs text-stone-500 mt-0.5">
                  Danh sách chi tiết các phiếu thu và chi tiền mặt, ngân hàng (Có nút xóa và xem phiếu)
                </p>
              </div>

              <span className="text-xs font-bold text-stone-600 font-mono">
                Tổng: <span className="text-emerald-700">+{formatVND(stats.totalIncome)}</span> | <span className="text-rose-700">-{formatVND(stats.totalExpense)}</span>
              </span>
            </div>

            {filteredTransactions.length === 0 ? (
              <div className="p-12 text-center text-stone-500 space-y-3">
                <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto text-stone-400">
                  <FileText className="w-6 h-6" />
                </div>
                <p className="font-semibold text-sm">Không tìm thấy phiếu thu/chi nào phù hợp</p>
                <p className="text-xs text-stone-400">Nhấn nút "+ Lập Phiếu Thu" hoặc "- Lập Phiếu Chi" để tạo giao dịch mới</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-stone-200 bg-stone-100/70 text-stone-600 font-bold uppercase tracking-wider text-2xs">
                      <th className="py-3 px-4">Mã Phiếu</th>
                      <th className="py-3 px-4">Ngày giờ</th>
                      <th className="py-3 px-4">Loại</th>
                      <th className="py-3 px-4">Nội dung / Lý do</th>
                      <th className="py-3 px-4">Danh mục</th>
                      <th className="py-3 px-4">Người nộp/nhận</th>
                      <th className="py-3 px-4">Hình thức</th>
                      <th className="py-3 px-4 text-right">Số tiền</th>
                      <th className="py-3 px-4 text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredTransactions.map((tx) => {
                      const isIncome = tx.type === 'income';
                      return (
                        <tr key={tx.id} className="hover:bg-stone-50/80 transition-colors">
                          {/* Receipt number */}
                          <td className="py-3 px-4 font-mono font-bold text-stone-800">
                            {tx.receiptNumber}
                          </td>

                          {/* Date */}
                          <td className="py-3 px-4 text-stone-500 whitespace-nowrap">
                            {formatDate(tx.createdAt)}
                          </td>

                          {/* Type badge */}
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-extrabold uppercase ${
                              isIncome 
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                                : 'bg-rose-100 text-rose-800 border border-rose-200'
                            }`}>
                              {isIncome ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                              {isIncome ? 'Thu' : 'Chi'}
                            </span>
                          </td>

                          {/* Title & Description */}
                          <td className="py-3 px-4 max-w-xs">
                            <div className="font-bold text-stone-900 truncate">
                              {tx.title}
                            </div>
                            {tx.description && (
                              <div className="text-2xs text-stone-500 truncate max-w-xs mt-0.5">
                                {tx.description}
                              </div>
                            )}
                            {tx.tableNumber && (
                              <span className="inline-block mt-0.5 text-3xs font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                                Bàn {tx.tableNumber}
                              </span>
                            )}
                          </td>

                          {/* Category */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="font-medium text-stone-700 bg-stone-100 px-2 py-0.5 rounded text-2xs">
                              {tx.categoryName || tx.category}
                            </span>
                          </td>

                          {/* Payer or Recipient */}
                          <td className="py-3 px-4 text-stone-700 font-medium whitespace-nowrap">
                            {tx.payerOrRecipient || 'Trực tiếp'}
                          </td>

                          {/* Payment method */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="text-2xs font-semibold text-stone-600 flex items-center gap-1">
                              {tx.paymentMethod === 'vietqr' && <QrCode className="w-3.5 h-3.5 text-blue-600" />}
                              {tx.paymentMethod === 'cash' && <Banknote className="w-3.5 h-3.5 text-emerald-600" />}
                              {tx.paymentMethod === 'card' && <CreditCard className="w-3.5 h-3.5 text-purple-600" />}
                              {tx.paymentMethod === 'transfer' && <Building2 className="w-3.5 h-3.5 text-sky-600" />}
                              {tx.paymentMethod === 'vietqr' ? 'VietQR' : tx.paymentMethod === 'cash' ? 'Tiền mặt' : tx.paymentMethod === 'card' ? 'Thẻ' : 'CK Ngân hàng'}
                            </span>
                          </td>

                          {/* Amount */}
                          <td className="py-3 px-4 text-right whitespace-nowrap font-mono">
                            <span className={`font-black text-sm ${
                              isIncome ? 'text-emerald-700' : 'text-rose-700'
                            }`}>
                              {isIncome ? `+${formatVND(tx.amount)}` : `-${formatVND(tx.amount)}`}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => setSelectedTransaction(tx)}
                                title="Xem & In Phiếu"
                                className="p-1.5 hover:bg-stone-100 text-stone-600 hover:text-stone-900 rounded-lg transition-colors cursor-pointer"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => setTransactionToDelete(tx)}
                                title="Xóa phiếu này"
                                className="p-1.5 hover:bg-rose-50 text-stone-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      <NewTransactionModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        defaultType={newModalType}
      />

      <ReceiptDetailModal
        transaction={selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
        onDelete={(id) => {
          deleteTransaction(id);
          showToast('Đã xóa phiếu thành công', 'success');
        }}
      />

      {/* 1. Delete Single Transaction Confirmation Modal */}
      {transactionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-base text-stone-900">
                  Xác Nhận Xóa Phiếu Thu / Chi?
                </h3>
                <p className="text-xs text-stone-500 mt-1">
                  Phiếu này sẽ bị xóa vĩnh viễn khỏi sổ quỹ và cơ sở dữ liệu hệ thống.
                </p>
              </div>
              <button
                onClick={() => setTransactionToDelete(null)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Summary preview */}
            <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 text-xs space-y-2 font-mono">
              <div className="flex justify-between">
                <span className="text-stone-500 font-sans">Mã phiếu:</span>
                <span className="font-bold text-stone-900">{transactionToDelete.receiptNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500 font-sans">Nội dung:</span>
                <span className="font-bold text-stone-900 truncate max-w-[200px]">{transactionToDelete.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500 font-sans">Số tiền:</span>
                <span className={`font-black ${transactionToDelete.type === 'income' ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {formatVND(transactionToDelete.amount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500 font-sans">Người lập:</span>
                <span className="text-stone-700">{transactionToDelete.recordedBy}</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setTransactionToDelete(null)}
                className="px-4 py-2 border border-stone-300 hover:bg-stone-100 text-stone-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirmDeleteTransaction}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm shadow-rose-600/20 transition-all cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Xác Nhận Xóa</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Clear All Transactions Modal */}
      {isClearAllModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-base text-stone-900">
                  Xóa Toàn Bộ Sổ Quỹ?
                </h3>
                <p className="text-xs text-stone-500 mt-1">
                  Thao tác này sẽ xóa sạch tất cả {transactions.length} phiếu thu chi hiện có trong hệ thống. Bạn có thể khôi phục lại dữ liệu mẫu bất cứ lúc nào.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setIsClearAllModalOpen(false)}
                className="px-4 py-2 border border-stone-300 hover:bg-stone-100 text-stone-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirmClearAll}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm shadow-rose-600/20 transition-all cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Xóa Tất Cả</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Reset Template Modal */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-base text-stone-900">
                  Khôi Phục Sổ Quỹ Mẫu Ban Đầu?
                </h3>
                <p className="text-xs text-stone-500 mt-1">
                  Hệ thống sẽ nạp lại bộ dữ liệu sổ quỹ mẫu đầy đủ 12 tháng năm 2026 và năm 2025 với các khoản thu chi chuẩn để bạn tham khảo và theo dõi biểu đồ.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setIsResetModalOpen(false)}
                className="px-4 py-2 border border-stone-300 hover:bg-stone-100 text-stone-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirmReset}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm shadow-amber-600/20 transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Khôi Phục Ngay</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
