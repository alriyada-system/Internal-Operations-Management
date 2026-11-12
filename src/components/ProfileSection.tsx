import toast from 'react-hot-toast';
import React, { useState, useEffect } from 'react';
import { User, Warning, MailMessage, Invoice, Branch, PrivateMessage, Ticket } from '../types';
import { User as UserIcon, AlertTriangle, Wallet, MessageSquare, Briefcase, Mail, Send, Plus, X, BarChart3, TrendingUp, ShieldAlert, CheckCircle, ChevronDown, CheckCheck, Check, Paperclip, Reply, Forward, Trash2, Save, Building, Camera, FileText, ShieldCheck, KeyRound, Smile, Clock, Lock, Unlock, CheckCircle2, XCircle, Users, Tag, DollarSign, Layers, Shield, Eye, HelpCircle, AlertCircle, FileCheck, Info, SlidersHorizontal, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, Legend, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import EmployeeReportTab from './EmployeeReportTab';

interface ProfileSectionProps {
  systemSettings?: any;
  currentUser: User;
  users: User[];
  warnings: Warning[];
  setWarnings: React.Dispatch<React.SetStateAction<Warning[]>>;
  mails?: MailMessage[];
  setMails?: React.Dispatch<React.SetStateAction<MailMessage[]>>;
  invoices: Invoice[]; // For calculating performance
  branches: Branch[];
  privateMessages?: PrivateMessage[];
  setPrivateMessages?: React.Dispatch<React.SetStateAction<PrivateMessage[]>>;
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  tickets?: Ticket[];
  onOpenPasswordModal: (userId?: string) => void;
}


const formatTime12Hour = (timeStr?: string) => {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':');
  let h = parseInt(hours, 10);
  const ampm = h >= 12 ? 'م' : 'ص';
  h = h % 12;
  h = h ? h : 12; // the hour '0' should be '12'
  return `${h}:${minutes} ${ampm}`;
};

