/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import toast from 'react-hot-toast';
import React, { useState, useEffect, useRef } from 'react';
import { Ticket, TicketMessage, TicketStatus, User, Branch, TicketAmountHistoryItem, TicketOperationLogItem } from '../types';
import { 
  MessageSquare, 
  Send, 
  Plus, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  RotateCcw, 
  Search, 
  Calendar, 
  Filter, 
  User as UserIcon, 
  Check, 
  X,
  FileText,
  FileDown,
  Building,
  Briefcase,
  HelpCircle,
  Inbox,
  Paperclip,
  Smile,
  Image,
  Trash2,
  Loader2,
  Pencil,
  History
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { exportTicketsToExcel } from '../utils/exportUtils';
import { SearchableMultiSelectDropdown } from './SearchableMultiSelectDropdown';

interface TicketsSectionProps {
  systemSettings?: any;
  tickets: Ticket[];
  setTickets: React.Dispatch<React.SetStateAction<Ticket[]>>;
  currentUser: User;
  branches: Branch[];
  ticketTypes?: string[];
  ticketTypePlaceholders?: Record<string, string>;
  ticketManagers?: Record<string, string[]>;
  users: User[];
}

export default function TicketsSection({
  tickets = [],
  setTickets,
  currentUser,
  branches,
  ticketTypes = ['إجازة', 'راتب', 'طلب إداري', 'أخرى'],
  ticketTypePlaceholders = {},
  ticketManagers = {},
  users = [],
  systemSettings,
}: TicketsSectionProps) {
  // --- List & Filters State (Searchable Multi-Select Checkbox Dropdowns) ---
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [selectedClosedBy, setSelectedClosedBy] = useState<string[]>([]);
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [selectedClosedMonths, setSelectedClosedMonths] = useState<string[]>([]);

  // --- Sorting State ---
  const [sortField, setSortField] = useState<'ticketNumber' | 'type' | 'title' | 'employeeName' | 'createdAt' | 'status' | 'closedByName' | 'amount'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // --- Selected Ticket & Chat State ---
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [activeLightbox, setActiveLightbox] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [attachment, setAttachment] = useState<{ url: string; name: string; type: 'image' | 'file' } | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Admin Ticket Editing State ---
  const [isEditingTicket, setIsEditingTicket] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editType, setEditType] = useState('');
  const [editDetails, setEditDetails] = useState('');
  const [editAmount, setEditAmount] = useState<string>('');
  const [editEmployeeId, setEditEmployeeId] = useState('');
  const [editCreatedAt, setEditCreatedAt] = useState('');

  // --- Inline Amount Editing State ---
  const [isEditingDirectAmount, setIsEditingDirectAmount] = useState(false);
  const [directAmountInput, setDirectAmountInput] = useState<string>('');
  const [showAmountHistory, setShowAmountHistory] = useState(false);
  const [isOperationsLogExpanded, setIsOperationsLogExpanded] = useState(true);

  // --- New Ticket Form State ---
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState(() => (ticketTypes && ticketTypes.length > 0) ? ticketTypes[0] : 'إجازة');
  const [newDetails, setNewDetails] = useState('');
  const [newAmount, setNewAmount] = useState<string>('');
  const [formError, setFormError] = useState('');
  const [newTicketAttachment, setNewTicketAttachment] = useState<{ url: string; name: string; type: 'image' | 'file' } | null>(null);
  const [showCreateEmojiPicker, setShowCreateEmojiPicker] = useState(false);
  const createTicketFileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isCreateUploading, setIsCreateUploading] = useState(false);
  const [createUploadProgress, setCreateUploadProgress] = useState(0);

  useEffect(() => {
    if (ticketTypes && ticketTypes.length > 0 && !ticketTypes.includes(newType)) {
      setNewType(ticketTypes[0]);
    }
  }, [ticketTypes, newType]);

  // --- Permissions Helper ---
  const isGlobalAdmin = currentUser.role === 'admin' || currentUser.role === 'hr';
  
  // Permissions for viewing and inputting ticket amounts
  const canViewTicketAmount = currentUser.role === 'admin' || 
    !!currentUser.permissions?.viewTicketAmount || 
    !!currentUser.permissions?.manageTicketAmount || 
    !!currentUser.permissions?.inputTicketAmount;

  const canInputTicketAmount = currentUser.role === 'admin' || 
    !!currentUser.permissions?.inputTicketAmount || 
    (currentUser.permissions?.inputTicketAmount === undefined && !!currentUser.permissions?.manageTicketAmount);
  
  const canManageTicket = (type: string) => {
    if (isGlobalAdmin) return true;
    if (currentUser.permissions.manageTickets) return true; // Legacy global HR compatibility
    const managers = ticketManagers[type] || [];
    return managers.includes(currentUser.id);
  };

  // User has HR dashboard access if they manage AT LEAST ONE ticket type (or are admin)
  const isHr = isGlobalAdmin || 
               !!currentUser.permissions.manageTickets || 
               Object.values(ticketManagers).some(managers => managers.includes(currentUser.id));

  // --- Resize Split-Pane State ---
  const [isDragging, setIsDragging] = useState(false);
  const [rightWidthPercent, setRightWidthPercent] = useState(33.33); // Start with 33.33%
  const containerRef = useRef<HTMLDivElement>(null);

  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      
      // Right-to-Left (RTL) Layout:
      // The right column (Ticket List) is physically on the right side of the screen.
      // Thus, its width is the distance from the physical right edge of the container to the mouse position.
      let percent = ((rect.right - e.clientX) / rect.width) * 100;
      
      // Enforce bounds (e.g., minimum 20% and maximum 65% width for the list)
      if (percent < 20) percent = 20;
      if (percent > 65) percent = 65;
      
      setRightWidthPercent(percent);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Extract unique employee names who have tickets (to populate the filter dropdown)
  const uniqueEmployees = Array.from(new Set(tickets.map(t => t.employeeName))).filter(Boolean).sort((a, b) => a.localeCompare(b, 'ar'));

  // Extract unique closedBy names (to populate the filter dropdown)
  const uniqueClosedByUsers = Array.from(new Set(tickets.map(t => t.closedByName))).filter(Boolean).sort((a, b) => a.localeCompare(b, 'ar')) as string[];

  // Months options (All 12 months)
  const MONTH_OPTIONS = [
    { label: '1 - يناير', value: '1' },
    { label: '2 - فبراير', value: '2' },
    { label: '3 - مارس', value: '3' },
    { label: '4 - أبريل', value: '4' },
    { label: '5 - مايو', value: '5' },
    { label: '6 - يونيو', value: '6' },
    { label: '7 - يوليو', value: '7' },
    { label: '8 - أغسطس', value: '8' },
    { label: '9 - سبتمبر', value: '9' },
    { label: '10 - أكتوبر', value: '10' },
    { label: '11 - نوفمبر', value: '11' },
    { label: '12 - ديسمبر', value: '12' },
  ];

  // Status options
  const STATUS_OPTIONS = [
    { label: 'جديد (معلق)', value: 'new' },
    { label: 'قيد المعالجة', value: 'processing' },
    { label: 'مكتمل ومغلق', value: 'completed' },
  ];

  // Auto-select the first ticket when data loads
  const filtered = tickets.filter(t => {
    // 1. Ownership & Specific Manager Access
    const isOwner = t.employeeId === currentUser.id;
    const canManageThis = canManageTicket(t.type);
    
    if (!isOwner && !canManageThis) {
      return false; // User neither owns this ticket nor has permission to manage its type
    }

    // 2. Branch Filter (multi-select)
    if (selectedBranches.length > 0 && !selectedBranches.includes(t.branchId || '')) {
      return false;
    }

    // 3. Status Filter (multi-select)
    if (selectedStatuses.length > 0 && !selectedStatuses.includes(t.status)) {
      return false;
    }

    // 4. Type Filter (multi-select)
    if (selectedTypes.length > 0 && !selectedTypes.includes(t.type)) {
      return false;
    }

    // 5. Employee Filter (multi-select)
    if (selectedEmployees.length > 0 && !selectedEmployees.includes(t.employeeName)) {
      return false;
    }

    // 6. Closed By Filter (multi-select)
    if (selectedClosedBy.length > 0) {
      if (t.status !== 'completed' || !t.closedByName || !selectedClosedBy.includes(t.closedByName)) {
        return false;
      }
    }

    // 7. Month Filter (Submission Date) (multi-select)
    if (selectedMonths.length > 0) {
      const ticketMonth = String(new Date(t.createdAt).getMonth() + 1);
      if (!selectedMonths.includes(ticketMonth)) {
        return false;
      }
    }

    // 8. Closed Month Filter (Closing Date) (multi-select)
    if (selectedClosedMonths.length > 0) {
      if (t.status !== 'completed') {
        return false;
      }
      let resolvedClosedDate = t.closedAt;
      if (!resolvedClosedDate) {
        const closeMsg = t.messages?.slice().reverse().find(m => m.senderId === 'system' && m.content.includes('تم إغلاق التذكرة'));
        resolvedClosedDate = closeMsg?.createdAt || t.updatedAt || t.createdAt;
      }
      const ticketClosedMonth = String(new Date(resolvedClosedDate).getMonth() + 1);
      if (!selectedClosedMonths.includes(ticketClosedMonth)) {
        return false;
      }
    }

    // 8. Search text (Title, Details, Number, Employee Name)
    if (searchTerm.trim() !== '') {
      const s = searchTerm.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(s);
      const matchDetails = t.details.toLowerCase().includes(s);
      const matchNum = t.ticketNumber.toLowerCase().includes(s);
      const matchEmp = t.employeeName.toLowerCase().includes(s);
      if (!matchTitle && !matchDetails && !matchNum && !matchEmp) return false;
    }

    return true;
  });

  // Calculate sum of amounts for filtered tickets
  const totalFilteredAmount = filtered.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  // Sort tickets primarily based on status priority: new (open) -> processing -> completed
  // and secondarily based on the active sortField and sortOrder within each status
  const sortedTickets = [...filtered].sort((a, b) => {
    const statusPriority: Record<string, number> = {
      'new': 1,
      'processing': 2,
      'completed': 3
    };

    const prioA = statusPriority[a.status] || 99;
    const prioB = statusPriority[b.status] || 99;

    if (prioA !== prioB) {
      return prioA - prioB;
    }

    let comparison = 0;
    if (sortField === 'createdAt') {
      comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    } else if (sortField === 'amount') {
      comparison = (Number(a.amount) || 0) - (Number(b.amount) || 0);
    } else {
      const valA = String(a[sortField] || '').toLowerCase();
      const valB = String(b[sortField] || '').toLowerCase();
      comparison = valA.localeCompare(valB, 'ar');
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const selectedTicket = tickets.find(t => t.id === selectedTicketId);

  // Comprehensive operations and action log helper for tickets
  const getTicketOperations = (ticket: Ticket): TicketOperationLogItem[] => {
    const explicitLogs = ticket.operationsLog || [];
    const synthesizedLogs: TicketOperationLogItem[] = [];

    // 1. Creation event
    if (!explicitLogs.some(l => l.type === 'creation' || l.action.includes('إنشاء'))) {
      synthesizedLogs.push({
        id: `synth-create-${ticket.id}`,
        action: 'إنشاء التذكرة وتقديم الطلب الأساسي',
        details: `تم إنشاء التذكرة بعنوان "${ticket.title}" لموضوع (${ticket.type})`,
        performedById: ticket.employeeId,
        performedByName: ticket.employeeName,
        timestamp: ticket.createdAt,
        type: 'creation'
      });
    }

    // 2. Status change to processing
    const resolvedProcessingName = ticket.processingByName || (() => {
      const msg = ticket.messages?.slice().reverse().find(m => m.senderId === 'system' && m.content.includes('قيد المعالجة') && m.content.includes('بواسطة'));
      if (!msg) return undefined;
      const match = msg.content.match(/بواسطة\s+([^\s✅💰🔧]+(?:\s+[^\s✅💰🔧]+)?)/);
      return match ? match[1].trim() : undefined;
    })();

    if (ticket.status === 'processing' || resolvedProcessingName) {
      if (!explicitLogs.some(l => l.action.includes('قيد المعالجة'))) {
        synthesizedLogs.push({
          id: `synth-proc-${ticket.id}`,
          action: 'تحويل حالة الطلب إلى قيد المعالجة',
          details: `تم تحويل الطلب إلى قيد المعالجة بواسطة ${resolvedProcessingName || 'المسؤول'}`,
          performedById: ticket.processingBy || '',
          performedByName: resolvedProcessingName || 'المسؤول',
          timestamp: ticket.processingAt || ticket.updatedAt || ticket.createdAt,
          type: 'status_change'
        });
      }
    }

    // 3. Status change to completed (closed)
    const resolvedClosedName = ticket.closedByName || (() => {
      const msg = ticket.messages?.slice().reverse().find(m => m.senderId === 'system' && m.content.includes('إغلاق') && m.content.includes('بواسطة'));
      if (!msg) return undefined;
      const match = msg.content.match(/بواسطة\s+([^\s✅💰🔧]+(?:\s+[^\s✅💰🔧]+)?)/);
      return match ? match[1].trim() : undefined;
    })();

    if (ticket.status === 'completed' || resolvedClosedName) {
      if (!explicitLogs.some(l => l.type === 'close' || l.action.includes('إغلاق'))) {
        synthesizedLogs.push({
          id: `synth-close-${ticket.id}`,
          action: 'إغلاق التذكرة واكتمالها',
          details: `تم إغلاق التذكرة بنجاح واعتمادها بواسطة ${resolvedClosedName || 'المسؤول'}`,
          performedById: ticket.closedBy || '',
          performedByName: resolvedClosedName || 'المسؤول',
          timestamp: ticket.closedAt || ticket.updatedAt || ticket.createdAt,
          type: 'close'
        });
      }
    }

    // 4. Amount history modifications
    (ticket.amountHistory || []).forEach((amt, idx) => {
      const amtTimestamp = amt.changedAt;
      if (!explicitLogs.some(l => l.timestamp === amtTimestamp && l.type === 'amount_change') &&
          !synthesizedLogs.some(l => l.timestamp === amtTimestamp && l.type === 'amount_change')) {
        synthesizedLogs.push({
          id: `synth-amt-${amt.id || idx}`,
          action: 'تعديل المبلغ المالي للطلب',
          details: `تم تعديل المبلغ إلى (${Number(amt.amount).toFixed(3)} ر.ع)${amt.previousAmount !== undefined ? ` (سابقاً: ${Number(amt.previousAmount).toFixed(3)} ر.ع)` : ''}`,
          performedById: amt.changedById,
          performedByName: amt.changedByName,
          timestamp: amtTimestamp,
          type: 'amount_change'
        });
      }
    });

    // 5. System messages in chat (catches any other historical system actions)
    (ticket.messages || []).forEach((m, idx) => {
      if (m.senderId === 'system') {
        const alreadyCovered = explicitLogs.some(l => l.details === m.content || l.timestamp === m.createdAt) ||
                               synthesizedLogs.some(l => l.details === m.content || l.timestamp === m.createdAt);
        if (!alreadyCovered) {
          let action = 'تحديث في الطلب';
          let logType: TicketOperationLogItem['type'] = 'status_change';
          if (m.content.includes('إغلاق')) {
            action = 'إغلاق التذكرة واكتمالها';
            logType = 'close';
          } else if (m.content.includes('قيد المعالجة')) {
            action = 'تحويل حالة الطلب إلى قيد المعالجة';
            logType = 'status_change';
          } else if (m.content.includes('المبلغ')) {
            action = 'تعديل المبلغ المالي';
            logType = 'amount_change';
          } else if (m.content.includes('تعديل')) {
            action = 'تعديل بيانات الطلب';
            logType = 'edit';
          }

          let performer = m.senderName;
          const byMatch = m.content.match(/بواسطة\s+([^\s✅💰🔧]+(?:\s+[^\s✅💰🔧]+)?)/);
          if (byMatch && byMatch[1]) {
            performer = byMatch[1].trim();
          }

          synthesizedLogs.push({
            id: `synth-msg-${m.id || idx}`,
            action,
            details: m.content,
            performedById: m.senderId,
            performedByName: performer,
            timestamp: m.createdAt,
            type: logType
          });
        }
      }
    });

    const combined = [...explicitLogs, ...synthesizedLogs];
    return combined.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  // Helper to extract or resolve the user who put the ticket in processing
  const getTicketProcessingUser = (ticket: Ticket): string | undefined => {
    if (ticket.processingByName) return ticket.processingByName;
    const procLog = ticket.operationsLog?.find(l => l.type === 'status_change' && (l.action.includes('معالجة') || l.details.includes('قيد المعالجة')));
    if (procLog && procLog.performedByName) return procLog.performedByName;
    const msg = ticket.messages?.slice().reverse().find(m => m.senderId === 'system' && m.content.includes('قيد المعالجة') && m.content.includes('بواسطة'));
    if (!msg) return undefined;
    const match = msg.content.match(/بواسطة\s+([^\s✅💰🔧]+(?:\s+[^\s✅💰🔧]+)?)/);
    return match ? match[1].trim() : undefined;
  };

  // Auto scroll chat to bottom when selected ticket or messages change
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [selectedTicket?.messages?.length, selectedTicketId]);

  // Automatically mark ticket as read when selected or when new messages arrive
  useEffect(() => {
    if (!selectedTicketId) return;
    const t = tickets.find(ticket => ticket.id === selectedTicketId);
    if (!t) return;

    const isOwner = t.employeeId === currentUser.id;
    const canManageThis = canManageTicket(t.type);
    
    const hasUnreadEmp = isOwner && t.unreadByEmployee;
    const hasUnreadHr = canManageThis && t.unreadByHr;

    if (hasUnreadEmp || hasUnreadHr) {
      setTickets(prev => prev.map(item => {
        if (item.id === selectedTicketId) {
          return {
            ...item,
            unreadByEmployee: isOwner ? false : item.unreadByEmployee,
            unreadByHr: canManageThis ? false : item.unreadByHr
          };
        }
        return item;
      }));
    }
  }, [selectedTicketId, tickets, currentUser.id, isGlobalAdmin, currentUser.permissions.manageTickets, ticketManagers, setTickets]);

  // Sync edit state when selected ticket changes
  useEffect(() => {
    if (selectedTicket) {
      setEditTitle(selectedTicket.title);
      setEditType(selectedTicket.type);
      setEditDetails(selectedTicket.details);
      const amtStr = selectedTicket.amount !== undefined && selectedTicket.amount !== null ? String(selectedTicket.amount) : '';
      setEditAmount(amtStr);
      setDirectAmountInput(amtStr);
      setIsEditingDirectAmount(false);
      setShowAmountHistory(false);
      setEditEmployeeId(selectedTicket.employeeId);
      setEditCreatedAt(selectedTicket.createdAt);
    } else {
      setIsEditingTicket(false);
      setIsEditingDirectAmount(false);
      setShowAmountHistory(false);
    }
  }, [selectedTicketId]);

  // Save changes made by Administrator to the ticket
  const handleSaveTicketEdits = () => {
    if (!selectedTicket) return;
    if (!editTitle.trim() || !editDetails.trim()) return;

    setTickets(prev => prev.map(t => {
      if (t.id === selectedTicketId) {
        const changes: string[] = [];
        if (t.title !== editTitle.trim()) changes.push('العنوان');
        if (t.type !== editType) changes.push('نوع وموضوع الطلب');
        if (t.details !== editDetails.trim()) changes.push('تفاصيل الطلب');
        if (t.employeeId !== editEmployeeId) changes.push('مقدم الطلب');
        if (t.createdAt !== editCreatedAt) changes.push('تاريخ الطلب');

        const parsedEditAmount = (canInputTicketAmount && editAmount.trim() !== '') ? parseFloat(editAmount) : undefined;
        let newHistory = t.amountHistory ? [...t.amountHistory] : [];
        let lastEditedBy = t.lastAmountEditedBy;
        let lastEditedAt = t.lastAmountEditedAt;
        let lastEditedById = t.lastAmountEditedById;

        if (canInputTicketAmount && t.amount !== parsedEditAmount) {
          changes.push('المبلغ المالي');
          const nowIso = new Date().toISOString();
          const historyItem: TicketAmountHistoryItem = {
            id: `amt-${Date.now()}-${Math.random().toString(36).substr(2, 7)}`,
            amount: parsedEditAmount !== undefined ? parsedEditAmount : 0,
            previousAmount: t.amount,
            changedById: currentUser.id,
            changedByName: currentUser.name || currentUser.fullName || 'مستخدم',
            changedAt: nowIso
          };
          newHistory.push(historyItem);
          lastEditedBy = currentUser.name || currentUser.fullName || 'مستخدم';
          lastEditedById = currentUser.id;
          lastEditedAt = nowIso;
        }

        if (changes.length === 0) {
          setIsEditingTicket(false);
          return t;
        }

        const systemMessage: TicketMessage = {
          id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          senderId: 'system',
          senderName: 'النظام الآلي',
          senderRole: 'admin',
          content: `قام مدير النظام (${currentUser.name}) بتعديل (${changes.join(' و ')}) للطلب 🔧`,
          createdAt: new Date().toISOString()
        };

        const editLog: TicketOperationLogItem = {
          id: `log-${Date.now()}-edit`,
          action: 'تعديل بيانات وتفاصيل الطلب',
          details: `قام مدير النظام بتعديل: (${changes.join(' و ')})`,
          performedById: currentUser.id,
          performedByName: currentUser.name || currentUser.fullName || 'مدير النظام',
          performedByRole: currentUser.role,
          timestamp: new Date().toISOString(),
          type: 'edit'
        };

        const newEmployee = users.find(u => u.id === editEmployeeId);
        return {
          ...t,
          title: editTitle.trim(),
          type: editType,
          details: editDetails.trim(),
          amount: canInputTicketAmount ? parsedEditAmount : t.amount,
          lastAmountEditedBy: lastEditedBy,
          lastAmountEditedById: lastEditedById,
          lastAmountEditedAt: lastEditedAt,
          amountHistory: newHistory,
          operationsLog: [...(t.operationsLog || []), editLog],
          employeeId: editEmployeeId,
          employeeName: newEmployee ? (newEmployee.name || newEmployee.fullName || t.employeeName) : t.employeeName,
          createdAt: editCreatedAt,
          updatedAt: new Date().toISOString(),
          messages: [...t.messages, systemMessage]
        };
      }
      return t;
    }));

    setIsEditingTicket(false);
  };

  // Direct amount modification in view/preview modal for authorized users
  const handleSaveDirectAmount = () => {
    if (!selectedTicket) return;
    if (!canInputTicketAmount) {
      toast.error('ليس لديك صلاحية لتعديل المبلغ المالي.');
      return;
    }

    const trimmed = directAmountInput.trim();
    const newAmountVal = trimmed !== '' ? parseFloat(trimmed) : undefined;
    const currentAmt = selectedTicket.amount;

    if (newAmountVal === currentAmt) {
      setIsEditingDirectAmount(false);
      return;
    }

    const nowIso = new Date().toISOString();
    const historyItem: TicketAmountHistoryItem = {
      id: `amt-${Date.now()}-${Math.random().toString(36).substr(2, 7)}`,
      amount: newAmountVal !== undefined ? newAmountVal : 0,
      previousAmount: currentAmt,
      changedById: currentUser.id,
      changedByName: currentUser.name || currentUser.fullName || 'مستخدم',
      changedAt: nowIso
    };

    const newHistory = [...(selectedTicket.amountHistory || []), historyItem];

    const systemMessage: TicketMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      senderId: 'system',
      senderName: 'النظام الآلي',
      senderRole: 'admin',
      content: `قام ${currentUser.name} بتعديل المبلغ المالي من (${currentAmt !== undefined ? Number(currentAmt).toFixed(3) + ' ر.ع' : 'غير محدد'}) إلى (${newAmountVal !== undefined ? Number(newAmountVal).toFixed(3) + ' ر.ع' : 'بدون مبلغ'}) 💰`,
      createdAt: nowIso
    };

    const amountLog: TicketOperationLogItem = {
      id: `log-${Date.now()}-amt`,
      action: 'تعديل المبلغ المالي',
      details: `تعديل المبلغ من (${currentAmt !== undefined ? Number(currentAmt).toFixed(3) + ' ر.ع' : 'غير محدد'}) إلى (${newAmountVal !== undefined ? Number(newAmountVal).toFixed(3) + ' ر.ع' : 'بدون مبلغ'})`,
      performedById: currentUser.id,
      performedByName: currentUser.name || currentUser.fullName || 'مستخدم',
      performedByRole: currentUser.role,
      timestamp: nowIso,
      type: 'amount_change'
    };

    setTickets(prev => prev.map(t => {
      if (t.id === selectedTicket.id) {
        return {
          ...t,
          amount: newAmountVal,
          lastAmountEditedBy: currentUser.name || currentUser.fullName || 'مستخدم',
          lastAmountEditedById: currentUser.id,
          lastAmountEditedAt: nowIso,
          amountHistory: newHistory,
          operationsLog: [...(t.operationsLog || []), amountLog],
          updatedAt: nowIso,
          messages: [...t.messages, systemMessage]
        };
      }
      return t;
    }));

    setIsEditingDirectAmount(false);
    toast.success('تم تحديث المبلغ المالي وحفظ سجل التعديل بنجاح');
  };

  // Handle submitting new ticket
  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!newTitle.trim() || !newDetails.trim()) {
      setFormError('يرجى ملء جميع الحقول المطلوبة.');
      return;
    }

    // Generate unique sequential ticket number
    const nextNum = 1001 + tickets.length;
    const ticketNumber = `TCK-${nextNum}`;

    const parsedAmount = (canInputTicketAmount && newAmount.trim() !== '') ? parseFloat(newAmount) : undefined;

    const nowIso = new Date().toISOString();
    const creationLog: TicketOperationLogItem = {
      id: `log-${Date.now()}-create`,
      action: 'إنشاء التذكرة وتقديم الطلب الأساسي',
      details: `تم إنشاء التذكرة بنجاح بعنوان "${newTitle.trim()}" لنوع (${newType})`,
      performedById: currentUser.id,
      performedByName: currentUser.name || currentUser.fullName || 'مستخدم',
      performedByRole: currentUser.role,
      timestamp: nowIso,
      type: 'creation'
    };

    const newTicket: Ticket = {
      id: `ticket-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ticketNumber,
      title: newTitle.trim(),
      type: newType,
      details: newDetails.trim(),
      amount: parsedAmount,
      status: 'new',
      employeeId: currentUser.id,
      employeeName: currentUser.name,
      branchId: currentUser.branchId || 'branch-1',
      createdAt: nowIso,
      updatedAt: nowIso,
      operationsLog: [creationLog],
      messages: [],
      ...(newTicketAttachment ? {
        attachmentUrl: newTicketAttachment.url,
        attachmentName: newTicketAttachment.name,
        attachmentType: newTicketAttachment.type
      } : {})
    };

    setTickets(prev => [newTicket, ...prev]);
    setSelectedTicketId(newTicket.id);
    setIsTicketModalOpen(true);

    // Reset Form
    setNewTitle('');
    setNewType(ticketTypes[0] || 'إجازة');
    setNewDetails('');
    setNewAmount('');
    setNewTicketAttachment(null);
    setShowCreateEmojiPicker(false);
    setIsCreateModalOpen(false);
  };

  // Handle file selection for Create Ticket Modal
  const handleCreateFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCreateUploading(true);
    setCreateUploadProgress(0);

    const reader = new FileReader();
    reader.onprogress = (event) => {
      if (event.lengthComputable) {
        const progress = Math.round((event.loaded / event.total) * 100);
        setCreateUploadProgress(progress);
      }
    };
    reader.onload = (event) => {
      // simulate a tiny delay so the user sees the progress if it's too fast
      setTimeout(() => {
        const dataUrl = event.target?.result as string;
        const isImage = file.type.startsWith('image/');
        setNewTicketAttachment({
          url: dataUrl,
          name: file.name,
          type: isImage ? 'image' : 'file'
        });
        setIsCreateUploading(false);
        setCreateUploadProgress(100);
        toast.success('تم إرفاق الملف بنجاح');
      }, 500);
    };
    reader.onerror = () => {
      setIsCreateUploading(false);
      toast.error('حدث خطأ أثناء قراءة الملف');
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // Reset input
  };

  // Handle pasting images from clipboard for Create Ticket Modal details textarea
  const handleCreatePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          setIsCreateUploading(true);
          setCreateUploadProgress(0);
          const reader = new FileReader();
          reader.onprogress = (event) => {
            if (event.lengthComputable) {
              const progress = Math.round((event.loaded / event.total) * 100);
              setCreateUploadProgress(progress);
            }
          };
          reader.onload = (event) => {
            setTimeout(() => {
              const dataUrl = event.target?.result as string;
              setNewTicketAttachment({
                url: dataUrl,
                name: file.name || `صورة_ملصقة_${Date.now()}.png`,
                type: 'image'
              });
              setIsCreateUploading(false);
              setCreateUploadProgress(100);
              toast.success('تم إرفاق الصورة المنسوخة بنجاح');
            }, 500);
          };
          reader.onerror = () => {
            setIsCreateUploading(false);
            toast.error('حدث خطأ أثناء قراءة الصورة');
          };
          reader.readAsDataURL(file);
          e.preventDefault();
          break;
        }
      }
    }
  };

  // Handle changing ticket status (HR/Admin only)
  const handleUpdateStatus = (ticketId: string, newStatus: TicketStatus) => {
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) return;
    if (!canManageTicket(ticket.type)) {
      toast.error('ليس لديك صلاحية تغيير حالة هذا النوع من الطلبات.');
      return;
    }

    const nowIso = new Date().toISOString();
    const isClosing = newStatus === 'completed';
    const isProcessing = newStatus === 'processing';
    const isNew = newStatus === 'new';
    const performerName = currentUser.name || currentUser.fullName || 'مستخدم';

    // System message inside chat with clear user attribution
    let systemMsgContent = '';
    let logAction = '';
    let logDetails = '';

    if (isClosing) {
      systemMsgContent = `تم إغلاق التذكرة بنجاح بواسطة ${performerName} ✅`;
      logAction = 'إغلاق التذكرة واكتمالها';
      logDetails = `تم إغلاق الطلب واكتماله بنجاح بواسطة ${performerName}`;
    } else if (isProcessing) {
      systemMsgContent = `تم تحويل حالة الطلب إلى (قيد المعالجة 🔄) بواسطة ${performerName}`;
      logAction = 'بدء معالجة التذكرة';
      logDetails = `تم تحويل حالة الطلب إلى قيد المعالجة والبدء في الإجراءات بواسطة ${performerName}`;
    } else {
      systemMsgContent = `تمت إعادة حالة الطلب إلى (جديد 🆕) بواسطة ${performerName}`;
      logAction = 'إعادة تعيين الحالة إلى جديد';
      logDetails = `تمت إعادة حالة الطلب إلى معلق / جديد بواسطة ${performerName}`;
    }

    const systemMessage: TicketMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      senderId: 'system',
      senderName: 'النظام الآلي',
      senderRole: 'admin',
      content: systemMsgContent,
      createdAt: nowIso
    };

    const statusLog: TicketOperationLogItem = {
      id: `log-${Date.now()}-status`,
      action: logAction,
      details: logDetails,
      performedById: currentUser.id,
      performedByName: performerName,
      performedByRole: currentUser.role,
      timestamp: nowIso,
      type: isClosing ? 'close' : 'status_change'
    };

    setTickets(prev => prev.map(t => {
      if (t.id === ticketId) {
        return {
          ...t,
          status: newStatus,
          updatedAt: nowIso,
          messages: [...t.messages, systemMessage],
          closedBy: isClosing ? currentUser.id : (isNew ? undefined : t.closedBy),
          closedByName: isClosing ? performerName : (isNew ? undefined : t.closedByName),
          closedAt: isClosing ? (t.closedAt || nowIso) : (isNew ? undefined : t.closedAt),
          processingBy: isProcessing ? currentUser.id : (isNew ? undefined : t.processingBy),
          processingByName: isProcessing ? performerName : (isNew ? undefined : t.processingByName),
          processingAt: isProcessing ? (t.processingAt || nowIso) : (isNew ? undefined : t.processingAt),
          operationsLog: [...(t.operationsLog || []), statusLog],
          unreadByEmployee: true,
          unreadByHr: false
        };
      }
      return t;
    }));

    toast.success(
      isClosing 
        ? 'تم إغلاق التذكرة بنجاح' 
        : isProcessing 
        ? `تم تحويل الطلب إلى قيد المعالجة بواسطة ${performerName}`
        : 'تم تغيير حالة الطلب إلى جديد'
    );
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    const reader = new FileReader();
    reader.onprogress = (event) => {
      if (event.lengthComputable) {
        const progress = Math.round((event.loaded / event.total) * 100);
        setUploadProgress(progress);
      }
    };
    reader.onload = (event) => {
      setTimeout(() => {
        const dataUrl = event.target?.result as string;
        const isImage = file.type.startsWith('image/');
        setAttachment({
          url: dataUrl,
          name: file.name,
          type: isImage ? 'image' : 'file'
        });
        setIsUploading(false);
        setUploadProgress(100);
        toast.success('تم إرفاق الملف بنجاح');
      }, 500);
    };
    reader.onerror = () => {
      setIsUploading(false);
      toast.error('حدث خطأ أثناء قراءة الملف');
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // Reset input
  };

  // Handle pasting images from clipboard
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          setIsUploading(true);
          setUploadProgress(0);
          const reader = new FileReader();
          reader.onprogress = (event) => {
            if (event.lengthComputable) {
              const progress = Math.round((event.loaded / event.total) * 100);
              setUploadProgress(progress);
            }
          };
          reader.onload = (event) => {
            setTimeout(() => {
              const dataUrl = event.target?.result as string;
              setAttachment({
                url: dataUrl,
                name: file.name || `صورة_ملصقة_${Date.now()}.png`,
                type: 'image'
              });
              setIsUploading(false);
              setUploadProgress(100);
              toast.success('تم إرفاق الصورة المنسوخة بنجاح');
            }, 500);
          };
          reader.onerror = () => {
            setIsUploading(false);
            toast.error('حدث خطأ أثناء قراءة الصورة');
          };
          reader.readAsDataURL(file);
          e.preventDefault();
          break;
        }
      }
    }
  };

  // Common Emojis List
  const COMMON_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏', '✅', '⚠️', '📁', '📝', '🌸', '💬', '🚀', '💡', '📞', '🤝', '🇴🇲', '📋'];

  // Handle sending message inside ticket sub-chat
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() && !attachment) return;
    if (!selectedTicketId) return;
    
    const targetTicket = tickets.find(t => t.id === selectedTicketId);
    if (!targetTicket) return;

    const isUserHrForThisTicket = canManageTicket(targetTicket.type);

    const newMessage: TicketMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role === 'admin' ? 'admin' : (isUserHrForThisTicket ? 'hr' : 'employee'),
      content: messageInput.trim(),
      createdAt: new Date().toISOString(),
      ...(attachment ? {
        attachmentUrl: attachment.url,
        attachmentName: attachment.name,
        attachmentType: attachment.type
      } : {})
    };

    setTickets(prev => prev.map(t => {
      if (t.id === selectedTicketId) {
        return {
          ...t,
          updatedAt: new Date().toISOString(),
          messages: [...t.messages, newMessage],
          unreadByEmployee: isUserHrForThisTicket ? true : t.unreadByEmployee,
          unreadByHr: !isUserHrForThisTicket ? true : t.unreadByHr
        };
      }
      return t;
    }));

    setMessageInput('');
    setAttachment(null);
  };

  // Handle deleting message inside ticket sub-chat for system admin
  const handleDeleteTicketMessage = (ticketId: string, messageId: string) => {
    const confirmDelete = confirm("هل أنت متأكد من رغبتك في حذف هذا التعليق / الرسالة نهائياً؟");
    if (!confirmDelete) return;

    setTickets(prev => prev.map(t => {
      if (t.id === ticketId) {
        return {
          ...t,
          updatedAt: new Date().toISOString(),
          messages: t.messages.filter(m => m.id !== messageId)
        };
      }
      return t;
    }));
  };

  // Handle deleting the entire ticket for system admin
  const handleDeleteTicket = (ticketId: string) => {
    const confirmDelete = confirm("هل أنت متأكد من رغبتك في حذف هذه التذكرة نهائياً مع كافة رسائلها وملحقاتها؟");
    if (!confirmDelete) return;

    setTickets(prev => prev.filter(t => t.id !== ticketId));
    if (selectedTicketId === ticketId) {
      setSelectedTicketId(null);
    }
  };

  // Statistics calculations for top KPI cards
  const countTotal = filtered.length;
  const countNew = filtered.filter(t => t.status === 'new').length;
  const countProcessing = filtered.filter(t => t.status === 'processing').length;
  const countCompleted = filtered.filter(t => t.status === 'completed').length;

  return (
    <div className="space-y-6 font-sans text-right" dir="rtl" id="support-tickets-workspace">
      
      {/* 1. Statistics / KPI cards at the top */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="tickets-kpi-cards">
        
        {/* KPI 1: Total Tickets */}
        <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-2xs flex flex-col justify-between relative overflow-hidden transition-all duration-300 hover:shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500">إجمالي طلبات الدعم</span>
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-xl">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-blue-600 font-mono">{countTotal}</span>
            <span className="text-[10px] font-bold text-slate-400">طلب</span>
          </div>
          <div className="mt-1 text-[9px] text-slate-400">
            كافة طلبات التذاكر والدعم الإداري المسجلة
          </div>
        </div>

        {/* KPI 2: New Tickets */}
        <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-2xs flex flex-col justify-between relative overflow-hidden transition-all duration-300 hover:shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500">طلبات جديدة معلقة</span>
            <div className="p-1.5 bg-amber-50 text-amber-600 rounded-xl">
              <AlertCircle className="w-4 h-4 animate-pulse" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-amber-600 font-mono">{countNew}</span>
            <span className="text-[10px] font-bold text-slate-400">طلب جديد</span>
          </div>
          <div className="mt-1 text-[9px] text-slate-400">
            بانتظار مراجعة وقبول موظفي الموارد البشرية HR
          </div>
        </div>

        {/* KPI 3: Processing Tickets */}
        <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-2xs flex flex-col justify-between relative overflow-hidden transition-all duration-300 hover:shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500">قيد المعالجة والمراجعة</span>
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-indigo-600 font-mono">{countProcessing}</span>
            <span className="text-[10px] font-bold text-slate-400">جاري معالجته</span>
          </div>
          <div className="mt-1 text-[9px] text-slate-400">
            طلبات ومستندات جاري مراجعتها واتخاذ إجراء عليها
          </div>
        </div>

        {/* KPI 4: Completed Tickets */}
        <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-2xs flex flex-col justify-between relative overflow-hidden transition-all duration-300 hover:shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500">طلبات مكتملة مغلقة</span>
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-emerald-600 font-mono">{countCompleted}</span>
            <span className="text-[10px] font-bold text-slate-400">طلب منجز</span>
          </div>
          <div className="mt-1 text-[9px] text-slate-400">
            تمت مراجعتها وحلها وإغلاقها بنجاح
          </div>
        </div>

      </div>

      {/* 2. Action Bar & Filters (Match Invoice Style Layout) */}
      <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-2xs space-y-4">
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-600 animate-pulse"></span>
              <h3 className="text-xs font-black text-slate-800">تصفية وبحث الطلبات والدعم الإداري</h3>
            </div>
            
            {/* Reset Filters Button */}
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedTypes([]);
                setSelectedStatuses([]);
                setSelectedBranches([]);
                setSelectedEmployees([]);
                setSelectedClosedBy([]);
                setSelectedMonths([]);
                setSelectedClosedMonths([]);
              }}
              className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 text-[10px] font-bold py-1.5 px-3 rounded-xl border border-slate-200/60 transition-all cursor-pointer active:scale-95"
              title="إعادة تعيين كافة فلاتر البحث والتصفية للوضع الافتراضي"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              إعادة تعيين (Reset)
            </button>

            {/* Total Filtered Amount Box (Shown only for users with permission) */}
            {canViewTicketAmount && (
              <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200/90 text-emerald-800 text-xs font-bold py-1.5 px-3 rounded-xl shadow-2xs">
                <span className="text-[10px] text-emerald-600 font-bold">إجمالي المبالغ:</span>
                <span className="font-mono font-black text-emerald-700 text-xs">{totalFilteredAmount.toFixed(3)}</span>
                <span className="text-[10px] text-emerald-600 font-bold">ر.ع</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
            {(!systemSettings || systemSettings.enableNewTicket) && (
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md shadow-teal-600/10 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              تقديم تذكرة / طلب جديد
            </button>
            )}
          </div>
        </div>

        {/* Filters Matrix (Grid) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-3 pt-1">
          
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث بالعنوان، الرقم، أو الموظف..."
              className="w-full pr-9 pl-3 py-1.5 bg-slate-50 border border-slate-200/90 rounded-xl text-xs font-bold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all min-h-[34px]"
            />
          </div>

          {/* Type Selector Filter (Searchable Multi-Select Checkbox) */}
          <SearchableMultiSelectDropdown
            placeholder="نوع الطلب (الكل)..."
            selectedValues={selectedTypes}
            onChange={setSelectedTypes}
            options={ticketTypes}
          />

          {/* Status Selector Filter (Searchable Multi-Select Checkbox) */}
          <SearchableMultiSelectDropdown
            placeholder="الحالة (الكل)..."
            selectedValues={selectedStatuses}
            onChange={setSelectedStatuses}
            options={STATUS_OPTIONS}
          />

          {/* Employee Name Filter (Searchable Multi-Select Checkbox) */}
          <SearchableMultiSelectDropdown
            placeholder="الموظف (الكل)..."
            selectedValues={selectedEmployees}
            onChange={setSelectedEmployees}
            options={uniqueEmployees}
          />

          {/* Closed By Filter (Searchable Multi-Select Checkbox) */}
          <SearchableMultiSelectDropdown
            placeholder="مغلق بواسطة (الكل)..."
            selectedValues={selectedClosedBy}
            onChange={setSelectedClosedBy}
            options={uniqueClosedByUsers}
          />

          {/* Branch Filter (Searchable Multi-Select Checkbox) */}
          <SearchableMultiSelectDropdown
            placeholder="الفرع (الكل)..."
            selectedValues={selectedBranches}
            onChange={setSelectedBranches}
            options={branches.map(b => ({ label: b.name, value: b.id }))}
          />

          {/* Month Filter by Submission Date (Searchable Multi-Select Checkbox) */}
          <SearchableMultiSelectDropdown
            placeholder="شهر التقديم (الكل)..."
            selectedValues={selectedMonths}
            onChange={setSelectedMonths}
            options={MONTH_OPTIONS}
          />

          {/* Month Filter by Closing Date (Searchable Multi-Select Checkbox) */}
          <SearchableMultiSelectDropdown
            placeholder="شهر الإغلاق (الكل)..."
            selectedValues={selectedClosedMonths}
            onChange={setSelectedClosedMonths}
            options={MONTH_OPTIONS}
          />

        </div>
      </div>

      {/* 3. Main Workspace - Tickets List Rows (Table view) */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-100 select-none">
                <th className="p-4 w-[11%] text-right font-bold resize-x overflow-auto">
                  <button type="button" onClick={() => handleSort('ticketNumber')} className="hover:text-teal-600 hover:underline cursor-pointer flex items-center gap-1 font-bold">
                    <span>رقم الطلب</span>
                    {sortField === 'ticketNumber' && (sortOrder === 'asc' ? ' 🔼' : ' 🔽')}
                  </button>
                </th>
                <th className="p-4 w-[14%] text-right font-bold resize-x overflow-auto">
                  <button type="button" onClick={() => handleSort('type')} className="hover:text-teal-600 hover:underline cursor-pointer flex items-center gap-1 font-bold">
                    <span>الموضوع / النوع</span>
                    {sortField === 'type' && (sortOrder === 'asc' ? ' 🔼' : ' 🔽')}
                  </button>
                </th>
                <th className="p-4 w-[23%] text-right font-bold resize-x overflow-auto">
                  <button type="button" onClick={() => handleSort('title')} className="hover:text-teal-600 hover:underline cursor-pointer flex items-center gap-1 font-bold">
                    <span>عنوان الطلب</span>
                    {sortField === 'title' && (sortOrder === 'asc' ? ' 🔼' : ' 🔽')}
                  </button>
                </th>
                <th className="p-4 w-[14%] text-right font-bold resize-x overflow-auto">
                  <button type="button" onClick={() => handleSort('employeeName')} className="hover:text-teal-600 hover:underline cursor-pointer flex items-center gap-1 font-bold">
                    <span>مقدم الطلب والفرع</span>
                    {sortField === 'employeeName' && (sortOrder === 'asc' ? ' 🔼' : ' 🔽')}
                  </button>
                </th>
                <th className="p-4 w-[11%] text-right font-bold resize-x overflow-auto">
                  <button type="button" onClick={() => handleSort('createdAt')} className="hover:text-teal-600 hover:underline cursor-pointer flex items-center gap-1 font-bold">
                    <span>تاريخ التقديم</span>
                    {sortField === 'createdAt' && (sortOrder === 'asc' ? ' 🔼' : ' 🔽')}
                  </button>
                </th>
                {canViewTicketAmount && (
                  <th className="p-4 w-[10%] text-right font-bold resize-x overflow-auto">
                    <button type="button" onClick={() => handleSort('amount')} className="hover:text-teal-600 hover:underline cursor-pointer flex items-center gap-1 font-bold">
                      <span>المبلغ</span>
                      {sortField === 'amount' && (sortOrder === 'asc' ? ' 🔼' : ' 🔽')}
                    </button>
                  </th>
                )}
                <th className="p-4 w-[10%] text-right font-bold resize-x overflow-auto">
                  <button type="button" onClick={() => handleSort('status')} className="hover:text-teal-600 hover:underline cursor-pointer flex items-center gap-1 font-bold">
                    <span>الحالة</span>
                    {sortField === 'status' && (sortOrder === 'asc' ? ' 🔼' : ' 🔽')}
                  </button>
                </th>
                <th className="p-4 w-[11%] text-right font-bold resize-x overflow-auto">
                  <button type="button" onClick={() => handleSort('closedByName')} className="hover:text-teal-600 hover:underline cursor-pointer flex items-center gap-1 font-bold">
                    <span>المعالج / المغلق</span>
                    {sortField === 'closedByName' && (sortOrder === 'asc' ? ' 🔼' : ' 🔽')}
                  </button>
                </th>
                <th className="p-4 w-[8%] text-center font-bold resize-x overflow-auto">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/60">
              {sortedTickets.length === 0 ? (
                <tr>
                  <td colSpan={canViewTicketAmount ? 9 : 8} className="p-8 text-center space-y-3">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                      <Inbox className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-bold text-slate-500">لا توجد طلبات دعم متوافقة مع خيارات التصفية الحالية.</p>
                  </td>
                </tr>
              ) : (
                sortedTickets.map(t => {
                  const ticketBranchName = branches.find(b => b.id === t.branchId)?.name || 'الفرع الرئيسي';
                  
                  // Color mapping for types
                  let typeColor = 'bg-slate-100 text-slate-700';
                  if (t.type === 'إجازة') typeColor = 'bg-teal-50 text-teal-700 border border-teal-100/60';
                  else if (t.type === 'راتب') typeColor = 'bg-emerald-50 text-emerald-700 border border-emerald-100/60';
                  else if (t.type === 'طلب إداري') typeColor = 'bg-blue-50 text-blue-700 border border-blue-100/60';
                  else if (t.type === 'أخرى') typeColor = 'bg-indigo-50 text-indigo-700 border border-indigo-100/60';

                  // Color mapping for statuses
                  let statusColor = 'bg-amber-500/10 text-amber-700 border border-amber-500/20';
                  let statusLabel = 'جديد (معلق)';
                  if (t.status === 'processing') {
                    statusColor = 'bg-indigo-500/10 text-indigo-700 border border-indigo-500/20';
                    statusLabel = 'قيد المعالجة';
                  } else if (t.status === 'completed') {
                    statusColor = 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20';
                    statusLabel = 'مكتمل ومغلق';
                  }

                  const processingUser = t.processingByName || getTicketProcessingUser(t);

                  return (
                    <tr 
                      key={t.id} 
                      onClick={() => {
                        setSelectedTicketId(t.id);
                        setIsTicketModalOpen(true);
                      }}
                      className={`hover:bg-slate-50 hover:shadow-2xs transition-all duration-200 cursor-pointer group ${
                        selectedTicketId === t.id 
                          ? 'selected-invoice bg-blue-50 hover:bg-blue-100 shadow-[inset_0_0_0_1px_#bfdbfe]' 
                          : t.status === 'new' 
                            ? 'bg-amber-50/60 hover:bg-amber-100/40 border-r-2 border-r-amber-400' 
                            : ''
                      }`}
                    >
                      <td className={`p-4 font-mono font-bold ${t.status === 'new' && selectedTicketId !== t.id ? 'text-amber-600 font-black' : 'text-slate-700'}`}>#{t.ticketNumber}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-md font-bold text-[10px] ${typeColor}`}>
                          {t.type}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-slate-800 line-clamp-1 group-hover:text-teal-600 transition-colors flex items-center gap-1.5 flex-wrap">
                          <span>{t.title}</span>
                          {t.employeeId === currentUser.id && t.unreadByEmployee && (
                            <span className="px-1.5 py-0.5 bg-amber-500 text-white rounded text-[8px] font-black animate-pulse">تحديث جديد</span>
                          )}
                          {canManageTicket(t.type) && t.unreadByHr && (
                            <span className="px-1.5 py-0.5 bg-indigo-500 text-white rounded text-[8px] font-black animate-pulse">رد جديد</span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{t.details}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-slate-700">
                          {t.employeeName}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Building className="w-3 h-3 text-slate-400" />
                          <span>{ticketBranchName}</span>
                        </div>
                      </td>
                      <td className="p-4 text-slate-500 font-mono">
                        {new Date(t.createdAt).toLocaleDateString('en-GB')}
                      </td>
                      {canViewTicketAmount && (
                        <td className="p-4 font-mono font-bold text-slate-700">
                          {t.amount !== undefined && t.amount !== null && !isNaN(Number(t.amount)) ? (
                            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-mono text-[11px] font-black inline-flex items-center gap-1">
                              <span>{Number(t.amount).toFixed(3)}</span>
                              <span className="text-[9px] text-emerald-600">ر.ع</span>
                            </span>
                          ) : (
                            <span className="text-slate-300 font-mono">-</span>
                          )}
                        </td>
                      )}
                      <td className="p-4">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${statusColor}`}>
                          {statusLabel}
                        </span>
                      </td>
                      <td className="p-4">
                        {t.status === 'completed' && t.closedByName ? (
                          <div className="text-[10px] text-emerald-700 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20 inline-flex items-center gap-1 font-bold">
                            <span>🔒 {t.closedByName}</span>
                          </div>
                        ) : t.status === 'processing' && processingUser ? (
                          <div className="text-[10px] text-blue-700 bg-blue-500/10 px-2 py-1 rounded-lg border border-blue-500/20 inline-flex items-center gap-1 font-bold">
                            <span>🔄 {processingUser}</span>
                          </div>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTicketId(t.id);
                              setIsTicketModalOpen(true);
                            }}
                            className="px-3 py-1.5 bg-teal-50 text-teal-700 hover:bg-teal-100 hover:text-teal-800 hover:scale-105 active:scale-95 rounded-lg text-[10px] font-black transition-all duration-200 cursor-pointer inline-flex items-center gap-1"
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>التفاصيل والشات</span>
                          </button>
                          {currentUser.role === 'admin' && (
                            <button
                              type="button"
                              onClick={() => handleDeleteTicket(t.id)}
                              className="p-1.5 text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:scale-110 active:scale-95 rounded-lg transition-all duration-200 border border-transparent hover:border-rose-200 cursor-pointer"
                              title="حذف التذكرة نهائياً"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Excel Export - Small & Faint Style */}
      <div className="flex justify-center items-center py-2 mt-2">
        <button
          type="button"
          onClick={() => exportTicketsToExcel(sortedTickets, branches)}
          className="flex items-center gap-1.5 text-[10px] text-slate-400/80 hover:text-teal-600 transition-all cursor-pointer font-bold py-1 px-3.5 hover:bg-slate-100/50 rounded-lg border border-transparent hover:border-slate-200/40"
          title="تحميل البيانات المفلترة في ملف Excel منسق بالكامل"
        >
          <FileDown className="w-3.5 h-3.5 text-slate-400" />
          <span>تنزيل كافة بيانات الطلبات والمستندات بصيغة إكسل (Excel)</span>
        </button>
      </div>

      {/* Detail View Chat Dialog (Popup Modal) */}
      <AnimatePresence>
        {isTicketModalOpen && selectedTicket && (
          <div 
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-[100] flex justify-center items-center p-4"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) {
                setIsTicketModalOpen(false);
              }
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-xl w-full max-w-6xl h-[88vh] flex flex-col overflow-hidden border border-slate-100 text-right"
              dir="rtl"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-mono font-bold text-slate-400">#{selectedTicket.ticketNumber}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                    {selectedTicket.type}
                  </span>
                  <h3 className="text-sm font-black text-slate-800">{selectedTicket.title}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsTicketModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200/50 cursor-pointer"
                  title="إغلاق النافذة"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body - Grid layout for ticket details & chat */}
              <div className="flex-1 overflow-hidden flex flex-col lg:flex-row bg-slate-50/40">
                
                {/* Right side - Ticket details & status controls (Balanced Width: 50%) */}
                <div className="w-full lg:w-1/2 border-l border-slate-200/80 p-3.5 md:p-4 overflow-y-auto space-y-2.5">
                  
                  {/* Status controls */}
                  {canManageTicket(selectedTicket.type) && (
                    <div className="bg-white border border-slate-200/70 rounded-xl p-2.5 md:p-3 shadow-3xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-700 block">التحكم بحالة الطلب (HR):</span>
                        {currentUser.role === 'admin' && (
                          <button
                            type="button"
                            onClick={() => handleDeleteTicket(selectedTicket.id)}
                            className="p-1 text-slate-500 hover:bg-rose-50 hover:text-rose-600 hover:scale-105 active:scale-95 rounded-lg transition-all duration-200 border border-transparent hover:border-rose-200 cursor-pointer"
                            title="حذف هذه التذكرة نهائياً"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <div className="flex gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(selectedTicket.id, 'new')}
                          className={`text-[10px] font-black py-1 px-2.5 rounded-lg border transition-all cursor-pointer ${
                            selectedTicket.status === 'new'
                              ? 'bg-amber-600 text-white border-amber-600'
                              : 'bg-white text-amber-700 border-amber-200 hover:bg-amber-50/50'
                          }`}
                        >
                          🆕 معلق (جديد)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(selectedTicket.id, 'processing')}
                          className={`text-[10px] font-black py-1 px-2.5 rounded-lg border transition-all cursor-pointer ${
                            selectedTicket.status === 'processing'
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50/50'
                          }`}
                        >
                          🔄 قيد المعالجة
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(selectedTicket.id, 'completed')}
                          className={`text-[10px] font-black py-1 px-2.5 rounded-lg border transition-all cursor-pointer ${
                            selectedTicket.status === 'completed'
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50/50'
                          }`}
                        >
                          ✅ مكتمل ومغلق
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Ticket Information Panel */}
                  <div className="bg-white border border-slate-200/70 rounded-xl p-2.5 md:p-3 shadow-3xs space-y-2">
                    <div className="border-b border-slate-100 pb-1.5 flex items-center justify-between">
                      <span className="text-xs font-black text-slate-700">بيانات الطلب الأساسية</span>
                      <div className="flex items-center gap-1.5">
                        {currentUser.role === 'admin' && !isEditingTicket && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditTitle(selectedTicket.title);
                              setEditType(selectedTicket.type);
                              setEditDetails(selectedTicket.details);
                              setIsEditingTicket(true);
                            }}
                            className="px-2 py-0.5 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-lg text-[9px] font-black transition-all cursor-pointer flex items-center gap-1 border border-teal-100/50"
                          >
                            <span>✏️ تعديل الطلب</span>
                          </button>
                        )}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          selectedTicket.status === 'new' 
                            ? 'bg-amber-500/10 text-amber-700 border border-amber-500/20' 
                            : selectedTicket.status === 'processing'
                            ? 'bg-indigo-500/10 text-indigo-700 border border-indigo-500/20'
                            : 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20'
                        }`}>
                          {selectedTicket.status === 'new' ? 'جديد معلق' : selectedTicket.status === 'processing' ? 'قيد المعالجة' : 'مكتمل ومغلق'}
                        </span>
                      </div>
                    </div>

                    {isEditingTicket ? (
                      <div className="space-y-2 pt-0.5">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 mb-0.5">تاريخ الطلب:</label>
                            <input
                              type="datetime-local"
                              value={editCreatedAt ? editCreatedAt.substring(0, 16) : ''}
                              onChange={(e) => setEditCreatedAt(new Date(e.target.value).toISOString())}
                              className="w-full text-xs p-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 font-bold"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 mb-0.5">مقدم الطلب:</label>
                            <select
                              value={editEmployeeId}
                              onChange={(e) => setEditEmployeeId(e.target.value)}
                              className="w-full text-xs p-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 font-bold"
                            >
                              {users.map(u => (
                                <option key={u.id} value={u.id}>{u.name || u.fullName}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 mb-0.5">نوع وموضوع الطلب:</label>
                          <select
                            value={editType}
                            onChange={(e) => setEditType(e.target.value)}
                            className="w-full text-xs p-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 font-bold"
                          >
                            {ticketTypes.map(type => (
                              <option key={type} value={type}>{type}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 mb-0.5">عنوان الطلب / التذكرة:</label>
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 mb-0.5">تفاصيل الطلب:</label>
                          <textarea
                            value={editDetails}
                            onChange={(e) => setEditDetails(e.target.value)}
                            rows={3}
                            className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 leading-relaxed font-bold"
                          />
                        </div>
                        {canInputTicketAmount && (
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 mb-0.5">المبلغ المالي (ر.ع):</label>
                            <input
                              type="number"
                              step="0.001"
                              min="0"
                              value={editAmount}
                              onChange={(e) => setEditAmount(e.target.value)}
                              placeholder="0.000"
                              className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 font-bold font-mono text-left"
                              dir="ltr"
                            />
                          </div>
                        )}
                        <div className="flex gap-2 pt-1">
                          <button
                            type="button"
                            onClick={handleSaveTicketEdits}
                            className="flex-1 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-black transition-all cursor-pointer"
                          >
                            حفظ التعديلات
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsEditingTicket(false)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-black transition-all cursor-pointer"
                          >
                            إلغاء
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-slate-700 font-bold">
                        <div className="bg-slate-50/80 px-2.5 py-1.5 rounded-lg border border-slate-100/90 flex items-center justify-between gap-1.5">
                          <span className="text-[10px] text-slate-400 shrink-0 font-bold">مقدم الطلب:</span>
                          <span className="text-xs text-slate-800 font-bold truncate">{selectedTicket.employeeName}</span>
                        </div>
                        <div className="bg-slate-50/80 px-2.5 py-1.5 rounded-lg border border-slate-100/90 flex items-center justify-between gap-1.5">
                          <span className="text-[10px] text-slate-400 shrink-0 font-bold">نوع وموضوع الطلب:</span>
                          <span className="text-xs text-teal-700 font-black truncate">{selectedTicket.type}</span>
                        </div>
                        <div className="bg-slate-50/80 px-2.5 py-1.5 rounded-lg border border-slate-100/90 sm:col-span-2 flex items-center justify-between gap-1.5">
                          <span className="text-[10px] text-slate-400 shrink-0 font-bold">عنوان الطلب:</span>
                          <span className="text-xs text-slate-900 font-black truncate">{selectedTicket.title}</span>
                        </div>
                        <div className="bg-slate-50/80 px-2.5 py-1.5 rounded-lg border border-slate-100/90 flex items-center justify-between gap-1.5">
                          <span className="text-[10px] text-slate-400 shrink-0 font-bold">الفرع:</span>
                          <span className="text-xs text-slate-700 font-bold truncate">{branches.find(b => b.id === selectedTicket.branchId)?.name || 'الفرع الرئيسي'}</span>
                        </div>
                        <div className="bg-slate-50/80 px-2.5 py-1.5 rounded-lg border border-slate-100/90 flex items-center justify-between gap-1.5">
                          <span className="text-[10px] text-slate-400 shrink-0 font-bold">تاريخ التقديم:</span>
                          <span className="text-xs text-slate-700 font-bold">{new Date(selectedTicket.createdAt).toLocaleDateString('ar-OM', { year: 'numeric', month: 'numeric', day: 'numeric' })}</span>
                        </div>
                        {selectedTicket.status === 'processing' && (
                          <div className="sm:col-span-2 flex items-center justify-between text-xs text-blue-900 bg-blue-50/90 px-2.5 py-1.5 rounded-lg border border-blue-200/90 shadow-3xs">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold">🔄 قيد المعالجة حالياً بواسطة:</span>
                              <span className="font-black bg-white px-2 py-0.5 rounded border border-blue-200 text-blue-700 text-xs shadow-3xs">
                                {selectedTicket.processingByName || getTicketProcessingUser(selectedTicket) || 'المسؤول'}
                              </span>
                            </div>
                            {selectedTicket.processingAt && (
                              <span className="text-[10px] text-blue-600 font-mono font-bold" dir="ltr">
                                {new Date(selectedTicket.processingAt).toLocaleDateString('ar-OM')} {new Date(selectedTicket.processingAt).toLocaleTimeString('ar-OM', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>
                        )}
                        {selectedTicket.status === 'completed' && (
                          <div className="sm:col-span-2 flex items-center justify-between text-xs text-emerald-900 bg-emerald-50/90 px-2.5 py-1.5 rounded-lg border border-emerald-200/90 shadow-3xs">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold">🔒 تم إغلاق الطلب واكتماله بواسطة:</span>
                              <span className="font-black bg-white px-2 py-0.5 rounded border border-emerald-200 text-emerald-700 text-xs shadow-3xs">
                                {selectedTicket.closedByName || 'المسؤول'}
                              </span>
                            </div>
                            {selectedTicket.closedAt && (
                              <span className="text-[10px] text-emerald-600 font-mono font-bold" dir="ltr">
                                {new Date(selectedTicket.closedAt).toLocaleDateString('ar-OM')} {new Date(selectedTicket.closedAt).toLocaleTimeString('ar-OM', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Core Request Details Box (تفاصيل الطلب الأساسي) - Expanded vertical space and dedicated prominent container */}
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-3xs space-y-3">
                    <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-teal-600" />
                        <span className="text-xs font-black text-slate-800">تفاصيل الطلب الأساسي المكتوب:</span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400">النص الكامل</span>
                    </div>

                    <div className="bg-slate-50/80 rounded-xl p-4 text-xs md:text-sm text-slate-800 border border-slate-200/70 leading-relaxed whitespace-pre-wrap break-words font-medium min-h-[180px] shadow-3xs">
                      {selectedTicket.details}
                    </div>

                    {selectedTicket.attachmentUrl && (
                      <div className="pt-2 border-t border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 block mb-2">المرفقات الأساسية مع الطلب:</span>
                        {selectedTicket.attachmentType === 'image' ? (
                          <div className="space-y-1">
                            <img 
                              src={selectedTicket.attachmentUrl} 
                              alt={selectedTicket.attachmentName || 'مرفق'} 
                              referrerPolicy="no-referrer"
                              className="max-w-full max-h-[260px] rounded-xl object-contain border border-slate-200 bg-white cursor-pointer hover:opacity-90 transition-opacity shadow-3xs"
                              onClick={() => setActiveLightbox(selectedTicket.attachmentUrl || null)}
                            />
                            <div className="flex justify-end pt-1">
                              <a 
                                href={selectedTicket.attachmentUrl} 
                                target="_blank" rel="noopener noreferrer"
                                download={selectedTicket.attachmentName || 'image.png'}
                                className="text-[10px] text-teal-600 hover:text-teal-700 underline font-black"
                              >
                                تحميل الصورة المرفقة 💾
                              </a>
                            </div>
                          </div>
                        ) : (
                          <a 
                            href={selectedTicket.attachmentUrl} 
                            target="_blank" rel="noopener noreferrer"
                            download={selectedTicket.attachmentName || 'file'}
                            className="flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold bg-slate-50 hover:bg-slate-100 text-teal-700 border-slate-200 transition-all inline-flex shadow-3xs"
                          >
                            <FileText className="w-4 h-4 shrink-0 text-amber-500" />
                            <span className="truncate max-w-[220px] text-right text-[11px]" dir="ltr">
                              {selectedTicket.attachmentName}
                            </span>
                          </a>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Amount Management Card (Visible for canViewTicketAmount & Editable for canInputTicketAmount) - Compressed, reduced padding & font */}
                  {canViewTicketAmount && !isEditingTicket && (
                    <div className="w-full bg-gradient-to-br from-emerald-50/60 via-teal-50/20 to-white border border-emerald-200/80 rounded-xl p-2.5 md:p-3 space-y-2 shadow-3xs">
                      <div className="flex items-center justify-between border-b border-emerald-100/80 pb-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs shadow-3xs">
                            💰
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black text-emerald-950">المبلغ المالي للطلب</span>
                            <span className="text-[9px] text-emerald-700 font-bold bg-emerald-100/60 px-1.5 py-0.5 rounded">
                              {canInputTicketAmount ? 'إدخال وتعديل' : 'رؤية واستعراض'}
                            </span>
                          </div>
                        </div>

                        {canInputTicketAmount && !isEditingDirectAmount && (
                          <button
                            type="button"
                            onClick={() => {
                              setDirectAmountInput(selectedTicket.amount !== undefined && selectedTicket.amount !== null ? String(selectedTicket.amount) : '');
                              setIsEditingDirectAmount(true);
                            }}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black transition-all cursor-pointer flex items-center gap-1 shadow-3xs"
                          >
                            <Pencil className="w-3 h-3" />
                            <span>تعديل المبلغ</span>
                          </button>
                        )}
                      </div>

                      {isEditingDirectAmount ? (
                        <div className="w-full space-y-1.5 bg-white p-2.5 rounded-lg border border-emerald-300 shadow-3xs animate-fade-in">
                          <label className="block text-[11px] font-black text-slate-800">أدخل المبلغ المالي الجديد للطلب (أرقام فقط):</label>
                          <div className="flex items-center gap-1.5">
                            <div className="relative flex-1">
                              <input
                                type="number"
                                step="0.001"
                                min="0"
                                value={directAmountInput}
                                onChange={(e) => setDirectAmountInput(e.target.value)}
                                placeholder="0.000"
                                className="w-full text-xs p-1.5 pl-12 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono font-bold text-left"
                                dir="ltr"
                                autoFocus
                              />
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-black text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded">ر.ع</span>
                            </div>
                            <button
                              type="button"
                              onClick={handleSaveDirectAmount}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black transition-all cursor-pointer shadow-3xs flex items-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>حفظ</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsEditingDirectAmount(false)}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-black transition-all cursor-pointer"
                            >
                              إلغاء
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full flex items-center justify-between bg-white/95 px-3 py-1.5 rounded-lg border border-emerald-200/80 shadow-3xs">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-700">المبلغ المسجل للطلب:</span>
                          </div>
                          <div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 border border-emerald-300/80 text-emerald-800 rounded-lg text-xs md:text-sm font-black font-mono shadow-3xs">
                              {selectedTicket.amount !== undefined && selectedTicket.amount !== null
                                ? `${Number(selectedTicket.amount).toFixed(3)} ر.ع`
                                : 'لم يُحدد مبلغ بعد'}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Last edited record & history */}
                      <div className="pt-1.5 border-t border-emerald-100/80 space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>آخر تعديل:</span>
                          </span>
                          {selectedTicket.lastAmountEditedAt ? (
                            <span className="text-emerald-950 font-bold font-mono" dir="ltr">
                              {new Date(selectedTicket.lastAmountEditedAt).toLocaleDateString('ar-OM', { year: 'numeric', month: 'numeric', day: 'numeric' })} {new Date(selectedTicket.lastAmountEditedAt).toLocaleTimeString('ar-OM', { hour: '2-digit', minute: '2-digit' })}
                              {selectedTicket.lastAmountEditedBy && (
                                <span className="mr-1 text-slate-600 font-sans">({selectedTicket.lastAmountEditedBy})</span>
                              )}
                            </span>
                          ) : (
                            <span className="text-slate-400">لم يُعدل</span>
                          )}
                        </div>

                        {/* Collapsible history of amount changes */}
                        {selectedTicket.amountHistory && selectedTicket.amountHistory.length > 0 && (
                          <div>
                            <button
                              type="button"
                              onClick={() => setShowAmountHistory(!showAmountHistory)}
                              className="text-[9px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-0.5 cursor-pointer"
                            >
                              <span>{showAmountHistory ? '▼ إخفاء سجل التعديلات' : `◀ سجل تعديلات المبلغ (${selectedTicket.amountHistory.length})`}</span>
                            </button>

                            {showAmountHistory && (
                              <div className="mt-1 space-y-1 max-h-32 overflow-y-auto bg-white p-2 rounded-lg border border-emerald-200 text-[10px]">
                                {[...selectedTicket.amountHistory].reverse().map((hist, idx) => (
                                  <div key={hist.id || idx} className="p-1.5 rounded bg-slate-50 border border-slate-100 flex items-center justify-between text-[10px]">
                                    <div>
                                      <span className="font-bold text-slate-800">{hist.changedByName}</span>
                                      <span className="text-slate-400 text-[9px] mr-1 font-mono">
                                        ({new Date(hist.changedAt).toLocaleDateString('ar-OM')})
                                      </span>
                                    </div>
                                    <div className="font-mono font-bold text-emerald-700 text-[10px]" dir="ltr">
                                      {hist.previousAmount !== undefined ? `${Number(hist.previousAmount).toFixed(3)} -> ` : ''}{Number(hist.amount).toFixed(3)} ر.ع
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Operations & Activity Log Card (سجل العمليات والإجراءات) - Compact and spaced */}
                  {(() => {
                    const ticketOperations = getTicketOperations(selectedTicket);
                    return (
                      <div className="w-full bg-white border border-slate-200/80 rounded-xl p-2.5 md:p-3 space-y-2 shadow-3xs">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-slate-800 text-teal-400 flex items-center justify-center text-xs shadow-3xs">
                              <History className="w-3.5 h-3.5" />
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-black text-slate-800">سجل العمليات والإجراءات</span>
                              <span className="px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded-full text-[9px] font-black border border-slate-200">
                                {ticketOperations.length}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setIsOperationsLogExpanded(!isOperationsLogExpanded)}
                            className="px-2 py-0.5 text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-md text-[9px] font-bold border border-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <span>{isOperationsLogExpanded ? 'طي ▲' : 'عرض ▼'}</span>
                          </button>
                        </div>

                        {isOperationsLogExpanded && (
                          <div className="space-y-1.5">
                            {ticketOperations.length === 0 ? (
                              <div className="p-3 text-center text-slate-400 bg-slate-50/60 rounded-lg text-[10px] font-bold border border-slate-100">
                                لا توجد عمليات مسجلة في هذا الطلب حتى الآن.
                              </div>
                            ) : (
                              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-0.5">
                                {ticketOperations.map((log) => {
                                  let typeBadgeColor = 'bg-slate-100 text-slate-700 border-slate-200';
                                  let typeIcon = '📋';

                                  if (log.type === 'creation') {
                                    typeBadgeColor = 'bg-teal-50 text-teal-800 border-teal-200';
                                    typeIcon = '🆕';
                                  } else if (log.type === 'status_change') {
                                    if (log.action.includes('معالجة') || log.details.includes('قيد المعالجة')) {
                                      typeBadgeColor = 'bg-blue-50 text-blue-800 border-blue-200';
                                      typeIcon = '🔄';
                                    } else {
                                      typeBadgeColor = 'bg-indigo-50 text-indigo-800 border-indigo-200';
                                      typeIcon = '⚡';
                                    }
                                  } else if (log.type === 'close') {
                                    typeBadgeColor = 'bg-emerald-50 text-emerald-800 border-emerald-200';
                                    typeIcon = '🔒';
                                  } else if (log.type === 'amount_change') {
                                    typeBadgeColor = 'bg-amber-50 text-amber-800 border-amber-200';
                                    typeIcon = '💰';
                                  } else if (log.type === 'edit') {
                                    typeBadgeColor = 'bg-purple-50 text-purple-800 border-purple-200';
                                    typeIcon = '✏️';
                                  }

                                  return (
                                    <div 
                                      key={log.id} 
                                      className="p-2 bg-slate-50/70 hover:bg-slate-50 rounded-lg border border-slate-200/70 transition-all text-xs space-y-1 shadow-3xs"
                                    >
                                      <div className="flex items-center justify-between gap-1 flex-wrap">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <span className={`px-1.5 py-0.5 rounded font-bold text-[9px] border flex items-center gap-1 ${typeBadgeColor}`}>
                                            <span>{typeIcon}</span>
                                            <span>{log.action}</span>
                                          </span>
                                          <span className="text-[10px] text-slate-400 font-bold">بواسطة:</span>
                                          <span className="font-black text-slate-800 text-[10px] bg-white px-1.5 py-0.5 rounded border border-slate-200/80">
                                            {log.performedByName}
                                          </span>
                                        </div>

                                        <div className="text-[9px] text-slate-400 font-mono font-bold shrink-0 text-left" dir="ltr">
                                          {new Date(log.timestamp).toLocaleDateString('ar-OM', { year: 'numeric', month: 'numeric', day: 'numeric' })} {new Date(log.timestamp).toLocaleTimeString('ar-OM', { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                      </div>

                                      <div className="text-slate-600 text-[10px] leading-relaxed pt-0.5 font-medium pr-1 border-r-2 border-slate-300 mr-0.5">
                                        {log.details}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                </div>

                {/* Left side - Conversation Chat (Balanced Width: 50%) */}
                <div className="w-full lg:w-1/2 flex flex-col bg-slate-50/20 h-full overflow-hidden">
                  
                  {/* Chat messages box */}
                  <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    {selectedTicket.messages.length === 0 ? (
                      <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-8 text-center space-y-2 mt-4">
                        <MessageSquare className="w-5 h-5 text-slate-400 mx-auto animate-pulse" />
                        <p className="text-xs font-bold text-slate-400">لا توجد رسائل بعد. ابدأ المناقشة أو الرد على هذا الطلب.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {selectedTicket.messages.map(msg => {
                          const isMe = msg.senderId === currentUser.id;
                          const isSystem = msg.senderId === 'system';

                          if (isSystem) {
                            return (
                              <div key={msg.id} className="flex justify-center my-2">
                                <span className="bg-slate-200/80 text-slate-600 text-[9px] font-black px-3 py-1 rounded-full border border-slate-300/40">
                                  🤖 {msg.content} - {new Date(msg.createdAt).toLocaleDateString('ar-OM')} {new Date(msg.createdAt).toLocaleTimeString('ar-OM', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            );
                          }

                          // Label for role
                          let roleLabel = 'الموظف';
                          let labelStyle = 'bg-slate-100 text-slate-500';
                          if (msg.senderRole === 'admin') {
                            roleLabel = 'مدير النظام';
                            labelStyle = 'bg-rose-50 text-rose-700 font-black';
                          } else if (msg.senderRole === 'hr') {
                            roleLabel = 'الموارد البشرية';
                            labelStyle = 'bg-teal-50 text-teal-700 font-black';
                          }

                          return (
                            <div
                              key={msg.id}
                              className={`flex flex-col max-w-[85%] ${isMe ? 'mr-auto items-start' : 'ml-auto items-end'}`}
                            >
                              <div className="flex items-center gap-1.5 mb-1">
                                {(() => {
                                  const msgUser = users.find(u => u.id === msg.senderId);
                                  return (
                                    <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-[9px] font-bold overflow-hidden shrink-0">
                                      {msgUser?.avatarUrl ? (
                                        <img src={msgUser.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                                      ) : (
                                        msg.senderName.charAt(0)
                                      )}
                                    </div>
                                  );
                                })()}
                                <span className="text-[10px] font-black text-slate-700">{msg.senderName}</span>
                                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-sm ${labelStyle}`}>
                                  {roleLabel}
                                </span>
                                {currentUser.role === 'admin' && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteTicketMessage(selectedTicket.id, msg.id)}
                                    className="text-slate-400 hover:text-rose-600 transition-colors p-0.5 rounded cursor-pointer"
                                    title="حذف التعليق"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>

                              <div className={`p-3 rounded-2xl text-xs leading-relaxed shadow-3xs ${
                                isMe 
                                  ? 'bg-teal-600 text-white rounded-tr-none' 
                                  : 'bg-white text-slate-800 border border-slate-200/60 rounded-tl-none'
                              }`}>
                                {msg.content && <div className="whitespace-pre-wrap">{msg.content}</div>}
                                
                                {msg.attachmentUrl && (
                                  <div className="mt-2 pt-2 border-t border-slate-100/20">
                                    {msg.attachmentType === 'image' ? (
                                      <div className="space-y-1">
                                        <img 
                                          src={msg.attachmentUrl} 
                                          alt={msg.attachmentName || 'مرفق'} 
                                          referrerPolicy="no-referrer"
                                          className="max-w-full max-h-[200px] rounded-lg object-contain border border-slate-200/40 cursor-pointer hover:opacity-90"
                                          onClick={() => setActiveLightbox(msg.attachmentUrl || null)}
                                        />
                                        <div className="flex justify-end">
                                          <a 
                                            href={msg.attachmentUrl} 
                                            target="_blank" rel="noopener noreferrer"
                                            download={msg.attachmentName || 'image.png'}
                                            className={`text-[9px] underline ${isMe ? 'text-teal-200 hover:text-white' : 'text-slate-400 hover:text-slate-600'}`}
                                          >
                                            تحميل الصورة 💾
                                          </a>
                                        </div>
                                      </div>
                                    ) : (
                                      <a 
                                        href={msg.attachmentUrl} 
                                        target="_blank" rel="noopener noreferrer"
                                        download={msg.attachmentName || 'file'}
                                        className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-semibold ${
                                          isMe 
                                            ? 'bg-teal-700/50 hover:bg-teal-800/60 text-white border-teal-500/30' 
                                            : 'bg-slate-50 hover:bg-slate-100 text-teal-700 border-slate-200/70'
                                        } transition-all`}
                                      >
                                        <FileText className="w-4 h-4 shrink-0 text-amber-500" />
                                        <span className="truncate max-w-[150px] text-right text-[10px]" dir="ltr">
                                          {msg.attachmentName}
                                        </span>
                                      </a>
                                    )}
                                  </div>
                                )}
                              </div>

                              <span className="text-[8px] text-slate-400 mt-1 font-mono">
                                {new Date(msg.createdAt).toLocaleDateString('ar-OM')} {new Date(msg.createdAt).toLocaleTimeString('ar-OM', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          );
                        })}
                        
                      </div>
                    )}
                  </div>

                  {/* Uploading progress indicator */}
                  {isUploading && (
                    <div className="px-4 py-3 bg-teal-50/50 border-t border-slate-100 flex flex-col gap-2 animate-fade-in">
                      <div className="flex items-center justify-between text-[10px] font-bold text-teal-700">
                        <span className="flex items-center gap-1.5">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          جاري معالجة ورفع المرفق...
                        </span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-teal-100/50 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="bg-teal-500 h-1.5 rounded-full transition-all duration-300 ease-out"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Attachment preview inside chat panel */}
                  {attachment && !isUploading && (
                    <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3 animate-fade-in">
                      <div className="flex items-center gap-2 overflow-hidden">
                        {attachment.type === 'image' ? (
                          <div className="relative w-10 h-10 rounded-lg border border-slate-200 overflow-hidden shrink-0 bg-white">
                            <img src={attachment.url} alt="معاينة" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-lg border border-slate-200 bg-amber-50 flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5 text-amber-500" />
                          </div>
                        )}
                        <div className="text-right">
                          <p className="text-[10px] font-black text-slate-700 truncate max-w-[180px]" dir="ltr">
                            {attachment.name}
                          </p>
                          <p className="text-[8px] text-slate-400">
                            {attachment.type === 'image' ? 'صورة جاهزة للإرسال' : 'ملف مرفق جاهز للإرسال'}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAttachment(null)}
                        className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                        title="إلغاء المرفق"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* Message Input sending form */}
                  <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 bg-white flex items-center gap-2 relative shrink-0">
                    
                    {/* Hidden File Input */}
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      onChange={handleFileChange}
                      accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt" 
                    />

                    {/* Emoji Picker Popover */}
                    {showEmojiPicker && (
                      <div className="absolute bottom-16 right-4 z-50 bg-white border border-slate-200/80 rounded-2xl shadow-lg p-3 w-64 max-w-xs animate-in fade-in slide-in-from-bottom-2 duration-150">
                        <div className="flex justify-between items-center mb-2 pb-1 border-b border-slate-100">
                          <span className="text-[10px] font-black text-slate-500">اختر رمز تعبيري (Emoji)</span>
                          <button 
                            type="button" 
                            onClick={() => setShowEmojiPicker(false)}
                            className="text-slate-400 hover:text-slate-600 text-xs font-black p-0.5 cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                        <div className="grid grid-cols-6 gap-2">
                          {COMMON_EMOJIS.map(emoji => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => {
                                setMessageInput(prev => prev + emoji);
                                setShowEmojiPicker(false);
                              }}
                              className="text-base p-1 hover:bg-slate-50 rounded-lg transition-all active:scale-90 cursor-pointer text-center"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Emoji Trigger Button */}
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className={`p-2.5 rounded-xl border transition-all flex items-center justify-center cursor-pointer shrink-0 ${
                        showEmojiPicker 
                          ? 'bg-amber-50 border-amber-200 text-amber-600' 
                          : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                      }`}
                      title="إدراج رمز تعبيري"
                    >
                      <Smile className="w-4 h-4" />
                    </button>

                    {/* Attachment File Trigger Button */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2.5 bg-slate-50 border border-slate-100 hover:bg-slate-100 text-slate-500 hover:text-slate-700 rounded-xl transition-all flex items-center justify-center cursor-pointer shrink-0"
                      title="إرفاق ملف أو صورة"
                    >
                      <Paperclip className="w-4 h-4" />
                    </button>

                    {/* Main Message Input Text Field */}
                    <textarea
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onPaste={handlePaste}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(e as any);
                        }
                      }}
                      rows={1}
                      placeholder="اكتب ردك هنا... (يمكنك لصق الصور Ctrl+V، واضغط Shift+Enter لسطر جديد)"
                      className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-teal-500/10 focus:border-teal-500 transition-all resize-none min-h-[40px] max-h-[120px] pt-2.5"
                    />

                    {/* Submit Send Button */}
                    <button
                      type="submit"
                      disabled={!messageInput.trim() && !attachment}
                      className="p-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl transition-all shadow-sm shadow-teal-600/10 disabled:bg-slate-200 disabled:shadow-none flex items-center justify-center cursor-pointer shrink-0"
                      title="إرسال"
                    >
                      <Send className="w-4 h-4 transform -rotate-180" />
                    </button>
                  </form>

                </div>

              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-[100] flex justify-center items-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-100"
            >
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <Plus className="w-5 h-5 text-teal-600" />
                  <h3 className="text-sm font-black text-slate-800">تقديم تذكرة / طلب إداري جديد</h3>
                </div>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200/50"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateTicket} className="p-6 space-y-4">
                
                {formError && (
                  <div className="p-3 text-xs rounded-xl bg-rose-50 text-rose-800 border border-rose-100 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 block">نوع وموضوع الطلب *</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-teal-500/10 focus:border-teal-500 text-xs font-bold text-slate-700 bg-white shadow-3xs text-right"
                  >
                    {ticketTypes.map(type => {
                      let emoji = '📁';
                      if (type.includes('إجازة') || type.includes('استئذان') || type.includes('غياب') || type.includes('مغادرة')) emoji = '🌴';
                      else if (type.includes('راتب') || type.includes('سلف') || type.includes('مالي') || type.includes('مستحقات') || type.includes('عهد')) emoji = '💰';
                      else if (type.includes('إداري') || type.includes('رسمي') || type.includes('خطاب') || type.includes('طلب')) emoji = '📝';
                      else if (type.includes('دعم') || type.includes('فني') || type.includes('مشكلة') || type.includes('أخرى') || type.includes('تقني')) emoji = '⚙️';
                      
                      return (
                        <option key={type} value={type}>
                          {emoji} {type}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 block">عنوان الطلب باختصار *</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="مثال: طلب إجازة طارئة لوجود مراجعة طبية"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-teal-500/10 focus:border-teal-500 text-xs font-bold text-slate-700 shadow-3xs"
                    required
                  />
                </div>

                <div className="space-y-1.5 relative">
                  <label className="text-xs font-bold text-slate-500 block">تفاصيل الطلب والوصف التفصيلي *</label>
                  
                  <div className="border border-slate-200 rounded-xl bg-slate-50 overflow-hidden focus-within:ring-2 focus-within:ring-teal-500/10 focus-within:border-teal-500 transition-all shadow-3xs">
                    <textarea
                      rows={5}
                      value={newDetails}
                      onChange={(e) => setNewDetails(e.target.value)}
                      onPaste={handleCreatePaste}
                      placeholder={ticketTypePlaceholders?.[newType] || "اكتب كامل تفاصيل ومبررات طلبك هنا ليتمكن قسم الموارد البشرية من مراجعته... (يمكنك لصق الصور Ctrl+V)"}
                      className="w-full px-3.5 py-2.5 bg-transparent border-0 focus:outline-none text-xs font-bold text-slate-600 leading-relaxed resize-none"
                      required
                    />

                    {/* Hidden File Input */}
                    <input 
                      type="file" 
                      ref={createTicketFileInputRef} 
                      className="hidden" 
                      onChange={handleCreateFileChange}
                      accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt" 
                    />

                    {/* Footer bar of the textarea for Attach and Emoji buttons */}
                    <div className="px-3 py-2 bg-slate-100/60 border-t border-slate-200/60 flex items-center gap-2 relative">
                      {/* Emoji Trigger Button */}
                      <button
                        type="button"
                        onClick={() => setShowCreateEmojiPicker(!showCreateEmojiPicker)}
                        className={`p-1.5 rounded-lg border transition-all flex items-center justify-center cursor-pointer ${
                          showCreateEmojiPicker 
                            ? 'bg-amber-100 text-amber-800 border-amber-200' 
                            : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                        }`}
                        title="إضافة إيموجي"
                      >
                        <Smile className="w-4 h-4" />
                      </button>

                      {/* Attachment File Trigger Button */}
                      <button
                        type="button"
                        onClick={() => createTicketFileInputRef.current?.click()}
                        className="p-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-700 rounded-lg transition-all flex items-center justify-center cursor-pointer"
                        title="إرفاق ملف أو صورة"
                      >
                        <Paperclip className="w-4 h-4" />
                      </button>

                      <span className="text-[10px] text-slate-400 mr-auto font-bold select-none">
                        يمكنك لصق الصور وإرفاق المستندات 📎
                      </span>

                      {/* Emoji Picker Popover */}
                      {showCreateEmojiPicker && (
                        <div className="absolute bottom-10 right-2 z-50 bg-white border border-slate-200/80 rounded-2xl shadow-lg p-3 w-64 max-w-xs animate-in fade-in slide-in-from-bottom-2 duration-150 text-right">
                          <div className="flex justify-between items-center mb-2 pb-1 border-b border-slate-100">
                            <span className="text-[10px] font-black text-slate-500">اختر رمز تعبيري (Emoji)</span>
                            <button 
                              type="button" 
                              onClick={() => setShowCreateEmojiPicker(false)}
                              className="text-slate-400 hover:text-slate-600 text-xs font-black p-0.5 cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                          <div className="grid grid-cols-6 gap-2">
                            {COMMON_EMOJIS.map(emoji => (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() => {
                                  setNewDetails(prev => prev + emoji);
                                  setShowCreateEmojiPicker(false);
                                }}
                                className="text-base p-1 hover:bg-slate-50 rounded-lg transition-all active:scale-90 cursor-pointer text-center"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Uploading progress indicator for create ticket */}
                  {isCreateUploading && (
                    <div className="mt-2 px-3 py-3 bg-teal-50/50 border border-teal-100 rounded-xl flex flex-col gap-2 animate-fade-in">
                      <div className="flex items-center justify-between text-[10px] font-bold text-teal-700">
                        <span className="flex items-center gap-1.5">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          جاري معالجة ورفع المرفق...
                        </span>
                        <span>{createUploadProgress}%</span>
                      </div>
                      <div className="w-full bg-teal-100/50 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="bg-teal-500 h-1.5 rounded-full transition-all duration-300 ease-out"
                          style={{ width: `${createUploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* New Ticket Attachment preview inside modal */}
                  {newTicketAttachment && !isCreateUploading && (
                    <div className="mt-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3 animate-fade-in">
                      <div className="flex items-center gap-2 overflow-hidden">
                        {newTicketAttachment.type === 'image' ? (
                          <div className="relative w-8 h-8 rounded-lg border border-slate-200 overflow-hidden shrink-0 bg-white">
                            <img src={newTicketAttachment.url} alt="معاينة المرفق" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-lg border border-slate-200 bg-amber-50 flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4 text-amber-500" />
                          </div>
                        )}
                        <div className="text-right">
                          <p className="text-[10px] font-black text-slate-700 truncate max-w-[200px]" dir="ltr">
                            {newTicketAttachment.name}
                          </p>
                          <p className="text-[8px] text-slate-400">
                            {newTicketAttachment.type === 'image' ? 'صورة مرفقة بالطلب' : 'ملف مستند مرفق بالطلب'}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setNewTicketAttachment(null)}
                        className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                        title="إلغاء المرفق"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Small Amount Input (Restricted strictly to numbers, visible only if permitted) */}
                {canInputTicketAmount && (
                  <div className="space-y-1.5 max-w-[220px]">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <span>المبلغ المالي (ر.ع):</span>
                      <span className="text-[10px] text-slate-400 font-normal">(أرقام فقط)</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.001"
                        min="0"
                        value={newAmount}
                        onChange={(e) => setNewAmount(e.target.value)}
                        onKeyDown={(e) => {
                          if (['e', 'E', '+', '-'].includes(e.key)) {
                            e.preventDefault();
                          }
                        }}
                        placeholder="0.000"
                        className="w-full pr-3 pl-8 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-teal-500/10 focus:border-teal-500 text-xs font-bold font-mono text-slate-800 shadow-3xs text-left"
                        dir="ltr"
                      />
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 pointer-events-none">
                        ر.ع
                      </span>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="flex-1 py-3 px-4 bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
                  >
                    إلغاء التقديم
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl hover:shadow-md hover:shadow-teal-500/20 transition-all cursor-pointer"
                  >
                    إرسال التذكرة للـ HR
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
