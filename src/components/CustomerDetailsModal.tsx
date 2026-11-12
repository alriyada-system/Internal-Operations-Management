/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Customer, Invoice, Branch } from '../types';
import { 
  X, 
  User as UserIcon, 
  Building, 
  Phone, 
  Award, 
  BadgeCheck, 
  ShieldAlert, 
  Calendar, 
  UserCheck, 
  MapPin, 
  Edit, 
  FileText, 
  Check, 
  Copy, 
  Clock, 
  FolderLock
} from 'lucide-react';

interface CustomerDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  invoices?: Invoice[];
  branches?: Branch[];
  onEdit?: (customer: Customer) => void;
  canEdit?: boolean;
}

export default function CustomerDetailsModal({
  isOpen,
  onClose,
  customer,
  invoices = [],
  branches = [],
  onEdit,
  canEdit = true,
}: CustomerDetailsModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!isOpen || !customer) return null;

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const customerInvoices = invoices.filter(inv => inv.customerId === customer.id);
  const totalAmount = customerInvoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
  const remainingAmount = customerInvoices.reduce((sum, inv) => sum + (inv.remainingAmount || 0), 0);
  const paidAmount = totalAmount - remainingAmount;

  const branchName = branches.find(b => b.id === customer.branchId)?.name || 'الفرع الرئيسي';

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in" 
      id="customer-details-modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh] text-right font-sans"
        dir="rtl"
        id="customer-details-modal-content"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${customer.type === 'individual' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-teal-50 text-teal-600 border border-teal-100'}`}>
              {customer.type === 'individual' ? <UserIcon className="w-5 h-5" /> : <Building className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-800">{customer.name}</h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  customer.type === 'individual' ? 'bg-blue-100 text-blue-700' : 'bg-teal-100 text-teal-700'
                }`}>
                  {customer.type === 'individual' ? 'حساب فردي' : 'منشأة تجارية'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">بطاقة تفاصيل وبيانات العميل المسجلة في النظام</p>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
            title="إغلاق النافذة"
            id="close-customer-details-modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          
          {/* Status & Quick Highlights Banner */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">حالة العميل:</span>
              {customer.status === 'active' && (
                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-100/70 px-2.5 py-1 rounded-full border border-emerald-200">
                  <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" />
                  نشط الفعالية
                </span>
              )}
              {customer.status === 'late' && (
                <span className="flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-100/70 px-2.5 py-1 rounded-full border border-amber-200">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                  متأخر السداد
                </span>
              )}
              {customer.status === 'closed' && (
                <span className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-200/80 px-2.5 py-1 rounded-full border border-slate-300">
                  <FolderLock className="w-3.5 h-3.5 text-slate-500" />
                  مغلق ومؤرشف
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>تاريخ التسجيل:</span>
              <span className="font-semibold text-slate-700 font-mono">
                {new Date(customer.createdAt).toLocaleDateString('ar-OM', { year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
          </div>

          {/* Section 1: Customer Data Fields Entered in "نافذة إدخال عميل جديد" */}
          <div>
            <h4 className="text-xs font-bold text-slate-500 mb-3 flex items-center gap-1.5">
              <UserIcon className="w-3.5 h-3.5 text-teal-600" />
              بيانات العميل المدخلة في نافذة التسجيل
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              
              {/* Customer Type */}
              <div className="p-3 bg-slate-50/60 border border-slate-100 rounded-xl space-y-1">
                <span className="text-[11px] font-bold text-slate-400 block">نوع العميل:</span>
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  {customer.type === 'individual' ? (
                    <>
                      <UserIcon className="w-4 h-4 text-blue-500" />
                      فرد (شخصي)
                    </>
                  ) : (
                    <>
                      <Building className="w-4 h-4 text-teal-500" />
                      منشأة (مؤسسة / شركة)
                    </>
                  )}
                </span>
              </div>

              {/* Customer Name */}
              <div className="p-3 bg-slate-50/60 border border-slate-100 rounded-xl space-y-1">
                <span className="text-[11px] font-bold text-slate-400 block">
                  {customer.type === 'individual' ? 'اسم العميل ثلاثي:' : 'الاسم التجاري للمنشأة:'}
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">{customer.name}</span>
                  <button 
                    onClick={() => copyToClipboard(customer.name, 'name')}
                    className="text-slate-400 hover:text-teal-600 transition-colors p-1"
                    title="نسخ الاسم"
                  >
                    {copiedField === 'name' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Contact Phone */}
              <div className="p-3 bg-slate-50/60 border border-slate-100 rounded-xl space-y-1">
                <span className="text-[11px] font-bold text-slate-400 block">رقم التواصل / الهاتف:</span>
                <div className="flex items-center justify-between">
                  <a 
                    href={`tel:${customer.phone}`}
                    className="text-xs font-bold text-teal-700 hover:underline flex items-center gap-1.5 font-mono"
                    dir="ltr"
                  >
                    <Phone className="w-3.5 h-3.5 text-teal-500" />
                    {customer.phone || 'غير مسجل'}
                  </a>
                  {customer.phone && (
                    <button 
                      onClick={() => copyToClipboard(customer.phone, 'phone')}
                      className="text-slate-400 hover:text-teal-600 transition-colors p-1"
                      title="نسخ رقم الهاتف"
                    >
                      {copiedField === 'phone' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              </div>

              {/* Civil ID (for individual) or CR Number (for entity) */}
              {customer.type === 'individual' ? (
                <div className="p-3 bg-slate-50/60 border border-slate-100 rounded-xl space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 block">الرقم المدني العماني:</span>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 font-mono">
                      {customer.civilId || 'غير مسجل'}
                    </span>
                    {customer.civilId && (
                      <button 
                        onClick={() => copyToClipboard(customer.civilId!, 'civilId')}
                        className="text-slate-400 hover:text-teal-600 transition-colors p-1"
                        title="نسخ الرقم المدني"
                      >
                        {copiedField === 'civilId' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-slate-50/60 border border-slate-100 rounded-xl space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 block">رقم السجل التجاري (CR Number):</span>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 font-mono">
                      {customer.registrationNumber || 'غير مسجل'}
                    </span>
                    {customer.registrationNumber && (
                      <button 
                        onClick={() => copyToClipboard(customer.registrationNumber!, 'regNumber')}
                        className="text-slate-400 hover:text-teal-600 transition-colors p-1"
                        title="نسخ رقم السجل"
                      >
                        {copiedField === 'regNumber' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Owner Name for Entity */}
              {customer.type === 'entity' && (
                <div className="p-3 bg-slate-50/60 border border-slate-100 rounded-xl space-y-1 sm:col-span-2">
                  <span className="text-[11px] font-bold text-slate-400 block">اسم صاحب المنشأة:</span>
                  <span className="text-xs font-bold text-slate-800">
                    {customer.ownerName || 'غير مسجل'}
                  </span>
                </div>
              )}

              {/* Registered By */}
              <div className="p-3 bg-slate-50/60 border border-slate-100 rounded-xl space-y-1">
                <span className="text-[11px] font-bold text-slate-400 block">تم التسجيل بواسطة:</span>
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-teal-600" />
                  {customer.registeredBy || 'النظام'}
                </span>
              </div>

              {/* Branch */}
              <div className="p-3 bg-slate-50/60 border border-slate-100 rounded-xl space-y-1">
                <span className="text-[11px] font-bold text-slate-400 block">الفرع التابع له:</span>
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-500" />
                  {branchName}
                </span>
              </div>

              {/* Closed Date if closed */}
              {customer.status === 'closed' && customer.closedAt && (
                <div className="p-3 bg-rose-50/50 border border-rose-100 rounded-xl space-y-1 sm:col-span-2">
                  <span className="text-[11px] font-bold text-rose-500 block">تاريخ إغلاق وأرشفة الحساب:</span>
                  <span className="text-xs font-bold text-rose-700 font-mono">
                    {new Date(customer.closedAt).toLocaleDateString('ar-OM', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}

            </div>
          </div>

          {/* Section 2: Financial & Invoicing Summary */}
          <div>
            <h4 className="text-xs font-bold text-slate-500 mb-3 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-teal-600" />
              الملخص المالي والذمم المرتبطة بالعميل
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-center">
                <span className="text-[10px] font-bold text-slate-400 block mb-1">عدد الفواتير</span>
                <span className="text-sm font-black text-slate-800 font-mono">{customerInvoices.length}</span>
              </div>

              <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl text-center">
                <span className="text-[10px] font-bold text-blue-600 block mb-1">إجمالي المستحق</span>
                <span className="text-sm font-black text-blue-700 font-mono">{totalAmount.toFixed(3)} <span className="text-[10px] font-sans">ر.ع</span></span>
              </div>

              <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl text-center">
                <span className="text-[10px] font-bold text-emerald-600 block mb-1">المسدد</span>
                <span className="text-sm font-black text-emerald-700 font-mono">{paidAmount.toFixed(3)} <span className="text-[10px] font-sans">ر.ع</span></span>
              </div>

              <div className="p-3 bg-rose-50/50 border border-rose-100 rounded-xl text-center">
                <span className="text-[10px] font-bold text-rose-600 block mb-1">الديون المتبقية</span>
                <span className="text-sm font-black text-rose-700 font-mono">{remainingAmount.toFixed(3)} <span className="text-[10px] font-sans">ر.ع</span></span>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer with Actions */}
        <div className="flex items-center justify-between p-4 sm:px-6 border-t border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2">
            {canEdit && onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(customer);
                }}
                className="h-[35px] flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-semibold text-xs px-3.5 rounded-lg transition-all shadow-xs cursor-pointer"
                title="تعديل بيانات العميل"
                id="edit-customer-from-details-btn"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>تعديل بيانات العميل</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="h-[35px] px-4 text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            id="close-customer-details-btn"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
}
