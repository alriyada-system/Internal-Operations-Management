/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { toast } from 'react-hot-toast';
import { Invoice, Customer, ActivityLog, User, Branch } from '../types';
import { exportToCSV, exportAllDataCSV, exportFinancialReportsExcel, printFinancialReportsPDF } from '../utils/exportUtils';
import MonthlyReports from "./MonthlyReports.tsx";
import MonthlyStatement from "./MonthlyStatement.tsx";
import EmployeeDataSheet from "./EmployeeDataSheet.tsx";
import { 
  TrendingUp, ArrowUp, ArrowDown, ArrowUpDown, 
  FileSpreadsheet, 
  Download, 
  Filter, 
  Coins, 
  FileText, 
  Briefcase, 
  Users,
  Percent,
  Check,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Calendar
} from 'lucide-react';

interface ReportsProps {
  onDayDoubleClick?: (year: number, month: number, day: number) => void;
  invoices: Invoice[];
  customers: Customer[];
  logs: ActivityLog[];
  users: User[];
  branches?: Branch[];
  initialTab?: 'revenue' | 'invoices' | 'debt' | 'accounts' | 'monthly' | 'statement' | 'employees_data';
  tickets?: any[];
  warnings?: any[];
  mails?: any[];
  privateMessages?: any[];
}

