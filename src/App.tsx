import NetworkGuard from './components/NetworkGuard';

import { AutoBackupManager } from './components/AutoBackupManager';
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SearchableCombobox } from './components/SearchableCombobox';
import { CustomerSearchableCombobox } from './components/CustomerSearchableCombobox';
import { SearchableMultiSelectDropdown } from './components/SearchableMultiSelectDropdown';
import React, {  useState, useEffect, useRef , useMemo } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { Customer, Invoice, User, ActivityLog, CustomerStatus, UserRole, InvoiceStatus, DeletedInvoice, Ticket, Warning, MailMessage, PrivateMessage } from './types';
import { 
  initialCustomers, 
  initialInvoices, 
  initialActivityLogs,
  initialServices
} from './mockData';

// Component Imports
import Logo from './components/Logo';
import InvoiceModal from './components/InvoiceModal';
import CustomerModal from './components/CustomerModal';
import InvoicePrint from './components/InvoicePrint';
import CustomersSection from './components/CustomersSection';
import AccountsClosingSection from './components/AccountsClosingSection';
import Reports from './components/Reports';
import Dashboard from './components/Dashboard';
import SettingsSection from './components/SettingsSection';
import OperationsLogSection from './components/OperationsLogSection';
import AboutSection from './components/AboutSection';
import ChangePasswordModal from './components/ChangePasswordModal';
import { supabase } from './lib/supabase';
import { loadAll, syncAll, newSnapshot, emptyData, signIn, signOut, fetchMyAppUserId, adminUsers } from './lib/cloud';
import ChatBox from './components/ChatBox';
import DatabaseCenter from './components/DatabaseCenter';
import TrashSection from './components/TrashSection';
import UserGuideSection from './components/UserGuideSection';
import TicketsSection from './components/TicketsSection';
import ProfileSection from './components/ProfileSection';
import ChatMailSection from './components/ChatMailSection';
import { motion } from 'motion/react';
import { directPrintInvoice } from './utils/printUtils';
import { exportInvoicesToExcel } from './utils/exportUtils';
// No longer importing Firestore, database sync is migrated to Express API and Cloud SQL PostgreSQL

import { 
  BookOpen,
  FileText, 
  MessageSquare,
  Users, 
  Lock, 
  TrendingUp, 
  Settings, 
  HelpCircle, 
  LogOut, 
  Plus, 
  Search, 
  Printer, 
  Eye,
  Edit2, 
  Trash2, 
  UserCheck, 
  Calendar,
  Layers,
  FileCheck,
  AlertTriangle, ChevronDown,
  KeyRound,
  LayoutDashboard,
  Menu,
  X,
  Database,
  RotateCcw,
  Briefcase,
  Building,
  FileSpreadsheet,
  ClipboardList,
  ShieldAlert,
  User as UserIcon
} from 'lucide-react';

// Play a clean pleasant Web Audio chime for notifications
const playNotificationSound = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const audioCtx = new AudioContextClass();
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
    osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1); // A5
    
    gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.35);
  } catch (e) {
    // AudioContext might be blocked before first user interaction, ignore safely
  }
};

