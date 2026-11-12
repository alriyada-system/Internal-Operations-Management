import React, { useMemo } from 'react';
import { User, Invoice, Warning, Ticket, Branch } from '../types';
import { FileText, TrendingUp, AlertTriangle, Clock, CalendarDays, Award, Wallet, Briefcase, Hash, CreditCard, CheckCircle2, Ticket as TicketIcon, MapPin, DollarSign, PieChart as PieIcon, Building } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

interface EmployeeReportTabProps {
  user: User;
  invoices: Invoice[];
  warnings: Warning[];
  tickets?: Ticket[];
  branches?: Branch[];
}

export default function EmployeeReportTab({ user, invoices, warnings, tickets = [], branches = [] }: EmployeeReportTabProps) {
  // Filter invoices for this user
  const userInvoices = invoices.filter(inv => inv.createdBy === user.name || inv.lastModifiedBy === user.name);
  
  // Filter warnings for this user
  const userWarnings = warnings.filter(w => w.employeeId === user.id);

  // Filter tickets for this user
  const userTickets = tickets.filter(t => t.employeeId === user.id || t.employeeName === user.name);

  const totalInvoicesAmount = userInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalPaidAmount = userInvoices.reduce((sum, inv) => sum + (inv.totalAmount - (inv.remainingAmount || 0)), 0);
  const totalUnpaidAmount = userInvoices.reduce((sum, inv) => sum + (inv.remainingAmount || 0), 0);

  // Charts Data
  const monthlyData = useMemo(() => {
    const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    const currentYear = new Date().getFullYear();
    const data = months.map((m) => ({
      name: m,
      amount: 0,
      count: 0
    }));

    userInvoices.forEach(inv => {
      const d = new Date(inv.createdAt);
      if (d.getFullYear() === currentYear) {
        data[d.getMonth()].amount += inv.totalAmount;
        data[d.getMonth()].count += 1;
      }
    });

    return data;
  }, [userInvoices]);

  const activeMonthsCount = monthlyData.filter(m => m.amount > 0).length || 1;
  const averageMonthlyAmount = totalInvoicesAmount / activeMonthsCount;

  const paidUnpaidData = useMemo(() => {
    return [
      { name: 'المبالغ المدفوعة', value: totalPaidAmount, color: '#10b981' },
      { name: 'المبالغ غير المدفوعة', value: totalUnpaidAmount, color: '#ef4444' },
    ].filter(item => item.value > 0);
  }, [totalPaidAmount, totalUnpaidAmount]);

  const warningsData = useMemo(() => {
    const counts: Record<string, number> = {};
    userWarnings.forEach(w => {
      counts[w.degree] = (counts[w.degree] || 0) + 1;
    });
    return [
      { name: 'منخفضة', value: counts['low'] || 0, color: '#f59e0b' },
      { name: 'متوسطة', value: counts['medium'] || 0, color: '#f97316' },
      { name: 'عالية', value: counts['high'] || 0, color: '#ef4444' },
    ].filter(item => item.value > 0);
  }, [userWarnings]);

  const ticketsData = useMemo(() => {
    let newCount = 0;
    let processingCount = 0;
    let completedCount = 0;
    userTickets.forEach(t => {
      if (t.status === 'new') newCount++;
      else if (t.status === 'processing') processingCount++;
      else if (t.status === 'completed') completedCount++;
    });
    return [
      { name: 'جديدة', value: newCount, color: '#3b82f6' },
      { name: 'قيد المعالجة', value: processingCount, color: '#f59e0b' },
      { name: 'مكتملة', value: completedCount, color: '#10b981' },
    ].filter(item => item.value > 0);
  }, [userTickets]);

  const COLORS = ['#f59e0b', '#f97316', '#ef4444', '#3b82f6', '#10b981'];

  const skills = user.skills || ['خدمة العملاء', 'استخدام الحاسب الآلي', 'الطباعة السريعة'];
  const provided = user.providedServices || ['تخليص معاملات تجارية', 'إصدار تأشيرات'];
  const branchName = branches.find(b => b.id === user.branchId)?.name || 'غير محدد';

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Header with PDF / Print Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200 gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-xl font-bold text-slate-800">تقرير ملخص الموظف</h2>
            {user.jobTitle && (
              <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold border border-indigo-100">
                {user.jobTitle}
              </span>
            )}
          </div>
          <p className="text-sm font-semibold text-indigo-600 mt-1">{user.fullName || user.name}</p>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all cursor-pointer"
        >
          <FileText className="w-4 h-4" />
          تنزيل / طباعة التقرير (PDF)
        </button>
      </div>

      {/* Header Profile Summary Cards */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="flex items-center gap-3 p-3 bg-slate-50/70 rounded-xl border border-slate-100">
          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-bold mb-0.5">المستوى الوظيفي</p>
            <p className="font-bold text-slate-800 text-sm">{user.level || 'غير محدد'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 bg-slate-50/70 rounded-xl border border-slate-100">
          <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-lg flex items-center justify-center shrink-0">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-bold mb-0.5">طبيعة الدوام</p>
            <p className="font-bold text-slate-800 text-sm">{user.workNature || 'غير محدد'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 bg-slate-50/70 rounded-xl border border-slate-100">
          <div className="w-10 h-10 bg-violet-50 text-violet-600 rounded-lg flex items-center justify-center shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-bold mb-0.5">رقم المقعد</p>
            <p className="font-bold text-slate-800 text-sm">{user.seatNumber || 'غير محدد'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 bg-slate-50/70 rounded-xl border border-slate-100">
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center shrink-0">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-bold mb-0.5">الفرع</p>
            <p className="font-bold text-slate-800 text-sm truncate max-w-[120px]">{branchName}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 bg-slate-50/70 rounded-xl border border-slate-100">
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-bold mb-0.5">المناوبة (Shift)</p>
            <p className="font-bold text-slate-800 text-sm">{user.shift || 'غير محدد'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 bg-slate-50/70 rounded-xl border border-slate-100">
          <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center shrink-0">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-bold mb-0.5">تاريخ الانضمام</p>
            <p className="font-bold text-slate-800 text-xs">{user.joinDate || user.registrationDate || 'غير محدد'}</p>
          </div>
        </div>
      </div>

      {/* Financial Performance & Paid/Unpaid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance & Revenue Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                الأداء المالي السنوي (المبيعات)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">متوسط المبالغ الشهرية: <span className="font-bold text-slate-700 font-mono">{averageMonthlyAmount.toFixed(3)} ر.ع.</span></p>
            </div>
            <div className="text-left bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100">
              <p className="text-xs text-emerald-700 font-bold">إجمالي المبيعات للعام الحالي</p>
              <p className="text-lg font-black text-emerald-800 font-mono">{totalInvoicesAmount.toFixed(3)} ر.ع.</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: any) => [`${value} ر.ع.`, 'المبيعات']}
                />
                <Bar dataKey="amount" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Paid vs Unpaid Amounts Pie Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-indigo-600" />
            المبالغ المدفوعة وغير المدفوعة
          </h3>
          <p className="text-xs text-slate-500 mb-4">توزيع المبالغ المالية لفواتير الموظف</p>
          {paidUnpaidData.length > 0 ? (
            <div className="flex-1 flex flex-col justify-center">
              <div className="h-44 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paidUnpaidData}
                      cx="50%"
                      cy="50%"
                      innerRadius={35}
                      outerRadius={65}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {paidUnpaidData.map((entry, index) => (
                        <Cell key={`cell-paid-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(val: any) => [`${Number(val).toFixed(3)} ر.ع.`, '']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
                <div className="flex justify-between font-bold text-slate-700">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>المدفوعة:</span>
                  <span className="font-mono text-emerald-600">{totalPaidAmount.toFixed(3)} ر.ع.</span>
                </div>
                <div className="flex justify-between font-bold text-slate-700">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>غير المدفوعة:</span>
                  <span className="font-mono text-rose-600">{totalUnpaidAmount.toFixed(3)} ر.ع.</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/50">
              <p className="font-bold text-slate-700 text-xs">لا توجد مبالغ مسجلة</p>
            </div>
          )}
        </div>
      </div>

      {/* Tickets Summary & Warnings Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tickets / Requests Summary Pie Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <TicketIcon className="w-5 h-5 text-blue-600" />
            ملخص طلبات التذاكر
          </h3>
          {userTickets.length > 0 ? (
            <div className="flex-1 flex flex-col justify-center">
              <div className="h-48 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={ticketsData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {ticketsData.map((entry, index) => (
                        <Cell key={`cell-ticket-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-slate-600">إجمالي التذاكر والطلبات: <span className="text-blue-600 text-lg">{userTickets.length}</span></p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-blue-100 rounded-xl bg-blue-50/50">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-3">
                <TicketIcon className="w-6 h-6" />
              </div>
              <p className="font-bold text-blue-900">لا توجد طلبات</p>
              <p className="text-xs text-blue-600 mt-1">لم يتم إنشاء أو تعيين أي تذاكر لهذا الموظف حتى الآن.</p>
            </div>
          )}
        </div>

        {/* Warnings Summary */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            ملخص الإنذارات والمخالفات
          </h3>
          {userWarnings.length > 0 ? (
            <div className="flex-1 flex flex-col justify-center">
              <div className="h-48 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={warningsData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {warningsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-slate-600">إجمالي الإنذارات: <span className="text-rose-600 text-lg">{userWarnings.length}</span></p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-emerald-100 rounded-xl bg-emerald-50/50">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-3">
                <Award className="w-6 h-6" />
              </div>
              <p className="font-bold text-emerald-800">سجل ممتاز</p>
              <p className="text-xs text-emerald-600 mt-1">لا توجد أي إنذارات أو مخالفات مسجلة على هذا الموظف.</p>
            </div>
          )}
        </div>
      </div>

      {/* Skills & Qualifications Section */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-indigo-600" />
          المهارات، المؤهلات والخبرات
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <p className="text-xs font-bold text-slate-500 mb-2">المهارات المكتسبة:</p>
              <div className="flex flex-wrap gap-2">
                {skills.map((s, idx) => (
                  <span key={idx} className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold border border-indigo-100 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-slate-500 mb-2">الخدمات والمهام المنجزة:</p>
              <div className="flex flex-wrap gap-2">
                {provided.map((p, idx) => (
                  <span key={idx} className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-medium border border-slate-200">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-xs font-bold text-slate-500 mb-1">تفاصيل المؤهلات والخبرات:</p>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap max-h-32 overflow-y-auto">
                {user.qualifications || 'لم يتم إضافة مؤهلات أو خبرات مفصلة بعد.'}
              </div>
            </div>

            {user.qualificationFiles && user.qualificationFiles.length > 0 && (
              <div>
                <p className="text-xs font-bold text-slate-500 mb-1">مستندات المؤهلات المرفقة ({user.qualificationFiles.length}):</p>
                <div className="flex flex-col gap-1.5">
                  {user.qualificationFiles.map((file, fIdx) => (
                    <a key={fIdx} href={file.url} download={file.name} className="flex items-center gap-2 text-indigo-700 hover:text-indigo-900 text-xs font-medium bg-indigo-50/50 p-2 rounded-lg border border-indigo-100">
                      <FileText className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{file.name}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Additional Info Cards (Updated: bank account replaced with total sales) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-indigo-600">
            <Hash className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold mb-1">الرقم الوظيفي</p>
            <p className="font-bold text-slate-800 text-lg">{user.employeeId || '—'}</p>
          </div>
        </div>
        <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-emerald-600">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold mb-1">إجمالي المبيعات</p>
            <p className="font-bold text-slate-800 text-lg font-mono">{totalInvoicesAmount.toFixed(3)} <span className="text-xs text-slate-500">ر.ع.</span></p>
          </div>
        </div>
        <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-blue-600">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold mb-1">إجمالي الفواتير المسجلة</p>
            <p className="font-bold text-slate-800 text-lg">{userInvoices.length} <span className="text-sm font-normal text-slate-500">فاتورة</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
