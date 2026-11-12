/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import toast from 'react-hot-toast';
import React, { useState, useRef } from 'react';
import { User, ActivityLog, UserRole, Customer, Invoice, Service, Branch, Ticket, MailMessage, PrivateMessage, Warning } from '../types';
import ServicesManager from './ServicesManager';
import WarningsManager from './WarningsManager';
import CustodyManager from './CustodyManager';
import { supabase } from '../lib/supabase';
import Logo from './Logo';
import { 
  Users, 
  Shield, 
  History, 
  UserPlus, 
  Trash2, 
  ToggleLeft, 
  ToggleRight, 
  RefreshCw,
  Lock,
  Unlock,
  Key,
  Download,
  Upload,
  Database,
  Info,
  AlertTriangle,
  Briefcase,
  MessageSquare,
  Loader2,
  Edit,
  BookOpenText,
  CheckCircle2,
  XCircle,
  Check,
  Building,
  Camera,
  RotateCcw
} from 'lucide-react';

interface SettingsSectionProps {
  users: User[];
  logs: ActivityLog[];
  customers: Customer[];
  invoices: Invoice[];
  services: Service[];
  setServices: React.Dispatch<React.SetStateAction<Service[]>>;
  currentUserId: string;
  onSetCurrentUser: (userId: string) => void;
  onStartSimulation?: (userId: string) => void;
  onAddUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
  onUpdateUserPermissions: (userId: string, permissions: any) => void;
  onUpdateUserRole: (userId: string, role: UserRole) => void;
  onImportBackup: (backupData: any) => void;
  onResetDatabase: () => void;
  branches: Branch[];
  onAddBranch: (name: string, phone: string, email: string, address: string) => void;
  onTransferUser: (userId: string, branchId: string) => void;
  onUpdateBranch: (branchId: string, newName: string, phone: string, email: string, address: string) => void;
  onDeleteBranch: (branchId: string) => void;
  ticketTypes: string[];
  onUpdateTicketTypes: (types: string[]) => void;
  ticketTypePlaceholders?: Record<string, string>;
  onUpdateTicketTypePlaceholders?: (placeholders: Record<string, string>) => void;
  ticketManagers: Record<string, string[]>;
  onUpdateTicketManagers: (managers: Record<string, string[]>) => void;
  onUpdateWarningTypes: (types: any[]) => void;
  onUpdateCustodyCategories?: (categories: any[]) => void;
  onUpdateSystemSettings?: (settings: any) => void;
  onDownloadGuideWord?: () => void;
  onDownloadGuidePdf?: () => void;
  tickets?: Ticket[];
  warnings?: Warning[];
  mails?: MailMessage[];
  privateMessages?: PrivateMessage[];
  deletedInvoices?: any[];
}

