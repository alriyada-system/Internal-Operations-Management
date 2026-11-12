/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import { Invoice, Customer, InvoiceItem, User, DeletedInvoice, Branch } from '../types';
import Logo from './Logo';
import { Printer, X, Download, Phone, MapPin, Calendar, FileText, Activity, CheckCircle, Users, Trash2, Edit3 } from 'lucide-react';
import { numberToWords } from '../utils/tafqeet';
import { directPrintInvoice, printInvoiceWithIframe } from '../utils/printUtils';
import ChatBox from './ChatBox';

interface InvoicePrintProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  customers: Customer[];
  currentUser: User | undefined;
  deletedInvoices?: DeletedInvoice[];
  branches: Branch[];
  users?: User[];
  onEdit?: (invoice: Invoice) => void;
  systemSettings?: any;
}

export default function InvoicePrint({ isOpen, onClose, invoice, customers, currentUser, deletedInvoices, branches, users, onEdit, systemSettings }: InvoicePrintProps) {
  if (!isOpen || !invoice) return null;

  const [isPrinting, setIsPrinting] = React.useState(false);
  const [isDownloading, setIsDownloading] = React.useState(false);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  const customer = customers.find(c => c.id === invoice.customerId);
  const deletedRecord = deletedInvoices?.find(di => di.invoice.id === invoice.id);
  const branch = branches.find(b => b.id === (invoice.branchId || 'branch-1'));

  const effectiveCompanyName = systemSettings?.companyName || 'مركز سند الريادة للخدمات';
  const effectiveCompanyNameEn = systemSettings?.companyNameEn || 'AL-RIYADAH SAND SERVICES';
  const effectiveCrNumber = systemSettings?.companyCrNumber || '1342890';
  const effectiveLogo = systemSettings?.companyLogo || '';
  const effectivePhone = systemSettings?.companyPhone || '97994259';
  const effectiveEmail = systemSettings?.companyEmail || 'sanad.oman.r3@gmail.com';
  const effectiveAddress = systemSettings?.companyAddress || 'سلطنة عُمان - إبراء';
  const effectiveSubtitle = systemSettings?.companySubtitle || 'شركائك في نجاح أعمالك .. كل الخدمات في مكان واحد';

  // Rebuilt PDF generation and download
  const handleDownloadPDF = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      await directPrintInvoice(invoice, customer, deletedRecord, branches, systemSettings);
    } catch (err) {
      console.error("PDF download execution failed:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  // High-fidelity native browser print (which supports "Save as PDF" instantly in 100% vector format)
  const handleNativePrint = async () => {
    if (isPrinting) return;
    setIsPrinting(true);
    try {
      await printInvoiceWithIframe(invoice, customer, deletedRecord, branches, systemSettings);
    } catch (err) {
      console.error("Native print execution failed:", err);
    } finally {
      setIsPrinting(false);
    }
  };

  const safeItems = invoice.items || [];
  const subtotal = safeItems.reduce((sum, item) => sum + (item.total || 0), 0);

  // Calculate Employee Summary for Preview
  const employeeSummary = safeItems.reduce((acc, item) => {
    const empName = item.employeeName || 'غير محدد';
    if (!acc[empName]) {
      acc[empName] = 0;
    }
    acc[empName] += (item.total || 0);
    return acc;
  }, {} as Record<string, number>);

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs" 
      id="invoice-print-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
         className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh] text-right"
         dir="rtl"
         id="invoice-print-content"
      >
        {/* Actions bar */}
        <div className="flex items-center justify-between p-3 sm:px-4 py-2 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-1.5 sm:gap-2">
            {onEdit && (currentUser?.role === 'admin' || currentUser?.permissions?.editInvoice !== false) && (
              <button
                type="button"
                onClick={() => onEdit(invoice)}
                className="h-[35px] flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-semibold text-xs px-2.5 sm:px-3 rounded-lg transition-all shadow-xs shadow-indigo-600/10 cursor-pointer"
                id="edit-invoice-from-preview-btn"
                title="تعديل بيانات وبنود الفاتورة"
                style={{ height: '35px' }}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>تعديل</span>
              </button>
            )}

            <button
              onClick={handleNativePrint}
              disabled={isPrinting || isDownloading}
              className="h-[35px] flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none text-white font-semibold text-xs px-2.5 sm:px-3 rounded-lg transition-all shadow-xs shadow-emerald-600/10 cursor-pointer disabled:cursor-not-allowed"
              id="print-trigger-btn"
              title="طباعة الفاتورة أو حفظها كـ PDF"
              style={{ height: '35px' }}
            >
              {isPrinting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-slate-400 border-t-emerald-600 rounded-full animate-spin" />
                  <span>جاري الفتح...</span>
                </>
              ) : (
                <>
                  <Printer className="w-3.5 h-3.5" />
                  <span>طباعة</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownloadPDF}
              disabled={isPrinting || isDownloading}
              className="h-[35px] flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none text-white font-semibold text-xs px-2.5 sm:px-3 rounded-lg transition-all shadow-xs shadow-teal-600/10 cursor-pointer disabled:cursor-not-allowed"
              id="download-pdf-btn"
              title="تنزيل الفاتورة بصيغة PDF"
              style={{ height: '35px' }}
            >
              {isDownloading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-slate-400 border-t-teal-600 rounded-full animate-spin" />
                  <span>جاري التنزيل...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>تنزيل PDF</span>
                </>
              )}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-[35px] flex items-center text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 rounded-lg font-mono">
              {invoice.invoiceNumber}
            </span>
            <button 
              onClick={onClose}
              className="h-[35px] w-[35px] flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="إغلاق المعاينة"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Invoice Body Container */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-5 md:p-6 space-y-4 font-sans relative scroll-smooth" id="invoice-printed-area">
          {/* Watermark Overlay for Onscreen Preview */}
          {deletedRecord && (
            <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center overflow-hidden opacity-[0.06] select-none">
              <div className="text-rose-600 font-extrabold text-7xl md:text-[10rem] -rotate-[30deg] uppercase tracking-widest font-sans border-12 border-rose-600 p-8 rounded-3xl">
                محذوفة
              </div>
            </div>
          )}
          {!deletedRecord && invoice.status === 'draft' && (
            <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center overflow-hidden opacity-[0.06] select-none">
              <div className="text-slate-500 font-extrabold text-7xl md:text-[10rem] -rotate-[30deg] uppercase tracking-widest font-sans border-12 border-slate-500 p-8 rounded-3xl">
                مسودة
              </div>
            </div>
          )}

          {/* Header */}
          <div className="flex justify-between items-start gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-950 tracking-tight leading-tight">{effectiveCompanyName}</h2>
              <p className="text-[10px] text-teal-700 font-medium mt-1">
                {effectiveSubtitle}
              </p>
              
              <div className="mt-2.5 space-y-1 text-xs text-slate-500">
                {effectiveCrNumber && (
                  <p className="flex items-center gap-1 font-semibold text-slate-700">
                    <FileText className="w-3.5 h-3.5 text-teal-600" />
                    السجل التجاري: <span className="font-mono text-teal-700 font-bold">{effectiveCrNumber}</span>
                  </p>
                )}
                <p className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  موقع المكتب: {branch?.address || effectiveAddress}
                </p>
                <p className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  التواصل: {branch?.phone || effectivePhone}
                </p>
                {(branch?.email || effectiveEmail) && (
                  <p className="flex items-center gap-1">
                    <span className="text-slate-400 font-mono text-[11px] w-3.5 h-3.5 flex items-center justify-center">✉️</span>
                    البريد: <span className="font-mono">{branch?.email || effectiveEmail}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col items-center text-center">
              <Logo showText={false} size="sm" customLogoUrl={effectiveLogo} customCompanyName={effectiveCompanyName} />
              <span className="mt-1.5 text-[10px] uppercase font-bold tracking-widest bg-emerald-500/10 text-emerald-700 px-2 py-0.5 rounded-md">
                {effectiveCompanyNameEn || effectiveCompanyName}
              </span>
              <div className="mt-2 space-y-0.5 text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100/80 min-w-[145px] text-right">
                <p className="flex items-center gap-1 justify-end">
                  <span>تاريخ الإصدار:</span>
                  <span className="font-mono text-slate-700 font-medium">{new Date(invoice.createdAt).toLocaleDateString('ar-OM')}</span>
                  <Calendar className="w-3 h-3 text-slate-400" />
                </p>
                <p className="flex items-center gap-1 justify-end">
                  <span>رقم الفاتورة:</span>
                  <span className="font-mono font-bold text-teal-600">{invoice.invoiceNumber}</span>
                  <FileText className="w-3 h-3 text-slate-400" />
                </p>
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Customer Metadata Card */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100/80 grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 block">مرسل إلى العميل:</span>
              <span className="text-sm font-bold text-slate-700 block">
                {customer?.name || 'عميل غير مسجل'}
                {invoice.customerExtraText && <span className="text-slate-700 font-semibold mr-1"> {invoice.customerExtraText}</span>}
              </span>
              <span className="text-xs text-slate-500 block font-mono">{customer?.phone}</span>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 block">البيانات الثبوتية للعميل:</span>
              {customer?.type === 'individual' ? (
                <span className="text-xs font-semibold text-slate-600 block">
                  الرقم المدني العماني: <span className="font-mono text-slate-700">{customer.civilId}</span>
                </span>
              ) : (
                <div className="text-xs text-slate-600 font-sans space-y-0.5">
                  <p>رقم السجل التجاري: <span className="font-mono font-semibold text-slate-700">{customer?.registrationNumber}</span></p>
                  <p>اسم المالك: <span className="font-semibold text-slate-700">{customer?.ownerName}</span></p>
                </div>
              )}
            </div>
          </div>

          {/* Line Items Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">تفاصيل الخدمات و المعاملات</h4>
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-600 font-bold">
                  <th className="py-1.5 px-2 rounded-r-lg text-center w-[5%] resize-x overflow-auto">م</th>
                  <th className="py-1.5 px-2 text-right w-[45%] resize-x overflow-auto">بيان البند والخدمة</th>
                  <th className="py-1.5 px-2 text-center w-[10%] resize-x overflow-auto">الكمية</th>
                  <th className="py-1.5 px-2 text-center w-[15%] resize-x overflow-auto">السعر (ر.ع.)</th>
                  <th className="py-1.5 px-2 text-center w-[10%] resize-x overflow-auto">الخصم</th>
                  <th className="py-1.5 px-2 rounded-l-lg text-center w-[15%] resize-x overflow-auto">الإجمالي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {safeItems.map((item, index) => (
                  <tr key={item.id} className="text-slate-700 hover:bg-slate-50/50">
                    <td className="py-1.5 px-2 text-center font-mono text-slate-400">{index + 1}</td>
                    <td className="py-1.5 px-2 font-semibold text-slate-800">
                      {item.serviceName}
                      <div className="text-[9px] text-slate-400 mt-0.5 font-normal">الموظف: {item.employeeName}</div>
                    </td>
                    <td className="py-1.5 px-2 text-center font-mono">{item.quantity}</td>
                    <td className="py-1.5 px-2 text-center font-mono">{item.price.toFixed(3)}</td>
                    <td className="py-1.5 px-2 text-center font-mono text-rose-500">{(item.discount || 0).toFixed(3)}</td>
                    <td className="py-1.5 px-2 text-center font-mono font-bold">{item.total.toFixed(3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Block */}
          <div className="flex justify-between items-end">
            <div className="w-1/2">
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-[10px] space-y-1">
                <span className="font-bold text-slate-600 block">المبلغ الإجمالي بالحروف:</span>
                <span className="text-teal-700 block font-semibold">{numberToWords(invoice.totalAmount).arabic}</span>
                <span className="text-slate-500 block" dir="ltr">{numberToWords(invoice.totalAmount).english}</span>
              </div>
            </div>
            <div className="w-64 space-y-2 text-xs border-t-2 border-slate-100 pt-3 font-sans">
              <div className="flex justify-between text-slate-500">
                <span>المجموع الفرعي:</span>
                <span className="font-mono">{subtotal.toFixed(3)} ر.ع.</span>
              </div>
              {(invoice.discount ?? 0) > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>خصم إضافي:</span>
                  <span className="font-mono">-{invoice.discount?.toFixed(3)} ر.ع.</span>
                </div>
              )}
              <div className="flex justify-between text-slate-800 font-bold text-sm border-t border-slate-100 pt-2">
                <span>الإجمالي النهائي المستحق:</span>
                <span className="font-mono text-teal-600">{invoice.totalAmount.toFixed(3)} ر.ع.</span>
              </div>
              <div className="flex justify-between text-blue-600 font-semibold">
                <span>المبلغ المقدم المدفوع:</span>
                <span className="font-mono">-{invoice.downPayment.toFixed(3)} ر.ع.</span>
              </div>
              <div className="flex justify-between text-rose-600 font-bold text-sm border-t-2 border-double border-slate-200 pt-2 bg-rose-50/50 p-1.5 rounded-lg">
                <span>المبلغ المتبقي:</span>
                <span className="font-mono">{invoice.remainingAmount.toFixed(3)} ر.ع.</span>
              </div>
            </div>
          </div>

          {/* Payments History */}
          {invoice.payments && invoice.payments.length > 0 && (
            <div className="mt-8 border-t border-slate-100 pt-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">سجل الدفعات</h4>
              <table className="w-full text-right border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                    <th className="p-2 resize-x overflow-auto">التاريخ</th>
                    <th className="p-2 resize-x overflow-auto">المبلغ (ر.ع.)</th>
                    <th className="p-2 resize-x overflow-auto">الموظف</th>
                    <th className="p-2 resize-x overflow-auto">ملاحظات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {invoice.payments.map((payment) => (
                    <tr key={payment.id} className="text-slate-600">
                      <td className="p-2 font-mono">{new Date(payment.date).toLocaleDateString('ar-OM')}</td>
                      <td className="p-2 font-mono font-bold text-teal-600">{payment.amount.toFixed(3)}</td>
                      <td className="p-2">{payment.recordedBy}</td>
                      <td className="p-2 text-[10px] text-slate-400">{payment.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Signature lines */}
          <div className="pt-8 flex justify-between text-center text-xs text-slate-400">
            <div className="w-1/3">
              <p>توقيع المستلم / العميل</p>
              <div className="h-10 border-b border-dashed border-slate-200 w-2/3 mx-auto my-2"></div>
            </div>
            <div className="w-1/3">
              <p>الاعتماد الرقمي للشركة</p>
              {invoice.status === 'draft' ? (
                <div className="mt-3 inline-block border-2 border-amber-800 text-amber-800 opacity-70 p-2 rounded-lg -rotate-6 font-bold text-[10px] leading-tight">
                  (غير مكتمل مسودة)<br/>
                  Al-Riyadah<br/>
                  <span className="text-[8px] text-amber-800 font-normal">بواسطة: {invoice.lastModifiedBy}</span>
                </div>
              ) : (
                <div className="mt-3 inline-block border-2 border-blue-500 text-blue-500 p-2 rounded-lg -rotate-6 font-bold text-[10px] leading-tight">
                  معتمد إلكترونياً<br/>
                  Al-Riyadah<br/>
                  <span className="text-[8px] text-slate-400 font-normal">بواسطة: {invoice.lastModifiedBy}</span>
                </div>
              )}
            </div>
          </div>

          {/* Official Invoice Footer on Margin */}
          <div className="mt-10 pt-4 border-t border-dashed border-slate-200 text-center select-none font-sans">
            <p className="text-[10px] text-slate-400 font-bold">شكرًا لتعاملكم مع {effectiveCompanyName}</p>
            <p className="text-[8px] text-slate-350 mt-1">النسخة الرقمية الصادرة من {effectiveSubtitle} - ٢٠٢٦</p>
          </div>

          {/* Histories */}
          <div className="mt-8 pt-4 border-t border-slate-100/60 print:hidden grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Original Docs History */}
            {invoice.originalDocsReceivedHistory && invoice.originalDocsReceivedHistory.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-slate-500" />
                  سجل استلام أصل المستندات
                </div>
                <div className="max-h-[120px] overflow-y-auto custom-scrollbar p-2 space-y-1">
                  {invoice.originalDocsReceivedHistory.map((log, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded border-b border-slate-50 last:border-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div className={`w-2 h-2 shrink-0 rounded-full ${log.status ? 'bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.3)]' : 'bg-rose-500 shadow-[0_0_4px_rgba(244,63,94,0.3)]'}`}></div>
                        <span className="text-[10px] font-bold text-slate-700">{log.status ? 'تم الاستلام' : 'لم يتم الاستلام'}</span>
                      </div>
                      <div className="text-[9px] text-slate-500 flex flex-col items-end gap-0.5">
                        <span className="font-sans font-semibold text-slate-600">{log.changedBy}</span>
                        <span dir="ltr" className="font-mono text-[8px]">{new Date(log.changedAt).toLocaleString('ar-SA', { dateStyle: 'short', timeStyle: 'short' })}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modification History */}
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
              <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-slate-500" />
                سجل التعديلات على الفاتورة
              </div>
              <div className="max-h-[120px] overflow-y-auto custom-scrollbar p-2 space-y-1">
                {invoice.modificationHistory && invoice.modificationHistory.length > 0 ? invoice.modificationHistory.map((log, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded border-b border-slate-50 last:border-0">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-[10px] font-bold text-slate-700">{log.action || 'تعديل'}</span>
                    </div>
                    <div className="text-[9px] text-slate-500 flex flex-col items-end gap-0.5">
                      <span className="font-sans font-semibold text-slate-600">{log.modifiedBy}</span>
                      <span dir="ltr" className="font-mono text-[8px]">{new Date(log.modifiedAt).toLocaleString('ar-SA', { dateStyle: 'short', timeStyle: 'short' })}</span>
                    </div>
                  </div>
                )) : (
                  <div className="text-center text-[10px] text-slate-400 py-4">
                    لا توجد تعديلات سابقة مسجلة
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Deletion Warning Box */}
          {deletedRecord && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-800 space-y-2 mt-4 select-none">
              <div className="flex items-center gap-2 font-bold text-xs md:text-sm">
                <Trash2 className="w-5 h-5 text-rose-600" />
                <span>⚠️ هذه الفاتورة محذوفة (DELETED)</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-semibold text-rose-700">
                <div>
                  <span className="text-rose-500">تم الحذف بواسطة الموظف:</span> {deletedRecord.deletedBy}
                </div>
                <div>
                  <span className="text-rose-500">تاريخ ووقت الحذف:</span>{' '}
                  <span className="font-mono">
                    {new Date(deletedRecord.deletedAt).toLocaleDateString('ar-OM')}{' '}
                    {new Date(deletedRecord.deletedAt).toLocaleTimeString('ar-OM', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Employee Summary (Preview Only) */}
          <div className="mt-8 pt-4 border-t border-slate-100/60 bg-blue-50/30 p-4 rounded-xl print:hidden">
            <h4 className="text-[10px] font-bold text-blue-600 mb-3 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              ملخص إيرادات الموظفين في هذه الفاتورة (للعرض فقط)
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(employeeSummary).map(([empName, empTotal]) => (
                <div key={empName} className="bg-white border border-blue-100 p-2.5 rounded-lg flex justify-between items-center shadow-sm shadow-blue-500/5">
                  <span className="text-xs font-semibold text-slate-700">{empName}</span>
                  <span className="text-xs font-mono font-bold text-blue-700">{empTotal.toFixed(3)} ر.ع</span>
                </div>
              ))}
            </div>
          </div>

          {/* Invoice-Specific Chat (Employees Only) */}
          <div className="mt-8 border-t border-slate-100/60 pt-6 print:hidden" id="invoice-print-chat-container">
            <ChatBox 
              channelId={`invoice-${invoice.id}`} 
              currentUser={currentUser} 
              users={users}
              title={`محادثة الموظفين للفاتورة رقم (${invoice.invoiceNumber})`}
              placeholder="اكتب ملاحظة أو رسالة بخصوص هذه الفاتورة..."
              heightClass="h-[280px]"
              defaultCollapsed={false}
              onMessagesLoaded={(hasMessages) => {
                if (hasMessages && scrollContainerRef.current) {
                  setTimeout(() => {
                    const chatContainer = document.getElementById('invoice-print-chat-container');
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
        </div>
      </div>
    </div>
  );
}
