import React, { useState } from 'react';
import { DeletedInvoice, Customer } from '../types';
import { Trash2, Eye, Calendar, User, Search, FileText, RotateCcw } from 'lucide-react';

interface TrashSectionProps {
  deletedInvoices: DeletedInvoice[];
  customers: Customer[];
  onPreviewInvoice: (invoice: any) => void;
  currentUserRole: string;
  onRestoreInvoice: (deletedId: string) => void;
  onPermanentDeleteInvoice: (deletedId: string) => void;
  isGuest?: boolean;
}

export default function TrashSection({
  deletedInvoices,
  customers,
  onPreviewInvoice,
  currentUserRole,
  onRestoreInvoice,
  onPermanentDeleteInvoice,
  isGuest = false
}: TrashSectionProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Find customer name helper
  const getCustomerName = (customerId: string) => {
    const cust = customers.find(c => c.id === customerId);
    return cust ? cust.name : 'عميل غير معروف';
  };

  // Filter deleted invoices
  const filteredInvoices = deletedInvoices.filter(di => {
    const searchLower = searchTerm.toLowerCase();
    const invoiceNum = di.invoice.invoiceNumber || '';
    const custName = getCustomerName(di.invoice.customerId).toLowerCase();
    const deletedBy = di.deletedBy.toLowerCase();
    
    return (
      invoiceNum.includes(searchLower) ||
      custName.includes(searchLower) ||
      deletedBy.includes(searchLower)
    );
  });

  return (
    <div className="space-y-6 font-sans" dir="rtl">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-100 p-6 rounded-2xl shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl border border-rose-100">
            <Trash2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">سلة المحذوفات (Recycle Bin)</h2>
            <p className="text-xs text-slate-500 mt-0.5">مستودع للفواتير المحذوفة مؤقتاً لتجنب فقدان البيانات بالخطأ ولأغراض المراجعة والمطابقة.</p>
          </div>
        </div>
      </div>

      {/* Control & Search Bar */}
      <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-3xs flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <input
            type="text"
            placeholder="البحث باسم العميل، رقم الفاتورة، أو الموظف الذي حذفها..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-10 pl-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 bg-slate-50/50"
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
        </div>
        <div className="text-xs text-slate-500 font-bold whitespace-nowrap bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
          عدد الفواتير المحذوفة: <span className="text-rose-600 font-mono text-sm">{filteredInvoices.length}</span>
        </div>
      </div>

      {/* Main Content Area */}
      {filteredInvoices.length > 0 ? (
        <div className="bg-white border border-slate-100 rounded-2xl shadow-3xs overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 text-xs font-bold border-b border-slate-100">
                  <th className="py-3 px-5 resize-x overflow-auto">رقم الفاتورة</th>
                  <th className="py-3 px-5 resize-x overflow-auto">العميل</th>
                  <th className="py-3 px-5 resize-x overflow-auto">الموظف الذي قام بالحذف</th>
                  <th className="py-3 px-5 resize-x overflow-auto">تاريخ الحذف</th>
                  <th className="py-3 px-5 text-center resize-x overflow-auto">المبلغ الإجمالي</th>
                  <th className="py-3 px-5 text-center resize-x overflow-auto">الحالة السابقة</th>
                  <th className="py-3 px-5 text-center resize-x overflow-auto">الخيارات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs text-slate-700">
                {filteredInvoices.map((di) => (
                  <tr key={di.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-5 font-mono font-bold text-slate-800">{di.invoice.invoiceNumber}</td>
                    <td className="py-3.5 px-5 font-semibold">{getCustomerName(di.invoice.customerId)}</td>
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-1.5 text-rose-700">
                        <User className="w-3.5 h-3.5" />
                        <span>{di.deletedBy}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 font-mono text-slate-500">
                      {new Date(di.deletedAt).toLocaleDateString('ar-OM')} {new Date(di.deletedAt).toLocaleTimeString('ar-OM', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3.5 px-5 text-center font-mono font-bold text-teal-700">
                      {di.invoice.totalAmount.toFixed(3)} ر.ع.
                    </td>
                    <td className="py-3.5 px-5 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        di.invoice.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                        di.invoice.status === 'partially_paid' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                        di.invoice.status === 'unpaid' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {di.invoice.status === 'paid' ? 'مدفوعة' :
                         di.invoice.status === 'partially_paid' ? 'مدفوعة جزئياً' :
                         di.invoice.status === 'unpaid' ? 'غير مدفوعة' : 'مسودة'}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => onPreviewInvoice(di.invoice)}
                          className="inline-flex items-center gap-1 py-1.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-100 rounded-lg transition-colors font-bold cursor-pointer text-[11px]"
                          title="معاينة الفاتورة فقط"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>معاينة الفاتورة</span>
                        </button>
                        
                        {currentUserRole === 'admin' && !isGuest && (
                          <>
                            <button
                              onClick={() => onRestoreInvoice(di.id)}
                              className="inline-flex items-center gap-1 py-1.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-100 rounded-lg transition-colors font-bold cursor-pointer text-[11px]"
                              title="استعادة هذه الفاتورة إلى الفواتير النشطة"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>استعادة</span>
                            </button>

                            <button
                              onClick={() => onPermanentDeleteInvoice(di.id)}
                              className="inline-flex items-center gap-1 py-1.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-100 rounded-lg transition-colors font-bold cursor-pointer text-[11px]"
                              title="حذف نهائي للفاتورة من النظام تماماً"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>حذف نهائي</span>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="block md:hidden divide-y divide-slate-100">
            {filteredInvoices.map((di) => (
              <div key={di.id} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-slate-800 text-sm">فاتورة #{di.invoice.invoiceNumber}</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    di.invoice.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                    di.invoice.status === 'partially_paid' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                    di.invoice.status === 'unpaid' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {di.invoice.status === 'paid' ? 'مدفوعة' :
                     di.invoice.status === 'partially_paid' ? 'مدفوعة جزئياً' :
                     di.invoice.status === 'unpaid' ? 'غير مدفوعة' : 'مسودة'}
                  </span>
                </div>

                <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-slate-400">العميل: </span>
                    <span className="font-semibold">{getCustomerName(di.invoice.customerId)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <div className="flex items-center gap-1 text-rose-700">
                      <User className="w-3.5 h-3.5" />
                      <span>حذف بواسطة: {di.deletedBy}</span>
                    </div>
                    <div className="text-slate-500">
                      {new Date(di.deletedAt).toLocaleDateString('ar-OM')}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-teal-700 font-mono">
                    {di.invoice.totalAmount.toFixed(3)} ر.ع.
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onPreviewInvoice(di.invoice)}
                      className="inline-flex items-center gap-1 py-1.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-100 rounded-lg text-xs transition-colors font-bold cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>معاينة الفاتورة</span>
                    </button>
                    {currentUserRole === 'admin' && !isGuest && (
                      <>
                        <button
                          onClick={() => onRestoreInvoice(di.id)}
                          className="inline-flex items-center gap-1 py-1.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-100 rounded-lg text-xs transition-colors font-bold cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>استعادة</span>
                        </button>

                        <button
                          onClick={() => onPermanentDeleteInvoice(di.id)}
                          className="inline-flex items-center gap-1 py-1.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-100 rounded-lg text-xs transition-colors font-bold cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>حذف نهائي</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-16 bg-white border border-slate-100 rounded-2xl shadow-3xs space-y-3">
          <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto border border-slate-100">
            <Trash2 className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-700">سلة المحذوفات فارغة</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">لم يتم العثور على فواتير محذوفة تطابق معايير البحث الحالية.</p>
          </div>
        </div>
      )}
    </div>
  );
}