export default function ProfileSection({
  currentUser,
  users = [],
  warnings = [],
  setWarnings,
  mails = [],
  setMails,
  invoices = [],
  branches = [],
  privateMessages = [],
  setPrivateMessages,
  setUsers,
  tickets = [],
  onOpenPasswordModal,
  systemSettings,
}: ProfileSectionProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'warnings' | 'account' | 'chat_mail' | 'security' | 'performance' | 'report'>('info');
  const [viewedUserId, setViewedUserId] = useState<string>(currentUser.id);
  
  const displayedUser = users.find(u => u.id === viewedUserId) || currentUser;

  const tabs = [
    { id: 'info', label: 'معلوماتي الشخصية', icon: UserIcon },
    { id: 'report', label: 'تقرير الموظف', icon: FileText },
    { id: 'warnings', label: 'الإنذارات والمخالفات', icon: AlertTriangle },
    { id: 'account', label: 'الحساب و ألأداء', icon: Wallet },
    { id: 'performance', label: 'المهارات والخبرات', icon: Briefcase },
    { id: 'security', label: 'الأمان', icon: ShieldCheck },
  ];

  const handleSendWarning = (newWarning: Warning) => {
    setWarnings(prev => [newWarning, ...prev]);
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Profile Header & Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 sm:p-6 bg-linear-to-l from-indigo-900 to-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center border-2 border-white/20 shrink-0 overflow-hidden">
              {displayedUser.avatarUrl ? (
                <img src={displayedUser.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="w-8 h-8 text-white" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-white">{displayedUser.fullName || displayedUser.name}</h2>
                {(currentUser.role === 'admin' || currentUser.role === 'hr') && (
                  <select
                    value={viewedUserId}
                    onChange={(e) => setViewedUserId(e.target.value)}
                    className="bg-white/10 border border-white/20 text-white rounded-lg px-2 py-1 text-xs focus:outline-hidden focus:ring-2 focus:ring-white/50 [&>option]:text-slate-800"
                  >
                    {users.filter(u => !u.id.endsWith('_config')).map(u => (
                      <option key={u.id} value={u.id}>{u.name} {u.id === currentUser.id ? '(أنت)' : ''}</option>
                    ))}
                  </select>
                )}
              </div>
              <p className="text-indigo-200 text-sm mt-1">{displayedUser.jobTitle || 'موظف'}</p>
            </div>
          </div>
        </div>
        
        <div className="flex overflow-x-auto">   </div>
        
        <div className="flex overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 min-w-[150px] py-4 px-4 flex items-center justify-center gap-2 text-sm font-bold transition-colors ${
                activeTab === tab.id 
                  ? 'text-indigo-700 bg-indigo-50/50' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.id === 'warnings' && warnings.filter(w => w.employeeId === currentUser.id && w.unreadByEmployee).length > 0 && (
                <span className="relative flex h-5 w-5 items-center justify-center shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-5 w-5 bg-rose-500 text-[10px] text-white font-black items-center justify-center shadow-xs">
                    {warnings.filter(w => w.employeeId === currentUser.id && w.unreadByEmployee).length}
                  </span>
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'info' && <PersonalInfoTab user={displayedUser} currentUser={currentUser} branches={branches} setUsers={setUsers} users={users} />}
          {activeTab === 'warnings' && (
            <WarningsTab 
              currentUser={currentUser} 
              users={users} 
              warnings={warnings} 
              onAddWarning={handleSendWarning} 
              setWarnings={setWarnings}
              setUsers={setUsers}
              systemSettings={systemSettings}
            />
          )}
          {activeTab === 'account' && <AccountTab user={displayedUser} invoices={invoices} />}
          {activeTab === 'security' && <SecurityTab currentUser={displayedUser} onOpenPasswordModal={onOpenPasswordModal} />}
          {activeTab === 'performance' && <PerformanceTab user={displayedUser} invoices={invoices} />}
          {activeTab === 'report' && <EmployeeReportTab user={displayedUser} invoices={invoices} warnings={warnings} tickets={tickets} branches={branches} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function SecurityTab({ currentUser, onOpenPasswordModal }: { currentUser: User, onOpenPasswordModal: (userId?: string) => void }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
        <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-800">إعدادات الأمان وحماية الحساب</h3>
          <p className="text-sm text-slate-500">إدارة كلمة المرور وإعدادات الأمان الخاصة بحسابك</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200/60 gap-4">
        <div>
          <h4 className="font-bold text-slate-800 text-sm">كلمة المرور</h4>
          <p className="text-xs text-slate-500 mt-1">يُفضل تغيير كلمة المرور بشكل دوري لحماية أمان حسابك وبياناتك.</p>
        </div>
        <button
          onClick={() => onOpenPasswordModal(currentUser.id)}
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all cursor-pointer"
        >
          <KeyRound className="w-4 h-4" />
          تغيير كلمة المرور
        </button>
      </div>
    </div>
  );
}

function PersonalInfoTab({ user, currentUser, branches, setUsers, users }: { user: User, currentUser: User, branches: Branch[], setUsers: any, users: User[] }) {
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const canEdit = (currentUser.role === 'admin' || currentUser.role === 'hr');
  const branchObj = branches.find(b => b.id === (user.branchId || 'branch-1'));
  const branchName = branchObj ? branchObj.name : 'الفرع الرئيسي';

  const [editingCustodyUser, setEditingCustodyUser] = useState<string | null>(null);
  const configUser = users.find(u => u.id === "custodies_config");
const defaultCategories = [
    {
      id: 'cc-1',
      name: 'العهد التقنية والإلكترونية',
      subTypes: [
        'أجهزة الحاسوب وملحقاتها: أجهزة حاسوب محمول أو مكتبي، شاشات إضافية، لوحة مفاتيح، فأرة',
        'أجهزة الاتصال: هواتف ذكية، شرائح اتصال (SIM)، أجهزة اتصال لاسلكي',
        'الأجهزة الميدانية والمساندة: أجهزة لوحية (Tablets)، قارئات باركود، طابعات محمولة',
        'مفاتيح الأمان الرقمية: مفاتيح مشفرة (USB Security Keys) للوصول للأنظمة'
      ]
    },
    {
      id: 'cc-2',
      name: 'عهد النقل والمواصلات',
      subTypes: [
        'سيارات العمل: سيارات ميدانية للمبيعات والصيانة، أو سيارات إدارية',
        'بطاقات التنقل والوقود: بطاقات تعبئة الوقود، بطاقات دفع رسوم الطرق والمواقف'
      ]
    },
    {
      id: 'cc-3',
      name: 'العهد المالية',
      subTypes: [
        'السلفة النثرية (Petty Cash): مبالغ مالية لتغطية المصاريف التشغيلية اليومية والطارئة',
        'بطاقات المشتريات: بطاقات ائتمانية مؤسسية مخصصة لمشتريات الشركة'
      ]
    },
    {
      id: 'cc-4',
      name: 'عهد الأمان وحق الدخول',
      subTypes: [
        'بطاقات الهوية والدخول: بطاقات الدخول الذكية وشارات التعريف (ID Badges)',
        'المفاتيح الفيزيائية: مفاتيح المكاتب، الخزائن، والمستودعات'
      ]
    },
    {
      id: 'cc-5',
      name: 'عهد السلامة والزي الموحد',
      subTypes: [
        'الزي الموحد (Uniform): ملابس العمل الرسمية الخاصة بالشركة',
        'معدات الحماية الشخصية (PPE): خوذة الأمان، أحذية السلامة (Safety Shoes)، النظارات الواقية'
      ]
    },
    {
      id: 'cc-6',
      name: 'العهد والتجهيزات التخصصية',
      subTypes: [
        'معدات إعلامية وتسويقية: كاميرات احترافية، إضاءات، ومعدات تصوير',
        'أجهزة فحص وهندسة: أجهزة القياس والفحص الميداني للمهندسين والفنيين',
        'تجهيزات العمل من المنزل: أثاث مكتبي وأجهزة إضافية للعمل عن بُعد',
        'أخرى'
      ]
    }
  ];
  const custodyCategories = configUser?.custodyCategories || defaultCategories;
  const [newCustodyCategory, setNewCustodyCategory] = useState("");
  const [newCustodySub, setNewCustodySub] = useState("");
  const [newCustodyDetails, setNewCustodyDetails] = useState("");

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setUsers(users.map(u => u.id === user.id ? { ...u, avatarUrl: base64String } : u));
      };
      reader.readAsDataURL(file);
    }
  };

  const infoFields = [
    { label: 'الإسم الثلاثي', value: user.fullName || user.name, readOnly: true },
    { label: 'المسمى الوظيفي', value: user.jobTitle || (user.role === 'admin' ? 'مدير النظام' : user.role === 'hr' ? 'الموارد البشرية' : 'موظف'), field: 'jobTitle' },
    { label: 'الفرع', value: branchName, isBranch: true, readOnly: true },
    { label: 'الرقم الوظيفي', value: user.employeeId || '—', field: 'employeeId' },
    { label: 'طبيعة الدوام / نظام المناوبة', value: user.workNature || 'غير محدد' },
    { label: 'فترة المناوبة (Shift)', value: user.shift ? `${user.shift}${user.checkInTime ? ' (' + formatTime12Hour(user.checkInTime) + (user.checkOutTime ? ' - ' + formatTime12Hour(user.checkOutTime) : '') + ')' : ''}${user.shiftNotes ? ' - ' + user.shiftNotes : ''}` : 'غير محدد' },
    { label: 'تاريخ التعيين', value: user.joinDate, field: 'joinDate', type: 'date' },
    { label: 'تاريخ التسجيل بالنظام', value: user.registrationDate || user.joinDate || '—', field: 'registrationDate', type: 'date' },
    { label: 'العنوان', value: user.address, field: 'address' },
    { label: 'رقم المقعد / الجهاز', value: user.seatNumber || '—', field: 'seatNumber' },
    { label: 'رقم التواصل', value: user.contactNumber, field: 'contactNumber' },
    { label: 'الحالة الإجتماعية', value: user.maritalStatus, field: 'maritalStatus', type: 'select', options: ['أعزب', 'متزوج'] },
    { label: 'البطاقة الشخصية', value: user.idCardUrl ? 'مرفق متوفر' : 'غير متوفر' },
    { label: 'رقم أحد الأقارب', value: user.relativePhone, field: 'relativePhone' },
    { label: 'اتفاقية العمل', value: user.workAgreement },
    { label: 'المؤهلات والخبرات', value: user.qualifications },
    { label: 'تصنيف المستوى (Level)', value: user.level || 'غير محدد' },
    { label: 'البيانات البنكية', value: (user.bankName || user.bankAccount) ? `${user.bankName || 'غير محدد'} - ${user.bankAccount || 'غير محدد'}` : 'غير محدد' },
    { label: 'العهد المستلمة', value: user.custodies && user.custodies.length > 0 ? `${user.custodies.length} عهدة` : 'لا يوجد عهد' },
  ];

  return (
    <>
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <UserIcon className="w-5 h-5 text-indigo-600" />
          البيانات الشخصية
        </h3>
        
        <div className="flex items-center gap-4 ml-auto mr-4">
          <div className="relative group">
            <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden border-2 border-indigo-200">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="صورة شخصية" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-indigo-500">{(user.name || user.fullName || 'م').charAt(0)}</span>
              )}
            </div>
            {(canEdit && isEditingInfo) && (
              <label className="absolute bottom-0 right-0 bg-indigo-600 text-white rounded-full p-1 cursor-pointer shadow-sm hover:bg-indigo-700 transition-colors">
                <Camera className="w-3 h-3" />
                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
              </label>
            )}
          </div>
          <div className="text-right">
            <h4 className="font-bold text-slate-800">{user.name || user.fullName}</h4>
            {(canEdit && isEditingInfo) && (
              <label className="text-xs text-indigo-600 hover:text-indigo-800 hover:underline font-bold cursor-pointer transition-colors">
                تحديث الصورة الشخصية
                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
              </label>
            )}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {infoFields.map((field, idx) => (
          <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-100 relative">
            <span className="block text-xs font-bold text-slate-400 mb-1">{field.label}</span>
            {field.label === 'اتفاقية العمل' || field.label === 'البطاقة الشخصية' ? (
              <div className="space-y-2 mt-2">
                {((field.label === 'اتفاقية العمل' ? user.workAgreementFiles : user.idCardFiles) || []).length > 0 ? (
                  <div className="flex flex-col gap-2 mb-3">
                    {((field.label === 'اتفاقية العمل' ? user.workAgreementFiles : user.idCardFiles) || []).map((file, fIdx) => (
                      <div key={fIdx} className="flex items-center justify-between bg-indigo-50 p-2 rounded-lg border border-indigo-100 group">
                        <a href={file.url} download={file.name} className="flex items-center gap-2 text-indigo-700 hover:text-indigo-900 text-xs font-medium">
                          <Paperclip className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate max-w-[180px]" title={file.name}>{file.name}</span>
                        </a>
                        {(canEdit && isEditingInfo) && (
                          <button 
                            onClick={() => {
                              if (field.label === 'اتفاقية العمل') {
                                const updatedFiles = (user.workAgreementFiles || []).filter((_, i) => i !== fIdx);
                                const updateDate = new Date().toLocaleDateString('ar-OM', { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                                setUsers(users.map(u => u.id === user.id ? { ...u, workAgreementFiles: updatedFiles, documentUpdatedAt: updateDate } : u));
                              } else {
                                const updatedFiles = (user.idCardFiles || []).filter((_, i) => i !== fIdx);
                                const updateDate = new Date().toLocaleDateString('ar-OM', { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                                setUsers(users.map(u => u.id === user.id ? { ...u, idCardFiles: updatedFiles, documentUpdatedAt: updateDate } : u));
                              }
                            }}
                            className="text-rose-500 hover:text-rose-700 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="حذف الملف"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="block text-xs text-slate-500 mb-2">لا يوجد ملفات مرفقة</span>
                )}
                {(canEdit && isEditingInfo) && (
                  <label className="inline-flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-50 cursor-pointer transition-colors shadow-sm">
                    <Plus className="w-3.5 h-3.5" /> إضافة ملفات
                    <input type="file" multiple className="hidden" accept=".pdf,.doc,.docx,.jpg,.png" onChange={(e) => {
                      const files = Array.from(e.target.files || []) as File[];
                      if (files.length === 0) return;
                      
                      const newFilesPromises = files.map(file => new Promise<{name: string, url: string}>((resolve) => {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          resolve({ name: file.name, url: reader.result as string });
                        };
                        reader.readAsDataURL(file);
                      }));
                      Promise.all(newFilesPromises).then(newFiles => {
                        if (field.label === 'اتفاقية العمل') {
                          const updatedFiles = [...(user.workAgreementFiles || []), ...newFiles];
                          setUsers(users.map(u => u.id === user.id ? { ...u, workAgreementFiles: updatedFiles } : u));
                        } else {
                          const updatedFiles = [...(user.idCardFiles || []), ...newFiles];
                          setUsers(users.map(u => u.id === user.id ? { ...u, idCardFiles: updatedFiles } : u));
                        }
                      });
                    }} />
                  </label>
                )}
              </div>
            ) : field.label === 'المؤهلات والخبرات' && (canEdit && isEditingInfo) ? (
              <div className="space-y-3">
                <textarea 
                  value={user.qualifications || ''}
                  onChange={(e) => setUsers(users.map(u => u.id === user.id ? { ...u, qualifications: e.target.value } : u))}
                  className="w-full p-2 border rounded-lg text-sm"
                  placeholder="أدخل المؤهلات والخبرات هنا..."
                />
                <div className="space-y-2">
                  <div className="flex flex-col gap-2">
                    {(user.qualificationFiles || []).map((file, fIdx) => (
                      <div key={fIdx} className="flex items-center justify-between bg-indigo-50 p-2 rounded-lg border border-indigo-100">
                        <a href={file.url} download={file.name} className="text-indigo-700 text-xs font-medium truncate max-w-[180px]">
                          {file.name}
                        </a>
                        <button 
                          onClick={() => {
                            const updatedFiles = (user.qualificationFiles || []).filter((_, i) => i !== fIdx);
                            setUsers(users.map(u => u.id === user.id ? { ...u, qualificationFiles: updatedFiles } : u));
                          }}
                          className="text-rose-500 hover:text-rose-700"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <label className="inline-flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-50 cursor-pointer transition-colors shadow-sm">
                    <Plus className="w-3.5 h-3.5" /> إضافة مستند مؤهلات
                    <input type="file" multiple className="hidden" accept=".pdf,.doc,.docx,.jpg,.png" onChange={(e) => {
                      const files = Array.from(e.target.files || []) as File[];
                      if (files.length === 0) return;
                      const newFilesPromises = files.map(file => new Promise<{name: string, url: string}>((resolve) => {
                        const reader = new FileReader();
                        reader.onloadend = () => { resolve({ name: file.name, url: reader.result as string }); };
                        reader.readAsDataURL(file);
                      }));
                      Promise.all(newFilesPromises).then(newFiles => {
                        const updatedFiles = [...(user.qualificationFiles || []), ...newFiles];
                        setUsers(users.map(u => u.id === user.id ? { ...u, qualificationFiles: updatedFiles } : u));
                      });
                    }} />
                  </label>
                </div>
              </div>
            ) : field.label === 'البيانات البنكية' && (canEdit && isEditingInfo) ? (
              <div className="flex gap-2 w-full">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="إسم البنك"
                    value={user.bankName || ''}
                    onChange={(e) => setUsers(users.map(u => u.id === user.id ? { ...u, bankName: e.target.value } : u))}
                    className="bg-white border border-slate-200 text-sm text-slate-800 px-3 py-1.5 rounded-lg shadow-sm w-full"
                  />
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="رقم الحساب البنكي"
                    value={user.bankAccount || ''}
                    onChange={(e) => setUsers(users.map(u => u.id === user.id ? { ...u, bankAccount: e.target.value } : u))}
                    className="bg-white border border-slate-200 text-sm text-slate-800 px-3 py-1.5 rounded-lg shadow-sm w-full text-left"
                    dir="ltr"
                  />
                </div>
              </div>
            ) : field.label === 'تصنيف المستوى (Level)' && (canEdit && isEditingInfo) ? (
              <div className="flex items-center justify-between">
                <select 
                  value={user.level || ''} 
                  onChange={(e) => setUsers(users.map(u => u.id === user.id ? { ...u, level: e.target.value as any } : u))}
                  className="bg-white border border-slate-200 text-sm font-medium text-slate-800 px-3 py-1.5 rounded-lg shadow-sm w-full"
                >
                  <option value="">غير محدد</option>
                  <option value="Level - 1">Level - 1</option>
                  <option value="Level - 2">Level - 2</option>
                  <option value="Level - 3">Level - 3</option>
                  <option value="Level - 4">Level - 4</option>
                  <option value="Level - 5">Level - 5</option>
                </select>
              </div>
            ) : field.label === 'طبيعة الدوام / نظام المناوبة' && (canEdit && isEditingInfo) ? (
              <div className="flex items-center justify-between">
                <select 
                  value={user.workNature || ''} 
                  onChange={(e) => setUsers(users.map(u => u.id === user.id ? { ...u, workNature: e.target.value as any } : u))}
                  className="bg-white border border-slate-200 text-sm font-medium text-slate-800 px-3 py-1.5 rounded-lg shadow-sm w-full"
                >
                  <option value="">غير محدد</option>
                  <option value="موظف ثابت دوام كامل (Full-Time)">موظف ثابت دوام كامل (Full-Time)</option>
                  <option value="موظف دوام جزئي/موسمي (Part-Time)">موظف دوام جزئي/موسمي  (Part-Time)</option>
                  <option value="موظف احتياطي / مؤقت">موظف احتياطي / مؤقت</option>
                  <option value="موظف عمل عن بعد (Online)">موظف عمل عن بعد (Online)</option>
                  <option value="موظف ملغي / مستقيل">موظف ملغي / مستقيل</option>
                </select>
              </div>
            ) : field.label === 'فترة المناوبة (Shift)' && (canEdit && isEditingInfo) ? (
              <div className="flex flex-col gap-2 w-full">
                <select 
                  value={user.shift || ''} 
                  onChange={(e) => setUsers(users.map(u => u.id === user.id ? { ...u, shift: e.target.value as any } : u))}
                  className="bg-white border border-slate-200 text-sm font-medium text-slate-800 px-3 py-1.5 rounded-lg shadow-sm w-full"
                >
                  <option value="">غير محدد</option>
                  <option value="صباحي (Morning)">صباحي (Morning)</option>
                  <option value="مسائي (Evening)">مسائي (Evening)</option>
                  <option value="متغير, مرن, هجين">متغير, مرن , هجين</option>
                </select>
                <div className="flex gap-2 items-center w-full">
                  <div className="flex-1 flex flex-col gap-1">
                    <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1"><Clock className="w-3 h-3" /> الحضور</span>
                    <input 
                      type="time" 
                      value={user.checkInTime || ''} 
                      onChange={(e) => setUsers(users.map(u => u.id === user.id ? { ...u, checkInTime: e.target.value } : u))}
                      className="bg-white border border-slate-200 text-sm text-slate-800 px-2 py-1.5 rounded-lg shadow-sm w-full"
                      title="وقت الحضور"
                    />
                  </div>
                  <div className="flex-1 flex flex-col gap-1">
                    <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1"><Clock className="w-3 h-3" /> الانصراف</span>
                    <input 
                      type="time" 
                      value={user.checkOutTime || ''} 
                      onChange={(e) => setUsers(users.map(u => u.id === user.id ? { ...u, checkOutTime: e.target.value } : u))}
                      className="bg-white border border-slate-200 text-sm text-slate-800 px-2 py-1.5 rounded-lg shadow-sm w-full"
                      title="وقت الانصراف"
                    />
                  </div>
                </div>
                <div className="w-full">
                  <input
                    type="text"
                    placeholder="ملاحظات اضافية لفترة المناوبة"
                    value={user.shiftNotes || ''}
                    onChange={(e) => setUsers(users.map(u => u.id === user.id ? { ...u, shiftNotes: e.target.value } : u))}
                    className="bg-white border border-slate-200 text-sm text-slate-800 px-3 py-1.5 rounded-lg shadow-sm w-full"
                  />
                </div>
                <div className="w-full">
                  <input
                    type="text"
                    placeholder="ملاحظات اضافية لفترة المناوبة"
                    value={user.shiftNotes || ''}
                    onChange={(e) => setUsers(users.map(u => u.id === user.id ? { ...u, shiftNotes: e.target.value } : u))}
                    className="bg-white border border-slate-200 text-sm text-slate-800 px-3 py-1.5 rounded-lg shadow-sm w-full"
                  />
                </div>
              </div>
            ) : field.label === 'العهد المستلمة' ? (
              <div className="space-y-2">
                <div className="text-sm font-medium text-slate-800 flex items-center justify-between">
                  <span>{field.value}</span>
                  {(canEdit && isEditingInfo) && (
                    <button 
                      onClick={() => setEditingCustodyUser(user.id)}
                      className="bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors cursor-pointer"
                    >
                      إدارة العهد
                    </button>
                  )}
                </div>
                {user.custodies && user.custodies.length > 0 && (
                  <div className="mt-2 flex flex-col gap-1.5">
                    {user.custodies.map((c, i) => (
                      <div key={i} className="bg-white p-2 rounded border border-slate-100 text-xs flex flex-col gap-1">
                        <div><span className="font-bold text-slate-700">{c.category}:</span> <span className="text-slate-600">{c.subType}</span></div>
                        {c.details && <div className="text-slate-500 bg-slate-50 p-1 rounded">{c.details}</div>}
                        {c.dateAssigned && <div className="text-[10px] text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3" /> استلمت في: {c.dateAssigned}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (field.field) && (canEdit && isEditingInfo) && !field.readOnly ? (
              <div className="flex items-center justify-between">
                {field.type === 'date' ? (
                  <input 
                    type="date"
                    value={(user as any)[field.field] || ''}
                    onChange={(e) => setUsers(users.map(u => u.id === user.id ? { ...u, [field.field!]: e.target.value } : u))}
                    className="bg-white border border-slate-200 text-sm font-medium text-slate-800 px-3 py-1.5 rounded-lg shadow-sm w-full"
                  />
                ) : field.type === 'select' ? (
                  <select 
                    value={(user as any)[field.field] || ''}
                    onChange={(e) => setUsers(users.map(u => u.id === user.id ? { ...u, [field.field!]: e.target.value } : u))}
                    className="bg-white border border-slate-200 text-sm font-medium text-slate-800 px-3 py-1.5 rounded-lg shadow-sm w-full"
                  >
                    <option value="">غير محدد</option>
                    {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                ) : (
                  <input 
                    type="text"
                    value={(user as any)[field.field] || ''}
                    onChange={(e) => setUsers(users.map(u => u.id === user.id ? { ...u, [field.field!]: e.target.value } : u))}
                    className="bg-white border border-slate-200 text-sm font-medium text-slate-800 px-3 py-1.5 rounded-lg shadow-sm w-full"
                    placeholder={`أدخل ${field.label}`}
                  />
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="block text-sm font-medium text-slate-800">{field.value || '—'}</span>
              </div>
            )}
          </div>
        ))}
      </div>
      {canEdit && (
        <div className="mt-6 flex justify-end">
          <button
            onClick={() => setIsEditingInfo(!isEditingInfo)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${isEditingInfo ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
          >
            {isEditingInfo ? 'إقفال التحرير' : 'تحرير البيانات'}
          </button>
        </div>
      )}
    </div>

    {/* User System Permissions & Ticket Oversight Roles Section */}
    <UserPermissionsAndTicketRolesSection
      user={user}
      currentUser={currentUser}
      users={users}
      branches={branches}
    />

    {editingCustodyUser === user.id && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden" dir="rtl">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-800">إدارة عهد الموظف</h3>
              <button onClick={() => setEditingCustodyUser(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl space-y-3">
                <h4 className="font-bold text-indigo-900 text-sm">إضافة عهدة جديدة</h4>
                <div className="grid grid-cols-1 gap-3">
                  <select 
                    value={newCustodyCategory} 
                    onChange={e => { setNewCustodyCategory(e.target.value); setNewCustodySub(''); }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                  >
                    <option value="">-- اختر فئة العهدة --</option>
                    {custodyCategories.map((c: any) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                  
                  {newCustodyCategory && (
                    <select 
                      value={newCustodySub} 
                      onChange={e => setNewCustodySub(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                    >
                      <option value="">-- اختر نوع العهدة الفرعية --</option>
                      {(custodyCategories.find((c: any) => c.name === newCustodyCategory)?.subTypes || []).map((s: string, idx: number) => (
                        <option key={idx} value={s}>{s}</option>
                      ))}
                    </select>
                  )}
                  
                  {newCustodyCategory && newCustodySub && (
                    <textarea
                      value={newCustodyDetails}
                      onChange={e => setNewCustodyDetails(e.target.value)}
                      placeholder="التفاصيل (مثل: الرقم التسلسلي، الموديل، حالة العهدة...)"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white resize-none"
                      rows={2}
                    />
                  )}
                  
                  <button 
                    onClick={() => {
                      if (newCustodyCategory && newCustodySub) {
                        const dateAssigned = new Date().toLocaleDateString('ar-OM', { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                        const updatedCustodies = [...(user.custodies || []), { category: newCustodyCategory, subType: newCustodySub, details: newCustodyDetails, dateAssigned }];
                        setUsers(users.map(u => u.id === user.id ? { ...u, custodies: updatedCustodies } : u));
                        setNewCustodyCategory('');
                        setNewCustodySub('');
                        setNewCustodyDetails('');
                      }
                    }}
                    disabled={!newCustodyCategory || !newCustodySub}
                    className="w-full bg-indigo-600 disabled:bg-indigo-300 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm font-bold transition-colors mt-2"
                  >
                    إضافة العهدة
                  </button>
                </div>
              </div>
              
              <div className="space-y-2 mt-4">
                <h4 className="font-bold text-slate-800 text-sm mb-2">العهد الحالية</h4>
                {(!user.custodies || user.custodies.length === 0) ? (
                  <p className="text-sm text-slate-500 text-center py-4 bg-slate-50 rounded-xl border border-slate-100">لا يوجد عهد مسجلة</p>
                ) : (
                  user.custodies.map((c, idx) => (
                    <div key={idx} className="flex justify-between items-start p-3 border border-slate-100 rounded-xl bg-white shadow-xs gap-3">
                      <div className="flex-1">
                        <div className="font-bold text-slate-700 text-sm">{c.category}</div>
                        <div className="text-xs text-slate-500 mb-1">{c.subType}</div>
                        {c.details && <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded mt-1 border border-slate-100">{c.details}</div>}
                        {c.dateAssigned && <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1"><Clock className="w-3 h-3" /> تم التسليم في: {c.dateAssigned}</div>}
                      </div>
                      <button 
                        onClick={() => {
                          const updated = user.custodies!.filter((_, i) => i !== idx);
                          setUsers(users.map(u => u.id === user.id ? { ...u, custodies: updated } : u));
                        }}
                        className="text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </>
  );
}

function UserPermissionsAndTicketRolesSection({
  user,
  currentUser,
  users,
  branches,
}: {
  user: User;
  currentUser: User;
  users: User[];
  branches: Branch[];
}) {
  const [permissionFilter, setPermissionFilter] = useState<'all' | 'granted' | 'denied'>('granted');
  const [ticketTypeFilter, setTicketTypeFilter] = useState<'all' | 'managed_only'>('managed_only');

  // Extract ticket configurations from tickets_config system entry
  const ticketsConfigUser = users.find(u => u.id === 'tickets_config');
  const initialDefaultTicketTypes = [
    '📎 مستلزمات مكتبية / النثريات و المشتريات الاستهلاكية',
    '🛠️ الصيانة',
    '💻 الدعم الفني',
    '🏖️ طلب إجازة',
    '🎓 طلب تدريب / ورشة',
    '🧹 خدمات التنظيف , وبيئة العمل والسلامة',
    '📄 طلب مستند / شهادة خبرة , تقدير راتب',
    '📁 طلبات إدارية (تحديث بيانات -نقل مقعد-تغيير مهام-أجر إضافي -عمولة)',
    '🚚 خدمات لوجستية',
    '💡 مقترحات , مبادرة , فكرة',
    '⚠️ شكوى أو بلاغ',
    '📌 أخرى'
  ];
  let ticketTypes = ticketsConfigUser?.ticketTypes || initialDefaultTicketTypes;
  if (!ticketTypes.some(t => t.includes('مستلزمات مكتبية') || t.includes('الدعم الفني'))) {
    ticketTypes = initialDefaultTicketTypes;
  }
  const ticketManagers = ticketsConfigUser?.ticketManagers || {};

  const isAdmin = user.role === 'admin';
  const isHr = user.role === 'hr' || !!user.permissions?.manageTickets;
  const canViewTicketAmount = isAdmin || !!user.permissions?.viewTicketAmount || !!user.permissions?.manageTicketAmount || !!user.permissions?.inputTicketAmount;
  const canInputTicketAmount = isAdmin || !!user.permissions?.inputTicketAmount || (user.permissions?.inputTicketAmount === undefined && !!user.permissions?.manageTicketAmount);
  const canManageUsers = isAdmin || !!user.permissions?.manageUsers;

  // Types where this user is explicitly registered in ticketManagers
  const managedTicketTypes = ticketTypes.filter(type => {
    const managers = ticketManagers[type] || [];
    return Array.isArray(managers) && managers.includes(user.id);
  });

  // Role info helper
  const getRoleDetails = (role: string) => {
    switch (role) {
      case 'admin':
        return {
          title: 'مدير النظام (Admin)',
          desc: 'يمتلك أعلى صلاحيات الإشراف والتحكم الكامل بالمنظومة وكافة السجلات.',
          badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
        };
      case 'hr':
        return {
          title: 'مدير موارد بشرية (HR Manager)',
          desc: 'إشراف كامل على طلبات وتذاكر الموظفين والإنذارات وشؤون الكادر الوظيفي.',
          badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
        };
      case 'accountant':
        return {
          title: 'محاسب مالي (Accountant)',
          desc: 'إدارة وتدقيق الفواتير وإقفال الحسابات والتحصيلات والتقارير المالية.',
          badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        };
      case 'staff':
        return {
          title: 'موظف تشغيلي (Staff)',
          desc: 'حساب تشغيلي لإنجاز المعاملات وتقديم الطلبات وفق الصلاحيات المحددة له.',
          badgeColor: 'bg-slate-100 text-slate-800 border-slate-200',
        };
      case 'external_support_tech':
        return {
          title: 'فني دعم خارجي (Technical Support)',
          desc: 'صلاحيات تقنية لمتابعة ومعالجة تذاكر الدعم والصيانة الفنية.',
          badgeColor: 'bg-cyan-100 text-cyan-800 border-cyan-200',
        };
      case 'external_support_admin':
        return {
          title: 'إداري دعم خارجي (Support Admin)',
          desc: 'صلاحيات إدارية لفرق المساندة الخارجية لمتابعة الطلبات الموجهة لهم.',
          badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
        };
      case 'temp_visitor':
        return {
          title: 'زائر مؤقت (Temporary Visitor)',
          desc: 'حساب استعراض مؤقت مقيد بحدود دنيا للاطلاع.',
          badgeColor: 'bg-orange-100 text-orange-800 border-orange-200',
        };
      case 'trainee':
        return {
          title: 'متدرب (Trainee)',
          desc: 'حساب تدريبي مخصص لتلقي المهام والمتابعة والتدريب العملي.',
          badgeColor: 'bg-teal-100 text-teal-800 border-teal-200',
        };
      default:
        return {
          title: role || 'موظف',
          desc: 'حساب مستخدم قياسي بالمنظومة.',
          badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
        };
    }
  };

  const roleInfo = getRoleDetails(user.role);
  const branchName = branches.find(b => b.id === (user.branchId || 'branch-1'))?.name || 'الفرع الرئيسي';

  // All system permissions items
  const allPermissions = [
    {
      id: 'manageUsers',
      name: 'إدارة المستخدمين وصلاحيات الوصول',
      description: 'إضافة وتعديل وحذف حسابات الموظفين، تغيير كلمات المرور، وتعيين الأدوار والصلاحيات.',
      category: 'إدارة النظام والتحكم',
      isGranted: isAdmin || !!user.permissions?.manageUsers,
      isCore: true,
    },
    {
      id: 'manageTickets',
      name: 'الإشراف العام على الطلبات والتذاكر (HR)',
      description: 'الاطلاع على كافة طلبات وتذاكر الموظفين لجميع الأقسام، تغيير حالاتها وإغلاقها كمسؤول موارد بشرية.',
      category: 'الطلبات والدعم',
      isGranted: isAdmin || isHr,
      isCore: true,
    },
    {
      id: 'viewTicketAmount',
      name: 'رؤية مبالغ التذاكر 👁️',
      description: 'الاطلاع على عمود المبلغ المالي وإجمالي مبالغ التذاكر في القوائم وبطاقة المبلغ في نافذة المعاينة وسجل التعديلات.',
      category: 'الطلبات والدعم',
      isGranted: canViewTicketAmount,
      isCore: true,
    },
    {
      id: 'inputTicketAmount',
      name: 'إدخال مبالغ التذاكر ✏️',
      description: 'صلاحية تحديد وكتابة المبالغ المالية عند تقديم طلب جديد، وتعديل المبالغ في نافذة المعاينة والتحكم بها.',
      category: 'الطلبات والدعم',
      isGranted: canInputTicketAmount,
      isCore: true,
    },
    {
      id: 'createInvoice',
      name: 'إصدار فواتير جديدة',
      description: 'إمكانية فتح نموذج إصدار فاتورة جديدة وحفظها وقيد بنود الخدمات والمدفوعات.',
      category: 'الفواتير والمالية',
      isGranted: isAdmin || !!user.permissions?.createInvoice,
    },
    {
      id: 'editInvoice',
      name: 'تعديل الفواتير القائمة',
      description: 'تعديل بنود وخصومات الفواتير السابقة غير المقفلة وإضافة دفعات أو تحديث بياناتها.',
      category: 'الفواتير والمالية',
      isGranted: isAdmin || !!user.permissions?.editInvoice,
    },
    {
      id: 'deleteInvoice',
      name: 'حذف الفواتير ونقلها للسلة',
      description: 'صلاحية حذف الفواتير الصادرة ونقلها إلى سلة المحذوفات أو إلغائها.',
      category: 'الفواتير والمالية',
      isGranted: isAdmin || !!user.permissions?.deleteInvoice,
    },
    {
      id: 'manageCustomers',
      name: 'إدارة وإضافة وتعديل العملاء',
      description: 'إضافة عملاء جدد (أفراد / شركات)، تعديل بيانات التواصل، وتغيير الحالات والبيانات التجارية.',
      category: 'العملاء والجهات',
      isGranted: isAdmin || !!user.permissions?.manageCustomers,
    },
    {
      id: 'closeAccounts',
      name: 'إقفال وتصفية الحسابات',
      description: 'تنفيذ عمليات إقفال الحسابات اليومية والشهرية وتصفية المعاملات المالية المفتوحة.',
      category: 'الفواتير والمالية',
      isGranted: isAdmin || !!user.permissions?.closeAccounts,
    },
    {
      id: 'viewReports',
      name: 'الاطلاع على التقارير المالية والإحصائيات',
      description: 'الوصول إلى قسم التقارير الشهرية، التحليلات البيانية، كشوفات الحساب، ومؤشرات الأداء.',
      category: 'التقارير والبيانات',
      isGranted: isAdmin || !!user.permissions?.viewReports,
    },
    {
      id: 'editServices',
      name: 'تعديل وإضافة الخدمات والأسعار',
      description: 'إضافة خدمات جديدة لقائمة الخدمات وتعديل المسميات والأسعار المعتمدة بالمنظومة.',
      category: 'الإعدادات والخدمات',
      isGranted: isAdmin || !!user.permissions?.editServices,
    },
    {
      id: 'deleteServices',
      name: 'حذف الخدمات من المنظومة',
      description: 'حذف أي خدمة من قائمة الخدمات المتاحة للفوترة والإصدار.',
      category: 'الإعدادات والخدمات',
      isGranted: isAdmin || !!user.permissions?.deleteServices,
    },
    {
      id: 'viewActivityLogs',
      name: 'الاطلاع على سجل العمليات والأنشطة',
      description: 'مراقبة سجل الحركات الإدارية، عمليات الدخول، وتسجيل الأحداث الأمنية في النظام.',
      category: 'إدارة النظام والتحكم',
      isGranted: isAdmin || !!user.permissions?.viewActivityLogs,
    },
    {
      id: 'manageWarnings',
      name: 'إدارة وتوجيه الإنذارات والمخالفات',
      description: 'صلاحية إصدار وتوجيه الإنذارات والمخالفات للموظفين ومتابعة ردودهم وتحديث درجاتها.',
      category: 'الموارد البشرية',
      isGranted: isAdmin || !!user.permissions?.manageWarnings,
    },
  ];

  const filteredPermissions = allPermissions.filter(p => {
    if (permissionFilter === 'granted') return p.isGranted;
    if (permissionFilter === 'denied') return !p.isGranted;
    return true;
  });

  const displayedTicketTypes = ticketTypes.filter(type => {
    if (ticketTypeFilter === 'managed_only') {
      return managedTicketTypes.includes(type);
    }
    return true;
  });

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mt-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-5 border-b border-slate-100 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100 shadow-2xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                صلاحيات الوصول وأدوار التذاكر المتاحة للمستخدم
                <span className="text-xs font-normal text-slate-500 font-mono">({user.name})</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                بيان تفصيلي بالصلاحيات الإدارية والمالية الممنوحة للحساب، ونطاق رؤية ومعالجة تذاكر الطلبات والدعم الإداري.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${roleInfo.badgeColor} flex items-center gap-1.5`}>
            <Shield className="w-3.5 h-3.5" />
            {roleInfo.title}
          </span>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-50 text-slate-600 border border-slate-200 flex items-center gap-1">
            <Building className="w-3.5 h-3.5 text-slate-400" />
            {branchName}
          </span>
          {user.isActive ? (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              حساب نشط
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
              حساب معطل
            </span>
          )}
        </div>
      </div>

      {/* Admin Notice */}
      {isAdmin && (
        <div className="bg-linear-to-r from-purple-50 via-indigo-50/50 to-blue-50 border border-purple-200/80 rounded-xl p-4 flex items-start gap-3">
          <div className="p-2 bg-purple-600 text-white rounded-lg shrink-0 mt-0.5 shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-black text-purple-900">حساب مدير النظام الأعلى (Super Administrator)</h4>
            <p className="text-xs text-purple-800 leading-relaxed">
              بصفتك مديراً للنظام، يمتلك هذا الحساب تلقائياً صلاحيات وصول كاملة ومطلقة على كافة عمليات المنظومة بدون أي قيود، بما في ذلك إدارة المستخدمين والصلاحيات، ومتابعة ومعالجة كافة أنواع التذاكر والطلبات لجميع الفروع، وتعديل المبالغ، وكافة العمليات المحاسبية.
            </p>
          </div>
        </div>
      )}

      {/* Part 1: Comprehensive System Permissions Grid */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-sm">صلاحيات النظام وإدارة العمليات التفصيلية</h4>
              <p className="text-[11px] text-slate-500">مصفوفة الصلاحيات المحددة للحساب في قاعدة بيانات النظام</p>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200/60 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setPermissionFilter('granted')}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                permissionFilter === 'granted' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-500 hover:text-emerald-700'
              }`}
            >
              الممنوحة ({allPermissions.filter(p => p.isGranted).length})
            </button>
            <button
              type="button"
              onClick={() => setPermissionFilter('all')}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                permissionFilter === 'all' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              الكل ({allPermissions.length})
            </button>
            <button
              type="button"
              onClick={() => setPermissionFilter('denied')}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                permissionFilter === 'denied' ? 'bg-white text-rose-700 shadow-2xs' : 'text-slate-500 hover:text-rose-700'
              }`}
            >
              المحجوبة ({allPermissions.filter(p => !p.isGranted).length})
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredPermissions.map(perm => (
            <div
              key={perm.id}
              className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
                perm.isGranted
                  ? 'bg-white border-slate-200 shadow-3xs hover:border-emerald-200'
                  : 'bg-slate-50/60 border-slate-200/60 opacity-80'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-black text-slate-800 leading-snug">
                    {perm.name}
                  </span>
                  {perm.isGranted ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md shrink-0">
                      <Check className="w-3 h-3 text-emerald-600" />
                      ممنوحة
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 rounded-md shrink-0">
                      <Lock className="w-3 h-3 text-slate-400" />
                      غير مصرح
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed">
                  {perm.description}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px] text-slate-400">
                <span className="bg-slate-100/80 text-slate-600 px-2 py-0.5 rounded">
                  {perm.category}
                </span>
                <span className="font-mono">
                  {perm.isGranted ? 'Status: Active' : 'Status: Restricted'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Part 2: Tickets & Requests Permissions and Types Block */}
      <div className="space-y-4 pt-4 border-t border-slate-200/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-sm">صلاحيات وأدوار الطلبات والدعم الإداري (التذاكر)</h4>
              <p className="text-[11px] text-slate-500">نطاق استعراض تذاكر الموظفين والأنواع الموكلة للمستخدم لإدارتها والرد عليها</p>
            </div>
          </div>
        </div>

        {/* 4 Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Card 1: Ticket Visibility */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500">نطاق رؤية واستعراض التذاكر</span>
              <div className="p-1 rounded-lg bg-blue-50 text-blue-600">
                <Eye className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-xs font-black text-slate-800 leading-snug">
              {isAdmin ? (
                <span className="text-purple-700">رؤية شاملة لكافة تذاكر النظام</span>
              ) : isHr ? (
                <span className="text-blue-700">إشراف عام (كافة تذاكر الموظفين)</span>
              ) : managedTicketTypes.length > 0 ? (
                <span className="text-indigo-700">تذاكره الخاصة + الأنواع الموكلة له</span>
              ) : (
                <span className="text-slate-700">تذاكره الخاصة فقط</span>
              )}
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              {isAdmin || isHr
                ? 'يستطيع استعراض جميع التذاكر المقدمة من أي موظف بجميع الفروع.'
                : managedTicketTypes.length > 0
                ? `يستعرض تذاكره الخاصة بالإضافة لكافة تذاكر الموظفين المندرجة تحت (${managedTicketTypes.length}) نوع موكل إليه.`
                : 'يقتصر ظهوره على متابعة التذاكر والطلبات التي قام بإنشائها بنفسه فقط.'}
            </p>
          </div>

          {/* Card 2: Managed Ticket Types */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500">إدارة مدراء الطلبات حسب النوع</span>
              <div className="p-1 rounded-lg bg-teal-50 text-teal-600">
                <Tag className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-xs font-black text-slate-800">
              {isAdmin ? (
                <span className="text-purple-700">مسؤول عن كافة الأنواع ({ticketTypes.length})</span>
              ) : isHr ? (
                <span className="text-blue-700">إشراف موارد بشرية عام</span>
              ) : managedTicketTypes.length > 0 ? (
                <span className="text-emerald-700">مدير معتمد لـ ({managedTicketTypes.length}) أنواع</span>
              ) : (
                <span className="text-slate-500">غير مكلّف بإدارة نوع محدد</span>
              )}
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              {managedTicketTypes.length > 0
                ? 'مخول بتغيير الحالة (قيد المعالجة/مكتمل) والرد الرسمي على تذاكر هذه الأنواع.'
                : isAdmin || isHr
                ? 'يمتلك سلطة الرد وتحديث الحالة لجميع تذاكر النظام.'
                : 'يمكن لمدير النظام تعيينه كمدير لأنواع محددة عبر إعدادات النظام.'}
            </p>
          </div>

          {/* Card 3: Ticket Amount Permissions */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500">صلاحيات مبالغ التذاكر والطلبات</span>
              <div className="p-1 rounded-lg bg-amber-50 text-amber-600">
                <DollarSign className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="space-y-1.5 pt-0.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 font-bold text-[11px]">رؤية مبالغ التذاكر:</span>
                {canViewTicketAmount ? (
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-black text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    متاحة ومصرّح بها
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-slate-400 font-bold text-[11px]">
                    <Lock className="w-3.5 h-3.5" />
                    محجوبة
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 font-bold text-[11px]">إدخال مبالغ التذاكر:</span>
                {canInputTicketAmount ? (
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-black text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    متاحة ومصرّح بها
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-slate-400 font-bold text-[11px]">
                    <Lock className="w-3.5 h-3.5" />
                    محجوبة
                  </span>
                )}
              </div>
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed pt-1 border-t border-slate-200/60">
              {canInputTicketAmount && canViewTicketAmount
                ? 'يمتلك كامل صلاحية رؤية وإدخال وتعديل مبالغ التذاكر والاطلاع على إجمالي المبالغ وسجلات التعديل.'
                : canViewTicketAmount
                ? 'مصرّح له برؤية واستعراض مبالغ التذاكر والإجمالي وسجل التعديلات فقط دون إمكانية إدخالها أو تعديلها.'
                : 'محجوب عنه رؤية أو إدخال أي مبالغ مالية متعلقة بالطلبات والتذاكر لعدم تفعيل الصلاحية.'}
            </p>
          </div>

          {/* Card 4: User Management Access */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500">صلاحية إدارة المستخدمين</span>
              <div className="p-1 rounded-lg bg-indigo-50 text-indigo-600">
                <Users className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              {canManageUsers ? (
                <span className="inline-flex items-center gap-1 text-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  متاحة ومصرّح بها
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-slate-500">
                  <Lock className="w-3.5 h-3.5" />
                  غير مصرّح له
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              {canManageUsers
                ? 'يحق له فتح شاشة إدارة المستخدمين وتعديل الصلاحيات والأدوار وحسابات الموظفين.'
                : 'لا يملك حق الوصول لشاشة إدارة المستخدمين أو التحكم بصلاحيات الموظفين الآخرين.'}
            </p>
          </div>
        </div>

        {/* Detailed Breakdown of Ticket Types Management */}
        <div className="bg-slate-50/50 border border-slate-200/70 rounded-xl p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">أنواع الطلبات والتذاكر المسجلة في النظام:</span>
              <span className="text-[11px] text-slate-400">({ticketTypes.length} نوع)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setTicketTypeFilter('managed_only')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  ticketTypeFilter === 'managed_only'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-200'
                }`}
              >
                الأنواع الموكلة إليك فقط ({managedTicketTypes.length})
              </button>
              <button
                type="button"
                onClick={() => setTicketTypeFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  ticketTypeFilter === 'all'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/70'
                }`}
              >
                عرض كافة الأنواع ({ticketTypes.length})
              </button>
            </div>
          </div>

          {displayedTicketTypes.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-200 rounded-xl p-6 text-center text-xs text-slate-400">
              لا توجد أنواع تذاكر موكلة لهذا الحساب حالياً
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
              {displayedTicketTypes.map((type, idx) => {
                const isManagedByThisUser = managedTicketTypes.includes(type);
                const assignedManagers = ticketManagers[type] || [];

                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border text-right transition-all flex flex-col justify-between gap-2 ${
                      isManagedByThisUser
                        ? 'bg-emerald-50/40 border-emerald-200 shadow-3xs'
                        : isAdmin || isHr
                        ? 'bg-blue-50/20 border-blue-100'
                        : 'bg-white border-slate-200/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-bold text-slate-800 leading-snug line-clamp-2">
                        {type}
                      </span>
                      {isManagedByThisUser ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full shrink-0 shadow-3xs">
                          <Check className="w-3 h-3" />
                          أنت مدير هذا النوع
                        </span>
                      ) : isAdmin ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full shrink-0">
                          مشرف عام (Admin)
                        </span>
                      ) : isHr ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full shrink-0">
                          مشرف موارد بشرية
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full shrink-0">
                          صلاحية تقديم فقط
                        </span>
                      )}
                    </div>

                    <div className="text-[10px] text-slate-500 flex items-center justify-between border-t border-slate-100/80 pt-1.5 mt-1">
                      <span>
                        {isManagedByThisUser
                          ? '✅ يمكنك معالجة التذاكر وتغيير حالتها والرد'
                          : isAdmin || isHr
                          ? 'إشراف إداري وتحكم بالحالة'
                          : 'يمكنك إنشاء طلب جديد ومتابعته'}
                      </span>
                      {assignedManagers.length > 0 && (
                        <span className="font-mono text-slate-400">
                          {assignedManagers.length} {assignedManagers.length === 1 ? 'مدير' : 'مدراء'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


function WarningsTab({ currentUser, users, warnings, onAddWarning, setWarnings, setUsers, systemSettings }: { currentUser: User, users: User[], warnings: Warning[], onAddWarning: (w: Warning) => void, setWarnings: React.Dispatch<React.SetStateAction<Warning[]>>, setUsers: React.Dispatch<React.SetStateAction<User[]>>, systemSettings?: any }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWarning, setSelectedWarning] = useState<Warning | null>(null);
  const [editingWarning, setEditingWarning] = useState<Warning | null>(null);
  const [isWarningTypesModalOpen, setIsWarningTypesModalOpen] = useState(false);
  
  const handleEditWarning = (updatedWarning: Warning) => {
    setWarnings(prev => prev.map(w => w.id === updatedWarning.id ? updatedWarning : w));
  };
  
  const handleDeleteWarning = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الإنذار نهائياً؟')) {
      setWarnings(prev => prev.filter(w => w.id !== id));
    }
  };

  const configUser = users.find(u => u.id === 'warnings_config');
  const bylawFileUrl = configUser?.bylawFileUrl || currentUser.bylawFileUrl;
  const bylawUpdatedAt = configUser?.bylawUpdatedAt || currentUser.bylawUpdatedAt;
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDegree, setFilterDegree] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [filterEmployee, setFilterEmployee] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  
  // --- Sorting State ---
  const [sortField, setSortField] = useState<'warningNumber' | 'employeeName' | 'typeName' | 'degree' | 'createdAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // If HR/Admin, they can see all warnings. If employee, only theirs.
  const rawWarnings = (currentUser.role === 'admin' || currentUser.role === 'hr') 
    ? warnings 
    : warnings.filter(w => w.employeeId === currentUser.id);

  const uniqueEmployees = Array.from(new Set(warnings.map(w => w.employeeName))).filter(Boolean).sort((a, b) => a.localeCompare(b, 'ar'));
  const uniqueTypes = Array.from(new Set(warnings.map(w => w.typeName))).filter(Boolean).sort((a, b) => a.localeCompare(b, 'ar'));

  const filteredWarnings = rawWarnings.filter(w => {
    const matchesSearch = w.warningNumber.includes(searchTerm) || 
                          w.typeName.includes(searchTerm) || 
                          w.subTypeName.includes(searchTerm) || 
                          w.details.includes(searchTerm) ||
                          w.employeeName.includes(searchTerm);
    const matchesDegree = filterDegree === 'all' || w.degree === filterDegree;
    const matchesEmployee = filterEmployee === 'all' || w.employeeName === filterEmployee;
    const matchesType = filterType === 'all' || w.typeName === filterType;
    return matchesSearch && matchesDegree && matchesEmployee && matchesType;
  }).sort((a, b) => {
    let valA = String(a[sortField] || '').toLowerCase();
    let valB = String(b[sortField] || '').toLowerCase();
    
    if (sortField === 'createdAt') {
       valA = new Date(a.createdAt).getTime().toString();
       valB = new Date(b.createdAt).getTime().toString();
    }

    const comparison = valA.localeCompare(valB, 'ar');
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  return (
    <div className="space-y-6">
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800 space-y-4">
        <div>
          <h4 className="font-bold mb-1 flex items-center gap-2"><AlertTriangle className="w-4 h-4"/> تنويه </h4>
          تُدار المخالفات وفق اللائحة الداخلية وقانون العمل؛ حيث تُسجل الإشعارات أولياً في ملف الموظف. وتُطبق العقوبات إما بناءً على تراكم الإنذارات المسجلة، أو بشكل مباشر في الحالات التي تستدعي ذلك وفق تقدير الإدارة.
        </div>
        
        <div>
          <h4 className="font-bold mb-2">اللائحة التنظيمية للمخالفات و الجزاءات</h4>
          <div className="flex items-center gap-4 flex-wrap">
            {bylawFileUrl ? (
              <button 
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = bylawFileUrl;
                  link.download = 'اللائحة_التنظيمية';
                  link.click();
                }} 
                className="font-bold underline flex items-center gap-2 text-amber-900 hover:text-amber-700 transition-colors cursor-pointer"
              >
                <FileText className="w-4 h-4" /> تحميل / عرض اللائحة الحالية
              </button>
            ) : (
              <span className="text-sm text-amber-700/70 flex items-center gap-2 font-bold">
                <FileText className="w-4 h-4" /> لم يتم رفع اللائحة بعد
              </span>
            )}
            
            <button
              onClick={() => setIsWarningTypesModalOpen(true)}
              className="text-sm font-bold flex items-center gap-2 text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-lg border border-teal-200 transition-colors cursor-pointer"
            >
              <FileText className="w-4 h-4" /> مشاهدة أنواع المخالفات
            </button>
            
            {(currentUser.role === 'admin' || currentUser.role === 'hr') && (
              <label className="flex items-center gap-2 text-sm font-bold cursor-pointer text-amber-800 hover:underline bg-amber-100/50 px-3 py-1.5 rounded-lg border border-amber-200/50 transition-colors">
                <Paperclip className="w-4 h-4"/> {bylawFileUrl ? 'تحديث اللائحة' : 'رفع اللائحة'}
                <input 
                  type="file" 
                  className="hidden" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      const base64String = reader.result as string;
                      const updateDate = new Date().toLocaleDateString('ar-OM', { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                      
                      const configExists = users.some(u => u.id === 'warnings_config');
                      if (configExists) {
                        setUsers(users.map(u => u.id === 'warnings_config' ? { ...u, bylawUpdatedAt: updateDate, bylawFileUrl: base64String } : u));
                      } else {
                        setUsers([
                          ...users,
                          {
                            id: 'warnings_config',
                            name: 'إعدادات الإنذارات',
                            username: 'warnings_config_system',
                            role: 'staff' as any,
                            isActive: false,
                            permissions: {} as any,
                            bylawUpdatedAt: updateDate,
                            bylawFileUrl: base64String
                          }
                        ]);
                      }
                    };
                    reader.readAsDataURL(file);
                  }}
                />
              </label>
            )}
          </div>
          {bylawUpdatedAt && (
            <span className="block text-[10px] text-slate-400 font-light mt-2">
              تاريخ اخر تحديث للمستند الائحة: {bylawUpdatedAt}
            </span>
          )}
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-500" />
            سجل الإنذارات والمخالفات
          </h3>
          {(currentUser.role === 'admin' || currentUser.role === 'hr') && (!systemSettings || systemSettings.enableNewWarning !== false) && (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md shadow-rose-600/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              إصدار إنذار جديد
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-4">
          <input 
            type="text" 
            placeholder="بحث..." 
            className="flex-1 p-2 border rounded-xl text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
            className="p-2 border rounded-xl text-sm"
          >
            <option value="all">كل الأنواع</option>
            {uniqueTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select 
            value={filterDegree} 
            onChange={(e) => setFilterDegree(e.target.value as any)}
            className="p-2 border rounded-xl text-sm"
          >
            <option value="all">كل الدرجات</option>
            <option value="low">منخفضة</option>
            <option value="medium">متوسطة</option>
            <option value="high">عالية</option>
          </select>
          {(currentUser.role === 'admin' || currentUser.role === 'hr') && (
            <select 
              value={filterEmployee} 
              onChange={(e) => setFilterEmployee(e.target.value)}
              className="p-2 border rounded-xl text-sm"
            >
              <option value="all">كل الموظفين</option>
              {uniqueEmployees.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
          <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
            <tr>
              <th className="p-4 cursor-pointer hover:text-indigo-600 resize-x overflow-auto" onClick={() => handleSort('warningNumber')}>
                 رقم الإنذار {sortField === 'warningNumber' && (sortOrder === 'asc' ? ' 🔼' : ' 🔽')}
              </th>
              <th className="p-4 cursor-pointer hover:text-indigo-600 resize-x overflow-auto" onClick={() => handleSort('employeeName')}>
                 الموظف {sortField === 'employeeName' && (sortOrder === 'asc' ? ' 🔼' : ' 🔽')}
              </th>
              <th className="p-4 cursor-pointer hover:text-indigo-600 resize-x overflow-auto" onClick={() => handleSort('typeName')}>
                 النوع {sortField === 'typeName' && (sortOrder === 'asc' ? ' 🔼' : ' 🔽')}
              </th>
              <th className="p-4 cursor-pointer hover:text-indigo-600 resize-x overflow-auto" onClick={() => handleSort('degree')}>
                 الدرجة {sortField === 'degree' && (sortOrder === 'asc' ? ' 🔼' : ' 🔽')}
              </th>
              <th className="p-4 cursor-pointer hover:text-indigo-600 resize-x overflow-auto" onClick={() => handleSort('senderName')}>
                 محرر الإنذار {sortField === 'senderName' && (sortOrder === 'asc' ? ' 🔼' : ' 🔽')}
              </th>
              <th className="p-4 cursor-pointer hover:text-indigo-600 resize-x overflow-auto" onClick={() => handleSort('createdAt')}>
                 التاريخ {sortField === 'createdAt' && (sortOrder === 'asc' ? ' 🔼' : ' 🔽')}
              </th>
              <th className="p-4 text-center resize-x overflow-auto">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredWarnings.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-500">لا توجد إنذارات مطابقة.</td>
              </tr>
            ) : (
              filteredWarnings.map(warning => (
                <tr 
                  key={warning.id} 
                  className="hover:bg-slate-50 cursor-pointer transition-colors"
                  onClick={() => setSelectedWarning(warning)}
                >
                  <td className="p-4 font-bold text-slate-700">
                    <div className="flex items-center gap-1.5">
                      <span>{warning.warningNumber}</span>
                      {warning.isLocked && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200" title="المحادثة مقفلة من قبل مدير النظام">
                          <Lock className="w-3 h-3" />
                          مقفلة
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">{warning.employeeName}</td>
                  <td className="p-4">{warning.typeName} - {warning.subTypeName}</td>
                  <td className="p-4">
                     <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        warning.degree === 'high' ? 'bg-rose-100 text-rose-700' :
                        warning.degree === 'medium' ? 'bg-amber-100 text-amber-700' :
                        'bg-emerald-100 text-emerald-700'
                      }`}>
                        {warning.degree === 'high' ? 'عالية' : warning.degree === 'medium' ? 'متوسطة' : 'منخفضة'}
                      </span>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1">
                      <span>{warning.senderName}</span>
                      {(warning as any).lastEditedBy && (
                        <span className="text-[10px] text-slate-400">تعديل: {(warning as any).lastEditedBy}</span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1">
                      <span>{new Date(warning.createdAt).toLocaleDateString('ar-OM')}</span>
                      {warning.updatedAt && warning.updatedAt !== warning.createdAt && (
                        <span className="text-[10px] text-slate-400">{new Date(warning.updatedAt).toLocaleDateString('ar-OM')}</span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setSelectedWarning(warning); }}
                        className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        title="عرض التفاصيل"
                      >
                        عرض
                      </button>
                      
                      {(currentUser.role === 'admin' || currentUser.role === 'hr') && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); setEditingWarning(warning); }}
                          className="bg-amber-50 text-amber-700 hover:bg-amber-100 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                          title="تعديل"
                        >
                          تعديل
                        </button>
                      )}

                      {currentUser.role === 'admin' && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDeleteWarning(warning.id); }}
                          className="bg-rose-50 text-rose-700 hover:bg-rose-100 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                          title="حذف"
                        >
                          حذف
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>

      {isModalOpen && (
        <SendWarningModal 
          onClose={() => setIsModalOpen(false)} 
          currentUser={currentUser} 
          users={users} 
          onAdd={onAddWarning} 
        />
      )}

      {editingWarning && (
        <EditWarningModal 
          warning={editingWarning}
          onClose={() => setEditingWarning(null)}
          currentUser={currentUser}
          users={users}
          onEdit={handleEditWarning}
        />
      )}

      {selectedWarning && (
        <WarningChatModal 
          warning={selectedWarning} 
          currentUser={currentUser}
          users={users}
          onClose={() => setSelectedWarning(null)}
          onUpdate={(updatedWarning: Warning) => {
            setWarnings(warnings.map(w => w.id === updatedWarning.id ? updatedWarning : w));
            setSelectedWarning(updatedWarning);
          }}
        />
      )}

      {isWarningTypesModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-scale-up">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-600" />
                أنواع الإنذارات والمخالفات المعتمدة
              </h3>
              <button onClick={() => setIsWarningTypesModalOpen(false)} className="text-slate-400 hover:text-rose-500 transition-colors p-1 bg-white rounded-lg border border-slate-200 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-4" dir="rtl">
              {(configUser?.warningTypes && configUser.warningTypes.length > 0) ? (
                <div className="space-y-4">
                  {configUser.warningTypes.map((type) => (
                    <div key={type.id} className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                      <div className="bg-slate-100 p-3 border-b border-slate-200 font-bold text-slate-800 flex justify-between items-center">
                        <span>{type.name}</span>
                        <span className="text-xs bg-white px-2 py-1 rounded-md text-slate-500 border border-slate-200 shadow-sm">{type.subOptions?.length || 0} بنود</span>
                      </div>
                      <div className="p-3">
                        {type.subOptions?.length > 0 ? (
                          <ul className="list-disc list-inside space-y-1.5 text-sm text-slate-700">
                            {type.subOptions.map(sub => (
                              <li key={sub.id}>{sub.name}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-slate-400 italic">لا توجد بنود فرعية</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-slate-500">
                  <AlertTriangle className="w-10 h-10 mx-auto text-amber-500 mb-3 opacity-50" />
                  <p className="font-bold mb-1">لا توجد أنواع مخالفات مسجلة</p>
                  <p className="text-sm">يمكن لمدير النظام إضافة أنواع المخالفات من شاشة الإعدادات.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


function SendWarningModal({ onClose, currentUser, users, onAdd }: any) {
  const [employeeId, setEmployeeId] = useState('');
  const [typeId, setTypeId] = useState('');
  const [subTypeId, setSubTypeId] = useState('');
  const [degree, setDegree] = useState<'low'|'medium'|'high'>('low');
  const [details, setDetails] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [attachedFile, setAttachedFile] = useState<{name: string, data: string} | null>(null);
  const [activeLightbox, setActiveLightbox] = useState<string | null>(null);
  
  const POPULAR_EMOJIS = ['👍', '👎', '❤️', '🔥', '👏', '🎉', '✨', '✅', '❌', '⚠️', '😊', '😂', '🤣', '😍', '😉', '😎', '😮', '😢', '😡', '😴'];
  const emojiPickerRef = React.useRef<HTMLDivElement>(null);
  const textInputRef = React.useRef<HTMLTextAreaElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const imageInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showEmojiPicker]);

  const handleEmojiSelect = (emoji: string) => {
    setDetails(prev => prev + emoji);
    textInputRef.current?.focus();
    setShowEmojiPicker(false);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === 'file') {
          const file = item.getAsFile();
          if (file) {
            if (file.type.indexOf('image') !== -1) {
              const reader = new FileReader();
              reader.onload = (event) => {
                setAttachedImage(event.target?.result as string);
              };
              reader.readAsDataURL(file);
            } else {
              if (file.size > 5 * 1024 * 1024) {
                toast.error('حجم الملف يجب أن لا يتجاوز 5 ميجابايت');
              } else {
                setAttachedFile(file);
              }
            }
            e.preventDefault();
            break;
          }
        }
      }
    }
  };
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAttachedFile({ name: file.name, data: event.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAttachedImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const configUser = users.find((u: User) => u.id === 'warnings_config');
  const warningTypes = configUser?.warningTypes && configUser.warningTypes.length > 0 
    ? configUser.warningTypes 
    : [
    { id: 'wt-1', name: 'مخالفات الحضور والانضباط الزمني', subOptions: [
      { id: 'wto-1', name: 'تأخير عن الدوام' },
      { id: 'wto-2', name: 'انصراف مبكر' },
      { id: 'wto-3', name: 'غياب بدون عذر' }
    ]},
    { id: 'wt-2', name: 'مخالفات الأداء والعمل', subOptions: [
      { id: 'wto-4', name: 'إهمال في أداء المهام' },
      { id: 'wto-5', name: 'أخطاء متكررة' }
    ]}
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const wt = warningTypes.find((t: any) => t.id === typeId);
    if (!employeeId || !typeId || !details) return toast.error('الرجاء تعبئة الحقول الأساسية');
    if (wt && wt.subOptions && wt.subOptions.length > 0 && !subTypeId) {
      return toast.error('الرجاء اختيار الخيار الفرعي');
    }
    
    const emp = users.find((u: User) => u.id === employeeId);
    const wsub = wt?.subOptions?.find((o: any) => o.id === subTypeId);

    const newWarning: Warning = {
      id: `wrn-${Date.now()}`,
      warningNumber: `WRN-${Math.floor(Math.random()*10000)}`,
      employeeId,
      employeeName: emp?.name || '',
      typeId,
      typeName: wt?.name || '',
      subTypeId,
      subTypeName: wsub?.name || '',
      degree,
      details,
      imageUrl: attachedImage || undefined,
      fileUrl: attachedFile?.data,
      fileName: attachedFile?.name,
      senderId: currentUser.id,
      senderName: currentUser.name,
      status: 'new',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
      unreadByEmployee: true,
    };
    onAdd(newWarning);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden my-auto">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-800">إصدار إنذار جديد</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-lg"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">الموظف</label>
              <select value={employeeId} onChange={e => setEmployeeId(e.target.value)} className="w-full p-2.5 border rounded-xl text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
                <option value="">اختر الموظف...</option>
                {users.filter((u: User) => !u.id.endsWith('_config')).map((u: User) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">نوع المخالفة</label>
              <select value={typeId} onChange={e => {
                const val = e.target.value;
                setTypeId(val); 
                setSubTypeId('');
                const t = warningTypes.find((wt: any) => wt.id === val);
                if(t && t.degree) {
                  setDegree(t.degree as 'low'|'medium'|'high');
                }
              }} className="w-full p-2.5 border rounded-xl text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
                <option value="">اختر النوع...</option>
                {warningTypes.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            
            {typeId && warningTypes.find((t: any) => t.id === typeId)?.subOptions?.length ? (
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">الخيار الفرعي</label>
                <select value={subTypeId} onChange={e => setSubTypeId(e.target.value)} className="w-full p-2.5 border rounded-xl text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
                  <option value="">اختر التفصيل...</option>
                  {warningTypes.find((t: any) => t.id === typeId)?.subOptions.map((o: any) => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </div>
            ) : null}
            
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">درجة الإنذار</label>
              <select value={degree} onChange={e => setDegree(e.target.value as any)} className="w-full p-2.5 border rounded-xl text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
                <option value="low">منخفضة</option>
                <option value="medium">متوسطة</option>
                <option value="high">عالية</option>
              </select>
            </div>
          </div>
          
          <div className="relative">
            <label className="block text-xs font-bold text-slate-600 mb-1">تفاصيل الإنذار (مرفقات، إيموجي، لصق صور)</label>
            <div className="border border-slate-200 rounded-xl focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 bg-white overflow-hidden transition-all flex flex-col">
              <textarea 
                ref={textInputRef}
                value={details} 
                onChange={e => setDetails(e.target.value)} 
                onPaste={handlePaste}
                className="w-full p-3 text-sm min-h-[160px] resize-y outline-none border-none bg-transparent" 
                placeholder="اكتب تفاصيل المخالفة هنا... (يمكنك لصق الصور من الحافظة)"
              ></textarea>
              
              {(attachedImage || attachedFile) && (
                <div className="px-3 pb-2 flex gap-2 flex-wrap">
                  {attachedImage && (
                    <div className="relative group">
                      <img 
                        src={attachedImage} 
                        alt="Attachment" 
                        className="h-16 w-16 object-cover rounded-lg border border-slate-200 cursor-zoom-in" 
                        onClick={() => setActiveLightbox(attachedImage)}
                      />
                      <button type="button" onClick={() => setAttachedImage(null)} className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  {attachedFile && (
                    <div className="relative group flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-2 rounded-lg border border-indigo-100 text-xs font-bold">
                      <Paperclip className="w-4 h-4" />
                      <span className="max-w-[150px] truncate">{attachedFile.name}</span>
                      <button type="button" onClick={() => setAttachedFile(null)} className="text-rose-500 hover:text-rose-600 ml-1">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-t border-slate-100">
                <div className="flex gap-1">
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                  <input type="file" accept="image/*" ref={imageInputRef} onChange={handleImageUpload} className="hidden" />
                  
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer" title="إرفاق ملف">
                    <Paperclip className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={() => imageInputRef.current?.click()} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer" title="إرفاق صورة">
                    <Camera className="w-4 h-4" />
                  </button>
                  
                  <div className="relative">
                    <button 
                      type="button" 
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${showEmojiPicker ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'}`} 
                      title="إضافة رمز تعبيري"
                    >
                      <Smile className="w-4 h-4" />
                    </button>
                    
                    <AnimatePresence>
                      {showEmojiPicker && (
                        <motion.div 
                          ref={emojiPickerRef}
                          initial={{ opacity: 0, y: 15, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute bottom-full right-0 mb-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 p-3 z-50"
                        >
                          <div className="text-[10px] font-bold text-slate-400 mb-2 border-b border-slate-100 pb-1.5">أيقونات تعبيرية سريعة</div>
                          <div className="grid grid-cols-5 gap-1.5 justify-items-center">
                            {POPULAR_EMOJIS.map((emoji, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => handleEmojiSelect(emoji)}
                                className="text-lg hover:bg-slate-50 active:bg-slate-100 w-8 h-8 flex items-center justify-center rounded-lg transition-colors cursor-pointer"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 mt-6">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">إلغاء</button>
            <button type="submit" className="px-5 py-2.5 text-sm font-bold text-white bg-rose-600 rounded-xl hover:bg-rose-700 shadow-md shadow-rose-200 transition-colors flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" />
              إصدار الإنذار
            </button>
          </div>
        </form>
      </div>
      
      {/* Fullscreen Lightbox Modal */}
      <AnimatePresence>
        {activeLightbox && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveLightbox(null)}
            className="fixed inset-0 bg-slate-900/85 z-[9999] flex items-center justify-center p-4 backdrop-blur-xs cursor-zoom-out"
          >
            <button 
              type="button" 
              className="absolute top-4 right-4 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full transition-colors cursor-pointer"
              onClick={() => setActiveLightbox(null)}
            >
              <X className="w-6 h-6" />
            </button>
            <motion.img 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              src={activeLightbox} 
              alt="عرض كامل" 
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function WarningChatModal({ warning, currentUser, users, onClose, onUpdate }: any) {
  const [msg, setMsg] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [attachedFile, setAttachedFile] = useState<{name: string, data: string} | null>(null);
  const [activeLightbox, setActiveLightbox] = useState<string | null>(null);
  const POPULAR_EMOJIS = ['👍', '👎', '❤️', '🔥', '👏', '🎉', '✨', '✅', '❌', '⚠️', '😊', '😂', '🤣', '😍', '😉', '😎', '😮', '😢', '😡', '😴'];
  
  const emojiPickerRef = React.useRef<HTMLDivElement>(null);
  const textInputRef = React.useRef<HTMLTextAreaElement>(null);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const imageInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [warning.messages]);

  React.useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showEmojiPicker]);

  const handleEmojiSelect = (emoji: string) => {
    setMsg(prev => prev + emoji);
    textInputRef.current?.focus();
    setShowEmojiPicker(false);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === 'file') {
          const file = item.getAsFile();
          if (file) {
            if (file.type.indexOf('image') !== -1) {
              const reader = new FileReader();
              reader.onload = (event) => {
                setAttachedImage(event.target?.result as string);
              };
              reader.readAsDataURL(file);
            } else {
              if (file.size > 5 * 1024 * 1024) {
                toast.error('حجم الملف يجب أن لا يتجاوز 5 ميجابايت');
              } else {
                setAttachedFile(file);
              }
            }
            e.preventDefault();
            break;
          }
        }
      }
    }
  };
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAttachedFile({ name: file.name, data: event.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAttachedImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const sendMsg = () => {
    if(!msg.trim() && !attachedImage && !attachedFile) return;
    const newMsg = {
      id: `msg-${Date.now()}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      content: msg.trim(),
      imageUrl: attachedImage || undefined,
      fileUrl: attachedFile?.data,
      fileName: attachedFile?.name,
      createdAt: new Date().toISOString()
    };
    onUpdate({
      ...warning,
      messages: [...warning.messages, newMsg],
      unreadByAdmin: currentUser.role !== 'admin' && currentUser.role !== 'hr',
      unreadByEmployee: currentUser.role === 'admin' || currentUser.role === 'hr',
    });
    setMsg('');
    setAttachedImage(null);
    setAttachedFile(null);
    setShowEmojiPicker(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col h-[85vh]">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-800 text-lg leading-none">محادثة الإنذار: {warning.warningNumber}</h3>
                {warning.isLocked && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                    <Lock className="w-3 h-3" />
                    مقفلة
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">يتم تسجيل كافة المحادثات لأغراض التدقيق</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {currentUser.role === 'admin' && (
              <button 
                type="button"
                onClick={() => {
                  const newLocked = !warning.isLocked;
                  onUpdate({
                    ...warning,
                    isLocked: newLocked,
                    lockedBy: newLocked ? currentUser.name : undefined,
                    lockedAt: newLocked ? new Date().toISOString() : undefined,
                  });
                  toast.success(newLocked ? 'تم إقفال محادثة الإنذار بنجاح' : 'تم فتح محادثة الإنذار بنجاح');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                  warning.isLocked 
                    ? 'bg-rose-100 text-rose-700 hover:bg-rose-200 border border-rose-300' 
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 hover:border-slate-300'
                }`}
                title={warning.isLocked ? "إلغاء قفل المحادثة للسماح بالردود" : "إقفال المحادثة ومنع إضافة أي ردود"}
              >
                {warning.isLocked ? <Lock className="w-3.5 h-3.5 text-rose-600" /> : <Unlock className="w-3.5 h-3.5 text-slate-500" />}
                <span>{warning.isLocked ? 'المحادثة مقفلة (إلغاء القفل)' : 'إقفال المحادثة'}</span>
              </button>
            )}
            <button onClick={onClose} className="p-2 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-5 bg-slate-50">
          <div className="bg-white p-6 rounded-2xl border border-rose-100 shadow-sm mb-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-2 h-full bg-rose-500"></div>
            
            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-4">
              <div>
                <strong className="text-rose-700 text-lg block mb-1">{warning.typeName}</strong>
                <span className="text-rose-500/80 font-medium text-sm">{warning.subTypeName}</span>
              </div>
              <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                warning.degree === 'high' ? 'bg-rose-100 text-rose-700 border border-rose-200' :
                warning.degree === 'medium' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                'bg-emerald-100 text-emerald-700 border border-emerald-200'
              }`}>
                درجة المخالفة: {warning.degree === 'high' ? 'عالية' : warning.degree === 'medium' ? 'متوسطة' : 'منخفضة'}
              </span>
            </div>
            
            <div className="bg-slate-50/80 p-4 rounded-xl mb-4 text-slate-700 whitespace-pre-wrap leading-relaxed text-sm border border-slate-100">
              {warning.details}
              
              {/* Added attachment display for warning details */}
              {(warning.imageUrl || warning.fileUrl) && (
                <div className="mt-4 pt-4 border-t border-slate-200 flex flex-wrap gap-2">
                  {warning.imageUrl && (
                    <div 
                      className="relative group max-w-full overflow-hidden rounded-lg border border-black/5 bg-slate-100 cursor-zoom-in"
                      onClick={() => setActiveLightbox(warning.imageUrl || null)}
                    >
                      <img 
                        src={warning.imageUrl} 
                        alt="مرفق" 
                        className="max-h-32 object-cover mx-auto hover:opacity-95 transition-opacity"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}
                  {warning.fileUrl && (
                    <a href={warning.fileUrl} download={warning.fileName || 'مرفق'} className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-2 rounded-lg border border-indigo-100 text-xs font-bold hover:bg-indigo-100 transition-colors">
                      <Paperclip className="w-4 h-4" />
                      <span>{warning.fileName || 'تحميل المرفق'}</span>
                    </a>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-4 text-xs text-slate-500 border-t border-slate-100 pt-4 mt-2">
              <div className="flex items-center gap-1.5">
                <UserIcon className="w-4 h-4 text-slate-400" />
                <span>محرر المخالفة: <strong className="text-slate-700">{warning.senderName}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>التاريخ: <strong className="text-slate-700">{new Date(warning.createdAt).toLocaleString('ar-OM', { dateStyle: 'medium', timeStyle: 'short' })}</strong></span>
              </div>
            </div>
          </div>


          <div className="space-y-4">
            {warning.messages.map((m: any) => {
              const isMe = m.senderId === currentUser.id;
              const senderUser = users?.find((u: User) => u.id === m.senderId);
              
              return (
                <div key={m.id} className={`flex items-end gap-3 ${isMe ? 'justify-end flex-row-reverse' : 'justify-start'} group relative`}>
                  {!isMe && (
                    <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-xs font-bold overflow-hidden shrink-0 shadow-sm mb-1">
                      {senderUser?.avatarUrl ? (
                        <img src={senderUser.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                      ) : (
                        m.senderName.charAt(0)
                      )}
                    </div>
                  )}
                  <div className={`max-w-[75%] rounded-2xl p-3.5 text-sm shadow-sm ${isMe ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'}`}>
                    <div className={`text-[10px] font-bold mb-1 ${isMe ? 'text-indigo-200' : 'text-slate-400'}`}>{m.senderName}</div>
                    
                    {m.content && <div className="leading-relaxed whitespace-pre-wrap mb-2">{m.content}</div>}
                    
                    {(m.imageUrl || m.fileUrl) && (
                      <div className="mt-2 space-y-2">
                        {m.imageUrl && (
                          <div 
                            className="relative group max-w-full overflow-hidden rounded-lg border border-black/5 bg-slate-100 cursor-zoom-in block"
                            onClick={() => setActiveLightbox(m.imageUrl || null)}
                          >
                            <img 
                              src={m.imageUrl} 
                              alt="مرفق" 
                              className="max-w-full max-h-48 rounded-lg border border-white/20 object-cover hover:opacity-95 transition-opacity"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        )}
                        {m.fileUrl && (
                          <a href={m.fileUrl} download={m.fileName || 'مرفق'} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-colors ${isMe ? 'bg-indigo-700/50 hover:bg-indigo-700 border border-indigo-500/30 text-white' : 'bg-slate-50 border border-slate-200 hover:bg-slate-100 text-indigo-700'}`}>
                            <Paperclip className="w-4 h-4" />
                            <span className="truncate max-w-[150px]">{m.fileName || 'تحميل المرفق'}</span>
                          </a>
                        )}
                      </div>
                    )}
                    
                    <div className={`text-[9px] text-right mt-2 ${isMe ? 'text-indigo-300' : 'text-slate-400'}`}>
                      {new Date(m.createdAt).toLocaleTimeString('ar-OM', {hour: '2-digit', minute:'2-digit'})}
                    </div>
                  </div>

                  {currentUser.role === 'admin' && (
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm('هل أنت متأكد من حذف هذه الرسالة من الإنذار؟')) {
                          const updatedMessages = warning.messages.filter((msgItem: any) => msgItem.id !== m.id);
                          onUpdate({
                            ...warning,
                            messages: updatedMessages
                          });
                          toast.success('تم حذف الرسالة من الإنذار بنجاح');
                        }
                      }}
                      className={`p-1.5 text-rose-500 hover:bg-rose-50 hover:text-rose-700 rounded-lg transition-all cursor-pointer opacity-0 group-hover:opacity-100 ${isMe ? 'mr-1' : 'ml-1'}`}
                      title="حذف هذه الرسالة من الإنذار"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
            
          </div>
        </div>
        
        {warning.isLocked && currentUser.role !== 'admin' ? (
          <div className="p-4 border-t border-slate-100 bg-amber-50/70 flex items-center justify-center gap-2 text-amber-900 text-sm font-bold">
            <Lock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>تم إقفال هذه المحادثة من قبل مدير النظام، ولا يمكن إضافة ردود جديدة.</span>
          </div>
        ) : (
          <div className="p-4 border-t border-slate-100 bg-white">
            {warning.isLocked && currentUser.role === 'admin' && (
              <div className="mb-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-xs font-bold text-amber-800 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  المحادثة مقفلة حالياً أمام الموظف. بصفتك مدير النظام يمكنك إرسال ردود أو إلغاء القفل من الأعلى.
                </span>
              </div>
            )}
            {(attachedImage || attachedFile) && (
              <div className="mb-2 px-1 flex gap-2 flex-wrap">
                {attachedImage && (
                  <div className="relative group">
                    <img src={attachedImage} alt="Attachment" className="h-16 w-16 object-cover rounded-lg border border-slate-200" />
                    <button type="button" onClick={() => setAttachedImage(null)} className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
                {attachedFile && (
                  <div className="relative group flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-2 rounded-lg border border-indigo-100 text-xs font-bold">
                    <Paperclip className="w-4 h-4" />
                    <span className="max-w-[150px] truncate">{attachedFile.name}</span>
                    <button type="button" onClick={() => setAttachedFile(null)} className="text-rose-500 hover:text-rose-600 ml-1">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
            
            <div className="flex items-end gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all">
              <div className="flex gap-1 mb-1">
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                <input type="file" accept="image/*" ref={imageInputRef} onChange={handleImageUpload} className="hidden" />
                
                <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors cursor-pointer" title="إرفاق ملف">
                  <Paperclip className="w-5 h-5" />
                </button>
                
                <button type="button" onClick={() => imageInputRef.current?.click()} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors cursor-pointer" title="إرفاق صورة">
                  <Camera className="w-5 h-5" />
                </button>
                
                <div className="relative">
                  <button 
                    type="button" 
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className={`p-2 rounded-xl transition-colors cursor-pointer ${showEmojiPicker ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'}`} 
                    title="إضافة رمز تعبيري"
                  >
                    <Smile className="w-5 h-5" />
                  </button>
                  
                  <AnimatePresence>
                    {showEmojiPicker && (
                      <motion.div 
                        ref={emojiPickerRef}
                        initial={{ opacity: 0, y: 15, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute bottom-full right-0 mb-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 p-3 z-50"
                      >
                        <div className="text-[10px] font-bold text-slate-400 mb-2 border-b border-slate-100 pb-1.5">أيقونات تعبيرية سريعة</div>
                        <div className="grid grid-cols-5 gap-1.5 justify-items-center">
                          {POPULAR_EMOJIS.map((emoji, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleEmojiSelect(emoji)}
                              className="text-lg hover:bg-slate-50 active:bg-slate-100 w-8 h-8 flex items-center justify-center rounded-lg transition-colors cursor-pointer"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              
              <textarea 
                ref={textInputRef}
                value={msg} 
                onChange={e => setMsg(e.target.value)} 
                onPaste={handlePaste}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMsg();
                  }
                }}
                placeholder="اكتب ردك هنا للتوضيح... (Shift + Enter لسطر جديد)"
                className="flex-1 border-none bg-transparent resize-none outline-none p-2 text-sm max-h-32 min-h-[44px]"
                rows={1}
              />
              
              <button 
                onClick={sendMsg} 
                disabled={!msg.trim() && !attachedImage && !attachedFile}
                className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 shadow-sm shadow-indigo-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-0.5"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen Lightbox Modal */}
      <AnimatePresence>
        {activeLightbox && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveLightbox(null)}
            className="fixed inset-0 bg-slate-900/85 z-[9999] flex items-center justify-center p-4 backdrop-blur-xs cursor-zoom-out"
          >
            <button 
              type="button" 
              className="absolute top-4 right-4 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full transition-colors cursor-pointer"
              onClick={() => setActiveLightbox(null)}
            >
              <X className="w-6 h-6" />
            </button>
            <motion.img 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              src={activeLightbox} 
              alt="عرض كامل" 
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AccountTab({ user, invoices }: { user: User, invoices: Invoice[] }) {
  // Extract all invoice items performed by this employee
  const employeeItems = invoices.flatMap(inv => 
    (inv.items || [])
      .filter(item => item.employeeName === user.name || item.employeeName === user.fullName)
      .map(item => ({ ...item, invoiceDate: item.createdAt || inv.createdAt }))
  );

  const totalSales = employeeItems.reduce((sum, item) => sum + (item.total || 0), 0);
  const totalTransactions = employeeItems.length;

  // Monthly Financial Performance (Current Year)
  const currentYear = new Date().getFullYear();
  const monthsData = Array.from({ length: 12 }, (_, i) => ({
    name: new Date(currentYear, i, 1).toLocaleString('ar-OM', { month: 'short' }),
    sales: 0,
    count: 0
  }));

  employeeItems.forEach(item => {
    const d = new Date(item.invoiceDate);
    if (d.getFullYear() === currentYear) {
      monthsData[d.getMonth()].sales += (item.total || 0);
      monthsData[d.getMonth()].count += 1;
    }
  });

  // Services Stats
  const serviceStatsMap = new Map<string, { count: number, total: number, quantity: number }>();
  employeeItems.forEach(item => {
    const name = item.serviceName || 'أخرى';
    if (!serviceStatsMap.has(name)) {
      serviceStatsMap.set(name, { count: 0, total: 0, quantity: 0 });
    }
    const stat = serviceStatsMap.get(name)!;
    stat.count += 1;
    stat.total += (item.total || 0);
    stat.quantity += (item.quantity || 1);
  });

  const servicesData = Array.from(serviceStatsMap.entries()).map(([name, stats]) => ({
    name,
    count: stats.count,
    total: stats.total,
    quantity: stats.quantity
  })).sort((a, b) => b.count - a.count); // Sort by count descending

  const COLORS = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <Wallet className="w-6 h-6" />
          </div>
          <p className="text-xs text-slate-500 font-bold mb-1">الراتب الشهري</p>
          <p className="text-2xl font-black text-slate-800">{user.monthlySalary || '0.000'} ر.ع</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <TrendingUp className="w-6 h-6" />
          </div>
          <p className="text-xs text-slate-500 font-bold mb-1">إجمالي الإيرادات المنجزة</p>
          <p className="text-2xl font-black text-slate-800">{totalSales.toFixed(3)} ر.ع</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center">
          <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <BarChart3 className="w-6 h-6" />
          </div>
          <p className="text-xs text-slate-500 font-bold mb-1">إجمالي المعاملات المنجزة</p>
          <p className="text-2xl font-black text-slate-800">{totalTransactions}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center">
          <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <p className="text-xs text-slate-500 font-bold mb-1">القروض والسلف</p>
          <p className="text-2xl font-black text-slate-800">{user.loans || '0.000'} ر.ع</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Financial Performance Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-6">الأداء المالي خلال العام ({currentYear})</h3>
          <div className="h-64 w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <RechartsTooltip />
                <Line type="monotone" name="المبيعات (ر.ع)" dataKey="sales" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Transactions Count Over Time */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-6">أعداد المعاملات المنجزة شهرياً ({currentYear})</h3>
          <div className="h-64 w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <RechartsTooltip />
                <Bar dataKey="count" name="عدد المعاملات" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Services Stats Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-6">توزيع أنواع المعاملات</h3>
          <div className="h-64 w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={servicesData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="count"
                >
                  {servicesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4">تفاصيل المعاملات وأنواعها (الأداء والتمكن)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-slate-50 text-slate-500 font-medium">
                <tr>
                  <th className="py-3 px-4 rounded-r-xl resize-x overflow-auto">نوع المعاملة / الخدمة</th>
                  <th className="py-3 px-4 resize-x overflow-auto">عدد المرات</th>
                  <th className="py-3 px-4 resize-x overflow-auto">إجمالي الكمية</th>
                  <th className="py-3 px-4 rounded-l-xl resize-x overflow-auto">إجمالي الإيراد</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {servicesData.length > 0 ? (
                  servicesData.map((s, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-700">{s.name}</td>
                      <td className="py-3 px-4">{s.count} معاملة</td>
                      <td className="py-3 px-4">{s.quantity}</td>
                      <td className="py-3 px-4 text-emerald-600 font-bold">{s.total.toFixed(3)} ر.ع</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-slate-400">لا توجد بيانات للمعاملات</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChatMailTab({ currentUser, users, mails, setMails, privateMessages, setPrivateMessages }: any) {
  const [subTab, setSubTab] = useState<'chat' | 'mail'>('chat');
  
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col h-[70vh]">
      <div className="flex border-b border-slate-200">
        <button 
          onClick={() => setSubTab('chat')}
          className={`flex-1 py-3 font-bold text-sm transition-colors ${subTab === 'chat' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          الدردشة الخاصة
        </button>
        <button 
          onClick={() => setSubTab('mail')}
          className={`flex-1 py-3 font-bold text-sm transition-colors ${subTab === 'mail' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          صندوق البريد الإلكتروني (Inbox)
        </button>
      </div>
      
      <div className="flex-1 overflow-hidden relative flex flex-col">
        {subTab === 'chat' ? (
          <PrivateChat currentUser={currentUser} users={users} privateMessages={privateMessages} setPrivateMessages={setPrivateMessages} />
        ) : (
          <MailInbox currentUser={currentUser} users={users} mails={mails} setMails={setMails} />
        )}
      </div>
    </div>
  );
}

function PrivateChat({ currentUser, users = [], privateMessages = [], setPrivateMessages }: any) {
  const safeUsers = users || [];
  const safePrivateMessages = privateMessages || [];
  const usersWithChats = safeUsers.filter((u: User) => {
    if (u.id.endsWith('_config')) return false;
    return safePrivateMessages.some((m: PrivateMessage) => 
      (m.senderId === currentUser?.id && m.receiverId === u.id) ||
      (m.senderId === u.id && m.receiverId === currentUser?.id)
    );
  });

  const [selectedUserId, setSelectedUserId] = useState<string>(() => {
    return usersWithChats.length > 0 ? usersWithChats[0].id : '';
  });
  const [messageText, setMessageText] = useState('');
  const [attachment, setAttachment] = useState<{name: string, url: string} | null>(null);

  const selectedUser = safeUsers.find((u: User) => u.id === selectedUserId);

  useEffect(() => {
    if (!selectedUserId || !currentUser) return;
    
    let updated = false;
    const newMsgs = privateMessages.map((m) => {
      if (m.receiverId === currentUser.id && m.senderId === selectedUserId && !m.isRead) {
        updated = true;
        return { ...m, isRead: true, readAt: new Date().toISOString() };
      }
      return m;
    });

    if (updated) {
      setPrivateMessages(newMsgs);
    }
  }, [selectedUserId, privateMessages, currentUser, setPrivateMessages]);

  const conversationMessages = safePrivateMessages.filter((m: PrivateMessage) => 
    (m.senderId === currentUser?.id && m.receiverId === selectedUserId) ||
    (m.senderId === selectedUserId && m.receiverId === currentUser?.id)
  ).sort((a: PrivateMessage, b: PrivateMessage) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!messageText.trim() && !attachment) || !selectedUserId) return;

    const newMsg: PrivateMessage = {
      id: `msg-${Date.now()}`,
      senderId: currentUser.id,
      senderName: currentUser.name || currentUser.fullName,
      receiverId: selectedUserId,
      content: messageText.trim(),
      createdAt: new Date().toISOString(),
      isRead: false,
      attachmentName: attachment?.name,
      attachmentUrl: attachment?.url
    };

    setPrivateMessages([...privateMessages, newMsg]);
    setMessageText('');
    setAttachment(null);
  };

  const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setAttachment({ name: file.name, url });
  };

  return (
    <div className="flex h-full">
      {/* Users Sidebar */}
      <div className="w-72 border-l border-slate-200 bg-slate-50 flex flex-col">
        <div className="p-3 border-b border-slate-200 bg-white space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">المحادثات السابقة</span>
            <select
              onChange={e => {
                if (e.target.value) {
                  setSelectedUserId(e.target.value);
                }
                e.target.value = '';
              }}
              className="text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-lg p-1 outline-hidden cursor-pointer"
            >
              <option value="">+ محادثة جديدة</option>
              {safeUsers.filter((u: User) => !u.id.endsWith('_config')).map((u: User) => (
                <option key={u.id} value={u.id}>{u.name || u.fullName}</option>
              ))}
            </select>
          </div>
          <select 
            value={usersWithChats.some((u: User) => u.id === selectedUserId) ? selectedUserId : ''}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-slate-700"
          >
            <option value="" disabled>بحث في المحادثات (قائمة منسدلة)...</option>
            {usersWithChats.map((u: User) => (
              <option key={u.id} value={u.id}>{u.name || u.fullName}</option>
            ))}
          </select>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {usersWithChats.length === 0 ? (
            <div className="p-4 text-center text-slate-400 text-xs">لا توجد محادثات سابقة. ابدأ محادثة جديدة من الأعلى.</div>
          ) : (
            usersWithChats.map((u: User) => {
              const isSelected = u.id === selectedUserId;
              const lastMsg = safePrivateMessages.filter((m: PrivateMessage) =>
                (m.senderId === currentUser?.id && m.receiverId === u.id) ||
                (m.senderId === u.id && m.receiverId === currentUser?.id)
              ).slice(-1)[0];

              return (
                <button
                  key={u.id}
                  onClick={() => setSelectedUserId(u.id)}
                  className={`w-full text-right p-3 flex items-center gap-3 transition-colors ${isSelected ? 'bg-indigo-50 border-l-4 border-indigo-600' : 'hover:bg-slate-100/60'}`}
                >
                  <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0 overflow-hidden">
                    {u.avatarUrl ? (
                      <img src={u.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      (u.name || u.fullName || 'م').charAt(0)
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="font-bold text-xs text-slate-800 truncate">{u.name || u.fullName}</span>
                      {lastMsg && (
                        <span className="text-[10px] text-slate-400">
                          {new Date(lastMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">
                      {lastMsg ? lastMsg.content : (u.jobTitle || 'موظف')}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedUser ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center overflow-hidden">
                  {selectedUser.avatarUrl ? (
                    <img src={selectedUser.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    (selectedUser.name || selectedUser.fullName || 'م').charAt(0)
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-800">{selectedUser.name || selectedUser.fullName}</h4>
                  <span className="text-xs text-slate-500">{selectedUser.jobTitle || 'موظف'}</span>
                </div>
              </div>
              <span className="text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                متاح للدردشة الفورية
              </span>
            </div>

            {/* Messages Feed */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30">
              {conversationMessages.length === 0 ? (
                <div className="text-center text-slate-400 mt-20">
                  <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">لا توجد رسائل سابقة مع {selectedUser.name || selectedUser.fullName}. ابدأ المحادثة الآن!</p>
                </div>
              ) : (
                conversationMessages.map((m: PrivateMessage) => {
                  const isMe = m.senderId === currentUser.id;
                  const senderUser = users.find((u: User) => u.id === m.senderId);
                  
                  return (
                    <div key={m.id} className={`flex items-end gap-2 ${isMe ? 'justify-end flex-row-reverse' : 'justify-start'}`}>
                      {!isMe && (
                        <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-[9px] font-bold overflow-hidden shrink-0 mb-1">
                          {senderUser?.avatarUrl ? (
                            <img src={senderUser.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                          ) : (
                            m.senderName.charAt(0)
                          )}
                        </div>
                      )}
                      <div className={`max-w-[70%] rounded-2xl p-3 shadow-xs ${isMe ? 'bg-indigo-600 text-white rounded-bl-none' : 'bg-white border border-slate-200 text-slate-800 rounded-br-none'}`}>
                        {!isMe && <span className="block text-[10px] font-bold text-indigo-600 mb-1">{m.senderName}</span>}
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</p>
                        
                        {m.attachmentUrl && (
                          <a 
                            href={m.attachmentUrl} 
                            download={m.attachmentName || 'مرفق'}
                            className={`mt-2 p-2 rounded-xl flex items-center gap-2 text-xs border ${isMe ? 'bg-indigo-700/50 border-indigo-500 text-white' : 'bg-slate-50 border-slate-200 text-indigo-700'}`}
                          >
                            <Paperclip className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{m.attachmentName || 'ملف مرفق'}</span>
                          </a>
                        )}

                        <span className={`block text-[10px] mt-1 flex justify-end items-center gap-1 ${isMe ? 'text-indigo-200' : 'text-slate-400'}`}>
                          {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {isMe && (
                            m.isRead ? (
                              <span className="flex items-center gap-0.5 text-blue-200">
                                <span>تمت القراءة {m.readAt ? new Date(m.readAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                                <CheckCheck className="w-3.5 h-3.5" />
                              </span>
                            ) : (
                              <span className="flex items-center gap-0.5 opacity-80">
                                <span>تم الإرسال</span>
                                <Check className="w-3.5 h-3.5" />
                              </span>
                            )
                          )}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-200 flex flex-col gap-2">
              {attachment && (
                <div className="flex items-center justify-between bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-xl text-xs text-indigo-800">
                  <div className="flex items-center gap-2">
                    <Paperclip className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="truncate max-w-[250px]">{attachment.name}</span>
                  </div>
                  <button type="button" onClick={() => setAttachment(null)} className="hover:text-rose-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2">
                <label className="cursor-pointer p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors">
                  <Paperclip className="w-4 h-4" />
                  <input type="file" onChange={handleFileAttach} className="hidden" />
                </label>
                <input
                  type="text"
                  value={messageText}
                  onChange={e => setMessageText(e.target.value)}
                  placeholder={`اكتب رسالة إلى ${selectedUser.name || selectedUser.fullName}...`}
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 bg-slate-50/50"
                />
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm transition-all"
                >
                  <Send className="w-4 h-4" /> إرسال
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400">
            <p>اختر موظفاً من القائمة الجانبية لبدء المحادثة.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function MailInbox({ currentUser, users = [], mails = [], setMails }: any) {
  const safeMails = mails || [];
  const safeUsers = users || [];
  const [subView, setSubView] = useState<'inbox' | 'sent' | 'compose' | 'drafts' | 'trash'>('inbox');
  const [selectedMail, setSelectedMail] = useState<MailMessage | null>(null);

  // Compose states
  const [receiverId, setReceiverId] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<{name: string, url: string, type: string}[]>([]);

  const myInbox = safeMails.filter((m: MailMessage) => m.receiverId === currentUser?.id && !m.isDraft && !m.isDeleted);
  const mySent = safeMails.filter((m: MailMessage) => m.senderId === currentUser?.id && !m.isDraft && !m.isDeleted);
  const myDrafts = safeMails.filter((m: MailMessage) => m.senderId === currentUser?.id && m.isDraft && !m.isDeleted);
  const myTrash = safeMails.filter((m: MailMessage) => (m.senderId === currentUser?.id || m.receiverId === currentUser?.id) && m.isDeleted);

  const handleReply = (mail: MailMessage) => {
    setSelectedMail(null);
    setReceiverId(mail.senderId);
    setSubject(`رد: ${mail.subject}`);
    setContent(`\n\n--- الرسالة الأصلية ---\n${mail.content}`);
    setSubView('compose');
  };

  const handleForward = (mail: MailMessage) => {
    setSelectedMail(null);
    setReceiverId('');
    setSubject(`توجيه: ${mail.subject}`);
    setContent(`\n\n--- الرسالة الموجهة ---\n${mail.content}`);
    setAttachments(mail.attachments || []);
    setSubView('compose');
  };

  const handleDelete = (mail: MailMessage) => {
    setMails(mails.map((m: MailMessage) => m.id === mail.id ? { ...m, isDeleted: true } : m));
    setSelectedMail(null);
  };

  const handleSaveDraft = () => {
    if (!subject.trim() && !content.trim()) return;
    const draftMsg: MailMessage = {
      id: `draft-${Date.now()}`,
      senderId: currentUser.id,
      senderName: currentUser.name || currentUser.fullName,
      receiverId: receiverId || '',
      subject: subject.trim() || 'مسودة بدون عنوان',
      content: content.trim(),
      createdAt: new Date().toISOString(),
      isRead: true,
      isDraft: true,
      attachments
    };
    setMails([draftMsg, ...mails]);
    setReceiverId('');
    setSubject('');
    setContent('');
    setAttachments([]);
    setSubView('drafts');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newAtts: {name: string, url: string, type: string}[] = [];
    Array.from(files).forEach((file: File) => {
      const url = URL.createObjectURL(file);
      newAtts.push({
        name: file.name,
        url,
        type: file.type || 'application/octet-stream'
      });
    });
    setAttachments(prev => [...prev, ...newAtts]);
  };

  const handleSendMail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiverId || !subject.trim() || !content.trim()) {
      toast.error('الرجاء تعبئة جميع الحقول المطلوبة (المستلم، الموضوع، ومحتوى الرسالة)');
      return;
    }
    const receiver = users.find((u: User) => u.id === receiverId);
    const newMsg: MailMessage = {
      id: `mail-${Date.now()}`,
      senderId: currentUser.id,
      senderName: currentUser.name || currentUser.fullName,
      receiverId,
      subject: subject.trim(),
      content: content.trim(),
      createdAt: new Date().toISOString(),
      isRead: false,
      attachments
    };
    setMails([newMsg, ...mails]);
    setReceiverId('');
    setSubject('');
    setContent('');
    setAttachments([]);
    setSubView('sent');
  };

  const handleOpenMail = (mail: MailMessage) => {
    if (mail.isDraft) {
       setSelectedMail(mail);
       setReceiverId(mail.receiverId || '');
       setSubject(mail.subject || '');
       setContent(mail.content || '');
       setAttachments(mail.attachments || []);
       setSubView('compose');
       return;
    }
    setSelectedMail(mail);
    if (!mail.isRead && mail.receiverId === currentUser.id) {
      const readTime = new Date().toISOString();
      setMails(mails.map((m: MailMessage) => m.id === mail.id ? { ...m, isRead: true, readAt: readTime } : m));
      setSelectedMail({ ...mail, isRead: true, readAt: readTime });
    }
  };

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-64 border-l border-slate-200 bg-slate-50 flex flex-col">
        <div className="p-4">
          <button 
            onClick={() => { setSubView('compose'); setSelectedMail(null); }} 
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" /> رسالة جديدة
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-3 space-y-1">
          <button 
            onClick={() => { setSubView('inbox'); setSelectedMail(null); }}
            className={`w-full text-right px-3 py-2.5 rounded-xl text-sm font-bold flex items-center justify-between transition-colors ${subView === 'inbox' && !selectedMail ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-200/60'}`}
          >
            <span className="flex items-center gap-2">
              <Mail className="w-4 h-4" /> البريد الوارد
            </span>
            <span className="bg-indigo-600 text-white text-[10px] px-2 py-0.5 rounded-full">
              {myInbox.filter(m => !m.isRead).length}
            </span>
          </button>
          <button 
            onClick={() => { setSubView('sent'); setSelectedMail(null); }}
            className={`w-full text-right px-3 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors ${subView === 'sent' && !selectedMail ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-200/60'}`}
          >
            <Send className="w-4 h-4" /> البريد المرسل ({mySent.length})
          </button>
          <button 
            onClick={() => { setSubView('drafts'); setSelectedMail(null); }}
            className={`w-full text-right px-3 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors ${subView === 'drafts' && !selectedMail ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-200/60'}`}
          >
            <Save className="w-4 h-4" /> المسودات ({myDrafts.length})
          </button>
          <button 
            onClick={() => { setSubView('trash'); setSelectedMail(null); }}
            className={`w-full text-right px-3 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors ${subView === 'trash' && !selectedMail ? 'bg-rose-100 text-rose-700' : 'text-slate-600 hover:bg-slate-200/60'}`}
          >
            <Trash2 className="w-4 h-4" /> سلة المحذوفات ({myTrash.length})
          </button>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col bg-white overflow-hidden">
        {selectedMail ? (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scroll-smooth">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <button 
                  onClick={() => setSelectedMail(null)}
                  className="text-xs font-bold text-indigo-600 hover:underline mb-2 block"
                >
                  ← العودة للقائمة
                </button>
                <h3 className="text-xl font-bold text-slate-800">{selectedMail.subject}</h3>
              </div>
              <div className="flex gap-2 items-center mb-2">
                  <button onClick={() => handleReply(selectedMail)} className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1" title="رد">
                    <Reply className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleForward(selectedMail)} className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1" title="إعادة توجيه">
                    <Forward className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(selectedMail)} className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-bold flex items-center gap-1" title="حذف">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              <div className="text-left flex flex-col items-end gap-1">
                <span className="text-xs text-slate-400">{new Date(selectedMail.createdAt).toLocaleString('ar-OM')}</span>
                {subView === 'sent' && (
                  <span className="flex items-center gap-1">
                    {selectedMail.isRead ? (
                      <span className="text-[10px] text-blue-500 flex items-center gap-1 font-bold">
                        <CheckCheck className="w-3.5 h-3.5" /> تمت القراءة {selectedMail.readAt ? new Date(selectedMail.readAt).toLocaleString('ar-OM', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) : ''}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 flex items-center gap-1 font-bold">
                        <Check className="w-3.5 h-3.5" /> تم الإرسال (لم تقرأ بعد)
                      </span>
                    )}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div className="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold overflow-hidden">
                {(() => {
                  const senderUser = users.find((u: User) => u.id === selectedMail.senderId);
                  if (senderUser?.avatarUrl) {
                    return <img src={senderUser.avatarUrl} alt="avatar" className="w-full h-full object-cover" />;
                  }
                  return selectedMail.senderName.charAt(0);
                })()}
              </div>
              <div>
                <span className="block text-xs text-slate-400 font-bold">المرسل:</span>
                <span className="block text-sm font-bold text-slate-800">{selectedMail.senderName}</span>
              </div>
            </div>

            <div className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap bg-slate-50/50 p-4 rounded-xl border border-slate-100 min-h-[150px]">
              {selectedMail.content}
            </div>

            {selectedMail.attachments && selectedMail.attachments.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-500">الملفات المرفقة ({selectedMail.attachments.length}):</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedMail.attachments.map((att, idx) => (
                    <a 
                      key={idx} 
                      href={att.url} 
                      download={att.name}
                      className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all group"
                    >
                      <Paperclip className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-800 truncate">{att.name}</p>
                        <span className="text-[10px] text-slate-400">انقر للعرض أو التنزيل</span>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : subView === 'compose' ? (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
              <h3 className="font-bold text-lg text-slate-800">إرسال رسالة جديدة</h3>
              <button onClick={() => setSubView('inbox')} className="p-2 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5 text-slate-400" /></button>
            </div>

            <form onSubmit={handleSendMail} className="space-y-4 max-w-2xl">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">إ إلى الموظف:</label>
                <select 
                  value={receiverId} 
                  onChange={e => setReceiverId(e.target.value)} 
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="">اختر الموظف المستلم...</option>
                  {safeUsers.filter((u: User) => !u.id.endsWith('_config')).map((u: User) => (
                    <option key={u.id} value={u.id}>{u.name} ({u.jobTitle || 'موظف'})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">الموضوع:</label>
                <input 
                  type="text" 
                  value={subject} 
                  onChange={e => setSubject(e.target.value)} 
                  placeholder="عنوان الرسالة أو الموضوع..." 
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">محتوى الرسالة:</label>
                <textarea 
                  value={content} 
                  onChange={e => setContent(e.target.value)} 
                  placeholder="اكتب تفاصيل الرسالة هنا..." 
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm h-40 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                ></textarea>
              </div>

              {/* File Attachments */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-600">إرفاق ملفات (مستندات، صور، ملفات PDF):</label>
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 inline-flex items-center gap-2 transition-colors">
                    <Paperclip className="w-4 h-4 text-indigo-600" />
                    <span>اختر ملف أو عدة ملفات</span>
                    <input type="file" multiple onChange={handleFileUpload} className="hidden" />
                  </label>
                  <span className="text-xs text-slate-400">يمكنك تحديد ملف واحد أو عدة ملفات معاً</span>
                </div>

                {attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {attachments.map((att, index) => (
                      <div key={index} className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-lg text-xs font-medium text-indigo-800">
                        <Paperclip className="w-3.5 h-3.5" />
                        <span className="truncate max-w-[200px]">{att.name}</span>
                        <button 
                          type="button" 
                          onClick={() => setAttachments(attachments.filter((_, i) => i !== index))}
                          className="hover:text-rose-600"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className="px-4 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors flex items-center gap-2"
                >
                  <Save className="w-4 h-4" /> حفظ كمسودة
                </button>
                <button 
                  type="button" 
                  onClick={() => setSubView('inbox')} 
                  className="px-4 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
                >
                  إلغاء
                </button>
                <button 
                  type="submit" 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-md shadow-indigo-600/20 transition-all"
                >
                  <Send className="w-4 h-4" /> إرسال الرسالة
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {(() => {
                let currentList: MailMessage[] = [];
                let emptyMsg = '';
                if (subView === 'inbox') { currentList = myInbox; emptyMsg = 'البريد الوارد'; }
                else if (subView === 'sent') { currentList = mySent; emptyMsg = 'البريد المرسل'; }
                else if (subView === 'drafts') { currentList = myDrafts; emptyMsg = 'المسودات'; }
                else if (subView === 'trash') { currentList = myTrash; emptyMsg = 'سلة المحذوفات'; }
                
                if (currentList.length === 0) {
                  return (
                    <div className="text-center text-slate-400 mt-20">
                      <Mail className="w-12 h-12 mx-auto mb-3 opacity-40" />
                      <p className="font-medium">لا توجد رسائل في {emptyMsg}.</p>
                    </div>
                  );
                }
                
                return currentList.map((m: MailMessage) => (
                <div 
                  key={m.id} 
                  onClick={() => handleOpenMail(m)}
                  className={`p-4 border rounded-xl hover:bg-slate-50 cursor-pointer transition-all flex items-center justify-between gap-4 ${!m.isRead && subView === 'inbox' ? 'border-indigo-300 bg-indigo-50/30 font-bold' : 'border-slate-200'}`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {(() => {
                      const msgUserId = subView === 'inbox' ? m.senderId : m.receiverId;
                      const msgUser = users.find(u => u.id === msgUserId);
                      return (
                        <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-xs font-bold overflow-hidden shrink-0">
                          {msgUser?.avatarUrl ? (
                            <img src={msgUser.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                          ) : (
                            (subView === 'inbox' ? m.senderName : 'م').charAt(0)
                          )}
                        </div>
                      );
                    })()}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-slate-800">
                          {(subView === 'inbox' || (subView === 'trash' && m.receiverId === currentUser?.id)) ? `من: ${m.senderName}` : `إلى: ${users.find(u => u.id === m.receiverId)?.name || 'موظف'}`}
                        </span>
                        {m.attachments && m.attachments.length > 0 && (
                          <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded-md">
                            <Paperclip className="w-3 h-3" /> {m.attachments.length}
                          </span>
                        )}
                      </div>
                      <div className="text-sm font-bold text-slate-900 truncate mb-1">{m.subject}</div>
                      <div className="text-xs text-slate-500 truncate">{m.content}</div>
                    </div>
                  </div>
                  <div className="text-left shrink-0 flex flex-col items-end">
                    <span className="text-[11px] text-slate-400 block">{new Date(m.createdAt).toLocaleDateString('ar-OM')}</span>
                    {!m.isRead && subView === 'inbox' && (
                      <span className="inline-block w-2.5 h-2.5 bg-indigo-600 rounded-full mt-1"></span>
                    )}
                    {(subView === 'sent') && (
                      <span className="mt-1 flex items-center justify-end">
                        {m.isRead ? (
                          <span className="text-[10px] text-blue-600 flex items-center gap-1 font-bold">
                            تمت القراءة {m.readAt ? new Date(m.readAt).toLocaleTimeString('ar-OM', { hour: '2-digit', minute: '2-digit' }) : ''}
                            <CheckCheck className="w-4 h-4" />
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500 flex items-center gap-1 font-bold">
                            تم الإرسال
                            <Check className="w-4 h-4" />
                          </span>
                        )}
                      </span>
                    )}
                    {(subView === 'drafts') && (
                      <span className="text-[10px] text-amber-600 mt-1 font-bold block">مسودة</span>
                    )}
                  </div>
                </div>
              ));
            })()}

          </div>
        )}
      </div>
    </div>
  );
}

function PerformanceTab({ user, invoices }: { user: User, invoices: Invoice[] }) {
  const skills = user.skills || ['خدمة العملاء', 'استخدام الحاسب الآلي', 'الطباعة السريعة'];
  const provided = user.providedServices || ['تخليص معاملات تجارية', 'إصدار تأشيرات'];
  const capable = user.capableServices || ['إدارة حسابات الشركات', 'استشارات قانونية'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-600" />
          المهارات
        </h3>
        <div className="flex flex-wrap gap-2">
          {skills.map((s, i) => (
             <span key={i} className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-sm font-medium border border-slate-200">{s}</span>
          ))}
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-600" />
          المؤهلات
        </h3>
        <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
          {user.qualifications || 'لم يتم إضافة مؤهلات بعد.'}
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-blue-600" />
          الخدمات المقدمة والممكنة
        </h3>
        <div className="space-y-4">
          <div>
            <h4 className="text-xs font-bold text-slate-500 mb-2">خدمات تم تقديمها بنجاح:</h4>
            <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
              {provided.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-500 mb-2">خدمات قادرة على تقديمها (متمكن منها):</h4>
            <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
              {capable.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function EditWarningModal({ warning, onClose, currentUser, users, onEdit }: any) {
  const [employeeId, setEmployeeId] = useState(warning.employeeId);
  const [typeId, setTypeId] = useState(warning.typeId);
  const [subTypeId, setSubTypeId] = useState(warning.subTypeId);
  const [degree, setDegree] = useState<'low'|'medium'|'high'>(warning.degree);
  const [details, setDetails] = useState(warning.details);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  const [attachedImage, setAttachedImage] = useState<string | null>(warning.imageUrl || null);
  const [attachedFile, setAttachedFile] = useState<{name: string, data: string} | null>(warning.fileUrl ? { name: warning.fileName || 'مرفق', data: warning.fileUrl } : null);
  const [activeLightbox, setActiveLightbox] = useState<string | null>(null);
  
  const POPULAR_EMOJIS = ['👍', '👎', '❤️', '🔥', '👏', '🎉', '✨', '✅', '❌', '⚠️', '😊', '😂', '🤣', '😍', '😉', '😎', '😮', '😢', '😡', '😴'];
  const emojiPickerRef = React.useRef<HTMLDivElement>(null);
  const textInputRef = React.useRef<HTMLTextAreaElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const imageInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showEmojiPicker]);

  const handleEmojiSelect = (emoji: string) => {
    setDetails(prev => prev + emoji);
    textInputRef.current?.focus();
    setShowEmojiPicker(false);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === 'file') {
          const file = item.getAsFile();
          if (file) {
            if (file.type.indexOf('image') !== -1) {
              const reader = new FileReader();
              reader.onload = (event) => {
                setAttachedImage(event.target?.result as string);
              };
              reader.readAsDataURL(file);
            } else {
              if (file.size > 5 * 1024 * 1024) {
                toast.error('حجم الملف يجب أن لا يتجاوز 5 ميجابايت');
              } else {
                const reader = new FileReader();
                reader.onload = (event) => {
                  setAttachedFile({ name: file.name, data: event.target?.result as string });
                };
                reader.readAsDataURL(file);
              }
            }
            e.preventDefault();
            break;
          }
        }
      }
    }
  };
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAttachedFile({ name: file.name, data: event.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAttachedImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const configUser = users.find((u: User) => u.id === 'warnings_config');
  const warningTypes = configUser?.warningTypes && configUser.warningTypes.length > 0 
    ? configUser.warningTypes 
    : [
    { id: 'wt-1', name: 'مخالفات الحضور والانضباط الزمني', subOptions: [
      { id: 'wto-1', name: 'تأخير عن الدوام' },
      { id: 'wto-2', name: 'انصراف مبكر' },
      { id: 'wto-3', name: 'غياب بدون عذر' }
    ]},
    { id: 'wt-2', name: 'مخالفات الأداء والعمل', subOptions: [
      { id: 'wto-4', name: 'إهمال في أداء المهام' },
      { id: 'wto-5', name: 'أخطاء متكررة' }
    ]}
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const wt = warningTypes.find((t: any) => t.id === typeId);
    if (!employeeId || !typeId || !details) return toast.error('الرجاء تعبئة الحقول الأساسية');
    if (wt && wt.subOptions && wt.subOptions.length > 0 && !subTypeId) {
      return toast.error('الرجاء اختيار الخيار الفرعي');
    }
    
    const emp = users.find((u: User) => u.id === employeeId);
    const wsub = wt?.subOptions?.find((o: any) => o.id === subTypeId);

    const updatedWarning = {
      ...warning,
      employeeId,
      employeeName: emp?.name || '',
      typeId,
      typeName: wt?.name || '',
      subTypeId,
      subTypeName: wsub?.name || '',
      degree,
      details,
      imageUrl: attachedImage || undefined,
      fileUrl: attachedFile?.data,
      fileName: attachedFile?.name,
      updatedAt: new Date().toISOString(),
      lastEditedBy: currentUser.name || currentUser.fullName || 'مدير النظام'
    };

    onEdit(updatedWarning);
    onClose();
  };

  const selectedType = warningTypes.find((t: any) => t.id === typeId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg leading-none">تعديل الإنذار: {warning.warningNumber}</h3>
              <p className="text-xs text-slate-500 mt-1">تعديل بيانات وتفاصيل الإنذار</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">الموظف المخالف <span className="text-rose-500">*</span></label>
              <select 
                value={employeeId} 
                onChange={e => setEmployeeId(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm outline-none"
                required
              >
                <option value="">اختر الموظف...</option>
                {users.map((u: User) => (
                  <option key={u.id} value={u.id}>{u.name || u.fullName || u.username}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">درجة المخالفة <span className="text-rose-500">*</span></label>
              <select 
                value={degree} 
                onChange={e => setDegree(e.target.value as any)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm outline-none font-bold"
                required
              >
                <option value="low" className="text-emerald-600">منخفضة</option>
                <option value="medium" className="text-amber-600">متوسطة</option>
                <option value="high" className="text-rose-600">عالية</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">نوع المخالفة الرئيسي <span className="text-rose-500">*</span></label>
              <select 
                value={typeId} 
                onChange={e => {
                  setTypeId(e.target.value);
                  setSubTypeId('');
                }}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm outline-none"
                required
              >
                <option value="">اختر النوع...</option>
                {warningTypes.map((t: any) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            {selectedType && selectedType.subOptions && selectedType.subOptions.length > 0 && (
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-2">الخيار الفرعي للمخالفة <span className="text-rose-500">*</span></label>
                <select 
                  value={subTypeId} 
                  onChange={e => setSubTypeId(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm outline-none"
                  required
                >
                  <option value="">اختر الخيار الفرعي...</option>
                  {selectedType.subOptions.map((o: any) => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">تفاصيل وأسباب المخالفة <span className="text-rose-500">*</span></label>
            <div className="border border-slate-200 rounded-xl focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 bg-white overflow-hidden transition-all flex flex-col">
              <textarea 
                ref={textInputRef}
                value={details} 
                onChange={e => setDetails(e.target.value)} 
                onPaste={handlePaste}
                className="w-full p-3 text-sm min-h-[160px] resize-y outline-none border-none bg-transparent" 
                placeholder="اكتب تفاصيل المخالفة هنا... (يمكنك لصق الصور من الحافظة)"
              ></textarea>
              
              {(attachedImage || attachedFile) && (
                <div className="px-3 pb-2 flex gap-2 flex-wrap">
                  {attachedImage && (
                    <div className="relative group">
                      <img 
                        src={attachedImage} 
                        alt="Attachment" 
                        className="h-16 w-16 object-cover rounded-lg border border-slate-200 cursor-zoom-in" 
                        onClick={() => setActiveLightbox(attachedImage)}
                      />
                      <button type="button" onClick={() => setAttachedImage(null)} className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  {attachedFile && (
                    <div className="relative group flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-2 rounded-lg border border-indigo-100 text-xs font-bold">
                      <Paperclip className="w-4 h-4" />
                      <span className="max-w-[150px] truncate">{attachedFile.name}</span>
                      <button type="button" onClick={() => setAttachedFile(null)} className="text-rose-500 hover:text-rose-600 ml-1">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}
              
              <div className="bg-slate-50 border-t border-slate-100 p-2 flex items-center gap-2">
                <div className="relative">
                  <button 
                    type="button" 
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"
                    title="إدراج ملصق تعبيري"
                  >
                    <Smile className="w-4 h-4" />
                  </button>
                  {showEmojiPicker && (
                    <div ref={emojiPickerRef} className="absolute bottom-full right-0 mb-2 bg-white border border-slate-200 rounded-xl shadow-xl p-2 w-64 z-50">
                      <div className="text-xs font-bold text-slate-500 mb-2 px-1">الأكثر استخداماً</div>
                      <div className="grid grid-cols-5 gap-1">
                        {POPULAR_EMOJIS.map(emoji => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => handleEmojiSelect(emoji)}
                            className="p-2 hover:bg-slate-100 rounded-lg text-lg text-center transition-colors"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="w-px h-4 bg-slate-300 mx-1"></div>
                <button 
                  type="button" 
                  onClick={() => imageInputRef.current?.click()}
                  className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex items-center gap-1.5"
                  title="إرفاق صورة"
                >
                  <Camera className="w-4 h-4" />
                </button>
                <input 
                  type="file" 
                  ref={imageInputRef} 
                  onChange={handleImageUpload} 
                  accept="image/*" 
                  className="hidden" 
                />
                
                <button 
                  type="button" 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex items-center gap-1.5"
                  title="إرفاق ملف"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  className="hidden" 
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-5 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              إلغاء
            </button>
            <button 
              type="submit" 
              disabled={!employeeId || !typeId || !details}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <ShieldAlert className="w-4 h-4" />
              حفظ التعديلات
            </button>
          </div>
        </form>
      </div>
      
      {/* Fullscreen Lightbox Modal */}
      <AnimatePresence>
        {activeLightbox && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveLightbox(null)}
            className="fixed inset-0 bg-slate-900/85 z-[9999] flex items-center justify-center p-4 backdrop-blur-xs cursor-zoom-out"
          >
            <button 
              type="button" 
              className="absolute top-4 right-4 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full transition-colors cursor-pointer"
              onClick={() => setActiveLightbox(null)}
            >
              <X className="w-6 h-6" />
            </button>
            <motion.img 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              src={activeLightbox} 
              alt="عرض كامل" 
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
