/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import toast from 'react-hot-toast';
import React, { useState, useRef } from 'react';
import { 
  Database, 
  Download, 
  Upload, 
  RefreshCw, 
  Trash2, 
  Edit3, 
  Plus, 
  Search, 
  ShieldAlert, 
  CheckCircle2, 
  FileText, 
  Users, 
  Server, 
  Layers, 
  Clipboard,
  X,
  FileSpreadsheet,
  AlertOctagon,
  Save,
  Check,
  UserCheck,
  Cloud,
  Info,
  AlertTriangle,
  Lock,
  Key,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Customer, Invoice, User, ActivityLog, Service } from '../types';
import { initialCustomers, initialInvoices, initialActivityLogs, initialServices } from '../mockData';
import { exportAllDataExcel, exportToOfflineHTML } from '../utils/exportUtils';
import { backupToDrive } from '../utils/backupToDrive';
import { signIn } from '../lib/cloud';
import { googleSignIn, initAuth, getAccessToken, googleLogout } from '../utils/googleDriveAuth';

interface DatabaseCenterProps {
  customers: Customer[];
  invoices: Invoice[];
  users: User[];
  logs: ActivityLog[];
  services: Service[];
  tickets: any[];
  deletedInvoices: any[];
  warnings?: any[];
  mails?: any[];
  privateMessages?: any[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  setLogs: React.Dispatch<React.SetStateAction<ActivityLog[]>>;
  setServices: React.Dispatch<React.SetStateAction<any[]>>;
  setTickets: React.Dispatch<React.SetStateAction<any[]>>;
  setWarnings?: React.Dispatch<React.SetStateAction<any[]>>;
  setMails?: React.Dispatch<React.SetStateAction<any[]>>;
  setPrivateMessages?: React.Dispatch<React.SetStateAction<any[]>>;
  setDeletedInvoices?: React.Dispatch<React.SetStateAction<any[]>>;
  currentUser: User;
}

type DbTable = 'customers' | 'invoices' | 'users' | 'services' | 'logs' | 'tickets' | 'tickets_config' | 'branches_config';

export default function DatabaseCenter({
  customers,
  invoices,
  users,
  logs,
  services,
  tickets,
  deletedInvoices,
  warnings = [],
  mails = [],
  privateMessages = [],
  setCustomers,
  setInvoices,
  setUsers,
  setLogs,
  setServices,
  setTickets,
  setWarnings,
  setMails,
  setPrivateMessages,
  setDeletedInvoices,
  currentUser
}: DatabaseCenterProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'tables'>('overview');
  const [selectedTable, setSelectedTable] = useState<DbTable>('customers');
  const [searchTerm, setSearchTerm] = useState('');
  
  const localFileInputRef = useRef<HTMLInputElement>(null);
  
  // Backups/Import states
  const [importJson, setImportJson] = useState('');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importStatus, setImportStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  // 2-Step Security Verification States for Reset & Wipe
  const [securityAction, setSecurityAction] = useState<'reset' | 'wipe' | null>(null);
  const [securityStep, setSecurityStep] = useState<1 | 2>(1);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [securityError, setSecurityError] = useState<string | null>(null);

  // Editing state
  const [editingRow, setEditingRow] = useState<{ table: DbTable; id: string; data: any } | null>(null);
  const [editingRawJson, setEditingRawJson] = useState<string>('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [modalMode, setModalMode] = useState<'form' | 'json'>('form');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Success indicator for copy/backup
  const [copiedBackup, setCopiedBackup] = useState(false);
  const [copiedExcel, setCopiedExcel] = useState(false);
  const [copiedHTML, setCopiedHTML] = useState(false);
  
  // Google Drive State
  const [isDriveLoading, setIsDriveLoading] = useState(false);
  const [driveStatus, setDriveStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [isDriveAuthenticated, setIsDriveAuthenticated] = useState(false);
  
  // Google Drive Auto-Backup Config
  const driveConfigUser = users.find(u => u.id === 'drive_backup_config') as any;
  const backupFrequency = driveConfigUser?.backupFrequency || 'manual'; // 'manual', 'daily', 'weekly', 'monthly', 'custom'
  const customDays = driveConfigUser?.customDays || 1;
  const backupCount = driveConfigUser?.backupCount || 0;
  const lastBackupDate = driveConfigUser?.lastBackupDate || null;

  const handleUpdateBackupConfig = (frequency: string, days?: number, count?: number, date?: string | null) => {
    let updatedUsers;
    const newFrequency = frequency;
    const newDays = days !== undefined ? days : customDays;
    const newCount = count !== undefined ? count : backupCount;
    const newDate = date !== undefined ? date : lastBackupDate;

    if (driveConfigUser) {
      updatedUsers = users.map(u => u.id === 'drive_backup_config' ? { ...u, backupFrequency: newFrequency, customDays: newDays, backupCount: newCount, lastBackupDate: newDate } : u);
    } else {
      updatedUsers = [
        ...users,
        {
          id: 'drive_backup_config',
          name: 'إعدادات النسخ الاحتياطي',
          username: 'drive_backup_system',
          role: 'staff' as any,
          isActive: false,
          permissions: {} as any,
          backupFrequency: newFrequency,
          customDays: newDays,
          backupCount: newCount,
          lastBackupDate: newDate
        }
      ];
    }
    setUsers(updatedUsers);
    
    if (frequency !== backupFrequency || days !== customDays) {
        logActivity('تحديث إعدادات النسخ الاحتياطي', `تم تغيير إعدادات النسخ الاحتياطي`);
    }
  };

  React.useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => setIsDriveAuthenticated(true),
      () => setIsDriveAuthenticated(false)
    );
    return () => unsubscribe();
  }, []);

  const handleDriveBackup = async () => {
    setIsDriveLoading(true);
    setDriveStatus(null);
    try {
      if (!isDriveAuthenticated) {
        await googleSignIn();
        setIsDriveAuthenticated(true);
      }
      
      const backupData = {
        version: "3.0",
        exportedAt: new Date().toISOString(),
        exportedBy: currentUser.username,
        customers,
        invoices,
        users,
        logs,
        services,
        tickets,
        warnings,
        mails,
        privateMessages,
        deletedInvoices
      };
      
      await backupToDrive(backupData);
      
      const newCount = (backupCount || 0) + 1;
      const newDate = new Date().toISOString();
      handleUpdateBackupConfig(backupFrequency, customDays, newCount, newDate);

      setDriveStatus({ success: true, message: 'تم أخذ نسخة احتياطية بنجاح على Google Drive.' });
      logActivity('نسخ احتياطي Google Drive', 'تم تحميل ملف النسخ الاحتياطي إلى Google Drive');
    } catch (err: any) {
      console.error(err);
      if (err?.code === 'auth/popup-closed-by-user' || err?.message?.includes('popup-closed-by-user') || err?.code === 'auth/cancelled-popup-request' || err?.message?.includes('cancelled-popup-request')) {
        setDriveStatus({ success: false, message: 'تم إلغاء عملية تسجيل الدخول أو إغلاق النافذة.' });
      } else {
        setDriveStatus({ success: false, message: 'فشل النسخ الاحتياطي: ' + (err.message || 'حدث خطأ غير معروف') });
      }
    } finally {
      setIsDriveLoading(false);
    }
  };

