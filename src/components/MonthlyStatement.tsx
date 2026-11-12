import React, { useState, useMemo } from 'react';
import { Invoice, Customer } from '../types';
import { exportMonthlyStatementToExcel, printMonthlyStatementPDF } from '../utils/exportUtils';
import { Filter, DollarSign, Download, Printer, FileText, CheckCircle2, AlertTriangle, List } from 'lucide-react';

interface MonthlyStatementProps {
  invoices: Invoice[];
  customers: Customer[];
}

const MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

export default function MonthlyStatement({ invoices, customers }: MonthlyStatementProps) {
  const [reportYear, setReportYear] = useState(new Date().getFullYear());
  const [reportMonth, setReportMonth] = useState(new Date().getMonth());

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const getCustomerName = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    return customer ? customer.name : 'عميل غير معروف';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded font-bold border border-emerald-100">مدفوعة</span>;
      case 'partially_paid':
        return <span className="text-[10px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded font-bold border border-amber-100">مدفوع جزئياً</span>;
      case 'unpaid':
        return <span className="text-[10px] bg-rose-50 text-rose-600 px-2 py-0.5 rounded font-bold border border-rose-100">غير مدفوعة</span>;
      default:
        return <span className="text-[10px] bg-slate-50 text-slate-600 px-2 py-0.5 rounded font-bold border border-slate-200">مسودة</span>;
    }
  };

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      if (inv.status === 'draft') return false;
      const invDate = new Date(inv.createdAt);
      return invDate.getFullYear() === reportYear && 
             invDate.getMonth() === reportMonth;
    }).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [invoices, reportYear, reportMonth]);

  const stats = useMemo(() => {
    return filteredInvoices.reduce((acc, inv) => {
      acc.totalSales += inv.totalAmount;
      acc.totalPaid += inv.downPayment;
      acc.totalUnpaid += inv.remainingAmount;
      acc.invoiceCount += 1;
      return acc;
    }, { totalSales: 0, totalPaid: 0, totalUnpaid: 0, invoiceCount: 0 });
  }, [filteredInvoices]);


  const handleExportExcel = () => {
    exportMonthlyStatementToExcel(filteredInvoices, customers, MONTHS[reportMonth], reportYear);
  };

  const handlePrintPDF = () => {
    printMonthlyStatementPDF(filteredInvoices, customers, MONTHS[reportMonth], reportYear, stats);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300" id="monthly-statement-view">
      {/* Filters */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-2 text-slate-700 font-bold">
          <Filter className="w-5 h-5 text-teal-600" />
          <span>تصفية الكشف الشهري</span>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-500 font-semibold">الشهر:</label>
            <select 
              value={reportMonth}
              onChange={(e) => setReportMonth(Number(e.target.value))}
              className="bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-3 py-1.5 text-sm font-bold focus:ring-2 focus:ring-teal-500 outline-none"
            >
              {MONTHS.map((month, index) => (
                <option key={index} value={index}>{month}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-500 font-semibold">السنة:</label>
            <select 
              value={reportYear}
              onChange={(e) => setReportYear(Number(e.target.value))}
              className="bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-3 py-1.5 text-sm font-bold focus:ring-2 focus:ring-teal-500 outline-none"
            >
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 mr-4 border-r border-slate-200 pr-4">
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
            >
              <Download className="w-4 h-4" />
              تنزيل إكسل
            </button>
            <button
              onClick={handlePrintPDF}
              className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
            >
              <Printer className="w-4 h-4" />
              طباعة PDF
            </button>
          </div>
        </div>
      </div>


      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex justify-between items-start">
            <h3 className="text-sm font-bold text-slate-600">إجمالي المبيعات (المفوتر)</h3>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-indigo-700 font-mono">{stats.totalSales.toFixed(3)}</p>
            <p className="text-xs text-slate-400 mt-1">ر.ع. قيمة الفواتير المصدرة</p>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex justify-between items-start">
            <h3 className="text-sm font-bold text-slate-600">إجمالي الإيرادات (المحصل)</h3>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-emerald-600 font-mono">{stats.totalPaid.toFixed(3)}</p>
            <p className="text-xs text-slate-400 mt-1">ر.ع. المبالغ المدفوعة والمقدمة</p>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex justify-between items-start">
            <h3 className="text-sm font-bold text-slate-600">الديون والمستحقات (المتبقي)</h3>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-rose-600 font-mono">{stats.totalUnpaid.toFixed(3)}</p>
            <p className="text-xs text-slate-400 mt-1">ر.ع. ديون معلقة غير مدفوعة</p>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex justify-between items-start">
            <h3 className="text-sm font-bold text-slate-600">عدد المعاملات</h3>
            <div className="p-2 bg-teal-50 text-teal-600 rounded-lg">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-slate-700 font-mono">{stats.invoiceCount}</p>
            <p className="text-xs text-slate-400 mt-1">فاتورة خلال هذا الشهر</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <List className="w-5 h-5 text-teal-600" />
            كشف المدخلات المالية التفصيلي - {MONTHS[reportMonth]} {reportYear}
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3 resize-x overflow-auto">رقم الفاتورة</th>
                <th className="p-3 resize-x overflow-auto">التاريخ</th>
                <th className="p-3 resize-x overflow-auto">العميل</th>
                <th className="p-3 min-w-[200px] resize-x overflow-auto">بنود المعاملات</th>
                <th className="p-3 text-indigo-700 resize-x overflow-auto">المبلغ الإجمالي</th>
                <th className="p-3 text-emerald-600 resize-x overflow-auto">المدفوع</th>
                <th className="p-3 text-rose-600 resize-x overflow-auto">المتبقي</th>
                <th className="p-3 resize-x overflow-auto">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.length > 0 ? (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-3 font-mono font-bold text-teal-600">{inv.invoiceNumber}</td>
                    <td className="p-3 font-mono text-slate-500 text-xs">
                      {new Date(inv.createdAt).toLocaleDateString('ar-OM')}
                    </td>
                    <td className="p-3 font-semibold text-slate-700">{getCustomerName(inv.customerId)}</td>
                    <td className="p-3">
                      <div className="flex flex-col gap-1 max-w-xs">
                        {inv.items.map((item, idx) => (
                          <div key={idx} className="text-[11px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded truncate">
                            {item.quantity}x {item.serviceName}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="p-3 font-mono font-bold text-indigo-700 bg-indigo-50/20">{inv.totalAmount.toFixed(3)}</td>
                    <td className="p-3 font-mono font-bold text-emerald-600 bg-emerald-50/20">{inv.downPayment.toFixed(3)}</td>
                    <td className="p-3 font-mono font-bold text-rose-600 bg-rose-50/20">{inv.remainingAmount.toFixed(3)}</td>
                    <td className="p-3">{getStatusBadge(inv.status)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 italic">
                    لا توجد فواتير أو مدخلات مالية مسجلة في هذا الشهر
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
