/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Customer, Invoice, CustomerStatus, CustomerType, User, Branch } from '../types';
import { exportCustomersExcel } from '../utils/exportUtils';
import { 
  Search, 
  Plus, 
  Edit, 
  User as UserIcon, 
  Building, 
  Phone, 
  History, 
  UserPlus, 
  CheckCircle, 
  AlertTriangle, 
  FolderLock,
  ArrowLeftRight,
  ShieldCheck,
  Trash2,
  RotateCcw
} from 'lucide-react';
import CustomerDetailsModal from './CustomerDetailsModal';

interface CustomersSectionProps {
  systemSettings?: any;
  customers: Customer[];
  invoices: Invoice[];
  onOpenCustomerModal: (customer?: Customer) => void;
  onDeleteCustomer: (customerId: string) => void;
  currentUserRole: string;
  currentUser: User;
  branches: Branch[];
}

export default function CustomersSection({
  customers,
  invoices,
  onOpenCustomerModal,
  onDeleteCustomer,
  currentUserRole,
  currentUser,
  branches,
  systemSettings,
}: CustomersSectionProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | CustomerStatus>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | CustomerType>('all');
  const [employeeFilter, setEmployeeFilter] = useState<string>('all');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);
  const [customerForDetails, setCustomerForDetails] = useState<Customer | null>(null);

  // Filter logic covering all fields: name, phone, civilId, registrationNumber, ownerName
  const filteredCustomers = customers.filter(c => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      (c.name?.toLowerCase().includes(searchLower) ?? false) ||
      (c.phone?.includes(searchLower) ?? false) ||
      (c.civilId && c.civilId.includes(searchLower)) ||
      (c.registrationNumber && c.registrationNumber.toLowerCase().includes(searchLower)) ||
      (c.ownerName && c.ownerName.toLowerCase().includes(searchLower));

    const matchesStatus = statusFilter === 'all' ? true : c.status === statusFilter;
    const matchesType = typeFilter === 'all' ? true : c.type === typeFilter;
    const matchesEmployee = employeeFilter === 'all'
      ? true
      : (c.registeredBy?.trim().toLowerCase() === employeeFilter.trim().toLowerCase());

    const matchesBranch = currentUserRole === 'admin'
      ? (branchFilter === 'all' ? true : (c.branchId || 'branch-1') === branchFilter)
      : true;

    return matchesSearch && matchesStatus && matchesType && matchesEmployee && matchesBranch;
  });

  // Unique creators extracted from the customer register list
  const uniqueCreators = Array.from(
    new Set(
      customers
        .map(c => c.registeredBy?.trim())
        .filter((name): name is string => !!name && name.length > 0)
    )
  ).sort();

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
  const customerInvoices = invoices.filter(inv => inv.customerId === selectedCustomerId);

  const getStatusBadge = (status: CustomerStatus) => {
    switch (status) {
      case 'active':
        return (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
            نشط الفعالية
          </span>
        );
      case 'late':
        return (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            متأخر السداد
          </span>
        );
      case 'closed':
        return (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-100">
            <FolderLock className="w-3.5 h-3.5 text-slate-400" />
            مغلق ومؤرشف
          </span>
        );
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-right font-sans" dir="rtl" id="customers-section">
      {/* Customer List Workspace - Takes 2 columns on desktop */}
      <div className="lg:col-span-2 space-y-4">
        {/* Search and Filters panel */}
        <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search Input */}
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ابحث بالاسم، الهاتف، الرقم المدني، أو السجل التجاري..."
                className="w-full pl-3 pr-10 py-2.5 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-800 text-xs"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
            </div>

                        {/* Export Customers Button */}
            <button
              onClick={() => exportCustomersExcel(filteredCustomers)}
              className="flex items-center justify-center gap-2 font-semibold text-xs px-5 py-2.5 rounded-xl transition-all shadow-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/10"
              title="تصدير بيانات العملاء (Excel)"
            >
              <FolderLock className="w-4 h-4" />
              تصدير Excel
            </button>

            {/* Add Customer Button */}
            {(!systemSettings || systemSettings.enableNewCustomer) && (
            <button
              onClick={() => onOpenCustomerModal()}
              disabled={currentUser.id === 'guest'}
              className={`flex items-center justify-center gap-2 font-semibold text-xs px-5 py-2.5 rounded-xl transition-all shadow-sm ${currentUser.id === 'guest' ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-600/10'}`}
              id="add-customer-trigger-btn"
              title={currentUser.id === 'guest' ? 'غير مسموح للزوار بإضافة عملاء جدد' : ''}
            >
              <UserPlus className="w-4 h-4" />
              تسجيل عميل جديد
            </button>
            )}
          </div>

          {/* Dedicated Filters and Sorting Bar */}
          <div className="flex flex-wrap items-end gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
            {/* Status Filter */}
            <div className="flex flex-col gap-1.5 min-w-[120px]">
              <span className="text-slate-500 font-bold">الحالة:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-teal-500 text-slate-700 font-semibold"
              >
                <option value="all">كل الحالات</option>
                <option value="active">نشط الفعالية</option>
                <option value="late">متأخر السداد</option>
                <option value="closed">مغلق ومؤرشف</option>
              </select>
            </div>

            {/* Type Filter */}
            <div className="flex flex-col gap-1.5 min-w-[120px]">
              <span className="text-slate-500 font-bold">النوع:</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-teal-500 text-slate-700 font-semibold"
              >
                <option value="all">كل الأنواع</option>
                <option value="individual">أفراد</option>
                <option value="entity">منشآت (شركات)</option>
              </select>
            </div>

            {/* Employee Filter */}
            <div className="flex flex-col gap-1.5 min-w-[150px]">
              <span className="text-slate-500 font-bold">فلترة بواسطة الموظف:</span>
              <select
                value={employeeFilter}
                onChange={(e) => setEmployeeFilter(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-teal-500 text-slate-700 font-semibold"
              >
                <option value="all">جميع الموظفين</option>
                {uniqueCreators.map((creator) => (
                  <option key={creator} value={creator}>
                    {creator}
                  </option>
                ))}
              </select>
            </div>

            {/* Branch Filter - Only visible for admin */}
            {currentUserRole === 'admin' && (
              <div className="flex flex-col gap-1.5 min-w-[150px]">
                <span className="text-slate-500 font-bold">تصفية حسب الفرع:</span>
                <select
                  value={branchFilter}
                  onChange={(e) => setBranchFilter(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-teal-500 text-slate-700 font-semibold"
                >
                  <option value="all">كافة الفروع</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      🏢 {b.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Reset Button */}
            <div className="mr-auto">
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setTypeFilter('all');
                  setEmployeeFilter('all');
                  setBranchFilter('all');
                }}
                className="flex items-center gap-1.5 bg-white hover:bg-slate-100 text-slate-700 font-semibold px-3 py-2 rounded-lg border border-slate-200 transition-colors shadow-xs"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                إعادة ضبط / Reset
              </button>
            </div>
          </div>
        </div>

        {/* Customer Cards Grid */}
        <div className="space-y-3" id="customer-cards-list">
          {filteredCustomers.length > 0 ? (
            filteredCustomers.map((c) => (
              <div
                key={c.id}
                onClick={() => {
                  setSelectedCustomerId(c.id);
                  setCustomerForDetails(c);
                }}
                className={`py-3 px-4 bg-white border rounded-xl transition-all cursor-pointer flex flex-col md:flex-row md:items-center md:justify-between gap-3 ${
                  selectedCustomerId === c.id
                    ? 'border-teal-600 bg-teal-50/10 shadow-xs ring-1 ring-teal-500/25'
                    : 'border-slate-100 hover:border-slate-200 hover:shadow-xs'
                }`}
              >
                {/* Basic Details */}
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${c.type === 'individual' ? 'bg-blue-50 text-blue-600' : 'bg-teal-50 text-teal-600'}`}>
                    {c.type === 'individual' ? <UserIcon className="w-4 h-4" /> : <Building className="w-4 h-4" />}
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-slate-800">{c.name}</h4>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1 font-mono">
                        <Phone className="w-3.5 h-3.5 text-slate-300" />
                        {c.phone}
                      </span>
                      <span>
                        {c.type === 'individual' ? `الرقم المدني: ${c.civilId}` : `رقم السجل: ${c.registrationNumber}`}
                      </span>
                      {c.type === 'entity' && (
                        <span>المالك: {c.ownerName}</span>
                      )}
                      <span>
                        بواسطة: {c.registeredBy || 'غير محدد'}
                      </span>
                      <span>
                        تاريخ: {new Date(c.createdAt).toLocaleDateString('ar-OM')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status Badges & Action */}
                <div className="flex items-center justify-between md:justify-end gap-3 border-t md:border-t-0 pt-3 md:pt-0 border-slate-50">
                  {getStatusBadge(c.status)}
                  <div className="flex items-center gap-1">
                    {(() => {
                      const canEdit = currentUser?.role === 'admin' || currentUserRole === 'admin' || currentUserRole === 'hr' ||
                        !c.registeredBy || 
                        c.registeredBy.trim().toLowerCase() === currentUser.name.trim().toLowerCase() ||
                        c.registeredBy.trim().toLowerCase() === currentUser.username.trim().toLowerCase();
                      
                      return canEdit ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenCustomerModal(c);
                          }}
                          className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors border border-transparent hover:border-teal-100"
                          title="تعديل بيانات العميل"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          disabled
                          onClick={(e) => e.stopPropagation()}
                          className="p-2 text-slate-300 bg-slate-50 border border-slate-200/50 rounded-lg cursor-not-allowed"
                          title="تعديل مغلق (متاح فقط لمنشئ العميل أو مدير النظام)"
                        >
                          <FolderLock className="w-4 h-4 text-slate-400" />
                        </button>
                      );
                    })()}
                    {currentUserRole === 'admin' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCustomerToDelete(c.id);
                        }}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100"
                        title="حذف العميل"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 text-slate-400 italic">
              🔍 لم يتم العثور على عملاء يطابقون شروط البحث الحالية
            </div>
          )}
        </div>
      </div>

      {/* Side Detail Panel - Historic Activity Ledger */}
      <div className="lg:col-span-1" id="customer-activity-panel">
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs sticky top-4 space-y-5">
          {selectedCustomer ? (
            <>
              {/* Account Title */}
              <div>
                <span className="text-[10px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-md inline-block mb-2 font-sans">
                  {selectedCustomer.type === 'individual' ? 'حساب فردي' : 'سجل تجاري'}
                </span>
                <h3 className="text-base font-bold text-slate-800">{selectedCustomer.name}</h3>
                <p className="text-xs text-slate-400 mt-1">تاريخ الإنشاء: {new Date(selectedCustomer.createdAt).toLocaleDateString('ar-OM')}</p>
              </div>

              <hr className="border-slate-100" />

              {/* Invoices Ledger */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-600 flex items-center gap-1">
                  <History className="w-4 h-4 text-slate-400" />
                  سجل الفواتير والمعاملات الصادرة ({customerInvoices.length})
                </h4>

                {customerInvoices.length > 0 ? (
                  <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                    {customerInvoices.map((inv) => (
                      <div key={inv.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100/60 text-xs flex justify-between items-center hover:bg-slate-100/50 transition-all">
                        <div className="space-y-1">
                          <span className="font-bold text-slate-700 block font-mono">{inv.invoiceNumber}</span>
                          <span className="text-slate-400 font-mono block">{inv.totalAmount.toFixed(3)} ر.ع.</span>
                        </div>
                        <div className="text-left space-y-1">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold inline-block font-sans ${
                            inv.status === 'paid' ? 'bg-emerald-500/10 text-emerald-700' :
                            inv.status === 'partially_paid' ? 'bg-amber-500/10 text-amber-700' :
                            inv.status === 'draft' ? 'bg-slate-200 text-slate-700' : 'bg-rose-500/10 text-rose-700'
                          }`}>
                            {inv.status === 'paid' ? 'مدفوعة' :
                             inv.status === 'partially_paid' ? 'مدفوعة جزئياً' :
                             inv.status === 'draft' ? 'مسودة' : 'غير مدفوعة'}
                          </span>
                          <span className="text-[9px] text-slate-400 block font-sans">تعديل: {inv.lastModifiedBy}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-slate-400 italic text-xs">
                    لم يصدر أي فواتير لهذا العميل بعد
                  </div>
                )}
              </div>

              <hr className="border-slate-100" />

              {/* Status & Settle Details */}
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
                <span className="text-[10px] font-bold text-slate-400 block">الملخص المالي للذمم:</span>
                <div className="flex justify-between text-xs text-slate-700">
                  <span>مجموع المطلوب:</span>
                  <span className="font-mono font-bold">
                    {customerInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0).toFixed(3)} ر.ع.
                  </span>
                </div>
                <div className="flex justify-between text-xs text-rose-600 font-semibold">
                  <span>إجمالي ديون السداد المتبقية:</span>
                  <span className="font-mono font-black">
                    {customerInvoices.reduce((sum, inv) => sum + inv.remainingAmount, 0).toFixed(3)} ر.ع.
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-slate-400 italic text-xs">
              👈 اختر عميلاً من القائمة الجانبية لعرض تاريخ معاملاته، سجل فواتيره، والأنشطة المرتبطة بحسابه فوراً
            </div>
          )}
        </div>
      </div>

      {customerToDelete && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 font-sans" dir="rtl">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-500" />
                تأكيد حذف العميل
              </h3>
              <p className="text-sm text-slate-500 mt-2">
                هل أنت متأكد من رغبتك في حذف هذا العميل بشكل نهائي؟ لا يمكن التراجع عن هذا الإجراء.
              </p>
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setCustomerToDelete(null)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteCustomer(customerToDelete);
                  setCustomerToDelete(null);
                  if (selectedCustomerId === customerToDelete) {
                    setSelectedCustomerId(null);
                  }
                }}
                className="px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors"
              >
                تأكيد الحذف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Customer Details Modal */}
      <CustomerDetailsModal
        isOpen={!!customerForDetails}
        onClose={() => setCustomerForDetails(null)}
        customer={customerForDetails}
        invoices={invoices}
        branches={branches}
        onEdit={(cust) => onOpenCustomerModal(cust)}
        canEdit={(() => {
          if (!customerForDetails) return false;
          return (
            currentUser?.role === 'admin' ||
            currentUserRole === 'admin' ||
            currentUserRole === 'hr' ||
            !customerForDetails.registeredBy ||
            customerForDetails.registeredBy.trim().toLowerCase() === currentUser.name.trim().toLowerCase() ||
            customerForDetails.registeredBy.trim().toLowerCase() === currentUser.username.trim().toLowerCase()
          );
        })()}
      />
    </div>
  );
}