export default function Reports({ invoices, customers, logs, users, branches = [], tickets = [], warnings = [], mails = [], privateMessages = [], onDayDoubleClick, initialTab }: ReportsProps) {
  const [activeTab, setActiveTab] = useState<'revenue' | 'invoices' | 'debt' | 'accounts' | 'monthly' | 'statement' | 'employees_data'>(initialTab || 'revenue');
  const [dateFilter, setDateFilter] = useState<'all' | 'month' | 'week'>('all');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');
  const [copiedFinancePDF, setCopiedFinancePDF] = useState(false);
  const [copiedFinanceExcel, setCopiedFinanceExcel] = useState(false);
  const [sortColumn, setSortColumn] = useState<string>('owed');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Employee Performance State
  const currentYear = new Date().getFullYear();
  const [empPerfYear, setEmpPerfYear] = useState<number>(currentYear);
  const [empPerfMonth, setEmpPerfMonth] = useState<string>('all');
  const [empPerfEmployee, setEmpPerfEmployee] = useState<string>('all');
  const [empPerfAmountType, setEmpPerfAmountType] = useState<'collected' | 'billed' | 'all'>('collected');
  const [empPerfSortCol, setEmpPerfSortCol] = useState<'name' | 'billed' | 'collected' | 'percentage'>('percentage');
  const [empPerfSortDir, setEmpPerfSortDir] = useState<'asc' | 'desc'>('desc');

  const handleEmpPerfSort = (col: 'name' | 'billed' | 'collected' | 'percentage') => {
    if (empPerfSortCol === col) {
      setEmpPerfSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setEmpPerfSortCol(col);
      setEmpPerfSortDir('desc');
    }
  };
  
  const EmpSortIcon = ({ column }: { column: string }) => {
    if (empPerfSortCol !== column) return <ArrowUpDown className="w-3 h-3 ml-1 inline text-slate-300 group-hover:text-slate-400 transition-colors" />;
    return empPerfSortDir === 'asc' ? <ArrowUp className="w-3 h-3 ml-1 inline text-indigo-500" /> : <ArrowDown className="w-3 h-3 ml-1 inline text-indigo-500" />;
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (sortColumn !== column) return <ArrowUpDown className="w-3 h-3 ml-1 text-slate-300 group-hover:text-slate-400 transition-colors" />;
    return sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 ml-1 text-indigo-500" /> : <ArrowDown className="w-3 h-3 ml-1 text-indigo-500" />;
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc'); // Default to descending when sorting a new column
    }
  };


  // Helper: Filter invoices based on date and branch
  const getFilteredInvoices = () => {
    const now = new Date();
    return invoices.filter(inv => {
      if (selectedBranchId !== 'all' && inv.branchId !== selectedBranchId) return false;
      const invDate = new Date(inv.createdAt);
      if (dateFilter === 'month') {
      


  return (now.getTime() - invDate.getTime()) <= 30 * 24 * 60 * 60 * 1000;
      }
      if (dateFilter === 'week') {
        return (now.getTime() - invDate.getTime()) <= 7 * 24 * 60 * 60 * 1000;
      }
      return true;
    });
  };

  const filteredInvoices = getFilteredInvoices();

  // 1. Calculations for Revenue Tab
  const totalRevenue = filteredInvoices
    .filter(inv => inv.status === 'paid' || inv.status === 'partially_paid')
    .reduce((sum, inv) => sum + inv.downPayment, 0); // Downpayment is cash on hand

  const totalBilled = filteredInvoices
    .filter(inv => inv.status !== 'draft')
    .reduce((sum, inv) => sum + inv.totalAmount, 0);

  const totalOutstanding = filteredInvoices
    .filter(inv => inv.status !== 'draft')
    .reduce((sum, inv) => sum + inv.remainingAmount, 0);

  // 2. Calculations for Invoice Tab
  const invoiceCount = filteredInvoices.length;
  const paidCount = filteredInvoices.filter(i => i.status === 'paid').length;
  const partialCount = filteredInvoices.filter(i => i.status === 'partially_paid').length;
  const unpaidCount = filteredInvoices.filter(i => i.status === 'unpaid').length;
  const draftCount = filteredInvoices.filter(i => i.status === 'draft').length;

  // 3. Debt/Receivable report
  const debtList = customers.map(c => {
    const customerInvoices = invoices.filter(inv => inv.customerId === c.id && inv.status !== 'draft');
    const totalOwed = customerInvoices.reduce((sum, inv) => sum + inv.remainingAmount, 0);
    const totalTransactions = customerInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    return {
      customer: c,
      owed: totalOwed,
      totalBilled: totalTransactions,
      invoiceCount: customerInvoices.length
    };
  }).filter(item => item.owed > 0).sort((a, b) => {
    let valA, valB;
    switch (sortColumn) {
      case 'name':
        valA = a.customer.name;
        valB = b.customer.name;
        break;
      case 'type':
        valA = a.customer.type;
        valB = b.customer.type;
        break;
      case 'invoiceCount':
        valA = a.invoiceCount;
        valB = b.invoiceCount;
        break;
      case 'totalBilled':
        valA = a.totalBilled;
        valB = b.totalBilled;
        break;
      case 'owed':
      default:
        valA = a.owed;
        valB = b.owed;
        break;
    }
    
    if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
    if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // 4. Accounts breakdown
  const activeCustomers = customers.filter(c => c.status === 'active');
  const lateCustomers = customers.filter(c => c.status === 'late');
  const closedCustomers = customers.filter(c => c.status === 'closed');

  // EXPORT HANDLERS

  
  const handleExportFinancePDF = () => {
    try {
      printFinancialReportsPDF(invoices, customers, branches || []);
      setCopiedFinancePDF(true);
      setTimeout(() => setCopiedFinancePDF(false), 3000);
    } catch (err: any) {
      toast.error("فشل تصدير التقرير المالي: " + err.message);
    }
  };

  const handleExportFinanceExcel = () => {
    try {
      exportFinancialReportsExcel(invoices, customers, branches || []);
      setCopiedFinanceExcel(true);
      setTimeout(() => setCopiedFinanceExcel(false), 3000);
    } catch (err: any) {
      toast.error("فشل تصدير التقرير المالي: " + err.message);
    }
  };

  const handleExportAll = () => {
    exportAllDataCSV(invoices, customers, logs, users, tickets, warnings, mails, privateMessages);
  };

  const exportRevenueTab = () => {
    const headers = ['رقم الفاتورة', 'العميل', 'إجمالي الفاتورة', 'المبلغ المدفوع (مقدم)', 'المبلغ المتبقي', 'تاريخ الفاتورة'];
    const rows = filteredInvoices
      .filter(inv => inv.status !== 'draft')
      .map(inv => {
        const custName = customers.find(c => c.id === inv.customerId)?.name || 'عميل محذوف';
        return [
          inv.invoiceNumber,
          custName,
          inv.totalAmount.toFixed(3),
          inv.downPayment.toFixed(3),
          inv.remainingAmount.toFixed(3),
          new Date(inv.createdAt).toLocaleDateString('ar-OM')
        ];
      });
    exportToCSV(headers, rows, `تقرير_الإيرادات_المنصة_الرقمية_الموحدة_${dateFilter}`);
  };

  const exportInvoicesTab = () => {
    const headers = ['رقم الفاتورة', 'العميل', 'المبلغ المستحق', 'الحالة', 'تاريخ الإصدار', 'الموظف'];
    const rows = filteredInvoices.map(inv => {
      const custName = customers.find(c => c.id === inv.customerId)?.name || 'عميل محذوف';
      const statusLabel = 
        inv.status === 'paid' ? 'مدفوعة' :
        inv.status === 'partially_paid' ? 'مدفوعة جزئياً' :
        inv.status === 'unpaid' ? 'غير مدفوعة' : 'مسودة';
      return [
        inv.invoiceNumber,
        custName,
        inv.totalAmount.toFixed(3),
        statusLabel,
        new Date(inv.createdAt).toLocaleDateString('ar-OM'),
        inv.lastModifiedBy
      ];
    });
    exportToCSV(headers, rows, `تقرير_حالات_الفواتير_المنصة_الرقمية_الموحدة_${dateFilter}`);
  };

  const exportDebtTab = () => {
    const headers = ['اسم العميل', 'النوع', 'رقم الهاتف', 'إجمالي المطالبات المستحقة', 'الديوان المتبقية ر.ع.'];
    const rows = debtList.map(item => [
      item.customer.name,
      item.customer.type === 'individual' ? 'فرد' : 'منشأة',
      item.customer.phone,
      item.totalBilled.toFixed(3),
      item.owed.toFixed(3)
    ]);
    exportToCSV(headers, rows, `تقرير_الديوان_والمستحقات_المنصة_الرقمية_الموحدة`);
  };

  // Employee Performance Calculations
  const uniqueEmpNames = useMemo(() => {
    return Array.from(new Set(invoices.map(inv => inv.createdBy || inv.lastModifiedBy || 'مدير النظام'))).filter(Boolean);
  }, [invoices]);

  const empPerfData = useMemo(() => {
    const empDataMap = new Map<string, { name: string; billed: number; collected: number; percentage: number }>();
    
    filteredInvoices.forEach(inv => {
      const invDate = new Date(inv.createdAt);
      if (invDate.getFullYear() !== empPerfYear) return;
      if (empPerfMonth !== 'all' && invDate.getMonth().toString() !== empPerfMonth) return;
      
      const creator = inv.createdBy || inv.lastModifiedBy || 'مدير النظام';
      if (empPerfEmployee !== 'all' && creator !== empPerfEmployee) return;

      if (!empDataMap.has(creator)) {
        empDataMap.set(creator, { name: creator, billed: 0, collected: 0, percentage: 0 });
      }
      const data = empDataMap.get(creator)!;
      if (inv.status !== 'draft') {
        data.billed += inv.totalAmount;
        if (inv.status === 'paid' || inv.status === 'partially_paid') {
          data.collected += inv.downPayment;
        }
      }
    });

    const result = Array.from(empDataMap.values()).map(item => ({
      ...item,
      percentage: item.billed > 0 ? (item.collected / item.billed) * 100 : 0
    }));

    return result.sort((a, b) => {
      let valA: any = a[empPerfSortCol];
      let valB: any = b[empPerfSortCol];
      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }
      if (valA < valB) return empPerfSortDir === 'asc' ? -1 : 1;
      if (valA > valB) return empPerfSortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredInvoices, empPerfYear, empPerfMonth, empPerfEmployee, empPerfSortCol, empPerfSortDir]);

  const EMP_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#ef4444', '#14b8a6', '#f97316'];

  return (
    <div className="space-y-3 text-right" dir="rtl" id="reports-section">
      {/* Top Banner with Download All Button */}
      {activeTab !== 'monthly' && activeTab !== 'statement' && (
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-5 bg-gradient-to-r from-teal-800 to-blue-900 text-white rounded-2xl shadow-md">
        <div>
          <h2 className="text-xl font-bold">التقارير المالية والتحليلات البيانية</h2>
          <p className="text-xs text-teal-100 mt-1">تتبع إيرادات المكتب والمبالغ المعلقة وحصيلة سند من الفواتير والديوان المتبقية</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Time Filter */}
          <div className="bg-white/10 p-1 rounded-xl flex gap-1 border border-white/10 text-xs">
            <button
              onClick={() => setDateFilter('all')}
              className={`py-1.5 px-3 rounded-lg font-semibold transition-all ${
                dateFilter === 'all' ? 'bg-white text-teal-900 shadow-sm' : 'text-white hover:bg-white/5'
              }`}
            >
              الكل
            </button>
            <button
              onClick={() => setDateFilter('month')}
              className={`py-1.5 px-3 rounded-lg font-semibold transition-all ${
                dateFilter === 'month' ? 'bg-white text-teal-900 shadow-sm' : 'text-white hover:bg-white/5'
              }`}
            >
              آخر 30 يوم
            </button>
            <button
              onClick={() => setDateFilter('week')}
              className={`py-1.5 px-3 rounded-lg font-semibold transition-all ${
                dateFilter === 'week' ? 'bg-white text-teal-900 shadow-sm' : 'text-white hover:bg-white/5'
              }`}
            >
              آخر 7 أيام
            </button>
          </div>

          {/* Export All */}
          <button
            onClick={handleExportAll}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs py-2 px-4 rounded-xl transition-all shadow-lg shadow-emerald-500/10"
            id="download-all-data-btn"
          >
            <Download className="w-4 h-4" />
            تنزيل كافة بيانات النظام (إكسل)
          </button>
        </div>
      </div>
      )}

      
      {activeTab !== 'monthly' && activeTab !== 'statement' && activeTab !== 'employees_data' && (
      <div className="bg-white p-3 border border-slate-200 rounded-xl shadow-xs mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[220px]">
          <label className="text-xs font-bold text-slate-600 whitespace-nowrap">فرع التحكم:</label>
          <select
            value={selectedBranchId}
            onChange={(e) => setSelectedBranchId(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-3 py-1.5 text-xs font-bold focus:ring-2 focus:ring-teal-500 outline-none flex-1"
          >
            <option value="all">كافة الأفرع</option>
            {branches.map(branch => (
              <option key={branch.id} value={branch.id}>{branch.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportFinancePDF}
            className="py-1.5 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
            title="تنزيل تقرير PDF"
          >
            {copiedFinancePDF ? <Check className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
            <span>{copiedFinancePDF ? "تم التصدير!" : "تقرير PDF"}</span>
          </button>

          <button
            onClick={handleExportFinanceExcel}
            className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
            title="تنزيل تقرير إكسل"
          >
            {copiedFinanceExcel ? <Check className="w-3.5 h-3.5" /> : <FileSpreadsheet className="w-3.5 h-3.5" />}
            <span>{copiedFinanceExcel ? "تم التصدير!" : "تنزيل إكسل"}</span>
          </button>
        </div>
      </div>
      )}

      {/* Reports Tabs Navigation */}
      <div className="flex border-b border-slate-200 bg-white p-2 rounded-xl shadow-xs gap-1">

        <button 
          onClick={() => setActiveTab("monthly")} 
          className={`flex items-center gap-2 py-2.5 px-4 rounded-lg text-xs font-bold transition-all ${ 
            activeTab === "monthly" ? "bg-teal-50 text-teal-700 font-extrabold border-b-2 border-teal-600" : "text-slate-500 hover:bg-slate-50" 
          }`} 
        > 
          <Calendar className="w-4 h-4" /> 
          التقارير الشهرية 
        </button>

        <button           onClick={() => setActiveTab("statement")}           className={`flex items-center gap-2 py-2.5 px-4 rounded-lg text-xs font-bold transition-all ${             activeTab === "statement" ? "bg-teal-50 text-teal-700 font-extrabold border-b-2 border-teal-600" : "text-slate-500 hover:bg-slate-50"           }`}         >           <FileSpreadsheet className="w-4 h-4" />           الكشف الشهري         </button>
        <button
          onClick={() => setActiveTab('revenue')}
          className={`flex items-center gap-2 py-2.5 px-4 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'revenue' ? 'bg-teal-50 text-teal-700 font-extrabold border-b-2 border-teal-600' : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <Coins className="w-4 h-4" />
          تقرير الإيرادات والمداخيل
        </button>
        <button
          onClick={() => setActiveTab('invoices')}
          className={`flex items-center gap-2 py-2.5 px-4 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'invoices' ? 'bg-teal-50 text-teal-700 font-extrabold border-b-2 border-teal-600' : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <FileText className="w-4 h-4" />
          تقرير حالات الفواتير
        </button>
        <button
          onClick={() => setActiveTab('debt')}
          className={`flex items-center gap-2 py-2.5 px-4 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'debt' ? 'bg-teal-50 text-teal-700 font-extrabold border-b-2 border-teal-600' : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          تقرير الديون والذمم (الديوان)
        </button>
        <button
          onClick={() => setActiveTab('accounts')}
          className={`flex items-center gap-2 py-2.5 px-4 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'accounts' ? 'bg-teal-50 text-teal-700 font-extrabold border-b-2 border-teal-600' : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <Users className="w-4 h-4" />
          الحسابات النشطة والراكدة
        </button>
        <button
          onClick={() => setActiveTab('employees_data')}
          className={`flex items-center gap-2 py-2.5 px-4 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'employees_data' ? 'bg-teal-50 text-teal-700 font-extrabold border-b-2 border-teal-600' : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          كشف بيانات الموظفين
        </button>
      </div>

      {/* TAB CONTENT: REVENUE */}
      {activeTab === 'revenue' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="revenue-report-view">
          {/* Financial summary Cards */}
          <div className="lg:col-span-4 space-y-2">
            <div className="p-3 bg-white border border-slate-100 rounded-xl shadow-xs space-y-0.5">
              <span className="text-[11px] text-slate-400 font-bold">المبالغ النقدية المحصلة (الإيراد الفعلي):</span>
              <p className="text-xl font-black text-emerald-600 font-mono">{totalRevenue.toFixed(3)} ر.ع.</p>
              <div className="text-[10px] text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-md inline-block font-sans">
                محصلة من الدفعات المقدمة والفواتير المسواة
              </div>
            </div>

            <div className="p-3 bg-white border border-slate-100 rounded-xl shadow-xs space-y-0.5">
              <span className="text-[11px] text-slate-400 font-bold">المبالغ الإجمالية المفوترة:</span>
              <p className="text-xl font-black text-blue-700 font-mono">{totalBilled.toFixed(3)} ر.ع.</p>
              <div className="text-[10px] text-blue-500 bg-blue-50 px-2 py-0.5 rounded-md inline-block font-sans">
                قيمة جميع الفواتير الصادرة بدون المسودات
              </div>
            </div>

            <div className="p-3 bg-white border border-slate-100 rounded-xl shadow-xs space-y-0.5">
              <span className="text-[11px] text-slate-400 font-bold">مبالغ الذمم الدائنة المتبقية (الديون المعلقة):</span>
              <p className="text-xl font-black text-rose-600 font-mono">{totalOutstanding.toFixed(3)} ر.ع.</p>
              <div className="text-[10px] text-rose-500 bg-rose-50 px-2 py-0.5 rounded-md inline-block font-sans">
                أموال مستحقة للمكتب لم يتم دفعها بعد
              </div>
            </div>

            <button
              onClick={exportRevenueTab}
              className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2 rounded-xl transition-all"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              تصدير تقرير الإيرادات إلى إكسل
            </button>
          </div>

          {/* SVG Visual Chart */}
          <div className="lg:col-span-8 bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-700 mb-1">الرسم التوضيحي لهيكل الإيرادات والمستحقات</h3>
              <p className="text-xs text-slate-400">مقارنة بصرية واضحة للمبالغ المعلقة والمدفوعات لخدمات سند المنجزة</p>
            </div>

            <div className="flex items-center justify-center py-6">
              {/* Dynamic interactive SVG Bar chart */}
              <svg className="w-full max-w-sm h-64" viewBox="0 0 300 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Axes lines */}
                <line x1="40" y1="20" x2="40" y2="160" stroke="#CBD5E1" strokeWidth="2" />
                <line x1="40" y1="160" x2="280" y2="160" stroke="#CBD5E1" strokeWidth="2" />

                {/* Y Axis helper markings */}
                <line x1="35" y1="40" x2="280" y2="40" stroke="#F1F5F9" strokeWidth="1" />
                <line x1="35" y1="100" x2="280" y2="100" stroke="#F1F5F9" strokeWidth="1" />

                {/* Bars - Calculated dynamically to fit percentages */}
                {/* 1. Billed */}
                <rect x="70" y="30" width="35" height="130" rx="3" fill="#3B82F6" className="transition-all hover:opacity-90 cursor-pointer" />
                {/* 2. Paid / Revenue */}
                <rect 
                  x="140" 
                  y={160 - Math.min(130, (totalRevenue / (totalBilled || 1)) * 130)} 
                  width="35" 
                  height={Math.min(130, (totalRevenue / (totalBilled || 1)) * 130)} 
                  rx="3" 
                  fill="#10B981" 
                  className="transition-all hover:opacity-90 cursor-pointer" 
                />
                {/* 3. Debt */}
                <rect 
                  x="210" 
                  y={160 - Math.min(130, (totalOutstanding / (totalBilled || 1)) * 130)} 
                  width="35" 
                  height={Math.min(130, (totalOutstanding / (totalBilled || 1)) * 130)} 
                  rx="3" 
                  fill="#EF4444" 
                  className="transition-all hover:opacity-90 cursor-pointer" 
                />

                {/* Labels */}
                <text x="87" y="180" fill="#64748B" fontSize="9" textAnchor="middle" fontWeight="bold">المفوتر</text>
                <text x="157" y="180" fill="#64748B" fontSize="9" textAnchor="middle" fontWeight="bold">المحصل</text>
                <text x="227" y="180" fill="#64748B" fontSize="9" textAnchor="middle" fontWeight="bold">المتبقي</text>

                {/* Values on top of bars */}
                <text x="87" y="25" fill="#1E3A8A" fontSize="9" textAnchor="middle" fontWeight="bold" fontFamily="monospace">{totalBilled.toFixed(0)}</text>
                <text x="157" y={155 - Math.min(130, (totalRevenue / (totalBilled || 1)) * 130)} fill="#065F46" fontSize="9" textAnchor="middle" fontWeight="bold" fontFamily="monospace">{totalRevenue.toFixed(0)}</text>
                <text x="227" y={155 - Math.min(130, (totalOutstanding / (totalBilled || 1)) * 130)} fill="#991B1B" fontSize="9" textAnchor="middle" fontWeight="bold" fontFamily="monospace">{totalOutstanding.toFixed(0)}</text>
              </svg>
            </div>

            <div className="flex justify-center gap-6 text-xs text-slate-500 font-sans">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-blue-500 rounded-xs"></span> إجمالي المفوتر</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-xs"></span> النقدية المحصلة</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-rose-500 rounded-xs"></span> ديون العملاء</span>
            </div>
          </div>

          {/* New Section: أداء الموظفين */}
          <div className="lg:col-span-12 mt-4 pt-6 border-t border-slate-200">
            <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
              <Briefcase className="w-6 h-6 text-indigo-600" />
              أداء الموظفين
            </h3>
            
            {/* Filters for Employee Performance */}
            <div className="bg-white border border-slate-100 rounded-2xl py-3 px-5 shadow-xs mb-6 flex flex-wrap gap-4 items-end justify-between">
              <div className="flex flex-wrap gap-4 items-end">
                <div>
                  <label className="text-[11px] text-slate-500 font-semibold block mb-0.5">السنة:</label>
                  <select 
                    value={empPerfYear}
                    onChange={(e) => setEmpPerfYear(Number(e.target.value))}
                    className="bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-2.5 py-1 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none h-[30px]"
                  >
                    {Array.from({ length: 5 }, (_, i) => currentYear - i).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-slate-500 font-semibold block mb-0.5">الشهر:</label>
                  <select 
                    value={empPerfMonth}
                    onChange={(e) => setEmpPerfMonth(e.target.value)}
                    className="bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-2.5 py-1 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none h-[30px]"
                  >
                    <option value="all">كافة أشهر السنة</option>
                    {['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'].map((m, i) => (
                      <option key={i} value={i}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-slate-500 font-semibold block mb-0.5">الموظف:</label>
                  <select 
                    value={empPerfEmployee}
                    onChange={(e) => setEmpPerfEmployee(e.target.value)}
                    className="bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-2.5 py-1 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none h-[30px]"
                  >
                    <option value="all">كافة الموظفين</option>
                    {uniqueEmpNames.map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
              {/* Bar Chart */}
              <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-xs h-72 flex flex-col">
                <h4 className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-slate-400" />
                  المبالغ المودعة والمفوترة حسب الموظف
                </h4>
                <div className="flex-1 min-h-0 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={empPerfData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '11px', fontWeight: 'bold'}} />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                      <Bar dataKey="collected" name="المبالغ المودعة (المحصلة)" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="billed" name="إجمالي المفوتر" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Pie Chart */}
              <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-xs h-72 flex flex-col">
                <h4 className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-2">
                  <Percent className="w-4 h-4 text-slate-400" />
                  نسبة التحصيل (المبالغ المودعة)
                </h4>
                <div className="flex-1 min-h-0 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={empPerfData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="collected"
                      >
                        {empPerfData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={EMP_COLORS[index % EMP_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => `${value.toFixed(3)} ر.ع.`} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '11px', fontWeight: 'bold'}} />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-2xl shadow-xs border border-slate-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-right">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                    <tr>
                      <th 
                        onClick={() => handleEmpPerfSort('name')}
                        className="px-4 py-3 font-bold cursor-pointer hover:bg-slate-100 transition-colors select-none group"
                      >
                        الموظف <EmpSortIcon column="name" />
                      </th>
                      <th 
                        onClick={() => handleEmpPerfSort('billed')}
                        className="px-4 py-3 font-bold text-center cursor-pointer hover:bg-slate-100 transition-colors select-none group"
                      >
                        إجمالي المفوتر (ر.ع.) <EmpSortIcon column="billed" />
                      </th>
                      <th 
                        onClick={() => handleEmpPerfSort('collected')}
                        className="px-4 py-3 font-bold text-center cursor-pointer hover:bg-slate-100 transition-colors select-none group"
                      >
                        المبالغ المودعة والمحصلة (ر.ع.) <EmpSortIcon column="collected" />
                      </th>
                      <th 
                        onClick={() => handleEmpPerfSort('percentage')}
                        className="px-4 py-3 font-bold text-center cursor-pointer hover:bg-slate-100 transition-colors select-none group"
                      >
                        نسبة التحصيل من المفوتر <EmpSortIcon column="percentage" />
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {empPerfData.map((row, idx) => {
                      const percentage = row.billed > 0 ? ((row.collected / row.billed) * 100).toFixed(1) : '0.0';
                      return (
                        <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-3 font-bold text-indigo-700">{row.name}</td>
                          <td className="px-4 py-3 font-mono font-bold text-blue-600 text-center">{row.billed.toFixed(3)}</td>
                          <td className="px-4 py-3 font-mono font-bold text-emerald-600 text-center">{row.collected.toFixed(3)}</td>
                          <td className="px-4 py-3 text-center">
                            <span className="bg-slate-100 text-slate-600 font-bold px-2 py-1 rounded-md">{percentage}%</span>
                          </td>
                        </tr>
                      );
                    })}
                    {empPerfData.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-slate-400">لا توجد بيانات مطابقة لفلاتر التصفية</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
          </div>
        </div>
      )}

      {/* TAB CONTENT: INVOICES */}
      {activeTab === 'invoices' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="invoices-report-view">
          {/* Left List summary */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs space-y-3">
              <h4 className="text-xs font-bold text-slate-600">توزيع الفواتير حسب الحالة</h4>
              
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center p-2.5 bg-emerald-50 rounded-lg">
                  <span className="flex items-center gap-1.5 text-emerald-800 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    فواتير مدفوعة بالكامل
                  </span>
                  <span className="font-mono font-bold text-emerald-700">{paidCount} ({((paidCount / (invoiceCount || 1)) * 100).toFixed(0)}%)</span>
                </div>

                <div className="flex justify-between items-center p-2.5 bg-amber-50 rounded-lg">
                  <span className="flex items-center gap-1.5 text-amber-800 font-semibold">
                    <Clock
 className="w-4 h-4 text-amber-600" />
                    مدفوعة جزئياً (مقدم)
                  </span>
                  <span className="font-mono font-bold text-amber-700">{partialCount} ({((partialCount / (invoiceCount || 1)) * 100).toFixed(0)}%)</span>
                </div>

                <div className="flex justify-between items-center p-2.5 bg-rose-50 rounded-lg">
                  <span className="flex items-center gap-1.5 text-rose-800 font-semibold">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    غير مدفوعة (مستحقة)
                  </span>
                  <span className="font-mono font-bold text-rose-700">{unpaidCount} ({((unpaidCount / (invoiceCount || 1)) * 100).toFixed(0)}%)</span>
                </div>

                <div className="flex justify-between items-center p-2.5 bg-slate-100 rounded-lg">
                  <span className="flex items-center gap-1.5 text-slate-700 font-semibold">
                    <FileText className="w-4 h-4 text-slate-600" />
                    مسودات معلقة
                  </span>
                  <span className="font-mono font-bold text-slate-700">{draftCount} ({((draftCount / (invoiceCount || 1)) * 100).toFixed(0)}%)</span>
                </div>
              </div>
            </div>

            <button
              onClick={exportInvoicesTab}
              className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2 rounded-xl transition-all"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              تصدير الفواتير الحالية لإكسل
            </button>
          </div>

          {/* SVG Visual Circle Doughnut */}
          <div className="lg:col-span-8 bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-700 mb-1">الرسم التوضيحي لحالات الفواتير الفعالة</h3>
              <p className="text-xs text-slate-400">توزيع نسبي يوضح كم المبالغ والنسب المسواة وغير المسواة بالمكتب</p>
            </div>

            <div className="flex items-center justify-center py-6">
              {/* SVG circular Pie chart */}
              <svg className="w-48 h-48" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                {/* 
                  To build a simple clean CSS based or SVG dasharray segment chart 
                  We can render colored circles
                */}
                <circle cx="50" cy="50" r="35" stroke="#E2E8F0" strokeWidth="12" fill="none" />
                
                {/* Active Paid segment - 40% if mock is loaded */}
                <circle cx="50" cy="50" r="35" stroke="#10B981" strokeWidth="12" fill="none"
                  strokeDasharray={`${(paidCount / (invoiceCount || 1)) * 220} 220`}
                  strokeDashoffset="0"
                  transform="rotate(-90 50 50)"
                />

                {/* Partial segment */}
                <circle cx="50" cy="50" r="35" stroke="#F59E0B" strokeWidth="12" fill="none"
                  strokeDasharray={`${(partialCount / (invoiceCount || 1)) * 220} 220`}
                  strokeDashoffset={`-${(paidCount / (invoiceCount || 1)) * 220}`}
                  transform="rotate(-90 50 50)"
                />

                {/* Unpaid segment */}
                <circle cx="50" cy="50" r="35" stroke="#EF4444" strokeWidth="12" fill="none"
                  strokeDasharray={`${(unpaidCount / (invoiceCount || 1)) * 220} 220`}
                  strokeDashoffset={`-${((paidCount + partialCount) / (invoiceCount || 1)) * 220}`}
                  transform="rotate(-90 50 50)"
                />
                
                {/* Centered label */}
                <text x="50" y="47" textAnchor="middle" fill="#475569" fontSize="6" fontWeight="bold">إجمالي السجل</text>
                <text x="50" y="58" textAnchor="middle" fill="#1E293B" fontSize="11" fontWeight="black" fontFamily="monospace">{invoiceCount}</text>
              </svg>
            </div>

            <div className="flex justify-center flex-wrap gap-4 text-[10px] text-slate-500 font-sans">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span> مدفوعة بالكامل ({paidCount})</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-amber-500 rounded-full"></span> جزئي ومقدم ({partialCount})</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-rose-500 rounded-full"></span> غير مدفوعة ({unpaidCount})</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-slate-400 rounded-full"></span> مسودة معلقة ({draftCount})</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: DEBT (المستحقات) */}
      {activeTab === 'debt' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="debt-report-view">
          {/* Outstanding Debts Table */}
          <div className="lg:col-span-8 bg-white border border-slate-100 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-700">سجل المدينين والمطالبات المالية العالقة (الديوان)</h3>
                <p className="text-xs text-slate-400">قائمة بالعملاء الذين عليهم مبالغ متبقية مستحقة السداد</p>
              </div>
              <button
                onClick={exportDebtTab}
                className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-1.5 px-3 rounded-lg"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                تصدير تقرير الديون
              </button>
            </div>

            {debtList.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-right border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                      <th className="p-3 text-right">
                        <button onClick={() => handleSort('name')} className="flex items-center gap-1 hover:text-indigo-600 group cursor-pointer font-bold focus:outline-none w-full">
                          اسم العميل المطالب <SortIcon column="name" />
                        </button>
                      </th>
                      <th className="p-3 text-right">
                        <button onClick={() => handleSort('type')} className="flex items-center gap-1 hover:text-indigo-600 group cursor-pointer font-bold focus:outline-none w-full">
                          نوع الحساب <SortIcon column="type" />
                        </button>
                      </th>
                      <th className="p-3 text-center">
                        <button onClick={() => handleSort('invoiceCount')} className="flex items-center justify-center gap-1 mx-auto hover:text-indigo-600 group cursor-pointer font-bold focus:outline-none w-full">
                          الفواتير المستحقة <SortIcon column="invoiceCount" />
                        </button>
                      </th>
                      <th className="p-3 text-center">
                        <button onClick={() => handleSort('totalBilled')} className="flex items-center justify-center gap-1 mx-auto hover:text-indigo-600 group cursor-pointer font-bold focus:outline-none w-full">
                          المبلغ المفوتر <SortIcon column="totalBilled" />
                        </button>
                      </th>
                      <th className="p-3 text-center text-rose-600">
                        <button onClick={() => handleSort('owed')} className="flex items-center justify-center gap-1 mx-auto hover:text-rose-700 group cursor-pointer font-bold focus:outline-none w-full text-rose-600">
                          الديون المعلقة ر.ع. <SortIcon column="owed" />
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {debtList.map((item, index) => (
                      <tr key={index} className="hover:bg-slate-50/50">
                        <td className="p-3 font-semibold text-slate-800">{item.customer.name}</td>
                        <td className="p-3 text-slate-500">
                          {item.customer.type === 'individual' ? 'فرد شخصي' : 'مؤسسة تجارية'}
                        </td>
                        <td className="p-3 text-center font-mono font-semibold">{item.invoiceCount}</td>
                        <td className="p-3 text-center font-mono">{item.totalBilled.toFixed(3)}</td>
                        <td className="p-3 text-center font-mono font-black text-rose-600 bg-rose-50/20">{item.owed.toFixed(3)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400 italic">
                👏 ممتاز! لا يوجد مستحقات معلقة أو ديوان على عملاء المكتب حالياً
              </div>
            )}
          </div>

          {/* KPI Card */}
          <div className="lg:col-span-4 space-y-4">
            <div className="p-6 bg-rose-50 border border-rose-100 rounded-2xl space-y-3 text-slate-800">
              <div className="p-2 bg-rose-100 text-rose-600 rounded-xl w-max">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-rose-900">مجموع ديون العملاء المعلقة</h4>
              <p className="text-3xl font-black text-rose-700 font-mono">
                {debtList.reduce((sum, item) => sum + item.owed, 0).toFixed(3)} ر.ع.
              </p>
              <p className="text-xs text-rose-600">
                موزعة على {debtList.length} عملاء متأخرين في الدفع. يرجى مراجعة وتصفية المستحقات قبل إغلاق الحسابات.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: ACCOUNTS STATUS */}
      {activeTab === 'accounts' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="accounts-report-view">
          {/* Status cards */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs">
              <h4 className="text-xs font-bold text-slate-600 mb-3">حالة سجل العملاء الإجمالي</h4>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border border-emerald-100 rounded-xl">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span>
                    <div>
                      <span className="text-xs font-bold text-slate-700 block">حسابات نشطة فعالة</span>
                      <span className="text-[10px] text-slate-400">عملاء يتعاملون مع سند بانتظام</span>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-emerald-600 font-mono">{activeCustomers.length}</span>
                </div>

                <div className="flex items-center justify-between p-3 border border-amber-100 rounded-xl">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-amber-50 rounded-full border-2 border-amber-500"></span>
                    <div>
                      <span className="text-xs font-bold text-slate-700 block">حسابات متأخرة الدفع</span>
                      <span className="text-[10px] text-slate-400">عليهم مطالبات لم تسوى بعد</span>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-amber-600 font-mono">{lateCustomers.length}</span>
                </div>

                <div className="flex items-center justify-between p-3 border border-slate-200 rounded-xl">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-slate-400 rounded-full"></span>
                    <div>
                      <span className="text-xs font-bold text-slate-700 block">حسابات مغلقة ومؤرشفة</span>
                      <span className="text-[10px] text-slate-400">تم تصفية مستحقاتهم وإغلاقها</span>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-slate-600 font-mono">{closedCustomers.length}</span>
                </div>
              </div>
            </div>
          </div>

          {/* SVG Visual comparison */}
          <div className="lg:col-span-8 bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-700 mb-1">الرسم التحليلي لسجل الحسابات والعملاء</h3>
              <p className="text-xs text-slate-400">توضيح مرئي لنسب توزيع الحسابات في النظام لضمان فاعلية المتابعة والتحصيل</p>
            </div>

            <div className="flex items-center justify-center py-6">
              <svg className="w-full max-w-sm h-48" viewBox="0 0 300 120" xmlns="http://www.w3.org/2000/svg">
                {/* Simple Horizontal distribution bar chart */}
                <rect x="10" y="40" width="280" height="25" rx="5" fill="#E2E8F0" />
                
                {/* 1. Active part */}
                <rect 
                  x="10" 
                  y="40" 
                  width={Math.max(10, (activeCustomers.length / (customers.length || 1)) * 280)} 
                  height="25" 
                  rx="5" 
                  fill="#10B981" 
                />
                
                {/* 2. Late part */}
                <rect 
                  x={10 + (activeCustomers.length / (customers.length || 1)) * 280} 
                  y="40" 
                  width={Math.max(10, (lateCustomers.length / (customers.length || 1)) * 280)} 
                  height="25" 
                  rx="2" 
                  fill="#F59E0B" 
                />

                {/* 3. Closed part */}
                <rect 
                  x={10 + ((activeCustomers.length + lateCustomers.length) / (customers.length || 1)) * 280} 
                  y="40" 
                  width={Math.max(10, (closedCustomers.length / (customers.length || 1)) * 280)} 
                  height="25" 
                  rx="5" 
                  fill="#94A3B8" 
                />

                {/* Legend & Labels with percentages */}
                <text x="15" y="85" fill="#047857" fontSize="8" fontWeight="bold">نشطة ({((activeCustomers.length / (customers.length || 1)) * 100).toFixed(0)}%)</text>
                <text x="140" y="85" fill="#B45309" fontSize="8" fontWeight="bold">متأخرة ({((lateCustomers.length / (customers.length || 1)) * 100).toFixed(0)}%)</text>
                <text x="240" y="85" fill="#475569" fontSize="8" fontWeight="bold">مغلقة ({((closedCustomers.length / (customers.length || 1)) * 100).toFixed(0)}%)</text>
              </svg>
            </div>

            <div className="text-center text-xs text-slate-400 italic">
              إجمالي العملاء المسجلين في المنصة الرقمية الموحدة حالياً: <span className="font-semibold text-slate-700 font-mono">{customers.length} عميلاً</span>
            </div>
          </div>
        </div>
      )}
      {activeTab === "monthly" && ( 
        <MonthlyReports invoices={invoices} users={users} onDayDoubleClick={onDayDoubleClick} /> 
      )}
      {activeTab === "statement" && ( 
        <MonthlyStatement invoices={invoices} customers={customers} /> 
      )}
      {activeTab === "employees_data" && ( 
        <EmployeeDataSheet users={users} branches={branches} /> 
      )}
    </div>
  );
}
