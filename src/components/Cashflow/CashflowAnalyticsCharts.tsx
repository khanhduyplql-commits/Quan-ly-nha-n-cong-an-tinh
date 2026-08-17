import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Layers,
  PieChart as PieChartIcon,
  BarChart3,
  Award,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  ChevronDown,
  Info
} from 'lucide-react';
import { CashTransaction } from '../../types';
import { formatVND } from '../../utils/format';

interface CashflowAnalyticsChartsProps {
  transactions: CashTransaction[];
}

type ChartViewPeriod = 'monthly_by_year' | 'yearly_comparison' | 'daily_by_month';

const PIE_COLORS = [
  '#f43f5e', // rose-500
  '#f59e0b', // amber-500
  '#3b82f6', // blue-500
  '#10b981', // emerald-500
  '#8b5cf6', // violet-500
  '#06b6d4', // cyan-500
  '#ec4899', // pink-500
  '#64748b'  // slate-500
];

export const CashflowAnalyticsCharts: React.FC<CashflowAnalyticsChartsProps> = ({ transactions }) => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1; // 1-12

  const [viewPeriod, setViewPeriod] = useState<ChartViewPeriod>('monthly_by_year');
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [chartType, setChartType] = useState<'composed' | 'bar' | 'area'>('composed');

  // Extract available years from transactions
  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>();
    yearsSet.add(currentYear);
    yearsSet.add(currentYear - 1);
    transactions.forEach(t => {
      if (t.dateString) {
        const y = parseInt(t.dateString.slice(0, 4), 10);
        if (!isNaN(y)) yearsSet.add(y);
      } else if (t.createdAt) {
        const y = new Date(t.createdAt).getFullYear();
        if (!isNaN(y)) yearsSet.add(y);
      }
    });
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [transactions, currentYear]);

  // 1. Monthly data for the selected year (12 months)
  const monthlyData = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => {
      const monthNum = i + 1;
      return {
        monthKey: `${selectedYear}-${String(monthNum).padStart(2, '0')}`,
        name: `Thg ${monthNum}`,
        fullName: `Tháng ${monthNum}/${selectedYear}`,
        monthNum,
        income: 0,
        expense: 0,
        netProfit: 0,
        incomeCount: 0,
        expenseCount: 0
      };
    });

    transactions.forEach(t => {
      let tYear = 0;
      let tMonth = 0;

      if (t.dateString && t.dateString.length >= 7) {
        tYear = parseInt(t.dateString.slice(0, 4), 10);
        tMonth = parseInt(t.dateString.slice(5, 7), 10);
      } else if (t.createdAt) {
        const d = new Date(t.createdAt);
        tYear = d.getFullYear();
        tMonth = d.getMonth() + 1;
      }

      if (tYear === selectedYear && tMonth >= 1 && tMonth <= 12) {
        const m = months[tMonth - 1];
        if (t.type === 'income') {
          m.income += t.amount;
          m.incomeCount++;
        } else {
          m.expense += t.amount;
          m.expenseCount++;
        }
      }
    });

    months.forEach(m => {
      m.netProfit = m.income - m.expense;
    });

    return months;
  }, [transactions, selectedYear]);

  // 2. Yearly comparison data across all available years
  const yearlyData = useMemo(() => {
    const yearMap: Record<number, { year: number; name: string; income: number; expense: number; netProfit: number; profitMargin: number; txCount: number }> = {};

    availableYears.forEach(y => {
      yearMap[y] = {
        year: y,
        name: `Năm ${y}`,
        income: 0,
        expense: 0,
        netProfit: 0,
        profitMargin: 0,
        txCount: 0
      };
    });

    transactions.forEach(t => {
      let tYear = 0;
      if (t.dateString && t.dateString.length >= 4) {
        tYear = parseInt(t.dateString.slice(0, 4), 10);
      } else if (t.createdAt) {
        tYear = new Date(t.createdAt).getFullYear();
      }

      if (yearMap[tYear]) {
        yearMap[tYear].txCount++;
        if (t.type === 'income') {
          yearMap[tYear].income += t.amount;
        } else {
          yearMap[tYear].expense += t.amount;
        }
      }
    });

    return Object.values(yearMap)
      .sort((a, b) => a.year - b.year)
      .map(y => {
        const net = y.income - y.expense;
        const margin = y.income > 0 ? (net / y.income) * 100 : 0;
        return {
          ...y,
          netProfit: net,
          profitMargin: margin
        };
      });
  }, [transactions, availableYears]);

  // 3. Daily breakdown for the selected month in selected year
  const dailyData = useMemo(() => {
    // Days in month
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    const days = Array.from({ length: daysInMonth }, (_, i) => {
      const dayNum = i + 1;
      const dayStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      return {
        dateStr: dayStr,
        name: `${dayNum}`,
        fullName: `${dayNum}/${selectedMonth}`,
        dayNum,
        income: 0,
        expense: 0,
        netProfit: 0
      };
    });

    transactions.forEach(t => {
      let tYear = 0;
      let tMonth = 0;
      let tDay = 0;

      if (t.dateString && t.dateString.length >= 10) {
        tYear = parseInt(t.dateString.slice(0, 4), 10);
        tMonth = parseInt(t.dateString.slice(5, 7), 10);
        tDay = parseInt(t.dateString.slice(8, 10), 10);
      } else if (t.createdAt) {
        const d = new Date(t.createdAt);
        tYear = d.getFullYear();
        tMonth = d.getMonth() + 1;
        tDay = d.getDate();
      }

      if (tYear === selectedYear && tMonth === selectedMonth && tDay >= 1 && tDay <= daysInMonth) {
        const d = days[tDay - 1];
        if (t.type === 'income') {
          d.income += t.amount;
        } else {
          d.expense += t.amount;
        }
      }
    });

    days.forEach(d => {
      d.netProfit = d.income - d.expense;
    });

    return days;
  }, [transactions, selectedYear, selectedMonth]);

  // 4. Expense category distribution in the selected year
  const categoryDistribution = useMemo(() => {
    const catMap: Record<string, { name: string; value: number; count: number }> = {};

    transactions.forEach(t => {
      let tYear = 0;
      if (t.dateString && t.dateString.length >= 4) {
        tYear = parseInt(t.dateString.slice(0, 4), 10);
      } else if (t.createdAt) {
        tYear = new Date(t.createdAt).getFullYear();
      }

      if (tYear === selectedYear && t.type === 'expense') {
        const catName = t.categoryName || t.category || 'Chi phí khác';
        if (!catMap[catName]) {
          catMap[catName] = { name: catName, value: 0, count: 0 };
        }
        catMap[catName].value += t.amount;
        catMap[catName].count++;
      }
    });

    return Object.values(catMap).sort((a, b) => b.value - a.value);
  }, [transactions, selectedYear]);

  // High-level KPI for selected period
  const periodKpis = useMemo(() => {
    if (viewPeriod === 'yearly_comparison') {
      const totalInc = yearlyData.reduce((s, y) => s + y.income, 0);
      const totalExp = yearlyData.reduce((s, y) => s + y.expense, 0);
      const totalNet = totalInc - totalExp;
      const margin = totalInc > 0 ? (totalNet / totalInc) * 100 : 0;
      const bestYear = [...yearlyData].sort((a, b) => b.income - a.income)[0];

      return {
        title: 'Toàn Bộ Các Năm',
        totalIncome: totalInc,
        totalExpense: totalExp,
        netProfit: totalNet,
        profitMargin: margin,
        highlightTitle: 'Năm Đạt Đỉnh',
        highlightValue: bestYear ? `${bestYear.name} (${formatVND(bestYear.income)})` : 'Chưa có',
        avgMonthlyIncome: yearlyData.length > 0 ? totalInc / (yearlyData.length * 12) : 0
      };
    } else if (viewPeriod === 'daily_by_month') {
      const totalInc = dailyData.reduce((s, d) => s + d.income, 0);
      const totalExp = dailyData.reduce((s, d) => s + d.expense, 0);
      const totalNet = totalInc - totalExp;
      const margin = totalInc > 0 ? (totalNet / totalInc) * 100 : 0;
      const bestDay = [...dailyData].sort((a, b) => b.income - a.income)[0];

      return {
        title: `Tháng ${selectedMonth}/${selectedYear}`,
        totalIncome: totalInc,
        totalExpense: totalExp,
        netProfit: totalNet,
        profitMargin: margin,
        highlightTitle: 'Ngày Doanh Thu Cao Nhất',
        highlightValue: bestDay && bestDay.income > 0 ? `Ngày ${bestDay.dayNum} (${formatVND(bestDay.income)})` : 'Chưa có',
        avgMonthlyIncome: dailyData.length > 0 ? totalInc / dailyData.length : 0
      };
    } else {
      // Monthly by year
      const totalInc = monthlyData.reduce((s, m) => s + m.income, 0);
      const totalExp = monthlyData.reduce((s, m) => s + m.expense, 0);
      const totalNet = totalInc - totalExp;
      const margin = totalInc > 0 ? (totalNet / totalInc) * 100 : 0;
      const bestMonth = [...monthlyData].sort((a, b) => b.income - a.income)[0];
      const highestExpMonth = [...monthlyData].sort((a, b) => b.expense - a.expense)[0];

      return {
        title: `Cả Năm ${selectedYear}`,
        totalIncome: totalInc,
        totalExpense: totalExp,
        netProfit: totalNet,
        profitMargin: margin,
        highlightTitle: 'Tháng Doanh Thu Cao Nhất',
        highlightValue: bestMonth && bestMonth.income > 0 ? `${bestMonth.fullName} (${formatVND(bestMonth.income)})` : 'Chưa có',
        avgMonthlyIncome: totalInc / 12,
        highestExpMonth: highestExpMonth && highestExpMonth.expense > 0 ? `${highestExpMonth.fullName} (${formatVND(highestExpMonth.expense)})` : 'Chưa có'
      };
    }
  }, [viewPeriod, monthlyData, yearlyData, dailyData, selectedYear, selectedMonth]);

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]?.payload;
      const title = data?.fullName || data?.name || label;
      return (
        <div className="bg-stone-900/95 backdrop-blur-sm text-white p-3.5 rounded-xl shadow-xl border border-stone-700 text-xs min-w-[200px] z-50">
          <p className="font-bold text-stone-200 border-b border-stone-700 pb-1.5 mb-2 flex items-center justify-between">
            <span>{title}</span>
            {data?.profitMargin !== undefined && (
              <span className="text-3xs px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
                Tỷ suất: {data.profitMargin.toFixed(1)}%
              </span>
            )}
          </p>
          <div className="space-y-1.5 font-mono">
            {payload.map((item: any, idx: number) => {
              const isInc = item.dataKey === 'income';
              const isExp = item.dataKey === 'expense';
              const isNet = item.dataKey === 'netProfit';
              return (
                <div key={idx} className="flex justify-between items-center gap-4">
                  <span className="flex items-center gap-1.5 text-stone-300 text-2xs">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color || item.fill }} />
                    {isInc ? 'Doanh thu (Thu)' : isExp ? 'Chi phí (Chi)' : isNet ? 'Lãi thuần (Ròng)' : item.name}:
                  </span>
                  <span className={`font-bold ${isInc ? 'text-emerald-400' : isExp ? 'text-rose-400' : isNet ? 'text-amber-400' : 'text-stone-200'}`}>
                    {formatVND(item.value)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const totalExpense = categoryDistribution.reduce((s, c) => s + c.value, 0);
      const percent = totalExpense > 0 ? ((data.value / totalExpense) * 100).toFixed(1) : '0';
      return (
        <div className="bg-stone-900/95 backdrop-blur-sm text-white p-3 rounded-xl shadow-xl border border-stone-700 text-xs z-50">
          <p className="font-bold text-stone-200 mb-1">{data.name}</p>
          <div className="space-y-1 font-mono text-2xs">
            <div className="flex justify-between gap-4">
              <span className="text-stone-400">Số tiền:</span>
              <span className="font-bold text-rose-400">{formatVND(data.value)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-stone-400">Tỷ lệ chiếm:</span>
              <span className="font-bold text-amber-300">{percent}%</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Control Header & Filters */}
      <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-2xs font-extrabold uppercase bg-emerald-100 text-emerald-900 border border-emerald-200 flex items-center gap-1">
              <BarChart3 className="w-3 h-3 text-emerald-700" />
              Biểu Đồ Tài Chính Trực Quan
            </span>
            <span className="text-2xs text-stone-500">
              • Tự động tổng hợp theo Tháng & Năm
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
            Theo Dõi Doanh Thu, Chi Phí & Lợi Nhuận
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Phân tích chi tiết biến động dòng tiền, tỷ suất sinh lời và cơ cấu chi phí nhà hàng.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* View Period Selector Tabs */}
          <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs font-bold">
            <button
              onClick={() => setViewPeriod('monthly_by_year')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewPeriod === 'monthly_by_year'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              📅 12 Tháng / Năm
            </button>
            <button
              onClick={() => setViewPeriod('yearly_comparison')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewPeriod === 'yearly_comparison'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              📈 So Sánh Các Năm
            </button>
            <button
              onClick={() => setViewPeriod('daily_by_month')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewPeriod === 'daily_by_month'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              📆 Từng Ngày / Tháng
            </button>
          </div>

          {/* Year selector */}
          <div className="flex items-center gap-1.5 bg-stone-50 px-3 py-1.5 rounded-xl border border-stone-200">
            <span className="text-2xs font-bold text-stone-500">Năm:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
              className="bg-transparent text-xs font-bold text-stone-900 focus:outline-none cursor-pointer"
            >
              {availableYears.map(y => (
                <option key={y} value={y}>Năm {y}</option>
              ))}
            </select>
          </div>

          {/* Month selector (only for daily view) */}
          {viewPeriod === 'daily_by_month' && (
            <div className="flex items-center gap-1.5 bg-stone-50 px-3 py-1.5 rounded-xl border border-stone-200">
              <span className="text-2xs font-bold text-stone-500">Tháng:</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
                className="bg-transparent text-xs font-bold text-stone-900 focus:outline-none cursor-pointer"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                  <option key={m} value={m}>Tháng {m}</option>
                ))}
              </select>
            </div>
          )}

          {/* Chart visual type */}
          <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs font-semibold">
            <button
              onClick={() => setChartType('composed')}
              title="Biểu đồ kết hợp Cột & Đường"
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                chartType === 'composed' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              Cột + Đường
            </button>
            <button
              onClick={() => setChartType('bar')}
              title="Biểu đồ Cột Thu - Chi"
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                chartType === 'bar' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              Cột
            </button>
            <button
              onClick={() => setChartType('area')}
              title="Biểu đồ Vùng Dòng tiền"
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                chartType === 'area' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              Vùng
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards for the Active View */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Income */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              Tổng Thu ({periodKpis.title})
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-700 tracking-tight">
              {formatVND(periodKpis.totalIncome)}
            </div>
            <div className="text-2xs text-stone-500 mt-1 flex items-center gap-1">
              <span className="font-semibold text-emerald-800">TB: {formatVND(periodKpis.avgMonthlyIncome)}/{viewPeriod === 'daily_by_month' ? 'ngày' : 'tháng'}</span>
            </div>
          </div>
        </div>

        {/* Total Expense */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              Tổng Chi ({periodKpis.title})
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-rose-700 tracking-tight">
              {formatVND(periodKpis.totalExpense)}
            </div>
            <div className="text-2xs text-stone-500 mt-1">
              Tỷ lệ chi phí: <span className="font-bold text-stone-700">
                {periodKpis.totalIncome > 0 ? ((periodKpis.totalExpense / periodKpis.totalIncome) * 100).toFixed(1) : 0}%
              </span> doanh thu
            </div>
          </div>
        </div>

        {/* Net Profit */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              Lợi Nhuận Ròng (Lãi)
            </span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              periodKpis.netProfit >= 0 ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'
            }`}>
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className={`text-2xl font-black tracking-tight ${
              periodKpis.netProfit >= 0 ? 'text-amber-600' : 'text-rose-600'
            }`}>
              {periodKpis.netProfit >= 0 ? `+${formatVND(periodKpis.netProfit)}` : formatVND(periodKpis.netProfit)}
            </div>
            <div className="text-2xs text-stone-500 mt-1 flex items-center gap-1">
              <span className={`px-2 py-0.5 rounded-full font-bold text-3xs ${
                periodKpis.profitMargin >= 20 
                  ? 'bg-emerald-100 text-emerald-800' 
                  : periodKpis.profitMargin >= 0 
                  ? 'bg-amber-100 text-amber-800' 
                  : 'bg-rose-100 text-rose-800'
              }`}>
                Tỷ suất: {periodKpis.profitMargin.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Highlights */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              {periodKpis.highlightTitle}
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-sm font-black text-stone-900 tracking-tight leading-snug">
              {periodKpis.highlightValue}
            </div>
            <div className="text-2xs text-stone-500 mt-1">
              {viewPeriod === 'monthly_by_year' ? 'Mùa vụ bán hàng tốt nhất' : 'Số liệu kinh doanh tổng hợp'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Main Bar/Line Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-stone-200 shadow-xs flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-stone-100">
            <div>
              <h3 className="font-bold text-stone-900 text-base flex items-center gap-2">
                <span>Biểu Đồ Doanh Thu & Chi Phí ({viewPeriod === 'monthly_by_year' ? `Năm ${selectedYear}` : viewPeriod === 'yearly_comparison' ? 'So Sánh Các Năm' : `Tháng ${selectedMonth}/${selectedYear}`})</span>
              </h3>
              <p className="text-2xs text-stone-500 mt-0.5">
                Cột xanh: Doanh thu (Thu) • Cột đỏ: Chi phí (Chi) • Đường vàng: Lãi ròng
              </p>
            </div>

            {/* Legend indicators */}
            <div className="flex items-center gap-3 text-2xs font-bold">
              <span className="flex items-center gap-1 text-emerald-700">
                <span className="w-3 h-3 rounded-xs bg-emerald-500 inline-block" /> Thu
              </span>
              <span className="flex items-center gap-1 text-rose-700">
                <span className="w-3 h-3 rounded-xs bg-rose-500 inline-block" /> Chi
              </span>
              <span className="flex items-center gap-1 text-amber-700">
                <span className="w-3 h-1 bg-amber-500 inline-block" /> Lãi ròng
              </span>
            </div>
          </div>

          {/* Chart Canvas */}
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'area' ? (
                <AreaChart
                  data={viewPeriod === 'monthly_by_year' ? monthlyData : viewPeriod === 'yearly_comparison' ? yearlyData : dailyData}
                  margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                    </linearGradient>
                    <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0}/>
                    </linearGradient>
                    <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#6b7280" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="#6b7280"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => val >= 1000000 ? `${(val / 1000000).toFixed(0)}Tr` : `${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="income" name="Doanh thu" stroke="#10b981" fillOpacity={1} fill="url(#incomeGrad)" strokeWidth={2} />
                  <Area type="monotone" dataKey="expense" name="Chi phí" stroke="#f43f5e" fillOpacity={1} fill="url(#expenseGrad)" strokeWidth={2} />
                  <Area type="monotone" dataKey="netProfit" name="Lợi nhuận" stroke="#f59e0b" fillOpacity={1} fill="url(#profitGrad)" strokeWidth={2} />
                </AreaChart>
              ) : chartType === 'bar' ? (
                <BarChart
                  data={viewPeriod === 'monthly_by_year' ? monthlyData : viewPeriod === 'yearly_comparison' ? yearlyData : dailyData}
                  margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#6b7280" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="#6b7280"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => val >= 1000000 ? `${(val / 1000000).toFixed(0)}Tr` : `${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="income" name="Doanh thu" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={30} />
                  <Bar dataKey="expense" name="Chi phí" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={30} />
                  <Bar dataKey="netProfit" name="Lợi nhuận" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={30} />
                </BarChart>
              ) : (
                /* Composed Bar + Line */
                <ComposedChart
                  data={viewPeriod === 'monthly_by_year' ? monthlyData : viewPeriod === 'yearly_comparison' ? yearlyData : dailyData}
                  margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#6b7280" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="#6b7280"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => val >= 1000000 ? `${(val / 1000000).toFixed(0)}Tr` : `${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="income" name="Doanh thu" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  <Bar dataKey="expense" name="Chi phí" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  <Line type="monotone" dataKey="netProfit" name="Lãi ròng" stroke="#f59e0b" strokeWidth={3} dot={{ r: 3, fill: '#f59e0b' }} activeDot={{ r: 6 }} />
                </ComposedChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right 1 Col: Expense Category Donut / Breakdown */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-stone-100">
              <div>
                <h3 className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                  <PieChartIcon className="w-4 h-4 text-amber-600" />
                  Cơ Cấu Chi Phí ({selectedYear})
                </h3>
                <p className="text-2xs text-stone-500 mt-0.5">Phân bổ nguồn tiền chi ra</p>
              </div>
              <span className="text-2xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
                {categoryDistribution.length} danh mục
              </span>
            </div>

            {categoryDistribution.length === 0 ? (
              <div className="py-12 text-center text-stone-400 text-xs">
                Chưa có dữ liệu chi phí trong năm {selectedYear}
              </div>
            ) : (
              <div>
                {/* Donut Chart */}
                <div className="h-44 w-full relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip content={<CustomPieTooltip />} />
                      <Pie
                        data={categoryDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {categoryDistribution.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute text-center pointer-events-none">
                    <span className="text-3xs font-bold text-stone-400 block uppercase">Tổng chi</span>
                    <span className="text-xs font-black text-rose-700 font-mono block">
                      {formatVND(categoryDistribution.reduce((s, c) => s + c.value, 0))}
                    </span>
                  </div>
                </div>

                {/* Categories list */}
                <div className="space-y-2 mt-2 max-h-40 overflow-y-auto pr-1">
                  {categoryDistribution.map((cat, idx) => {
                    const total = categoryDistribution.reduce((s, c) => s + c.value, 0);
                    const pct = total > 0 ? ((cat.value / total) * 100).toFixed(1) : '0';
                    return (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 truncate pr-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                          />
                          <span className="text-stone-700 font-medium truncate text-2xs">{cat.name}</span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-bold text-stone-900 text-2xs block font-mono">{formatVND(cat.value)}</span>
                          <span className="text-3xs text-stone-400 block">{pct}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Monthly Detailed Breakdown Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-stone-50/50">
          <div>
            <h3 className="font-bold text-stone-900 text-sm sm:text-base">
              Bảng Tổng Hợp Chi Tiết 12 Tháng Năm {selectedYear}
            </h3>
            <p className="text-2xs text-stone-500 mt-0.5">
              Chi tiết doanh thu, chi phí, lãi ròng và tỷ suất sinh lời từng tháng
            </p>
          </div>

          <div className="text-xs font-bold text-stone-600">
            Lãi ròng cả năm: <span className="text-amber-600 font-mono">{formatVND(periodKpis.netProfit)}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-100/70 text-stone-600 font-bold uppercase tracking-wider text-2xs">
                <th className="py-3 px-4">Thời gian</th>
                <th className="py-3 px-4 text-right">Doanh Thu (Thu)</th>
                <th className="py-3 px-4 text-right">Chi Phí (Chi)</th>
                <th className="py-3 px-4 text-right">Lợi Nhuận Ròng</th>
                <th className="py-3 px-4 text-center">Tỷ Suất Lời</th>
                <th className="py-3 px-4 text-center">Số Phiếu</th>
                <th className="py-3 px-4 text-center">Đánh Giá</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-mono">
              {monthlyData.map((m) => {
                const margin = m.income > 0 ? (m.netProfit / m.income) * 100 : 0;
                const hasData = m.income > 0 || m.expense > 0;
                return (
                  <tr key={m.monthNum} className="hover:bg-stone-50/80 transition-colors">
                    <td className="py-3 px-4 font-sans font-bold text-stone-800">
                      {m.fullName}
                      {m.monthNum === currentMonth && selectedYear === currentYear && (
                        <span className="ml-2 text-3xs font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-sans">
                          Hiện tại
                        </span>
                      )}
                    </td>

                    {/* Income */}
                    <td className="py-3 px-4 text-right font-bold text-emerald-700">
                      {hasData ? `+${formatVND(m.income)}` : '0 đ'}
                    </td>

                    {/* Expense */}
                    <td className="py-3 px-4 text-right font-bold text-rose-700">
                      {hasData ? `-${formatVND(m.expense)}` : '0 đ'}
                    </td>

                    {/* Net Profit */}
                    <td className="py-3 px-4 text-right font-black">
                      <span className={m.netProfit >= 0 ? 'text-amber-600' : 'text-rose-600'}>
                        {m.netProfit >= 0 ? `+${formatVND(m.netProfit)}` : formatVND(m.netProfit)}
                      </span>
                    </td>

                    {/* Profit Margin */}
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-2xs font-bold ${
                        margin >= 25 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : margin >= 0 
                          ? 'bg-amber-100 text-amber-800' 
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {margin.toFixed(1)}%
                      </span>
                    </td>

                    {/* Tx count */}
                    <td className="py-3 px-4 text-center text-stone-500 font-sans text-2xs">
                      {m.incomeCount + m.expenseCount} GD
                    </td>

                    {/* Status badge */}
                    <td className="py-3 px-4 text-center font-sans">
                      {!hasData ? (
                        <span className="text-stone-400 text-3xs">Chưa phát sinh</span>
                      ) : m.netProfit > 15000000 ? (
                        <span className="text-emerald-700 text-3xs font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          🌟 Siêu lợi nhuận
                        </span>
                      ) : m.netProfit > 0 ? (
                        <span className="text-amber-700 text-3xs font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          ✅ Kinh doanh tốt
                        </span>
                      ) : (
                        <span className="text-rose-700 text-3xs font-bold bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                          ⚠️ Cần tối ưu chi phí
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
