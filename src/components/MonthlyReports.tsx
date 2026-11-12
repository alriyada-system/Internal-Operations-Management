import React, { useState, useMemo, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import { runWithOklchFix } from '../utils/printUtils';
import { Invoice, User } from '../types';
import { Calendar, Filter, BarChart as BarChartIcon, Download, Printer } from 'lucide-react';
import { exportMonthlyReportToExcel, printMonthlyReportPDF } from '../utils/exportUtils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line, LabelList, Cell } from 'recharts';

interface MonthlyReportsProps {
  onDayDoubleClick?: (year: number, month: number, day: number) => void;
  invoices: Invoice[];
  users?: User[];
}

const MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

export default function MonthlyReports({ invoices, users = [], onDayDoubleClick }: MonthlyReportsProps) {
  const [reportYear, setReportYear] = useState(new Date().getFullYear());
  const [reportMonth, setReportMonth] = useState(new Date().getMonth());
  const [employeeFilter, setEmployeeFilter] = useState<string>('all');
  const [isPrinting, setIsPrinting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [hoveredDayData, setHoveredDayData] = useState<any | null>(null);
  const [pinnedDayData, setPinnedDayData] = useState<any | null>(null);
  const [pinnedPos, setPinnedPos] = useState({ x: 0, y: 0 });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPinnedPos({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const uniqueEmployees = useMemo(() => {
    return Array.from(new Set([
      ...users.filter(u => !u.id.endsWith('_config')).map(u => u.name),
      ...invoices.map(inv => inv.createdBy || inv.lastModifiedBy).filter(Boolean) as string[]
    ])).sort((a, b) => a.localeCompare(b, 'ar'));
  }, [users, invoices]);

  const monthlyData = useMemo(() => {
    const daysInMonth = new Date(reportYear, reportMonth + 1, 0).getDate();

    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const currentDate = new Date(reportYear, reportMonth, day);
      
      const dayInvoices = invoices.filter(inv => {
        if (inv.status === 'draft') return false;
        
        if (employeeFilter !== 'all') {
          const invCreator = (inv.createdBy || inv.lastModifiedBy || 'مدير النظام').trim().toLowerCase();
          if (invCreator !== employeeFilter.trim().toLowerCase()) return false;
        }

        const invDate = new Date(inv.createdAt);
        return invDate.getFullYear() === reportYear && 
               invDate.getMonth() === reportMonth && 
               invDate.getDate() === day;
      });

      const dayDeposit = dayInvoices.reduce((sum, inv) => sum + inv.downPayment, 0);
      const dayPaid = dayInvoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.totalAmount, 0);
      const dayUnpaid = dayInvoices.filter(i => i.status === 'unpaid').reduce((sum, i) => sum + i.totalAmount, 0);
      const dayPartial = dayInvoices.filter(i => i.status === 'partially_paid').reduce((sum, i) => sum + i.totalAmount, 0);
      const dayTotal = dayInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

      const dayName = currentDate.toLocaleDateString('ar-OM', { weekday: 'long' });

      return {
        day,
        dateFormatted: `${dayName} - ${day} ${MONTHS[reportMonth]}`,
        deposit: dayDeposit,
        paid: dayPaid,
        unpaid: dayUnpaid,
        partial: dayPartial,
        total: dayTotal,
        shortDate: `${day} ${MONTHS[reportMonth]}`,
        invoices: dayInvoices
      };
    });
  }, [invoices, reportYear, reportMonth, employeeFilter]);

  const totals = useMemo(() => {
    return monthlyData.reduce((acc, curr) => ({
      deposit: acc.deposit + curr.deposit,
      paid: acc.paid + curr.paid,
      unpaid: acc.unpaid + curr.unpaid,
      partial: acc.partial + curr.partial,
      total: acc.total + curr.total,
    }), { deposit: 0, paid: 0, unpaid: 0, partial: 0, total: 0 });
  }, [monthlyData]);

  // Chart data formatting
  const chartData = monthlyData.map(d => ({
    name: d.day.toString(),
    'المدفوع': d.paid,
    'غير المدفوع': d.unpaid,
    'مدفوع جزئياً': d.partial,
    'إجمالي': d.paid + d.unpaid + d.partial
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
    
  return (
        <div className="bg-white/50 backdrop-blur-md border border-slate-200 shadow-xl p-3 rounded-xl" dir="rtl">
          <p className="font-bold text-slate-800 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} style={{ color: entry.color }} className="text-sm font-semibold flex justify-between gap-4">
              <span>{entry.name}:</span>
              <span className="font-mono">{entry.value.toFixed(3)} ر.ع.</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };


  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      let chartBase64 = '';
      const chartElement = document.getElementById('monthly-chart-container');
      if (chartElement) {
        try {
          const canvas = await runWithOklchFix(() => html2canvas(chartElement, {
            backgroundColor: '#ffffff',
            scale: 2 // High resolution
          }));
          chartBase64 = canvas.toDataURL('image/png');
        } catch (err) {
          console.error('Error rendering chart to image', err);
        }
      }
      exportMonthlyReportToExcel(monthlyData, totals, MONTHS[reportMonth], reportYear, chartBase64);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrintPDF = async () => {
    setIsPrinting(true);
    try {
      let chartBase64 = '';
      const chartElement = document.getElementById('monthly-chart-container');
      if (chartElement) {
        try {
          const canvas = await runWithOklchFix(() => html2canvas(chartElement, {
            backgroundColor: '#ffffff',
            scale: 2 // High resolution
          }));
          chartBase64 = canvas.toDataURL('image/png');
        } catch (err) {
          console.error('Error rendering chart to image', err);
        }
      }
      const chartHtml = chartBase64 ? `<img src="${chartBase64}" style="width: 100%; height: auto; max-height: 250px; object-fit: contain;" />` : '';
      printMonthlyReportPDF(monthlyData, totals, MONTHS[reportMonth], reportYear, chartHtml);
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <div className="space-y-3 animate-in fade-in duration-300" id="monthly-reports-view">
      {/* Filters */}
      <div className="bg-white border border-slate-100 rounded-2xl py-2 px-4 shadow-xs flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-slate-700 font-bold">
            <Filter className="w-4 h-4 text-teal-600" />
            <span className="text-sm">تصفية التقرير الشهري</span>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-500 font-semibold">الشهر:</label>
              <select 
                value={reportMonth}
                onChange={(e) => setReportMonth(Number(e.target.value))}
                className="bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-2 py-1 text-xs font-bold focus:ring-2 focus:ring-teal-500 outline-none"
              >
                {MONTHS.map((month, index) => (
                  <option key={index} value={index}>{month}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-500 font-semibold">السنة:</label>
              <select 
                value={reportYear}
                onChange={(e) => setReportYear(Number(e.target.value))}
                className="bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-2 py-1 text-xs font-bold focus:ring-2 focus:ring-teal-500 outline-none"
              >
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-500 font-semibold">الموظف:</label>
              <select 
                value={employeeFilter}
                onChange={(e) => setEmployeeFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-2 py-1 text-xs font-bold focus:ring-2 focus:ring-teal-500 outline-none max-w-[120px] truncate"
              >
                <option value="all">الكل</option>
                {uniqueEmployees.map(emp => (
                  <option key={emp} value={emp}>{emp}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            disabled={isExporting || isPrinting}
            className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:bg-slate-100 disabled:text-slate-400 px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            {isExporting ? 'جاري التنزيل...' : 'تنزيل إكسل'}
          </button>
          <button
            onClick={handlePrintPDF}
            disabled={isPrinting || isExporting}
            className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 disabled:bg-slate-100 disabled:text-slate-400 px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            <Printer className="w-4 h-4" />
            {isPrinting ? 'جاري التحضير...' : 'طباعة PDF'}
          </button>
        </div>
      </div>
      
      {/* Chart Section */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-xs p-4">
        <div className="flex flex-col lg:flex-row gap-4 items-start pl-0">

          {/* Summary Stats Card */}
          <div className="w-full lg:w-[220px] shrink-0 bg-slate-50 rounded-xl p-3 border border-slate-200 shadow-sm space-y-2.5">
            <h4 className="font-bold text-slate-700 border-b border-slate-200 pb-2 mb-2 flex items-center justify-center gap-2 text-sm text-center">
              <span className="w-2 h-2 bg-teal-500 rounded-full"></span>
              ملخص المبالغ اليومية لشهر : ({MONTHS[reportMonth]} / {reportYear})
            </h4>
            
            <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-100 shadow-xs">
              <span className="text-xs font-semibold text-slate-500">مجموع المبيعات</span>
              <span className="font-bold font-mono text-slate-800 text-sm">{totals.total.toFixed(3)}</span>
            </div>
            
            <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-100 shadow-xs">
              <span className="text-xs font-semibold text-slate-500">إيداع المبالغ</span>
              <span className="font-bold font-mono text-emerald-600 text-sm">{totals.deposit.toFixed(3)}</span>
            </div>
            
            <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-100 shadow-xs">
              <span className="text-xs font-semibold text-slate-500">مجموع المدفوع</span>
              <span className="font-bold font-mono text-teal-600 text-sm">{totals.paid.toFixed(3)}</span>
            </div>
            
            <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-100 shadow-xs">
              <span className="text-xs font-semibold text-slate-500">مدفوع جزئياً</span>
              <span className="font-bold font-mono text-amber-500 text-sm">{totals.partial.toFixed(3)}</span>
            </div>
            
            <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-100 shadow-xs">
              <span className="text-xs font-semibold text-slate-500">غير المدفوع</span>
              <span className="font-bold font-mono text-rose-500 text-sm">{totals.unpaid.toFixed(3)}</span>
            </div>
          </div>

<div className="flex-1 w-full relative overflow-x-auto" dir="ltr" onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })} onDoubleClick={() => {
          if (hoveredDayData && onDayDoubleClick) {
            setPinnedDayData(hoveredDayData);
            onDayDoubleClick(reportYear, reportMonth, hoveredDayData.day);
          }
        }}>
          <div id="monthly-chart-container" style={{ width: "100%", minWidth: "600px", height: "270px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                style={{ cursor: 'pointer' }}
                margin={{ top: 0, right: 0, left: -25, bottom: -10 }}
                onClick={(state: any) => {
                  if (state && state.activePayload && state.activePayload.length > 0) {
                    const dayStr = state.activeLabel;
                    const day = parseInt(dayStr as string);
                    if (!isNaN(day)) {
                      const row = monthlyData.find(d => d.day === day);
                      if (row) {
                        if (pinnedDayData?.day === row.day) {
                          setPinnedDayData(null);
                        } else {
                          setPinnedDayData(row);
                          setPinnedPos(mousePos);
                        }
                      }
                    }
                  }
                }}
                onMouseMove={(state: any) => {
                  if (state && state.activePayload && state.activePayload.length > 0) {
                    const dayStr = state.activeLabel;
                    const day = parseInt(dayStr as string);
                    if (!isNaN(day)) {
                      const row = monthlyData.find(d => d.day === day);
                      if (row) {
                        setHoveredDayData(row);
                      }
                    }
                  } else {
                    setHoveredDayData(null);
                  }
                }}
                onMouseLeave={() => setHoveredDayData(null)}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 13, fontStyle: 'italic', fill: '#000000', fontFamily: 'sans-serif' }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={false}
                  interval={0}
                />
                <YAxis 
                  tick={{ fontSize: 13, fontStyle: 'italic', fill: '#000000', fontFamily: 'monospace' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => `${value} ر.ع`}
                  tickCount={10}
                />
                <Tooltip cursor={{ fill: 'rgba(226, 232, 240, 0.4)' }} content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '14px', fontWeight: 'bold', paddingTop: '5px', fontFamily: 'sans-serif' }} />
                <Line type="monotone" dataKey="إجمالي" stroke="#cbd5e1" strokeWidth={1} dot={false} />
                <Bar dataKey="المدفوع" stackId="a" fill="#0D9488" radius={[0, 0, 0, 0]}>
                  {chartData.map((entry, index) => {
                    const isHovered = hoveredDayData && hoveredDayData.day === parseInt(entry.name);
                    const isPinned = pinnedDayData && pinnedDayData.day === parseInt(entry.name);
                    const opacity = pinnedDayData ? (isPinned ? 1 : 0.2) : (hoveredDayData ? (isHovered ? 1 : 0.5) : 1);
                    return <Cell key={`cell-paid-${index}`} fillOpacity={opacity} />;
                  })}
                  <LabelList dataKey="المدفوع" position="center" fill="#0f172a" fontSize={11} fontWeight={600} formatter={(val: number) => val > 0 ? val : ''} />
                </Bar>
                <Bar dataKey="مدفوع جزئياً" stackId="a" fill="#F59E0B" radius={[0, 0, 0, 0]}>
                  {chartData.map((entry, index) => {
                    const isHovered = hoveredDayData && hoveredDayData.day === parseInt(entry.name);
                    const isPinned = pinnedDayData && pinnedDayData.day === parseInt(entry.name);
                    const opacity = pinnedDayData ? (isPinned ? 1 : 0.2) : (hoveredDayData ? (isHovered ? 1 : 0.5) : 1);
                    return <Cell key={`cell-partial-${index}`} fillOpacity={opacity} />;
                  })}
                  <LabelList dataKey="مدفوع جزئياً" position="center" fill="#0f172a" fontSize={11} fontWeight={600} formatter={(val: number) => val > 0 ? val : ''} />
                </Bar>
                <Bar dataKey="غير المدفوع" stackId="a" fill="#E11D48" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => {
                    const isHovered = hoveredDayData && hoveredDayData.day === parseInt(entry.name);
                    const isPinned = pinnedDayData && pinnedDayData.day === parseInt(entry.name);
                    const opacity = pinnedDayData ? (isPinned ? 1 : 0.2) : (hoveredDayData ? (isHovered ? 1 : 0.5) : 1);
                    return <Cell key={`cell-unpaid-${index}`} fillOpacity={opacity} />;
                  })}
                  <LabelList dataKey="غير المدفوع" position="center" fill="#0f172a" fontSize={11} fontWeight={600} formatter={(val: number) => val > 0 ? val : ''} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>


        </div>
        </div>
      </div>
{/* Data Table */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-1.5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-teal-600" />
            جدول المدخلات المالية اليومية التفصيلي لشهر : ({MONTHS[reportMonth]} / {reportYear})
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold">
              <tr>
                <th className="p-1.5 text-sm border-b border-slate-200 w-32 resize-x overflow-auto">التاريخ واليوم</th>
                <th className="p-1.5 text-sm border-b border-slate-200 text-emerald-700 resize-x overflow-auto">مجموع إيداع اليوم</th>
                <th className="p-1.5 text-sm border-b border-slate-200 text-teal-600 resize-x overflow-auto">المدفوع</th>
                <th className="p-1.5 text-sm border-b border-slate-200 text-rose-600 resize-x overflow-auto">غير المدفوع</th>
                <th className="p-1.5 text-sm border-b border-slate-200 text-amber-600 resize-x overflow-auto">مدفوع جزئياً</th>
                <th className="p-1.5 text-sm border-b border-slate-200 text-slate-800 resize-x overflow-auto">إجمالي المبيعات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {monthlyData.map((row) => (
                <tr key={row.day} 
      className={`hover:bg-slate-200/80 transition-colors relative cursor-pointer ${pinnedDayData?.day === row.day ? 'bg-slate-100' : ''}`}
      onClick={(e) => {
        if (pinnedDayData?.day === row.day) {
           setPinnedDayData(null);
        } else {
           setPinnedDayData(row);
           setPinnedPos({ x: e.clientX, y: e.clientY });
        }
      }}
      onMouseEnter={(e) => {
        setHoveredDayData(row);
        setMousePos({ x: e.clientX, y: e.clientY });
      }}
      onMouseMove={(e) => {
        setMousePos({ x: e.clientX, y: e.clientY });
      }}
      onMouseLeave={() => setHoveredDayData(null)}
      onDoubleClick={(e) => {
        setPinnedDayData(row);
        setPinnedPos({ x: e.clientX, y: e.clientY });
        if (onDayDoubleClick) onDayDoubleClick(reportYear, reportMonth, row.day);
      }}
  >
                  <td className="p-1.5 text-sm text-slate-700 w-32">{row.dateFormatted}</td>
                  <td className="p-1.5 text-sm font-mono text-emerald-600 bg-emerald-50/30">
                    {row.deposit > 0 ? row.deposit.toFixed(3) : '-'}
                  </td>
                  <td className="p-1.5 text-sm font-mono text-teal-600">
                    {row.paid > 0 ? row.paid.toFixed(3) : '-'}
                  </td>
                  <td className="p-1.5 text-sm font-mono text-rose-600">
                    {row.unpaid > 0 ? row.unpaid.toFixed(3) : '-'}
                  </td>
                  <td className="p-1.5 text-sm font-mono text-amber-600">
                    {row.partial > 0 ? row.partial.toFixed(3) : '-'}
                  </td>
                  <td className="p-1.5 text-sm font-mono font-bold text-slate-800 bg-slate-50/50">
                    {row.total > 0 ? row.total.toFixed(3) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-800 text-white font-bold text-base">
              <tr>
                <td className="p-1.5 text-center">المجموع النهائي (Total)</td>
                <td className="p-1.5 font-mono text-emerald-400">{totals.deposit.toFixed(3)}</td>
                <td className="p-1.5 font-mono text-teal-400">{totals.paid.toFixed(3)}</td>
                <td className="p-1.5 font-mono text-rose-400">{totals.unpaid.toFixed(3)}</td>
                <td className="p-1.5 font-mono text-amber-400">{totals.partial.toFixed(3)}</td>
                <td className="p-1.5 font-mono text-white">{totals.total.toFixed(3)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>



      {/* Pinned Card */}
      {pinnedDayData && (
        <div 
          className="fixed z-50 bg-white/75 backdrop-blur-md border border-slate-200 shadow-xl rounded-2xl p-4 w-72 transition-opacity duration-200 pointer-events-auto"
          style={{ 
            left: pinnedPos.x + 15 + 'px', 
            top: pinnedPos.y + 15 + 'px',
            transform: pinnedPos.x + 300 > window.innerWidth ? 'translateX(-100%)' : 'none',
            maxHeight: '400px',
            display: 'flex',
            flexDirection: 'column'
          }}
          dir="rtl"
        >
          <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2 cursor-move" onMouseDown={(e) => {
               setIsDragging(true);
               setDragOffset({
                 x: e.clientX - pinnedPos.x,
                 y: e.clientY - pinnedPos.y
               });
             }}>
            <h4 className="font-bold text-slate-800 text-sm">{pinnedDayData.dateFormatted}</h4>
            <div className="flex items-center gap-2">
             <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">{pinnedDayData.invoices.length} فواتير</span>
               <button onClick={(e) => { e.stopPropagation(); setPinnedDayData(null); }} className="text-slate-400 hover:text-rose-500">
                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
               </button>
            </div>
          </div>
          
          <div className="space-y-3 overflow-y-auto pr-1" style={{ flex: 1 }}>
             {pinnedDayData.invoices.length > 0 ? (
                 pinnedDayData.invoices.map((inv: any) => (
                    <div key={inv.id} className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                       <div className="flex justify-between items-center mb-1.5">
                         <span className="font-bold text-slate-700 text-xs">{inv.invoiceNumber}</span>
                         <span className={`px-1.5 py-0.5 rounded font-bold text-[9px] ${
                            inv.status === 'paid' ? 'bg-teal-100 text-teal-700' :
                            inv.status === 'unpaid' ? 'bg-rose-100 text-rose-700' :
                            'bg-amber-100 text-amber-700'
                         }`}>
                           {inv.status === 'paid' ? 'مدفوعة' : inv.status === 'unpaid' ? 'غير مدفوعة' : 'جزئي'}
                         </span>
                       </div>
                       
                       {inv.items && inv.items.length > 0 && (
                         <div className="space-y-1 mb-2">
                           {inv.items.map((item: any) => (
                             <div key={item.id} className="flex justify-between text-[10px] text-slate-500">
                               <span className="truncate max-w-[120px]">- {item.serviceName}</span>
                               <span className="font-mono font-semibold">{item.total.toFixed(3)}</span>
                             </div>
                           ))}
                         </div>
                       )}
                       <div className="pt-1.5 border-t border-slate-200 flex justify-between font-bold text-[11px]">
                         <span className="text-slate-600">الإجمالي:</span>
                         <span className="font-mono text-teal-700">{inv.totalAmount.toFixed(3)} ر.ع</span>
                       </div>
                    </div>
                 ))
             ) : (
                 <p className="text-sm text-slate-500 text-center py-4">لا توجد فواتير لهذا اليوم.</p>
             )}
          </div>
        </div>
      )}

      {/* Hovered Card */}
      {hoveredDayData && (!pinnedDayData || hoveredDayData.day !== pinnedDayData.day) && (
        <div 
          className="fixed z-50 bg-white/75 backdrop-blur-md border border-slate-200/50 shadow-2xl rounded-2xl p-4 w-72 pointer-events-none transition-opacity duration-200"
          style={{ 
            left: mousePos.x + 15 + 'px', 
            top: mousePos.y + 15 + 'px',
            transform: mousePos.x + 300 > window.innerWidth ? 'translateX(-100%)' : 'none',
            maxHeight: '400px',
            display: 'flex',
            flexDirection: 'column'
          }}
          dir="rtl"
        >
          <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
            <h4 className="font-bold text-slate-800 text-sm">{hoveredDayData.dateFormatted}</h4>
            <div className="flex items-center gap-2">
             <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">{hoveredDayData.invoices.length} فواتير</span>
            </div>
          </div>
          
          <div className="space-y-3 overflow-y-auto pr-1" style={{ flex: 1 }}>
             {hoveredDayData.invoices.length > 0 ? (
                 hoveredDayData.invoices.map((inv: any) => (
                    <div key={inv.id} className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                       <div className="flex justify-between items-center mb-1.5">
                         <span className="font-bold text-slate-700 text-xs">{inv.invoiceNumber}</span>
                         <span className={`px-1.5 py-0.5 rounded font-bold text-[9px] ${
                            inv.status === 'paid' ? 'bg-teal-100 text-teal-700' :
                            inv.status === 'unpaid' ? 'bg-rose-100 text-rose-700' :
                            'bg-amber-100 text-amber-700'
                         }`}>
                           {inv.status === 'paid' ? 'مدفوعة' : inv.status === 'unpaid' ? 'غير مدفوعة' : 'جزئي'}
                         </span>
                       </div>
                       
                       {inv.items && inv.items.length > 0 && (
                         <div className="space-y-1 mb-2">
                           {inv.items.map((item: any) => (
                             <div key={item.id} className="flex justify-between text-[10px] text-slate-500">
                               <span className="truncate max-w-[120px]">- {item.serviceName}</span>
                               <span className="font-mono font-semibold">{item.total.toFixed(3)}</span>
                             </div>
                           ))}
                         </div>
                       )}
                       <div className="pt-1.5 border-t border-slate-200 flex justify-between font-bold text-[11px]">
                         <span className="text-slate-600">الإجمالي:</span>
                         <span className="font-mono text-teal-700">{inv.totalAmount.toFixed(3)} ر.ع</span>
                       </div>
                    </div>
                 ))
             ) : (
                 <p className="text-sm text-slate-500 text-center py-4">لا توجد فواتير لهذا اليوم.</p>
             )}
          </div>
        </div>
      )}


    </div>
  );
}
