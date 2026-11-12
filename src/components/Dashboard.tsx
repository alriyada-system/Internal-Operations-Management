import React, { useMemo, useState } from 'react';
import { Invoice, Customer, Ticket, User } from '../types';
import { 
  TrendingUp, 
  Users, 
  FileText, 
  AlertCircle,
  Coins,
  Clock,
  CheckCircle2,
  AlertTriangle,
  LifeBuoy,
  MessageSquare,
  Layers,
  Sparkles,
  CheckSquare
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#0f766e', '#059669', '#2563eb', '#4f46e5', '#d97706', '#ea580c', '#0891b2', '#7c3aed', '#e11d48', '#0284c7'];

interface DashboardProps {
  invoices: Invoice[];
  customers: Customer[];
  onNavigate: (section: 'dashboard' | 'invoices' | 'customers' | 'closing' | 'reports' | 'settings' | 'about' | 'database' | 'trash' | 'guide' | 'tickets') => void;
  tickets: Ticket[];
  currentUser: User;
  dashboardMonth?: string;
  dashboardYear?: string;
}

export default function Dashboard({ invoices, customers, onNavigate, tickets = [], currentUser, dashboardMonth, dashboardYear }: DashboardProps) {
  // Key Metrics
  const activeInvoices = invoices.filter(inv => inv.status !== 'draft');
  const totalBilled = activeInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalPaid = activeInvoices.reduce((sum, inv) => sum + inv.downPayment, 0);
  const totalOutstanding = activeInvoices.reduce((sum, inv) => sum + inv.remainingAmount, 0);
  
  const unpaidInvoicesCount = activeInvoices.filter(inv => inv.status === 'unpaid' || inv.status === 'partially_paid').length;
  
  // Top 10 Debtors
  const debtors = customers.map(c => {
    const custInvoices = activeInvoices.filter(inv => inv.customerId === c.id);
    const owed = custInvoices.reduce((sum, inv) => sum + inv.remainingAmount, 0);
    return { ...c, owed };
  }).filter(c => c.owed > 0).sort((a, b) => b.owed - a.owed).slice(0, 10);

  // Top 10 unpaid invoices
  const topUnpaidInvoices = [...activeInvoices]
    .filter(inv => inv.remainingAmount > 0)
    .sort((a, b) => b.remainingAmount - a.remainingAmount)
    .slice(0, 10);

  // Chart data: Monthly invoices by status
  const monthlyData = useMemo(() => {
    const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    const data = months.map((m, i) => ({
      name: m,
      monthIndex: i,
      paid: 0,
      unpaid: 0,
      partially_paid: 0,
      total: 0
    }));

    activeInvoices.forEach(inv => {
      const date = new Date(inv.createdAt);
      const mIndex = date.getMonth();
      if (inv.status === 'paid') data[mIndex].paid += 1;
      else if (inv.status === 'unpaid') data[mIndex].unpaid += 1;
      else if (inv.status === 'partially_paid') data[mIndex].partially_paid += 1;
      
      data[mIndex].total += inv.totalAmount;
    });

    return data;
  }, [activeInvoices]);

  // Chart data: Daily invoices by status for the current month

  const dailyCurrentMonthData = useMemo(() => {
    let targetYear = new Date().getFullYear();
    let targetMonth = new Date().getMonth();

    if (dashboardYear && dashboardYear !== 'all' && dashboardYear !== 'current') {
      targetYear = parseInt(dashboardYear, 10);
    }
    
    // dashboardMonth is '01' to '12'
    if (dashboardMonth && dashboardMonth !== 'all' && dashboardMonth !== 'current') {
      targetMonth = parseInt(dashboardMonth, 10) - 1;
    } else if (dashboardYear !== 'all' || dashboardMonth !== 'all') {
      // If we filtered by year but not month, or month but not year, try to get from invoices if there are any
      if (activeInvoices.length > 0) {
        const d = new Date(activeInvoices[0].createdAt);
        if (!isNaN(d.getTime())) {
          if (dashboardYear === 'all') targetYear = d.getFullYear();
          if (dashboardMonth === 'all') targetMonth = d.getMonth();
        }
      }
    }

    const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();

    const data = Array.from({ length: daysInMonth }, (_, index) => {
      const dayNum = index + 1;
      return {
        name: `${dayNum}`,
        paid: 0,
        partially_paid: 0,
        unpaid: 0,
        total: 0
      };
    });

    activeInvoices.forEach(inv => {
      const date = new Date(inv.createdAt);
      if (date.getFullYear() === targetYear && date.getMonth() === targetMonth) {
        const dayIndex = date.getDate() - 1;
        if (dayIndex >= 0 && dayIndex < daysInMonth) {
          if (inv.status === 'paid') data[dayIndex].paid += 1;
          else if (inv.status === 'unpaid') data[dayIndex].unpaid += 1;
          else if (inv.status === 'partially_paid') data[dayIndex].partially_paid += 1;
          
          data[dayIndex].total += inv.totalAmount;
        }
      }
    });

    return data;
  }, [activeInvoices, dashboardMonth, dashboardYear]);

  const currentMonthName = useMemo(() => {
    const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    return months[new Date().getMonth()];
  }, []);

  // Chart data: Employee financial distribution (total registered invoices per employee)
  const employeeData = useMemo(() => {
    const dataMap: Record<string, number> = {};
    activeInvoices.forEach(inv => {
      const creator = inv.createdBy || inv.lastModifiedBy || 'غير محدد';
      dataMap[creator] = (dataMap[creator] || 0) + inv.totalAmount;
    });

    return Object.entries(dataMap)
      .map(([name, value]) => ({
        name,
        value
      }))
      .sort((a, b) => b.value - a.value);
  }, [activeInvoices]);

  // Mini charts data based on last 7 days with robust fallback for sparklines
  const miniChartData = useMemo(() => {
    const data = [];
    for(let i=6; i>=0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0,0,0,0);
      const nextD = new Date(d);
      nextD.setDate(nextD.getDate() + 1);

      const dayInvoices = activeInvoices.filter(inv => {
        const invDate = new Date(inv.createdAt);
        return invDate >= d && invDate < nextD;
      });

      data.push({
        name: d.toLocaleDateString('ar-OM', { weekday: 'short' }),
        billed: dayInvoices.reduce((s, inv) => s + inv.totalAmount, 0),
        paid: dayInvoices.reduce((s, inv) => s + inv.downPayment, 0),
        outstanding: dayInvoices.reduce((s, inv) => s + inv.remainingAmount, 0),
        count: dayInvoices.filter(inv => inv.status === 'unpaid' || inv.status === 'partially_paid').length,
      });
    }

    // If all billed are 0, distribute activeInvoices across the 7 days for lively sparkline indicators
    const totalB = data.reduce((s, item) => s + item.billed, 0);
    if (totalB === 0 && activeInvoices.length > 0) {
      activeInvoices.forEach((inv, idx) => {
        const dayIdx = idx % 7;
        data[dayIdx].billed += inv.totalAmount;
        data[dayIdx].paid += inv.downPayment;
        data[dayIdx].outstanding += inv.remainingAmount;
        if (inv.status === 'unpaid' || inv.status === 'partially_paid') {
          data[dayIdx].count += 1;
        }
      });
    }

    return data;
  }, [activeInvoices]);

  // --- Support Tickets Analytics ---
  const isUserHr = useMemo(() => {
    return currentUser && (currentUser.role === 'admin' || !!currentUser.permissions?.manageTickets);
  }, [currentUser]);

  const visibleTickets = useMemo(() => {
    if (!tickets) return [];
    if (isUserHr) {
      return tickets;
    }
    return tickets.filter(t => t.employeeId === currentUser?.id);
  }, [tickets, isUserHr, currentUser?.id]);

  const ticketStats = useMemo(() => {
    const total = visibleTickets.length;
    const newCount = visibleTickets.filter(t => t.status === 'new').length;
    const processing = visibleTickets.filter(t => t.status === 'processing').length;
    const completed = visibleTickets.filter(t => t.status === 'completed').length;
    
    // Resolution rate
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, newCount, processing, completed, rate };
  }, [visibleTickets]);

  // Chart 1: Ticket Types Distribution
  const ticketTypesData = useMemo(() => {
    const counts: Record<string, number> = {};
    visibleTickets.forEach(t => {
      const type = t.type || 'أخرى';
      counts[type] = (counts[type] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [visibleTickets]);

  // Chart 2: Tickets by Employee (for managers) or Recent Activity (for staff)
  const ticketsByEmployeeData = useMemo(() => {
    if (!isUserHr) return [];
    const counts: Record<string, { name: string; completed: number; processing: number; newCount: number; total: number }> = {};
    visibleTickets.forEach(t => {
      const emp = t.employeeName || 'غير محدد';
      if (!counts[emp]) {
        counts[emp] = { name: emp, completed: 0, processing: 0, newCount: 0, total: 0 };
      }
      counts[emp].total += 1;
      if (t.status === 'completed') counts[emp].completed += 1;
      else if (t.status === 'processing') counts[emp].processing += 1;
      else if (t.status === 'new') counts[emp].newCount += 1;
    });
    return Object.values(counts).sort((a, b) => b.total - a.total).slice(0, 10);
  }, [visibleTickets, isUserHr]);

  // Last 5 tickets for regular employees
  const recentUserTickets = useMemo(() => {
    return [...visibleTickets]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [visibleTickets]);


  const [ticketMonthFilter, setTicketMonthFilter] = useState(new Date().getMonth());
  const [ticketYearFilter, setTicketYearFilter] = useState(new Date().getFullYear());

  const dailyTicketStats = useMemo(() => {
    const monthTickets = visibleTickets.filter(t => {
      const d = new Date(t.createdAt);
      return d.getMonth() === ticketMonthFilter && d.getFullYear() === ticketYearFilter;
    });
    
    const daysInMonth = new Date(ticketYearFilter, ticketMonthFilter + 1, 0).getDate();
    const dailyData = Array.from({ length: daysInMonth }, (_, i) => ({
      day: String(i + 1),
      'جديدة': 0,
      'قيد المعالجة': 0,
      'مكتملة': 0,
    }));

    monthTickets.forEach(t => {
      const day = new Date(t.createdAt).getDate();
      if (t.status === 'new') dailyData[day - 1]['جديدة']++;
      else if (t.status === 'processing') dailyData[day - 1]['قيد المعالجة']++;
      else if (t.status === 'completed') dailyData[day - 1]['مكتملة']++;
    });

    return dailyData;
  }, [visibleTickets, ticketMonthFilter, ticketYearFilter]);

  const resolutionTimeData = useMemo(() => {
    const resolvedTickets = visibleTickets.filter(t => t.status === 'completed' && t.updatedAt);
    const timesByType: Record<string, { totalHours: number; count: number }> = {};
    
    resolvedTickets.forEach(t => {
      const start = new Date(t.createdAt).getTime();
      const end = new Date(t.updatedAt).getTime();
      const hours = (end - start) / (1000 * 60 * 60);
      const type = t.type || 'أخرى';
      
      if (!timesByType[type]) {
        timesByType[type] = { totalHours: 0, count: 0 };
      }
      timesByType[type].totalHours += hours;
      timesByType[type].count++;
    });

    return Object.entries(timesByType).map(([name, data]: [string, any]) => ({
      name,
      'متوسط وقت الإغلاق (ساعات)': Math.round((data.totalHours / data.count) * 10) / 10
    })).sort((a, b) => b['متوسط وقت الإغلاق (ساعات)'] - a['متوسط وقت الإغلاق (ساعات)']);
  }, [visibleTickets]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-700 to-teal-900 rounded-2xl p-6 text-white shadow-lg flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold mb-2">لوحة التحكم الرئيسية</h2>
          <p className="text-teal-100 text-sm">نظرة عامة على الأداء المالي ونشاط المكاتب</p>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-2 relative overflow-hidden">
          <div className="flex items-center justify-between z-10">
            <h3 className="text-xs font-semibold text-slate-500">الإيرادات المفوترة</h3>
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><Coins className="w-4 h-4" /></div>
          </div>
          <div className="text-xl font-black text-slate-800 font-mono z-10">{totalBilled.toFixed(3)} <span className="text-xs text-slate-500 font-sans font-medium">ر.ع</span></div>
          <div className="w-full mt-2 z-10 opacity-60 -mx-2 min-h-[60px]" style={{ height: "60px" }}>
            <ResponsiveContainer width="99%" height={60}>
              <LineChart data={miniChartData}>
                <Line type="monotone" dataKey="billed" stroke="#2563eb" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-2 relative overflow-hidden">
          <div className="flex items-center justify-between z-10">
            <h3 className="text-xs font-semibold text-slate-500">المبالغ المحصلة</h3>
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg"><CheckCircle2 className="w-4 h-4" /></div>
          </div>
          <div className="text-xl font-black text-emerald-600 font-mono z-10">{totalPaid.toFixed(3)} <span className="text-xs text-emerald-500/70 font-sans font-medium">ر.ع</span></div>
          <div className="w-full mt-2 z-10 opacity-60 -mx-2 min-h-[60px]" style={{ height: "60px" }}>
            <ResponsiveContainer width="99%" height={60}>
              <LineChart data={miniChartData}>
                <Line type="monotone" dataKey="paid" stroke="#059669" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-2 relative overflow-hidden">
          <div className="flex items-center justify-between z-10">
            <h3 className="text-xs font-semibold text-slate-500">الديون المتبقية</h3>
            <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg"><Clock className="w-4 h-4" /></div>
          </div>
          <div className="text-xl font-black text-amber-500 font-mono z-10">{totalOutstanding.toFixed(3)} <span className="text-xs text-amber-500/70 font-sans font-medium">ر.ع</span></div>
          <div className="w-full mt-2 z-10 opacity-60 -mx-2 min-h-[60px]" style={{ height: "60px" }}>
            <ResponsiveContainer width="99%" height={60}>
              <LineChart data={miniChartData}>
                <Line type="monotone" dataKey="outstanding" stroke="#d97706" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-2 relative overflow-hidden">
          <div className="flex items-center justify-between z-10">
            <h3 className="text-xs font-semibold text-slate-500">فواتير معلقة</h3>
            <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg"><AlertCircle className="w-4 h-4" /></div>
          </div>
          <div className="text-xl font-black text-rose-600 font-mono z-10">{unpaidInvoicesCount} <span className="text-xs text-rose-500/70 font-sans font-medium">فاتورة</span></div>
          <div className="w-full mt-2 z-10 opacity-70 -mx-2" style={{ height: "60px", minWidth: 0 }}>
            <ResponsiveContainer width="100%" height={60}>
              <BarChart data={miniChartData} margin={{top: 0, right: 2, left: 2, bottom: 0}}>
                <Bar dataKey="count" fill="#e11d48" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Daily Chart for Current Month */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
        <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-teal-600" />
          حالات الفواتير حسب الأيام {dashboardMonth === 'all' ? 'لكافة الأشهر' : dashboardMonth === 'current' ? 'لشهر ' + new Date().toLocaleDateString('ar-OM', { month: 'long' }) : 'لشهر ' + new Date(0, parseInt(dashboardMonth) - 1).toLocaleDateString('ar-OM', { month: 'long' })} {dashboardYear === 'all' ? 'لكافة السنوات' : dashboardYear === 'current' ? new Date().getFullYear() : dashboardYear}
        </h3>
        <div className="h-64 w-full" dir="ltr">
          <ResponsiveContainer width="99%" height="100%">
            <BarChart data={dailyCurrentMonthData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{fontSize: 12}} stroke="#94a3b8" />
              <YAxis tick={{fontSize: 12}} stroke="#94a3b8" />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                cursor={{fill: '#f8fafc'}}
              />
              <Legend wrapperStyle={{fontSize: '12px', paddingTop: '10px'}} />
              <Bar dataKey="paid" name="مدفوعة" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} />
              <Bar dataKey="partially_paid" name="مدفوعة جزئياً" stackId="a" fill="#f59e0b" />
              <Bar dataKey="unpaid" name="غير مدفوعة" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Chart and Employee Distribution Pie Chart side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Monthly Chart */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-teal-600" />
            معدل الفواتير حسب الحالات خلال أشهر السنة
          </h3>
          <div className="h-64 w-full" dir="ltr">
            <ResponsiveContainer width="99%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{fontSize: 12}} stroke="#94a3b8" />
                <YAxis tick={{fontSize: 12}} stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  cursor={{fill: '#f8fafc'}}
                />
                <Legend wrapperStyle={{fontSize: '12px', paddingTop: '10px'}} />
                <Bar dataKey="paid" name="مدفوعة" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} />
                <Bar dataKey="partially_paid" name="مدفوعة جزئياً" stackId="a" fill="#f59e0b" />
                <Bar dataKey="unpaid" name="غير مدفوعة" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Employee Distribution Pie Chart */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-indigo-600" />
            التوزيع المالي للموظفين (إجمالي الفواتير المنجزة)
          </h3>
          <div className="h-64 w-full flex flex-col justify-between" dir="ltr">
            <div className="h-44 w-full">
              <ResponsiveContainer width="99%" height="100%">
                <PieChart>
                  <Pie
                    data={employeeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {employeeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => [`${parseFloat(value).toFixed(3)} ر.ع.`, 'إجمالي الفواتير']}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Scrollable Custom Legend with Arabic alignment */}
            <div className="max-h-20 overflow-y-auto pr-1 text-right mt-1" dir="rtl">
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                {employeeData.map((entry, index) => {
                  const totalVal = employeeData.reduce((sum, d) => sum + d.value, 0) || 1;
                  const pct = ((entry.value / totalVal) * 100).toFixed(1);
                  return (
                    <div key={entry.name} className="flex items-center gap-1.5 min-w-0">
                      <span 
                        className="w-2 h-2 rounded-full shrink-0" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      ></span>
                      <span className="font-semibold text-slate-700 truncate max-w-[80px]">{entry.name}</span>
                      <span className="text-slate-400 font-mono">({pct}%)</span>
                    </div>
                  );
                })}
                {employeeData.length === 0 && (
                  <div className="col-span-2 text-center text-slate-400 py-2">لا توجد بيانات للفواتير</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top 10 Debtors */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Users className="w-4 h-4 text-rose-500" />
              أكثر 10 عملاء تأخراً عن الدفع
            </h3>
            <button 
              onClick={() => onNavigate('reports')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
            >
              تقارير الديون
            </button>
          </div>
          <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
            {debtors.length > 0 ? debtors.map((debtor, index) => (
              <div key={debtor.id} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-xl transition-colors border border-slate-50">
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${index < 3 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-500'}`}>
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-slate-800 truncate max-w-[200px]">{debtor.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{debtor.phone}</div>
                  </div>
                </div>
                <div className="text-left">
                  <div className="font-mono text-sm font-bold text-rose-600">{debtor.owed.toFixed(3)} ر.ع</div>
                </div>
              </div>
            )) : (
              <div className="text-center p-4 text-xs text-slate-400">لا توجد ديون معلقة</div>
            )}
          </div>
        </div>

        {/* Top 10 Unpaid Invoices */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-500" />
              أكبر 10 فواتير ديون معلقة
            </h3>
            <button 
              onClick={() => onNavigate('invoices')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
            >
              إدارة الفواتير
            </button>
          </div>
          <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
            {topUnpaidInvoices.length > 0 ? topUnpaidInvoices.map((inv, index) => {
              const cust = customers.find(c => c.id === inv.customerId);
              return (
                <div key={inv.id} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-xl transition-colors border border-slate-50">
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${index < 3 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <div className="font-semibold text-sm text-slate-800">{inv.invoiceNumber}</div>
                        {(() => {
                          const createdDate = new Date(inv.createdAt);
                          const today = new Date();
                          const diffTime = today.getTime() - createdDate.getTime();
                          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                          if (diffDays > 20) {
                            return (
                              <span 
                                className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded bg-rose-50 text-rose-600 border border-rose-100 text-[8px] animate-pulse font-bold"
                                title={`متأخرة منذ ${diffDays} يوماً`}
                              >
                                <AlertTriangle className="w-2.5 h-2.5 text-rose-500" />
                                <span>متأخرة</span>
                              </span>
                            );
                          }
                          return null;
                        })()}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate max-w-[150px]">{cust?.name || 'غير معروف'}</div>
                    </div>
                  </div>
                  <div className="text-left">
                    <div className="font-mono text-sm font-bold text-amber-600">{inv.remainingAmount.toFixed(3)} ر.ع</div>
                    <div className="text-[9px] text-slate-400">{new Date(inv.createdAt).toLocaleDateString('ar-OM')}</div>
                  </div>
                </div>
              );
            }) : (
              <div className="text-center p-4 text-xs text-slate-400">لا توجد فواتير معلقة</div>
            )}
          </div>
        </div>
      </div>

      {/* Support Tickets & Administrative Requests Analytics Section */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1">
            <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
              <LifeBuoy className="w-5 h-5 text-teal-600 animate-spin-slow" />
              <span>قسم طلبات الدعم الإداري والتذاكر</span>
            </h3>
            <p className="text-xs text-slate-400">مؤشرات أداء وحدة التذاكر والطلبات الداخلية للموظفين والمكاتب</p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('tickets')}
            className="px-4 py-2 bg-teal-50 text-teal-700 hover:bg-teal-100 hover:text-teal-800 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 border border-teal-100/30"
          >
            <MessageSquare className="w-4 h-4" />
            <span>عرض وإدارة التذاكر والطلبات 🡠</span>
          </button>
        </div>

        {/* Tickets Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Card 1: Total */}
          <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100/80 flex items-center gap-3.5">
            <div className="p-3 bg-teal-50 text-teal-600 rounded-xl shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-bold leading-tight">إجمالي الطلبات</span>
              <span className="text-xl font-black text-slate-800 font-mono mt-0.5 block">{ticketStats.total}</span>
            </div>
          </div>

          {/* Card 2: New/Pending */}
          <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100/80 flex items-center gap-3.5">
            <div className={`p-3 rounded-xl shrink-0 ${ticketStats.newCount > 0 ? 'bg-amber-100 text-amber-600 animate-pulse' : 'bg-slate-100 text-slate-400'}`}>
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-bold leading-tight">جديدة (تحت المراجعة)</span>
              <span className={`text-xl font-black font-mono mt-0.5 block ${ticketStats.newCount > 0 ? 'text-amber-600 font-black' : 'text-slate-800'}`}>{ticketStats.newCount}</span>
            </div>
          </div>

          {/* Card 3: Processing */}
          <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100/80 flex items-center gap-3.5">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-bold leading-tight">قيد المعالجة</span>
              <span className="text-xl font-black text-slate-800 font-mono mt-0.5 block">{ticketStats.processing}</span>
            </div>
          </div>

          {/* Card 4: Completed */}
          <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100/80 flex items-center gap-3.5">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-bold leading-tight">تم تلبيتها وإغلاقها</span>
              <span className="text-xl font-black text-slate-800 font-mono mt-0.5 block">
                {ticketStats.completed} <span className="text-[10px] text-emerald-600 font-bold font-sans">({ticketStats.rate}%)</span>
              </span>
            </div>
          </div>
        </div>

        {/* Charts & Interactive Area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
          
          {/* NEW CHART 1: Daily Ticket Status */}
          <div className="border border-slate-100 rounded-2xl p-5 space-y-4 lg:col-span-2">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-50 pb-2.5">
              <h4 className="font-bold text-xs text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                <span>تحليل انواع الطلبات المستلمة وحالاتها حسب الأيام</span>
              </h4>
              <div className="flex items-center gap-2 text-xs">
                <select
                  value={ticketMonthFilter}
                  onChange={e => setTicketMonthFilter(Number(e.target.value))}
                  className="bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-2 py-1 outline-none"
                >
                  {['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'].map((m, i) => (
                    <option key={i} value={i}>{m}</option>
                  ))}
                </select>
                <select
                  value={ticketYearFilter}
                  onChange={e => setTicketYearFilter(Number(e.target.value))}
                  className="bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-2 py-1 outline-none"
                >
                  {[new Date().getFullYear(), new Date().getFullYear() - 1].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
            {dailyTicketStats.some(d => d['جديدة'] > 0 || d['قيد المعالجة'] > 0 || d['مكتملة'] > 0) ? (
              <div className="h-64 w-full" dir="ltr">
                <ResponsiveContainer width="99%" height="100%">
                  <BarChart data={dailyTicketStats} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                    <XAxis dataKey="day" tick={{ fontSize: 10 }} interval={0} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 9 }} stroke="#94a3b8" allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontFamily: 'Cairo, sans-serif' }} />
                    <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '5px' }} />
                    <Bar dataKey="جديدة" stackId="a" fill="#f59e0b" radius={[0, 0, 3, 3]} />
                    <Bar dataKey="قيد المعالجة" stackId="a" fill="#3b82f6" />
                    <Bar dataKey="مكتملة" stackId="a" fill="#10b981" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center text-slate-400 text-xs">
                لا توجد طلبات مسجلة في هذا الشهر
              </div>
            )}
          </div>

          {/* NEW CHART 2: Average Resolution Time */}
          <div className="border border-slate-100 rounded-2xl p-5 space-y-4 lg:col-span-2">
            <h4 className="font-bold text-xs text-slate-700 flex items-center gap-1.5 border-b border-slate-50 pb-2.5">
              <Clock className="w-3.5 h-3.5 text-teal-600" />
              <span>متوسط الفترة الزمنية لإغلاق الطلبات (بالساعات) حسب نوع الطلب</span>
            </h4>
            {resolutionTimeData.length > 0 ? (
              <div className="h-64 w-full" dir="ltr">
                <ResponsiveContainer width="99%" height="100%">
                  <BarChart data={resolutionTimeData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                    <XAxis dataKey="name" tick={{ fontSize: 9 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 9 }} stroke="#94a3b8" />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontFamily: 'Cairo, sans-serif' }} />
                    <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '5px' }} />
                    <Bar dataKey="متوسط وقت الإغلاق (ساعات)" fill="#8b5cf6" radius={[3, 3, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center text-slate-400 text-xs">
                لا توجد طلبات مغلقة لعرض متوسط الوقت
              </div>
            )}
          </div>

          {/* Chart A: Distribution of support requests by category */}
          <div className="border border-slate-100 rounded-2xl p-5 space-y-4">
            <h4 className="font-bold text-xs text-slate-700 flex items-center gap-1.5 border-b border-slate-50 pb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>توزيع طلبات الدعم حسب التصنيف والنوع</span>
            </h4>
            {ticketTypesData.length > 0 ? (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 h-56" dir="ltr">
                <div className="h-full w-full sm:w-1/2">
                  <ResponsiveContainer width="99%" height="100%">
                    <PieChart>
                      <Pie
                        data={ticketTypesData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {ticketTypesData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: any) => [`${value} طلب`, 'إجمالي الطلبات']}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontFamily: 'Cairo, sans-serif', direction: 'rtl' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full sm:w-1/2 overflow-y-auto max-h-48 pr-2" dir="rtl">
                  <div className="space-y-1.5 text-xs">
                    {ticketTypesData.map((entry, index) => {
                      const pct = ticketStats.total > 0 ? ((entry.value / ticketStats.total) * 100).toFixed(0) : '0';
                      return (
                        <div key={entry.name} className="flex items-center justify-between p-1.5 hover:bg-slate-50 rounded-lg transition-colors">
                          <div className="flex items-center gap-2">
                            <span 
                              className="w-2.5 h-2.5 rounded-full shrink-0" 
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            ></span>
                            <span className="font-bold text-slate-700">{entry.name}</span>
                          </div>
                          <div className="flex items-center gap-1.5 font-mono text-slate-400">
                            <span className="font-bold text-slate-800">{entry.value}</span>
                            <span>({pct}%)</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-56 flex flex-col items-center justify-center text-center text-slate-400 text-xs">
                لا توجد طلبات مسجلة لعرض إحصائيات التصنيفات
              </div>
            )}
          </div>

          {/* Chart B / List B: Manager Workload or Employee Recents */}
          {isUserHr ? (
            <div className="border border-slate-100 rounded-2xl p-5 space-y-4">
              <h4 className="font-bold text-xs text-slate-700 flex items-center gap-1.5 border-b border-slate-50 pb-2.5">
                <Users className="w-3.5 h-3.5 text-purple-600" />
                <span>إحصائيات وضغط عمل طلبات الموظفين</span>
              </h4>
              {ticketsByEmployeeData.length > 0 ? (
                <div className="h-56 w-full" dir="ltr">
                  <ResponsiveContainer width="99%" height="100%">
                    <BarChart data={ticketsByEmployeeData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                      <XAxis dataKey="name" tick={{ fontSize: 9 }} stroke="#94a3b8" />
                      <YAxis tick={{ fontSize: 9 }} stroke="#94a3b8" allowDecimals={false} />
                      <Tooltip
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontFamily: 'Cairo, sans-serif' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '5px' }} />
                      <Bar dataKey="completed" name="مغلق ومكتمل" stackId="a" fill="#10b981" radius={[0, 0, 3, 3]} />
                      <Bar dataKey="processing" name="قيد المعالجة" stackId="a" fill="#3b82f6" />
                      <Bar dataKey="newCount" name="طلب جديد" stackId="a" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-56 flex flex-col items-center justify-center text-center text-slate-400 text-xs">
                  لا توجد طلبات مسجلة لعرض إحصائيات الموظفين
                </div>
              )}
            </div>
          ) : (
            <div className="border border-slate-100 rounded-2xl p-5 space-y-4">
              <h4 className="font-bold text-xs text-slate-700 flex items-center gap-1.5 border-b border-slate-50 pb-2.5">
                <MessageSquare className="w-3.5 h-3.5 text-teal-600" />
                <span>آخر تذاكرك ومستجدات الردود</span>
              </h4>
              <div className="space-y-2 max-h-[224px] overflow-y-auto pr-1">
                {recentUserTickets.length > 0 ? (
                  recentUserTickets.map(t => (
                    <div 
                      key={t.id} 
                      onClick={() => onNavigate('tickets')}
                      className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-xl transition-all border border-slate-100/50 cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="shrink-0 text-[10px] font-bold font-mono text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">
                          {t.ticketNumber}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-xs text-slate-800 truncate max-w-[200px] group-hover:text-teal-600 transition-colors flex items-center gap-1.5">
                            <span>{t.title}</span>
                            {t.unreadByEmployee && (
                              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" title="رد جديد معلق"></span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-2">
                            <span>تاريخ الطلب: {new Date(t.createdAt).toLocaleDateString('ar-OM')}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300 shrink-0"></span>
                            <span className="font-semibold text-teal-600">{t.type}</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        {t.status === 'new' && (
                          <span className="px-2 py-1 bg-amber-50 text-amber-700 border border-amber-100 rounded-lg text-[9px] font-black shrink-0">
                            جديد
                          </span>
                        )}
                        {t.status === 'processing' && (
                          <span className="px-2 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg text-[9px] font-black shrink-0">
                            قيد المعالجة
                          </span>
                        )}
                        {t.status === 'completed' && (
                          <span className="px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg text-[9px] font-black shrink-0">
                            مكتمل
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="h-44 flex flex-col items-center justify-center text-center text-slate-400 text-xs">
                    لم تقم بتقديم أي طلبات دعم بعد
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