export default function SettingsSection({
  users,
  logs,
  customers,
  invoices,
  services,
  setServices,
  currentUserId,
  onSetCurrentUser,
  onStartSimulation,
  onAddUser,
  onDeleteUser,
  onUpdateUserPermissions,
  onUpdateUserRole,
  onImportBackup,
  onResetDatabase,
  branches,
  onAddBranch,
  onTransferUser,
  onUpdateBranch,
  onDeleteBranch,
  ticketTypes,
  onUpdateTicketTypes,
  ticketTypePlaceholders,
  onUpdateTicketTypePlaceholders,
  ticketManagers,
  onUpdateTicketManagers,
  onUpdateWarningTypes,
  onUpdateCustodyCategories,
  onUpdateSystemSettings,
  onDownloadGuideWord,
  onDownloadGuidePdf,
  tickets = [],
  warnings = [],
  mails = [],
  privateMessages = [],
  deletedInvoices = []
}: SettingsSectionProps) {
  // --- Universal Confirmation Dialog State ---
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    detail?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    isDestructive?: boolean;
    onConfirm: () => void | Promise<void>;
  } | null>(null);

  const askConfirmation = ({
    title,
    message,
    detail,
    confirmLabel = 'تأكيد الإجراء',
    cancelLabel = 'تراجع وإلغاء',
    isDestructive = false,
    onConfirm
  }: {
    title: string;
    message: string;
    detail?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    isDestructive?: boolean;
    onConfirm: () => void | Promise<void>;
  }) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      detail,
      confirmLabel,
      cancelLabel,
      isDestructive,
      onConfirm
    });
  };

  const PERMISSION_NAMES: Record<string, string> = {
    createInvoice: 'إنشاء الفواتير',
    editInvoice: 'تعديل الفواتير',
    deleteInvoice: 'حذف الفواتير',
    manageCustomers: 'إدارة العملاء',
    closeAccounts: 'إغلاق الحسابات',
    viewReports: 'رؤية التقارير والتحليلات',
    viewActivityLogs: 'مشاهدة سجل الأنشطة',
    editServices: 'تعديل سجل الخدمات',
    deleteServices: 'حذف سجل الخدمات',
    viewTicketAmount: 'رؤية مبالغ التذاكر',
    inputTicketAmount: 'إدخال مبالغ التذاكر',
  };

  const ROLE_NAMES: Record<UserRole, string> = {
    admin: 'مدير النظام 🛡️',
    hr: 'مدير HR 👥',
    accountant: 'محاسب مالي 💰',
    staff: 'موظف قياسي 👤',
    external_support_tech: 'فني دعم خارجي 🔧',
    external_support_admin: 'إداري دعم خارجي 📋',
    temp_visitor: 'زائر مؤقت 🚶',
    trainee: 'متدرب 🎓'
  };

  const [newUserName, setNewUserName] = useState('');
  const [newUserUsername, setNewUserUsername] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('staff');
  const [newUserBranchId, setNewUserBranchId] = useState('branch-1');
  const [branchesEditMode, setBranchesEditMode] = useState(false); // الحقول للعرض فقط حتى يضغط المدير «تعديل»
  
  // Branch state fields
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchPhone, setNewBranchPhone] = useState('');
  const [newBranchEmail, setNewBranchEmail] = useState('');
  const [newBranchAddress, setNewBranchAddress] = useState('');

  const [editingBranchId, setEditingBranchId] = useState<string | null>(null);
  const [editingBranchName, setEditingBranchName] = useState('');
  const [editingBranchPhone, setEditingBranchPhone] = useState('');
  const [editingBranchEmail, setEditingBranchEmail] = useState('');
  const [editingBranchAddress, setEditingBranchAddress] = useState('');

  const [error, setError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [clearingChat, setClearingChat] = useState(false);
  const [selectedTicketTypeForManagers, setSelectedTicketTypeForManagers] = useState<string>('');

  const systemSettingsUser = users.find(u => u.id === 'system_settings_config');
  const systemSettings = systemSettingsUser?.systemSettings || {
    idleHours: 0,
    enableNewInvoice: true,
    enableNewTicket: true,
    enableNewWarning: true,
    enableNewCustomer: true,
    enableCloseAccounts: true,
    requireCustomerPhone: true,
    requireCustomerCivilId: true,
    lateInvoicePeriod: '1_month',
    enableLateInvoiceAlert: true
  };

  const [idleHoursVal, setIdleHoursVal] = useState<number>(systemSettings.idleHours || 0);

  React.useEffect(() => {
    setIdleHoursVal(systemSettings.idleHours || 0);
  }, [systemSettings.idleHours]);

  const handleUpdateSystemSettings = (key: string, value: any) => {
    const newSettings = { ...systemSettings, [key]: value };
    if (onUpdateSystemSettings) {
      onUpdateSystemSettings(newSettings);
    }
  };

  // --- Company Basic Details State (تعديل البيانات الأساسية للشركة) ---
  const [compName, setCompName] = useState<string>(systemSettings.companyName || 'مركز سند الريادة للخدمات');
  const [compNameEn, setCompNameEn] = useState<string>(systemSettings.companyNameEn || 'AL-RIYADAH SAND SERVICES');
  const [compCrNumber, setCompCrNumber] = useState<string>(systemSettings.companyCrNumber || '1342890');
  const [compLogo, setCompLogo] = useState<string>(systemSettings.companyLogo || '');
  const [compPhone, setCompPhone] = useState<string>(systemSettings.companyPhone || '97994259');
  const [compEmail, setCompEmail] = useState<string>(systemSettings.companyEmail || 'sanad.oman.r3@gmail.com');
  const [compAddress, setCompAddress] = useState<string>(systemSettings.companyAddress || 'سلطنة عُمان - إبراء');
  const [compSubtitle, setCompSubtitle] = useState<string>(systemSettings.companySubtitle || 'شركائك في نجاح أعمالك .. كل الخدمات في مكان واحد');
  const logoFileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (systemSettings) {
      setCompName(systemSettings.companyName || 'مركز سند الريادة للخدمات');
      setCompNameEn(systemSettings.companyNameEn || 'AL-RIYADAH SAND SERVICES');
      setCompCrNumber(systemSettings.companyCrNumber || '1342890');
      setCompLogo(systemSettings.companyLogo || '');
      setCompPhone(systemSettings.companyPhone || '97994259');
      setCompEmail(systemSettings.companyEmail || 'sanad.oman.r3@gmail.com');
      setCompAddress(systemSettings.companyAddress || 'سلطنة عُمان - إبراء');
      setCompSubtitle(systemSettings.companySubtitle || 'شركائك في نجاح أعمالك .. كل الخدمات في مكان واحد');
    }
  }, [
    systemSettings.companyName,
    systemSettings.companyNameEn,
    systemSettings.companyCrNumber,
    systemSettings.companyLogo,
    systemSettings.companyPhone,
    systemSettings.companyEmail,
    systemSettings.companyAddress,
    systemSettings.companySubtitle
  ]);

  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('يرجى اختيار ملف صورة صالح (PNG, JPG, SVG, WebP)');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('حجم الصورة كبير جداً، يرجى اختيار صورة أقل من 2 ميجابايت');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        setCompLogo(base64);
        toast.success('تم تحميل صورة الشعار بنجاح، لا تنسَ حفظ بيانات الشركة');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveCompanyInfo = () => {
    if (!compName.trim()) {
      toast.error('يرجى إدخال اسم الشركة أو المركز');
      return;
    }

    askConfirmation({
      title: 'تأكيد تعديل بيانات الشركة الأساسية',
      message: `هل أنت متأكد من حفظ وتطبيق البيانات الأساسية الجديدة للشركة؟`,
      detail: `اسم الشركة: "${compName.trim()}" | رقم السجل التجاري: "${compCrNumber.trim() || 'غير محدد'}" سيتم تطبيقها في شاشة تسجيل الدخول، الشريط الجانبي، طباعة ومعاينة الفواتير، ودليل المستخدم.`,
      confirmLabel: 'تأكيد وحفظ بيانات الشركة',
      cancelLabel: 'إلغاء',
      onConfirm: () => {
        const updated = {
          ...systemSettings,
          companyName: compName.trim(),
          companyNameEn: compNameEn.trim(),
          companyCrNumber: compCrNumber.trim(),
          companyLogo: compLogo,
          companyPhone: compPhone.trim(),
          companyEmail: compEmail.trim(),
          companyAddress: compAddress.trim(),
          companySubtitle: compSubtitle.trim()
        };
        if (onUpdateSystemSettings) {
          onUpdateSystemSettings(updated);
        }
        toast.success('تم حفظ وتحديث بيانات الشركة بنجاح في كامل النظام');
      }
    });
  };
  const [selectedTicketTypeForPlaceholder, setSelectedTicketTypeForPlaceholder] = useState<string>('');
  const [placeholderInputText, setPlaceholderInputText] = useState<string>('');

  React.useEffect(() => {
    if (selectedTicketTypeForPlaceholder) {
      setPlaceholderInputText(ticketTypePlaceholders?.[selectedTicketTypeForPlaceholder] || '');
    }
  }, [selectedTicketTypeForPlaceholder, ticketTypePlaceholders]);

  // Drag and drop state for sorting ticketTypes
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    if (!isAdmin) return;
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    if (!isAdmin) return;
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    if (!isAdmin || draggedIndex === null) return;
    e.preventDefault();
    if (draggedIndex === targetIndex) return;

    const fromItem = ticketTypes[draggedIndex];
    const newTypes = [...ticketTypes];
    const [draggedItem] = newTypes.splice(draggedIndex, 1);
    newTypes.splice(targetIndex, 0, draggedItem);
    setDraggedIndex(null);

    askConfirmation({
      title: 'تأكيد إعادة ترتيب مواضيع الطلبات',
      message: `هل أنت متأكد من نقل موضوع الطلب "${fromItem}" إلى الترتيب الجديد؟`,
      detail: 'سيتم حفظ الترتيب الجديد لكافة الموظفين في قوائم الاختيار.',
      confirmLabel: 'تأكيد حفظ الترتيب',
      cancelLabel: 'تراجع',
      onConfirm: () => {
        onUpdateTicketTypes(newTypes);
        toast.success(`تم حفظ الترتيب الجديد لموضوع "${fromItem}"`);
      }
    });
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleClearAllChat = () => {
    askConfirmation({
      title: '⚠️ تأكيد مسح كافة رسائل الشات العام',
      message: 'هل أنت متأكد تماماً من رغبتك في مسح كافة رسائل الشات العام ومحادثات الفواتير والصور المرفقة؟',
      detail: 'تحذير شديد: هذا الإجراء نهائي ولا يمكن التراجع عنه أو استعادة الرسائل الممسوحة بعد تنفيذه.',
      confirmLabel: 'نعم، مسح جميع الرسائل الآن',
      cancelLabel: 'إلغاء والتراجع',
      isDestructive: true,
      onConfirm: async () => {
        setClearingChat(true);
        try {
          const { count, error: cErr } = await supabase.from('chat_messages').select('id', { count: 'exact', head: true });
          if (cErr) throw cErr;
          if (!count) {
            toast.error("لا توجد رسائل شات لمسحها.");
            setClearingChat(false);
            return;
          }
          const { error: dErr } = await supabase.from('chat_messages').delete().neq('id', '');
          if (dErr) throw dErr;

          toast.success(`تم مسح جميع رسائل الشات بنجاح! عدد الرسائل الممسوحة: ${count}`);
        } catch (err: any) {
          console.error("Error clearing chat messages:", err);
          if (err?.message?.includes("Quota") || err?.message?.includes("RESOURCE_EXHAUSTED")) {
            toast.error("عفواً، تم تجاوز الحد المجاني لقاعدة البيانات. يرجى المحاولة غداً.");
          } else {
            toast.error("حدث خطأ أثناء محاولة مسح الرسائل: " + err.message);
          }
        } finally {
          setClearingChat(false);
        }
      }
    });
  };

  const handleExportDatabase = () => {
    try {
      const backupObj = {
        version: "1.1",
        exportDate: new Date().toISOString(),
        customers,
        invoices,
        users,
        logs,
        tickets,
        warnings,
        mails,
        privateMessages,
        services,
        deletedInvoices
      };

      const dataStr = JSON.stringify(backupObj, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      const dateStr = new Date().toISOString().split('T')[0];
      link.download = `riyadah_db_backup_${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e: any) {
      toast.error('حدث خطأ أثناء تصدير قاعدة البيانات: ' + e.message);
    }
  };

  const handleImportDatabase = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportStatus(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        
        if (!json.customers || !json.invoices || !json.users) {
          setImportStatus({
            type: 'error',
            message: 'ملف النسخة الاحتياطية غير صالح، يرجى التأكد من اختيار ملف قاعدة بيانات صحيح.'
          });
          return;
        }

        askConfirmation({
          title: '⚠️ تأكيد استيراد قاعدة البيانات',
          message: 'هل أنت متأكد من استيراد ملف قاعدة البيانات وتحديث سجلات النظام؟',
          detail: 'تحذير: سيتم دمج وتحديث السجلات والفواتير الحالية بالبيانات الموجودة في الملف المرفوع.',
          confirmLabel: 'تأكيد الاستيراد الآن',
          cancelLabel: 'تراجع وإلغاء',
          isDestructive: true,
          onConfirm: () => {
            onImportBackup(json);
            setImportStatus({
              type: 'success',
              message: 'تم استيراد قاعدة البيانات بنجاح وتحديث كافة السجلات والفواتير!'
            });
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
            toast.success('تم استيراد قاعدة البيانات بنجاح!');
          }
        });
      } catch (err: any) {
        setImportStatus({
          type: 'error',
          message: 'حدث خطأ أثناء قراءة الملف: ' + err.message
        });
      }
    };
    reader.readAsText(file);
  };

  const currentUser = users.find(u => u.id === currentUserId);
  const isAdmin = currentUser?.role === 'admin';

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newUserName.trim() || !newUserUsername.trim() || !newUserPassword.trim()) {
      setError('يرجى ملء كافة حقول إدخال المستخدم الجديد');
      return;
    }

    const usernameExists = users.some(u => u.username?.toLowerCase() === newUserUsername.trim().toLowerCase());
    if (usernameExists) {
      setError('اسم المستخدم هذا مسجل مسبقاً في النظام');
      return;
    }

    let maxId = 0;
    users.forEach(u => {
      if (u.employeeId && u.employeeId.startsWith('AR')) {
        const num = parseInt(u.employeeId.substring(2));
        if (!isNaN(num) && num > maxId) {
          maxId = num;
        }
      }
    });
    const nextEmployeeId = `AR${String(maxId + 1).padStart(2, '0')}`;

    const newUser: User = {
      id: `user-${Date.now()}`,
      name: newUserName.trim(),
      username: newUserUsername.trim().toLowerCase(),
      password: newUserPassword.trim(),
      role: newUserRole,
      employeeId: nextEmployeeId,
      joinDate: new Date().toISOString().split('T')[0],
      isActive: true,
      branchId: newUserBranchId,
      permissions: {
        createInvoice: true,
        editInvoice: true,
        deleteInvoice: newUserRole === 'admin',
        manageCustomers: true,
        closeAccounts: newUserRole === 'admin',
        viewReports: newUserRole === 'admin',
        manageUsers: newUserRole === 'admin',
        editServices: newUserRole === 'admin',
        deleteServices: newUserRole === 'admin',
        viewActivityLogs: newUserRole === 'admin',
        inputTicketAmount: newUserRole === 'admin',
        viewTicketAmount: newUserRole === 'admin',
        manageTicketAmount: newUserRole === 'admin',
      }
    };

    const branchName = branches.find(b => b.id === newUserBranchId)?.name || 'الفرع الرئيسي';
    const roleLabel = ROLE_NAMES[newUserRole] || newUserRole;

    askConfirmation({
      title: 'تأكيد إضافة مستخدم جديد للنظام',
      message: `هل أنت متأكد من تسجيل الموظف الجديد "${newUserName.trim()}" باسم مستخدم (@${newUserUsername.trim().toLowerCase()})؟`,
      detail: `الدور المختار: ${roleLabel} | فرع العمل: ${branchName}`,
      confirmLabel: 'تأكيد تسجيل الموظف',
      cancelLabel: 'تراجع',
      onConfirm: () => {
        onAddUser(newUser);
        setNewUserName('');
        setNewUserUsername('');
        setNewUserPassword('');
        setNewUserRole('staff');
        setNewUserBranchId('branch-1');
        toast.success(`تم تسجيل الموظف "${newUser.name}" بنجاح!`);
      }
    });
  };

  const handlePermissionToggle = (userId: string, permissionKey: string) => {
    const userToEdit = users.find(u => u.id === userId);
    if (!userToEdit) return;

    const currentVal = !!((userToEdit.permissions as any)[permissionKey]);
    const nextVal = !currentVal;
    const actionText = nextVal ? 'منح' : 'سحب';
    const permName = PERMISSION_NAMES[permissionKey] || permissionKey;

    askConfirmation({
      title: 'تأكيد تعديل صلاحية الوصول',
      message: `هل أنت متأكد من رغبتك في ${actionText} صلاحية "${permName}" للموظف "${userToEdit.name}"؟`,
      detail: nextVal 
        ? 'سيتم تفعيل هذه الصلاحية للمستخدم فوراً وإتاحة الميزات المقترنة بها.' 
        : 'سيتم تقييد وصول المستخدم لهذه الميزة فوراً وحجبها من واجهته.',
      confirmLabel: `${actionText} الصلاحية`,
      cancelLabel: 'تراجع وإلغاء',
      isDestructive: !nextVal,
      onConfirm: () => {
        const updatedPermissions: any = {
          ...userToEdit.permissions,
          [permissionKey]: nextVal
        };

        // Co-dependencies: if user can input amounts, they automatically should be able to view them
        if (permissionKey === 'inputTicketAmount' && nextVal === true) {
          updatedPermissions.viewTicketAmount = true;
        }
        // If viewing amounts is turned off, inputting amounts is also turned off
        if (permissionKey === 'viewTicketAmount' && nextVal === false) {
          updatedPermissions.inputTicketAmount = false;
          updatedPermissions.manageTicketAmount = false;
        }

        onUpdateUserPermissions(userId, updatedPermissions);
        toast.success(`تم ${actionText} صلاحية "${permName}" للموظف بنجاح`);
      }
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-right font-sans" dir="rtl" id="settings-section">
      
      {/* COLUMN 1 & 2: User Access & Roles Management */}
      <div className="lg:col-span-2 space-y-6">
        
        {isAdmin && (
          <>
            {/* Active Session Simulator (VERY helpful to let them test as other employees) */}
            <div className="p-5 bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-2xl shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-800">محاكي اختبار الموظفين والصلاحيات</h3>
          </div>
          <p className="text-xs text-slate-500">
            يمكنك محاكاة تسجيل الدخول باسم أي موظف من القائمة أدناه لاختبار فحص الصلاحيات والحظر، ورؤية اسمه المطبوع بجوار التعديلات:
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {users.filter(u => !u.id.endsWith('_config')).map(u => (
              <button
                key={u.id}
                onClick={() => {
                  if (currentUserId === u.id) return;
                  askConfirmation({
                    title: 'تأكيد محاكاة جلسة الموظف',
                    message: `هل ترغب في تسجيل الدخول بمحاكاة حساب الموظف "${u.name}" (${u.role === 'admin' ? 'مدير النظام' : 'موظف'}) لاختبار الواجهات والصلاحيات؟`,
                    detail: 'ستظهر لك الواجهات والصلاحيات بحسب ما هو مخصص لهذا الموظف، وسيظهر شريط علوي باللون الأحمر يحتوي على ملاحظة وزر للعودة للوضع الطبيعي في أي وقت.',
                    confirmLabel: 'بدء المحاكاة الآن',
                    cancelLabel: 'إلغاء',
                    onConfirm: () => {
                      if (onStartSimulation) {
                        onStartSimulation(u.id);
                      } else {
                        onSetCurrentUser(u.id);
                      }
                      toast.success(`تم بدء محاكاة حساب الموظف: ${u.name}`);
                    }
                  });
                }}
                className={`text-xs py-2 px-3.5 rounded-xl font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                  currentUserId === u.id
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Shield className={`w-3.5 h-3.5 ${currentUserId === u.id ? 'text-white' : 'text-slate-400'}`} />
                {u.name} ({u.role === 'admin' ? 'مدير النظام' : 'موظف'})
              </button>
            ))}
          </div>
        </div>

        {/* System Settings & Buttons Configuration */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <ToggleRight className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-800">إعدادات النظام والأزرار</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Invoice Settings */}
            <div className="space-y-4 p-4 bg-slate-50 rounded-xl border border-slate-100 lg:col-span-2">
              <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1 border-b border-slate-200 pb-2">
                <AlertTriangle className="w-4 h-4 text-slate-500" /> إعدادات الفواتير المتأخرة
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-2">تصنيف الفواتير المتأخرة (تحديد الفترة)</label>
                  <select
                    value={systemSettings.lateInvoicePeriod || '1_month'}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === systemSettings.lateInvoicePeriod) return;
                      const periodMap: Record<string, string> = {
                        '1_week': 'أسبوع',
                        '2_weeks': 'أسبوعين',
                        '3_weeks': '3 أسابيع',
                        '1_month': 'شهر',
                        '2_months': 'شهرين',
                        '3_months': '3 شهور'
                      };
                      askConfirmation({
                        title: 'تأكيد تعديل فترة الفواتير المتأخرة',
                        message: `هل أنت متأكد من تغيير مدة تصنيف الفواتير المتأخرة إلى (${periodMap[val] || val})؟`,
                        detail: 'سيتم احتساب الفواتير غير المسددة بعد انقضاء هذه المدة كمتأخرة وتطبيق التنبيهات عليها.',
                        confirmLabel: 'تأكيد التعديل',
                        cancelLabel: 'تراجع',
                        onConfirm: () => {
                          handleUpdateSystemSettings('lateInvoicePeriod', val);
                          toast.success(`تم تغيير مدة تصنيف الفواتير المتأخرة إلى ${periodMap[val] || val}`);
                        }
                      });
                    }}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white cursor-pointer"
                  >
                    <option value="1_week">أسبوع</option>
                    <option value="2_weeks">أسبوعين</option>
                    <option value="3_weeks">3 أسابيع</option>
                    <option value="1_month">شهر</option>
                    <option value="2_months">شهرين</option>
                    <option value="3_months">3 شهور</option>
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1.5">تحدد هذه المدة متى يتم اعتبار الفاتورة متأخرة وتطبيق التنبيهات عليها.</p>
                </div>
                
                <div className="flex flex-col justify-center">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative">
                      <input 
                        type="checkbox" 
                        className="sr-only" 
                        checked={systemSettings.enableLateInvoiceAlert !== false}
                        onChange={(e) => {
                          const nextVal = e.target.checked;
                          askConfirmation({
                            title: 'تأكيد إعدادات التنبيه المنبثق',
                            message: `هل أنت متأكد من ${nextVal ? 'تفعيل' : 'تعطيل'} التنبيه المنبثق للفواتير المتأخرة؟`,
                            detail: nextVal ? 'ستظهر نافذة تنبيه للموظف عند تسجيل الدخول حال وجود فواتير متأخرة.' : 'لن تظهر نوافذ تنبيهية منبثقة عند الدخول.',
                            confirmLabel: nextVal ? 'تفعيل التنبيه' : 'تعطيل التنبيه',
                            cancelLabel: 'تراجع',
                            isDestructive: !nextVal,
                            onConfirm: () => {
                              handleUpdateSystemSettings('enableLateInvoiceAlert', nextVal);
                              toast.success(nextVal ? 'تم تفعيل التنبيه المنبثق للفواتير المتأخرة' : 'تم تعطيل التنبيه المنبثق');
                            }
                          });
                        }}
                      />
                      <div className={`block w-10 h-6 rounded-full transition-colors ${systemSettings.enableLateInvoiceAlert !== false ? 'bg-teal-500' : 'bg-slate-300'}`}></div>
                      <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${systemSettings.enableLateInvoiceAlert !== false ? 'translate-x-4' : 'translate-x-0'}`}></div>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold text-slate-700 group-hover:text-teal-600 transition-colors">تفعيل التنبيه المنبثق للفواتير المتأخرة</span>
                      <span className="text-[9px] text-slate-400">عند تفعيل هذا الخيار، ستظهر نافذة منبثقة للموظف عند تسجيل الدخول تنبهه بوجود فواتير متأخرة.</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
            {/* Idle Settings */}
            <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Lock className="w-4 h-4 text-slate-500" /> إعدادات تسجيل الدخول والخمول
              </h4>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">عدد ساعات الخمول للتسجيل الخروج التلقائي (أدخل 0 للتعطيل):</label>
                <div className="flex gap-2 items-center">
                  <input 
                    type="number"
                    min="0"
                    step="1"
                    value={idleHoursVal}
                    onChange={(e) => setIdleHoursVal(parseInt(e.target.value) || 0)}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-hidden bg-white"
                  />
                  <button
                    type="button"
                    disabled={idleHoursVal === (systemSettings.idleHours || 0)}
                    onClick={() => {
                      askConfirmation({
                        title: 'تأكيد تعديل مهلة الخمول',
                        message: `هل أنت متأكد من تحديد مهلة خمول تسجيل الخروج التلقائي إلى (${idleHoursVal === 0 ? 'تعطيل' : `${idleHoursVal} ساعات`})؟`,
                        detail: idleHoursVal === 0 
                          ? 'لن يتم تسجيل الخروج التلقائي عند ترك النظام مفتوحاً.' 
                          : `سيتم قفل النظام وتسجيل الخروج تلقائياً بعد مرور ${idleHoursVal} ساعة من عدم النشاط.`,
                        confirmLabel: 'حفظ المهلة',
                        cancelLabel: 'تراجع',
                        onConfirm: () => {
                          handleUpdateSystemSettings('idleHours', idleHoursVal);
                          toast.success('تم تحديث مهلة الخمول بنجاح');
                        }
                      });
                    }}
                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-lg text-xs font-bold shrink-0 transition-all cursor-pointer"
                  >
                    حفظ وتأكيد
                  </button>
                </div>
              </div>
            </div>

            {/* Main Buttons Toggle */}
            <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <ToggleLeft className="w-4 h-4 text-slate-500" /> التحكم في الأزرار الرئيسية
              </h4>
              
              <div className="space-y-2.5">
                <label className="flex items-center justify-between p-2 hover:bg-white rounded-lg transition-colors cursor-pointer border border-transparent hover:border-slate-100">
                  <span className="text-xs font-medium text-slate-700">زر "إصدار فاتورة جديدة"</span>
                  <input 
                    type="checkbox" 
                    checked={systemSettings.enableNewInvoice !== false}
                    onChange={(e) => {
                      const nextVal = e.target.checked;
                      askConfirmation({
                        title: 'تأكيد التحكم بالأزرار',
                        message: `هل أنت متأكد من ${nextVal ? 'تفعيل وإظهار' : 'إخفاء وتعطيل'} زر "إصدار فاتورة جديدة"؟`,
                        detail: nextVal ? 'سيظهر زر إصدار الفاتورة للمستخدمين المصرح لهم.' : 'سيتم إخفاء زر إنشاء الفواتير ومنع فتح نموذج الفاتورة.',
                        confirmLabel: nextVal ? 'تفعيل الزر' : 'تعطيل الزر',
                        cancelLabel: 'تراجع',
                        isDestructive: !nextVal,
                        onConfirm: () => {
                          handleUpdateSystemSettings('enableNewInvoice', nextVal);
                          toast.success(nextVal ? 'تم تفعيل زر إصدار فاتورة جديدة' : 'تم تعطيل زر إصدار فاتورة جديدة');
                        }
                      });
                    }}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer" 
                  />
                </label>
                <label className="flex items-center justify-between p-2 hover:bg-white rounded-lg transition-colors cursor-pointer border border-transparent hover:border-slate-100">
                  <span className="text-xs font-medium text-slate-700">زر "طلب تذكرة جديدة"</span>
                  <input 
                    type="checkbox" 
                    checked={systemSettings.enableNewTicket !== false}
                    onChange={(e) => {
                      const nextVal = e.target.checked;
                      askConfirmation({
                        title: 'تأكيد التحكم بالأزرار',
                        message: `هل أنت متأكد من ${nextVal ? 'تفعيل وإظهار' : 'إخفاء وتعطيل'} زر "تقديم تذكرة / طلب جديد"؟`,
                        detail: nextVal ? 'سيتمكن الموظفون من رفع تذاكر وطلبات دعم جديدة.' : 'سيتم إخفاء زر إنشاء التذاكر ومنع تقديم طلبات جديدة.',
                        confirmLabel: nextVal ? 'تفعيل الزر' : 'تعطيل الزر',
                        cancelLabel: 'تراجع',
                        isDestructive: !nextVal,
                        onConfirm: () => {
                          handleUpdateSystemSettings('enableNewTicket', nextVal);
                          toast.success(nextVal ? 'تم تفعيل زر طلب تذكرة جديدة' : 'تم تعطيل زر طلب تذكرة جديدة');
                        }
                      });
                    }}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer" 
                  />
                </label>
                <label className="flex items-center justify-between p-2 hover:bg-white rounded-lg transition-colors cursor-pointer border border-transparent hover:border-slate-100">
                  <span className="text-xs font-medium text-slate-700">زر "إصدار إنذار جديد"</span>
                  <input 
                    type="checkbox" 
                    checked={systemSettings.enableNewWarning !== false}
                    onChange={(e) => {
                      const nextVal = e.target.checked;
                      askConfirmation({
                        title: 'تأكيد التحكم بالأزرار',
                        message: `هل أنت متأكد من ${nextVal ? 'تفعيل وإظهار' : 'إخفاء وتعطيل'} زر "إصدار إنذار جديد"؟`,
                        detail: nextVal ? 'سيتاح لمسؤولي الموارد البشرية توجيه إنذارات جديدة.' : 'سيتم إخفاء زر إصدار الإنذارات.',
                        confirmLabel: nextVal ? 'تفعيل الزر' : 'تعطيل الزر',
                        cancelLabel: 'تراجع',
                        isDestructive: !nextVal,
                        onConfirm: () => {
                          handleUpdateSystemSettings('enableNewWarning', nextVal);
                          toast.success(nextVal ? 'تم تفعيل زر إصدار إنذار جديد' : 'تم تعطيل زر إصدار إنذار جديد');
                        }
                      });
                    }}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer" 
                  />
                </label>
                <label className="flex items-center justify-between p-2 hover:bg-white rounded-lg transition-colors cursor-pointer border border-transparent hover:border-slate-100">
                  <span className="text-xs font-medium text-slate-700">زر "تسجيل عميل جديد"</span>
                  <input 
                    type="checkbox" 
                    checked={systemSettings.enableNewCustomer !== false}
                    onChange={(e) => {
                      const nextVal = e.target.checked;
                      askConfirmation({
                        title: 'تأكيد التحكم بالأزرار',
                        message: `هل أنت متأكد من ${nextVal ? 'تفعيل وإظهار' : 'إخفاء وتعطيل'} زر "تسجيل عميل جديد"؟`,
                        detail: nextVal ? 'سيتاح للموظفين إضافة عملاء جدد للنظام.' : 'سيتم حجب إمكانية تسجيل عملاء جدد.',
                        confirmLabel: nextVal ? 'تفعيل الزر' : 'تعطيل الزر',
                        cancelLabel: 'تراجع',
                        isDestructive: !nextVal,
                        onConfirm: () => {
                          handleUpdateSystemSettings('enableNewCustomer', nextVal);
                          toast.success(nextVal ? 'تم تفعيل زر تسجيل عميل جديد' : 'تم تعطيل زر تسجيل عميل جديد');
                        }
                      });
                    }}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer" 
                  />
                </label>
                <label className="flex items-center justify-between p-2 hover:bg-white rounded-lg transition-colors cursor-pointer border border-transparent hover:border-slate-100">
                  <span className="text-xs font-medium text-slate-700">زر "إغلاق حسابات" (الشريط الجانبي)</span>
                  <input 
                    type="checkbox" 
                    checked={systemSettings.enableCloseAccounts !== false}
                    onChange={(e) => {
                      const nextVal = e.target.checked;
                      askConfirmation({
                        title: 'تأكيد التحكم بالأزرار',
                        message: `هل أنت متأكد من ${nextVal ? 'إظهار وتفعيل' : 'إخفاء وتعطيل'} زر "إغلاق حسابات" بالشريط الجانبي؟`,
                        detail: nextVal ? 'سيظهر زر إقفال الحسابات والتحصيلات في القائمة الرئيسية.' : 'سيتم إخفاء خيار إغلاق الحسابات من الشريط الجانبي.',
                        confirmLabel: nextVal ? 'تفعيل الزر' : 'تعطيل الزر',
                        cancelLabel: 'تراجع',
                        isDestructive: !nextVal,
                        onConfirm: () => {
                          handleUpdateSystemSettings('enableCloseAccounts', nextVal);
                          toast.success(nextVal ? 'تم تفعيل زر إغلاق حسابات' : 'تم تعطيل زر إغلاق حسابات');
                        }
                      });
                    }}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer" 
                  />
                </label>
              </div>
            </div>

            {/* Customer Registration Fields Settings */}
            <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <ToggleLeft className="w-4 h-4 text-slate-500" /> إعدادات تسجيل العميل
              </h4>
              <div className="space-y-2.5">
                <label className="flex items-center justify-between p-2 hover:bg-white rounded-lg transition-colors cursor-pointer border border-transparent hover:border-slate-100">
                  <span className="text-xs font-medium text-slate-700">رقم الهاتف إلزامي</span>
                  <input 
                    type="checkbox" 
                    checked={systemSettings.requireCustomerPhone !== false}
                    onChange={(e) => {
                      const nextVal = e.target.checked;
                      askConfirmation({
                        title: 'تأكيد إعدادات تسجيل العميل',
                        message: `هل أنت متأكد من ${nextVal ? 'جعل رقم هاتف العميل حقلاً إلزامياً' : 'إلغاء إلزامية رقم الهاتف'} عند تسجيل العملاء؟`,
                        detail: nextVal ? 'لن يتم قبول حفظ أي عميل جديد دون إدخال رقم هاتف صالح.' : 'يمكن حفظ العميل بدون رقم هاتف اختياري.',
                        confirmLabel: 'تأكيد التعديل',
                        cancelLabel: 'تراجع',
                        onConfirm: () => {
                          handleUpdateSystemSettings('requireCustomerPhone', nextVal);
                          toast.success(nextVal ? 'تم تفعيل إلزامية رقم الهاتف' : 'تم إلغاء إلزامية رقم الهاتف');
                        }
                      });
                    }}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer" 
                  />
                </label>
                <label className="flex items-center justify-between p-2 hover:bg-white rounded-lg transition-colors cursor-pointer border border-transparent hover:border-slate-100">
                  <span className="text-xs font-medium text-slate-700">الرقم المدني / السجل التجاري إلزامي</span>
                  <input 
                    type="checkbox" 
                    checked={systemSettings.requireCustomerCivilId !== false}
                    onChange={(e) => {
                      const nextVal = e.target.checked;
                      askConfirmation({
                        title: 'تأكيد إعدادات تسجيل العميل',
                        message: `هل أنت متأكد من ${nextVal ? 'جعل الرقم المدني / السجل التجاري حقلاً إلزامياً' : 'إلغاء إلزامية الرقم المدني / السجل'} عند تسجيل العملاء؟`,
                        detail: nextVal ? 'لن يتم قبول حفظ أي عميل جديد دون إدخال رقمه المدني أو التجاري.' : 'يمكن حفظ العميل بدون الرقم المدني أو التجاري اختياري.',
                        confirmLabel: 'تأكيد التعديل',
                        cancelLabel: 'تراجع',
                        onConfirm: () => {
                          handleUpdateSystemSettings('requireCustomerCivilId', nextVal);
                          toast.success(nextVal ? 'تم تفعيل إلزامية الرقم المدني / السجل التجاري' : 'تم إلغاء إلزامية الرقم المدني / السجل التجاري');
                        }
                      });
                    }}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer" 
                  />
                </label>
              </div>
            </div>
          </div>
        </div>


        {/* User Roles Card */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-teal-600" />
                <h3 className="text-sm font-bold text-slate-800">إدارة المستخدمين وصلاحيات الوصول</h3>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-50 border border-teal-100/80 text-teal-800 text-[11px] font-extrabold shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-ping"></span>
                👥 {users.filter(u => !u.id.endsWith('_config')).length} موظفين مسجلين في النظام
              </span>
            </div>
            {!isAdmin && (
              <span className="text-[10px] bg-rose-50 text-rose-700 font-bold px-2.5 py-1 rounded-md flex items-center gap-1 self-start sm:self-auto">
                <Lock className="w-3.5 h-3.5" />
                عرض فقط (يتطلب صلاحية مدير النظام)
              </span>
            )}
          </div>

          <div className="max-h-[480px] overflow-y-auto pr-2.5 pl-1 divide-y divide-slate-100 border border-slate-100/50 rounded-xl p-3 bg-slate-50/10 space-y-1" id="users-access-list">
            {users.filter(u => !u.id.endsWith('_config')).map(u => (
              <div key={u.id} className="py-4 first:pt-0 last:pb-0 space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">{u.name}</h4>
                    <span className="text-[10px] text-slate-400 font-mono">@{u.username}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Role selector */}
                    <select
                      disabled={!isAdmin || u.id === currentUserId}
                      value={u.role}
                      onChange={(e) => {
                        const newRole = e.target.value as UserRole;
                        if (newRole === u.role) return;
                        const newRoleLabel = ROLE_NAMES[newRole] || newRole;
                        const oldRoleLabel = ROLE_NAMES[u.role] || u.role;
                        askConfirmation({
                          title: 'تأكيد تعديل دور وصلاحية الموظف',
                          message: `هل أنت متأكد من تغيير دور الموظف "${u.name}" من (${oldRoleLabel}) إلى (${newRoleLabel})؟`,
                          detail: 'قد يؤثر تغيير الدور على إمكانية وصول الموظف إلى بعض الأقسام الحساسة في النظام.',
                          confirmLabel: 'تأكيد تغيير الدور',
                          cancelLabel: 'تراجع وإلغاء',
                          onConfirm: () => {
                            onUpdateUserRole(u.id, newRole);
                            toast.success(`تم تغيير دور الموظف "${u.name}" إلى ${newRoleLabel} بنجاح`);
                          }
                        });
                      }}
                      className={`text-[10px] font-bold px-2 py-1 rounded-md border transition-all cursor-pointer outline-hidden ${
                        u.role === 'admin'
                          ? 'bg-indigo-50 border-indigo-100 text-indigo-700'
                          : u.role === 'hr'
                          ? 'bg-amber-50 border-amber-100 text-amber-700'
                          : u.role === 'accountant'
                          ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                          : 'bg-slate-50 border-slate-100 text-slate-600'
                      } disabled:opacity-60`}
                    >
                      <option value="admin">مدير النظام 🛡️</option>
                      <option value="hr">مدير HR 👥</option>
                      <option value="accountant">محاسب مالي 💰</option>
                      <option value="staff">موظف قياسي 👤</option>
                      <option value="external_support_tech">فني دعم خارجي 🔧</option>
                      <option value="external_support_admin">إداري دعم خارجي 📋</option>
                      <option value="temp_visitor">زائر مؤقت 🚶</option>
                      <option value="trainee">متدرب 🎓</option>
                    </select>

                    {/* Delete button */}
                    {isAdmin && u.id !== currentUserId && (
                      <button
                        type="button"
                        onClick={() => {
                          askConfirmation({
                            title: 'تأكيد حذف حساب المستخدم نهائياً',
                            message: `هل أنت متأكد من رغبتك في حذف حساب الموظف "${u.name}" (@${u.username})؟`,
                            detail: 'تحذير: لا يمكن التراجع عن هذا الإجراء وسيتم إزالة المستخدم من سجلات النظام.',
                            confirmLabel: 'نعم، حذف الحساب نهائياً',
                            cancelLabel: 'إلغاء التراجع',
                            isDestructive: true,
                            onConfirm: () => {
                              onDeleteUser(u.id);
                              toast.success(`تم حذف حساب الموظف "${u.name}" بنجاح`);
                            }
                          });
                        }}
                        className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100 cursor-pointer"
                        title="حذف المستخدم"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Sub-permissions grid checkboxes */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-slate-50 p-2.5 rounded-xl text-[10px]">
                  <label className="flex items-center gap-1.5 text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={!isAdmin}
                      checked={u.permissions.createInvoice}
                      onChange={() => handlePermissionToggle(u.id, 'createInvoice')}
                      className="rounded-xs border-slate-300 text-teal-600 focus:ring-teal-500"
                    />
                    إنشاء الفواتير
                  </label>
                  <label className="flex items-center gap-1.5 text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={!isAdmin}
                      checked={u.permissions.editInvoice}
                      onChange={() => handlePermissionToggle(u.id, 'editInvoice')}
                      className="rounded-xs border-slate-300 text-teal-600 focus:ring-teal-500"
                    />
                    تعديل الفواتير
                  </label>
                  <label className="flex items-center gap-1.5 text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={!isAdmin}
                      checked={u.permissions.deleteInvoice}
                      onChange={() => handlePermissionToggle(u.id, 'deleteInvoice')}
                      className="rounded-xs border-slate-300 text-teal-600 focus:ring-teal-500"
                    />
                    حذف الفواتير
                  </label>
                  <label className="flex items-center gap-1.5 text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={!isAdmin}
                      checked={u.permissions.manageCustomers}
                      onChange={() => handlePermissionToggle(u.id, 'manageCustomers')}
                      className="rounded-xs border-slate-300 text-teal-600 focus:ring-teal-500"
                    />
                    إدارة العملاء
                  </label>
                  <label className="flex items-center gap-1.5 text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={!isAdmin}
                      checked={u.permissions.closeAccounts}
                      onChange={() => handlePermissionToggle(u.id, 'closeAccounts')}
                      className="rounded-xs border-slate-300 text-teal-600 focus:ring-teal-500"
                    />
                    إغلاق الحسابات
                  </label>
                  <label className="flex items-center gap-1.5 text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={!isAdmin}
                      checked={u.permissions.viewReports}
                      onChange={() => handlePermissionToggle(u.id, 'viewReports')}
                      className="rounded-xs border-slate-300 text-teal-600 focus:ring-teal-500"
                    />
                    رؤية التقارير والتحليلات
                  </label>
                  <label className="flex items-center gap-1.5 text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={!isAdmin}
                      checked={u.permissions.viewActivityLogs}
                      onChange={() => handlePermissionToggle(u.id, 'viewActivityLogs')}
                      className="rounded-xs border-slate-300 text-teal-600 focus:ring-teal-500"
                    />
                    مشاهدة سجل الأنشطة
                  </label>
                   <label className="flex items-center gap-1.5 text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={!isAdmin}
                      checked={u.permissions.editServices}
                      onChange={() => handlePermissionToggle(u.id, 'editServices')}
                      className="rounded-xs border-slate-300 text-teal-600 focus:ring-teal-500"
                    />
                    تعديل سجل الخدمات
                  </label>
                  <label className="flex items-center gap-1.5 text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={!isAdmin}
                      checked={u.permissions.deleteServices}
                      onChange={() => handlePermissionToggle(u.id, 'deleteServices')}
                      className="rounded-xs border-slate-300 text-teal-600 focus:ring-teal-500"
                    />
                    حذف سجل الخدمات
                  </label>
                  <label className="flex items-center gap-1.5 text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={!isAdmin}
                      checked={!!u.permissions.viewTicketAmount || !!u.permissions.manageTicketAmount || !!u.permissions.inputTicketAmount || u.role === 'admin'}
                      onChange={() => handlePermissionToggle(u.id, 'viewTicketAmount')}
                      className="rounded-xs border-slate-300 text-teal-600 focus:ring-teal-500"
                    />
                    رؤية مبالغ التذاكر 👁️
                  </label>
                  <label className="flex items-center gap-1.5 text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={!isAdmin}
                      checked={!!u.permissions.inputTicketAmount || (!!u.permissions.manageTicketAmount && u.permissions.inputTicketAmount === undefined) || u.role === 'admin'}
                      onChange={() => handlePermissionToggle(u.id, 'inputTicketAmount')}
                      className="rounded-xs border-slate-300 text-teal-600 focus:ring-teal-500"
                    />
                    إدخال مبالغ التذاكر ✏️
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* -------------------- BRAND NEW SECTION: Multi-branch & Employee Transfer Management -------------------- */}
        {isAdmin && (
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs space-y-5">
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-teal-600" />
              <h3 className="text-sm font-bold text-slate-800">إدارة الفروع المتعددة ونقل الموظفين</h3>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              هنا يمكنك التحكم الكامل في جميع الفروع المسجلة في النظام، وإضافة فروع جديدة للمؤسسة، ونقل الموظفين بين الفروع المختلفة وتعديل صلاحياتهم وظهور البيانات لديهم تلقائياً.
            </p>

            {/* View-only by default; the admin must click "تعديل" to unlock the fields */}
            <div className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-2.5 ${branchesEditMode ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
              <span className="text-xs font-semibold text-slate-600">
                {branchesEditMode ? '✏️ وضع التعديل مفعّل — يمكنك الآن تحرير الحقول وحفظ التغييرات.' : '🔒 الحقول معروضة للقراءة فقط. اضغط «تعديل» لفتحها للتحرير.'}
              </span>
              <button
                type="button"
                onClick={() => setBranchesEditMode(m => !m)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-95 ${branchesEditMode ? 'bg-white border border-amber-300 text-amber-700 hover:bg-amber-100' : 'bg-teal-600 hover:bg-teal-700 text-white shadow-xs'}`}
              >
                {branchesEditMode ? 'إنهاء التعديل' : '✏️ تعديل'}
              </button>
            </div>

            <fieldset
              disabled={!branchesEditMode}
              className="border-0 p-0 m-0 min-w-0 space-y-5 [&_input:disabled]:bg-slate-50 [&_input:disabled]:text-slate-600 [&_select:disabled]:bg-slate-50 [&_select:disabled]:text-slate-600 [&_textarea:disabled]:bg-slate-50 [&_textarea:disabled]:text-slate-600 [&_button:disabled]:opacity-40 [&_button:disabled]:cursor-not-allowed"
            >

            {/* -------------------- Core Company Details (تعديل بيانات الأساسية للشركة) -------------------- */}
            <div className="bg-gradient-to-br from-teal-50/60 via-slate-50/80 to-emerald-50/40 border border-teal-100 rounded-xl p-4 sm:p-5 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-teal-100/70 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-teal-600/10 flex items-center justify-center text-teal-700">
                    <Building className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      تعديل بيانات الأساسية للشركة
                      <span className="text-[10px] font-medium bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full">
                        شامل لكل أجزاء النظام
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      تعديل اسم الشركة، الشعار، والسجل التجاري وبيانات الاتصال التي تظهر في شاشة الدخول، الشريط الجانبي، الفواتير، ودليل المستخدم.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSaveCompanyInfo}
                  className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  حفظ بيانات الشركة
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                {/* Logo Uploader & Preview Column */}
                <div className="lg:col-span-4 bg-white/90 border border-slate-200/80 rounded-xl p-3.5 space-y-3 flex flex-col items-center text-center">
                  <span className="text-xs font-bold text-slate-700 self-start flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-teal-600" />
                    شعار الشركة (اللوجو)
                  </span>

                  <div className="w-28 h-28 rounded-xl border-2 border-dashed border-teal-200 bg-slate-50/60 flex items-center justify-center p-2 overflow-hidden shadow-inner">
                    {compLogo ? (
                      <img 
                        src={compLogo} 
                        alt="معاينة شعار الشركة" 
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <Logo showText={false} size="sm" />
                    )}
                  </div>

                  <input
                    type="file"
                    ref={logoFileInputRef}
                    onChange={handleLogoFileUpload}
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    className="hidden"
                  />

                  <div className="flex flex-col sm:flex-row w-full gap-2">
                    <button
                      type="button"
                      onClick={() => logoFileInputRef.current?.click()}
                      className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200/80 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      رفع شعار
                    </button>

                    {compLogo && (
                      <button
                        type="button"
                        onClick={() => {
                          setCompLogo('');
                          toast.success('تمت العودة للشعار الافتراضي، اضغط حفظ للاعتماد');
                        }}
                        className="flex items-center justify-center gap-1 px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                        title="استعادة الشعار الافتراضي للنظام"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        الافتراضي
                      </button>
                    )}
                  </div>

                  <p className="text-[10px] text-slate-400 leading-tight">
                    يدعم PNG, JPG, SVG بحد أقصى 2MB. يفضل شعار مفرغ بخلفية شفافة.
                  </p>
                </div>

                {/* Company Form Inputs Column */}
                <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white/90 border border-slate-200/80 rounded-xl p-3.5">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      اسم الشركة / المركز (بالعربية) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={compName}
                      onChange={(e) => setCompName(e.target.value)}
                      placeholder="مثال: مركز سند الريادة للخدمات"
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white"
                      dir="rtl"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      الاسم بالإنجليزية أو الرمز التجاري
                    </label>
                    <input
                      type="text"
                      value={compNameEn}
                      onChange={(e) => setCompNameEn(e.target.value)}
                      placeholder="مثال: AL-RIYADAH SAND SERVICES"
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white"
                      dir="ltr"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      رقم السجل التجاري (C.R.)
                    </label>
                    <input
                      type="text"
                      value={compCrNumber}
                      onChange={(e) => setCompCrNumber(e.target.value)}
                      placeholder="مثال: 1342890"
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white"
                      dir="ltr"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      رقم الهاتف / الواتساب الرسمي
                    </label>
                    <input
                      type="text"
                      value={compPhone}
                      onChange={(e) => setCompPhone(e.target.value)}
                      placeholder="مثال: 97994259"
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white"
                      dir="ltr"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      البريد الإلكتروني الرسمي
                    </label>
                    <input
                      type="email"
                      value={compEmail}
                      onChange={(e) => setCompEmail(e.target.value)}
                      placeholder="مثال: info@company.com"
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white"
                      dir="ltr"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      العنوان والمقر الرئيسي
                    </label>
                    <input
                      type="text"
                      value={compAddress}
                      onChange={(e) => setCompAddress(e.target.value)}
                      placeholder="مثال: سلطنة عُمان - إبراء"
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white"
                      dir="rtl"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      الوصف الفرعي / الشعار اللفظي (Slogan)
                    </label>
                    <input
                      type="text"
                      value={compSubtitle}
                      onChange={(e) => setCompSubtitle(e.target.value)}
                      placeholder="مثال: شركائك في نجاح أعمالك .. كل الخدمات في مكان واحد"
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white"
                      dir="rtl"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
              {/* Part A: Branch Management */}
              <div className="space-y-3.5 border-l border-slate-100/80 pl-3">
                <h4 className="text-xs font-bold text-slate-700">🏢 قائمة الفروع وإضافة فرع جديد</h4>
                
                {/* Add Branch Form */}
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!newBranchName.trim() || !newBranchPhone.trim() || !newBranchEmail.trim() || !newBranchAddress.trim()) {
                      toast.error('جميع حقول الفرع إلزامية (الاسم، الهاتف، البريد، العنوان).');
                      return;
                    }
                    askConfirmation({
                      title: 'تأكيد إضافة فرع جديد',
                      message: `هل أنت متأكد من رغبتك في تسجيل وإضافة فرع "${newBranchName.trim()}" للنظام؟`,
                      detail: `العنوان: ${newBranchAddress.trim()} | الهاتف: ${newBranchPhone.trim()} | البريد: ${newBranchEmail.trim()}`,
                      confirmLabel: 'تأكيد وإضافة الفرع',
                      cancelLabel: 'إلغاء التراجع',
                      onConfirm: () => {
                        onAddBranch(
                          newBranchName.trim(), 
                          newBranchPhone.trim(), 
                          newBranchEmail.trim(), 
                          newBranchAddress.trim()
                        );
                        setNewBranchName('');
                        setNewBranchPhone('');
                        setNewBranchEmail('');
                        setNewBranchAddress('');
                        toast.success('تمت إضافة الفرع بنجاح');
                      }
                    });
                  }} 
                  className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200/60"
                >
                  <div className="text-[10px] font-bold text-teal-800">✨ إضافة فرع جديد (الحقول إلزامية)</div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="اسم الفرع *"
                      value={newBranchName}
                      onChange={(e) => setNewBranchName(e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-slate-800 text-[11px] focus:outline-hidden focus:ring-1 focus:ring-teal-500 bg-white"
                    />
                    <input
                      type="text"
                      placeholder="رقم الهاتف *"
                      value={newBranchPhone}
                      onChange={(e) => setNewBranchPhone(e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-slate-800 text-[11px] focus:outline-hidden focus:ring-1 focus:ring-teal-500 bg-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="email"
                      placeholder="إيميل الفرع *"
                      value={newBranchEmail}
                      onChange={(e) => setNewBranchEmail(e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-slate-800 text-[11px] focus:outline-hidden focus:ring-1 focus:ring-teal-500 bg-white"
                    />
                    <input
                      type="text"
                      placeholder="عنوان الفرع *"
                      value={newBranchAddress}
                      onChange={(e) => setNewBranchAddress(e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-slate-800 text-[11px] focus:outline-hidden focus:ring-1 focus:ring-teal-500 bg-white"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold text-[11px] py-1.5 rounded-lg transition-all shadow-xs cursor-pointer text-center"
                  >
                    🏢 تسجيل وإضافة الفرع
                  </button>
                </form>

                {/* Branch List */}
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {branches.map(br => {
                    const branchUserCount = users.filter(u => !u.id.endsWith('_config') && (u.branchId || 'branch-1') === br.id).length;
                    const isEditing = editingBranchId === br.id;
                    return (
                      <div key={br.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs flex flex-col gap-1">
                        {isEditing ? (
                          <form 
                            onSubmit={(e) => {
                              e.preventDefault();
                              if (!editingBranchName.trim() || !editingBranchPhone.trim() || !editingBranchEmail.trim() || !editingBranchAddress.trim()) {
                                toast.error('جميع الحقول إلزامية عند تعديل بيانات الفرع.');
                                return;
                              }
                              askConfirmation({
                                title: 'تأكيد تعديل بيانات الفرع',
                                message: `هل أنت متأكد من حفظ التعديلات على فرع "${editingBranchName.trim()}"؟`,
                                detail: `العنوان: ${editingBranchAddress.trim()} | الهاتف: ${editingBranchPhone.trim()} | البريد: ${editingBranchEmail.trim()}`,
                                confirmLabel: 'حفظ التعديلات',
                                cancelLabel: 'إلغاء التراجع',
                                onConfirm: () => {
                                  onUpdateBranch(
                                    br.id, 
                                    editingBranchName.trim(), 
                                    editingBranchPhone.trim(), 
                                    editingBranchEmail.trim(), 
                                    editingBranchAddress.trim()
                                  );
                                  setEditingBranchId(null);
                                  toast.success('تم تحديث بيانات الفرع بنجاح');
                                }
                              });
                            }} 
                            className="w-full space-y-2 bg-teal-50/50 p-2.5 rounded-lg border border-teal-100"
                          >
                            <div className="text-[10px] font-bold text-teal-800">📝 تعديل بيانات الفرع</div>
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="text"
                                placeholder="اسم الفرع *"
                                value={editingBranchName}
                                onChange={(e) => setEditingBranchName(e.target.value)}
                                className="w-full px-2 py-1 border border-slate-200 rounded-md text-slate-800 text-[11px] focus:outline-hidden focus:ring-1 focus:ring-teal-500 bg-white"
                                autoFocus
                              />
                              <input
                                type="text"
                                placeholder="رقم الهاتف *"
                                value={editingBranchPhone}
                                onChange={(e) => setEditingBranchPhone(e.target.value)}
                                className="w-full px-2 py-1 border border-slate-200 rounded-md text-slate-800 text-[11px] focus:outline-hidden focus:ring-1 focus:ring-teal-500 bg-white"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="email"
                                placeholder="البريد الإلكتروني *"
                                value={editingBranchEmail}
                                onChange={(e) => setEditingBranchEmail(e.target.value)}
                                className="w-full px-2 py-1 border border-slate-200 rounded-md text-slate-800 text-[11px] focus:outline-hidden focus:ring-1 focus:ring-teal-500 bg-white"
                              />
                              <input
                                type="text"
                                placeholder="العنوان بالتفصيل *"
                                value={editingBranchAddress}
                                onChange={(e) => setEditingBranchAddress(e.target.value)}
                                className="w-full px-2 py-1 border border-slate-200 rounded-md text-slate-800 text-[11px] focus:outline-hidden focus:ring-1 focus:ring-teal-500 bg-white"
                              />
                            </div>
                            <div className="flex gap-1.5 justify-end">
                              <button
                                type="submit"
                                className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-[10px] py-1 px-2.5 rounded-md transition-colors cursor-pointer"
                              >
                                حفظ
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingBranchId(null)}
                                className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-[10px] py-1 px-2.5 rounded-md transition-colors cursor-pointer"
                              >
                                إلغاء
                              </button>
                            </div>
                          </form>
                        ) : (
                          <>
                            <div className="flex justify-between items-start">
                              <div className="flex flex-col gap-0.5">
                                <div className="flex items-center gap-1">
                                  <span className="font-extrabold text-slate-700">🏢 {br.name}</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingBranchId(br.id);
                                      setEditingBranchName(br.name);
                                      setEditingBranchPhone(br.phone || '');
                                      setEditingBranchEmail(br.email || '');
                                      setEditingBranchAddress(br.address || '');
                                    }}
                                    className="text-slate-400 hover:text-teal-600 transition-colors p-0.5 rounded-md hover:bg-slate-100 cursor-pointer"
                                    title="تعديل بيانات الفرع"
                                  >
                                    <Edit className="w-3 h-3" />
                                  </button>
                                  {br.id !== 'branch-1' && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        askConfirmation({
                                          title: 'تأكيد حذف الفرع نهائياً',
                                          message: `هل أنت متأكد من رغبتك في حذف فرع "${br.name}" نهائياً من النظام؟`,
                                          detail: 'تنبيه: سيتم نقل أي موظفين مسجلين بهذا الفرع إلى الفرع الرئيسي تلقائياً.',
                                          confirmLabel: 'نعم، حذف الفرع',
                                          cancelLabel: 'إلغاء التراجع',
                                          isDestructive: true,
                                          onConfirm: () => {
                                            onDeleteBranch(br.id);
                                            toast.success(`تم حذف فرع "${br.name}"`);
                                          }
                                        });
                                      }}
                                      className="text-slate-400 hover:text-rose-600 transition-colors p-0.5 rounded-md hover:bg-rose-100 cursor-pointer"
                                      title="حذف الفرع"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                                <span className="text-[10px] text-slate-400">الموظفين: {branchUserCount} موظف</span>
                              </div>
                              <span className="text-[9px] text-slate-400 font-mono">
                                {new Date(br.createdAt).toLocaleDateString('ar-OM')}
                              </span>
                            </div>
                            
                            <div className="text-[10px] text-slate-500 bg-white p-1.5 rounded-lg border border-slate-100 space-y-0.5 mt-1">
                              <div>📞 الهاتف: <span className="font-mono text-slate-700 font-semibold">{br.phone || 'غير مسجل'}</span></div>
                              <div>✉️ البريد: <span className="font-mono text-slate-700 font-semibold">{br.email || 'غير مسجل'}</span></div>
                              <div>📍 العنوان: <span className="text-slate-700 font-semibold">{br.address || 'غير مسجل'}</span></div>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Part B: Employee Transfer */}
              <div className="space-y-3.5">
                <h4 className="text-xs font-bold text-slate-700">👤 نقل الموظفين وتعديل فروعهم</h4>
                
                <div className="space-y-2.5 max-h-[450px] overflow-y-auto pr-1">
                  {users.filter(u => !u.id.endsWith('_config')).map(u => {
                    const userBranch = branches.find(b => b.id === (u.branchId || 'branch-1'));
                    return (
                      <div key={u.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs gap-2">
                        <div className="min-w-0 flex-1">
                          <span className="font-bold text-slate-800 block truncate">{u.name}</span>
                          <span className="text-[10px] text-slate-500 font-medium block">
                            الفرع الحالي: <strong className="text-teal-600">{userBranch?.name || 'الفرع الرئيسي'}</strong>
                          </span>
                        </div>

                        <select
                          value={u.branchId || 'branch-1'}
                          onChange={(e) => {
                            const newBranchId = e.target.value;
                            if (newBranchId === (u.branchId || 'branch-1')) return;
                            const targetBranch = branches.find(b => b.id === newBranchId);
                            askConfirmation({
                              title: 'تأكيد نقل الموظف إلى فرع آخر',
                              message: `هل أنت متأكد من نقل الموظف "${u.name}" إلى فرع "${targetBranch?.name || newBranchId}"؟`,
                              detail: `الفرع الحالي: ${userBranch?.name || 'الفرع الرئيسي'} ➔ الفرع الجديد: ${targetBranch?.name || newBranchId}`,
                              confirmLabel: 'تأكيد النقل',
                              cancelLabel: 'إلغاء التراجع',
                              onConfirm: () => {
                                onTransferUser(u.id, newBranchId);
                                toast.success(`تم نقل الموظف "${u.name}" إلى ${targetBranch?.name || ''}`);
                              }
                            });
                          }}
                          className="px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 font-bold focus:outline-hidden focus:ring-1 focus:ring-teal-500 cursor-pointer"
                        >
                          {branches.map(b => (
                            <option key={b.id} value={b.id}>🏢 {b.name}</option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            </fieldset>
          </div>
        )}

        {/* Create new User panel (Conditional on admin permissions) */}
        {isAdmin ? (
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-teal-600" />
              <h3 className="text-sm font-bold text-slate-800">إضافة مستخدم جديد للنظام</h3>
            </div>

            {error && (
              <div className="p-2.5 text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-lg">
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 block">الاسم الكامل للموظف</label>
                <input
                  type="text"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="محمد المعمري"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-teal-500/10 focus:border-teal-500 text-slate-800 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 block">اسم المستخدم</label>
                <input
                  type="text"
                  value={newUserUsername}
                  onChange={(e) => setNewUserUsername(e.target.value)}
                  placeholder="mohammad"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-teal-500/10 focus:border-teal-500 text-slate-800 text-xs font-mono text-left"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 block">كلمة المرور</label>
                <input
                  type="text"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  placeholder="كلمة المرور"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-teal-500/10 focus:border-teal-500 text-slate-800 text-xs font-mono text-left"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 block">صلاحية النظام المبدئية</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-teal-500/10 focus:border-teal-500 text-slate-800 text-xs bg-white"
                >
                  <option value="staff">موظف قياسي</option>
                  <option value="hr">مدير الموارد البشرية (HR)</option>
                  <option value="accountant">محاسب مالي</option>
                  <option value="admin">مدير النظام (كامل الصلاحيات)</option>
                  <option value="external_support_tech">فني دعم خارجي</option>
                  <option value="external_support_admin">إداري دعم خارجي</option>
                  <option value="temp_visitor">زائر مؤقت</option>
                  <option value="trainee">متدرب</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 block">فرع العمل</label>
                <select
                  value={newUserBranchId}
                  onChange={(e) => setNewUserBranchId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-teal-500/10 focus:border-teal-500 text-slate-800 text-xs bg-white font-bold text-slate-700"
                >
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>🏢 {b.name}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-sm"
              >
                تسجيل الموظف
              </button>
            </form>
          </div>
        ) : (
          <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-center gap-2.5 text-xs text-amber-800">
            <Lock className="w-4 h-4 text-amber-600 shrink-0" />
            تعديل أو تسجيل الموظفين وحسابات الصلاحية يقتصر حصراً على مستخدمين ذوي دور <strong>مدير النظام (Administrator)</strong>.
          </div>
        )}
        </>
        )}

        {/* Ticket/HR Settings Section */}
        {isAdmin && (
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-teal-600" />
              <h3 className="text-sm font-bold text-slate-800">إعدادات التذاكر والطلبات الداخلية</h3>
            </div>

            {/* إعدادات قائمة نوع وموضوع الطلب */}
            <div className="space-y-3 pt-1">
              <label className="text-xs font-black text-slate-700 block">تعديل قائمة (نوع وموضوع الطلب):</label>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                يمكنك إضافة خيارات جديدة أو حذف خيارات حالية لتظهر للموظفين عند فتح تذكرة طلب جديدة أو تصفية الطلبات:
              </p>
              
              {/* قائمة الخيارات الحالية */}
              <div className="flex flex-wrap gap-2 py-1">
                {ticketTypes.map((type, idx) => (
                  <div 
                    key={type}
                    draggable={isAdmin}
                    onDragStart={() => handleDragStart(idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDrop={(e) => handleDrop(e, idx)}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center gap-1.5 bg-teal-50 border border-teal-100/80 text-teal-800 text-xs font-bold py-1 px-3 rounded-xl transition-all select-none ${
                      isAdmin ? 'cursor-grab active:cursor-grabbing hover:bg-teal-100/60 hover:border-teal-200 shadow-xs' : ''
                    } ${
                      draggedIndex === idx ? 'opacity-40 scale-95 border-dashed border-teal-400 bg-teal-100/30' : ''
                    }`}
                    title={isAdmin ? "اسحب وأفلت لإعادة ترتيب هذا الموضوع" : ""}
                  >
                    {isAdmin && (
                      <span className="text-teal-400 font-mono text-[10px] select-none mr-0.5">⋮⋮</span>
                    )}
                    <span>{type}</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (ticketTypes.length <= 1) {
                          toast.error("يجب الإبقاء على خيار واحد على الأقل في قائمة المواضيع.");
                          return;
                        }
                        askConfirmation({
                          title: 'تأكيد حذف موضوع الطلب',
                          message: `هل أنت متأكد من رغبتك في حذف موضوع الطلب: "${type}"؟`,
                          detail: 'لن يظهر هذا الخيار بعد الآن عند فتح تذاكر جديدة أو تصفية الطلبات.',
                          confirmLabel: 'نعم، حذف الموضوع',
                          cancelLabel: 'إلغاء التراجع',
                          isDestructive: true,
                          onConfirm: () => {
                            onUpdateTicketTypes(ticketTypes.filter(t => t !== type));
                            toast.success(`تم حذف موضوع الطلب "${type}" بنجاح`);
                          }
                        });
                      }}
                      className="text-teal-500 hover:text-rose-600 font-extrabold mr-1.5 transition-colors hover:bg-rose-50 rounded-full w-4 h-4 flex items-center justify-center text-[10px]"
                      title="حذف هذا الخيار"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              {isAdmin && (
                <p className="text-[10px] text-teal-600 font-semibold flex items-center gap-1">
                  <span>💡</span>
                  <span>يمكنك سحب أي موضوع وإفلاته فوق موضوع آخر بالماوس لإعادة ترتيب القائمة.</span>
                </p>
              )}

              {/* إضافة خيار جديد */}
              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  id="new-ticket-type-input"
                  placeholder="أدخل موضوع/نوع طلب جديد... ثم اضغط إضافة"
                  className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all text-right"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const val = (e.target as HTMLInputElement).value.trim();
                      if (!val) return;
                      if (ticketTypes.includes(val)) {
                        toast.error("هذا النوع/الموضوع موجود بالفعل.");
                        return;
                      }
                      const inputEl = e.target as HTMLInputElement;
                      askConfirmation({
                        title: 'تأكيد إضافة موضوع طلب جديد',
                        message: `هل ترغب في إضافة "${val}" إلى قائمة مواضيع وأنواع الطلبات والتذاكر؟`,
                        detail: 'سيظهر هذا الخيار فوراً للموظفين عند تقديم تذاكر جديدة أو التصفية.',
                        confirmLabel: 'تأكيد وإضافة',
                        cancelLabel: 'إلغاء التراجع',
                        onConfirm: () => {
                          onUpdateTicketTypes([...ticketTypes, val]);
                          inputEl.value = '';
                          toast.success(`تمت إضافة موضوع الطلب "${val}" بنجاح`);
                        }
                      });
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    const inputEl = document.getElementById('new-ticket-type-input') as HTMLInputElement;
                    const val = inputEl?.value.trim();
                    if (!val) {
                      toast.error("يرجى إدخال اسم موضوع الطلب أولاً.");
                      return;
                    }
                    if (ticketTypes.includes(val)) {
                      toast.error("هذا النوع/الموضوع موجود بالفعل.");
                      return;
                    }
                    askConfirmation({
                      title: 'تأكيد إضافة موضوع طلب جديد',
                      message: `هل ترغب في إضافة "${val}" إلى قائمة مواضيع وأنواع الطلبات والتذاكر؟`,
                      detail: 'سيظهر هذا الخيار فوراً للموظفين عند تقديم تذاكر جديدة أو التصفية.',
                      confirmLabel: 'تأكيد وإضافة',
                      cancelLabel: 'إلغاء التراجع',
                      onConfirm: () => {
                        onUpdateTicketTypes([...ticketTypes, val]);
                        if (inputEl) inputEl.value = '';
                        toast.success(`تمت إضافة موضوع الطلب "${val}" بنجاح`);
                      }
                    });
                  }}
                  className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-xs shrink-0 cursor-pointer"
                >
                  إضافة
                </button>
              </div>
            </div>

            <hr className="border-slate-100 my-4" />
            <div className="space-y-3 pt-1">
              <label className="text-xs font-black text-slate-700 block">إدارة التلميحات المخصصة لكل نوع (Placeholder):</label>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                حدد نوع الطلب وأضف نصاً إرشادياً خافتاً يظهر للموظف كـ (Placeholder) لتوجيهه بكيفية صياغة الطلب أو البيانات المطلوبة.
              </p>
              
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap gap-2">
                  {ticketTypes.map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSelectedTicketTypeForPlaceholder(type)}
                      className={`flex items-center gap-1.5 text-xs font-bold py-2 px-3 rounded-xl transition-all cursor-pointer ${
                        selectedTicketTypeForPlaceholder === type
                          ? 'bg-teal-600 text-white shadow-md'
                          : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                {selectedTicketTypeForPlaceholder && (
                  <div className="p-3 border border-slate-100 rounded-xl bg-slate-50 mt-1 space-y-2">
                    <label className="text-xs font-semibold text-slate-600 block">
                      النص الإرشادي لـ "{selectedTicketTypeForPlaceholder}":
                    </label>
                    <textarea
                      placeholder="مثال: يرجى ذكر نوع الإجازة ومدتها ومن تاريخ .. إلى تاريخ .."
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all text-right resize-none h-[80px]"
                      value={placeholderInputText}
                      onChange={(e) => setPlaceholderInputText(e.target.value)}
                    />
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          if (!onUpdateTicketTypePlaceholders) return;
                          askConfirmation({
                            title: 'تأكيد تحديث النص الإرشادي (Placeholder)',
                            message: `هل أنت متأكد من حفظ النص الإرشادي لموضوع "${selectedTicketTypeForPlaceholder}"؟`,
                            detail: placeholderInputText.trim() ? `النص: "${placeholderInputText.trim()}"` : 'سيتم إفراغ النص الإرشادي.',
                            confirmLabel: 'حفظ وتأكيد',
                            cancelLabel: 'إلغاء التراجع',
                            onConfirm: () => {
                              onUpdateTicketTypePlaceholders({
                                ...(ticketTypePlaceholders || {}),
                                [selectedTicketTypeForPlaceholder]: placeholderInputText.trim()
                              });
                              toast.success(`تم حفظ النص الإرشادي لـ "${selectedTicketTypeForPlaceholder}"`);
                            }
                          });
                        }}
                        className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs py-1.5 px-3 rounded-lg transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        حفظ وتأكيد النص الإرشادي
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <hr className="border-slate-100 my-4" />
            <div className="space-y-3 pt-1">
              <label className="text-xs font-black text-slate-700 block">إدارة مدراء الطلبات حسب النوع:</label>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                حدد نوع الطلب لعرض واختيار الموظفين المسموح لهم بإدارة، التعامل، والرد على هذا النوع بالتحديد:
              </p>
              
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap gap-2">
                  {ticketTypes.map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSelectedTicketTypeForManagers(type)}
                      className={`flex items-center gap-1.5 text-xs font-bold py-2 px-3 rounded-xl transition-all cursor-pointer ${
                        selectedTicketTypeForManagers === type
                          ? 'bg-teal-600 text-white shadow-md'
                          : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                {selectedTicketTypeForManagers && (
                  <div className="flex flex-wrap gap-2 p-2 border border-slate-100 rounded-xl bg-slate-50 mt-1">
                    {users.filter(u => !u.id.endsWith('_config')).map(u => {
                      const isManager = ticketManagers[selectedTicketTypeForManagers]?.includes(u.id) || false;
                      return (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => {
                            const actionVerb = isManager ? 'إزالة صفة مدير الطلبات عن' : 'تعيين كمدير لطلبات';
                            askConfirmation({
                              title: isManager ? 'تأكيد إزالة مدير الطلبات' : 'تأكيد تعيين مدير الطلبات',
                              message: `هل أنت متأكد من رغبتك في ${actionVerb} الموظف "${u.name}" لنوع الطلب "${selectedTicketTypeForManagers}"؟`,
                              detail: isManager
                                ? 'لن يتمكن الموظف من إدارة وتغيير حالات هذا النوع من التذاكر بعد الآن.'
                                : 'سيتمكن الموظف من استلام وإدارة وتغيير حالة هذا النوع من التذاكر والرد عليها.',
                              confirmLabel: isManager ? 'إزالة المدير' : 'تأكيد التعيين',
                              cancelLabel: 'إلغاء التراجع',
                              isDestructive: isManager,
                              onConfirm: () => {
                                const currentManagers = ticketManagers[selectedTicketTypeForManagers] || [];
                                let newManagers;
                                if (!isManager) {
                                  newManagers = [...currentManagers, u.id];
                                } else {
                                  newManagers = currentManagers.filter(id => id !== u.id);
                                }
                                onUpdateTicketManagers({
                                  ...ticketManagers,
                                  [selectedTicketTypeForManagers]: newManagers
                                });
                                toast.success(`تم تحديث مدراء نوع الطلب "${selectedTicketTypeForManagers}"`);
                              }
                            });
                          }}
                          className={`flex items-center gap-1.5 text-xs font-bold py-1.5 px-3 rounded-xl transition-all cursor-pointer ${
                            isManager
                              ? 'bg-teal-600 text-white shadow-md'
                              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <span className="truncate max-w-[120px]">{u.name}</span>
                          {isManager && <span className="text-teal-200 font-black">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* Warnings Config Manager */}
        {isAdmin && (
          <WarningsManager
            users={users}
            onUpdateConfig={onUpdateWarningTypes}
            currentUser={currentUser}
          />
        )}

        {/* Custody Config Manager */}
        {isAdmin && onUpdateCustodyCategories && (
          <CustodyManager
            users={users}
            onUpdateConfig={onUpdateCustodyCategories}
            currentUser={currentUser}
          />
        )}

        {/* Services Manager */}
        <ServicesManager 
          services={services} 
          setServices={setServices} 
          canEditServices={currentUser?.permissions?.editServices === true}
          canDeleteServices={currentUser?.permissions?.deleteServices === true}
        />

        {/* General Chat Settings */}
        {isAdmin && (
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-teal-600" />
              <h3 className="text-sm font-bold text-slate-800">إعدادات الشات العام</h3>
            </div>
            
            <p className="text-xs text-slate-500 leading-relaxed text-justify">
              يمكنك إدارة الشات ومسح جميع الرسائل والصور المرفقة التي تم تبادلها بين الموظفين بنقرة واحدة لتنظيف مساحة التخزين وصيانة النظام.
            </p>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleClearAllChat}
                disabled={clearingChat}
                className="flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-all shadow-xs cursor-pointer"
              >
                {clearingChat ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    جاري مسح الرسائل...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 text-white" />
                    مسح جميع رسائل الشات بنجاح
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* User Guides Section */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <BookOpenText className="w-5 h-5 text-teal-600" />
            <h3 className="text-sm font-bold text-slate-800">أدلة المستخدم والنظام</h3>
          </div>
          <p className="text-xs text-slate-500">
            يمكنك تحميل الدليل الشامل للنظام بجميع أقسامه ليكون مرجعاً للموظفين.
          </p>
          <div className="pt-2 space-y-2">
            <button
              onClick={onDownloadGuideWord}
              className="w-full bg-blue-600 text-white p-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md hover:bg-blue-700 transition-colors text-sm"
            >
              <Download className="w-4 h-4" />
              تنزيل الدليل بصيغة .Word
            </button>
            <button
              onClick={onDownloadGuidePdf}
              className="w-full bg-teal-600 text-white p-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md hover:bg-teal-700 transition-colors text-sm"
            >
              <Download className="w-4 h-4" />
              تنزيل الدليل بصيغة .PDF
            </button>
          </div>
        </div>

      </div>

      {/* COLUMN 3: Real-time Activity logs */}
      <div className="lg:col-span-1" id="system-logs-column">
        <div className="bg-slate-900 text-slate-100 rounded-2xl p-5 shadow-md flex flex-col justify-between max-h-[500px]">
          <div className="space-y-3 overflow-hidden flex flex-col h-full">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <History className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="text-sm font-bold text-white">سجل الأنشطة</h3>
                <p className="text-[10px] text-slate-400">توثيق العمليات والإجراءات الفورية</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pl-1 text-[11px] font-sans" id="live-activity-logs-container">
              {logs
                .filter((log) => {
                  const isFullViewer = isAdmin || currentUser?.permissions?.viewActivityLogs;
                  if (!isFullViewer) {
                    return log.username === currentUser?.name || log.username === currentUser?.username;
                  }
                  
                  const isSystemAdmin = log.username === 'مدير النظام' || log.username === 'admin' || log.username?.toLowerCase() === 'admin';
                  if (isSystemAdmin) {
                    return isAdmin;
                  }
                  return true;
                })
                .map((log) => (
                    <div key={log.id} className="p-2.5 bg-slate-800/60 rounded-xl border border-slate-800 space-y-1">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="font-bold text-teal-400">@{log.username}</span>
                        <span className="text-slate-500 font-mono">
                          {new Date(log.timestamp).toLocaleDateString('ar-OM')} {new Date(log.timestamp).toLocaleTimeString('ar-OM', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-slate-200 font-medium leading-relaxed">{log.action}</p>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>

        {/* Universal Settings Confirmation Dialog Modal */}
        {confirmDialog && confirmDialog.isOpen && (
          <div 
            role="dialog" 
            aria-modal="true" 
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
            onClick={() => setConfirmDialog(null)}
          >
            <div 
              className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 p-6 space-y-4 text-right animate-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2.5 rounded-xl shrink-0 ${
                  confirmDialog.isDestructive 
                    ? 'bg-rose-50 text-rose-600 border border-rose-100' 
                    : 'bg-teal-50 text-teal-600 border border-teal-100'
                }`}>
                  {confirmDialog.isDestructive ? (
                    <AlertTriangle className="w-6 h-6" />
                  ) : (
                    <Shield className="w-6 h-6" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-slate-800 leading-snug">
                    {confirmDialog.title}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {confirmDialog.message}
                  </p>
                </div>
              </div>

              {confirmDialog.detail && (
                <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-600 border border-slate-100 font-medium leading-relaxed">
                  {confirmDialog.detail}
                </div>
              )}

              <div className="flex items-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const onConfirmAction = confirmDialog.onConfirm;
                    setConfirmDialog(null);
                    onConfirmAction();
                  }}
                  className={`flex-1 font-bold text-xs py-2.5 px-4 rounded-xl transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5 ${
                    confirmDialog.isDestructive
                      ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200'
                      : 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-200'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{confirmDialog.confirmLabel || 'تأكيد الإجراء'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setConfirmDialog(null)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2.5 px-4 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <XCircle className="w-4 h-4 text-slate-400" />
                  <span>{confirmDialog.cancelLabel || 'تراجع وإلغاء'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
  );
}