  const logActivity = (action: string, details?: string) => {
    const newLog: ActivityLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      username: currentUser.name,
      action,
      timestamp: new Date().toISOString(),
      details
    };
    setLogs(prev => [newLog, ...prev]);
  };

  // 1. Export Data to JSON File
  const handleExportBackup = () => {
    try {
      const backupData = {
        version: "3.0",
        exportedAt: new Date().toISOString(),
        exportedBy: currentUser.username,
        customers,
        invoices,
        users,
        services,
        logs,
        tickets,
        warnings,
        mails,
        privateMessages,
        deletedInvoices
      };

      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(backupData, null, 2)
      )}`;
      
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', jsonString);
      
      const formattedDate = new Date().toISOString().split('T')[0];
      downloadAnchor.setAttribute('download', `riyadah_full_backup_${formattedDate}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      logActivity('تصدير نسخة احتياطية كاملة', 'تم تحميل ملف النسخة الاحتياطية بصيغة JSON');
      
      setCopiedBackup(true);
      setTimeout(() => setCopiedBackup(false), 3000);
    } catch (err: any) {
      console.error("Export error:", err);
      toast.error("فشل تصدير النسخة الاحتياطية: " + err.message);
    }
  };

  // 1.2 Export All Data to Formatted Excel File
  const handleExportExcel = () => {
    try {
      exportAllDataExcel(invoices, customers, services, users, logs, tickets, warnings, mails, privateMessages, deletedInvoices);
      logActivity('تنزيل كافة البيانات إكسل', 'تم تحميل كافة بيانات النظام في ملف Excel منسق مرتب');
      setCopiedExcel(true);
      setTimeout(() => setCopiedExcel(false), 3000);
    } catch (err: any) {
      console.error("Excel export error:", err);
      toast.error("فشل تنزيل ملف Excel: " + err.message);
    }
  };

  // 1.3 Export All Data to offline interactive HTML App
  const handleExportHTML = () => {
    try {
      exportToOfflineHTML(invoices, customers, services, users, logs);
      logActivity('تنزيل نسخة HTML التفاعلية', 'تم تحميل نسخة ويب مستقلة للطوارئ بصيغة HTML مدمج بها كافة السجلات');
      setCopiedHTML(true);
      setTimeout(() => setCopiedHTML(false), 3000);
    } catch (err: any) {
      console.error("HTML export error:", err);
      toast.error("فشل تنزيل ملف HTML: " + err.message);
    }
  };
  // 2. Import Data from JSON (File or Text)
  const handleImportData = (parsedData: any) => {
    try {
      setValidationError(null);
      
      if (!parsedData || typeof parsedData !== 'object') {
        throw new Error('البيانات المستوردة غير صالحة. يجب أن تكون عبارة عن كائن JSON.');
      }

      const hasCustomers = Array.isArray(parsedData.customers);
      const hasInvoices = Array.isArray(parsedData.invoices);
      const hasUsers = Array.isArray(parsedData.users);
      const hasServices = Array.isArray(parsedData.services);
      const hasLogs = Array.isArray(parsedData.logs);
      const hasTickets = Array.isArray(parsedData.tickets);
      const hasWarnings = Array.isArray(parsedData.warnings);
      const hasMails = Array.isArray(parsedData.mails);
      const hasPrivateMsgs = Array.isArray(parsedData.privateMessages);
      const hasDeletedInvoices = Array.isArray(parsedData.deletedInvoices);

      if (!hasCustomers && !hasInvoices && !hasUsers && !hasServices && !hasLogs) {
        throw new Error('الملف لا يحتوي على أي من الجداول المدعومة (العملاء، الفواتير، الموظفين، الخدمات، السجلات).');
      }

      // Restore elements selectively
      let summaryParts = [];
      if (hasCustomers) {
        setCustomers(parsedData.customers);
        summaryParts.push(`${parsedData.customers.length} عميل`);
      }
      if (hasInvoices) {
        setInvoices(parsedData.invoices);
        summaryParts.push(`${parsedData.invoices.length} فاتورة`);
      }
      if (hasUsers) {
        // Ensure our logged-in user remains active and valid to prevent lockout
        const importedUsers: any[] = parsedData.users;
        const adminExists = importedUsers.some(u => u.username === currentUser.username || u.role === 'admin');
        if (!adminExists) {
          importedUsers.push(currentUser);
        }
        setUsers(importedUsers);
        summaryParts.push(`${importedUsers.length} مستخدم`);
      }
      if (hasServices) {
        setServices(parsedData.services);
        summaryParts.push(`${parsedData.services.length} خدمة مضافة`);
      }
      if (hasLogs) {
        setLogs(parsedData.logs);
        summaryParts.push(`${parsedData.logs.length} سجل عمليات`);
      }
      if (hasTickets) {
        setTickets(parsedData.tickets);
        summaryParts.push(`${parsedData.tickets.length} تذكرة`);
      }
      if (hasWarnings && setWarnings) {
        setWarnings(parsedData.warnings);
      }
      if (hasMails && setMails) {
        setMails(parsedData.mails);
      }
      if (hasPrivateMsgs && setPrivateMessages) {
        setPrivateMessages(parsedData.privateMessages);
      }
      if (hasDeletedInvoices && setDeletedInvoices) {
        setDeletedInvoices(parsedData.deletedInvoices);
      }

      const summaryStr = summaryParts.join('، و ');
      setImportStatus({
        success: true,
        message: `تم استعادة البيانات بنجاح! تم تحميل: ${summaryStr}`
      });
      
      logActivity('استيراد واستعادة قاعدة بيانات', `تم استيراد البيانات بنجاح: ${summaryStr}`);
      setImportJson('');
      setImportFile(null);
    } catch (err: any) {
      setImportStatus({
        success: false,
        message: err.message || "فشل تحليل الملف. يرجى التأكد من صياغة JSON الصحيحة."
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImportFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          handleImportData(parsed);
        } catch (err) {
          setImportStatus({
            success: false,
            message: "فشل قراءة الملف كـ JSON. تأكد من أن الملف سليم."
          });
        }
      };
      reader.readAsText(file);
    }
  };

  const handlePasteImport = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsed = JSON.parse(importJson);
      handleImportData(parsed);
    } catch (err) {
      setImportStatus({
        success: false,
        message: "فشل تحليل النص الملصق. الرجاء التأكد من كتابة كود JSON بشكل سليم ومطابق للمواصفات."
      });
    }
  };

  // 3. Reset to Initial Seed Data
  const handleResetToSeed = () => {
    setCustomers([...initialCustomers]);
    setInvoices([...initialInvoices]);
    // accounts (users) are intentionally preserved
    setServices([...initialServices]);
    setLogs([...initialActivityLogs]);
    setTickets([]);
    if (setWarnings) setWarnings([]);
    if (setMails) setMails([]);
    if (setPrivateMessages) setPrivateMessages([]);
    
    logActivity('إعادة ضبط قاعدة البيانات', 'تم استرجاع بيانات النظام الافتراضية الأولية بالكامل بعد التحقق الأمني الثنائي');
    setImportStatus({
      success: true,
      message: 'تمت إعادة ضبط قاعدة البيانات إلى الحالة الافتراضية بنجاح!'
    });
  };

  // 4. Wipe Database
  const handleWipeDatabase = () => {
    setCustomers([]);
    setInvoices([]);
    setServices([]);
    // Accounts (users + system config rows) are preserved so nobody is locked out
    setLogs([]);
    setTickets([]);
    if (setWarnings) setWarnings([]);
    if (setMails) setMails([]);
    if (setPrivateMessages) setPrivateMessages([]);
    
    logActivity('تصفير قاعدة البيانات', 'تم مسح وتصفير كافة جداول النظام والعملاء والخدمات عدا الحسابات وإعدادات النظام بعد التحقق الأمني الثنائي');
    setImportStatus({
      success: true,
      message: 'تم تصفير كافة السجلات بنجاح مع الاحتفاظ بالحسابات وإعدادات النظام.'
    });
  };

  // 5. Handle Security Step 2 Execution
  const handleSecurityExecute = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSecurityError(null);

    // Re-authenticate against Supabase Auth (no plaintext passwords exist client-side anymore)
    const { error: authErr } = await signIn(currentUser.username, adminPasswordInput.trim());
    if (authErr) {
      setSecurityError('كلمة المرور غير صحيحة! يُرجى إدخال كلمة مرور مدير النظام الصحيحة للمتابعة.');
      return;
    }

    // Password verified! Execute action
    if (securityAction === 'reset') {
      handleResetToSeed();
    } else if (securityAction === 'wipe') {
      handleWipeDatabase();
    }

    // Reset state & close modal
    setSecurityAction(null);
    setSecurityStep(1);
    setAdminPasswordInput('');
    setSecurityError(null);
  };

  // Table row mutations
  const handleDeleteRow = (table: DbTable, id: string) => {
    const confirmation = confirm("هل أنت متأكد من رغبتك في حذف هذا السجل بشكل نهائي ومباشر من قاعدة البيانات؟");
    if (!confirmation) return;

    if (table === 'customers') {
      setCustomers(prev => prev.filter(item => item.id !== id));
      logActivity('حذف سجل عميل من مركز البيانات', `معرف العميل المحذوف: ${id}`);
    } else if (table === 'invoices') {
      setInvoices(prev => prev.filter(item => item.id !== id));
      logActivity('حذف فاتورة مباشرة من مركز البيانات', `معرف الفاتورة المحذوفة: ${id}`);
    } else if (table === 'users') {
      if (id === currentUser.id) {
        toast.error("لا يمكنك حذف حسابك الحالي النشط لمنع قفل النظام!");
        return;
      }
      setUsers(prev => prev.filter(item => item.id !== id));
      logActivity('حذف مستخدم من مركز البيانات', `معرف المستخدم المحذوف: ${id}`);
    } else if (table === 'services') {
      setServices(prev => prev.filter(item => item.id !== id));
      logActivity('حذف خدمة من مركز البيانات', `معرف الخدمة المحذوفة: ${id}`);
    } else if (table === 'logs') {
      setLogs(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleOpenEdit = (table: DbTable, row: any) => {
    setEditingRow({ table, id: row.id, data: { ...row } });
    setEditingRawJson(JSON.stringify(row, null, 2));
    setValidationError(null);
    setShowEditModal(true);
  };

  const handleSaveEdit = () => {
    if (!editingRow) return;
    setValidationError(null);

    try {
      let finalData: any;
      if (modalMode === 'json') {
        finalData = JSON.parse(editingRawJson);
        if (finalData.id !== editingRow.id) {
          throw new Error('لا يمكن تغيير حقل المعرف (id) لضمان اتساق البيانات.');
        }
      } else {
        finalData = editingRow.data;
      }

      // Update state based on table
      if (editingRow.table === 'customers') {
        setCustomers(prev => prev.map(c => c.id === editingRow.id ? finalData : c));
        logActivity('تعديل عميل من قاعدة البيانات', `العميل: ${finalData.name}`);
      } else if (editingRow.table === 'invoices') {
        setInvoices(prev => prev.map(inv => inv.id === editingRow.id ? finalData : inv));
        logActivity('تعديل فاتورة من قاعدة البيانات', `رقم الفاتورة: ${finalData.invoiceNumber}`);
      } else if (editingRow.table === 'users') {
        setUsers(prev => prev.map(u => u.id === editingRow.id ? finalData : u));
        logActivity('تعديل مستخدم من قاعدة البيانات', `المستخدم: ${finalData.name}`);
      } else if (editingRow.table === 'services') {
        setServices(prev => prev.map(s => s.id === editingRow.id ? finalData : s));
        logActivity('تعديل خدمة من قاعدة البيانات', `الخدمة: ${finalData.name}`);
      } else if (editingRow.table === 'logs') {
        setLogs(prev => prev.map(l => l.id === editingRow.id ? finalData : l));
      } else if (editingRow.table === 'tickets') {
        setTickets(prev => prev.map(t => t.id === editingRow.id ? finalData : t));
        logActivity('تعديل تذكرة من قاعدة البيانات', `التذكرة: ${finalData.ticketNumber}`);
      } else if (editingRow.table === 'tickets_config' || editingRow.table === 'branches_config') {
        setUsers(prev => prev.map(u => u.id === editingRow.id ? finalData : u));
        logActivity('تعديل إعدادات من قاعدة البيانات', `الإعداد: ${finalData.id}`);
      }

      setShowEditModal(false);
      setEditingRow(null);
    } catch (err: any) {
      setValidationError(err.message || "خطأ في الصياغة البرمجية، تأكد من إغلاق كافة الأقواس بشكل صحيح.");
    }
  };

  // Filter lists based on search
  const getTableRows = (): any[] => {
    let list: any[] = [];
    if (selectedTable === 'customers') list = customers;
    else if (selectedTable === 'invoices') list = invoices;
    else if (selectedTable === 'users') list = users;
    else if (selectedTable === 'services') list = services;
    else if (selectedTable === 'logs') list = logs;
    else if (selectedTable === 'tickets') list = tickets;
    else if (selectedTable === 'tickets_config') {
      const tc = users.find(u => u.id === 'tickets_config');
      list = tc ? [tc] : [];
    } else if (selectedTable === 'branches_config') {
      const bc = users.find(u => u.id === 'branches_config');
      list = bc ? [bc] : [];
    }

    if (!searchTerm) return list;

    const lower = searchTerm.toLowerCase();
    return list.filter(row => {
      return Object.values(row).some(val => {
        if (!val) return false;
        if (typeof val === 'object') {
          return JSON.stringify(val).toLowerCase().includes(lower);
        }
        return String(val).toLowerCase().includes(lower);
      });
    });
  };

  const currentRows = getTableRows();

  return (
    <div className="space-y-6 text-right" dir="rtl" id="database-backup-center">
      
      {/* Upper Title Panel */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-2 bg-teal-50 text-teal-600 rounded-lg">
              <Database className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-black text-slate-800">مركز إدارة وقواعد البيانات (Database & Backup)</h2>
          </div>
          <p className="text-[11px] text-slate-400 mr-10">التحكم المركزي، النسخ الاحتياطي الكامل، وتصفح وتعديل جداول وسجلات النظام مباشرة بصلاحية الإدارة.</p>
        </div>

        {/* Action Toggle Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold gap-1 shrink-0">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'overview' ? 'bg-white text-teal-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            النسخ الاحتياطي والضبط
          </button>
          <button
            onClick={() => setActiveTab('tables')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'tables' ? 'bg-white text-teal-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            تصفح وتعديل الجداول ({customers.length + invoices.length + services.length + users.length})
          </button>
        </div>
      </div>

      {/* Tabs View logic */}
      {activeTab === 'overview' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Controls Section (Grid span 2) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Real-time DB Row Counts */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <div className="bg-white border border-slate-100 p-4 rounded-xl text-center shadow-3xs space-y-2">
                <Users className="w-5 h-5 mx-auto text-blue-500" />
                <div className="text-xs text-slate-400 font-semibold">العملاء</div>
                <div className="text-xl font-mono font-black text-slate-700">{customers.length}</div>
              </div>

              <div className="bg-white border border-slate-100 p-4 rounded-xl text-center shadow-3xs space-y-2">
                <FileText className="w-5 h-5 mx-auto text-emerald-500" />
                <div className="text-xs text-slate-400 font-semibold">الفواتير</div>
                <div className="text-xl font-mono font-black text-slate-700">{invoices.length}</div>
              </div>

              <div className="bg-white border border-slate-100 p-4 rounded-xl text-center shadow-3xs space-y-2">
                <FileSpreadsheet className="w-5 h-5 mx-auto text-purple-500" />
                <div className="text-xs text-slate-400 font-semibold">الخدمات</div>
                <div className="text-xl font-mono font-black text-slate-700">{services.length}</div>
              </div>

              <div className="bg-white border border-slate-100 p-4 rounded-xl text-center shadow-3xs space-y-2">
                <UserCheck className="w-5 h-5 mx-auto text-amber-500" />
                <div className="text-xs text-slate-400 font-semibold">الموظفين</div>
                <div className="text-xl font-mono font-black text-slate-700">{users.length}</div>
              </div>

              <div className="bg-white border border-slate-100 p-4 rounded-xl text-center shadow-3xs col-span-2 sm:col-span-1 space-y-2">
                <Clipboard className="w-5 h-5 mx-auto text-slate-500" />
                <div className="text-xs text-slate-400 font-semibold">السجلات</div>
                <div className="text-xl font-mono font-black text-slate-700">{logs.length}</div>
              </div>
            </div>

            {/* Core Export/Import Backup Card */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-2xs space-y-6">
              <h3 className="text-xs font-bold text-slate-800 border-b border-slate-50 pb-3 flex items-center gap-2">
                <Download className="w-4 h-4 text-teal-600" />
                تصدير واستيراد النسخ الاحتياطية
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* Export Backup Panel */}
                <div className="bg-slate-50/50 p-5 border border-slate-100 rounded-xl flex flex-col justify-between space-y-4">
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-700">تصدير قاعدة البيانات الحالية</h4>
                    <p className="text-[10px] text-slate-400 leading-relaxed">تحميل ملف نسخ احتياطي مشفر بالكامل بصيغة JSON يحتوي على كافة معلومات العملاء، والفواتير، والخدمات وسجلات الأنشطة لاستعادتها بأي وقت.</p>
                  </div>
                  
                  <button
                    onClick={handleExportBackup}
                    className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all"
                  >
                    {copiedBackup ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                    {copiedBackup ? "تم التصدير بنجاح!" : "تصدير نسخة كاملة (.json)"}
                  </button>
                </div>

                {/* Export Excel Panel */}
                <div className="bg-emerald-50/30 p-5 border border-emerald-100 rounded-xl flex flex-col justify-between space-y-4">
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      تنزيل كافة البيانات إكسل (Excel)
                    </h4>
                    <p className="text-[10px] text-slate-400 leading-relaxed">تنزيل نسخة من كافة بيانات النظام (العملاء، الفواتير، الخدمات، الموظفين، وسجلات العمليات) مرتبة في جداول منسقة بملف Excel واحد.</p>
                  </div>
                  
                  <button
                    onClick={handleExportExcel}
                    className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all animate-none"
                  >
                    {copiedExcel ? <Check className="w-4 h-4" /> : <FileSpreadsheet className="w-4 h-4" />}
                    {copiedExcel ? "تم تصدير ملف Excel بنجاح!" : "تنزيل البيانات (.xls)"}
                  </button>
                </div>

                {/* Export HTML Offline App Panel */}
                <div className="bg-teal-50/40 p-5 border border-teal-100 rounded-xl flex flex-col justify-between space-y-4">
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-teal-800 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-teal-600" />
                      تحميل نسخة ويب HTML للطوارئ
                    </h4>
                    <p className="text-[10px] text-slate-400 leading-relaxed">تحميل ملف HTML مستقل تفاعلي متكامل يحتوي على كامل الفواتير والسجلات والعملاء والبحث السريع والطباعة لتعمل بالكامل دون إنترنت.</p>
                  </div>
                  
                  <button
                    onClick={handleExportHTML}
                    className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all"
                  >
                    {copiedHTML ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                    {copiedHTML ? "تم تنزيل نسخة HTML!" : "تنزيل نسخة HTML للتشغيل"}
                  </button>
                </div>

                {/* Google Drive Backup Panel */}
                <div className="bg-blue-50/40 p-5 border border-blue-100 rounded-xl flex flex-col justify-between space-y-4">
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-blue-800 flex items-center gap-1.5">
                      <Cloud className="w-4 h-4 text-blue-600" />
                      النسخ الاحتياطي على Google Drive
                    </h4>
                    <p className="text-[10px] text-slate-400 leading-relaxed">حفظ نسخة كاملة من النظام بشكل آمن على حساب Google Drive الخاص بك.</p>
                  </div>
                  
                  {driveStatus && (
                    <div className={`p-2 rounded-lg text-[10px] font-bold text-center ${driveStatus.success ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                      {driveStatus.message}
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-700 block">دورية النسخ الاحتياطي التلقائي:</label>
                    <select
                      value={backupFrequency}
                      onChange={(e) => handleUpdateBackupConfig(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="manual">يدوي فقط (لا يوجد نسخ تلقائي)</option>
                      <option value="daily">يومياً (تلقائي)</option>
                      <option value="weekly">أسبوعياً (تلقائي)</option>
                      <option value="monthly">شهرياً (تلقائي)</option>
                      <option value="custom">حسب اليوم المحدد (تلقائي)</option>
                    </select>

                    {backupFrequency === 'custom' && (
                      <div className="mt-2">
                        <label className="text-[10px] font-bold text-slate-600 block mb-1">عدد الأيام للنسخ التلقائي:</label>
                        <input
                          type="number"
                          min="1"
                          value={customDays || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            handleUpdateBackupConfig(backupFrequency, val === '' ? 0 : parseInt(val));
                          }}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="أدخل عدد الأيام..."
                        />
                      </div>
                    )}
                  </div>

                  {(backupCount > 0) && (
                    <div className="text-[10px] text-slate-500 bg-white p-2 rounded-lg border border-slate-100 flex flex-col gap-1 mt-2">
                      <div className="flex justify-between">
                        <span>إجمالي مرات النسخ:</span>
                        <span className="font-bold text-slate-700">{backupCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>تاريخ آخر نسخة:</span>
                        <span className="font-bold text-slate-700">{lastBackupDate ? new Date(lastBackupDate).toLocaleString('ar-OM') : 'غير متوفر'}</span>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleDriveBackup}
                    disabled={isDriveLoading}
                    className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all disabled:opacity-50"
                  >
                    {isDriveLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Cloud className="w-4 h-4" />
                    )}
                    {isDriveLoading ? "جاري النسخ..." : (isDriveAuthenticated ? "أخذ نسخة احتياطية الآن" : "تسجيل الدخول والنسخ")}
                  </button>
                </div>

                {/* Import via File Selector */}
                <div className="bg-slate-50/50 p-5 border border-slate-100 rounded-xl flex flex-col justify-between space-y-4">
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-700">استعادة من ملف نسخ احتياطي</h4>
                    <p className="text-[10px] text-slate-400 leading-relaxed">اختر ملف .json تم تصديره سابقاً من هذا النظام ليتم قراءته وإعادة بناء قاعدة البيانات محلياً وسحابياً فوراً.</p>
                  </div>

                  <div className="relative">
                    <input
                      type="file"
                      id="backup-file-upload"
                      accept=".json"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="backup-file-upload"
                      className="w-full py-3 px-4 bg-white border border-dashed border-slate-200 hover:border-teal-500 hover:bg-teal-50/20 text-slate-600 text-xs font-bold flex items-center justify-center gap-2 rounded-xl cursor-pointer transition-all"
                    >
                      <Upload className="w-4 h-4 text-slate-400" />
                      اختر ملف النسخ الاحتياطي (.json)
                    </label>
                  </div>
                </div>

              </div>

              {/* Import status notification */}
              {importStatus && (
                <div className={`p-4 rounded-xl text-xs flex items-start gap-3 border ${
                  importStatus.success 
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-100' 
                    : 'bg-rose-50 text-rose-800 border-rose-100'
                }`}>
                  {importStatus.success ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" /> : <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />}
                  <div>
                    <span className="font-bold block mb-0.5">{importStatus.success ? "نجحت العملية" : "فشل استيراد البيانات"}</span>
                    <span>{importStatus.message}</span>
                  </div>
                </div>
              )}

              {/* Paste JSON text directly fallback */}
              <form onSubmit={handlePasteImport} className="space-y-3 pt-4 border-t border-slate-50">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">استيراد عبر كود JSON المباشر</label>
                  <p className="text-[10px] text-slate-400">إذا كان لديك نص النسخ الاحتياطي، يمكنك لصقه في الحقل أدناه وضغط زر الاستعادة.</p>
                </div>
                <textarea
                  value={importJson}
                  onChange={(e) => setImportJson(e.target.value)}
                  placeholder='{ "customers": [...], "invoices": [...] }'
                  className="w-full h-24 p-3 bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-teal-500/10 focus:border-teal-500 rounded-xl text-xs font-mono text-left"
                  dir="ltr"
                />
                <button
                  type="submit"
                  disabled={!importJson.trim()}
                  className="py-2.5 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold cursor-pointer disabled:bg-slate-100 disabled:text-slate-400 flex items-center gap-1.5 transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  استعادة البيانات من النص الملصق
                </button>
              </form>
            </div>

            {/* local database backup and restore card */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-2xs space-y-5">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-800">النسخ الاحتياطي وإدارة البيانات المحلية</h3>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed text-justify">
                يتم تخزين بيانات هذا البرنامج حالياً بشكل آمن على متصفحك المحلي. لضمان عدم فقدان فواتير وعملاء مكتبك، يمكنك تصدير قاعدة البيانات كملف وإعادة استيرادها في أي وقت، أو تشغيلها على جهازك دون اتصال بالإنترنت.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Export database button */}
                <button
                  type="button"
                  onClick={handleExportBackup}
                  className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-3 px-4 rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  تصدير قاعدة البيانات الحالية لملف
                </button>

                {/* Import database button */}
                <div className="relative">
                  <input
                    type="file"
                    ref={localFileInputRef}
                    onChange={handleFileChange}
                    accept=".json"
                    className="hidden"
                    id="local-database-file-upload"
                  />
                  <button
                    type="button"
                    onClick={() => localFileInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-3 px-4 rounded-xl transition-all border border-slate-200 cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    استيراد البيانات من ملف نسخ احتياطي
                  </button>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                  <Info className="w-4 h-4 text-blue-500 shrink-0" />
                  <span>دليل تشغيل البرنامج وتخزينه محلياً على جهاز الكمبيوتر الخاص بك</span>
                </div>
                <ol className="text-[11px] text-slate-500 space-y-2 list-decimal list-inside pr-1 leading-relaxed text-justify">
                  <li>
                    <strong>تنزيل الكود المصدري:</strong> من القائمة العلوية في صفحة المطور (AI Studio)، اضغط على زر الإعدادات (Settings) في الأعلى أو خيارات المشروع واختر <strong>Export to GitHub</strong> أو خيار التصدير لتنزيل نسخة كاملة من كود البرنامج كملف ZIP لجهازك.
                  </li>
                  <li>
                    <strong>تثبيت المتطلبات:</strong> قم بفك ضغط الملف على جهازك، وافتح سطر الأوامر (Terminal) في ذلك المجلد، ثم قم بتشغيل الأمر:
                    <code className="block bg-slate-200 text-slate-700 font-mono py-1 px-2.5 rounded-lg text-[10px] mt-1 text-left" dir="ltr">npm install</code>
                  </li>
                  <li>
                    <strong>بدء تشغيل النظام:</strong> لتشغيل النظام في بيئة محلية مستقلة على جهازك، استخدم الأمر التالي:
                    <code className="block bg-slate-200 text-slate-700 font-mono py-1 px-2.5 rounded-lg text-[10px] mt-1 text-left" dir="ltr">npm run dev</code>
                  </li>
                  <li>
                    <strong>الحفظ الذاتي:</strong> سيعمل البرنامج مباشرة في المتصفح على جهازك ويحفظ البيانات بأمان على جهازك. يمكنك استخدام خياري التصدير والاستيراد أعلاه لنقل بياناتك بين المتصفحات والأجهزة بسهولة تامة!
                  </li>
                </ol>
              </div>
            </div>
          </div>

          {/* Database Maintenance and Warning Panel (Col span 1) */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-2xs space-y-5">
              <h3 className="text-xs font-bold text-slate-800 border-b border-slate-50 pb-3 flex items-center gap-2 text-rose-600">
                <AlertOctagon className="w-4 h-4 text-rose-500" />
                المنطقة الحساسة والضبط
              </h3>

              <div className="space-y-4">
                {/* Reset to Seed */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-700">إعادة تعيين البيانات للوضع الافتراضي</h4>
                  <p className="text-[10px] text-slate-400 leading-relaxed">تقوم هذه العملية بمسح كافة التغييرات وإعادة تغذية قاعدة البيانات ببيانات الفواتير والعملاء الافتراضية الأولية المدمجة بالنظام.</p>
                  
                  <button
                    onClick={() => {
                      setSecurityAction('reset');
                      setSecurityStep(1);
                      setAdminPasswordInput('');
                      setSecurityError(null);
                    }}
                    className="w-full py-2.5 px-4 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    إعادة تغذية البيانات الافتراضية
                  </button>
                </div>

                {/* Wipe Clean */}
                <div className="space-y-2 pt-4 border-t border-slate-50">
                  <h4 className="text-xs font-bold text-rose-700">تصفير ومسح قاعدة البيانات بالكامل</h4>
                  <p className="text-[10px] text-slate-400 leading-relaxed">حذف كافة البيانات نهائياً وتصفير العدادات تمهيداً لبدء العمل الفعلي على النظام من الصفر. يتم الإبقاء فقط على حساب الإدارة الحالي.</p>
                  
                  <button
                    onClick={() => {
                      setSecurityAction('wipe');
                      setSecurityStep(1);
                      setAdminPasswordInput('');
                      setSecurityError(null);
                    }}
                    className="w-full py-2.5 px-4 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    مسح وتصفير قاعدة البيانات
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      ) : (
        /* Tables Browsing and Direct Row Mutation View */
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-2xs space-y-5">
          
          {/* Table Selectors and Search header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-50 pb-4">
            
            {/* Table buttons */}
            <div className="flex flex-wrap gap-2 text-xs font-bold">
              <button
                onClick={() => { setSelectedTable('customers'); setSearchTerm(''); }}
                className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
                  selectedTable === 'customers' ? 'bg-teal-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                العملاء ({customers.length})
              </button>
              <button
                onClick={() => { setSelectedTable('invoices'); setSearchTerm(''); }}
                className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
                  selectedTable === 'invoices' ? 'bg-teal-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                الفواتير ({invoices.length})
              </button>
              <button
                onClick={() => { setSelectedTable('services'); setSearchTerm(''); }}
                className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
                  selectedTable === 'services' ? 'bg-teal-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                الخدمات ({services.length})
              </button>
              <button
                onClick={() => { setSelectedTable('users'); setSearchTerm(''); }}
                className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
                  selectedTable === 'users' ? 'bg-teal-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                الموظفين ({users.length})
              </button>
              <button
                onClick={() => { setSelectedTable('tickets'); setSearchTerm(''); }}
                className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
                  selectedTable === 'tickets' ? 'bg-teal-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                طلبات الدعم ({tickets.length})
              </button>
              <button
                onClick={() => { setSelectedTable('tickets_config'); setSearchTerm(''); }}
                className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
                  selectedTable === 'tickets_config' ? 'bg-teal-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                إعدادات التذاكر
              </button>
              <button
                onClick={() => { setSelectedTable('branches_config'); setSearchTerm(''); }}
                className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
                  selectedTable === 'branches_config' ? 'bg-teal-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                إدارة الفروع
              </button>
              <button
                onClick={() => { setSelectedTable('logs'); setSearchTerm(''); }}
                className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
                  selectedTable === 'logs' ? 'bg-teal-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                سجلات العمليات ({logs.length})
              </button>
            </div>

            {/* Quick Search */}
            <div className="relative w-full md:w-72">
              <input
                type="text"
                placeholder="بحث في صفوف الجدول المحدد..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-2.5 pl-9 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/10 focus:border-teal-500 focus:bg-white transition-all text-right"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          {/* Table Render */}
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-100 text-slate-600 font-bold">
                  <th className="p-3.5 resize-x overflow-auto">الرقم/المعرف</th>
                  {selectedTable === 'customers' && (
                    <>
                      <th className="p-3.5 resize-x overflow-auto">اسم العميل</th>
                      <th className="p-3.5 resize-x overflow-auto">النوع</th>
                      <th className="p-3.5 font-mono resize-x overflow-auto">الهاتف</th>
                      <th className="p-3.5 resize-x overflow-auto">رقم السجل/المدني</th>
                      <th className="p-3.5 resize-x overflow-auto">الحالة</th>
                    </>
                  )}
                  {selectedTable === 'invoices' && (
                    <>
                      <th className="p-3.5 resize-x overflow-auto">رقم الفاتورة</th>
                      <th className="p-3.5 resize-x overflow-auto">المبلغ الإجمالي</th>
                      <th className="p-3.5 resize-x overflow-auto">المقدم المدفوع</th>
                      <th className="p-3.5 resize-x overflow-auto">المتبقي</th>
                      <th className="p-3.5 resize-x overflow-auto">الحالة</th>
                      <th className="p-3.5 resize-x overflow-auto">بواسطة</th>
                    </>
                  )}
                  {selectedTable === 'services' && (
                    <>
                      <th className="p-3.5 resize-x overflow-auto">اسم الخدمة</th>
                      <th className="p-3.5 resize-x overflow-auto">السعر الافتراضي</th>
                    </>
                  )}
                  {selectedTable === 'users' && (
                    <>
                      <th className="p-3.5 resize-x overflow-auto">الاسم الكامل</th>
                      <th className="p-3.5 resize-x overflow-auto">اسم المستخدم</th>
                      <th className="p-3.5 resize-x overflow-auto">الدور</th>
                      <th className="p-3.5 resize-x overflow-auto">حالة الحساب</th>
                    </>
                  )}
                  {selectedTable === 'logs' && (
                    <>
                      <th className="p-3.5 resize-x overflow-auto">الموظف</th>
                      <th className="p-3.5 resize-x overflow-auto">العملية</th>
                      <th className="p-3.5 resize-x overflow-auto">التفاصيل</th>
                      <th className="p-3.5 font-mono resize-x overflow-auto">التاريخ والوقت</th>
                    </>
                  )}
                  {selectedTable === 'tickets' && (
                    <>
                      <th className="p-3.5 resize-x overflow-auto">رقم التذكرة</th>
                      <th className="p-3.5 resize-x overflow-auto">العنوان</th>
                      <th className="p-3.5 resize-x overflow-auto">حالة التذكرة</th>
                      <th className="p-3.5 resize-x overflow-auto">الموظف</th>
                    </>
                  )}
                  {selectedTable === 'tickets_config' && (
                    <>
                      <th className="p-3.5 resize-x overflow-auto">الأنواع</th>
                      <th className="p-3.5 resize-x overflow-auto">المدراء</th>
                    </>
                  )}
                  {selectedTable === 'branches_config' && (
                    <>
                      <th className="p-3.5 resize-x overflow-auto">الفروع</th>
                    </>
                  )}
                  <th className="p-3.5 text-center resize-x overflow-auto">التحكم المباشر</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {currentRows.length > 0 ? (
                  currentRows.map((row, index) => (
                    <tr key={row.id || index} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3.5 font-mono text-slate-400 select-all max-w-[120px] truncate" title={row.id}>
                        {row.id}
                      </td>
                      
                      {/* Customer Custom Columns */}
                      {selectedTable === 'customers' && (
                        <>
                          <td className="p-3.5 font-bold text-slate-800">{row.name}</td>
                          <td className="p-3.5">
                            <span className="px-2 py-0.5 rounded-md text-[10px] bg-slate-100 text-slate-600 font-semibold">
                              {row.type === 'individual' ? 'فرد' : 'منشأة'}
                            </span>
                          </td>
                          <td className="p-3.5 font-mono">{row.phone}</td>
                          <td className="p-3.5 font-mono text-slate-500">{row.civilId || row.registrationNumber || '-'}</td>
                          <td className="p-3.5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              row.status === 'active' ? 'bg-emerald-50 text-emerald-600' :
                              row.status === 'late' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500'
                            }`}>
                              {row.status === 'active' ? 'نشط' : row.status === 'late' ? 'متأخر' : 'مغلق'}
                            </span>
                          </td>
                        </>
                      )}

                      {/* Invoice Custom Columns */}
                      {selectedTable === 'invoices' && (
                        <>
                          <td className="p-3.5 font-bold text-teal-700 font-mono select-all">{row.invoiceNumber}</td>
                          <td className="p-3.5 font-mono text-slate-800 font-bold">{row.totalAmount} ر.ع.</td>
                          <td className="p-3.5 font-mono text-emerald-600">{row.downPayment} ر.ع.</td>
                          <td className="p-3.5 font-mono text-amber-600">{row.remainingAmount} ر.ع.</td>
                          <td className="p-3.5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              row.status === 'paid' ? 'bg-emerald-50 text-emerald-600' :
                              row.status === 'partially_paid' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                            }`}>
                              {row.status === 'paid' ? 'مدفوعة كاملة' : row.status === 'partially_paid' ? 'مدفوعة جزئياً' : 'غير مدفوعة'}
                            </span>
                          </td>
                          <td className="p-3.5 text-slate-500">{row.lastModifiedBy || row.createdBy}</td>
                        </>
                      )}

                      {/* Service Custom Columns */}
                      {selectedTable === 'services' && (
                        <>
                          <td className="p-3.5 font-bold text-slate-800">{row.name}</td>
                          <td className="p-3.5 font-mono font-bold text-slate-600">{row.defaultPrice} ر.ع.</td>
                        </>
                      )}

                      {/* User Custom Columns */}
                      {selectedTable === 'users' && (
                        <>
                          <td className="p-3.5 font-bold text-slate-800">{row.name}</td>
                          <td className="p-3.5 font-mono text-slate-500">{row.username}</td>
                          <td className="p-3.5">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              row.role === 'admin' ? 'bg-amber-50 text-amber-600 border border-amber-200/50' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {row.role === 'admin' ? 'مدير النظام' : 'موظف'}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${row.isActive ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 bg-slate-50'}`}>
                              {row.isActive ? 'نشط' : 'معطل'}
                            </span>
                          </td>
                        </>
                      )}

                      {/* Log Custom Columns */}
                      {selectedTable === 'logs' && (
                        <>
                          <td className="p-3.5 font-bold text-slate-700">{row.username}</td>
                          <td className="p-3.5 text-teal-700 font-bold">{row.action}</td>
                          <td className="p-3.5 text-slate-500 max-w-[200px] truncate" title={row.details}>{row.details || '-'}</td>
                          <td className="p-3.5 font-mono text-slate-400 text-[10px]">
                            {new Date(row.timestamp).toLocaleString('ar-OM', { hour12: true })}
                          </td>
                        </>
                      )}
                      
                      {/* Tickets Custom Columns */}
                      {selectedTable === 'tickets' && (
                        <>
                          <td className="p-3.5 font-bold text-slate-800">{row.ticketNumber}</td>
                          <td className="p-3.5 text-slate-600 truncate max-w-[150px]">{row.title}</td>
                          <td className="p-3.5">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              row.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                            }`}>
                              {row.status === 'completed' ? 'مكتملة' : 'قيد المعالجة'}
                            </span>
                          </td>
                          <td className="p-3.5 text-slate-500">{row.employeeName}</td>
                        </>
                      )}

                      {selectedTable === 'tickets_config' && (
                        <>
                          <td className="p-3.5 text-slate-500 max-w-[150px] truncate">{JSON.stringify(row.ticketTypes)}</td>
                          <td className="p-3.5 text-slate-500 max-w-[150px] truncate">{JSON.stringify(row.ticketManagers)}</td>
                        </>
                      )}

                      {selectedTable === 'branches_config' && (
                        <>
                          <td className="p-3.5 text-slate-500 max-w-[300px] truncate">{JSON.stringify(row.branches)}</td>
                        </>
                      )}

                      {/* Actions */}
                      <td className="p-3.5">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => handleOpenEdit(selectedTable, row)}
                            className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                            title="تعديل السجل"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteRow(selectedTable, row.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="حذف السجل"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={10} className="p-12 text-center text-slate-400 italic">
                      🔍 لم يتم العثور على أي نتائج تطابق البحث المكتوب في هذا الجدول.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Row Edit Modal */}
      <AnimatePresence>
        {showEditModal && editingRow && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-2xl overflow-hidden text-right flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="p-5 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-slate-800">
                    تعديل مباشر على جدول ({
                      editingRow.table === 'customers' ? 'العملاء' :
                      editingRow.table === 'invoices' ? 'الفواتير' :
                      editingRow.table === 'services' ? 'الخدمات' :
                      editingRow.table === 'users' ? 'الموظفين' :
                      editingRow.table === 'tickets' ? 'الدعم الإداري' :
                      editingRow.table === 'tickets_config' ? 'إعدادات الدعم' :
                      editingRow.table === 'branches_config' ? 'إعدادات الفروع' :
                      'سجل العمليات'
                    })
                  </h4>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {editingRow.id}</p>
                </div>

                {/* Mode Selector */}
                <div className="flex gap-1 bg-slate-200 p-0.5 rounded-lg text-[10px] font-bold">
                  <button
                    onClick={() => setModalMode('form')}
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                      modalMode === 'form' ? 'bg-white text-teal-700' : 'text-slate-500'
                    }`}
                  >
                    نموذج تفاعلي
                  </button>
                  <button
                    onClick={() => setModalMode('json')}
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                      modalMode === 'json' ? 'bg-white text-teal-700' : 'text-slate-500'
                    }`}
                  >
                    تعديل JSON مباشر
                  </button>
                </div>
              </div>

              {/* Form Body wrapper */}
              <div className="p-6 overflow-y-auto space-y-4 flex-1">
                {validationError && (
                  <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-xl font-medium">
                    🚨 {validationError}
                  </div>
                )}

                {modalMode === 'form' ? (
                  /* Reactive Interactive Form based on schema */
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.keys(editingRow.data).map((key) => {
                      if (key === 'id') return null; // Readonly id
                      const val = editingRow.data[key];

                      // We render inputs based on types dynamically
                      if (typeof val === 'object' && val !== null) {
                        return (
                          <div key={key} className="col-span-2 space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 block">{key} (JSON)</label>
                            <textarea
                              value={JSON.stringify(val, null, 2)}
                              onChange={(e) => {
                                try {
                                  const parsed = JSON.parse(e.target.value);
                                  setEditingRow(prev => prev ? {
                                    ...prev,
                                    data: { ...prev.data, [key]: parsed }
                                  } : null);
                                  setValidationError(null);
                                } catch (err) {
                                  setValidationError(`الصيغة المدخلة في حقل ${key} غير صالحة لـ JSON.`);
                                }
                              }}
                              className="w-full h-20 p-2 border border-slate-200 rounded-lg text-[10px] font-mono text-left"
                              dir="ltr"
                            />
                          </div>
                        );
                      }

                      return (
                        <div key={key} className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 block">{key}</label>
                          {typeof val === 'boolean' ? (
                            <select
                              value={val ? 'true' : 'false'}
                              onChange={(e) => setEditingRow(prev => prev ? {
                                ...prev,
                                data: { ...prev.data, [key]: e.target.value === 'true' }
                              } : null)}
                              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                            >
                              <option value="true">نعم / نشط (True)</option>
                              <option value="false">لا / معطل (False)</option>
                            </select>
                          ) : (
                            <input
                              type="text"
                              value={val !== undefined && val !== null ? String(val) : ''}
                              onChange={(e) => {
                                const rawVal = e.target.value;
                                // Cast to number if it was number
                                const castedVal = typeof val === 'number' ? (Number(rawVal) || 0) : rawVal;
                                setEditingRow(prev => prev ? {
                                  ...prev,
                                  data: { ...prev.data, [key]: castedVal }
                                } : null);
                              }}
                              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-right"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* JSON Editor Mode */
                  <div className="space-y-2">
                    <p className="text-[10px] text-slate-400">يمكنك تعديل كائن الصف كاملاً ككود JSON. تأكد من إبقاء حقل id ثابتاً.</p>
                    <textarea
                      value={editingRawJson}
                      onChange={(e) => setEditingRawJson(e.target.value)}
                      className="w-full h-80 p-3 border border-slate-200 rounded-xl font-mono text-xs text-left"
                      dir="ltr"
                    />
                  </div>
                )}
              </div>

              {/* Footer Buttons */}
              <div className="p-4 border-t border-slate-50 bg-slate-50/50 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <Save className="w-4 h-4" />
                  حفظ وتطبيق التغييرات
                </button>
                <button
                  type="button"
                  onClick={() => { setShowEditModal(false); setEditingRow(null); }}
                  className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2-Step Security Verification Modal (إجراءات الأمان الثنائية) */}
      <AnimatePresence>
        {securityAction !== null && (
          <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs z-50 flex items-center justify-center p-4" dir="rtl">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden"
            >
              {/* Modal Header */}
              <div className={`p-6 border-b flex items-start justify-between ${
                securityAction === 'wipe' ? 'bg-rose-50/80 border-rose-100' : 'bg-amber-50/80 border-amber-100'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-2xl ${
                    securityAction === 'wipe' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {securityStep === 1 ? (
                      <AlertTriangle className="w-6 h-6" />
                    ) : (
                      <ShieldCheck className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full inline-block mb-1 ${
                      securityStep === 1 
                        ? (securityAction === 'wipe' ? 'bg-rose-200 text-rose-900' : 'bg-amber-200 text-amber-900')
                        : 'bg-teal-100 text-teal-800'
                    }`}>
                      الخطوة {securityStep} من 2: {securityStep === 1 ? 'تأكيد التحذير' : 'التحقق من كلمة المرور'}
                    </span>
                    <h3 className="text-base font-black text-slate-800">
                      {securityAction === 'wipe' 
                        ? (securityStep === 1 ? 'تحذير أمني: مسح وتصفير قاعدة البيانات' : 'تأكيد الصلاحية والمسح النهائي')
                        : (securityStep === 1 ? 'تحذير أمني: إعادة تغذية البيانات الافتراضية' : 'تأكيد الصلاحية وإعادة الضبط')
                      }
                    </h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSecurityAction(null);
                    setSecurityStep(1);
                    setAdminPasswordInput('');
                    setSecurityError(null);
                  }}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white/80 rounded-xl transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-5">
                {securityStep === 1 ? (
                  /* Step 1: Danger Warning Modal */
                  <div className="space-y-4">
                    <div className={`p-4 rounded-2xl border ${
                      securityAction === 'wipe'
                        ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                        : 'bg-amber-50/70 border-amber-200 text-amber-900'
                    }`}>
                      <p className="text-xs font-bold leading-relaxed">
                        {securityAction === 'wipe' 
                          ? '🚨 تحذير أمني خطير جداً: سيؤدي هذا الإجراء لمسح وتصفير كافة بيانات الفواتير والعملاء والخدمات والعمليات نهائياً ولا يمكن التراجع عنه مطلقاً!'
                          : '⚠️ تحذير أمني: سيؤدي هذا الإجراء لمسح كافة البيانات والتعديلات الحالية واستبدالها ببيانات العرض الافتراضية الأولية، ولا يمكن التراجع عنه.'
                        }
                      </p>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                      لحماية بيانات النظام الحساسة ومنع تنفيذ عمليات الحذف بالخطأ، يتوجب عليك الانتقال للخطوة التالية وإدخال كلمة مرور مدير النظام لتأكيد هويتك وصلاحيتك.
                    </p>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setSecurityAction(null);
                          setSecurityStep(1);
                        }}
                        className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        إلغاء الإجراء
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSecurityStep(2);
                          setSecurityError(null);
                        }}
                        className={`px-5 py-2.5 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer ${
                          securityAction === 'wipe'
                            ? 'bg-rose-600 hover:bg-rose-700'
                            : 'bg-amber-600 hover:bg-amber-700'
                        }`}
                      >
                        موافق، الانتقال لخطوة إدخال كلمة المرور
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Step 2: System Admin Password Verification */
                  <form onSubmit={handleSecurityExecute} className="space-y-4">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/70 space-y-2">
                      <div className="flex items-center gap-2 text-slate-800 text-xs font-bold">
                        <Lock className="w-4 h-4 text-teal-600 shrink-0" />
                        <span>التحقق من كلمة مرور مدير النظام (`{currentUser.username || 'admin'}`)</span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        يُرجى إدخال كلمة المرور الخاصة بحساب مدير النظام للتحقق من هويتك وتأكيد تنفيذ عملية {securityAction === 'wipe' ? 'تصفير ومسح قاعدة البيانات' : 'إعادة تغذية البيانات الافتراضية'}.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 block">
                        كلمة مرور مدير النظام <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={adminPasswordInput}
                          onChange={(e) => setAdminPasswordInput(e.target.value)}
                          placeholder="أدخل كلمة مرور مدير النظام..."
                          autoFocus
                          className="w-full pl-10 pr-10 py-3 bg-white border border-slate-300 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10 rounded-xl text-xs font-mono"
                        />
                        <Key className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {securityError && (
                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-800 flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>{securityError}</span>
                      </div>
                    )}

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setSecurityStep(1);
                          setAdminPasswordInput('');
                          setSecurityError(null);
                        }}
                        className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        الرجوع للخطوة الأولى
                      </button>
                      <button
                        type="submit"
                        disabled={!adminPasswordInput.trim()}
                        className={`px-5 py-2.5 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                          securityAction === 'wipe'
                            ? 'bg-rose-600 hover:bg-rose-700'
                            : 'bg-amber-600 hover:bg-amber-700'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        تأكيد وتنفيذ {securityAction === 'wipe' ? 'المسح النهائي' : 'إعادة الضبط'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
