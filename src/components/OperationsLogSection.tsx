import React, { useState, useMemo } from 'react';
import { ActivityLog, User } from '../types';
import { Activity, Search, Clock, User as UserIcon, Calendar, TrendingUp, RotateCcw, FileSpreadsheet, Server, AlertCircle, ShieldAlert } from 'lucide-react';
import * as XLSX from 'xlsx';
import { toast } from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

interface OperationsLogSectionProps {
  logs: ActivityLog[];
  users: User[];
}

export default function OperationsLogSection({ logs, users }: OperationsLogSectionProps) {
  const [activeTab, setActiveTab] = useState<'users' | 'system'>('users');

  const [searchTerm, setSearchTerm] = useState('');
  const [filterUser, setFilterUser] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>({ key: 'timestamp', direction: 'desc' });

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Separation of logs:
  const isSystemLog = (log: ActivityLog) => log.userId === 'system' || log.action.includes('نظام') || log.action.includes('صيانة') || log.action.includes('قاعدة') || log.action.includes('System') || log.action.includes('Database') || log.action.includes('خطأ') || log.action.includes('Error');

  const userLogs = logs.filter(log => !isSystemLog(log));
  const systemLogs = logs.filter(log => isSystemLog(log));

  const currentList = activeTab === 'users' ? userLogs : systemLogs;

  const filteredLogs = useMemo(() => {
    return currentList.filter(log => {
      const matchesSearch = searchTerm === '' || 
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) || 
        log.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.details && log.details.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesUser = activeTab === 'system' ? true : (filterUser === 'all' || log.username === filterUser);
      
      const logDate = new Date(log.timestamp).toISOString().split('T')[0];
      const matchesDate = filterDate === '' || logDate === filterDate;
      
      return matchesSearch && matchesUser && matchesDate;
    }).sort((a, b) => {
      if (!sortConfig) return 0;
      
      const direction = sortConfig.direction === 'asc' ? 1 : -1;
      
      if (sortConfig.key === 'timestamp') {
        return new Date(a.timestamp).getTime() > new Date(b.timestamp).getTime() ? direction : -direction;
      }
      
      let valA = (a as any)[sortConfig.key] || '';
      let valB = (b as any)[sortConfig.key] || '';
      
      if (valA < valB) return -1 * direction;
      if (valA > valB) return 1 * direction;
      return 0;
    });
  }, [currentList, searchTerm, filterUser, filterDate, sortConfig, activeTab]);

  // Analytics Data
  const logsCountByUser = useMemo(() => {
    const counts: Record<string, number> = {};
    userLogs.forEach(log => {
      counts[log.username] = (counts[log.username] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [userLogs]);

  const heatmapData = useMemo(() => {
    const grid = Array.from({ length: 7 }, () => Array(24).fill(0));
    let maxCount = 0;

    userLogs.forEach(log => {
       const d = new Date(log.timestamp);
       const day = d.getDay(); // 0 (Sun) to 6 (Sat)
       const hour = d.getHours(); // 0 to 23
       grid[day][hour]++;
       if (grid[day][hour] > maxCount) {
         maxCount = grid[day][hour];
       }
    });
    return { grid, maxCount };
  }, [userLogs]);

  const logsByDate = useMemo(() => {
    const counts: Record<string, number> = {};
    const last7Days = Array.from({length: 7}, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();
    
    last7Days.forEach(date => {
      counts[date] = 0;
    });

    userLogs.forEach(log => {
      const date = new Date(log.timestamp).toISOString().split('T')[0];
      if (counts[date] !== undefined) {
        counts[date]++;
      }
    });

    return Object.entries(counts).map(([date, count]) => ({ date, count }));
  }, [userLogs]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

  const exportToExcel = () => {
    try {
      const dataToExport = filteredLogs.map(log => ({
        'التاريخ': new Date(log.timestamp).toLocaleDateString('ar-OM'),
        'الوقت': new Date(log.timestamp).toLocaleTimeString('ar-OM'),
        'المستخدم / المصدر': log.username,
        'العملية / الحدث': log.action,
        'التفاصيل': log.details || '-'
      }));

      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, activeTab === 'users' ? "User_Activities" : "System_Events");
      XLSX.writeFile(wb, `${activeTab === 'users' ? 'سجل_أنشطة_المستخدمين' : 'تقارير_أداء_النظام'}_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('تم تصدير البيانات بنجاح');
    } catch (error) {
      console.error("Export error:", error);
      toast.error('حدث خطأ أثناء تصدير البيانات');
    }
  };

  const uniqueUsers = Array.from(new Set(userLogs.map(l => l.username)));

  return (
    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500" dir="rtl">
      
      {/* Header & Stats - Reduced Padding and Margin */}
      <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
          <div>
            <h1 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-600" />
              سجل العمليات والأنشطة
            </h1>
            <p className="text-slate-500 mt-1 text-[11px] font-medium">متابعة دقيقة لكافة العمليات والأحداث و تقارير استقرار النظام</p>
          </div>
          <div className="flex gap-2">
            <div className="bg-indigo-50 border border-indigo-100 p-2 px-4 rounded-lg text-center">
              <p className="text-[10px] text-indigo-600 font-bold mb-0.5">الأنشطة</p>
              <p className="text-lg font-black text-indigo-700">{userLogs.length}</p>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 p-2 px-4 rounded-lg text-center">
              <p className="text-[10px] text-emerald-600 font-bold mb-0.5">أحداث النظام</p>
              <p className="text-lg font-black text-emerald-700">{systemLogs.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-white rounded-t-xl border-b border-slate-200 overflow-hidden shadow-sm">
        <button 
          onClick={() => { setActiveTab('users'); setSearchTerm(''); setFilterDate(''); }}
          className={`flex-1 py-2.5 text-sm font-bold transition-colors ${activeTab === 'users' ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          <div className="flex items-center justify-center gap-2">
            <UserIcon className="w-4 h-4" />
            سجل أنشطة المستخدمين
          </div>
        </button>
        <button 
          onClick={() => { setActiveTab('system'); setSearchTerm(''); setFilterDate(''); }}
          className={`flex-1 py-2.5 text-sm font-bold transition-colors ${activeTab === 'system' ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          <div className="flex items-center justify-center gap-2">
            <Server className="w-4 h-4" />
            تقارير أداء النظام وقاعدة البيانات
          </div>
        </button>
      </div>

      {activeTab === 'users' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 h-64 flex flex-col">
            <h3 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
              الأنشطة في آخر 7 أيام
            </h3>
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={logsByDate} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                  <XAxis dataKey="date" tick={{fontSize: 9}} tickFormatter={(val) => val.substring(5)} />
                  <YAxis tick={{fontSize: 9}} />
                  <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '11px'}} />
                  <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} name="عدد العمليات" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 h-64 flex flex-col">
            <h3 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
              <UserIcon className="w-3.5 h-3.5 text-slate-400" />
              أنشط المستخدمين
            </h3>
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <Pie
                    data={logsCountByUser}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="count"
                  >
                    {logsCountByUser.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '11px'}} />
                  <Legend wrapperStyle={{fontSize: '10px'}} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* New Heatmap Section */}
          <div className="lg:col-span-2 bg-white p-3 rounded-xl shadow-sm border border-slate-200">
             <h3 className="text-xs font-bold text-slate-700 mb-4 flex items-center gap-1.5">
               <Calendar className="w-3.5 h-3.5 text-slate-400" />
               الخريطة الحرارية لأوقات الذروة (أيام / ساعات)
             </h3>
             <div className="overflow-x-auto">
               <div className="min-w-[700px]">
                 <div className="flex text-[10px] text-slate-400 mb-1 pr-14">
                   {Array.from({length: 24}).map((_, i) => (
                     <div key={i} className="flex-1 text-center font-mono">{i.toString().padStart(2, '0')}:00</div>
                   ))}
                 </div>
                 {heatmapData.grid.map((row, dayIdx) => (
                   <div key={dayIdx} className="flex mb-1.5 items-center gap-1">
                     <div className="w-14 text-[10px] font-bold text-slate-500 text-right">
                       {['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'][dayIdx]}
                     </div>
                     <div className="flex flex-1 gap-1">
                       {row.map((count, hourIdx) => {
                         const intensity = heatmapData.maxCount > 0 ? count / heatmapData.maxCount : 0;
                         return (
                           <div 
                             key={hourIdx} 
                             className="flex-1 h-7 rounded-sm relative group cursor-pointer transition-colors border border-slate-100/50"
                             style={{
                               backgroundColor: count > 0 ? `rgba(99, 102, 241, ${Math.max(0.15, intensity)})` : '#f8fafc'
                             }}
                           >
                             <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-slate-800 text-white text-[10px] py-1 px-2 rounded whitespace-nowrap z-10 pointer-events-none">
                               {count} عملية - الساعة {hourIdx.toString().padStart(2, '0')}:00
                             </div>
                           </div>
                         )
                       })}
                     </div>
                   </div>
                 ))}
               </div>
             </div>
          </div>
        </div>
      )}

      {/* Main Table Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        
        {/* Filters - Reduced Padding and Height */}
        <div className="p-3 border-b border-slate-100 bg-slate-50/50 flex flex-wrap gap-2 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[9px] font-bold text-slate-500 mb-0.5">بحث في {activeTab === 'users' ? 'العمليات' : 'الأحداث'}</label>
            <div className="relative">
              <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder={activeTab === 'users' ? "ابحث عن إجراء أو مستخدم..." : "ابحث عن نوع الحدث أو التفاصيل..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-2 pr-8 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                style={{ height: '27.6px' }}
              />
            </div>
          </div>
          
          {activeTab === 'users' && (
            <div className="w-full sm:w-40">
              <label className="block text-[9px] font-bold text-slate-500 mb-0.5">المستخدم</label>
              <select
                value={filterUser}
                onChange={(e) => setFilterUser(e.target.value)}
                className="w-full px-2 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                style={{ height: '27.6px' }}
              >
                <option value="all">الكل</option>
                {uniqueUsers.map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          )}

          <div className="w-full sm:w-36">
            <label className="block text-[9px] font-bold text-slate-500 mb-0.5">التاريخ</label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full px-2 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              style={{ height: '27.6px' }}
            />
          </div>

          <button
            onClick={() => {
              setSearchTerm('');
              setFilterUser('all');
              setFilterDate('');
              setSortConfig({ key: 'timestamp', direction: 'desc' });
            }}
            className="px-3 bg-white border border-slate-200 text-slate-600 rounded-lg text-[11px] font-bold hover:bg-slate-50 flex items-center gap-1.5"
            style={{ height: '27.6px' }}
          >
            <RotateCcw className="w-3 h-3" />
            إعادة تعيين
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
              <tr>
                <th className="px-3 py-2 font-bold w-36">
                  <button onClick={() => handleSort('timestamp')} className="flex items-center gap-1 hover:text-indigo-600">
                    <Clock className="w-3.5 h-3.5" /> الوقت والتاريخ
                    {sortConfig?.key === 'timestamp' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </button>
                </th>
                <th className="px-3 py-2 font-bold w-40">
                  <button onClick={() => handleSort('username')} className="flex items-center gap-1 hover:text-indigo-600">
                    {activeTab === 'users' ? <UserIcon className="w-3.5 h-3.5" /> : <Server className="w-3.5 h-3.5" />}
                    {activeTab === 'users' ? 'المستخدم' : 'المصدر'}
                    {sortConfig?.key === 'username' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </button>
                </th>
                <th className="px-3 py-2 font-bold w-48">
                  <button onClick={() => handleSort('action')} className="flex items-center gap-1 hover:text-indigo-600">
                    <Activity className="w-3.5 h-3.5" /> 
                    {activeTab === 'users' ? 'العملية / الحدث' : 'نوع الحدث'}
                    {sortConfig?.key === 'action' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </button>
                </th>
                <th className="px-3 py-2 font-bold">التفاصيل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-3 py-2.5 whitespace-nowrap text-slate-600 font-mono text-[10px]">
                    {new Date(log.timestamp).toLocaleString('ar-OM', {
                      year: 'numeric', month: '2-digit', day: '2-digit',
                      hour: '2-digit', minute: '2-digit', second: '2-digit'
                    })}
                  </td>
                  <td className="px-3 py-2.5 font-bold text-indigo-700">
                    {log.username === 'system' ? 'النظام الآلي' : log.username}
                  </td>
                  <td className={`px-3 py-2.5 font-bold ${activeTab === 'system' && log.action.includes('صيانة') ? 'text-amber-600' : activeTab === 'system' && (log.action.includes('توقف') || log.action.includes('فشل')) ? 'text-rose-600' : 'text-slate-800'}`}>
                    {activeTab === 'system' && log.action.includes('صيانة') && <ShieldAlert className="w-3.5 h-3.5 inline ml-1" />}
                    {activeTab === 'system' && (log.action.includes('توقف') || log.action.includes('Error') || log.action.includes('فشل')) && <AlertCircle className="w-3.5 h-3.5 inline ml-1" />}
                    {log.action}
                  </td>
                  <td className="px-3 py-2.5 text-slate-500">
                    {log.details || '-'}
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-8 text-center text-slate-400">
                    لا توجد بيانات تطابق معايير البحث الحالية
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
          <p className="text-[10px] font-bold text-slate-500">
            يتم عرض {filteredLogs.length} {activeTab === 'users' ? 'عملية' : 'حدث'}
          </p>
          <button
            onClick={exportToExcel}
            className="text-[10px] font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            تصدير إلى Excel
          </button>
        </div>

      </div>
    </div>
  );
}
