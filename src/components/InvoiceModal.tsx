/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { Invoice, InvoiceItem, Customer, InvoiceStatus, Service, User, Payment, UserRole, PaymentMethod } from '../types';
import { X, Plus, Trash2, GripVertical, Hash, FileText, Activity, Percent, Coins, UserCheck, Phone, Search, Printer, Users, Lock, Unlock, Download } from 'lucide-react';
import CustomerModal from './CustomerModal';
import ChatBox from './ChatBox';

interface InvoiceModalProps {
  systemSettings?: any;
  isOpen: boolean;
  onClose: () => void;
  onSave: (invoice: Invoice) => void;
  onPreview?: (invoice: Invoice) => void;
  customers: Customer[];
  services: Service[];
  users: User[];
  invoiceToEdit?: Invoice | null;
  currentUsername: string; // Tracks who is saving/editing
  currentUserRole: UserRole;
  onSaveCustomer: (customer: Customer) => void;
}

export default function InvoiceModal({
  systemSettings,
  isOpen,
  onClose,
  onSave,
  onPreview,
  customers,
  services,
  users,
  invoiceToEdit,
  currentUsername,
  currentUserRole,
  onSaveCustomer,
}: InvoiceModalProps) {
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [newPaymentAmount, setNewPaymentAmount] = useState<number>(0);
  const [newPaymentMethod, setNewPaymentMethod] = useState<PaymentMethod>('cash');
  const [activeServiceDropdownIndex, setActiveServiceDropdownIndex] = useState<number | null>(null);

  // Drag & drop reordering of invoice item rows (grip handle in the first cell)
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropTarget, setDropTarget] = useState<{ index: number; after: boolean } | null>(null);

  const moveItemRow = (from: number, to: number, after: boolean) => {
    setItems(prev => {
      if (from < 0 || from >= prev.length) return prev;
      const updated = [...prev];
      const [moved] = updated.splice(from, 1);
      // `to` refers to the index in the ORIGINAL array; adjust after removal
      let insertAt = to + (after ? 1 : 0);
      if (from < insertAt) insertAt -= 1;
      updated.splice(insertAt, 0, moved);
      return updated;
    });
    setActiveServiceDropdownIndex(null);
  };
  const [status, setStatus] = useState<InvoiceStatus>('unpaid');
  const [createdAt, setCreatedAt] = useState<string>('');
  const [closingDate, setClosingDate] = useState<string>('');
  const [error, setError] = useState('');

  const showError = (msg: string) => {
    setError(msg);
    if (msg) {
      toast.error(msg);
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const [isLocked, setIsLocked] = useState(false);
  const [customerExtraText, setCustomerExtraText] = useState('');
  const [isPrinting, setIsPrinting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [originalDocsReceived, setOriginalDocsReceived] = useState(false);
  const [originalDocsReceivedAt, setOriginalDocsReceivedAt] = useState('');
  const [originalDocsReceivedBy, setOriginalDocsReceivedBy] = useState('');
  const [originalDocsReceivedHistory, setOriginalDocsReceivedHistory] = useState<{ status: boolean; changedAt: string; changedBy: string }[]>([]);
  const [editedCreatedBy, setEditedCreatedBy] = useState('');
  const [editedLastModifiedBy, setEditedLastModifiedBy] = useState('');
  const [modificationHistory, setModificationHistory] = useState<{ modifiedAt: string; modifiedBy: string; action: string }[]>([]);

  const lastRowPriceRef = useRef<HTMLInputElement | null>(null);

  // Initialize fields
  useEffect(() => {
    if (invoiceToEdit) {
      setSelectedCustomerId(invoiceToEdit.customerId);
      const c = customers.find(c => c.id === invoiceToEdit.customerId);
      setClientSearchTerm(c ? c.name : '');
      if (invoiceToEdit.items && invoiceToEdit.items.length > 0) {
        setItems(invoiceToEdit.items.map(it => ({ ...it })));
      } else {
        setItems([{ id: `item-init-${Date.now()}`, serviceName: '', employeeName: currentUsername, quantity: 1, price: 0.000, discount: 0.000, total: 0.000, createdAt: new Date().toISOString() }]);
      }
      setIsLocked(invoiceToEdit.isLocked || false);
      setCustomerExtraText(invoiceToEdit.customerExtraText || '');
      setOriginalDocsReceived(invoiceToEdit.originalDocsReceived || false);
      setOriginalDocsReceivedAt(invoiceToEdit.originalDocsReceivedAt || '');
      setOriginalDocsReceivedBy(invoiceToEdit.originalDocsReceivedBy || '');
      setOriginalDocsReceivedHistory(invoiceToEdit.originalDocsReceivedHistory || []);
      setModificationHistory(invoiceToEdit.modificationHistory || []);
      setEditedCreatedBy(invoiceToEdit.createdBy || '');
      setEditedLastModifiedBy(invoiceToEdit.lastModifiedBy || '');
      
      let initPayments = invoiceToEdit.payments || [];
      if (initPayments.length === 0 && invoiceToEdit.downPayment > 0) {
        initPayments = [{
          id: `pay-${Date.now()}`,
          amount: invoiceToEdit.downPayment,
          date: invoiceToEdit.createdAt || new Date().toISOString(),
          recordedBy: invoiceToEdit.lastModifiedBy || currentUsername,
          notes: 'دفعة سابقة'
        }];
      }
      setPayments(initPayments);
      setStatus(invoiceToEdit.status);
      setCreatedAt(invoiceToEdit.createdAt);
      setClosingDate(invoiceToEdit.closingDate || '');
    } else {
      setSelectedCustomerId('');
      setClientSearchTerm('');
      setItems([{ id: 'item-init-1', serviceName: '', employeeName: currentUsername, quantity: 1, price: 0.000, discount: 0.000, total: 0.000, createdAt: new Date().toISOString() }]);
      setPayments([]);
      setStatus('unpaid');
      setCreatedAt(new Date().toISOString());
      setClosingDate('');
      setIsLocked(false);
      setCustomerExtraText('');
      setOriginalDocsReceived(false);
      setOriginalDocsReceivedAt('');
      setOriginalDocsReceivedBy('');
      setOriginalDocsReceivedHistory([]);
    }
    showError('');
  }, [invoiceToEdit, isOpen]);

  // Subtotals and totals
  const itemsGrossSubtotal = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  const calculatedTotalDiscount = items.reduce((sum, item) => sum + (item.discount || 0), 0);
  const totalAmount = Math.max(0, itemsGrossSubtotal - calculatedTotalDiscount);
  const calculatedDownPayment = payments.reduce((sum, p) => sum + p.amount, 0);
  const remainingAmount = Math.max(0, totalAmount - calculatedDownPayment);

  const isFullyPaid = totalAmount > 0 && remainingAmount <= 0;

  if (!isOpen) return null;

  const filteredCustomers = customers.filter(c => {
    const searchLower = clientSearchTerm.toLowerCase();
    return (
      (c.name?.toLowerCase().includes(searchLower) ?? false) || 
      (c.phone?.includes(searchLower) ?? false) ||
      c.civilId?.includes(searchLower) ||
      c.registrationNumber?.includes(searchLower)
    );
  });

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
  const isCreator = !invoiceToEdit || (invoiceToEdit.createdBy ? invoiceToEdit.createdBy === currentUsername : (invoiceToEdit.lastModifiedBy ? invoiceToEdit.lastModifiedBy === currentUsername : true));
  const isAdmin = currentUserRole === 'admin';

  const handleSaveNewCustomer = (savedCustomer: Customer) => {
    onSaveCustomer(savedCustomer);
    setSelectedCustomerId(savedCustomer.id);
    setClientSearchTerm(savedCustomer.name);
    setIsAddCustomerOpen(false);
  };

  // Handlers for Items
  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    setItems(prevItems => {
      const updated = [...prevItems];
      const item = { ...updated[index] };
  
      if (field === 'serviceName') {
        item.serviceName = value;
      } else if (field === 'employeeName') {
        item.employeeName = value;
      } else if (field === 'quantity') {
        item.quantity = Math.max(1, parseInt(value) || 0);
        item.total = (item.quantity * item.price) - (item.discount || 0);
      } else if (field === 'price') {
        item.price = Math.max(0, parseFloat(value) || 0);
        item.total = (item.quantity * item.price) - (item.discount || 0);
      } else if (field === 'discount') {
        item.discount = Math.max(0, parseFloat(value) || 0);
        item.total = (item.quantity * item.price) - (item.discount || 0);
      }
  
      updated[index] = item;
      return updated;
    });
  };

  const addItemRow = () => {
    setItems([
      ...items,
      { id: `item-${Date.now()}-${Math.random()}`, serviceName: '', employeeName: currentUsername, quantity: 1, price: 0.000, discount: 0.000, total: 0.000, createdAt: new Date().toISOString() }
    ]);
  };

  const removeItemRow = (index: number) => {
    if (items.length === 1) {
      showError('يجب أن تحتوي الفاتورة على بند واحد على الأقل');
      return;
    }
    const item = items[index];
    const isAdmin = currentUserRole === 'admin';
    const isOwnerOfItem = item.employeeName === currentUsername;
    
    if (!isAdmin && !isOwnerOfItem) {
      const errMsg = `عذراً، لا يمكنك حذف هذا البند لأنه مضاف بواسطة موظف آخر (${item.employeeName || 'غير معروف'}). يحق فقط لمدير النظام أو لمنشئ البند حذفه.`;
      showError(errMsg);
      toast.error(errMsg);
      return;
    }

    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
  };

  // Keyboard Navigation: pressing Tab in the price input of the last row appends a new row
  const handlePriceKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Tab' && !e.shiftKey) {
      // If we are at the very last item in the list, auto-append a new item
      if (index === items.length - 1) {
        e.preventDefault(); // Prevent standard page tab focus loss
        addItemRow();
        
        // Timeout to focus the service name of the newly appended row
        setTimeout(() => {
          const serviceInputs = document.querySelectorAll('.service-name-input');
          if (serviceInputs.length > 0) {
            const lastInput = serviceInputs[serviceInputs.length - 1] as HTMLInputElement;
            lastInput?.focus();
          }
        }, 50);
      }
    }
  };

  // Auto-adjust status based on payments if not draft
  const generateActionText = () => {
    if (!invoiceToEdit) return 'إنشاء فاتورة';
    
    const changes: string[] = [];
    const oldItems = invoiceToEdit.items || [];
    const newItems = items;
    
    const oldItemsMap = new Map(oldItems.map(i => [i.id, i]));
    const newItemsMap = new Map(newItems.map(i => [i.id, i]));
    
    let addedCount = 0;
    let removedCount = 0;
    let priceChanged = false;
    let employeeChanged = false;
    
    for (const newItem of newItems) {
      if (!oldItemsMap.has(newItem.id)) {
        addedCount++;
      } else {
        const oldItem = oldItemsMap.get(newItem.id)!;
        if (oldItem.price !== newItem.price || oldItem.quantity !== newItem.quantity || oldItem.discount !== newItem.discount || oldItem.total !== newItem.total) {
          priceChanged = true;
        }
        if (oldItem.employeeName !== newItem.employeeName) {
          employeeChanged = true;
        }
      }
    }
    
    for (const oldItem of oldItems) {
      if (!newItemsMap.has(oldItem.id)) {
        removedCount++;
      }
    }
    
    if (addedCount > 0) changes.push('إضافة بند');
    if (removedCount > 0) changes.push('حذف بند');
    if (priceChanged) changes.push('تعديل سعر');
    if (employeeChanged) changes.push('تغيير موظف');
    
    if (invoiceToEdit.downPayment !== calculatedDownPayment) {
      changes.push('تعديل الدفع المقدم');
    }
    if (invoiceToEdit.discount !== calculatedTotalDiscount) {
      changes.push('تعديل الخصم');
    }
    
    if (changes.length > 0) {
      return changes.join('، ');
    }
    return 'تحديث بيانات الفاتورة';
  };

  const getAutoStatus = (): InvoiceStatus => {
    if (status === 'draft') return 'draft';
    if (calculatedDownPayment === 0) return 'unpaid';
    if (remainingAmount <= 0) return 'paid';
    return 'partially_paid';
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      showError('يرجى اختيار عميل للفاتورة');
      return;
    }
    const emptyItems = items.filter(item => !item.serviceName.trim());
    if (emptyItems.length > 0) {
      showError('يرجى تعبئة تفاصيل الخدمة لجميع البنود المضافة');
      return;
    }

    const calculatedStatus = getAutoStatus();

    // Postpone the lock to be applied on successful submit/save:
    // If it's fully paid, it should be saved as locked, unless the admin explicitly unlocked it.
    let finalLocked = isLocked;
    if (isFullyPaid) {
      if (!isAdmin) {
        finalLocked = true;
      } else {
        finalLocked = isLocked;
      }
    }

    const invoiceData: Invoice = {
      id: invoiceToEdit?.id || `inv-${Date.now()}`,
      invoiceNumber: invoiceToEdit?.invoiceNumber || `INV-2026-${Math.floor(100 + Math.random() * 900)}`,
      customerId: selectedCustomerId,
      items: items.map(item => ({
        ...item,
        serviceName: item.serviceName.trim(),
      })),
      discount: calculatedTotalDiscount,
      downPayment: calculatedDownPayment,
      payments,
      totalAmount,
      remainingAmount,
      status: calculatedStatus,
      createdAt: createdAt,
      closingDate: closingDate || undefined,
      createdBy: (isAdmin && editedCreatedBy) ? editedCreatedBy : (invoiceToEdit?.createdBy || currentUsername),
      lastModifiedBy: (isAdmin && editedLastModifiedBy) ? editedLastModifiedBy : currentUsername,
      lastModifiedAt: new Date().toISOString(),
      isLocked: finalLocked,
      customerExtraText: customerExtraText.trim(),
        originalDocsReceived,
        originalDocsReceivedAt,
        originalDocsReceivedBy,
        originalDocsReceivedHistory,
        modificationHistory: [...modificationHistory, {
          modifiedAt: new Date().toISOString(),
          modifiedBy: currentUsername,
          action: generateActionText()
        }],
        branchId: invoiceToEdit?.branchId || (users.find(u => u.name?.trim().toLowerCase() === currentUsername.trim().toLowerCase() || u.username?.trim().toLowerCase() === currentUsername.trim().toLowerCase())?.branchId || 'branch-1'),
    };

    onSave(invoiceData);
    onClose();
  };

  const handlePreview = () => {
    if (!selectedCustomerId) {
      showError('يرجى اختيار عميل للفاتورة للمعاينة');
      return;
    }
    const emptyItems = items.filter(item => !item.serviceName.trim());
    if (emptyItems.length > 0) {
      showError('يرجى تعبئة تفاصيل الخدمة لجميع البنود المضافة للمعاينة');
      return;
    }

    const calculatedStatus = getAutoStatus();

    let finalLocked = isLocked;
    if (isFullyPaid) {
      if (!isAdmin) {
        finalLocked = true;
      } else {
        finalLocked = isLocked;
      }
    }

    const activeUser = users.find(u => 
      u.name?.trim().toLowerCase() === currentUsername.trim().toLowerCase() || 
      u.username?.trim().toLowerCase() === currentUsername.trim().toLowerCase()
    );
    const activeBranchId = activeUser?.branchId || 'branch-1';

    const previewInvoice: Invoice = {
      id: invoiceToEdit?.id || `inv-${Date.now()}`,
      invoiceNumber: invoiceToEdit?.invoiceNumber || `INV-2026-${Math.floor(100 + Math.random() * 900)}`,
      customerId: selectedCustomerId,
      items: items.map(item => ({
        ...item,
        serviceName: item.serviceName.trim(),
      })),
      discount: calculatedTotalDiscount,
      downPayment: calculatedDownPayment,
      payments,
      totalAmount,
      remainingAmount,
      status: calculatedStatus,
      createdAt: invoiceToEdit?.createdAt || new Date().toISOString(),
      createdBy: (isAdmin && editedCreatedBy) ? editedCreatedBy : (invoiceToEdit?.createdBy || currentUsername),
      lastModifiedBy: (isAdmin && editedLastModifiedBy) ? editedLastModifiedBy : currentUsername,
      lastModifiedAt: new Date().toISOString(),
      isLocked: finalLocked,
      customerExtraText: customerExtraText.trim(),
        originalDocsReceived,
        originalDocsReceivedAt,
        originalDocsReceivedBy,
        originalDocsReceivedHistory,
        modificationHistory: [...modificationHistory, {
          modifiedAt: new Date().toISOString(),
          modifiedBy: currentUsername,
          action: generateActionText()
        }],
branchId: invoiceToEdit?.branchId || activeBranchId,
    };

    if (onPreview) {
      onPreview(previewInvoice);
    }
  };

  const handlePrintDraft = async () => {
    if (!selectedCustomerId) {
      showError('يرجى اختيار عميل للفاتورة لطباعة مسودة');
      return;
    }
    
    setIsPrinting(true);
    try {
      const activeUser = users.find(u => 
        u.name?.trim().toLowerCase() === currentUsername.trim().toLowerCase() || 
        u.username?.trim().toLowerCase() === currentUsername.trim().toLowerCase()
      );
      const activeBranchId = activeUser?.branchId || 'branch-1';

      const draftInvoice: Invoice = {
        id: invoiceToEdit?.id || `inv-draft`,
        invoiceNumber: invoiceToEdit?.invoiceNumber || `مسودة مؤقتة`,
        customerId: selectedCustomerId,
        items: items.map(item => ({
          ...item,
          serviceName: item.serviceName.trim() || 'بند غير مسمى',
        })),
        discount: calculatedTotalDiscount,
        downPayment: calculatedDownPayment,
        payments,
        totalAmount,
        remainingAmount,
        status: 'draft',
        createdAt: invoiceToEdit?.createdAt || new Date().toISOString(),
        createdBy: (isAdmin && editedCreatedBy) ? editedCreatedBy : (invoiceToEdit?.createdBy || currentUsername),
        lastModifiedBy: (isAdmin && editedLastModifiedBy) ? editedLastModifiedBy : currentUsername,
        lastModifiedAt: new Date().toISOString(),
        isLocked,
        customerExtraText: customerExtraText.trim(),
        originalDocsReceived,
        originalDocsReceivedAt,
        originalDocsReceivedBy,
        originalDocsReceivedHistory,
        modificationHistory: [...modificationHistory, {
          modifiedAt: new Date().toISOString(),
          modifiedBy: currentUsername,
          action: generateActionText()
        }],
        branchId: invoiceToEdit?.branchId || activeBranchId,
      };
      const cust = customers.find(c => c.id === selectedCustomerId);
      const branchConfigUser = users.find(u => u.id === 'branches_config');
      const branches = branchConfigUser?.branches || [];
      
      const { directPrintInvoice } = await import('../utils/printUtils');
      await directPrintInvoice(draftInvoice, cust, undefined, branches);
    } catch (err) {
      console.error('Error printing draft:', err);
      showError('حدث خطأ أثناء محاولة الطباعة. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsPrinting(false);
    }
  };

  const handlePrintInvoiceDirect = async () => {
    if (!selectedCustomerId) {
      showError('يرجى اختيار عميل للفاتورة لطباعتها');
      return;
    }
    const emptyItems = items.filter(item => !item.serviceName.trim());
    if (emptyItems.length > 0) {
      showError('يرجى تعبئة تفاصيل الخدمة لجميع البنود المضافة للطباعة');
      return;
    }

    setIsPrinting(true);
    try {
      const calculatedStatus = getAutoStatus();
      const activeUser = users.find(u => 
        u.name?.trim().toLowerCase() === currentUsername.trim().toLowerCase() || 
        u.username?.trim().toLowerCase() === currentUsername.trim().toLowerCase()
      );
      const activeBranchId = activeUser?.branchId || 'branch-1';

      let finalLocked = isLocked;
      if (isFullyPaid) {
        if (!isAdmin) {
          finalLocked = true;
        } else {
          finalLocked = isLocked;
        }
      }

      const currentInvoice: Invoice = {
        id: invoiceToEdit?.id || `inv-${Date.now()}`,
        invoiceNumber: invoiceToEdit?.invoiceNumber || `INV-2026-${Math.floor(100 + Math.random() * 900)}`,
        customerId: selectedCustomerId,
        items: items.map(item => ({
          ...item,
          serviceName: item.serviceName.trim(),
        })),
        discount: calculatedTotalDiscount,
        downPayment: calculatedDownPayment,
        payments,
        totalAmount,
        remainingAmount,
        status: calculatedStatus,
        createdAt: invoiceToEdit?.createdAt || new Date().toISOString(),
        createdBy: (isAdmin && editedCreatedBy) ? editedCreatedBy : (invoiceToEdit?.createdBy || currentUsername),
        lastModifiedBy: (isAdmin && editedLastModifiedBy) ? editedLastModifiedBy : currentUsername,
        lastModifiedAt: new Date().toISOString(),
        isLocked: finalLocked,
        customerExtraText: customerExtraText.trim(),
        originalDocsReceived,
        originalDocsReceivedAt,
        originalDocsReceivedBy,
        originalDocsReceivedHistory,
        modificationHistory: [...modificationHistory, {
          modifiedAt: new Date().toISOString(),
          modifiedBy: currentUsername,
          action: generateActionText()
        }],
        branchId: invoiceToEdit?.branchId || activeBranchId,
      };

      const cust = customers.find(c => c.id === selectedCustomerId);
      const branchConfigUser = users.find(u => u.id === 'branches_config');
      const branches = branchConfigUser?.branches || [];

      if (!invoiceToEdit) {
        onSave(currentInvoice);
        onClose();
      }

      const { printInvoiceWithIframe } = await import('../utils/printUtils');
      await printInvoiceWithIframe(currentInvoice, cust, undefined, branches);
    } catch (err) {
      console.error("Direct print failed:", err);
      showError("حدث خطأ أثناء محاولة الطباعة");
    } finally {
      setIsPrinting(false);
    }
  };

  const handleDownloadInvoiceDirect = async () => {
    if (!selectedCustomerId) {
      showError('يرجى اختيار عميل للفاتورة لتحميلها');
      return;
    }
    const emptyItems = items.filter(item => !item.serviceName.trim());
    if (emptyItems.length > 0) {
      showError('يرجى تعبئة تفاصيل الخدمة لجميع البنود المضافة للتحميل');
      return;
    }

    setIsDownloading(true);
    try {
      const calculatedStatus = getAutoStatus();
      const activeUser = users.find(u => 
        u.name?.trim().toLowerCase() === currentUsername.trim().toLowerCase() || 
        u.username?.trim().toLowerCase() === currentUsername.trim().toLowerCase()
      );
      const activeBranchId = activeUser?.branchId || 'branch-1';

      let finalLocked = isLocked;
      if (isFullyPaid) {
        if (!isAdmin) {
          finalLocked = true;
        } else {
          finalLocked = isLocked;
        }
      }

      const currentInvoice: Invoice = {
        id: invoiceToEdit?.id || `inv-${Date.now()}`,
        invoiceNumber: invoiceToEdit?.invoiceNumber || `INV-2026-${Math.floor(100 + Math.random() * 900)}`,
        customerId: selectedCustomerId,
        items: items.map(item => ({
          ...item,
          serviceName: item.serviceName.trim(),
        })),
        discount: calculatedTotalDiscount,
        downPayment: calculatedDownPayment,
        payments,
        totalAmount,
        remainingAmount,
        status: calculatedStatus,
        createdAt: invoiceToEdit?.createdAt || new Date().toISOString(),
        createdBy: (isAdmin && editedCreatedBy) ? editedCreatedBy : (invoiceToEdit?.createdBy || currentUsername),
        lastModifiedBy: (isAdmin && editedLastModifiedBy) ? editedLastModifiedBy : currentUsername,
        lastModifiedAt: new Date().toISOString(),
        isLocked: finalLocked,
        customerExtraText: customerExtraText.trim(),
        originalDocsReceived,
        originalDocsReceivedAt,
        originalDocsReceivedBy,
        originalDocsReceivedHistory,
        modificationHistory: [...modificationHistory, {
          modifiedAt: new Date().toISOString(),
          modifiedBy: currentUsername,
          action: generateActionText()
        }],
        branchId: invoiceToEdit?.branchId || activeBranchId,
      };

      const cust = customers.find(c => c.id === selectedCustomerId);
      const branchConfigUser = users.find(u => u.id === 'branches_config');
      const branches = branchConfigUser?.branches || [];

      if (!invoiceToEdit) {
        onSave(currentInvoice);
        onClose();
      }

      const { directPrintInvoice } = await import('../utils/printUtils');
      await directPrintInvoice(currentInvoice, cust, undefined, branches);
    } catch (err) {
      console.error("Direct download failed:", err);
      showError("حدث خطأ أثناء محاولة تحميل الـ PDF");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs" 
      id="invoice-modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="w-full max-w-4xl bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh] text-right"
        dir="rtl"
        id="invoice-modal-content"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                {invoiceToEdit ? `تعديل الفاتورة ${invoiceToEdit.invoiceNumber}` : 'إنشاء فاتورة جديدة'}
              </h3>
              <p className="text-xs text-slate-500">
                {invoiceToEdit ? 'تعديل بنود الفاتورة وحساب قيمتها ومقدم الدفع' : 'أضف بنود خدمات الفاتورة وسجل الدفع المقدم والخصومات'}
              </p>
              {invoiceToEdit && (
                <div className="text-xs font-semibold text-slate-500 mt-2 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5" /> 
                  <span>المنشئ: {invoiceToEdit.createdBy || invoiceToEdit.lastModifiedBy || '—'}</span>
                  <span className="text-slate-300 px-1">|</span>
                  <span>{new Date(invoiceToEdit.createdAt).toLocaleString('ar-SA', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Lock / Unlock Toggle Button */}
            <button
              type="button"
              onClick={() => {
                if (isFullyPaid) {
                  if (isAdmin) {
                    setIsLocked(!isLocked);
                    showError(''); // Clear any previous error
                  } else {
                    showError('عذراً، هذه الفاتورة مدفوعة بالكامل وتنقفل الصلاحيات تلقائياً لجميع المستخدمين بما فيهم المنشئ. الشخص الوحيد القادر على فتح التعديل هو مدير النظام.');
                  }
                } else {
                  if (isCreator || isAdmin) {
                    setIsLocked(!isLocked);
                    showError(''); // Clear any previous error
                  } else {
                    showError('عذراً، يحق فقط لمدير النظام أو للمستخدم الذي أنشأ الفاتورة التحكم بقفل التعديل');
                  }
                }
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                isLocked
                  ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
              }`}
              title={
                isFullyPaid
                  ? (!isAdmin ? 'مدفوعة بالكامل - يحق لمدير النظام فقط إلغاء القفل' : 'تعديل حالة القفل')
                  : (!isCreator && !isAdmin ? 'يحق للمنشئ أو لمدير النظام فقط تعديل حالة القفل' : 'تعديل حالة القفل')
              }
              id="lock-toggle-btn"
            >
              {isLocked ? (
                <>
                  <Lock className="w-3.5 h-3.5 text-rose-600" />
                  <span>التعديل مغلق 🔒</span>
                </>
              ) : (
                <>
                  <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>التعديل متاح 🔓</span>
                </>
              )}
            </button>
            <button 
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              id="close-invoice-modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
          {error && (
            <div className="p-3 text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-lg font-sans">
              ⚠️ {error}
            </div>
          )}

          {/* Customer Selector Block */}
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
              <div className="md:col-span-1 space-y-1.5 relative">
                <label className="text-sm font-semibold text-slate-700 block">اختيار العميل</label>
                <div className="relative">
                  <input
                    type="text"
                    value={clientSearchTerm}
                    onChange={(e) => {
                      setClientSearchTerm(e.target.value);
                      setIsClientDropdownOpen(true);
                      if (e.target.value === '') setSelectedCustomerId('');
                    }}
                    onFocus={() => !isLocked && setIsClientDropdownOpen(true)}
                    placeholder={isLocked ? "التعديل مغلق" : "ابحث واختر عميل..."}
                    disabled={isLocked}
                    className="w-full py-2.5 px-3 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 text-sm bg-white disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Search className="w-4 h-4" />
                  </div>
                </div>
                {(!systemSettings || systemSettings.enableNewCustomer !== false) && (
                <button
                  type="button"
                  onClick={() => setIsAddCustomerOpen(true)}
                  disabled={isLocked}
                  className={`mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold transition-colors border rounded-lg px-2.5 py-1.5 ${
                    isLocked 
                      ? 'text-slate-400 bg-slate-100 border-slate-200 cursor-not-allowed opacity-60' 
                      : 'text-teal-600 bg-teal-50/70 hover:bg-teal-100/80 border-teal-100/50'
                  }`}
                >
                  <Plus className="w-3 h-3" />
                  إضافة عميل جديد
                </button>
                )}
                {isClientDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                    {filteredCustomers.length > 0 ? (
                      filteredCustomers.map(c => (
                        <div
                          key={c.id}
                          className="px-3 py-2 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0"
                          onClick={() => {
                            setSelectedCustomerId(c.id);
                            setClientSearchTerm(c.name);
                            setIsClientDropdownOpen(false);
                          }}
                        >
                          <div className="font-semibold text-sm text-slate-800">{c.name}</div>
                          <div className="text-[10px] text-slate-500 flex gap-2">
                            <span>{c.type === 'individual' ? 'فرد' : 'منشأة'}</span>
                            <span className="font-mono">{c.phone}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="px-3 py-4 text-center text-xs text-slate-400 italic">لا يوجد عملاء مطابقين للبحث</div>
                    )}
                  </div>
                )}
              </div>

              {/* Free text field immediately after customer selector */}
              <div className="md:col-span-1 space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 block">نص إضافي بعد اسم العميل (مربع نص حر)</label>
                <input
                  type="text"
                  value={customerExtraText}
                  onChange={(e) => setCustomerExtraText(e.target.value)}
                  placeholder="مثال: / ورثه أحمد أو (شريك)"
                  disabled={isLocked}
                  className="w-full py-2.5 px-3 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 text-sm bg-white disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                />
              </div>

              {/* Selected Customer Card Details */}
              {selectedCustomer ? (
                <div className="md:col-span-1 grid grid-cols-1 gap-3 p-3 bg-white border border-slate-100 rounded-xl text-xs text-slate-600 font-sans shadow-xs h-full" id="invoice-customer-details">
                  <div className="space-y-1">
                    <span className="text-slate-400 block">رقم الهاتف:</span>
                    <span className="font-semibold text-slate-700 flex items-center gap-1 font-mono">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {selectedCustomer.phone}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-400 block">
                      {selectedCustomer.type === 'individual' ? 'الرقم المدني:' : 'رقم السجل التجاري / المالك:'}
                    </span>
                    <span className="font-semibold text-slate-700 font-mono">
                      {selectedCustomer.type === 'individual'
                        ? selectedCustomer.civilId
                        : `${selectedCustomer.registrationNumber} (صاحبها: ${selectedCustomer.ownerName})`}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="md:col-span-1 text-xs text-slate-400 italic py-3 text-center border-2 border-dashed border-slate-100 rounded-xl">
                  اختر عميلاً من القائمة لعرض بيانات الاتصال والتوثيق هنا تلقائياً
                </div>
              )}
            </div>
          </div>

          {/* Service Items List - Horizontal Rows */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-700">بنود الخدمات والرسوم</h4>
              <button
                type="button"
                onClick={addItemRow}
                disabled={isLocked}
                className={`flex items-center gap-1 text-xs font-semibold py-1.5 px-3 rounded-lg border transition-all ${
                  isLocked 
                    ? 'text-slate-400 bg-slate-100 border-slate-200 cursor-not-allowed opacity-60' 
                    : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-100'
                }`}
                id="add-invoice-item-btn"
              >
                <Plus className="w-3.5 h-3.5" />
                إضافة بند جديد (أو اضغط Tab)
              </button>
            </div>

            {/* Table Header */}
            <div className="hidden md:grid md:grid-cols-[28px_repeat(12,minmax(0,1fr))] gap-3 px-4 py-2 bg-slate-100 rounded-lg text-xs font-bold text-slate-600">
              <div className="text-center" title="اسحب لإعادة الترتيب">#</div>
              <div className="col-span-4">تفاصيل الخدمة / البند</div>
              <div className="col-span-2 text-center">الموظف</div>
              <div className="col-span-1 text-center">الكمية</div>
              <div className="col-span-2 text-center">السعر</div>
              <div className="col-span-1 text-center">الخصم</div>
              <div className="col-span-2 text-center">الإجمالي</div>
            </div>

            {/* Table Rows */}
            <div className="space-y-3" id="invoice-items-rows">
              {items.map((item, index) => (
                <div 
                  key={item.id} 
                  data-item-row
                  onDragOver={(e) => {
                    if (dragIndex === null || dragIndex === index) return;
                    e.preventDefault();
                    const r = e.currentTarget.getBoundingClientRect();
                    const after = (e.clientY - r.top) > r.height / 2;
                    if (!dropTarget || dropTarget.index !== index || dropTarget.after !== after) setDropTarget({ index, after });
                  }}
                  onDragLeave={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget as Node)) setDropTarget(t => (t && t.index === index ? null : t));
                  }}
                  onDrop={(e) => {
                    if (dragIndex === null || dragIndex === index) return;
                    e.preventDefault();
                    const r = e.currentTarget.getBoundingClientRect();
                    const after = (e.clientY - r.top) > r.height / 2;
                    moveItemRow(dragIndex, index, after);
                    setDragIndex(null);
                    setDropTarget(null);
                  }}
                  className={`grid grid-cols-1 md:grid-cols-[28px_repeat(12,minmax(0,1fr))] gap-3 items-center p-3 md:p-0 bg-slate-50 md:bg-transparent rounded-xl border border-slate-100 md:border-0 transition-shadow ${
                    dragIndex === index ? 'opacity-40 md:bg-sky-50' : ''
                  } ${
                    dropTarget && dropTarget.index === index && dragIndex !== index
                      ? (dropTarget.after ? 'shadow-[inset_0_-3px_0_#0093c4]' : 'shadow-[inset_0_3px_0_#0093c4]')
                      : ''
                  }`}
                >
                  {/* Drag handle + row number (desktop; HTML5 drag & drop) */}
                  <div
                    className={`hidden md:flex flex-col items-center justify-center select-none leading-none ${
                      isLocked ? 'text-slate-300 cursor-not-allowed' : 'text-slate-400 hover:text-sky-600 cursor-grab active:cursor-grabbing'
                    }`}
                    draggable={!isLocked}
                    title={isLocked ? 'الفاتورة مغلقة' : 'اسحب لإعادة الترتيب'}
                    onDragStart={(e) => {
                      if (isLocked) { e.preventDefault(); return; }
                      setDragIndex(index);
                      try {
                        e.dataTransfer.effectAllowed = 'move';
                        e.dataTransfer.setData('text/plain', 'row');
                        const rowEl = (e.currentTarget as HTMLElement).closest('[data-item-row]') as HTMLElement | null;
                        if (rowEl) e.dataTransfer.setDragImage(rowEl, 20, 20);
                      } catch (_) { /* ignore */ }
                    }}
                    onDragEnd={() => { setDragIndex(null); setDropTarget(null); }}
                  >
                    <GripVertical className="w-4 h-4" />
                    <span className="text-[10px] text-slate-500 mt-0.5">{index + 1}</span>
                  </div>
                  {/* Service Description */}
                  <div className="col-span-1 md:col-span-4 space-y-1 md:space-y-0 relative">
                    <span className="text-xs font-semibold text-slate-500 md:hidden block">تفاصيل الخدمة</span>
                    <div className="relative">
                      <input
                        type="text"
                        value={item.serviceName}
                        onChange={(e) => {
                          handleItemChange(index, 'serviceName', e.target.value);
                          setActiveServiceDropdownIndex(index);
                          const matchedService = services?.find(s => s.name === e.target.value);
                          if (matchedService) {
                             handleItemChange(index, 'price', matchedService.defaultPrice.toString());
                          }
                        }}
                        onFocus={() => !isLocked && setActiveServiceDropdownIndex(index)}
                        onBlur={() => setTimeout(() => setActiveServiceDropdownIndex(null), 200)}
                        placeholder={isLocked ? "التعديل مغلق" : "ابحث عن الخدمة..."}
                        disabled={isLocked}
                        className="service-name-input w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 text-sm bg-white disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                      />
                      {activeServiceDropdownIndex === index && (
                        <div className="absolute z-[100] w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                          {services?.filter(s => s.name.toLowerCase().includes(item.serviceName.toLowerCase())).map(s => (
                            <div
                              key={s.id}
                              className="px-3 py-2 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0 text-sm"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleItemChange(index, 'serviceName', s.name);
                                handleItemChange(index, 'price', s.defaultPrice.toString());
                                setActiveServiceDropdownIndex(null);
                              }}
                            >
                              <div className="font-semibold text-slate-800">{s.name}</div>
                              <div className="text-[10px] text-teal-600 font-mono mt-0.5">{s.defaultPrice.toFixed(3)} ر.ع.</div>
                            </div>
                          ))}
                          {services?.filter(s => s.name.toLowerCase().includes(item.serviceName.toLowerCase())).length === 0 && (
                            <div className="px-3 py-2 text-sm text-slate-500 text-center">لا توجد خدمات مطابقة</div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Item Registration Date/Time */}
                    <div className="text-[9px] text-slate-400 mt-1.5 flex items-center gap-1 select-none">
                      <span>تاريخ التسجيل:</span>
                      <span className="font-mono bg-slate-50 text-slate-500 px-1.5 py-0.2 rounded border border-slate-100">
                        {item.createdAt ? (() => {
                          try {
                            const d = new Date(item.createdAt);
                            return isNaN(d.getTime()) ? 'غير معروف' : `${d.toLocaleDateString('ar-OM')} ${d.toLocaleTimeString('ar-OM', { hour: '2-digit', minute: '2-digit' })}`;
                          } catch {
                            return 'غير معروف';
                          }
                        })() : (() => {
                          const d = new Date();
                          return `${d.toLocaleDateString('ar-OM')} ${d.toLocaleTimeString('ar-OM', { hour: '2-digit', minute: '2-digit' })}`;
                        })()}
                      </span>
                    </div>
                  </div>

                  {/* Employee Name */}
                  <div className="col-span-1 md:col-span-2 space-y-1 md:space-y-0">
                    <span className="text-xs font-semibold text-slate-500 md:hidden block">الموظف المختص</span>
                    <select
                      value={item.employeeName || ''}
                      onChange={(e) => handleItemChange(index, 'employeeName', e.target.value)}
                      disabled={isLocked}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 text-sm bg-white disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                    >
                      <option value="">-- الموظف --</option>
                      {users?.filter(u => !u.id.includes('_config')).map(u => (
                        <option key={u.id} value={u.name}>{u.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Quantity */}
                  <div className="col-span-1 md:col-span-1 space-y-1 md:space-y-0">
                    <span className="text-xs font-semibold text-slate-500 md:hidden block">الكمية</span>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      disabled={isLocked}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 text-sm text-center font-mono bg-white disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                    />
                  </div>

                  {/* Unit Price */}
                  <div className="col-span-1 md:col-span-2 space-y-1 md:space-y-0">
                    <span className="text-xs font-semibold text-slate-500 md:hidden block">السعر (ر.ع)</span>
                    <input
                      type="number"
                      step="0.05"
                      min="0"
                      value={item.price || ''}
                      onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                      placeholder="0.000"
                      disabled={isLocked}
                      className="price-input w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 text-sm text-center font-mono bg-white disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                    />
                  </div>

                  {/* Discount */}
                  <div className="col-span-1 md:col-span-1 space-y-1 md:space-y-0">
                    <span className="text-xs font-semibold text-slate-500 md:hidden block">الخصم (ر.ع)</span>
                    <input
                      type="number"
                      step="0.05"
                      min="0"
                      value={item.discount || ''}
                      onChange={(e) => handleItemChange(index, 'discount', e.target.value)}
                      onKeyDown={(e) => handlePriceKeyDown(e, index)}
                      placeholder="0.000"
                      disabled={isLocked}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-rose-600 text-sm text-center font-mono bg-white disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                    />
                  </div>

                  {/* Action or Calculated Total */}
                  <div className="col-span-1 md:col-span-2 flex items-center justify-between gap-2 mt-2 md:mt-0">
                    <div className="md:hidden text-xs font-semibold text-slate-500">الإجمالي:</div>
                    <div className="flex-1 md:w-full flex items-center gap-2">
                      <div className="w-full px-3 py-2 border border-slate-200/55 bg-slate-100 text-slate-700 rounded-xl text-center text-sm font-mono font-semibold">
                        {item.total.toFixed(3)}
                      </div>
                      {(() => {
                        const isAdmin = currentUserRole === 'admin';
                        const isOwnerOfItem = item.employeeName === currentUsername;
                        const canDeleteThisItem = isAdmin || isOwnerOfItem;
                        
                        return (
                          <button
                            type="button"
                            onClick={() => removeItemRow(index)}
                            disabled={isLocked || !canDeleteThisItem}
                            className={`p-2 rounded-lg transition-colors border ${
                              isLocked 
                                ? 'text-slate-300 border-transparent cursor-not-allowed opacity-60' 
                                : !canDeleteThisItem
                                  ? 'text-slate-300 border-slate-100 bg-slate-50 cursor-not-allowed'
                                  : 'text-rose-500 hover:text-rose-700 hover:bg-rose-50 border-transparent hover:border-rose-100'
                            }`}
                            title={isLocked ? "الفاتورة مغلقة" : !canDeleteThisItem ? `لا يمكنك حذف هذا البند (مضاف بواسطة ${item.employeeName || 'غير معروف'})` : "حذف البند"}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Discount & Advance Payment Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Payment & Financial Controls */}
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-4">
              <h5 className="text-xs font-bold text-slate-600 uppercase tracking-wide">الخصومات والدفعات المقدمة</h5>
              
              {/* Discount */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 block" htmlFor="discount-input">
                  قيمة الخصم المطبق (ر.ع.)
                </label>
                <div className="relative">
                  <input
                    id="discount-input"
                    type="number"
                    step="0.5"
                    min="0"
                    value={calculatedTotalDiscount || ''}
                    readOnly
                    disabled
                    placeholder="0.000"
                    className="w-full pl-3 pr-10 py-2 border border-slate-200 bg-slate-100 rounded-xl focus:outline-none text-slate-500 text-sm font-mono text-left cursor-not-allowed"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                    <Percent className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Advance Payment / Payments Log */}
              <div className="space-y-3">
                <label className="text-xs font-semibold text-slate-600 block">
                  سجل الدفعات (ر.ع.)
                </label>
                
                <div className="space-y-2">
                  {payments.map(payment => (
                    <div key={payment.id} className="flex justify-between items-center bg-white p-2 border border-slate-100 rounded-lg text-xs">
                      <div>
                        <div className="font-bold text-slate-700 flex items-center gap-2 flex-wrap">
                          {isAdmin ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                step="0.5"
                                min="0"
                                value={payment.amount || ''}
                                onChange={(e) => {
                                  const updatedPayments = payments.map(p => 
                                    p.id === payment.id ? { ...p, amount: Math.max(0, parseFloat(e.target.value) || 0) } : p
                                  );
                                  setPayments(updatedPayments);
                                }}
                                className="w-20 text-xs border border-slate-200 rounded px-1.5 py-0.5 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 bg-slate-50"
                              />
                              <span className="text-xs">ر.ع.</span>
                            </div>
                          ) : (
                            <span>{payment.amount.toFixed(3)} ر.ع.</span>
                          )}
                          {payment.method && (
                            isAdmin ? (
                              <select
                                value={payment.method}
                                onChange={(e) => {
                                  const updatedPayments = payments.map(p => 
                                    p.id === payment.id ? { ...p, method: e.target.value as PaymentMethod } : p
                                  );
                                  setPayments(updatedPayments);
                                }}
                                className="text-[10px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 outline-hidden py-0.5 px-1 rounded ml-2 font-bold mr-2 focus:ring-1 focus:ring-indigo-500 cursor-pointer transition-colors"
                              >
                                <option value="cash">نقداً</option>
                                <option value="pos">جهاز الدفع البنكي POS</option>
                                <option value="transfer">تحويل بنكي</option>
                              </select>
                            ) : (
                              <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded ml-2 font-normal mr-2">
                                {payment.method === 'cash' ? 'نقداً' : payment.method === 'pos' ? 'جهاز الدفع البنكي POS' : 'تحويل بنكي'}
                              </span>
                            )
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-1 flex items-center gap-2">
                          {isAdmin ? (
                            <input
                              type="date"
                              value={payment.date ? new Date(payment.date).toISOString().substring(0, 10) : ''}
                              onChange={(e) => {
                                const newDate = e.target.value ? new Date(e.target.value).toISOString() : new Date().toISOString();
                                const updatedPayments = payments.map(p => 
                                  p.id === payment.id ? { ...p, date: newDate } : p
                                );
                                setPayments(updatedPayments);
                              }}
                              className="border border-slate-200 rounded px-1.5 py-0.5 text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 bg-slate-50"
                            />
                          ) : (
                            <span>{new Date(payment.date).toLocaleDateString('en-GB')}</span>
                          )}
                          <span>- {payment.recordedBy}</span>
                        </div>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setPayments(payments.filter(p => p.id !== payment.id))}
                        disabled={isLocked}
                        className={`p-1.5 transition-colors ${
                          isLocked 
                            ? 'text-slate-300 cursor-not-allowed opacity-50' 
                            : 'text-slate-400 hover:text-rose-500'
                        }`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <div className="relative w-1/3">
                    <select
                      value={newPaymentMethod}
                      onChange={(e) => setNewPaymentMethod(e.target.value as PaymentMethod)}
                      disabled={isLocked}
                      className="w-full pl-3 pr-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 text-xs font-semibold bg-slate-50 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                    >
                      <option value="cash">نقداً</option>
                      <option value="pos">جهاز الدفع البنكي POS</option>
                      <option value="transfer">تحويل بنكي</option>
                    </select>
                  </div>
                  <div className="relative flex-1">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={newPaymentAmount || ''}
                      onChange={(e) => setNewPaymentAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                      placeholder={isLocked ? "التعديل مغلق" : "مبلغ الدفعة"}
                      disabled={isLocked}
                      className="w-full pl-3 pr-8 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 text-sm font-mono text-left disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                    />
                    <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-slate-400">
                      <Coins className="w-4 h-4" />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (newPaymentAmount > 0) {
                        setPayments([...payments, {
                          id: `pay-${Date.now()}`,
                          amount: newPaymentAmount,
                          date: new Date().toISOString(),
                          recordedBy: currentUsername,
                          notes: '',
                          method: newPaymentMethod
                        }]);
                        setNewPaymentAmount(0);
                      }
                    }}
                    disabled={isLocked}
                    className={`px-3 py-2 font-bold text-xs rounded-xl transition-colors border whitespace-nowrap ${
                      isLocked 
                        ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60' 
                        : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200'
                    }`}
                  >
                    إضافة دفعة
                  </button>
                </div>
              </div>

              {/* Status Preset Override (Force Draft if needed) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 block">نوع الفاتورة / الحالة المبدئية</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => !isLocked && setStatus('unpaid')}
                    disabled={isLocked}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all ${
                      isLocked 
                        ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                        : status !== 'draft'
                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    حساب الفاتورة تلقائياً
                  </button>
                  <button
                    type="button"
                    onClick={() => !isLocked && setStatus('draft')}
                    disabled={isLocked}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all ${
                      isLocked 
                        ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                        : status === 'draft'
                        ? 'bg-amber-50 border-amber-200 text-amber-700'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    حفظ كمستند مسودة
                  </button>
                </div>
              </div>
            </div>

            {/* Live Invoice Financial Summary Card */}
            <div className="p-5 bg-gradient-to-br from-slate-800 to-slate-900 text-white rounded-2xl flex flex-col justify-between space-y-4">
              <div>
                <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">ملخص حساب الفاتورة المباشر</h5>
                <div className="space-y-2.5 font-sans">
                  <div className="flex justify-between text-sm text-slate-300">
                    <span>إجمالي الرسوم الأصلية:</span>
                    <span className="font-mono">{itemsGrossSubtotal.toFixed(3)} ر.ع.</span>
                  </div>
                  <div className="flex justify-between text-sm text-emerald-400">
                    <span>قيمة الخصومات المطبقة:</span>
                    <span className="font-mono">-{calculatedTotalDiscount.toFixed(3)} ر.ع.</span>
                  </div>
                  <hr className="border-slate-700/50" />
                  <div className="flex justify-between text-base font-bold text-white">
                    <span>المبلغ المستحق الإجمالي:</span>
                    <span className="font-mono text-emerald-300">{totalAmount.toFixed(3)} ر.ع.</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-300">
                    <span>المبلغ المقدم المدفوع:</span>
                    <span className="font-mono text-blue-300">-{calculatedDownPayment.toFixed(3)} ر.ع.</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-700/50 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block">المبلغ المتبقي المعلق:</span>
                  <span className={`text-xl font-black font-mono ${remainingAmount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {remainingAmount.toFixed(3)} ر.ع.
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">الحالة المحتسبة:</span>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-bold inline-block mt-1 font-sans ${
                    getAutoStatus() === 'paid' ? 'bg-emerald-500/20 text-emerald-300' :
                    getAutoStatus() === 'partially_paid' ? 'bg-amber-500/20 text-amber-300' :
                    getAutoStatus() === 'draft' ? 'bg-slate-500/20 text-slate-300' : 'bg-rose-500/20 text-rose-300'
                  }`}>
                    {getAutoStatus() === 'paid' ? 'مدفوعة بالكامل' :
                     getAutoStatus() === 'partially_paid' ? 'مدفوعة جزئياً' :
                     getAutoStatus() === 'draft' ? 'مسودة معلقة' : 'غير مدفوعة'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-6 mt-6">
            {/* Employee Totals Summary (Preview Only / Internal Use) */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-xs">
              <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-slate-400" />
                ملخص أداء الموظفين في هذه الفاتورة (للمعاينة فقط)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(
                  items.reduce((acc, item) => {
                    const emp = item.employeeName || 'غير محدد';
                    acc[emp] = (acc[emp] || 0) + item.total;
                    return acc;
                  }, {} as Record<string, number>)
                ).map(([empName, empTotal]) => (
                  <div key={empName} className="bg-white p-3 rounded-xl border border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-600">{empName}</span>
                    <span className="text-sm font-bold text-teal-600 font-mono">{(empTotal as number).toFixed(3)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Original Docs Checkbox */}
            <div className="bg-slate-50/50 border border-slate-200 rounded-xl p-2.5 shadow-sm">
              <label className="flex items-start sm:items-center gap-2 cursor-pointer transition-colors w-full group">
                <div className="flex items-center justify-center p-1.5 rounded-lg bg-white border border-slate-200 group-hover:border-indigo-300 group-hover:bg-indigo-50/50 transition-all">
                  <input
                    type="checkbox"
                    checked={originalDocsReceived}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      const now = new Date().toISOString();
                      setOriginalDocsReceived(checked);
                      setOriginalDocsReceivedAt(now);
                      setOriginalDocsReceivedBy(currentUsername);
                      setOriginalDocsReceivedHistory([...originalDocsReceivedHistory, {
                        status: checked,
                        changedAt: now,
                        changedBy: currentUsername
                      }]);
                    }}
                    className="w-3.5 h-3.5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-600 cursor-pointer"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-bold text-slate-700">إستلام اصل المستندات</div>
                  {originalDocsReceivedBy && (
                    <div className="text-[9px] text-slate-500 mt-0.5 leading-tight truncate">
                      أخر تعديل بواسطة: <span className="font-semibold text-slate-600">{originalDocsReceivedBy}</span>{originalDocsReceivedAt ? <> في <span dir="ltr" className="text-slate-400">{new Date(originalDocsReceivedAt).toLocaleString('ar-SA', { dateStyle: 'medium', timeStyle: 'short' })}</span></> : ''}
                    </div>
                  )}
                </div>
              </label>
              
              {originalDocsReceivedHistory.length > 0 && (
                <div className="mt-2 bg-white border border-slate-100 rounded-lg overflow-hidden">
                  <div className="px-2 py-1.5 bg-slate-100/50 border-b border-slate-100 text-[9px] font-bold text-slate-500 flex items-center gap-1.5">
                    <FileText className="w-3 h-3 text-slate-400" />
                    سجل النشاط
                  </div>
                  <div className="max-h-[70px] overflow-y-auto custom-scrollbar p-1 space-y-0.5">
                    {originalDocsReceivedHistory.map((log, idx) => (
                      <div key={idx} className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-x-2 gap-y-1 p-1 hover:bg-slate-50 rounded transition-colors border-b border-slate-50 last:border-0">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div className={`w-1.5 h-1.5 shrink-0 rounded-full ${log.status ? 'bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.3)]' : 'bg-rose-500 shadow-[0_0_4px_rgba(244,63,94,0.3)]'}`}></div>
                          <span className="text-[9px] font-semibold text-slate-600 truncate">{log.status ? 'تم الاستلام' : 'لم يتم الاستلام'}</span>
                        </div>
                        <div className="text-[8px] text-slate-400 flex items-center gap-1.5 shrink-0 font-mono">
                          <span className="font-sans font-medium">{log.changedBy}</span>
                          <span className="text-slate-200">|</span>
                          <span dir="ltr">{new Date(log.changedAt).toLocaleString('ar-SA', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

        
            {/* Modification History Box */}
            <div className="mt-4 bg-white border border-slate-100 rounded-lg overflow-hidden shadow-sm">
              <div className="px-2 py-2 bg-slate-100/50 border-b border-slate-100 text-[10px] font-bold text-slate-600 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-slate-400" />
                سجل التعديلات على الفاتورة
              </div>
              <div className="max-h-[100px] overflow-y-auto custom-scrollbar p-1 space-y-0.5">
                {modificationHistory.length > 0 ? modificationHistory.map((log, idx) => (
                  <div key={idx} className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-x-2 gap-y-1 p-1.5 hover:bg-slate-50 rounded transition-colors border-b border-slate-50 last:border-0">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-[9px] font-semibold text-slate-600 truncate">{log.action || 'تعديل فاتورة'}</span>
                    </div>
                    <div className="text-[8px] text-slate-400 flex items-center gap-1.5 shrink-0 font-mono">
                      <span className="font-sans font-medium">{log.modifiedBy}</span>
                      <span className="text-slate-200">|</span>
                      <span dir="ltr">{new Date(log.modifiedAt).toLocaleString('ar-SA', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                    </div>
                  </div>
                )) : (
                  <div className="text-center text-[10px] text-slate-400 py-2">
                    لا توجد تعديلات سابقة مسجلة
                  </div>
                )}
              </div>
            </div>

            {/* Invoice-Specific Chat during editing */}
            {invoiceToEdit && currentUsername !== 'guest' && (
              <div className="mt-6 border-t border-slate-150 pt-6" id="invoice-chat-container">
                <ChatBox 
                  channelId={`invoice-${invoiceToEdit.id}`} 
                  currentUser={users.find(u => 
                    u.name?.trim().toLowerCase() === currentUsername.trim().toLowerCase() || 
                    u.username?.trim().toLowerCase() === currentUsername.trim().toLowerCase()
                  )} 
                  users={users}
                  title={`محادثة الموظفين للفاتورة رقم (${invoiceToEdit.invoiceNumber})`}
                  placeholder="اكتب ملاحظة أو رسالة بخصوص هذه الفاتورة..."
                  heightClass="h-[300px]"
                  defaultCollapsed={false}
                  onMessagesLoaded={(hasMessages) => {
                    if (hasMessages && scrollContainerRef.current) {
                      setTimeout(() => {
                        const chatContainer = document.getElementById('invoice-chat-container');
                        if (chatContainer && scrollContainerRef.current) {
                          scrollContainerRef.current.scrollTo({
                            top: chatContainer.offsetTop,
                            behavior: 'smooth'
                          });
                        }
                      }, 500);
                    }
                  }}
                />
              </div>
            )}

            {/* Admin Overrides for Audit Logs */}
            {isAdmin && invoiceToEdit && (
              <div className="mt-6 border-t border-slate-150 pt-6">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h4 className="text-sm font-bold text-amber-800 flex items-center gap-2 mb-3">
                    <UserCheck className="w-4 h-4" />
                    تعديل صلاحيات وتاريخ الفاتورة (خاص بالمدراء)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-amber-900 mb-1">المستخدم الذي أنشأ الفاتورة</label>
                      <select
                        value={editedCreatedBy}
                        onChange={(e) => setEditedCreatedBy(e.target.value)}
                        className="w-full py-2 px-3 border border-amber-300 rounded-lg focus:outline-hidden text-slate-800 text-xs bg-white"
                      >
                        <option value="">-- اختر المستخدم --</option>
                        {users.filter(u => !u.id.endsWith('_config')).map(u => (
                          <option key={u.id} value={u.name}>{u.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-amber-900 mb-1">المستخدم الذي قام بآخر تعديل</label>
                      <select
                        value={editedLastModifiedBy}
                        onChange={(e) => setEditedLastModifiedBy(e.target.value)}
                        className="w-full py-2 px-3 border border-amber-300 rounded-lg focus:outline-hidden text-slate-800 text-xs bg-white"
                      >
                        <option value="">-- اختر المستخدم --</option>
                        {users.filter(u => !u.id.endsWith('_config')).map(u => (
                          <option key={u.id} value={u.name}>{u.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* Admin-only Date Edits */}
            {isAdmin && (
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl space-y-4 mt-6">
                <h5 className="text-xs font-bold text-amber-800 uppercase tracking-wide">إعدادات الإدارة (تعديل التواريخ)</h5>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-amber-700 block">تاريخ الإنشاء</label>
                    <input
                      type="datetime-local"
                      value={createdAt ? new Date(new Date(createdAt).getTime() - new Date(createdAt).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}
                      onChange={(e) => setCreatedAt(new Date(e.target.value).toISOString())}
                      className="w-full py-2 px-3 border border-amber-200 rounded-xl text-amber-800 text-sm bg-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-amber-700 block">تاريخ الإغلاق</label>
                    <input
                      type="datetime-local"
                      value={closingDate ? new Date(new Date(closingDate).getTime() - new Date(closingDate).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}
                      onChange={(e) => setClosingDate(new Date(e.target.value).toISOString())}
                      className="w-full py-2 px-3 border border-amber-200 rounded-xl text-amber-800 text-sm bg-white"
                    />
                  </div>
                </div>
              </div>
            )}
            
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-5 border-t border-slate-100 bg-slate-50">
          <div className="text-xs text-slate-400 flex items-center gap-1">
            <UserCheck className="w-3.5 h-3.5" />
            تعديل بواسطة المستخدم الحالي: <span className="font-semibold text-slate-600">{currentUsername}</span>
          </div>
          <div className="flex items-center flex-wrap gap-3">
            <button
              type="button"
              onClick={handlePrintDraft}
              disabled={isPrinting || isDownloading}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-100 transition-colors flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              <FileText className="w-3.5 h-3.5" />
              {isPrinting ? 'جاري التحضير...' : 'طباعة مسودة'}
            </button>
            <button
              type="button"
              onClick={handlePrintInvoiceDirect}
              disabled={isPrinting || isDownloading}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 rounded-xl transition-colors flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              <Printer className="w-3.5 h-3.5" />
              {isPrinting ? 'جاري فتح النافذة...' : 'طباعة مباشرة'}
            </button>
            <button
              type="button"
              onClick={handleDownloadInvoiceDirect}
              disabled={isPrinting || isDownloading}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:bg-slate-200 disabled:text-slate-400 rounded-xl transition-colors flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              <Download className="w-3.5 h-3.5" />
              {isDownloading ? 'جاري تحميل الـ PDF...' : 'تحميل PDF'}
            </button>
            {onPreview && (
              <button
                type="button"
                onClick={handlePreview}
                className="px-3 py-1.5 text-xs font-semibold text-teal-600 bg-teal-50 border border-teal-200 rounded-xl hover:bg-teal-100 transition-colors flex items-center gap-2"
              >
                <Printer className="w-3.5 h-3.5" />
                معاينة الفاتورة
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleFormSubmit}
              disabled={isLocked && !isCreator && !isAdmin}
              className={`px-4 py-1.5 text-xs font-semibold text-white rounded-xl transition-colors shadow-sm ${
                isLocked && !isCreator && !isAdmin
                  ? 'bg-slate-300 cursor-not-allowed shadow-none' 
                  : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/10'
              }`}
            >
              {invoiceToEdit ? 'حفظ التعديلات' : 'إصدار الفاتورة'}
            </button>
          </div>
        </div>
      </div>

      <CustomerModal
        isOpen={isAddCustomerOpen}
        onClose={() => setIsAddCustomerOpen(false)}
        onSave={handleSaveNewCustomer}
        customers={customers}
        currentUsername={currentUsername}
        systemSettings={systemSettings}
        isAdmin={currentUserRole === 'admin'}
        users={users}
      />
    </div>
  );
}