export default function App() {
  const [isDbLoaded, setIsDbLoaded] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  useEffect(() => {
    if (maintenanceMode) {
      const style = document.createElement('style');
      style.innerHTML = `
        .maintenance-lock input,
        .maintenance-lock textarea,
        .maintenance-lock select {
          pointer-events: none !important;
          opacity: 0.6 !important;
          background-color: #f1f5f9 !important;
          cursor: not-allowed !important;
        }
        
        .maintenance-lock form button,
        .maintenance-lock button[class*="bg-teal-600"],
        .maintenance-lock button[class*="bg-rose-600"],
        .maintenance-lock button[class*="bg-emerald-600"],
        .maintenance-lock button[class*="bg-blue-600"],
        .maintenance-lock button[class*="bg-indigo-600"],
        .maintenance-lock button[class*="bg-red-600"],
        .maintenance-lock button[class*="text-rose-600"] {
          pointer-events: none !important;
          opacity: 0.5 !important;
          cursor: not-allowed !important;
        }
      `;
      document.head.appendChild(style);
      return () => { document.head.removeChild(style); }
    }
  }, [maintenanceMode]);


  // --- Persistent Database State ---
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [services, setServices] = useState<any[]>(initialServices);
  const [deletedInvoices, setDeletedInvoices] = useState<DeletedInvoice[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [mails, setMails] = useState<MailMessage[]>([]);
  const [privateMessages, setPrivateMessages] = useState<PrivateMessage[]>([]);

  // --- Session State ---
  const [currentUserId, setCurrentUserId] = useState<string | null>(null); // Set only after a valid Supabase session is verified

  const [simulationOriginalUserId, setSimulationOriginalUserId] = useState<string | null>(() => {
    return sessionStorage.getItem('riyadah_v3_simulation_original_user_id') || null;
  });

  const simulationOriginalUser = users.find(u => u.id === simulationOriginalUserId);

  const currentUser = users.find(u => u.id === currentUserId) || (currentUserId === 'guest' ? {
    id: 'guest',
    username: 'guest',
    password: '',
    name: 'زائر',
    role: 'temp_visitor',
    permissions: {
      viewDashboard: false,
      manageInvoices: false,
      addInvoice: false,
      editInvoice: false,
      deleteInvoice: false,
      manageCustomers: false,
      manageUsers: false,
      manageSettings: false,
      manageServices: false,
      exportData: false,
      accessDatabase: false,
      viewActivityLogs: false,
      viewReports: false,
      viewClosing: false,
      manageTickets: false,
    },
    isActive: true,
    branchId: 'branch-1'
  } as any as User : null);

  // --- System Settings ---
  const systemSettingsUser = users.find(u => u.id === 'system_settings_config');
  const systemSettings = {
    idleHours: 0,
    enableNewInvoice: true,
    enableNewTicket: true,
    enableNewWarning: true,
    enableNewCustomer: true,
    enableCloseAccounts: true,
    requireCustomerPhone: true,
    requireCustomerCivilId: true,
    lateInvoicePeriod: '1_month' as const,
    enableLateInvoiceAlert: true,
    companyName: 'مركز سند الريادة للخدمات',
    companyNameEn: 'AL-RIYADAH SAND SERVICES',
    companyCrNumber: '1342890',
    companyLogo: '',
    companyPhone: '97994259',
    companyEmail: 'sanad.oman.r3@gmail.com',
    companyAddress: 'سلطنة عُمان - إبراء',
    companySubtitle: 'شركائك في نجاح أعمالك .. كل الخدمات في مكان واحد',
    ...(systemSettingsUser?.systemSettings || {})
  };

  useEffect(() => {
    if (systemSettings.companyName) {
      document.title = systemSettings.companyName;
    }
  }, [systemSettings.companyName]);

  const isInvoiceLate = (inv: Invoice) => {
    if (inv.status !== 'unpaid' && inv.status !== 'partially_paid') return false;
    const created = new Date(inv.createdAt);
    const now = new Date();
    const diffDays = Math.ceil((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    let lateDays = 30;
    switch(systemSettings.lateInvoicePeriod) {
       case '1_week': lateDays = 7; break;
       case '2_weeks': lateDays = 14; break;
       case '3_weeks': lateDays = 21; break;
       case '1_month': lateDays = 30; break;
       case '2_months': lateDays = 60; break;
       case '3_months': lateDays = 90; break;
    }
    return diffDays > lateDays;
  };

  const [showLateInvoicesAlert, setShowLateInvoicesAlert] = useState(false);
  const [lateInvoicesCountForUser, setLateInvoicesCountForUser] = useState(0);

  useEffect(() => {
    if (systemSettings.enableLateInvoiceAlert !== false && currentUser && currentUserId && currentUserId !== 'guest') {
      const lateInvs = invoices.filter(inv => 
        (inv.createdBy === currentUser.name || inv.lastModifiedBy === currentUser.name) &&
        isInvoiceLate(inv)
      );
      if (lateInvs.length > 0) {
        setLateInvoicesCountForUser(lateInvs.length);
        const hasShown = sessionStorage.getItem(`shownLateAlert_${currentUserId}`);
        if (!hasShown) {
          setShowLateInvoicesAlert(true);
          sessionStorage.setItem(`shownLateAlert_${currentUserId}`, 'true');
        }
      }
    }
  }, [currentUser, invoices, currentUserId, systemSettings.enableLateInvoiceAlert, systemSettings.lateInvoicePeriod]);

  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');


  const [dashboardMonth, setDashboardMonth] = useState<string>('current');
  const [dashboardYear, setDashboardYear] = useState<string>('current');
  const [adminSelectedBranchId, setAdminSelectedBranchId] = useState<string>(() => {
    return localStorage.getItem('riyadah_v3_admin_branch_id') || 'all';
  });

  useEffect(() => {
    localStorage.setItem('riyadah_v3_admin_branch_id', adminSelectedBranchId);
  }, [adminSelectedBranchId]);

  // --- Layout State ---
  const [activeSection, setActiveSection] = useState<'dashboard' | 'invoices' | 'customers' | 'closing' | 'reports' | 'settings' | 'about' | 'database' | 'trash' | 'guide' | 'profile'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // --- Invoice Search & Filter State ---
  const [invoiceSearchValues, setInvoiceSearchValues] = useState<string[]>([]);
  const searchOptions = useMemo(() => Array.from(new Set([...invoices.map(i => i.invoiceNumber), ...customers.map(c => c.name)])).filter(Boolean) as string[], [invoices, customers]);




  const getBackupData = () => ({
    version: "3.0",
    exportedAt: new Date().toISOString(),
    exportedBy: currentUser?.name || 'النظام',
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
  });
  

  const [invoiceFilterStatus, setInvoiceFilterStatus] = useState<'all' | InvoiceStatus | 'late'>('all');
  const [invoiceFilterPaymentMethod, setInvoiceFilterPaymentMethod] = useState<'all' | 'cash' | 'pos' | 'transfer'>('all');
  const [invoiceFilterNumber, setInvoiceFilterNumber] = useState('all');
  const [invoiceFilterCustomer, setInvoiceFilterCustomer] = useState('all');
  const [invoiceFilterModifiedBy, setInvoiceFilterModifiedBy] = useState('all');
  const [invoiceFilterCreatedBy, setInvoiceFilterCreatedBy] = useState<string[]>([]);
  const [invoiceFilterBranch, setInvoiceFilterBranch] = useState('all');
  const [invoiceFilterStartDate, setInvoiceFilterStartDate] = useState('');
  const [invoiceFilterOriginalDocs, setInvoiceFilterOriginalDocs] = useState<'all' | 'received' | 'not_received'>('all');
  const [invoiceFilterEndDate, setInvoiceFilterEndDate] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [invoiceSubView, setInvoiceSubView] = useState<'invoices' | 'instantAmounts'>('invoices');
  const [itemsSortConfig, setItemsSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  const handleItemsSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (itemsSortConfig && itemsSortConfig.key === key && itemsSortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setItemsSortConfig({ key, direction });
  };

  // --- Modals State ---
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [dayInvoicesModalDate, setDayInvoicesModalDate] = useState<{year: number, month: number, day: number} | null>(null);
  const [invoiceToEdit, setInvoiceToEdit] = useState<Invoice | null>(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);

  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [invoiceToPrint, setInvoiceToPrint] = useState<Invoice | null>(null);

  const [passwordModalTargetId, setPasswordModalTargetId] = useState<string | null>(null);
  
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<{ id: string, number: string } | null>(null);

  const [chatMode, setChatMode] = useState<'docked' | 'floating' | 'hidden'>(() => {
  
      const getBackupData = () => ({
    version: "3.0",
    exportedAt: new Date().toISOString(),
    exportedBy: currentUser?.name || 'النظام',
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
  });
  return (localStorage.getItem('general_chat_mode') as 'docked' | 'floating' | 'hidden') || 'hidden';
  });
  const [chatWidth, setChatWidth] = useState(() => Number(localStorage.getItem('riyadah_chat_width')) || 320);

  const handleChatModeChange = (mode: 'docked' | 'floating' | 'hidden') => {
    setChatMode(mode);
    localStorage.setItem('general_chat_mode', mode);
  };

  // --- System Settings ---


  // --- Auto Logout ---
  useEffect(() => {
    if (!currentUserId || systemSettings.idleHours === 0) return;

    let timeoutId: any;
    const resetTimer = () => {
      clearTimeout(timeoutId);
      const timeoutMs = systemSettings.idleHours * 60 * 60 * 1000;
      timeoutId = setTimeout(() => {
        signOut();
      }, timeoutMs);
    };

    resetTimer();
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => window.addEventListener(event, resetTimer, { passive: true }));

  
      const getBackupData = () => ({
    version: "3.0",
    exportedAt: new Date().toISOString(),
    exportedBy: currentUser?.name || 'النظام',
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
  });
  return () => {
      clearTimeout(timeoutId);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [currentUserId, systemSettings.idleHours]);

  const loadedSuccessfullyRef = useRef(false);


  // ---------------- Supabase: session, load, sync ----------------
  const snapshotRef = useRef(newSnapshot());
  const syncChainRef = useRef<Promise<any>>(Promise.resolve());

  const applyLoadedData = (data: ReturnType<typeof emptyData>) => {
    setCustomers(data.customers);
    setInvoices(data.invoices);
    setUsers(data.users);
    setLogs(data.logs);
    setServices(data.services.length > 0 ? data.services : initialServices);
    setDeletedInvoices(data.deletedInvoices);
    setTickets(data.tickets);
    setWarnings(data.warnings);
    setMails(data.mails);
    setPrivateMessages(data.privateMessages);
  };

  /** Load data for the signed-in Supabase user and return the app-level user id (or null). */
  const bootstrapSession = async (): Promise<string | null> => {
    try {
      const myId = await fetchMyAppUserId();
      if (!myId) return null; // no session, or inactive / unlinked account
      const data = await loadAll(snapshotRef.current);
      applyLoadedData(data);
      loadedSuccessfullyRef.current = true;
      setMaintenanceMode(false);
      setIsDbLoaded(true);
      return myId;
    } catch (error) {
      console.error('Failed to load data from Supabase', error);
      setMaintenanceMode(true);
      setIsDbLoaded(true);
      return null;
    }
  };

  // Restore an existing session on page load
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        const myId = await bootstrapSession();
        if (myId) setCurrentUserId(myId);
        else await signOut();
      }
      setAuthChecked(true);
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        loadedSuccessfullyRef.current = false;
        snapshotRef.current = newSnapshot();
        setCurrentUserId(null);
        setIsDbLoaded(false);
        applyLoadedData(emptyData());
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Push local changes to Supabase (row-level diff, debounced)
  useEffect(() => {
    if (!isDbLoaded || !loadedSuccessfullyRef.current || !currentUserId) return;
    const timeoutId = setTimeout(() => {
      syncChainRef.current = syncChainRef.current.then(async () => {
        if (!loadedSuccessfullyRef.current) return;
        try {
          const res = await syncAll(
            { customers, invoices, users, logs, services, deletedInvoices, tickets, warnings, mails, privateMessages },
            snapshotRef.current,
            { branchOf: getInvoiceBranchId, isAdmin: currentUser?.role === 'admin' },
          );
          if (res.errors.length) console.warn('Supabase sync warnings:', res.errors);
          if (res.networkError) toast.error('تعذّر الاتصال بالخادم، سيُعاد حفظ التعديلات تلقائياً.');
        } catch (err) {
          console.error('❌ Supabase sync failed:', err);
        }
      });
    }, 1500);
    return () => clearTimeout(timeoutId);
  }, [customers, invoices, users, logs, services, deletedInvoices, tickets, warnings, mails, privateMessages, isDbLoaded, currentUserId]);

  const migrationRunRef = useRef(false);
  useEffect(() => {
    if (!isDbLoaded || migrationRunRef.current) return;
    migrationRunRef.current = true;

    const branchConfigUser = users.find(u => u.id === 'branches_config');
    const initialDefaultBranches = [
      { id: 'branch-1', name: 'الفرع الرئيسي', createdAt: new Date().toISOString() },
      { id: 'branch-2', name: 'فرع الصناعية - R3', createdAt: new Date().toISOString() },
      { id: 'branch-3', name: 'فرع صلالة', createdAt: new Date().toISOString() }
    ];
    const currentBranches = [...(branchConfigUser?.branches || initialDefaultBranches)];

    let targetBranch = currentBranches.find(b => b.name === 'فرع الصناعية - R3' || b.name === '(فرع الصناعية - R3)');
    let targetId = targetBranch?.id;

    if (!targetBranch) {
      const branch2Index = currentBranches.findIndex(b => b.id === 'branch-2');
      if (branch2Index !== -1) {
        currentBranches[branch2Index] = { ...currentBranches[branch2Index], name: 'فرع الصناعية - R3' };
        targetId = 'branch-2';
      } else {
        targetId = 'branch-industrial-r3';
        currentBranches.push({
          id: targetId,
          name: 'فرع الصناعية - R3',
          createdAt: new Date().toISOString()
        });
      }

      const exists = users.some(u => u.id === 'branches_config');
      let updatedUsers;
      if (exists) {
        updatedUsers = users.map(u => u.id === 'branches_config' ? { ...u, branches: currentBranches } : u);
      } else {
        updatedUsers = [
          ...users,
          {
            id: 'branches_config',
            name: 'إعدادات الفروع',
            username: 'branches_config_system',
            role: 'staff' as any,
            isActive: false,
            permissions: {} as any,
            branches: currentBranches
          }
        ];
      }
      setUsers(updatedUsers);
    }

    if (targetId) {
      // 2. Specific Customers Migration
      const targetCustomerNames: string[] = []; // one-off legacy migration removed (no personal names in source)

      const customersToMigrate = customers.filter(c => 
        targetCustomerNames.includes(c.name.trim()) && (c.branchId || 'branch-1') !== targetId
      );

      if (customersToMigrate.length > 0) {
        const updatedCustomers = customers.map(c => {
          if (targetCustomerNames.includes(c.name.trim())) {
            return {
              ...c,
              branchId: targetId
            };
          }
          return c;
        });
        setCustomers(updatedCustomers);

        const newLog = {
          id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          username: 'النظام',
          action: `نظامي: تم نقل العملاء (${customersToMigrate.map(c => c.name).join('، ')}) إلى فرع "فرع الصناعية - R3" تلقائياً`,
          timestamp: new Date().toISOString()
        };
        setLogs(prev => [newLog, ...prev]);
        console.log(`✅ Migrated ${customersToMigrate.length} customers to branch R3 (${targetId})`);
      }
    }
  }, [isDbLoaded, customers, invoices]);

  useEffect(() => {
    if (currentUserId) {
      localStorage.setItem('riyadah_v3_current_user_id', currentUserId);
    } else {
      localStorage.removeItem('riyadah_v3_current_user_id');
    }
  }, [currentUserId]);


  // Unread counts tracking & sound alerts for incoming chats & mails
  const unreadMailsCount = currentUser
    ? (mails || []).filter(m => m.receiverId === currentUser.id && !m.isRead).length
    : 0;

  const unreadPrivateMessagesCount = currentUser
    ? (privateMessages || []).filter(m => m.receiverId === currentUser.id && !m.isRead).length
    : 0;

  const unreadChatMailNotifications = unreadMailsCount + unreadPrivateMessagesCount;

  const prevUnreadChatMailRef = useRef<number>(0);
  const isInitialChatMailLoadRef = useRef(true);

  useEffect(() => {
    if (!isDbLoaded || !currentUser) return;
    
    if (isInitialChatMailLoadRef.current) {
      isInitialChatMailLoadRef.current = false;
      prevUnreadChatMailRef.current = unreadChatMailNotifications;
      return;
    }

    if (unreadChatMailNotifications > prevUnreadChatMailRef.current) {
      playNotificationSound();
      toast.custom(
        (t) => (
          <div
            className={`${
              t.visible ? 'animate-enter' : 'animate-leave'
            } max-w-md w-full bg-white shadow-xl rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 border border-indigo-100 p-3.5 items-center gap-3 cursor-pointer`}
            onClick={() => {
              setActiveSection('chat-mail');
              toast.dismiss(t.id);
            }}
          >
            <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 shadow-xs">
              <MessageSquare className="w-5 h-5 animate-bounce" />
            </div>
            <div className="flex-1 text-right">
              <p className="text-xs font-bold text-slate-800">
                لديك رسالة / بريد جديد غير مقروء!
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                انقر هنا للانتقال إلى قسم البريد والدردشة
              </p>
            </div>
            <span className="px-2.5 py-1 bg-indigo-600 text-white text-[10px] font-bold rounded-lg shrink-0 shadow-xs">
              فتح
            </span>
          </div>
        ),
        { duration: 4500, position: 'top-center' }
      );
    }
    prevUnreadChatMailRef.current = unreadChatMailNotifications;
  }, [unreadChatMailNotifications, isDbLoaded, currentUser]);

  const getInvoiceBranchId = (inv: Invoice): string => {
    const creatorName = inv.createdBy || '';
    if (creatorName) {
      const creatorUser = users.find(u => 
        u.name?.trim().toLowerCase() === creatorName.trim().toLowerCase() || 
        u.username?.trim().toLowerCase() === creatorName.trim().toLowerCase()
      );
      if (creatorUser?.branchId) {
        return creatorUser.branchId;
      }
    }
    return inv.branchId || 'branch-1';
  };

  const isolatedInvoices = currentUser?.role === 'admin'
    ? (adminSelectedBranchId === 'all' ? invoices : invoices.filter(inv => getInvoiceBranchId(inv) === adminSelectedBranchId))
    : invoices.filter(inv => getInvoiceBranchId(inv) === (currentUser?.branchId || 'branch-1'));

  // جميع العملاء لجميع الفروع مشتركة وتظهر مع الجميع وممكن تظهر لكل الفروع
  const isolatedCustomers = customers;


  const dashboardAvailableYears = useMemo(() => {
    const years = new Set<string>();
    isolatedInvoices.forEach(inv => {
      const d = new Date(inv.createdAt);
      if (!isNaN(d.getTime())) {
        years.add(String(d.getFullYear()));
      }
    });
    return Array.from(years).sort().reverse();
  }, [isolatedInvoices]);

  const dashboardFilteredInvoices = useMemo(() => {
    const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
    const currentYear = String(new Date().getFullYear());
    const targetMonth = dashboardMonth === 'current' ? currentMonth : dashboardMonth;
    const targetYear = dashboardYear === 'current' ? currentYear : dashboardYear;
    return isolatedInvoices.filter(inv => {
      const d = new Date(inv.createdAt);
      if (isNaN(d.getTime())) return false;
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const y = String(d.getFullYear());
      
      if (targetYear !== 'all' && y !== targetYear) return false;
      if (targetMonth !== 'all' && m !== targetMonth) return false;
      return true;
    });
  }, [isolatedInvoices, dashboardMonth, dashboardYear]);

  const dashboardFilteredTickets = useMemo(() => {
    const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
    const currentYear = String(new Date().getFullYear());
    const targetMonth = dashboardMonth === 'current' ? currentMonth : dashboardMonth;
    const targetYear = dashboardYear === 'current' ? currentYear : dashboardYear;
    return tickets.filter(t => {
      const d = new Date(t.createdAt);
      if (isNaN(d.getTime())) return false;
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const y = String(d.getFullYear());
      
      if (targetYear !== 'all' && y !== targetYear) return false;
      if (targetMonth !== 'all' && m !== targetMonth) return false;
      return true;
    });
  }, [tickets, dashboardMonth, dashboardYear]);


    const isolatedLogs = currentUser?.role === 'admin'
    ? (adminSelectedBranchId === 'all' ? logs : logs.filter(l => {
        const logUser = users.find(u => u.username === l.username || u.name === l.username);
        return (l.branchId || logUser?.branchId || 'branch-1') === adminSelectedBranchId;
      }))
    : logs.filter(l => {
        // Hide administrator activity logs from non-admin users
        const isAdminLog = l.username === 'مدير النظام' || l.username === 'admin' || l.username?.toLowerCase() === 'admin';
        if (isAdminLog) {
          return false;
        }
        
        // ONLY show the current user's logs
        return l.username === currentUser?.username || l.username === currentUser?.name;
      });

  // --- Browser Notifications Logic ---
  const notifiedMessageIds = useRef(new Set<string>());
  const initializedNotifications = useRef(false);

  useEffect(() => {
    if ('Notification' in window && currentUserId && currentUserId !== 'guest') {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, [currentUserId]);

  useEffect(() => {
    if (!isDbLoaded || !currentUser) return;

    if (!initializedNotifications.current) {
       mails.forEach(m => notifiedMessageIds.current.add(m.id));
       privateMessages.forEach(m => notifiedMessageIds.current.add(m.id));
       initializedNotifications.current = true;
       return;
    }
    
    const newMails = mails.filter(m => m.receiverId === currentUser.id && !m.read && !notifiedMessageIds.current.has(m.id));
    newMails.forEach(m => {
      notifiedMessageIds.current.add(m.id);
      if ('Notification' in window && Notification.permission === 'granted') {
        const sender = users.find(u => u.id === m.senderId)?.name || 'النظام';
        new Notification(`بريد داخلي جديد من ${sender}`, {
          body: m.subject || 'بدون عنوان',
        });
      }
    });

    const newMsgs = privateMessages.filter(m => 
      (m.receiverId === currentUser.id || m.receiverId === 'all') && 
      m.senderId !== currentUser.id && 
      !notifiedMessageIds.current.has(m.id)
    );
    newMsgs.forEach(m => {
      notifiedMessageIds.current.add(m.id);
      if ('Notification' in window && Notification.permission === 'granted') {
        const sender = users.find(u => u.id === m.senderId)?.name || 'مجهول';
        new Notification(`رسالة دردشة من ${sender}`, {
          body: m.content.substring(0, 50) + (m.content.length > 50 ? '...' : ''),
        });
      }
    });
  }, [mails, privateMessages, currentUser, isDbLoaded, users]);

  const lateInvoicesNotificationCount = useMemo(() => {
    if (!currentUser || systemSettings.enableLateInvoiceAlert === false) return 0;
    if (currentUser.role === 'admin' || currentUser.permissions?.viewReports) {
      return isolatedInvoices.filter(isInvoiceLate).length;
    }
    return isolatedInvoices.filter(inv => 
      (inv.createdBy === currentUser.name || inv.lastModifiedBy === currentUser.name) &&
      isInvoiceLate(inv)
    ).length;
  }, [currentUser, isolatedInvoices, systemSettings.enableLateInvoiceAlert, systemSettings.lateInvoicePeriod]);

  const handleViewLateInvoices = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setActiveSection('invoices');
    setIsSidebarOpen(false);
    setInvoiceSearchValues([]);
    setInvoiceFilterStatus('late');
    setInvoiceFilterPaymentMethod('all');
    setInvoiceFilterBranch('all');
    setInvoiceFilterNumber('all');
    setInvoiceFilterCustomer('all');
    setInvoiceFilterCreatedBy(
      currentUser?.role === 'admin' || currentUser?.permissions?.viewReports
        ? []
        : [currentUser?.name || '']
    );
    setInvoiceFilterModifiedBy('all');
    setInvoiceFilterOriginalDocs('all');
    setInvoiceFilterStartDate('');
    setInvoiceFilterEndDate('');
    toast.success('تمت تصفية الجدول لعرض الفواتير المتأخرة فقط');
  };

  // --- Core Utility Handlers ---
  
  const logActivity = (action: string, skipForAdmin: boolean = false) => {
    if (skipForAdmin && currentUser?.role === 'admin') {
      return;
    }
    const username = currentUser?.name || 'زائر مجهول';
    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      username,
      action,
      timestamp: new Date().toISOString()
    };
    setLogs(prev => [newLog, ...prev]);
  };

  const handleLogin = (userId: string) => {
    setCurrentUserId(userId);
    const loggedUser = users.find(u => u.id === userId);
    if (loggedUser) {
      const logMsg = `تم تسجيل الدخول للنظام بنجاح`;
      const newLog: ActivityLog = {
        id: `log-${Date.now()}`,
        username: loggedUser.name,
        action: logMsg,
        timestamp: new Date().toISOString()
      };
      setLogs(prev => [newLog, ...prev]);
    }
  };

  const handleStartSimulation = (targetUserId: string) => {
    if (!simulationOriginalUserId && currentUserId) {
      sessionStorage.setItem('riyadah_v3_simulation_original_user_id', currentUserId);
      setSimulationOriginalUserId(currentUserId);
    }
    setCurrentUserId(targetUserId);
  };

  const handleExitSimulation = () => {
    if (simulationOriginalUserId) {
      const origUser = users.find(u => u.id === simulationOriginalUserId);
      setCurrentUserId(simulationOriginalUserId);
      sessionStorage.removeItem('riyadah_v3_simulation_original_user_id');
      setSimulationOriginalUserId(null);
      toast.success(origUser ? `تم إنهاء وضع المحاكاة والعودة إلى حسابك: ${origUser.name}` : 'تم العودة إلى الوضع الطبيعي بنجاح');
    }
  };

  const handleLogout = () => {
    if (currentUser) {
      logActivity('تسجيل الخروج من النظام');
    }
    sessionStorage.removeItem('riyadah_v3_simulation_original_user_id');
    setSimulationOriginalUserId(null);
    signOut(); // onAuthStateChange clears the in-memory data
  };

  // --- Invoice Handlers ---

  const handleSaveInvoice = (savedInvoice: Invoice) => {
    const exists = invoices.some(inv => inv.id === savedInvoice.id);
    let updatedInvoices;

    // تحديد فرع الفاتورة بناءً على الموظف منشئ الفاتورة لضمان فرز الفواتير بناءً على الموظفين
    const creatorName = savedInvoice.createdBy || currentUser?.name || '';
    const creatorUser = users.find(u => 
      u.name?.trim().toLowerCase() === creatorName.trim().toLowerCase() || 
      u.username?.trim().toLowerCase() === creatorName.trim().toLowerCase()
    );
    const invoiceBranchId = creatorUser?.branchId || currentUser?.branchId || 'branch-1';

    const invoiceWithBranch: Invoice = {
      ...savedInvoice,
      branchId: invoiceBranchId
    };

    if (exists) {
      updatedInvoices = invoices.map(inv => inv.id === savedInvoice.id ? invoiceWithBranch : inv);
      logActivity(`تحديث الفاتورة رقم ${savedInvoice.invoiceNumber}`, true);
    } else {
      updatedInvoices = [invoiceWithBranch, ...invoices];
      logActivity(`إصدار فاتورة جديدة رقم ${savedInvoice.invoiceNumber}`);
    }

    setInvoices(updatedInvoices);
    toast.success("تم حفظ الفاتورة بنجاح");

    // Dynamic customer health update: if customer has outstanding debt, set status to 'late', else 'active'
    const customerId = savedInvoice.customerId;
    const customerInvoices = updatedInvoices.filter(inv => inv.customerId === customerId && inv.status !== 'draft');
    const remainingDebt = customerInvoices.reduce((sum, inv) => sum + inv.remainingAmount, 0);
    
    setCustomers(prev => prev.map(c => {
      if (c.id === customerId && c.status !== 'closed') {
        return {
          ...c,
          status: remainingDebt > 0 ? 'late' : 'active'
        };
      }
      return c;
    }));
  };

  const requestDeleteInvoice = (invoiceId: string, invoiceNum: string) => {
    if (!currentUser?.permissions.deleteInvoice) {
      toast.error('عذراً، لا تمتلك الصلاحية الكافية لحذف الفواتير.');
      return;
    }
    const inv = invoices.find(i => i.id === invoiceId);
    if (inv) {
      const isAdmin = currentUser.role === 'admin';
      const isCreator = inv.createdBy ? inv.createdBy === currentUser.name : (inv.lastModifiedBy ? inv.lastModifiedBy === currentUser.name : true);
      const isFullyPaid = inv.totalAmount > 0 && inv.remainingAmount <= 0;

      if (!isAdmin) {
        if (!isCreator) {
          toast.error('عذراً، لا يمكنك حذف هذه الفاتورة لأنها أُنشئت بواسطة مستخدم آخر. يحق لك فقط حذف الفواتير التي قمت بإنشائها بنفسك.');
          return;
        }
        if (isFullyPaid) {
          toast.error('هذه الفاتورة مدفوعة بالكامل ومغلقة تماماً للتعديل أو الحذف من قبل جميع المستخدمين بما فيهم المنشئ. يحق فقط لمدير النظام حذفها أو فتح تعديلها.');
          return;
        }
        if (inv.isLocked && !isCreator) {
          toast.error('هذه الفاتورة مغلقة للتعديل/الحذف. يحق فقط لمنشئ الفاتورة أو لمدير النظام حذفها.');
          return;
        }
      }
    }
    setInvoiceToDelete({ id: invoiceId, number: invoiceNum });
    setIsDeleteConfirmOpen(true);
  };

  const handleRestoreInvoice = (deletedId: string) => {
    if (currentUser?.role !== 'admin') {
      toast.error('عذراً، يحق فقط لمدير النظام استعادة الفواتير المحذوفة.');
      return;
    }
    
    const record = deletedInvoices.find(di => di.id === deletedId);
    if (!record) return;
    
    const confirmRestore = confirm(`هل أنت متأكد من رغبتك في استعادة الفاتورة رقم ${record.invoice.invoiceNumber}؟`);
    if (!confirmRestore) return;
    
    setInvoices(prev => [record.invoice, ...prev]);
    setDeletedInvoices(prev => prev.filter(di => di.id !== deletedId));
    logActivity(`استعادة الفاتورة رقم ${record.invoice.invoiceNumber} من سلة المحذوفات`);
  };

  const handlePermanentDeleteInvoice = (deletedId: string) => {
    if (currentUser?.role !== 'admin') {
      toast.error('عذراً، يحق فقط لمدير النظام الحذف النهائي للفواتير.');
      return;
    }
    
    const record = deletedInvoices.find(di => di.id === deletedId);
    if (!record) return;
    
    const confirmPermanentDelete = confirm(`تحذير نهائي: هل أنت متأكد من رغبتك في الحذف النهائي للفاتورة رقم ${record.invoice.invoiceNumber}؟ هذا الإجراء لا يمكن التراجع عنه وسيتم مسح الفاتورة تماماً من النظام.`);
    if (!confirmPermanentDelete) return;
    
    setDeletedInvoices(prev => prev.filter(di => di.id !== deletedId));
    logActivity(`حذف نهائي للفاتورة رقم ${record.invoice.invoiceNumber} من سلة المحذوفات`);
  };

  const confirmDeleteInvoice = () => {
    if (invoiceToDelete) {
      const originalInvoice = invoices.find(inv => inv.id === invoiceToDelete.id);
      if (originalInvoice) {
        const deletedRecord: DeletedInvoice = {
          id: `deleted-${Date.now()}-${Math.random()}`,
          invoice: originalInvoice,
          deletedBy: currentUser?.name || 'غير معروف',
          deletedAt: new Date().toISOString()
        };
        setDeletedInvoices(prev => [deletedRecord, ...prev]);
      }

      setInvoices(prev => prev.filter(inv => inv.id !== invoiceToDelete.id));
      logActivity(`حذف الفاتورة رقم ${invoiceToDelete.number}`);
      setIsDeleteConfirmOpen(false);
      setInvoiceToDelete(null);
    }
  };

  const cancelDeleteInvoice = () => {
    setIsDeleteConfirmOpen(false);
    setInvoiceToDelete(null);
  };

  // --- Customer Handlers ---

  const handleDeleteCustomer = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setCustomers(prev => prev.filter(c => c.id !== customerId));
      logActivity(`حذف العميل: ${customer.name}`);
    }
  };

  const handleSaveCustomer = (savedCustomer: Customer) => {
    const existing = customers.find(c => c.id === savedCustomer.id);
    if (existing) {
      // Check edit permission: only creator or admin can edit
      const canEdit = currentUser?.role === 'admin' || 
        !existing.registeredBy || 
        existing.registeredBy.trim().toLowerCase() === currentUser?.name.trim().toLowerCase() ||
        existing.registeredBy.trim().toLowerCase() === currentUser?.username.trim().toLowerCase();

      if (!canEdit) {
        toast.error('خطأ: لا يمكن تعديل بيانات العميل إلا بواسطة الموظف الذي قام بتسجيل العميل أو مدير النظام فقط.');
        return;
      }
      setCustomers(prev => prev.map(c => c.id === savedCustomer.id ? savedCustomer : c));
      logActivity(`تحديث بيانات العميل: ${savedCustomer.name}`);
    } else {
      const newCustomer = {
        ...savedCustomer,
        branchId: currentUser?.branchId || 'branch-1'
      };
      setCustomers(prev => [newCustomer, ...prev]);
      logActivity(`تسجيل عميل جديد باسم: ${savedCustomer.name}`);
    }
  };

  const handleUpdateCustomerStatus = (customerId: string, status: CustomerStatus) => {
    setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, status } : c));
  };

  const handleSettleCustomerInvoices = (customerId: string) => {
    // Converts all unpaid and partially paid invoices for this customer to paid (outstanding = 0)
    setInvoices(prev => prev.map(inv => {
      if (inv.customerId === customerId && inv.status !== 'draft') {
        return {
          ...inv,
          downPayment: inv.totalAmount,
          remainingAmount: 0,
          status: 'paid' as InvoiceStatus,
          lastModifiedBy: currentUser?.name || 'مدير النظام',
          lastModifiedAt: new Date().toISOString()
        };
      }
      return inv;
    }));
  };

  // --- User Administration Handlers ---

  const handleAddUser = async (newUser: User) => {
    const { password, ...profile } = newUser as any;
    const res = await adminUsers({ action: 'create', profile, password: password || '' });
    if (res.error) {
      toast.error('تعذّر إنشاء الحساب: ' + res.error);
      return;
    }
    setUsers(prev => (prev.some(u => u.id === profile.id) ? prev : [...prev, profile]));
    logActivity(`تسجيل موظف جديد بالنظام: ${newUser.name}`);
  };

  const handleDeleteUser = async (userId: string) => {
    const userToDelete = users.find(u => u.id === userId);
    if (userToDelete) {
      const res = await adminUsers({ action: 'delete', userId });
      if (res.error) {
        toast.error('تعذّر حذف الحساب: ' + res.error);
        return;
      }
      setUsers(prev => prev.filter(u => u.id !== userId));
      snapshotRef.current.users.delete(userId);
      logActivity(`حذف حساب الموظف: ${userToDelete.name}`);
    }
  };

  const handleUpdateUserPermissions = (userId: string, permissions: any) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, permissions } : u));
    const target = users.find(u => u.id === userId);
    if (target) {
      logActivity(`تعديل صلاحيات الوصول للموظف: ${target.name}`);
    }
  };

  const handleUpdateUserRole = (userId: string, role: UserRole) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
    const target = users.find(u => u.id === userId);
    if (target) {
      logActivity(`تغيير دور الموظف: ${target.name} إلى ${role === 'admin' ? 'مدير النظام' : 'موظف قياسي'}`);
    }
  };

  /** Returns an error message, or null on success. */
  const handleUpdatePassword = async (userId: string, newPassword: string, currentPassword?: string): Promise<string | null> => {
    const isSelf = userId === currentUserId && !simulationOriginalUserId;
    const res = isSelf && currentPassword !== undefined
      ? await adminUsers({ action: 'changeOwnPassword', currentPassword, newPassword })
      : await adminUsers({ action: 'setPassword', userId, password: newPassword });
    if (res.error) return res.error;
    const target = users.find(u => u.id === userId);
    if (target) logActivity(`تحديث كلمة المرور للمستخدم: ${target.name}`);
    return null;
  };

  const branchConfigUser = users.find(u => u.id === 'branches_config');
  const initialDefaultBranches = [
    { 
      id: 'branch-1', 
      name: 'الفرع الرئيسي', 
      phone: '97994259', 
      email: 'sanad.oman.r3@gmail.com', 
      address: 'سلطنة عُمان، إبراء', 
      createdAt: new Date().toISOString() 
    },
    { 
      id: 'branch-2', 
      name: 'فرع الصناعية - R3', 
      phone: '97994259', 
      email: 'sanad.oman.r3@gmail.com', 
      address: 'سلطنة عُمان، إبراء - المنطقة الصناعية', 
      createdAt: new Date().toISOString() 
    },
    { 
      id: 'branch-3', 
      name: 'فرع صلالة', 
      phone: '97994259', 
      email: 'sanad.oman.r3@gmail.com', 
      address: 'سلطنة عُمان، صلالة', 
      createdAt: new Date().toISOString() 
    }
  ];
  const branches = branchConfigUser?.branches || initialDefaultBranches;

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
  const ticketTypePlaceholders = ticketsConfigUser?.ticketTypePlaceholders || {};

  const handleUpdateTicketTypes = (updatedTypes: string[]) => {
    const exists = users.some(u => u.id === 'tickets_config');
    let updatedUsers;
    if (exists) {
      updatedUsers = users.map(u => u.id === 'tickets_config' ? { ...u, ticketTypes: updatedTypes } : u);
    } else {
      updatedUsers = [
        ...users,
        {
          id: 'tickets_config',
          name: 'إعدادات التذاكر',
          username: 'tickets_config_system',
          role: 'staff' as any,
          isActive: false,
          permissions: {} as any,
          ticketTypes: updatedTypes,
          ticketManagers: {},
          ticketTypePlaceholders: {}
        }
      ];
    }
    setUsers(updatedUsers);
    logActivity('تم تحديث قائمة أنواع الطلبات لدعم الـ HR');
  };

  const handleUpdateTicketManagers = (updatedManagers: Record<string, string[]>) => {
    const exists = users.some(u => u.id === 'tickets_config');
    let updatedUsers;
    if (exists) {
      updatedUsers = users.map(u => u.id === 'tickets_config' ? { ...u, ticketManagers: updatedManagers } : u);
    } else {
      updatedUsers = [
        ...users,
        {
          id: 'tickets_config',
          name: 'إعدادات التذاكر',
          username: 'tickets_config_system',
          role: 'staff' as any,
          isActive: false,
          permissions: {} as any,
          ticketTypes: initialDefaultTicketTypes,
          ticketManagers: updatedManagers,
          ticketTypePlaceholders: {}
        }
      ];
    }
    setUsers(updatedUsers);
    logActivity('تم تحديث مدراء أنواع التذاكر والطلبات');
  };

  const handleUpdateTicketTypePlaceholders = (updatedPlaceholders: Record<string, string>) => {
    const exists = users.some(u => u.id === 'tickets_config');
    let updatedUsers;
    if (exists) {
      updatedUsers = users.map(u => u.id === 'tickets_config' ? { ...u, ticketTypePlaceholders: updatedPlaceholders } : u);
    } else {
      updatedUsers = [
        ...users,
        {
          id: 'tickets_config',
          name: 'إعدادات التذاكر',
          username: 'tickets_config_system',
          role: 'staff' as any,
          isActive: false,
          permissions: {} as any,
          ticketTypes: initialDefaultTicketTypes,
          ticketManagers: {},
          ticketTypePlaceholders: updatedPlaceholders
        }
      ];
    }
    setUsers(updatedUsers);
    logActivity('تم تحديث تلميحات أنواع التذاكر');
  };


  const handleUpdateCustodyCategories = (updatedCategories: any[]) => {
    const exists = users.some(u => u.id === 'custodies_config');
    let updatedUsers;
    if (exists) {
      updatedUsers = users.map(u => u.id === 'custodies_config' ? { ...u, custodyCategories: updatedCategories } : u);
    } else {
      updatedUsers = [
        ...users,
        {
          id: 'custodies_config',
          name: 'إعدادات العهد',
          username: 'custodies_config_system',
          role: 'staff',
          isActive: false,
          permissions: {} as any,
          custodyCategories: updatedCategories
        }
      ];
    }
    setUsers(updatedUsers);
    logActivity('تم تحديث إعدادات العهد والممتلكات');
  };

  const handleUpdateWarningTypes = (updatedTypes: any[]) => {
    const exists = users.some(u => u.id === 'warnings_config');
    let updatedUsers;
    if (exists) {
      updatedUsers = users.map(u => u.id === 'warnings_config' ? { ...u, warningTypes: updatedTypes } : u);
    } else {
      updatedUsers = [
        ...users,
        {
          id: 'warnings_config',
          name: 'إعدادات الإنذارات',
          username: 'warnings_config_system',
          role: 'staff' as any,
          isActive: false,
          permissions: {} as any,
          warningTypes: updatedTypes
        }
      ];
    }
    setUsers(updatedUsers);
    logActivity('تم تحديث إعدادات الإنذارات والمخالفات');
  };

  const handleAddBranch = (branchName: string, phone: string, email: string, address: string) => {
    const newBranch = {
      id: `branch-${Date.now()}`,
      name: branchName,
      phone,
      email,
      address,
      createdAt: new Date().toISOString()
    };
    const updatedBranches = [...branches, newBranch];
    
    const exists = users.some(u => u.id === 'branches_config');
    let updatedUsers;
    if (exists) {
      updatedUsers = users.map(u => u.id === 'branches_config' ? { ...u, branches: updatedBranches } : u);
    } else {
      updatedUsers = [
        ...users,
        {
          id: 'branches_config',
          name: 'إعدادات الفروع',
          username: 'branches_config_system',
          role: 'staff' as any,
          isActive: false,
          permissions: {} as any,
          branches: updatedBranches
        }
      ];
    }
    setUsers(updatedUsers);
    logActivity(`تم إنشاء فرع جديد للنظام: ${branchName} (هاتف: ${phone})`);
  };

  const handleTransferUser = (userId: string, targetBranchId: string) => {
    const updatedUsers = users.map(u => u.id === userId ? { ...u, branchId: targetBranchId } : u);
    setUsers(updatedUsers);
    
    const employee = users.find(u => u.id === userId);
    const branchName = branches.find(b => b.id === targetBranchId)?.name || 'غير معروف';
    if (employee) {
      logActivity(`تم نقل الموظف ${employee.name} إلى فرع: ${branchName}`);
    }
  };

  const handleUpdateBranch = (branchId: string, newName: string, phone: string, email: string, address: string) => {
    const oldBranch = branches.find(b => b.id === branchId);
    const updatedBranches = branches.map(b => b.id === branchId ? { ...b, name: newName, phone, email, address } : b);
    
    const exists = users.some(u => u.id === 'branches_config');
    let updatedUsers;
    if (exists) {
      updatedUsers = users.map(u => u.id === 'branches_config' ? { ...u, branches: updatedBranches } : u);
    } else {
      updatedUsers = [
        ...users,
        {
          id: 'branches_config',
          name: 'إعدادات الفروع',
          username: 'branches_config_system',
          role: 'staff' as any,
          isActive: false,
          permissions: {} as any,
          branches: updatedBranches
        }
      ];
    }
    setUsers(updatedUsers);
    if (oldBranch) {
      logActivity(`تم تعديل بيانات الفرع "${oldBranch.name}" (الاسم الجديد: ${newName})`);
    }
  };

  const handleDeleteBranch = (branchId: string) => {
    if (branchId === 'branch-1') return; // Prevent deleting main branch
    const branchName = branches.find(b => b.id === branchId)?.name || 'غير معروف';
    const updatedBranches = branches.filter(b => b.id !== branchId);
    
    // Fallback users in deleted branch to branch-1
    const exists = users.some(u => u.id === 'branches_config');
    let updatedUsers;
    if (exists) {
      updatedUsers = users.map(u => {
        if (u.id === 'branches_config') {
          return { ...u, branches: updatedBranches };
        }
        if (u.branchId === branchId) {
          return { ...u, branchId: 'branch-1' };
        }
        return u;
      });
    } else {
      updatedUsers = [
        ...users.map(u => u.branchId === branchId ? { ...u, branchId: 'branch-1' } : u),
        {
          id: 'branches_config',
          name: 'إعدادات الفروع',
          username: 'branches_config_system',
          role: 'staff' as any,
          isActive: false,
          permissions: {} as any,
          branches: updatedBranches
        }
      ];
    }

    setUsers(updatedUsers);
    logActivity(`تم حذف الفرع "${branchName}" ونقل موظفيه للفرع الرئيسي`);
  };

  const handleImportBackup = (backupData: any) => {
    if (backupData.customers) setCustomers(backupData.customers);
    if (backupData.invoices) setInvoices(backupData.invoices);
    if (backupData.users) setUsers(backupData.users);
    if (backupData.logs) setLogs(backupData.logs);
    toast.success("تم استيراد البيانات بنجاح");
    if (backupData.tickets) setTickets(backupData.tickets);
    if (backupData.warnings) setWarnings(backupData.warnings);
    if (backupData.mails) setMails(backupData.mails);
    if (backupData.privateMessages) setPrivateMessages(backupData.privateMessages);
    if (backupData.services) setServices(backupData.services);
    if (backupData.deletedInvoices) setDeletedInvoices(backupData.deletedInvoices);
    logActivity('تم استيراد قاعدة بيانات خارجية بنجاح من ملف نسخ احتياطي');
  };

    const handleUpdateSystemSettings = (newSettings: any) => {
    const exists = users.some(u => u.id === 'system_settings_config');
    let updatedUsers;
    if (exists) {
      updatedUsers = users.map(u => u.id === 'system_settings_config' ? { ...u, systemSettings: newSettings } : u);
    } else {
      updatedUsers = [
        ...users,
        {
          id: 'system_settings_config',
          name: 'إعدادات النظام',
          username: 'system_settings_config',
          role: 'staff' as any,
          isActive: false,
          permissions: {} as any,
          systemSettings: newSettings
        }
      ];
    }
    setUsers(updatedUsers);
    logActivity('تم تحديث إعدادات النظام والأزرار');
  };

  const handleResetDatabase = () => {
    setCustomers(initialCustomers);
    setInvoices(initialInvoices);
    // accounts (users) are intentionally preserved
    setLogs(initialActivityLogs);
    setTickets([]);
    setWarnings([]);
    setMails([]);
    setPrivateMessages([]);
    setServices(initialServices);
    setDeletedInvoices([]);
    logActivity('تم إعادة ضبط قاعدة البيانات للقيم الافتراضية الأولية');
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Unique collections for filters
  const uniqueInvoiceNumbers = Array.from(new Set(isolatedInvoices.map(inv => inv.invoiceNumber).filter(Boolean) as string[])).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
  
  const sortedCustomersForFilter = [...isolatedCustomers].sort((a, b) => a.name.localeCompare(b.name, 'ar'));

  const uniqueModifiedByUsers = Array.from(new Set([
    ...users.filter(u => !u.id.endsWith('_config')).map(u => u.name),
    ...isolatedInvoices.map(inv => inv.lastModifiedBy).filter(Boolean) as string[]
  ])).sort((a, b) => a.localeCompare(b, 'ar'));

  const uniqueCreatedByUsers = Array.from(new Set([
    ...users.filter(u => !u.id.endsWith('_config')).map(u => u.name),
    ...isolatedInvoices.map(inv => inv.createdBy || inv.lastModifiedBy).filter(Boolean) as string[]
  ])).sort((a, b) => a.localeCompare(b, 'ar'));

  // --- Invoice Table Filter Indices ---
  const filteredInvoices = isolatedInvoices.filter(inv => {
    const customer = isolatedCustomers.find(c => c.id === inv.customerId);
    const customerName = customer?.name || '';
    const customerPhone = customer?.phone || '';
    const customerCivilId = customer?.civilId || '';
    const customerRegNum = customer?.registrationNumber || '';
    
    // Strict Invoice Number Filter
    const matchesNumber = invoiceFilterNumber === 'all' ? true : inv.invoiceNumber === invoiceFilterNumber;

    // Strict Customer Filter
    const matchesCustomer = invoiceFilterCustomer === 'all' ? true : inv.customerId === invoiceFilterCustomer;

    // Strict Last Modified By Filter
    const matchesModifiedBy = invoiceFilterModifiedBy === 'all' ? true : 
      (inv.lastModifiedBy?.toLowerCase() === invoiceFilterModifiedBy.toLowerCase() || inv.createdBy?.toLowerCase() === invoiceFilterModifiedBy.toLowerCase());

    // Strict Created By Filter
    const matchesCreatedBy = invoiceFilterCreatedBy.length === 0 ? true : 
      invoiceFilterCreatedBy.some(author => (inv.createdBy || inv.lastModifiedBy || 'مدير النظام').toLowerCase() === author.toLowerCase());

    // Payment Method Filter
    const matchesPaymentMethod = invoiceFilterPaymentMethod === 'all' ? true : 
      (inv.payments && inv.payments.some(p => p.method === invoiceFilterPaymentMethod));

    // Status Filter
    const matchesStatus = invoiceFilterStatus === 'all' ? true : 
      (invoiceFilterStatus === 'late' ? isInvoiceLate(inv) : inv.status === invoiceFilterStatus);

    // Original Docs Received Filter
    const matchesOriginalDocs = invoiceFilterOriginalDocs === 'all' ? true : 
      (invoiceFilterOriginalDocs === 'received' ? inv.originalDocsReceived === true : !inv.originalDocsReceived);

    // Strict Branch Filter
    const matchesBranch = invoiceFilterBranch === 'all' ? true : getInvoiceBranchId(inv) === invoiceFilterBranch;

    // Date Range Filter
    let matchesDate = true;
    if (invoiceFilterStartDate || invoiceFilterEndDate) {
      const invDate = new Date(inv.createdAt);
      if (invoiceFilterStartDate) {
        const startDate = new Date(invoiceFilterStartDate);
        startDate.setHours(0, 0, 0, 0);
        if (invDate < startDate) matchesDate = false;
      }
      if (invoiceFilterEndDate) {
        const endDate = new Date(invoiceFilterEndDate);
        endDate.setHours(23, 59, 59, 999);
        if (invDate > endDate) matchesDate = false;
      }
    }

    // General search (text filter)
    const matchesSearch = invoiceSearchValues.length === 0 ? true : invoiceSearchValues.some(val => {
      const searchLower = val.toLowerCase();
      return (
        (customerName?.toLowerCase().includes(searchLower) ?? false) ||
        (customerPhone?.includes(searchLower) ?? false) ||
        (customerCivilId?.includes(searchLower) ?? false) ||
        (customerRegNum?.toLowerCase().includes(searchLower) ?? false) ||
        (inv.invoiceNumber?.toLowerCase().includes(searchLower) ?? false) ||
        (inv.customerExtraText?.toLowerCase().includes(searchLower) ?? false) ||
        (inv.totalAmount?.toString().includes(searchLower) ?? false) ||
        (inv.remainingAmount?.toString().includes(searchLower) ?? false) ||
        (inv.lastModifiedBy?.toLowerCase().includes(searchLower) ?? false) ||
        (inv.createdBy?.toLowerCase().includes(searchLower) ?? false) ||
        inv.items.some(item => (item.serviceName?.toLowerCase().includes(searchLower) ?? false) || (item.employeeName?.toLowerCase().includes(searchLower) ?? false))
      );
    });

    return matchesNumber && matchesCustomer && matchesModifiedBy && matchesCreatedBy && matchesStatus && matchesSearch && matchesBranch && matchesDate && matchesOriginalDocs && matchesPaymentMethod;
  }).sort((a, b) => {
    if (!sortConfig) return 0;
    
    const { key, direction } = sortConfig;

    if (key === 'invoiceNumber') {
      const aNum = a.invoiceNumber || '';
      const bNum = b.invoiceNumber || '';
      const comp = aNum.localeCompare(bNum, undefined, { numeric: true, sensitivity: 'base' });
      if (comp !== 0) return direction === 'asc' ? comp : -comp;
      const aDate = new Date(a.createdAt).getTime() || 0;
      const bDate = new Date(b.createdAt).getTime() || 0;
      return direction === 'asc' ? aDate - bDate : bDate - aDate;
    }

    if (key === 'customerName') {
      const aCust = isolatedCustomers.find(c => c.id === a.customerId)?.name || '';
      const bCust = isolatedCustomers.find(c => c.id === b.customerId)?.name || '';
      const comp = aCust.localeCompare(bCust, 'ar');
      return direction === 'asc' ? comp : -comp;
    }

    if (key === 'totalAmount') {
      const aVal = Number(a.totalAmount) || 0;
      const bVal = Number(b.totalAmount) || 0;
      return direction === 'asc' ? aVal - bVal : bVal - aVal;
    }

    if (key === 'paidAmount') {
      const aVal = (a.downPayment || 0) + (a.payments?.reduce((s, p) => s + p.amount, 0) || 0);
      const bVal = (b.downPayment || 0) + (b.payments?.reduce((s, p) => s + p.amount, 0) || 0);
      return direction === 'asc' ? aVal - bVal : bVal - aVal;
    }

    if (key === 'remainingAmount') {
      const aVal = a.totalAmount - (a.downPayment || 0) - (a.payments?.reduce((s, p) => s + p.amount, 0) || 0);
      const bVal = b.totalAmount - (b.downPayment || 0) - (b.payments?.reduce((s, p) => s + p.amount, 0) || 0);
      return direction === 'asc' ? aVal - bVal : bVal - aVal;
    }

    if (key === 'status') {
      const aStatus = a.status || '';
      const bStatus = b.status || '';
      const comp = aStatus.localeCompare(bStatus, 'ar');
      return direction === 'asc' ? comp : -comp;
    }

    if (key === 'createdBy') {
      const aCreated = a.createdBy || a.lastModifiedBy || 'مدير النظام';
      const bCreated = b.createdBy || b.lastModifiedBy || 'مدير النظام';
      const comp = aCreated.localeCompare(bCreated, 'ar');
      return direction === 'asc' ? comp : -comp;
    }

    let aVal: any = a[key as keyof Invoice];
    let bVal: any = b[key as keyof Invoice];
    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  // --- Dynamic Invoice Statistics for Filtered List ---
  const statsTotalBilled = filteredInvoices.filter(inv => inv.status !== 'draft').reduce((sum, inv) => sum + inv.totalAmount, 0);
  const statsTotalPaid = filteredInvoices.filter(inv => inv.status !== 'draft').reduce((sum, inv) => sum + inv.downPayment, 0);
  const statsTotalOutstanding = filteredInvoices.filter(inv => inv.status !== 'draft').reduce((sum, inv) => sum + inv.remainingAmount, 0);
  const statsUnpaidCount = filteredInvoices.filter(inv => inv.status === 'unpaid' || inv.status === 'partially_paid').length;
  const statsDraftCount = filteredInvoices.filter(inv => inv.status === 'draft').length;
  const statsTotalCash = filteredInvoices.filter(inv => inv.status !== 'draft').reduce((sum, inv) => sum + (inv.payments?.filter(p => p.method === 'cash').reduce((s, p) => s + p.amount, 0) || 0), 0);
  const statsTotalPOS = filteredInvoices.filter(inv => inv.status !== 'draft').reduce((sum, inv) => sum + (inv.payments?.filter(p => p.method === 'pos').reduce((s, p) => s + p.amount, 0) || 0), 0);
  const statsTotalTransfer = filteredInvoices.filter(inv => inv.status !== 'draft').reduce((sum, inv) => sum + (inv.payments?.filter(p => p.method === 'transfer').reduce((s, p) => s + p.amount, 0) || 0), 0);


  // --- Instant Amounts Items ---
  const filteredItems = filteredInvoices.flatMap(inv => {
    let remainingPaidAmount = inv.totalAmount - inv.remainingAmount;
    
    return inv.items.map(item => {
      const itemTotal = item.total;
      let itemPaid = 0;
      if (remainingPaidAmount >= itemTotal) {
        itemPaid = itemTotal;
        remainingPaidAmount -= itemTotal;
      } else if (remainingPaidAmount > 0) {
        itemPaid = remainingPaidAmount;
        remainingPaidAmount = 0;
      }

      return {
        ...item,
        invoiceId: inv.id,
        invoiceNumber: inv.invoiceNumber,
        invoiceStatus: inv.status,
        customerName: isolatedCustomers.find(c => c.id === inv.customerId)?.name || '',
        invoiceDate: inv.createdAt,
        invoiceCreatedBy: inv.createdBy || inv.lastModifiedBy || 'مدير النظام',
        invoicePaidAmount: itemPaid,
        invoiceRemainingAmount: itemTotal - itemPaid,
        invoiceLastModifiedBy: inv.lastModifiedBy || inv.createdBy || 'مدير النظام',
        invoiceLastModifiedAt: inv.lastModifiedAt || inv.createdAt
      };
    });
  }).sort((a, b) => {
    if (!itemsSortConfig) return 0;
    const { key, direction } = itemsSortConfig;
    let aVal: any = a[key as keyof typeof a];
    let bVal: any = b[key as keyof typeof b];

    if (key === 'price' || key === 'discount' || key === 'quantity' || key === 'total') {
      aVal = Number(aVal) || 0;
      bVal = Number(bVal) || 0;
    } else {
      aVal = String(aVal || '');
      bVal = String(bVal || '');
    }

    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loggingIn) return;
    setLoggingIn(true);
    setLoginError('');
    try {
      const { error } = await signIn(loginUsername, loginPassword);
      if (error) {
        setLoginError('اسم المستخدم أو الرقم السري غير صحيح.');
        return;
      }
      const myId = await bootstrapSession();
      if (!myId) {
        await signOut();
        setLoginError('هذا الحساب غير نشط أو غير مهيّأ، أو تعذّر تحميل البيانات.');
        return;
      }
      setLoginPassword('');
      handleLogin(myId);
    } finally {
      setLoggingIn(false);
    }
  };

  // Render Login view if user is unauthenticated
  if (!authChecked) {
  
      const getBackupData = () => ({
    version: "3.0",
    exportedAt: new Date().toISOString(),
    exportedBy: currentUser?.name || 'النظام',
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
  });
  return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-xl animate-pulse">جاري تحميل البيانات...</div>
      </div>
    );
  }

  if (!currentUserId || !currentUser) {
  
      const getBackupData = () => ({
    version: "3.0",
    exportedAt: new Date().toISOString(),
    exportedBy: currentUser?.name || 'النظام',
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
  });
  return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 md:p-8" id="login-screen-view" dir="rtl">
        <NetworkGuard />
        <Toaster position="top-center" toastOptions={{ style: { fontFamily: "Tajawal", fontSize: "14px", fontWeight: "bold" } }} />
      <AutoBackupManager 
        users={users} 
        setUsers={setUsers} 
        getBackupData={getBackupData} 
        logActivity={logActivity}
        currentUserRole={currentUser?.role}
      />
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 space-y-6 border border-slate-100 text-center flex flex-col items-center">
          
          {/* Logo & Bilingual Brand name */}
          <Logo 
            size="lg" 
            showText={false} 
            customLogoUrl={systemSettings.companyLogo}
            customCompanyName={systemSettings.companyName}
            customSubtitle={systemSettings.companySubtitle}
          />

          <div className="space-y-1 text-center">
            <h1 className="text-xl font-extrabold text-slate-800">{systemSettings.companyName || 'مركز سند الريادة للخدمات'}</h1>
            <h2 className="text-sm font-bold text-slate-500 tracking-wide font-mono">{systemSettings.companyNameEn || 'AL-RIYADAH SAND SERVICES'}</h2>
          </div>

          <div className="space-y-1">
            <h2 className="text-sm font-extrabold text-teal-600 bg-teal-50 py-1 px-3 rounded-full inline-block">
              {systemSettings.companySubtitle || 'المنصة الرقمية الموحدة لإدارة العمليات والموارد'}
            </h2>
            <p className="text-xs text-slate-400 mt-2">سجل الدخول لبدء استخدام المنصة لإدارة العمليات والموارد والخدمات</p>
          </div>

          <hr className="w-full border-slate-100" />

          {/* Login Form */}
          <form onSubmit={handleLoginSubmit} className="w-full text-right space-y-4">
            {loginError && (
              <div className="p-3 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-100 rounded-xl text-center">
                {loginError}
              </div>
            )}
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 block">اسم المستخدم</label>
              <input
                type="text"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all font-mono"
                placeholder="أدخل اسم المستخدم"
                required
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 block">الرقم السري</label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all font-mono"
                placeholder="أدخل الرقم السري"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={loggingIn}
              className="w-full p-3.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-bold text-sm rounded-xl transition-all shadow-md mt-2"
            >
              {loggingIn ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
            </button>

            <a
              href="https://drive.google.com/file/d/1GAzIBmFygHATszOXNVYNuLUZf-h0goK1/view?usp=sharing"
              target="_blank"
              rel="noopener noreferrer"
              className="block mt-4 text-sm font-bold text-center text-slate-400 hover:text-teal-600 transition-colors"
            >
              دليل المستخدم الشامل للنظام
            </a>
          </form>
          
          <div className="text-[10px] text-slate-400 pt-2 font-sans">
            المنصة الرقمية الموحدة - مركز سند الريادة للخدمات © 2026
          </div>
        </div>
      </div>
    );
  }

  // Render Authorized Portal View
  const isUserHr = currentUser && (currentUser.role === 'admin' || !!currentUser.permissions?.manageTickets);
  const hrNotificationCount = isUserHr ? (tickets || []).filter(t => t.status === 'new' || t.unreadByHr).length : 0;
  const activeTicketsCountForEmployee = currentUser 
    ? (tickets || []).filter(t => t.employeeId === currentUser.id && (t.unreadByEmployee || t.status === 'new' || t.status === 'processing')).length 
    : 0;

  const unreadProfileNotifications = currentUser
    ? (warnings || []).filter(w => w.employeeId === currentUser.id && w.unreadByEmployee).length
    : 0;

  const isRestrictedRole = currentUser && ['external_support_tech', 'external_support_admin', 'temp_visitor'].includes(currentUser.role);

  return (
    <div className="min-h-screen flex flex-col text-right font-sans bg-slate-50/55" dir="rtl" id="authorized-portal-container">
      {/* Simulation Banner (شريط أحمر أعلى الصفحة لمحاكي اختبار الموظفين والصلاحيات) */}
      {simulationOriginalUserId && currentUser && (
        <aside 
          aria-label="شريط وضع محاكي اختبار الموظفين" 
          className="sticky top-0 z-[9999] w-full bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white shadow-lg border-b-2 border-red-800/40 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 animate-in slide-in-from-top duration-200"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl text-white shrink-0 shadow-xs flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 animate-pulse text-amber-200" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-black text-xs md:text-sm tracking-wide text-white">
                  ملاحظة: الوضع الحالي هو وضع تجربة محاكي اختبار الموظفين والصلاحيات ({currentUser.name})
                </span>
                <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/30">
                  جلسة محاكاة نشطة
                </span>
              </div>
              <div className="text-[11px] text-rose-100 flex items-center gap-1.5 mt-0.5 flex-wrap">
                <span>أنت تتصفح النظام حالياً بحساب الموظف:</span>
                <strong className="text-white underline underline-offset-2 font-black">{currentUser.name}</strong>
                <span className="opacity-90">({currentUser.jobTitle || (currentUser.role === 'admin' ? 'مدير النظام' : 'موظف')})</span>
                <span className="text-rose-200 text-[10px]">— يمكنك تجربة وفحص الصلاحيات والواجهات والرجوع بأي لحظة.</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExitSimulation}
              className="bg-white hover:bg-rose-50 text-rose-700 font-extrabold text-xs px-4 py-2 rounded-xl shadow-md transition-all hover:shadow active:scale-95 flex items-center gap-2 cursor-pointer border border-rose-200"
              title="الرجوع للوضع الطبيعي وإنهاء وضع المحاكاة"
            >
              <RotateCcw className="w-4 h-4 text-rose-600" />
              <span>الرجوع للوضع الطبيعي</span>
              {simulationOriginalUser && (
                <span className="text-[10px] text-rose-500 font-bold mr-1 border-r border-rose-200 pr-1.5">
                  ({simulationOriginalUser.name})
                </span>
              )}
            </button>
          </div>
        </aside>
      )}

      <div className={`flex-1 flex flex-col md:flex-row ${maintenanceMode ? 'maintenance-lock' : ''}`} id="authorized-portal-view">
        <NetworkGuard />
      {maintenanceMode && (
        <div className="fixed top-0 left-0 right-0 bg-red-600 text-white p-3 z-[99999] text-center font-bold text-sm shadow-md flex items-center justify-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          النظام في حالة صيانة (للتصفح فقط). تم إيقاف الإدخال لحماية البيانات نظراً لوجود مشكلة تقنية أو استهلاك الحد المجاني.
        </div>
      )}
      <Toaster position="top-center" toastOptions={{ style: { fontFamily: "Tajawal", fontSize: "14px", fontWeight: "bold" } }} />
      <AutoBackupManager 
        users={users} 
        setUsers={setUsers} 
        getBackupData={getBackupData} 
        logActivity={logActivity}
        currentUserRole={currentUser?.role}
      />
      
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-100 sticky top-0 z-45 shadow-2xs w-full shrink-0">
        <div className="flex items-center gap-2">
          <Logo 
            size="sm" 
            showText={false} 
            customLogoUrl={systemSettings.companyLogo} 
            customCompanyName={systemSettings.companyName}
          />
          <div className="text-right">
            <span className="text-xs font-bold text-slate-800 block leading-tight">{systemSettings.companyName || 'المنصة الرقمية الموحدة'}</span>
            <span className="text-[8px] text-slate-400 font-mono">{systemSettings.companyNameEn || 'AL-RIYADAH SAND SERVICES'}</span>
          </div>
        </div>
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="relative p-2 text-slate-600 hover:bg-slate-50 rounded-xl transition-all border border-slate-100 flex items-center justify-center cursor-pointer"
          title="القائمة"
        >
          <Menu className="w-5 h-5" />
          {(unreadChatMailNotifications > 0 || hrNotificationCount > 0 || activeTicketsCountForEmployee > 0 || unreadProfileNotifications > 0 || lateInvoicesNotificationCount > 0) && (
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
            </span>
          )}
        </button>
      </div>

      {/* Mobile Sidebar Backdrop Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-45 md:hidden animate-fade-in" 
          onClick={() => setIsSidebarOpen(false)} 
        />
      )}

      {/* 1. Main Navigation Sidebar (Right side in RTL) */}
      <aside className={`
        ${isSidebarOpen ? 'flex fixed inset-y-0 right-0 w-[260px] z-50 h-screen shadow-2xl animate-in slide-in-from-right duration-300' : 'hidden'} 
        md:flex md:w-[230px] lg:w-[250px] bg-white md:border-b-0 md:border-l border-slate-100/90 shadow-2xs flex-col md:sticky md:top-0 md:h-screen md:overflow-y-auto
      `}>
        
        {/* Mobile Close Button inside Sidebar */}
        <button
          onClick={() => setIsSidebarOpen(false)}
          className="md:hidden p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors absolute top-4 left-4 z-50 border border-slate-100"
          title="إغلاق القائمة"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Logo and Brand Title */}
        <div className="p-5 border-b border-slate-100 flex flex-col gap-3.5">
          <div className="flex items-center gap-3">
            <Logo 
              size="sm" 
              showText={false} 
              customLogoUrl={systemSettings.companyLogo} 
              customCompanyName={systemSettings.companyName}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h1 className="text-xs font-black text-slate-800 truncate" title={systemSettings.companyName || 'المنصة الرقمية الموحدة'}>
                  {systemSettings.companyName || 'المنصة الرقمية الموحدة'}
                </h1>
              </div>
              <p className="text-[9px] text-slate-400 font-mono tracking-wide truncate">{systemSettings.companyNameEn || 'AL-RIYADAH SAND SERVICES'}</p>
            </div>
          </div>

          {/* Active User display right under the company name */}
          {currentUser && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-100/80">
                <div className="text-right flex-1 min-w-0">
                  <span className="text-[9px] text-slate-400 block font-bold mb-0.5">المستخدم النشط:</span>
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 min-w-0">
                    {currentUser.avatarUrl ? (
                      <img src={currentUser.avatarUrl} alt="صورة المستخدم" className="w-4 h-4 rounded-full object-cover shrink-0 border border-slate-200" />
                    ) : (
                      <UserCheck className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    )}
                    <div className="flex flex-col min-w-0">
                      <span className="truncate">{currentUser.name}</span>
                      <span className="text-[9px] text-slate-500 font-normal truncate">
                        {currentUser.jobTitle || (currentUser.role === 'admin' ? 'مدير النظام' : currentUser.role === 'hr' ? 'الموارد البشرية' : 'موظف')}
                      </span>
                    </div>
                  </span>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => { setPasswordModalTargetId(currentUser.id); setIsSidebarOpen(false); }}
                    className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                    title="تغيير كلمة المرور"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-1.5 h-[22.5px] text-[10px] font-bold text-rose-500 hover:text-white bg-rose-50 hover:bg-rose-500 rounded-lg transition-all"
                title="تسجيل الخروج من النظام"
                id="logout-btn"
              >
                <LogOut className="w-3 h-3" />
                <span>تسجيل الخروج من النظام</span>
              </button>
            </div>
          )}
        </div>

        {/* Tab Actions */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1.5 text-xs font-bold text-slate-600">
          <button
            onClick={() => { setActiveSection('dashboard'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-2.5 py-3 px-4 rounded-xl transition-all ${
              activeSection === 'dashboard' ? 'bg-teal-50 text-teal-700 font-extrabold' : 'hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            <LayoutDashboard className={`w-4 h-4 ${activeSection === 'dashboard' ? 'text-teal-600' : 'text-slate-400'}`} />
            لوحة التحكم الرئيسية
          </button>
          
          <button
            onClick={() => { setActiveSection('invoices'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-2.5 py-3 px-4 rounded-xl transition-all ${
              activeSection === 'invoices' ? 'bg-teal-50 text-teal-700 font-extrabold' : 'hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            <FileText className={`w-4 h-4 shrink-0 ${activeSection === 'invoices' ? 'text-teal-600' : 'text-slate-400'}`} />
            <span className="flex-1 text-right">الفواتير و الحساب</span>
            {lateInvoicesNotificationCount > 0 && (
              <span
                role="button"
                tabIndex={0}
                onClick={handleViewLateInvoices}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleViewLateInvoices();
                  }
                }}
                title={`يوجد ${lateInvoicesNotificationCount} فواتير متأخرة - انقر لعرضها وتصفيتها فوراً`}
                className="relative flex items-center justify-center shrink-0 cursor-pointer p-1 -m-1 group/late-badge"
              >
                {/* Diffusion Ring 1 (حلقة انتشار ضبابية تتسع وتتلاشى للخارج) */}
                <span className="absolute inset-0 m-auto w-5 h-5 rounded-full border border-amber-400/60 blur-[0.5px] late-ring-1 pointer-events-none" />

                {/* Diffusion Ring 2 (حلقة انتشار ضبابية ثانية تتسع وتتلاشى بالتناوب) */}
                <span className="absolute inset-0 m-auto w-5 h-5 rounded-full border border-orange-400/50 blur-[0.5px] late-ring-2 pointer-events-none" />

                {/* Main Notification Circle Badge: خلفية كريمية دافئة، حد برتقالي خفيف، توهج ناعم واهتزاز متناسق */}
                <span className="relative z-10 flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-gradient-to-b from-[#fffdf5] to-[#fef3c7] border border-amber-300 text-[10px] font-black text-amber-900 shadow-xs late-badge-glow late-badge-shake hover:scale-115 active:scale-95 transition-transform duration-150">
                  {lateInvoicesNotificationCount}
                </span>
              </span>
            )}
          </button>
          
          <button
            onClick={() => { setActiveSection('customers'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-2.5 py-3 px-4 rounded-xl transition-all ${
              activeSection === 'customers' ? 'bg-teal-50 text-teal-700 font-extrabold' : 'hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            <Users className={`w-4 h-4 ${activeSection === 'customers' ? 'text-teal-600' : 'text-slate-400'}`} />
            إدارة العملاء
          </button>

          <button
            onClick={() => { setActiveSection('tickets'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-2.5 py-3 px-4 rounded-xl transition-all ${
              activeSection === 'tickets' ? 'bg-teal-50 text-teal-700 font-extrabold' : 'hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            <Briefcase className={`w-4 h-4 ${activeSection === 'tickets' ? 'text-teal-600' : 'text-slate-400'}`} />
            <span className="flex-1 text-right">الطلبات والدعم الإداري</span>
            {isUserHr ? (
              hrNotificationCount > 0 && (
                <span className="relative flex h-5 w-5 items-center justify-center shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-5 w-5 bg-rose-500 text-[10px] text-white font-black items-center justify-center shadow-xs">
                    {hrNotificationCount}
                  </span>
                </span>
              )
            ) : (
              activeTicketsCountForEmployee > 0 && (
                <span className="relative flex h-5 w-5 items-center justify-center shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-5 w-5 bg-amber-500 text-[10px] text-white font-black items-center justify-center shadow-xs">
                    {activeTicketsCountForEmployee}
                  </span>
                </span>
              )
            )}
          </button>

          <button
            onClick={() => { setActiveSection('chat-mail'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-2.5 py-3 px-4 rounded-xl transition-all ${
              activeSection === 'chat-mail' 
                ? 'bg-teal-50 text-teal-700 font-extrabold shadow-2xs' 
                : unreadChatMailNotifications > 0
                  ? 'bg-indigo-50/70 text-indigo-900 font-bold hover:bg-indigo-100/80 border border-indigo-100/80'
                  : 'hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            <div className="relative flex items-center justify-center shrink-0">
              <MessageSquare className={`w-4 h-4 transition-transform ${
                activeSection === 'chat-mail' 
                  ? 'text-teal-600' 
                  : unreadChatMailNotifications > 0 
                    ? 'text-indigo-600 animate-pulse' 
                    : 'text-slate-400'
              }`} />
              {unreadChatMailNotifications > 0 && (
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                </span>
              )}
            </div>
            <span className="flex-1 text-right">البريد و الدردشة</span>
            {unreadChatMailNotifications > 0 && (
              <span className="relative flex h-5 min-w-5 px-1.5 items-center justify-center shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-5 min-w-5 px-1.5 bg-rose-500 text-[10px] text-white font-black items-center justify-center shadow-xs">
                  {unreadChatMailNotifications}
                </span>
              </span>
            )}
          </button>

          <button
            onClick={() => { setActiveSection('profile'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-2.5 py-3 px-4 rounded-xl transition-all ${
              activeSection === 'profile' ? 'bg-teal-50 text-teal-700 font-extrabold' : 'hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            <UserIcon className={`w-4 h-4 ${activeSection === 'profile' ? 'text-teal-600' : 'text-slate-400'}`} />
            <span className="flex-1 text-right">ملفي الشخصي</span>
            {unreadProfileNotifications > 0 && (
              <span className="relative flex h-5 w-5 items-center justify-center shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-5 w-5 bg-rose-500 text-[10px] text-white font-black items-center justify-center shadow-xs">
                  {unreadProfileNotifications}
                </span>
              </span>
            )}
          </button>

          {currentUser?.id !== 'guest' && systemSettings.enableCloseAccounts && (
            <button
              onClick={() => { setActiveSection('closing'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-2.5 py-3 px-4 rounded-xl transition-all ${
                activeSection === 'closing' ? 'bg-teal-50 text-teal-700 font-extrabold' : 'hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <Lock className={`w-4 h-4 ${activeSection === 'closing' ? 'text-teal-600' : 'text-slate-400'}`} />
              إغلاق الحسابات
            </button>
          )}

          {currentUser.permissions.viewReports && (
            <button
              onClick={() => { setActiveSection('reports'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-2.5 py-3 px-4 rounded-xl transition-all ${
                activeSection === 'reports' ? 'bg-teal-50 text-teal-700 font-extrabold' : 'hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <TrendingUp className={`w-4 h-4 ${activeSection === 'reports' ? 'text-teal-600' : 'text-slate-400'}`} />
              التقارير والتحليلات
            </button>
          )}

          <button
            onClick={() => { setActiveSection('operations-log'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-2.5 py-3 px-4 rounded-xl transition-all ${
              activeSection === 'operations-log' ? 'bg-teal-50 text-teal-700 font-extrabold' : 'hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            <ClipboardList className={`w-4 h-4 ${activeSection === 'operations-log' ? 'text-teal-600' : 'text-slate-400'}`} />
            سجل العمليات والأنشطة
          </button>

          <button
            onClick={() => { setActiveSection('settings'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-2.5 py-3 px-4 rounded-xl transition-all ${
              activeSection === 'settings' ? 'bg-teal-50 text-teal-700 font-extrabold' : 'hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            <Settings className={`w-4 h-4 ${activeSection === 'settings' ? 'text-teal-600' : 'text-slate-400'}`} />
            إعدادات النظام والتحكم
          </button>

          {currentUser && currentUser.role === 'admin' && (
            <button
              onClick={() => { setActiveSection('database'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-2.5 py-3 px-4 rounded-xl transition-all ${
                activeSection === 'database' ? 'bg-teal-50 text-teal-700 font-extrabold' : 'hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <Database className={`w-4 h-4 ${activeSection === 'database' ? 'text-teal-600' : 'text-slate-400'}`} />
              مركز إدارة وقواعد البيانات
            </button>
          )}

          {currentUser?.id !== 'guest' && (
            <button
              onClick={() => { setActiveSection('trash'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-2.5 py-3 px-4 rounded-xl transition-all ${
                activeSection === 'trash' ? 'bg-teal-50 text-teal-700 font-extrabold' : 'hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <Trash2 className={`w-4 h-4 ${activeSection === 'trash' ? 'text-teal-600' : 'text-slate-400'}`} />
              سلة المحذوفات
            </button>
          )}

          <button
            onClick={() => { setActiveSection('guide'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-2.5 py-3 px-4 rounded-xl transition-all ${
              activeSection === 'guide' ? 'bg-teal-50 text-teal-700 font-extrabold' : 'hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            <BookOpen className={`w-4 h-4 ${activeSection === 'guide' ? 'text-teal-600' : 'text-slate-400'}`} />
            دليل المستخدم التعليمي
          </button>

          <button
            onClick={() => { setActiveSection('about'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-2.5 py-3 px-4 rounded-xl transition-all ${
              activeSection === 'about' ? 'bg-teal-50 text-teal-700 font-extrabold' : 'hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            <HelpCircle className={`w-4 h-4 ${activeSection === 'about' ? 'text-teal-600' : 'text-slate-400'}`} />
            حول البرنامج
          </button>
        </nav>

      </aside>

      {/* 2. Main Content viewport wrapper */}
      <main className="flex-1 w-full p-4 md:p-6 pb-24 overflow-y-auto">
        {/* UPPER VIEW HEADER: Welcome, Branch Display and Selector */}
        <div className="mb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white border border-slate-100 rounded-2xl p-2.5 gap-4 shadow-3xs" id="workspace-global-header">
          <div>
            <h2 className="text-sm font-black text-slate-800 flex items-center gap-2 flex-wrap">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden border border-indigo-200">
                {currentUser?.avatarUrl ? (
                  <img src={currentUser.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm font-bold text-indigo-500">{(currentUser?.name || 'م').charAt(0)}</span>
                )}
              </div>
              <span>أهلاً بك، {currentUser?.name}</span>
              <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                currentUser?.role === 'admin' 
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' 
                  : 'bg-teal-50 text-teal-700 border border-teal-100'
              }`}>
                {currentUser?.jobTitle || (currentUser?.role === 'admin' ? '🛡️ مدير النظام' : currentUser?.role === 'hr' ? '👥 الموارد البشرية' : '👤 موظف')}
              </span>

              {/* القائمة المنسدلة للفروع بجانب اسم المستخدم عند دخول مدير النظام */}
              {currentUser?.role === 'admin' && (
                <div className="flex items-center gap-1.5 bg-teal-50 border border-teal-100 px-2 py-0.5 rounded-xl text-xs font-bold text-teal-800 animate-fade-in shrink-0 mr-1.5">
                  <span className="text-[10px] text-teal-600 font-bold shrink-0">🏢 فرع التحكم:</span>
                  <select
                    value={adminSelectedBranchId}
                    onChange={(e) => setAdminSelectedBranchId(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg px-1.5 py-0.5 text-[11px] font-bold text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-teal-500 cursor-pointer shadow-3xs"
                    title="اختر الفرع للتنقل ورؤية فواتير وشات الفرع المحدد"
                  >
                    <option value="all">🌐 كافة الفروع</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>🏢 {b.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </h2>
            <p className="hidden text-[10px] text-slate-500 mt-1">
              {currentUser?.role === 'admin' 
                ? 'لوحة الإدارة الفائقة - إدارة وتحليل كافة الفروع والعمليات الموحدة' 
                : `بوابة الموظف لـ: ${branches.find(b => b.id === (currentUser?.branchId || 'branch-1'))?.name || 'الفرع الرئيسي'}`}
            </p>
          </div>

          {/* Branch Filter for Admin or Branch Badge for Standard User */}
          <div className="flex items-center gap-2 shrink-0">

            {activeSection === 'dashboard' && (
              <div className="flex items-center gap-3 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-slate-500 pr-1 flex items-center gap-1 shrink-0">
                    <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                    السنة:
                  </span>
                  <select
                    value={dashboardYear}
                    onChange={(e) => setDashboardYear(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 cursor-pointer min-w-[70px]"
                  >
                    <option value="all">كافة السنوات</option>
                    <option value="current">السنة الحالية</option>
                    {dashboardAvailableYears.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                
                <div className="w-px h-6 bg-slate-200"></div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-slate-500 flex items-center shrink-0">
                    الشهر:
                  </span>
                  <select
                    value={dashboardMonth}
                    onChange={(e) => setDashboardMonth(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 cursor-pointer min-w-[70px]"
                  >
                    <option value="all">كافة الأشهر</option>
                    <option value="current">الشهر الحالي</option>
                    <option value="01">يناير</option>
                    <option value="02">فبراير</option>
                    <option value="03">مارس</option>
                    <option value="04">أبريل</option>
                    <option value="05">مايو</option>
                    <option value="06">يونيو</option>
                    <option value="07">يوليو</option>
                    <option value="08">أغسطس</option>
                    <option value="09">سبتمبر</option>
                    <option value="10">أكتوبر</option>
                    <option value="11">نوفمبر</option>
                    <option value="12">ديسمبر</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* --- MAIN CONTENT SECTIONS --- */}
        <div className="mt-4">
          {activeSection === 'dashboard' && (
            <Dashboard 
              invoices={dashboardFilteredInvoices} 
              customers={isolatedCustomers} 
              onNavigate={setActiveSection} 
              tickets={dashboardFilteredTickets}
              currentUser={currentUser}
              dashboardMonth={dashboardMonth}
              dashboardYear={dashboardYear}
            />
          )}

          {activeSection === 'invoices' && (
            <div className="space-y-6">
              
              {/* Invoices Top Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-3xs flex flex-col justify-between">
                  <div className="text-slate-500 text-xs font-bold mb-1">إجمالي الفواتير</div>
                  <div className="text-2xl font-black text-slate-800">{statsTotalBilled.toFixed(3)}</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-3xs flex flex-col justify-between">
                  <div className="text-slate-500 text-xs font-bold mb-1">المدفوع</div>
                  <div className="text-2xl font-black text-emerald-600">{statsTotalPaid.toFixed(3)}</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-3xs flex flex-col justify-between">
                  <div className="text-slate-500 text-xs font-bold mb-1">المتبقي</div>
                  <div className="text-2xl font-black text-rose-600">{statsTotalOutstanding.toFixed(3)}</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-3xs flex flex-col justify-between">
                  <div className="text-slate-500 text-xs font-bold mb-1">فواتير غير مدفوعة</div>
                  <div className="text-2xl font-black text-amber-600">{statsUnpaidCount}</div>
                </div>
              </div>

              {/* Invoices Filters */}
              <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-3xs flex flex-col gap-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap gap-2 items-center flex-1">
                    <SearchableMultiSelectDropdown
                      placeholder="بحث..."
                      selectedValues={invoiceSearchValues}
                      onChange={setInvoiceSearchValues}
                      options={searchOptions}
                      className="w-44"
                    />

                    <CustomerSearchableCombobox
                      placeholder="البحث عن عميل..."
                      value={invoiceFilterCustomer}
                      onChange={setInvoiceFilterCustomer}
                      customers={customers}
                      invoices={invoices}
                      className="w-44"
                    />

                    <SearchableMultiSelectDropdown
                      placeholder="أُنشئت بواسطة..."
                      selectedValues={invoiceFilterCreatedBy}
                      onChange={setInvoiceFilterCreatedBy}
                      options={Array.from(new Set(invoices.map(i => i.createdBy || i.lastModifiedBy || 'مدير النظام'))).filter(Boolean) as string[]}
                      className="w-44"
                    />
                    
                    <button 
                      onClick={() => {
                        setInvoiceSearchValues([]);
                        setInvoiceFilterStatus('all');
                        setInvoiceFilterPaymentMethod('all');
                        setInvoiceFilterBranch('all');
                        setInvoiceFilterNumber('all');
                        setInvoiceFilterCustomer('all');
                        setInvoiceFilterCreatedBy([]);
                        setInvoiceFilterModifiedBy('all');
                        setInvoiceFilterOriginalDocs('all');
                        setInvoiceFilterStartDate('');
                        setInvoiceFilterEndDate('');
                      }} 
                      className="flex items-center gap-1.5 px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"
                      title="إعادة تعيين كافة الفلاتر"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      إعادة تعيين
                    </button>
                  </div>
                  <button 
                    onClick={() => {
                        setInvoiceToEdit(null);
                        setIsInvoiceModalOpen(true);
                    }}
                    className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    إصدار فاتورة جديدة
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 pt-2 border-t border-slate-100">
                  <div className="relative w-full">
                    <select value={invoiceFilterStatus} onChange={(e) => setInvoiceFilterStatus(e.target.value as any)} className={`appearance-none w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs focus:ring-2 focus:ring-teal-500 outline-none cursor-pointer min-h-[32px] ${invoiceFilterStatus === 'all' ? 'text-slate-400' : 'text-slate-800'}`}>
                    <option value="all">كافة حالات الدفع</option>
                    <option value="paid">مدفوعة</option>
                    <option value="partially_paid">مدفوعة جزئياً</option>
                    <option value="unpaid">غير مدفوعة</option>
                    <option value="draft">مسودة</option>
                    <option value="late">متأخرة</option>
                  </select>
                  <div className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                  </div>
                  <div className="relative w-full">
                    <select value={invoiceFilterPaymentMethod} onChange={(e) => setInvoiceFilterPaymentMethod(e.target.value as any)} className={`appearance-none w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs focus:ring-2 focus:ring-teal-500 outline-none cursor-pointer min-h-[32px] ${invoiceFilterPaymentMethod === 'all' ? 'text-slate-400' : 'text-slate-800'}`}>
                    <option value="all">كافة طرق الدفع</option>
                    <option value="cash">نقداً</option>
                    <option value="pos">نقاط البيع (POS)</option>
                    <option value="transfer">تحويل بنكي</option>
                  </select>
                  <div className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                  </div>
                  {currentUser?.role === 'admin' && (
                    <div className="relative w-full">
                    <select value={invoiceFilterBranch} onChange={(e) => setInvoiceFilterBranch(e.target.value)} className={`appearance-none w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs focus:ring-2 focus:ring-teal-500 outline-none cursor-pointer min-h-[32px] ${invoiceFilterBranch === 'all' ? 'text-slate-400' : 'text-slate-800'}`}>
                      <option value="all">كافة الفروع</option>
                      {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                    <div className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </div>
                  )}
                  <div className="relative w-full">
                  <select value={invoiceFilterOriginalDocs} onChange={(e) => setInvoiceFilterOriginalDocs(e.target.value as any)} className={`appearance-none w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs focus:ring-2 focus:ring-teal-500 outline-none cursor-pointer min-h-[32px] ${invoiceFilterOriginalDocs === 'all' ? 'text-slate-400' : 'text-slate-800'}`}>
                    <option value="all">حالة المستندات الأصلية (الكل)</option>
                    <option value="received">تم الاستلام</option>
                    <option value="not_received">لم يتم الاستلام</option>
                  </select>
                  <div className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                  </div>

                </div>
                
                <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3">
                  <span className="text-sm text-slate-500 font-bold whitespace-nowrap">تاريخ الفاتورة:</span>
                  <div className="flex items-center gap-2">
                    <input type="date" value={invoiceFilterStartDate} onChange={(e) => setInvoiceFilterStartDate(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-teal-500" title="من تاريخ" />
                    <span className="text-slate-400">-</span>
                    <input type="date" value={invoiceFilterEndDate} onChange={(e) => setInvoiceFilterEndDate(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-teal-500" title="إلى تاريخ" />
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-max">
                    <button onClick={() => { const d = new Date(); const f = new Date(d); f.setDate(d.getDate() - d.getDay()); const l = new Date(d); l.setDate(d.getDate() - d.getDay() + 6); setInvoiceFilterStartDate(f.toISOString().split('T')[0]); setInvoiceFilterEndDate(l.toISOString().split('T')[0]); }} className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition-colors">هذا الأسبوع</button>
                    <button onClick={() => { const d = new Date(); const f = new Date(d.getFullYear(), d.getMonth() - 1, 1); const l = new Date(d.getFullYear(), d.getMonth(), 0); setInvoiceFilterStartDate(f.toISOString().split('T')[0]); setInvoiceFilterEndDate(l.toISOString().split('T')[0]); }} className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition-colors">الشهر الماضي</button>
                    <button onClick={() => { const d = new Date(); const f = new Date(d.getFullYear(), d.getMonth() - 3, 1); setInvoiceFilterStartDate(f.toISOString().split('T')[0]); setInvoiceFilterEndDate(d.toISOString().split('T')[0]); }} className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition-colors">آخر 3 أشهر</button>
                    <button onClick={() => { setInvoiceFilterStartDate(''); setInvoiceFilterEndDate(''); }} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors">الكل</button>
                  </div>
                </div>
              </div>

              {/* View Toggles */}
              <div className="flex gap-2">
                <button 
                  onClick={() => setInvoiceSubView('invoices')}
                  className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${invoiceSubView === 'invoices' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  قائمة الفواتير
                </button>
                <button 
                  onClick={() => setInvoiceSubView('instantAmounts')}
                  className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${invoiceSubView === 'instantAmounts' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  المبالغ الفورية (مفصل)
                </button>
              </div>

              {invoiceSubView === 'invoices' && (
                <div>
                  {invoiceFilterStatus === 'late' && (
                    <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/90 rounded-2xl shadow-2xs text-amber-900 text-xs animate-in fade-in duration-200">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 shadow-2xs">
                          <AlertTriangle className="w-4 h-4 animate-pulse" />
                        </div>
                        <div>
                          <div className="font-extrabold text-sm text-amber-950">تصفية الفواتير المتأخرة</div>
                          <div className="text-[11px] text-amber-800">
                            يتم الآن عرض الفواتير التي تجاوزت فترة السداد المحددة ({filteredInvoices.length} فاتورة متأخرة).
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => setInvoiceFilterStatus('all')}
                        className="self-end sm:self-center px-3 py-1.5 bg-white hover:bg-amber-100/60 text-amber-800 border border-amber-200 rounded-xl font-bold text-xs transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        عرض كافة الفواتير
                      </button>
                    </div>
                  )}

                  {/* Invoices Table */}
                  <div className="bg-white border border-slate-100 rounded-2xl shadow-2xs overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-right border-collapse">
                        <thead>
                          <tr className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-100">
                            <th className="py-3 px-4 w-[15%]">
                              <button onClick={() => handleSort('invoiceNumber')} className="font-bold hover:text-blue-600 transition-colors flex items-center gap-1 cursor-pointer">
                                رقم الفاتورة / التاريخ {sortConfig?.key === 'invoiceNumber' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                              </button>
                            </th>
                            <th className="py-3 px-4 w-[25%]">
                              <button onClick={() => handleSort('customerName')} className="font-bold hover:text-blue-600 transition-colors flex items-center gap-1 cursor-pointer">
                                العميل / الخدمات {sortConfig?.key === 'customerName' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                              </button>
                            </th>
                            <th className="py-3 px-4 text-center w-[10%]">
                              <button onClick={() => handleSort('totalAmount')} className="w-full text-center font-bold hover:text-blue-600 transition-colors flex items-center justify-center gap-1 cursor-pointer">
                                الإجمالي {sortConfig?.key === 'totalAmount' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                              </button>
                            </th>
                            <th className="py-3 px-4 text-center w-[10%]">
                              <button onClick={() => handleSort('paidAmount')} className="w-full text-center font-bold hover:text-blue-600 transition-colors flex items-center justify-center gap-1 cursor-pointer">
                                المدفوع {sortConfig?.key === 'paidAmount' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                              </button>
                            </th>
                            <th className="py-3 px-4 text-center w-[10%]">
                              <button onClick={() => handleSort('remainingAmount')} className="w-full text-center font-bold hover:text-blue-600 transition-colors flex items-center justify-center gap-1 cursor-pointer">
                                المتبقي {sortConfig?.key === 'remainingAmount' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                              </button>
                            </th>
                            <th className="py-3 px-4 text-center w-[10%]">
                              <button onClick={() => handleSort('status')} className="w-full text-center font-bold hover:text-blue-600 transition-colors flex items-center justify-center gap-1 cursor-pointer">
                                الحالة {sortConfig?.key === 'status' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                              </button>
                            </th>
                            <th className="py-3 px-4 text-center w-[10%]">
                              <button onClick={() => handleSort('createdBy')} className="w-full text-center font-bold hover:text-blue-600 transition-colors flex items-center justify-center gap-1 cursor-pointer">
                                أنشئت بواسطة {sortConfig?.key === 'createdBy' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                              </button>
                            </th>
                            <th className="py-3 px-4 text-center w-[20%]">الإجراءات</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100/60">
                          {filteredInvoices.length > 0 ? (
                            filteredInvoices.map(inv => {
                              const customer = customers.find(c => c.id === inv.customerId);
                              const dp = inv.downPayment || 0;
                              const tp = inv.payments?.reduce((s, p) => s + p.amount, 0) || 0;
                              const remaining = inv.totalAmount - dp - tp;
                              const isSelected = selectedInvoiceId === inv.id;
                              
                              return (
                                <tr 
                                  key={inv.id} 
                                  className={`hover:bg-slate-50 hover:shadow-2xs transition-all duration-200 group cursor-pointer ${
                                    isSelected 
                                      ? 'selected-invoice bg-blue-50 hover:bg-blue-100 shadow-[inset_0_0_0_1px_#bfdbfe]' 
                                      : (isInvoiceLate(inv) ? 'bg-rose-50/30 border-r-4 border-r-rose-500' : '')
                                  }`} 
                                  onClick={(e) => {
                                    if (!(e.target as HTMLElement).closest("button, select, input, a")) {
                                      setSelectedInvoiceId(inv.id);
                                      setInvoiceToPrint(inv);
                                      setIsPrintOpen(true);
                                    }
                                  }}
                                >
                                  <td className="p-4">
                                    <div className="font-bold text-slate-700">{inv.invoiceNumber}</div>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <div className="text-[10px] text-slate-400">{new Date(inv.createdAt).toLocaleDateString("ar-OM")}</div>
                                      {isInvoiceLate(inv) && (
                                        <span className="text-[9px] font-bold bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded-full">متأخرة</span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="p-4">
                                    <div className="font-bold text-slate-800">{customer?.name || "عميل غير معروف"}</div>
                                    <div className="text-[10px] text-slate-500 mt-1 line-clamp-1">{inv.items.map(i => i.serviceName).join(" + ")}</div>
                                  </td>
                                  <td className="p-4 text-center font-mono font-bold text-slate-700">{inv.totalAmount.toFixed(3)}</td>
                                  <td className="p-4 text-center font-mono text-emerald-600">
                                    <div>{dp > 0 ? dp.toFixed(3) : "-"}</div>
                                    {dp > 0 && inv.payments && inv.payments.length > 0 && inv.payments[inv.payments.length - 1].method && (
                                      <div className="text-[9px] font-sans font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded w-max mx-auto mt-1">
                                        {inv.payments[inv.payments.length - 1].method === "cash" ? "نقداً" : inv.payments[inv.payments.length - 1].method === "pos" ? "جهاز POS" : "تحويل بنكي"}
                                      </div>
                                    )}
                                  </td>
                                  <td className="p-4 text-center font-mono text-rose-600">{remaining > 0 ? remaining.toFixed(3) : "-"}</td>
                                  <td className="p-4 text-center">
                                    {isInvoiceLate(inv) ? (
                                      <div className="flex items-center justify-center gap-1.5">
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleViewLateInvoices(e);
                                          }}
                                          title="فاتورة متأخرة عن السداد - انقر لتصفية وعرض كافة الفواتير المتأخرة"
                                          className="px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center font-sans bg-rose-500/10 text-rose-700 border border-rose-200/70 hover:bg-rose-100 transition-colors cursor-pointer"
                                        >
                                          {inv.status === "paid" ? "مدفوعة" : inv.status === "partially_paid" ? "مدفوعة جزئياً" : inv.status === "draft" ? "مسودة" : "غير مدفوعة"}
                                        </button>

                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleViewLateInvoices(e);
                                          }}
                                          title="تنبيه: فاتورة متأخرة عن السداد - انقر لعرض وتصفية كافة الفواتير المتأخرة"
                                          className="relative flex items-center justify-center shrink-0 cursor-pointer p-1 -m-1 group/late-cell focus:outline-none"
                                        >
                                          {/* Diffusion Ring 1 (حلقة انتشار ضبابية تتسع وتتلاشى للخارج) */}
                                          <span className="absolute inset-0 m-auto w-5 h-5 rounded-full border border-amber-400/60 blur-[0.5px] late-ring-1 pointer-events-none" />

                                          {/* Diffusion Ring 2 (حلقة انتشار ضبابية ثانية تتسع وتتلاشى بالتناوب) */}
                                          <span className="absolute inset-0 m-auto w-5 h-5 rounded-full border border-orange-400/50 blur-[0.5px] late-ring-2 pointer-events-none" />

                                          {/* Main Notification Circle Badge: خلفية كريمية دافئة، حد برتقالي خفيف، توهج ناعم واهتزاز متناسق */}
                                          <span className="relative z-10 flex items-center justify-center w-5 h-5 rounded-full bg-gradient-to-b from-[#fffdf5] to-[#fef3c7] border border-amber-300 text-amber-900 shadow-xs late-badge-glow late-badge-shake hover:scale-125 active:scale-95 transition-transform duration-150">
                                            <AlertTriangle className="w-2.5 h-2.5 text-amber-800" />
                                          </span>
                                        </button>
                                      </div>
                                    ) : (
                                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-block font-sans ${inv.status === "paid" ? "bg-emerald-500/10 text-emerald-700 border border-emerald-200/50" : inv.status === "partially_paid" ? "bg-amber-500/10 text-amber-700 border border-amber-200/50" : inv.status === "draft" ? "bg-slate-100 text-slate-600 border border-slate-200/50" : "bg-rose-500/10 text-rose-700 border border-rose-200/50"}`}>
                                        {inv.status === "paid" ? "مدفوعة" : inv.status === "partially_paid" ? "مدفوعة جزئياً" : inv.status === "draft" ? "مسودة" : "غير مدفوعة"}
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-4 text-center text-slate-600 font-medium text-xs">
                                    {inv.createdBy || inv.lastModifiedBy || 'مدير النظام'}
                                  </td>
                                  <td className="p-4">
                                    <div className="flex items-center justify-center gap-1.5">
                                      <button 
                                        onClick={() => { setSelectedInvoiceId(inv.id); setInvoiceToPrint(inv); setIsPrintOpen(true); }} 
                                        className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 hover:scale-110 active:scale-95 rounded-lg transition-all duration-200 cursor-pointer"
                                        title="معاينة الفاتورة قبل الطباعة"
                                      >
                                        <Eye className="w-4 h-4" />
                                      </button>
                                      <button 
                                        onClick={() => directPrintInvoice(inv, customer, undefined, branches, systemSettings)} 
                                        className="p-1.5 text-slate-600 hover:text-teal-600 hover:bg-teal-50 hover:scale-110 active:scale-95 rounded-lg transition-all duration-200 cursor-pointer"
                                        title="طباعة مباشرة"
                                      >
                                        <Printer className="w-4 h-4" />
                                      </button>
                                      {currentUser?.permissions?.editInvoice && (
                                        <button 
                                          onClick={() => { setSelectedInvoiceId(inv.id); setInvoiceToEdit(inv); setIsInvoiceModalOpen(true); }} 
                                          className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 hover:scale-110 active:scale-95 rounded-lg transition-all duration-200 cursor-pointer"
                                          title="تعديل الفاتورة"
                                        >
                                          <Edit2 className="w-4 h-4" />
                                        </button>
                                      )}
                                      {currentUser?.permissions?.deleteInvoice && (
                                        <button 
                                          onClick={() => requestDeleteInvoice(inv.id, inv.invoiceNumber)} 
                                          className="p-1.5 text-slate-600 hover:text-rose-500 hover:bg-rose-50 hover:scale-110 active:scale-95 rounded-lg transition-all duration-200 cursor-pointer"
                                          title="حذف الفاتورة"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan={8} className="p-12 text-center text-slate-400 italic">
                                🔍 لم يتم العثور على أي فواتير تطابق معايير التصفية الحالية
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Footer Excel Export - Small & Faint Style */}
                    <div className="flex justify-center items-center py-2 mt-2">
                      <button
                        type="button"
                        onClick={() => {
                          const branchConfigUser = users.find(u => u.id === 'branches_config');
                          const branches = branchConfigUser?.branches || [];
                          exportInvoicesToExcel(filteredInvoices, customers, branches);
                        }}
                        className="flex items-center gap-1.5 text-[10px] text-slate-400/80 hover:text-teal-600 transition-all cursor-pointer font-bold py-1 px-3.5 hover:bg-slate-100/50 rounded-lg border border-transparent hover:border-slate-200/40"
                        title="تحميل البيانات المفلترة في ملف Excel منسق بالكامل"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-slate-400" />
                        <span>تنزيل كافة بيانات الفواتير وسجل الدفعات بصيغة إكسل (Excel)</span>
                      </button>
                    </div>
                  </div>

            </div>
            )}

            {/* Instant Amounts List Grid */}
            {invoiceSubView === 'instantAmounts' && (
              <div className="bg-white border border-slate-100 rounded-2xl shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-right border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-100">
                        <th className="py-2 px-4 w-[10%] resize-x overflow-auto">
                          <button onClick={() => handleItemsSort('invoiceNumber')} className="font-bold hover:text-blue-600 transition-colors flex items-center gap-1">رقم الفاتورة {itemsSortConfig?.key === 'invoiceNumber' && (itemsSortConfig.direction === 'asc' ? '↑' : '↓')}</button>
                        </th>
                        <th className="py-2 px-2 w-[9%] resize-x overflow-auto">
                          <button onClick={() => handleItemsSort('invoiceLastModifiedBy')} className="font-bold hover:text-blue-600 transition-colors flex items-center gap-1">حُرِّرَتْ بواسطة {itemsSortConfig?.key === 'invoiceLastModifiedBy' && (itemsSortConfig.direction === 'asc' ? '↑' : '↓')}</button>
                        </th>
                        <th className="py-2 px-4 w-[12%] resize-x overflow-auto">
                          <button onClick={() => handleItemsSort('customerName')} className="font-bold hover:text-blue-600 transition-colors flex items-center gap-1">العميل {itemsSortConfig?.key === 'customerName' && (itemsSortConfig.direction === 'asc' ? '↑' : '↓')}</button>
                        </th>
                        <th className="py-2 px-4 w-[15%] resize-x overflow-auto">
                          <button onClick={() => handleItemsSort('serviceName')} className="font-bold hover:text-blue-600 transition-colors flex items-center gap-1">اسم الخدمة {itemsSortConfig?.key === 'serviceName' && (itemsSortConfig.direction === 'asc' ? '↑' : '↓')}</button>
                        </th>
                        <th className="py-2 px-4 text-center w-[10%] resize-x overflow-auto">
                          <button onClick={() => handleItemsSort('employeeName')} className="w-full text-center font-bold hover:text-blue-600 transition-colors flex items-center justify-center gap-1">الموظف {itemsSortConfig?.key === 'employeeName' && (itemsSortConfig.direction === 'asc' ? '↑' : '↓')}</button>
                        </th>
                        <th className="py-2 px-4 text-center w-[8%] resize-x overflow-auto">
                          <button onClick={() => handleItemsSort('price')} className="w-full text-center font-bold hover:text-blue-600 transition-colors flex items-center justify-center gap-1">السعر {itemsSortConfig?.key === 'price' && (itemsSortConfig.direction === 'asc' ? '↑' : '↓')}</button>
                        </th>
                        <th className="py-2 px-4 text-center w-[8%] text-orange-600 resize-x overflow-auto">
                          <button onClick={() => handleItemsSort('discount')} className="w-full text-center font-bold hover:text-orange-600 transition-colors flex items-center justify-center gap-1">الخصم {itemsSortConfig?.key === 'discount' && (itemsSortConfig.direction === 'asc' ? '↑' : '↓')}</button>
                        </th>
                        <th className="py-2 px-2 text-center w-[5%] resize-x overflow-auto">
                          <button onClick={() => handleItemsSort('quantity')} className="w-full text-center font-bold hover:text-blue-600 transition-colors flex items-center justify-center gap-1">الكمية {itemsSortConfig?.key === 'quantity' && (itemsSortConfig.direction === 'asc' ? '↑' : '↓')}</button>
                        </th>
                        <th className="py-2 px-4 text-center w-[8%] text-slate-500 resize-x overflow-auto">
                          <button onClick={() => handleItemsSort('total')} className="w-full text-center font-bold hover:text-slate-600 transition-colors flex items-center justify-center gap-1">الإجمالي {itemsSortConfig?.key === 'total' && (itemsSortConfig.direction === 'asc' ? '↑' : '↓')}</button>
                        </th>
                        <th className="py-2 px-4 text-center w-[8%] text-rose-600 resize-x overflow-auto">
                          <button onClick={() => handleItemsSort('invoiceRemainingAmount')} className="w-full text-center font-bold hover:text-rose-700 transition-colors flex items-center justify-center gap-1">المتبقي {itemsSortConfig?.key === 'invoiceRemainingAmount' && (itemsSortConfig.direction === 'asc' ? '↑' : '↓')}</button>
                        </th>
                        <th className="py-2 px-4 text-center w-[8%] text-emerald-600 resize-x overflow-auto">
                          <button onClick={() => handleItemsSort('invoicePaidAmount')} className="w-full text-center font-bold hover:text-emerald-700 transition-colors flex items-center justify-center gap-1">المدفوع {itemsSortConfig?.key === 'invoicePaidAmount' && (itemsSortConfig.direction === 'asc' ? '↑' : '↓')}</button>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100/60" id="instant-amounts-table-body">
                      {filteredItems.length > 0 ? (
                        filteredItems.map((item, i) => {
                          const isSelected = selectedInvoiceId === item.invoiceId;
                        
      const getBackupData = () => ({
    version: "3.0",
    exportedAt: new Date().toISOString(),
    exportedBy: currentUser?.name || 'النظام',
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
  });
  return (
                          <tr 
                            key={i} 
                            className={`hover:bg-slate-50 hover:shadow-2xs transition-all duration-200 cursor-pointer ${isSelected ? 'selected-invoice bg-blue-50 hover:bg-blue-100 shadow-[inset_0_0_0_1px_#bfdbfe]' : ''}`}
                            onClick={() => {
                              const inv = isolatedInvoices.find(inv => inv.id === item.invoiceId);
                              if (inv) {
                                setSelectedInvoiceId(inv.id);
                                setInvoiceToPrint(inv);
                                setIsPrintOpen(true);
                              }
                            }}
                          >
                            <td className="p-4">
                              <span className="font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded font-mono text-[11px] block">{item.invoiceNumber}</span>
                              <span className="text-[10px] text-slate-400 font-mono block mt-1">
                                {new Date(item.invoiceDate).toLocaleDateString('ar-OM')}
                              </span>
                            </td>
                            <td className="py-4 px-2">
                              <div className="flex flex-col gap-1">
                                <span className="font-bold text-slate-800 text-[11px] truncate" title={item.invoiceLastModifiedBy || item.invoiceCreatedBy}>
                                  {item.invoiceLastModifiedBy || item.invoiceCreatedBy}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {new Date(item.invoiceLastModifiedAt || item.invoiceDate).toLocaleDateString('ar-OM')}
                                </span>
                              </div>
                            </td>
                            <td className="p-4">
                              <span className="font-bold text-slate-800 text-[11px] block">{item.customerName}</span>
                            </td>
                            <td className="p-4">
                              <span className="font-bold text-slate-700 text-[11px]">{item.serviceName}</span>
                            </td>
                            <td className="p-4 text-center">
                              <span className="font-bold text-slate-700 text-[11px]">{item.employeeName}</span>
                            </td>
                            <td className="p-4 text-center text-slate-700 font-mono text-[11px]">
                              {item.price.toFixed(3)}
                            </td>
                            <td className="p-4 text-center text-orange-600 font-mono text-[11px]">
                              {item.discount.toFixed(3)}
                            </td>
                            <td className="py-4 px-2 text-center text-slate-700 font-mono text-[11px]">
                              {item.quantity}
                            </td>
                            <td className="p-4 text-center font-bold text-slate-500 font-mono text-[12px]">
                              {item.total.toFixed(3)}
                            </td>
                            <td className="p-4 text-center font-bold text-rose-600 font-mono text-[12px]">
                              {item.invoiceRemainingAmount.toFixed(3)}
                            </td>
                            <td className="p-4 text-center font-bold text-emerald-600 font-mono text-[12px]">
                              {item.invoicePaidAmount.toFixed(3)}
                            </td>
                          </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={11} className="p-12 text-center text-slate-400 font-bold text-sm">
                            🔍 لم يتم العثور على أي بنود تطابق معايير التصفية الحالية
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              {/* Footer Excel Export - Small & Faint Style */}
              <div className="flex justify-center items-center py-2 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    const branchConfigUser = users.find(u => u.id === 'branches_config');
                    const branches = branchConfigUser?.branches || [];
                    exportInvoicesToExcel(filteredInvoices, customers, branches);
                  }}
                  className="flex items-center gap-1.5 text-[10px] text-slate-400/80 hover:text-teal-600 transition-all cursor-pointer font-bold py-1 px-3.5 hover:bg-slate-100/50 rounded-lg border border-transparent hover:border-slate-200/40"
                  title="تحميل البيانات المفلترة في ملف Excel منسق بالكامل"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-slate-400" />
                  <span>تنزيل كافة بيانات الفواتير وسجل الدفعات بصيغة إكسل (Excel)</span>
                </button>
              </div>
            </div>
            )}
            </div>
          )}
            </div>

            {(() => {
              const chatBranchId = currentUser?.role === 'admin'
                ? (adminSelectedBranchId === 'all' ? 'branch-1' : adminSelectedBranchId)
                : (currentUser?.branchId || 'branch-1');
              const chatBranchName = branches.find(b => b.id === chatBranchId)?.name || 'الفرع الرئيسي';
              const chatChannelId = `general-${chatBranchId}`;
              const chatTitle = `شات فرع: ${chatBranchName}`;
              const chatPlaceholder = `اكتب رسالة لموظفي فرع ${chatBranchName} هنا...`;

            
      const getBackupData = () => ({
    version: "3.0",
    exportedAt: new Date().toISOString(),
    exportedBy: currentUser?.name || 'النظام',
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
  });
  return (
                <>
                  {/* General Chat Sidebar (rendered when docked) */}
                  {chatMode === 'docked' && (
                    <>
                      {/* Desktop Resizable Chat Sidebar */}
                      <div 
                        className="hidden lg:block shrink-0 relative"
                        style={{ width: `${chatWidth}px` }}
                      >
                        {/* Resizing Handle - styled beautifully with cursor-col-resize and hover transitions */}
                        <div
                          className="absolute top-0 bottom-0 -right-3.5 w-2.5 cursor-col-resize hover:bg-teal-500/30 active:bg-teal-600/50 transition-colors group flex items-center justify-center z-20"
                          title="اسحب لتغيير عرض الشات"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            const startX = e.clientX;
                            const startWidth = chatWidth;
                            
                            const handleMouseMove = (moveEvent: MouseEvent) => {
                              const deltaX = moveEvent.clientX - startX;
                              // Since the sidebar is on the left in RTL, dragging right (positive deltaX) increases the sidebar width
                              const newWidth = Math.max(240, Math.min(600, startWidth + deltaX));
                              setChatWidth(newWidth);
                              localStorage.setItem('riyadah_chat_width', String(newWidth));
                            };
                            
                            const handleMouseUp = () => {
                              document.removeEventListener('mousemove', handleMouseMove);
                              document.removeEventListener('mouseup', handleMouseUp);
                            };
                            
                            document.addEventListener('mousemove', handleMouseMove);
                            document.addEventListener('mouseup', handleMouseUp);
                          }}
                        >
                          <div className="w-0.5 h-16 bg-slate-200 group-hover:bg-teal-500 rounded-full transition-colors" />
                        </div>

                        <div className="sticky top-6">
                          <ChatBox users={users}
                            channelId={chatChannelId}
                            currentUser={currentUser}
                            title={chatTitle}
                            placeholder={chatPlaceholder}
                            heightClass="h-[550px]"
                            currentMode="docked"
                            onModeChange={handleChatModeChange}
                          />
                        </div>
                      </div>

                      {/* Mobile Fallback - non-resizable, full width block */}
                      <div className="block lg:hidden w-full">
                        <ChatBox users={users}
                          channelId={chatChannelId}
                          currentUser={currentUser}
                          title={chatTitle}
                          placeholder={chatPlaceholder}
                          heightClass="h-[400px]"
                          currentMode="docked"
                          onModeChange={handleChatModeChange}
                        />
                      </div>
                    </>
                  )}

                  {/* Floating Draggable Chat (rendered when floating) */}
                  {chatMode === 'floating' && (
                    <ChatBox users={users}
                      channelId={chatChannelId}
                      currentUser={currentUser}
                      title={chatTitle}
                      placeholder={chatPlaceholder}
                      heightClass="h-[380px]"
                      currentMode="floating"
                      onModeChange={handleChatModeChange}
                    />
                  )}
                </>
              );
            })()}

            {/* Floating Toggle Activator Badge when hidden */}
            {chatMode === 'hidden' && (
              <div className="fixed bottom-6 left-6 z-[9998]">
                <motion.button
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleChatModeChange('floating')}
                  className="bg-teal-600 hover:bg-teal-700 text-white rounded-full px-5 py-3.5 shadow-xl flex items-center gap-2 cursor-pointer border border-teal-500/20 font-bold"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span className="text-xs">فتح شات الموظفين</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                </motion.button>
              </div>
            )}

        {/* VIEW 2: CUSTOMERS */}
        {activeSection === 'customers' && (
          isRestrictedRole ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center space-y-4 bg-white rounded-2xl border border-rose-100 p-8 shadow-sm">
              <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center shadow-inner">
                <Lock className="w-10 h-10" />
              </div>
              <div className="space-y-2 max-w-md">
                <p className="text-slate-800 font-bold text-lg leading-relaxed">
                  عذراً، أنت لا تملك الصلاحية للوصول إلى هذه الصفحة.<br />
                  <span className="text-sm text-slate-500 mt-1 block font-mono">Access Denied: You do not have permission to access this page.</span>
                </p>
              </div>
            </div>
          ) : (
            <CustomersSection
              systemSettings={systemSettings}
              customers={isolatedCustomers}
              invoices={isolatedInvoices}
              onOpenCustomerModal={(cust) => {
                setCustomerToEdit(cust || null);
                setIsCustomerModalOpen(true);
              }}
              onDeleteCustomer={handleDeleteCustomer}
              currentUserRole={currentUser.role}
              currentUser={currentUser}
              branches={branches}
            />
          )
        )}

        {/* VIEW 3: ACCOUNTS CLOSING */}
        {activeSection === 'closing' && (
          <AccountsClosingSection
            customers={currentUser?.role === 'admin' && adminSelectedBranchId === 'all' ? isolatedCustomers : customers.filter(c => isolatedInvoices.some(inv => inv.customerId === c.id))}
            invoices={isolatedInvoices}
            onUpdateCustomerStatus={handleUpdateCustomerStatus}
            onSettleCustomerInvoices={handleSettleCustomerInvoices}
            onLogActivity={logActivity}
          />
        )}

        {/* VIEW 4: REPORTS AND ANALYTICS */}
        {activeSection === 'reports' && currentUser.permissions.viewReports && (
          <Reports
            invoices={isolatedInvoices}
            customers={isolatedCustomers}
            logs={isolatedLogs}
            users={users}
            branches={branches}
            tickets={tickets}
            warnings={warnings}
            mails={mails}
            privateMessages={privateMessages}
            initialTab="monthly"
            onDayDoubleClick={(year, month, day) => setDayInvoicesModalDate({year, month, day})}
          />
        )}

        {/* VIEW: PROFILE SECTION */}
        {activeSection === 'profile' && (
          <ProfileSection
            currentUser={currentUser}
            users={users}
            warnings={warnings}
            setWarnings={setWarnings}
            invoices={invoices}
            branches={branches}
            setUsers={setUsers}
            tickets={tickets}
            onOpenPasswordModal={(userId?: string) => setPasswordModalTargetId(userId || currentUser.id)}
          />
        )}

        {/* VIEW: CHAT & MAIL SECTION */}
        {activeSection === 'chat-mail' && (
          <ChatMailSection
            currentUser={currentUser}
            users={users}
            mails={mails}
            setMails={setMails}
            privateMessages={privateMessages}
            setPrivateMessages={setPrivateMessages}
          />
        )}

        {/* VIEW 5.5: OPERATIONS LOG */}
        {activeSection === 'operations-log' && (
          <OperationsLogSection logs={isolatedLogs} users={users} />
        )}

        {/* VIEW 5: SETTINGS AND ACCESS ROLES */}
        {activeSection === 'settings' && (
          <SettingsSection
            users={users}
            logs={logs}
            customers={customers}
            invoices={invoices}
            services={services}
            setServices={setServices}
            currentUserId={currentUserId}
            onSetCurrentUser={setCurrentUserId}
            onStartSimulation={handleStartSimulation}
            onAddUser={handleAddUser}
            onDeleteUser={handleDeleteUser}
            onUpdateUserPermissions={handleUpdateUserPermissions}
            onUpdateUserRole={handleUpdateUserRole}
            onImportBackup={handleImportBackup}
            onResetDatabase={handleResetDatabase}
            branches={branches}
            onAddBranch={handleAddBranch}
            onTransferUser={handleTransferUser}
            onUpdateBranch={handleUpdateBranch}
            onDeleteBranch={handleDeleteBranch}
            ticketTypes={ticketTypes}
            onUpdateTicketTypes={handleUpdateTicketTypes}
            ticketTypePlaceholders={ticketTypePlaceholders}
            onUpdateTicketTypePlaceholders={handleUpdateTicketTypePlaceholders}
            ticketManagers={ticketManagers}
            onUpdateTicketManagers={handleUpdateTicketManagers}
            onUpdateWarningTypes={handleUpdateWarningTypes}
            onUpdateCustodyCategories={handleUpdateCustodyCategories}
            onUpdateSystemSettings={handleUpdateSystemSettings}
            tickets={tickets}
            warnings={warnings}
            mails={mails}
            privateMessages={privateMessages}
            deletedInvoices={deletedInvoices}
            onDownloadGuideWord={() => {
              setActiveSection('guide');
              setTimeout(() => {
                window.dispatchEvent(new CustomEvent('download-word'));
              }, 500);
            }}
            onDownloadGuidePdf={() => {
              setActiveSection('guide');
              setTimeout(() => {
                window.dispatchEvent(new CustomEvent('download-pdf-all'));
              }, 500);
            }}
          />
        )}

        {/* VIEW 5.5: SUPPORT TICKETS & ADMINISTRATIVE DEPT */}
        {activeSection === 'tickets' && (
          <TicketsSection
            tickets={tickets}
            setTickets={setTickets}
            currentUser={currentUser}
            branches={branches}
            ticketTypes={ticketTypes}
            ticketTypePlaceholders={ticketTypePlaceholders}
            ticketManagers={ticketManagers}
            users={users}
          />
        )}

        {/* VIEW 6: ABOUT SYSTEM */}
        {activeSection === 'about' && (
          <AboutSection systemSettings={systemSettings} />
        )}

        {/* VIEW 6.5: EDUCATIONAL USER GUIDE */}
        {activeSection === 'guide' && (
          <UserGuideSection systemSettings={systemSettings} />
        )}

        {/* VIEW 7: RECYCLE BIN (TRASH) */}
        {activeSection === 'trash' && (
          <TrashSection
            deletedInvoices={deletedInvoices}
            customers={customers}
            onPreviewInvoice={(previewInvoice) => {
              setInvoiceToPrint(previewInvoice);
              setIsPrintOpen(true);
            }}
            currentUserRole={currentUser.role}
            onRestoreInvoice={handleRestoreInvoice}
            onPermanentDeleteInvoice={handlePermanentDeleteInvoice}
            isGuest={currentUser?.id === 'guest'}
          />
        )}

        {/* VIEW 8: DATABASE CENTER */}
        {activeSection === 'database' && (
          <DatabaseCenter
            customers={customers}
            invoices={invoices}
            users={users}
            logs={logs}
            services={services}
            tickets={tickets}
            deletedInvoices={deletedInvoices}
            warnings={warnings}
            mails={mails}
            privateMessages={privateMessages}
            setCustomers={setCustomers}
            setInvoices={setInvoices}
            setUsers={setUsers}
            setLogs={setLogs}
            setServices={setServices}
            setTickets={setTickets}
            setWarnings={setWarnings}
            setMails={setMails}
            setPrivateMessages={setPrivateMessages}
            setDeletedInvoices={setDeletedInvoices}
            currentUser={currentUser}
          />
        )}

      </main>

      {/* --- ALL POPUP MODAL WRAPPERS --- */}

      {/* 1. Invoice Modal Popup */}
      {showLateInvoicesAlert && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 font-sans" dir="rtl">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 text-center space-y-4">
              <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <AlertTriangle className="w-8 h-8 animate-pulse" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">تنبيه: فواتير متأخرة!</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                يوجد لديك <span className="font-bold text-rose-600 mx-1">{lateInvoicesCountForUser}</span> فواتير متأخرة من إنشائك. يرجى مراجعتها.
              </p>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center gap-3">
              <button
                onClick={() => setShowLateInvoicesAlert(false)}
                className="flex-1 py-2.5 px-4 bg-white text-slate-700 font-bold text-sm rounded-xl border border-slate-200 hover:bg-slate-50 hover:text-slate-900 transition-colors"
              >
                تجاهل الآن
              </button>
              <button
                onClick={() => {
                  setShowLateInvoicesAlert(false);
                  setActiveSection('invoices');
                  setInvoiceFilterCreatedBy([currentUser?.name || '']);
                  setInvoiceFilterStatus('late');
                }}
                className="flex-1 py-2.5 px-4 bg-rose-600 text-white font-bold text-sm rounded-xl hover:bg-rose-700 hover:shadow-lg hover:shadow-rose-500/30 transition-all active:scale-95"
              >
                مراجعة الفواتير
              </button>
            </div>
          </div>
        </div>
      )}

      <InvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => {
          setIsInvoiceModalOpen(false);
          setInvoiceToEdit(null);
        }}
        onSave={handleSaveInvoice}
        onPreview={(previewInvoice) => {
          setInvoiceToPrint(previewInvoice);
          setIsPrintOpen(true);
        }}
        customers={customers.filter(c => c.status !== 'closed')} // Don't issue invoices to closed accounts
        services={services}
        users={users}
        invoiceToEdit={invoiceToEdit}
        currentUsername={currentUser.name}
        currentUserRole={currentUser.role}
        onSaveCustomer={handleSaveCustomer}
        systemSettings={systemSettings}
      />

      {/* 2. Customer Modal Popup */}
      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => {
          setIsCustomerModalOpen(false);
          setCustomerToEdit(null);
        }}
        onSave={handleSaveCustomer}
        customerToEdit={customerToEdit}
        customers={customers}
        currentUsername={currentUser.name}
        isAdmin={currentUser?.role === 'admin'}
        users={users}
        systemSettings={systemSettings}
      />

      {/* 3. Official Invoice Print Modal Popup */}
      <InvoicePrint
        isOpen={isPrintOpen}
        onClose={() => {
          setIsPrintOpen(false);
          setInvoiceToPrint(null);
        }}
        invoice={invoiceToPrint}
        customers={customers}
        currentUser={currentUser}
        deletedInvoices={deletedInvoices}
        branches={branches}
        users={users}
        systemSettings={systemSettings}
        onEdit={(inv) => {
          setIsPrintOpen(false);
          setInvoiceToPrint(null);
          setInvoiceToEdit(inv);
          setSelectedInvoiceId(inv.id);
          setIsInvoiceModalOpen(true);
        }}
      />

      {/* 4. Change Password Modal Popup */}
      <ChangePasswordModal
        isOpen={!!passwordModalTargetId}
        onClose={() => setPasswordModalTargetId(null)}
        targetUser={users.find(u => u.id === passwordModalTargetId) || currentUser}
        isAdminReset={currentUser.role === 'admin' && passwordModalTargetId !== currentUser.id}
        onUpdatePassword={handleUpdatePassword}
      />

      {/* 5. Delete Confirmation Modal */}
      {isDeleteConfirmOpen && invoiceToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 font-sans" dir="rtl">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center space-y-4">
              <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto">
                <Trash2 className="w-8 h-8 text-rose-600" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-slate-800">تأكيد الحذف</h3>
                <p className="text-sm text-slate-500">
                  هل أنت متأكد من حذف الفاتورة <span className="font-bold text-slate-700">{invoiceToDelete.number}</span> نهائياً؟ لا يمكن التراجع عن هذا الإجراء.
                </p>
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center gap-3">
              <button
                onClick={cancelDeleteInvoice}
                className="flex-1 py-2.5 px-4 bg-white text-slate-700 font-bold text-sm rounded-xl border border-slate-200 hover:bg-slate-50 hover:text-slate-900 transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={confirmDeleteInvoice}
                className="flex-1 py-2.5 px-4 bg-rose-600 text-white font-bold text-sm rounded-xl hover:bg-rose-700 hover:shadow-md hover:shadow-rose-500/20 transition-all"
              >
                نعم، احذف الفاتورة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Day Invoices Modal */}
      {dayInvoicesModalDate && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setDayInvoicesModalDate(null)}></div>
          <div className="relative w-full max-w-6xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                   <Calendar className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-slate-800">
                  {(() => {
                    const date = new Date(dayInvoicesModalDate.year, dayInvoicesModalDate.month, dayInvoicesModalDate.day);
                    return date.toLocaleDateString('ar-OM', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                  })()}
                </h2>
              </div>
              <div className="flex items-center gap-3">
                {systemSettings.enableNewInvoice !== false && (
                <button
                  onClick={() => {
                    setInvoiceToEdit(null);
                    setIsInvoiceModalOpen(true);
                  }}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm shadow-blue-500/20 active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  إصدار فاتورة جديدة
                </button>
                )}
                <button
                  onClick={() => setDayInvoicesModalDate(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-50" dir="rtl">
              {(() => {
                let dayModalInvoices = isolatedInvoices.filter(inv => {
                  if (inv.status === 'draft') return false;
                  const d = new Date(inv.createdAt);
                  return d.getFullYear() === dayInvoicesModalDate.year && 
                         d.getMonth() === dayInvoicesModalDate.month && 
                         d.getDate() === dayInvoicesModalDate.day;
                });
                
                const statsTotalBilled = dayModalInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
                const statsTotalPaid = dayModalInvoices.reduce((sum, inv) => {
                  const down = inv.downPayment || 0;
                  const parts = inv.payments?.reduce((s, p) => s + p.amount, 0) || 0;
                  return sum + down + parts;
                }, 0);
                const statsTotalOutstanding = dayModalInvoices.reduce((sum, inv) => {
                  const down = inv.downPayment || 0;
                  const parts = inv.payments?.reduce((s, p) => s + p.amount, 0) || 0;
                  return sum + (inv.totalAmount - down - parts);
                }, 0);
                const statsUnpaidCount = dayModalInvoices.filter(inv => inv.status === 'unpaid' || inv.status === 'partially_paid').length;

                if (sortConfig) {
                  dayModalInvoices.sort((a, b) => {
                    const direction = sortConfig.direction === 'asc' ? 1 : -1;
                    let valA = a[sortConfig.key];
                    let valB = b[sortConfig.key];

                    if (sortConfig.key === 'customerName') {
                      valA = customers.find(c => c.id === a.customerId)?.name || '';
                      valB = customers.find(c => c.id === b.customerId)?.name || '';
                    } else if (sortConfig.key === 'remainingAmount') {
                      valA = a.totalAmount - (a.downPayment || 0) - (a.payments?.reduce((s, p) => s + p.amount, 0) || 0);
                      valB = b.totalAmount - (b.downPayment || 0) - (b.payments?.reduce((s, p) => s + p.amount, 0) || 0);
                    }

                    if (valA < valB) return -1 * direction;
                    if (valA > valB) return 1 * direction;
                    return 0;
                  });
                }
                
              
      const getBackupData = () => ({
    version: "3.0",
    exportedAt: new Date().toISOString(),
    exportedBy: currentUser?.name || 'النظام',
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
  });
  return (
                  <>
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-sm flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-500">إجمالي المبالغ المفوترة</span>
                          <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                            <FileText className="w-4 h-4" />
                          </div>
                        </div>
                        <div className="mt-3 flex items-baseline gap-1.5">
                          <span className="text-lg font-black text-blue-600 font-mono">{statsTotalBilled.toFixed(3)}</span>
                          <span className="text-[10px] font-bold text-slate-400">ر.ع.</span>
                        </div>
                      </div>

                      <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-sm flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-500">المبالغ المحصلة</span>
                          <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                            <FileCheck className="w-4 h-4" />
                          </div>
                        </div>
                        <div className="mt-3 flex items-baseline gap-1.5">
                          <span className="text-lg font-black text-emerald-600 font-mono">{statsTotalPaid.toFixed(3)}</span>
                          <span className="text-[10px] font-bold text-slate-400">ر.ع.</span>
                        </div>
                      </div>

                      <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-sm flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-500">الديون المتبقية</span>
                          <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
                            <AlertTriangle className="w-4 h-4" />
                          </div>
                        </div>
                        <div className="mt-3 flex items-baseline gap-1.5">
                          <span className="text-lg font-black text-rose-600 font-mono">{statsTotalOutstanding.toFixed(3)}</span>
                          <span className="text-[10px] font-bold text-slate-400">ر.ع.</span>
                        </div>
                      </div>

                      <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-sm flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-500">الفواتير غير المسددة</span>
                          <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                            <Layers className="w-4 h-4" />
                          </div>
                        </div>
                        <div className="mt-3 flex items-baseline gap-1.5">
                          <span className="text-lg font-black text-amber-600 font-mono">{statsUnpaidCount}</span>
                          <span className="text-[10px] font-bold text-slate-400">فاتورة</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-slate-100 rounded-2xl shadow-2xs overflow-hidden">

                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-right border-collapse">
                          <thead>
                            <tr className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-100">
                              <th className="p-4 w-[15%] resize-x overflow-auto">
                                <button onClick={() => handleSort('invoiceNumber')} className="font-bold hover:text-blue-600 transition-colors flex items-center gap-1">رقم الفاتورة {sortConfig?.key === 'invoiceNumber' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</button>
                              </th>
                              <th className="p-4 w-[25%] resize-x overflow-auto">
                                <button onClick={() => handleSort('customerName')} className="font-bold hover:text-blue-600 transition-colors flex items-center gap-1">اسم العميل والخدمة {sortConfig?.key === 'customerName' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</button>
                              </th>
                              <th className="p-4 text-center w-[12%] resize-x overflow-auto">
                                <button onClick={() => handleSort('totalAmount')} className="w-full text-center font-bold hover:text-blue-600 transition-colors flex items-center justify-center gap-1">المستحق ر.ع. {sortConfig?.key === 'totalAmount' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</button>
                              </th>
                              <th className="p-4 text-center w-[12%] resize-x overflow-auto">
                                <button onClick={() => handleSort('downPayment')} className="w-full text-center font-bold hover:text-blue-600 transition-colors flex items-center justify-center gap-1">المقدم ر.ع. {sortConfig?.key === 'downPayment' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</button>
                              </th>
                              <th className="p-4 text-center w-[12%] resize-x overflow-auto">
                                <button onClick={() => handleSort('remainingAmount')} className="w-full text-center font-bold hover:text-blue-600 transition-colors flex items-center justify-center gap-1">المتبقي ر.ع. {sortConfig?.key === 'remainingAmount' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</button>
                              </th>
                              <th className="p-4 text-center w-[12%] resize-x overflow-auto">
                                <button onClick={() => handleSort('status')} className="w-full text-center font-bold hover:text-blue-600 transition-colors flex items-center justify-center gap-1">حالة السداد {sortConfig?.key === 'status' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</button>
                              </th>
                              <th className="p-4 text-center w-[12%] resize-x overflow-auto">الإجراءات</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100/60">
                            {dayModalInvoices.length > 0 ? (
                              dayModalInvoices.map((inv) => {
                                const cust = customers.find((c) => c.id === inv.customerId);
                                const downPayment = inv.downPayment || 0;
                                const paymentsTotal = inv.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
                                const remainingAmount = inv.totalAmount - downPayment - paymentsTotal;
                                const isSelected = selectedInvoiceId === inv.id || (isPrintOpen && invoiceToPrint?.id === inv.id);
                              
      const getBackupData = () => ({
    version: "3.0",
    exportedAt: new Date().toISOString(),
    exportedBy: currentUser?.name || 'النظام',
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
  });
  return (
                                  <tr 
                                    key={inv.id} 
                                    className={`hover:bg-slate-50 hover:shadow-2xs transition-all duration-200 group cursor-pointer ${isSelected ? 'selected-invoice bg-blue-50 hover:bg-blue-100 shadow-[inset_0_0_0_1px_#bfdbfe]' : ''} ${isInvoiceLate(inv) ? 'bg-rose-50/30 border-r-4 border-r-rose-500' : ''}`}
                                    onClick={(e) => {
                                      if ((e.target as HTMLElement).closest('button, select, input, a')) {
                                        return;
                                      }
                                      setSelectedInvoiceId(inv.id);
                                      setInvoiceToPrint(inv);
                                      setIsPrintOpen(true);
                                    }}
                                  >
                                    <td className="p-4">
                                      <div className="font-bold text-slate-700">{inv.invoiceNumber}</div>
                                      <div className="flex items-center gap-2 mt-0.5">
                                        <div className="text-[10px] text-slate-400">{new Date(inv.createdAt).toLocaleDateString('ar-OM')}</div>
                                        {inv.status === 'late' && (
                                          <span className="text-[9px] font-bold bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded-full">متأخرة</span>
                                        )}
                                      </div>
                                    </td>
                                    <td className="p-4">
                                      <div className="font-bold text-slate-800">{cust?.name || 'عميل غير معروف'}</div>
                                      <div className="text-[10px] text-slate-500 mt-1 line-clamp-1">{inv.items.map(i => i.serviceName).join(' + ')}</div>
                                    </td>
                                    <td className="p-4 text-center font-mono font-bold text-slate-700">{inv.totalAmount.toFixed(3)}</td>
                                    <td className="p-4 text-center font-mono text-emerald-600">
                                      <div>{downPayment > 0 ? downPayment.toFixed(3) : '-'}</div>
                                      {downPayment > 0 && inv.payments && inv.payments.length > 0 && inv.payments[inv.payments.length - 1].method && (
                                        <div className="text-[9px] font-sans font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded w-max mx-auto mt-1">
                                          {inv.payments[inv.payments.length - 1].method === 'cash' ? 'نقداً' : inv.payments[inv.payments.length - 1].method === 'pos' ? 'جهاز POS' : 'تحويل بنكي'}
                                        </div>
                                      )}
                                    </td>
                                    <td className="p-4 text-center font-mono text-rose-600">{remainingAmount > 0 ? remainingAmount.toFixed(3) : '-'}</td>
                                    <td className="p-4 text-center">
                                      {isInvoiceLate(inv) ? (
                                        <div className="flex items-center justify-center gap-1.5">
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setDayInvoicesModalDate(null);
                                              handleViewLateInvoices(e);
                                            }}
                                            title="فاتورة متأخرة عن السداد - انقر لتصفية وعرض كافة الفواتير المتأخرة"
                                            className="px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center font-sans bg-rose-500/10 text-rose-700 border border-rose-200/70 hover:bg-rose-100 transition-colors cursor-pointer"
                                          >
                                            {inv.status === 'paid' ? 'مدفوعة' : inv.status === 'partially_paid' ? 'مدفوعة جزئياً' : inv.status === 'draft' ? 'مسودة' : 'غير مدفوعة'}
                                          </button>

                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setDayInvoicesModalDate(null);
                                              handleViewLateInvoices(e);
                                            }}
                                            title="تنبيه: فاتورة متأخرة عن السداد - انقر لعرض وتصفية كافة الفواتير المتأخرة"
                                            className="relative flex items-center justify-center shrink-0 cursor-pointer p-1 -m-1 group/late-cell focus:outline-none"
                                          >
                                            {/* Diffusion Ring 1 */}
                                            <span className="absolute inset-0 m-auto w-5 h-5 rounded-full border border-amber-400/60 blur-[0.5px] late-ring-1 pointer-events-none" />

                                            {/* Diffusion Ring 2 */}
                                            <span className="absolute inset-0 m-auto w-5 h-5 rounded-full border border-orange-400/50 blur-[0.5px] late-ring-2 pointer-events-none" />

                                            {/* Main Notification Circle Badge */}
                                            <span className="relative z-10 flex items-center justify-center w-5 h-5 rounded-full bg-gradient-to-b from-[#fffdf5] to-[#fef3c7] border border-amber-300 text-amber-900 shadow-xs late-badge-glow late-badge-shake hover:scale-125 active:scale-95 transition-transform duration-150">
                                              <AlertTriangle className="w-2.5 h-2.5 text-amber-800" />
                                            </span>
                                          </button>
                                        </div>
                                      ) : (
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-block font-sans ${
                                          inv.status === 'paid' ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-200/50' :
                                          inv.status === 'partially_paid' ? 'bg-amber-500/10 text-amber-700 border border-amber-200/50' :
                                          inv.status === 'draft' ? 'bg-slate-100 text-slate-600 border border-slate-200/50' :
                                          'bg-rose-500/10 text-rose-700 border border-rose-200/50'
                                        }`}>
                                          {inv.status === 'paid' ? 'مدفوعة' :
                                           inv.status === 'partially_paid' ? 'مدفوعة جزئياً' :
                                           inv.status === 'draft' ? 'مسودة' : 'غير مدفوعة'}
                                        </span>
                                      )}
                                    </td>
                                    <td className="p-4">
                                      <div className="flex items-center justify-center gap-1.5">
                                        <button onClick={() => { setInvoiceToPrint(inv); setIsPrintOpen(true); }} className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 hover:scale-110 active:scale-95 rounded-lg transition-all duration-200 cursor-pointer"><Eye className="w-4 h-4" /></button>
                                        <button onClick={() => directPrintInvoice(inv, cust, undefined, branches, systemSettings)} className="p-1.5 text-slate-600 hover:text-teal-600 hover:bg-teal-50 hover:scale-110 active:scale-95 rounded-lg transition-all duration-200 cursor-pointer"><Printer className="w-4 h-4" /></button>
                                        {currentUser.permissions.editInvoice && (
                                          <button onClick={() => { setInvoiceToEdit(inv); setIsInvoiceModalOpen(true); }} className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 hover:scale-110 active:scale-95 rounded-lg transition-all duration-200 cursor-pointer"><Edit2 className="w-4 h-4" /></button>
                                        )}
                                        {currentUser.permissions.deleteInvoice && (
                                          <button onClick={() => requestDeleteInvoice(inv.id, inv.invoiceNumber)} className="p-1.5 text-slate-600 hover:text-rose-500 hover:bg-rose-50 hover:scale-110 active:scale-95 rounded-lg transition-all duration-200 cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })
                            ) : (
                              <tr>
                                <td colSpan={7} className="p-12 text-center text-slate-400 italic">
                                  لا توجد فواتير في هذا اليوم
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

    </div>
  </div>
  );
}