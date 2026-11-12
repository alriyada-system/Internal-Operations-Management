/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Customer, Invoice, CustomerStatus } from '../types';
import { 
  Search, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  AlertCircle, 
  Archive, 
  Coins, 
  FileText,
  BadgeCheck
} from 'lucide-react';

interface AccountsClosingSectionProps {
  customers: Customer[];
  invoices: Invoice[];
  onUpdateCustomerStatus: (customerId: string, status: CustomerStatus) => void;
  onSettleCustomerInvoices: (customerId: string) => void;
  onLogActivity: (action: string) => void;
}

export default function AccountsClosingSection({
  customers,
  invoices,
  onUpdateCustomerStatus,
  onSettleCustomerInvoices,
  onLogActivity,
}: AccountsClosingSectionProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'open' | 'closed'>('all');

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
  
  // Calculate customer financial states
  const getCustomerDebts = (custId: string) => {
    return invoices
      .filter(inv => inv.customerId === custId && inv.status !== 'draft')
      .reduce((sum, inv) => sum + inv.remainingAmount, 0);
  };

  const getCustomerInvoiceSummary = (custId: string) => {
    const custInvs = invoices.filter(inv => inv.customerId === custId && inv.status !== 'draft');
    const totalCount = custInvs.length;
    const unpaidCount = custInvs.filter(inv => inv.status === 'unpaid' || inv.status === 'partially_paid').length;
    return { totalCount, unpaidCount };
  };

  // Filtering: support search across name, phone, civilId/registrationNumber
  const filteredCustomers = customers.filter(c => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      (c.name?.toLowerCase().includes(searchLower) ?? false) ||
      (c.phone?.includes(searchLower) ?? false) ||
      (c.civilId && c.civilId.includes(searchLower)) ||
      (c.registrationNumber && c.registrationNumber.includes(searchLower));

    const matchesFilter = 
      filterType === 'all' ? true :
      filterType === 'open' ? c.status !== 'closed' : c.status === 'closed';

    return matchesSearch && matchesFilter;
  });

  const handleSettleAndClose = (custId: string, custName: string) => {
    onSettleCustomerInvoices(custId);
    onUpdateCustomerStatus(custId, 'closed');
    onLogActivity(`تسوية مستحقات وإغلاق حساب العميل: ${custName}`);
    setSelectedCustomerId(null);
  };

  const handleCloseOnly = (custId: string, custName: string) => {
    onUpdateCustomerStatus(custId, 'closed');
    onLogActivity(`إغلاق وأرشفة حساب العميل: ${custName}`);
    setSelectedCustomerId(null);
  };

  const handleReopen = (custId: string, custName: string) => {
    onUpdateCustomerStatus(custId, 'active');
    onLogActivity(`إعادة تنشيط حساب العميل: ${custName}`);
    setSelectedCustomerId(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-right font-sans" dir="rtl" id="accounts-closing-section">
      {/* Customer Accounts Overview List */}
      <div className="lg:col-span-2 space-y-4">
        {/* Search controls */}
        <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-xs space-y-4">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="البحث في الحسابات لتسوية وإغلاق القيود..."
                className="w-full pl-3 pr-10 py-2.5 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500 text-slate-800 text-xs"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Filtering types */}
          <div className="flex gap-2 text-xs">
            <button
              onClick={() => setFilterType('all')}
              className={`py-1.5 px-3 rounded-lg font-semibold transition-all ${
                filterType === 'all' ? 'bg-slate-100 text-slate-800' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              كافة الحسابات
            </button>
            <button
              onClick={() => setFilterType('open')}
              className={`py-1.5 px-3 rounded-lg font-semibold transition-all ${
                filterType === 'open' ? 'bg-emerald-50 text-emerald-800' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              الحسابات المفتوحة والنشطة
            </button>
            <button
              onClick={() => setFilterType('closed')}
              className={`py-1.5 px-3 rounded-lg font-semibold transition-all ${
                filterType === 'closed' ? 'bg-rose-50 text-rose-800' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              الحسابات المغلقة والأرشيف
            </button>
          </div>
        </div>

        {/* Customer Accounts Cards */}
        <div className="space-y-3">
          {filteredCustomers.length > 0 ? (
            filteredCustomers.map(c => {
              const debts = getCustomerDebts(c.id);
              const isClosed = c.status === 'closed';

              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedCustomerId(c.id)}
                  className={`p-4 bg-white border rounded-2xl cursor-pointer transition-all flex items-center justify-between gap-4 ${
                    selectedCustomerId === c.id
                      ? 'border-rose-500 bg-rose-50/5 shadow-xs ring-1 ring-rose-500/25'
                      : 'border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-xl ${isClosed ? 'bg-slate-100 text-slate-400' : debts > 0 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                      <Archive className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">{c.name}</h4>
                      <p className="text-xs text-slate-400 mt-1 font-mono">{c.phone}</p>
                    </div>
                  </div>

                  <div className="text-left">
                    {isClosed ? (
                      <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md font-bold">
                        مغلق ومؤرشف
                      </span>
                    ) : debts > 0 ? (
                      <span className="text-[10px] bg-rose-50 text-rose-600 px-2.5 py-1 rounded-md font-bold font-mono">
                        مستحقات معلقة: {debts.toFixed(3)} ر.ع.
                      </span>
                    ) : (
                      <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-md font-bold">
                        جاهز للإغلاق (0.000)
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 text-slate-400 italic">
              لم يتم العثور على حسابات تطابق خيارات البحث الحالية
            </div>
          )}
        </div>
      </div>

      {/* Account Settle & Close Drawer */}
      <div className="lg:col-span-1" id="accounts-closing-drawer">
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs sticky top-4 space-y-5">
          {selectedCustomer ? (
            <>
              {/* Customer Settle Title */}
              <div>
                <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md inline-block mb-1">
                  مراجعة وتسوية الحسابات
                </span>
                <h3 className="text-sm font-bold text-slate-800">{selectedCustomer.name}</h3>
                <p className="text-xs text-slate-400 font-mono mt-1">{selectedCustomer.phone}</p>
              </div>

              <hr className="border-slate-100" />

              {/* Status and summary */}
              <div className="space-y-3 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>حالة الحساب الحالية:</span>
                  <span className={`font-bold ${selectedCustomer.status === 'active' ? 'text-emerald-600' : selectedCustomer.status === 'late' ? 'text-amber-600' : 'text-slate-400'}`}>
                    {selectedCustomer.status === 'active' ? 'نشط' : selectedCustomer.status === 'late' ? 'متأخر' : 'مغلق ومؤرشف'}
                  </span>
                </div>

                <div className="flex justify-between font-mono">
                  <span>إجمالي الديون العالقة:</span>
                  <span className={`font-bold ${getCustomerDebts(selectedCustomer.id) > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {getCustomerDebts(selectedCustomer.id).toFixed(3)} ريال عُماني
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>الفواتير المفتوحة المتبقية:</span>
                  <span className="font-bold">{getCustomerInvoiceSummary(selectedCustomer.id).unpaidCount} فواتير</span>
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* Dynamic Operations block */}
              {selectedCustomer.status === 'closed' ? (
                /* Closed Account Options */
                <div className="space-y-3">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2 text-xs text-slate-500">
                    <CheckCircle2 className="w-5 h-5 text-slate-400" />
                    تمت أرشفة وإغلاق هذا الحساب بنجاح وتصفية كافة مستحقاته المالية المعلقة.
                  </div>
                  <button
                    onClick={() => handleReopen(selectedCustomer.id, selectedCustomer.name)}
                    className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-950 text-white font-bold text-xs py-2.5 rounded-xl transition-all"
                  >
                    <Unlock className="w-4 h-4" />
                    إعادة تنشيط الحساب
                  </button>
                </div>
              ) : getCustomerDebts(selectedCustomer.id) > 0 ? (
                /* Outstanding Balance block */
                <div className="space-y-4">
                  <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl space-y-1 text-xs text-rose-800">
                    <div className="flex items-center gap-1 font-bold text-rose-900">
                      <AlertCircle className="w-4 h-4" />
                      تنبيه مالي مستحق
                    </div>
                    <p>
                      لا يمكن إغلاق حساب العميل لوجود مطالبات مالية معلقة بقيمة{' '}
                      <strong className="font-mono">{getCustomerDebts(selectedCustomer.id).toFixed(3)} ر.ع.</strong>
                    </p>
                  </div>

                  {/* Settle shortcut and Close */}
                  <button
                    onClick={() => handleSettleAndClose(selectedCustomer.id, selectedCustomer.name)}
                    className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-sm"
                  >
                    <Coins className="w-4 h-4" />
                    تسوية كافة المبالغ المتبقية وإغلاق الحساب
                  </button>
                </div>
              ) : (
                /* Debt is 0.000, Ready to close */
                <div className="space-y-3">
                  <div className="p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl space-y-1 text-xs text-emerald-800">
                    <div className="flex items-center gap-1 font-bold text-emerald-900">
                      <BadgeCheck className="w-4 h-4" />
                      الحساب مصفى وخالٍ من الديون
                    </div>
                    <p>رصيد المطالبات صفر ر.ع. الحساب جاهز للأرشفة والإغلاق الفوري.</p>
                  </div>

                  <button
                    onClick={() => handleCloseOnly(selectedCustomer.id, selectedCustomer.name)}
                    className="w-full flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-sm"
                  >
                    <Lock className="w-4 h-4" />
                    إغلاق الحساب وأرشفته الآن
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-slate-400 italic text-xs">
              👈 حدد حساب عميل من القائمة للبدء في تسوية فواتيره، تسديد ديونه، أو غلقه وأرشفته بأمان
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
