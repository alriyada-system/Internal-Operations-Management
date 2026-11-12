import React from 'react';

export const DashboardMockup = () => (
  <div className="w-full bg-slate-100 rounded-xl overflow-hidden border border-slate-200 shadow-sm flex h-64 text-right my-6" dir="rtl">
    <div className="w-1/4 bg-slate-800 p-4 space-y-3">
      <div className="h-6 bg-slate-700 rounded-md w-3/4 mb-6"></div>
      <div className="h-4 bg-teal-500 rounded-md w-full opacity-80"></div>
      <div className="h-4 bg-slate-700 rounded-md w-5/6"></div>
      <div className="h-4 bg-slate-700 rounded-md w-4/5"></div>
      <div className="h-4 bg-slate-700 rounded-md w-full"></div>
    </div>
    <div className="w-3/4 p-4 flex flex-col gap-4">
      <div className="flex justify-between items-center bg-white p-3 rounded-lg shadow-xs">
        <div className="h-4 bg-slate-200 rounded w-1/4"></div>
        <div className="h-8 w-8 bg-slate-200 rounded-full"></div>
      </div>
      <div className="flex gap-3">
        <div className="flex-1 bg-white p-4 rounded-lg shadow-xs space-y-2">
          <div className="h-3 bg-slate-100 rounded w-1/2"></div>
          <div className="h-5 bg-teal-500 rounded w-3/4"></div>
        </div>
        <div className="flex-1 bg-white p-4 rounded-lg shadow-xs space-y-2">
          <div className="h-3 bg-slate-100 rounded w-1/2"></div>
          <div className="h-5 bg-indigo-500 rounded w-3/4"></div>
        </div>
        <div className="flex-1 bg-white p-4 rounded-lg shadow-xs space-y-2">
          <div className="h-3 bg-slate-100 rounded w-1/2"></div>
          <div className="h-5 bg-rose-500 rounded w-3/4"></div>
        </div>
      </div>
      <div className="flex-1 bg-white rounded-lg shadow-xs p-4 flex flex-col gap-3">
        <div className="h-4 bg-slate-100 rounded w-1/3"></div>
        <div className="flex-1 bg-slate-50 border border-slate-100 rounded-md"></div>
      </div>
    </div>
  </div>
);

export const StatsMockup = () => (
  <div className="w-full flex gap-4 text-right my-6" dir="rtl">
    <div className="flex-1 bg-white p-4 rounded-xl border border-slate-200 shadow-sm opacity-50 transform scale-95 transition-all">
      <div className="text-xs text-slate-400 mb-2">إجمالي المبيعات</div>
      <div className="text-lg font-bold text-slate-700">1,250.000 ر.ع</div>
    </div>
    <div className="flex-1 bg-white p-4 rounded-xl border border-teal-200 shadow-md transform scale-105 transition-all ring-2 ring-teal-100 relative">
      <div className="absolute -top-2 -right-2 bg-teal-500 text-white text-[9px] px-2 py-0.5 rounded-full">Hovering</div>
      <div className="text-xs text-slate-500 mb-2 font-bold">إيداع اليوم</div>
      <div className="text-lg font-bold text-teal-600">450.000 ر.ع</div>
    </div>
    <div className="flex-1 bg-white p-4 rounded-xl border border-slate-200 shadow-sm opacity-50 transform scale-95 transition-all">
      <div className="text-xs text-slate-400 mb-2">المدفوعات</div>
      <div className="text-lg font-bold text-slate-700">800.000 ر.ع</div>
    </div>
  </div>
);

export const InvoiceFormMockup = () => (
  <div className="w-full max-w-lg mx-auto bg-white rounded-xl shadow-sm border border-slate-200 p-4 text-right my-6" dir="rtl">
    <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
      <div className="font-bold text-slate-700 text-sm">فاتورة جديدة #INV-001</div>
      <div className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-1 rounded">مسودة</div>
    </div>
    <div className="grid grid-cols-2 gap-3 mb-4">
      <div className="space-y-1">
        <div className="h-3 bg-slate-100 w-1/3 rounded"></div>
        <div className="h-8 border border-slate-200 rounded bg-slate-50"></div>
      </div>
      <div className="space-y-1">
        <div className="h-3 bg-slate-100 w-1/3 rounded"></div>
        <div className="h-8 border border-slate-200 rounded bg-slate-50"></div>
      </div>
    </div>
    <div className="border border-slate-200 rounded-lg overflow-hidden mb-4">
      <div className="bg-slate-50 p-2 border-b border-slate-200 flex gap-2">
        <div className="h-3 bg-slate-200 rounded w-1/2"></div>
        <div className="h-3 bg-slate-200 rounded w-1/4"></div>
        <div className="h-3 bg-slate-200 rounded w-1/4"></div>
      </div>
      <div className="p-2 flex gap-2 items-center">
        <div className="h-6 border border-slate-200 rounded w-1/2 bg-white"></div>
        <div className="h-6 border border-slate-200 rounded w-1/4 bg-white"></div>
        <div className="h-6 border border-slate-200 rounded w-1/4 bg-white"></div>
      </div>
    </div>
    <div className="w-full bg-teal-50 border border-teal-200 text-teal-700 rounded-lg p-2 text-xs font-bold flex justify-center items-center gap-2 hover:bg-teal-100 cursor-pointer">
      <div className="w-3 h-3 rounded-full border-2 border-current flex items-center justify-center text-[10px] leading-none">+</div>
      إضافة بند جديد للفاتورة
    </div>
  </div>
);

export const HoverTableMockup = () => (
  <div className="w-full bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm text-right text-xs my-6" dir="rtl">
    <div className="bg-slate-50 grid grid-cols-4 p-3 border-b border-slate-200 font-bold text-slate-500">
      <div>رقم الفاتورة</div>
      <div>العميل</div>
      <div>المبلغ</div>
      <div>الحالة</div>
    </div>
    <div className="grid grid-cols-4 p-3 border-b border-slate-100 text-slate-600">
      <div>INV-2026-001</div>
      <div>شركة الأفق</div>
      <div>150.000</div>
      <div className="text-emerald-600">مدفوع</div>
    </div>
    <div className="grid grid-cols-4 p-3 border-b border-indigo-200 bg-indigo-50/70 text-indigo-900 font-bold transform scale-[1.01] shadow-sm relative z-10 transition-all rounded-sm cursor-pointer">
      <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-500 rounded-l-md"></div>
      <div>INV-2026-002</div>
      <div>مؤسسة التقنية</div>
      <div>340.500</div>
      <div className="text-amber-600">غير مدفوع</div>
    </div>
    <div className="grid grid-cols-4 p-3 text-slate-600">
      <div>INV-2026-003</div>
      <div>سالم محمد</div>
      <div>20.000</div>
      <div className="text-emerald-600">مدفوع</div>
    </div>
  </div>
);

export const PDFLandscapeMockup = () => (
  <div className="w-full max-w-2xl mx-auto bg-slate-200 p-4 rounded-xl flex justify-center overflow-hidden my-6">
    <div className="w-[500px] h-[300px] bg-white shadow-md rounded flex flex-col text-[8px] text-right p-4 relative" dir="rtl">
      <div className="text-center border-b border-teal-500 pb-2 mb-2">
        <div className="text-teal-600 font-bold text-[10px]">التقرير الشهري التفصيلي</div>
        <div className="text-slate-400">يوليو 2026</div>
      </div>
      <div className="flex gap-4 flex-1">
        <div className="flex-1 border border-slate-200 rounded">
          <div className="bg-slate-100 border-b border-slate-200 flex p-1 font-bold text-slate-600">
            <div className="flex-1">التاريخ</div>
            <div className="flex-1">الإيداع</div>
            <div className="flex-1">المدفوع</div>
            <div className="flex-1">المبيعات</div>
          </div>
          {[1,2,3,4,5].map(i => (
            <div key={i} className="flex p-1 border-b border-slate-100 text-slate-500">
              <div className="flex-1">0{i}/07</div>
              <div className="flex-1">10.0</div>
              <div className="flex-1">10.0</div>
              <div className="flex-1">20.0</div>
            </div>
          ))}
          <div className="flex p-1 bg-slate-800 text-white font-bold mt-auto">
            <div className="flex-1">المجموع</div>
            <div className="flex-1">50.0</div>
            <div className="flex-1">50.0</div>
            <div className="flex-1">100.0</div>
          </div>
        </div>
        <div className="w-1/3 flex flex-col gap-2">
          <div className="border border-slate-200 rounded p-2 bg-slate-50 space-y-1">
            <div className="flex justify-between font-bold"><span className="text-slate-500">إجمالي المبيعات:</span> <span>100.0</span></div>
            <div className="flex justify-between"><span className="text-slate-500">إيداع اليوم:</span> <span className="text-teal-600">50.0</span></div>
            <div className="flex justify-between"><span className="text-slate-500">المدفوع:</span> <span className="text-emerald-600">50.0</span></div>
          </div>
          <div className="flex-1 border border-slate-200 rounded flex items-end p-2 gap-1 justify-center">
            <div className="w-4 h-1/2 bg-teal-400 rounded-t"></div>
            <div className="w-4 h-3/4 bg-teal-500 rounded-t"></div>
            <div className="w-4 h-full bg-teal-600 rounded-t"></div>
            <div className="w-4 h-1/4 bg-teal-300 rounded-t"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export const TicketsTableMockup = () => (
  <div className="w-full bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm text-right text-xs my-6" dir="rtl">
    <div className="bg-slate-50 grid grid-cols-4 p-3 border-b border-slate-200 font-bold text-slate-500">
      <div>رقم التذكرة</div>
      <div>النوع</div>
      <div>الموضوع</div>
      <div>الحالة</div>
    </div>
    <div className="grid grid-cols-4 p-3 border-b border-slate-100 text-slate-600 items-center">
      <div>#TCK-001</div>
      <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span>إجازة</div>
      <div>طلب إجازة سنوية</div>
      <div><span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-md text-[10px] font-bold">قيد الانتظار</span></div>
    </div>
    <div className="grid grid-cols-4 p-3 border-b border-slate-100 text-slate-600 items-center">
      <div>#TCK-002</div>
      <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span>دعم فني</div>
      <div>مشكلة بالطابعة</div>
      <div><span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md text-[10px] font-bold">مكتمل ومغلق</span></div>
    </div>
  </div>
);

export const TooltipMockup = () => (
  <div className="w-full h-32 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center relative my-6">
    <div className="relative group">
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-3 py-1.5 rounded shadow-lg whitespace-nowrap animate-in fade-in slide-in-from-bottom-2">
        تعديل الفاتورة
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
      </div>
      <div className="w-10 h-10 bg-white border border-slate-200 rounded-lg flex items-center justify-center shadow-sm ring-2 ring-indigo-100 text-indigo-600 transform scale-110 transition-all cursor-pointer">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
      </div>
    </div>
  </div>
);

export const ClosingReportMockup = () => (
  <div className="w-full flex flex-col sm:flex-row gap-4 text-right my-6" dir="rtl">
    <div className="flex-1 bg-white border border-slate-200 p-4 rounded-xl shadow-sm relative">
      <div className="absolute top-0 right-0 w-full h-1 bg-indigo-500 rounded-t-xl"></div>
      <div className="font-bold text-sm text-slate-700 mb-3 border-b border-slate-100 pb-2">نموذج الإغلاق المالي</div>
      <div className="space-y-3">
        <div>
          <div className="text-[10px] text-slate-500 mb-1">نقداً بالصندوق</div>
          <div className="h-7 bg-slate-50 border border-slate-200 rounded w-full"></div>
        </div>
        <div>
          <div className="text-[10px] text-slate-500 mb-1">إيداع بنكي</div>
          <div className="h-7 bg-slate-50 border border-slate-200 rounded w-full"></div>
        </div>
        <div className="bg-indigo-600 text-white text-xs font-bold p-2 rounded text-center mt-2 cursor-pointer">اعتماد الإغلاق</div>
      </div>
    </div>
    <div className="hidden sm:flex items-center justify-center text-slate-300">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
    </div>
    <div className="flex-1 bg-white border border-slate-200 p-4 rounded-xl shadow-sm relative">
      <div className="absolute top-0 right-0 w-full h-1 bg-teal-500 rounded-t-xl"></div>
      <div className="font-bold text-sm text-slate-700 mb-3 border-b border-slate-100 pb-2">التقرير الشهري المجمع</div>
      <div className="border border-slate-100 rounded overflow-hidden">
        <div className="bg-slate-50 h-5 w-full border-b border-slate-100"></div>
        <div className="h-4 bg-white border-b border-slate-50 w-full"></div>
        <div className="h-4 bg-white border-b border-slate-50 w-full"></div>
        <div className="h-4 bg-indigo-50/50 w-full flex items-center px-1">
          <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
        </div>
        <div className="h-4 bg-white w-full"></div>
      </div>
      <div className="mt-3 flex justify-end">
        <div className="bg-teal-50 text-teal-600 text-[10px] font-bold p-1.5 px-3 rounded flex items-center gap-1 border border-teal-200 cursor-pointer">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 18H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-2"/><path d="M6 9v12a2 2 0 0 0 2-2h8a2 2 0 0 0 2-2V9Z"/><path d="M6 12h12"/></svg>
          طباعة PDF
        </div>
      </div>
    </div>
  </div>
);

export const TicketChatMockup = () => (
  <div className="w-full max-w-sm mx-auto bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col text-right h-48 my-6" dir="rtl">
    <div className="bg-white p-2 border-b border-slate-200 flex items-center gap-2">
      <div className="w-6 h-6 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/></svg>
      </div>
      <div>
        <div className="text-xs font-bold text-slate-700">تذكرة #TCK-001</div>
        <div className="text-[9px] text-slate-400">طلب إجازة</div>
      </div>
    </div>
    <div className="flex-1 p-3 flex flex-col gap-3 overflow-hidden relative">
      <div className="self-end bg-teal-500 text-white text-[10px] p-2 rounded-xl rounded-tr-sm max-w-[80%] shadow-sm">
        السلام عليكم، أرجو الموافقة على طلب إجازتي الأسبوع القادم.
      </div>
      <div className="self-start bg-white border border-slate-200 text-slate-700 text-[10px] p-2 rounded-xl rounded-tl-sm max-w-[80%] shadow-sm flex flex-col">
        <span className="text-[8px] text-indigo-500 font-bold mb-1">الإدارة</span>
        تم اعتماد الإجازة، إجازة سعيدة!
      </div>
    </div>
    <div className="bg-white p-2 border-t border-slate-200 flex items-center gap-2">
      <div className="flex-1 bg-slate-50 border border-slate-200 rounded-full h-7 flex items-center px-3 text-[10px] text-slate-400">اكتب رداً...</div>
      <div className="w-7 h-7 bg-teal-600 text-white rounded-full flex items-center justify-center rotate-180 shadow-sm cursor-pointer">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" x2="11" y1="2" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
      </div>
    </div>
  </div>
);

export const ChatMailMockup = () => (
  <div className="w-full bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm my-6 text-right" dir="rtl">
    <div className="flex border-b border-slate-200 bg-slate-50 font-bold text-xs">
      <div className="flex-1 py-2.5 text-center bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600">الدردشة الخاصة (Private Chat)</div>
      <div className="flex-1 py-2.5 text-center text-slate-500">صندوق البريد الإلكتروني (Inbox)</div>
    </div>
    <div className="flex h-56 text-xs">
      <div className="w-1/3 border-l border-slate-200 bg-slate-50 p-2 space-y-2">
        <div className="bg-white p-1.5 rounded-lg border border-slate-200 text-[10px] text-slate-400 flex justify-between">
          <span>+ محادثة جديدة</span>
          <span>🔍</span>
        </div>
        <div className="bg-indigo-50 border-r-2 border-indigo-600 p-2 rounded flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[10px]">م</div>
          <div className="truncate">
            <div className="font-bold text-slate-800 text-[11px]">مريم البلوشي</div>
            <div className="text-[9px] text-slate-500 truncate">تم إرسال إيصال التحويل</div>
          </div>
        </div>
        <div className="p-2 hover:bg-slate-100 rounded flex items-center gap-2 opacity-70">
          <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-[10px]">أ</div>
          <div className="truncate">
            <div className="font-bold text-slate-800 text-[11px]">أحمد العبري</div>
            <div className="text-[9px] text-slate-500">محاسب الفرع</div>
          </div>
        </div>
      </div>
      <div className="flex-1 flex flex-col bg-white">
        <div className="p-2 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
          <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[9px]">م</div>
          <div>
            <div className="font-bold text-slate-800 text-[11px]">مريم البلوشي</div>
            <div className="text-[9px] text-slate-400">منسقة المعاملات</div>
          </div>
        </div>
        <div className="flex-1 p-3 space-y-2 bg-slate-50/30 overflow-hidden">
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 p-2 rounded-xl rounded-br-none text-[10px] text-slate-700 max-w-[80%]">
              أهلاً، هل تم التأكد من استلام مبالغ الفاتورة رقم #1042؟
            </div>
          </div>
          <div className="flex justify-end">
            <div className="bg-indigo-600 text-white p-2 rounded-xl rounded-bl-none text-[10px] max-w-[80%] space-y-1">
              <div>نعم، وصل التحويل البنكي بقيمة 45 ر.ع. المرفق أدناه:</div>
              <div className="bg-indigo-500/50 p-1 rounded text-[9px] flex items-center gap-1 w-max">
                📎 receipt-1042.pdf
              </div>
            </div>
          </div>
        </div>
        <div className="p-2 border-t border-slate-200 flex gap-2 items-center bg-white">
          <span className="p-1 text-slate-400 bg-slate-50 rounded border border-slate-200">📎</span>
          <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[10px] text-slate-400">اكتب رسالتك هنا...</div>
          <span className="bg-indigo-600 text-white px-2.5 py-1 rounded-lg text-[10px] font-bold">إرسال</span>
        </div>
      </div>
    </div>
  </div>
);

export const ProfileSectionMockup = () => (
  <div className="w-full bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm my-6 text-right" dir="rtl">
    <div className="p-4 bg-slate-800 text-white flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-indigo-500 border-2 border-white/20 flex items-center justify-center font-bold text-lg">
          س
        </div>
        <div>
          <div className="font-bold text-sm">سعيد الكعبي</div>
          <div className="text-xs text-slate-300">موظف استقبال وتخليص - فرع البريمي</div>
        </div>
      </div>
      <div className="bg-white/10 border border-white/20 px-2 py-1 rounded text-xs text-white">
        عرض ملف موظف آخر ▼
      </div>
    </div>
    <div className="flex border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-600 overflow-x-auto">
      <div className="py-2.5 px-3 bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600">معلوماتي الشخصية</div>
      <div className="py-2.5 px-3 hover:bg-slate-100 flex items-center gap-1">الإنذارات والمخالفات <span className="bg-rose-500 text-white text-[9px] px-1.5 rounded-full">1</span></div>
      <div className="py-2.5 px-3 hover:bg-slate-100">حسابي</div>
      <div className="py-2.5 px-3 hover:bg-slate-100">المهارات والخبرات</div>
      <div className="py-2.5 px-3 hover:bg-slate-100">الأمان</div>
    </div>
    <div className="p-4 bg-white grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
        <span className="text-[10px] text-slate-400 block font-bold">الإسم الثلاثي</span>
        <span className="font-bold text-slate-800">سعيد بن عبدالله الكعبي</span>
      </div>
      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
        <span className="text-[10px] text-slate-400 block font-bold">الرقم الوظيفي</span>
        <span className="font-bold text-slate-800 font-mono">EMP-8092</span>
      </div>
      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
        <span className="text-[10px] text-slate-400 block font-bold">الفرع التابع له</span>
        <span className="font-bold text-indigo-600">فرع البريمي</span>
      </div>
      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
        <span className="text-[10px] text-slate-400 block font-bold">تاريخ التعيين</span>
        <span className="font-bold text-slate-800">2024-01-15</span>
      </div>
      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
        <span className="text-[10px] text-slate-400 block font-bold">اتفاقية العمل</span>
        <span className="text-indigo-600 font-bold flex items-center gap-1">📎 عقد_العمل.pdf</span>
      </div>
      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
        <span className="text-[10px] text-slate-400 block font-bold">حالة الأمان</span>
        <span className="text-emerald-600 font-bold flex items-center gap-1">🛡️ كلمة المرور محمية</span>
      </div>
    </div>
  </div>
);

export const DailyFinancialInputsMockup = () => (
  <div className="w-full bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm my-6 text-right font-sans" dir="rtl">
    {/* Header & Controls Bar */}
    <div className="p-4 bg-slate-900 text-white flex flex-wrap justify-between items-center gap-3">
      <div className="flex items-center gap-2">
        <div className="bg-teal-500/20 text-teal-400 p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-teal-500/30">
          <span>📅</span>
          <span>شهر يوليو 2026</span>
          <span className="text-[10px] text-teal-300">▼</span>
        </div>
        <div className="bg-white/10 px-3 py-1.5 rounded-xl text-xs text-slate-200 border border-white/10">
          فرع البريمي ▼
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs">
        <button className="bg-teal-600 hover:bg-teal-500 text-white font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-sm">
          <span>📄</span> طباعة T-PDF
        </button>
        <button className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-sm">
          <span>📊</span> تصدير Excel
        </button>
        <button className="bg-white/10 text-slate-300 p-1.5 rounded-lg border border-white/10">
          🔄
        </button>
      </div>
    </div>

    {/* Metric Cards Banner */}
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 bg-slate-50 border-b border-slate-200 text-xs">
      <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="text-[10px] text-slate-400 font-bold">إجمالي إيرادات الشهر</div>
        <div className="text-sm font-black text-teal-600">4,850.000 ر.ع</div>
      </div>
      <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="text-[10px] text-slate-400 font-bold">المقبوضات النقدية (الكاش)</div>
        <div className="text-sm font-black text-emerald-600">2,100.000 ر.ع</div>
      </div>
      <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="text-[10px] text-slate-400 font-bold">التحويلات البنكية والبطاقات</div>
        <div className="text-sm font-black text-indigo-600">2,450.000 ر.ع</div>
      </div>
      <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="text-[10px] text-slate-400 font-bold">المصاريف والدَيْن المعلق</div>
        <div className="text-sm font-black text-rose-600">300.000 ر.ع</div>
      </div>
    </div>

    {/* Table Title Bar */}
    <div className="p-3 bg-slate-100/70 border-b border-slate-200 flex justify-between items-center text-xs">
      <div className="font-bold text-slate-800 flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 bg-teal-600 rounded-full"></span>
        جدول المدخلات المالية اليومية (Daily Financial Inputs Table)
      </div>
      <div className="text-[11px] text-slate-500">
        إجمالي الأيام المسجلة: <strong className="text-slate-800 font-mono">15 يوماً</strong>
      </div>
    </div>

    {/* The Table */}
    <div className="overflow-x-auto">
      <table className="w-full text-right text-xs">
        <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
          <tr>
            <th className="p-2.5 resize-x overflow-auto">التاريخ واليوم</th>
            <th className="p-2.5 resize-x overflow-auto">إجمالي الفواتير</th>
            <th className="p-2.5 text-emerald-700 resize-x overflow-auto">المقبوضات النقدية</th>
            <th className="p-2.5 text-indigo-700 resize-x overflow-auto">التحويل والبطاقة</th>
            <th className="p-2.5 text-rose-700 resize-x overflow-auto">المصاريف النثرية</th>
            <th className="p-2.5 resize-x overflow-auto">حالة الإغلاق اليومي</th>
            <th className="p-2.5 text-center resize-x overflow-auto">العمليات والإجراءات</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-slate-700">
          {/* Row 1 - Highlighted Specific Day */}
          <tr className="bg-teal-50/80 hover:bg-teal-100/60 font-medium transition-colors border-l-4 border-l-teal-600">
            <td className="p-2.5 font-bold text-teal-900 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-teal-600"></span>
              <span>15 يوليو (الأربعاء)</span>
            </td>
            <td className="p-2.5 font-bold text-slate-900 font-mono">245.000 ر.ع</td>
            <td className="p-2.5 text-emerald-700 font-mono font-bold">120.000 ر.ع</td>
            <td className="p-2.5 text-indigo-700 font-mono font-bold">125.000 ر.ع</td>
            <td className="p-2.5 text-rose-600 font-mono">0.000 ر.ع</td>
            <td className="p-2.5">
              <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 w-max">
                ✅ مطابق ومغلق
              </span>
            </td>
            <td className="p-2.5 text-center">
              <button className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-2.5 py-1 rounded-lg text-[10px] shadow-2xs flex items-center gap-1 mx-auto">
                <span>🔍</span>
                <span>عرض عمليات اليوم (12)</span>
              </button>
            </td>
          </tr>

          {/* Row 2 */}
          <tr className="hover:bg-slate-50 transition-colors">
            <td className="p-2.5 font-bold text-slate-800">14 يوليو (الثلاثاء)</td>
            <td className="p-2.5 font-mono">180.000 ر.ع</td>
            <td className="p-2.5 text-emerald-700 font-mono">90.000 ر.ع</td>
            <td className="p-2.5 text-indigo-700 font-mono">90.000 ر.ع</td>
            <td className="p-2.5 text-rose-600 font-mono">15.000 ر.ع</td>
            <td className="p-2.5">
              <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 w-max">
                ✅ مطابق ومغلق
              </span>
            </td>
            <td className="p-2.5 text-center">
              <button className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-2.5 py-1 rounded-lg text-[10px] border border-slate-200 flex items-center gap-1 mx-auto">
                <span>🔍</span>
                <span>عرض عمليات اليوم (8)</span>
              </button>
            </td>
          </tr>

          {/* Row 3 - Unclosed Day */}
          <tr className="hover:bg-slate-50 transition-colors bg-amber-50/40">
            <td className="p-2.5 font-bold text-amber-900">13 يوليو (الإثنين)</td>
            <td className="p-2.5 font-mono">310.000 ر.ع</td>
            <td className="p-2.5 text-emerald-700 font-mono">150.000 ر.ع</td>
            <td className="p-2.5 text-indigo-700 font-mono">160.000 ر.ع</td>
            <td className="p-2.5 text-rose-600 font-mono">5.000 ر.ع</td>
            <td className="p-2.5">
              <span className="bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 w-max">
                ⏳ غير مغلق (قيد التدقيق)
              </span>
            </td>
            <td className="p-2.5 text-center">
              <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-2.5 py-1 rounded-lg text-[10px] shadow-2xs flex items-center gap-1 mx-auto">
                <span>🔍</span>
                <span>عرض عمليات اليوم (15)</span>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
);

export const DayOperationsModalMockup = () => (
  <div className="w-full bg-slate-900/40 p-3 sm:p-6 rounded-2xl my-6 flex justify-center text-right font-sans" dir="rtl">
    <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden">
      {/* Modal Header */}
      <div className="p-4 bg-teal-800 text-white flex justify-between items-center">
        <div>
          <div className="font-bold text-sm flex items-center gap-2">
            <span>🔍</span>
            <span>تفاصيل كشف عمليات يوم الأربعاء (15 يوليو 2026)</span>
          </div>
          <div className="text-[11px] text-teal-200 mt-0.5">فرع البريمي • إجمالي الفواتير الصادرة: 12 فاتورة</div>
        </div>
        <button className="bg-white/20 hover:bg-white/30 text-white w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold">
          ✕
        </button>
      </div>

      {/* Filter Tabs & Search */}
      <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap justify-between items-center gap-2 text-xs">
        <div className="flex gap-1.5 font-bold text-[11px]">
          <span className="bg-teal-600 text-white px-2.5 py-1 rounded-lg shadow-2xs">الكل (12)</span>
          <span className="bg-white border border-slate-200 text-slate-600 px-2.5 py-1 rounded-lg hover:bg-slate-100">كاش (5)</span>
          <span className="bg-white border border-slate-200 text-slate-600 px-2.5 py-1 rounded-lg hover:bg-slate-100">بنك مسقط (4)</span>
          <span className="bg-white border border-slate-200 text-slate-600 px-2.5 py-1 rounded-lg hover:bg-slate-100">بطاقة POS (3)</span>
        </div>
        <div className="text-[10px] text-slate-400 bg-white border border-slate-200 px-2 py-1 rounded-lg">
          🔍 بحث برقم الفاتورة أو العميل...
        </div>
      </div>

      {/* Operations Table */}
      <div className="p-2 overflow-x-auto">
        <table className="w-full text-right text-xs">
          <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
            <tr>
              <th className="p-2 resize-x overflow-auto">الفاتورة</th>
              <th className="p-2 resize-x overflow-auto">الوقت</th>
              <th className="p-2 resize-x overflow-auto">اسم العميل</th>
              <th className="p-2 resize-x overflow-auto">نوع الخدمة</th>
              <th className="p-2 resize-x overflow-auto">طريقة الدفع</th>
              <th className="p-2 text-left resize-x overflow-auto">المبلغ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            <tr>
              <td className="p-2 font-mono font-bold text-indigo-600">#INV-1042</td>
              <td className="p-2 text-slate-400 text-[10px]">10:15 ص</td>
              <td className="p-2 font-bold text-slate-800">شركة المدار الشاملة</td>
              <td className="p-2"><span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">تجديد سجل تجاري</span></td>
              <td className="p-2"><span className="bg-indigo-50 text-indigo-700 font-bold px-1.5 py-0.5 rounded text-[10px]">تحويل بنكي</span></td>
              <td className="p-2 text-left font-mono font-bold text-slate-900">45.000 ر.ع</td>
            </tr>
            <tr>
              <td className="p-2 font-mono font-bold text-indigo-600">#INV-1043</td>
              <td className="p-2 text-slate-400 text-[10px]">11:00 ص</td>
              <td className="p-2 font-bold text-slate-800">سالم العبري</td>
              <td className="p-2"><span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">طباعة عقود إيجار</span></td>
              <td className="p-2"><span className="bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.5 rounded text-[10px]">نقداً (كاش)</span></td>
              <td className="p-2 text-left font-mono font-bold text-slate-900">20.000 ر.ع</td>
            </tr>
            <tr>
              <td className="p-2 font-mono font-bold text-indigo-600">#INV-1044</td>
              <td className="p-2 text-slate-400 text-[10px]">12:30 م</td>
              <td className="p-2 font-bold text-slate-800">مؤسسة الأفق المعتمدة</td>
              <td className="p-2"><span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">تخليص تأشيرات عمل</span></td>
              <td className="p-2"><span className="bg-teal-50 text-teal-700 font-bold px-1.5 py-0.5 rounded text-[10px]">بطاقة POS</span></td>
              <td className="p-2 text-left font-mono font-bold text-slate-900">180.000 ر.ع</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Modal Footer Summary */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs font-bold">
        <div className="flex gap-3">
          <span className="text-slate-600">الكاش: <strong className="text-emerald-600">20.000 ر.ع</strong></span>
          <span className="text-slate-600">البنك/البطاقة: <strong className="text-indigo-600">225.000 ر.ع</strong></span>
        </div>
        <div className="text-teal-900 bg-teal-100 px-3 py-1 rounded-lg border border-teal-200">
          إجمالي مبيعات اليوم: <span className="font-mono text-sm">245.000 ر.ع</span>
        </div>
      </div>
    </div>
  </div>
);

export const MonthlyChartsMockup = () => (
  <div className="w-full bg-white border border-slate-200 rounded-2xl p-4 my-6 shadow-sm text-right font-sans" dir="rtl">
    <div className="text-xs font-bold text-slate-800 mb-3 border-b border-slate-100 pb-2 flex items-center gap-2">
      <span>📊</span>
      <span>الرسوم البيانية والتحليلات البصرية للشهر (Monthly Analytics Charts)</span>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Chart 1: Daily Trend */}
      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-bold text-slate-700">مؤشر نمو المبيعات اليومية خلال الشهر</span>
          <span className="text-[10px] text-teal-600 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">أعلى يوم: 13 يوليو (310 ر.ع)</span>
        </div>
        <div className="h-32 flex items-end justify-between gap-1 px-2 pt-6 pb-2 border-b-2 border-slate-300 relative">
          <div className="w-1/6 bg-teal-400 hover:bg-teal-500 h-[40%] rounded-t-sm relative group cursor-pointer">
            <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] bg-slate-800 text-white px-1 rounded hidden group-hover:block">120</span>
          </div>
          <div className="w-1/6 bg-teal-500 hover:bg-teal-600 h-[65%] rounded-t-sm relative group cursor-pointer">
            <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] bg-slate-800 text-white px-1 rounded hidden group-hover:block">180</span>
          </div>
          <div className="w-1/6 bg-teal-700 hover:bg-teal-800 h-[95%] rounded-t-sm relative group cursor-pointer ring-2 ring-teal-300">
            <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] bg-slate-800 text-white px-1 rounded hidden group-hover:block">310</span>
          </div>
          <div className="w-1/6 bg-teal-500 hover:bg-teal-600 h-[60%] rounded-t-sm relative group cursor-pointer">
            <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] bg-slate-800 text-white px-1 rounded hidden group-hover:block">180</span>
          </div>
          <div className="w-1/6 bg-teal-600 hover:bg-teal-700 h-[80%] rounded-t-sm relative group cursor-pointer">
            <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] bg-slate-800 text-white px-1 rounded hidden group-hover:block">245</span>
          </div>
        </div>
        <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
          <span>01 يوليو</span>
          <span>05 يوليو</span>
          <span>10 يوليو</span>
          <span>13 يوليو</span>
          <span>15 يوليو</span>
        </div>
      </div>

      {/* Chart 2: Service Distribution */}
      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col justify-between">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-bold text-slate-700">توزيع المبيعات حسب نوع الخدمة</span>
          <span className="text-[10px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">الخدمة الأكثر طلباً: التخليص</span>
        </div>
        <div className="flex items-center justify-center gap-6 my-2">
          <div className="w-20 h-20 rounded-full border-8 border-teal-500 border-r-indigo-600 border-b-amber-500 relative flex items-center justify-center shadow-inner">
            <span className="text-[9px] font-bold text-slate-600">100%</span>
          </div>
          <div className="space-y-1 text-[11px] font-bold">
            <div className="flex items-center gap-1.5 text-teal-700"><span className="w-2.5 h-2.5 rounded-full bg-teal-500"></span> طباعة وعقود (40%)</div>
            <div className="flex items-center gap-1.5 text-indigo-700"><span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span> تخليص وتأشيرات (45%)</div>
            <div className="flex items-center gap-1.5 text-amber-700"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> ترجمة ووثائق (15%)</div>
          </div>
        </div>
        <div className="text-[10px] text-slate-400 text-center border-t border-slate-200 pt-1.5">
          مبني على تحليل <strong className="text-slate-700 font-mono">142 فاتورة</strong> صادرة هذا الشهر.
        </div>
      </div>
    </div>
  </div>
);

export const ReportFiltersMockup = () => (
  <div className="w-full bg-white border border-slate-200 rounded-2xl p-4 my-6 shadow-sm text-right font-sans" dir="rtl">
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-wrap gap-4 items-center justify-between">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-slate-500">الفترة الزمنية (الشهر)</label>
          <div className="bg-white border border-slate-300 px-3 py-2 rounded-lg text-sm font-bold text-slate-700 flex items-center gap-2 cursor-pointer hover:border-teal-400">
            <span>📅</span>
            <span>يوليو 2026</span>
            <span className="text-[10px] text-slate-400 mr-2">▼</span>
          </div>
        </div>
        
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-slate-500">تصفية حسب الفرع</label>
          <div className="bg-white border border-slate-300 px-3 py-2 rounded-lg text-sm font-bold text-slate-700 flex items-center gap-2 cursor-pointer hover:border-teal-400">
            <span>🏢</span>
            <span>جميع الفروع</span>
            <span className="text-[10px] text-slate-400 mr-2">▼</span>
          </div>
        </div>
        
        <div className="flex flex-col gap-1.5 justify-end h-full mt-5">
           <button className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-4 py-2 rounded-lg text-sm shadow-sm flex items-center gap-2">
             <span>تطبيق الفرز</span>
           </button>
        </div>
      </div>
      
      <div className="flex flex-col gap-1.5 justify-end h-full mt-5 border-r border-slate-200 pr-4">
        <div className="flex items-center gap-2">
           <button className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold px-3 py-2 rounded-lg text-xs shadow-sm flex items-center gap-1.5">
             <span className="text-emerald-600">📊</span>
             <span>تصدير Excel</span>
           </button>
           <button className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-3 py-2 rounded-lg text-xs shadow-sm flex items-center gap-1.5">
             <span className="text-rose-400">📄</span>
             <span>طباعة التقرير (PDF)</span>
           </button>
        </div>
      </div>
    </div>
  </div>
);

export const InteractiveCardsMockup = () => (
  <div className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl p-4 sm:p-6 my-6 text-right font-sans" dir="rtl">
    <div className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-200 pb-2">
      <span className="w-2.5 h-2.5 bg-teal-500 rounded-full shadow-sm"></span>
      الأداء المالي السنوي - ملخص الأشهر (Interactive Monthly Cards)
    </div>
    
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {/* Active Card */}
      <div className="bg-white border-2 border-teal-500 rounded-xl p-4 shadow-md relative transform transition cursor-pointer ring-4 ring-teal-500/10">
        <div className="absolute top-0 right-0 bg-teal-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg rounded-tr-lg flex items-center gap-1 shadow-sm">
          <span>👁️</span> محدد حالياً
        </div>
        <div className="text-slate-800 font-bold text-lg mb-1 mt-2">يوليو 2026</div>
        <div className="text-teal-600 font-black text-2xl mb-3 tracking-tight">4,850.000 <span className="text-xs text-teal-500 font-normal">ر.ع</span></div>
        
        <div className="bg-slate-50 rounded-lg p-2.5 flex justify-between items-center text-xs border border-slate-100">
          <div className="flex flex-col gap-0.5">
             <span className="text-slate-500 text-[10px]">إجمالي الفواتير</span>
             <span className="font-bold text-slate-700 font-mono">142</span>
          </div>
          <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-0.5 border border-emerald-200 shadow-2xs">
            ↑ 12% نمو
          </span>
        </div>
      </div>
      
      {/* Previous Month Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs relative transform transition hover:-translate-y-1 hover:border-teal-300 hover:shadow-md cursor-pointer">
        <div className="text-slate-800 font-bold text-lg mb-1">يونيو 2026</div>
        <div className="text-slate-700 font-black text-2xl mb-3 tracking-tight">4,330.000 <span className="text-xs text-slate-500 font-normal">ر.ع</span></div>
        
        <div className="bg-slate-50 rounded-lg p-2.5 flex justify-between items-center text-xs border border-slate-100">
          <div className="flex flex-col gap-0.5">
             <span className="text-slate-500 text-[10px]">إجمالي الفواتير</span>
             <span className="font-bold text-slate-700 font-mono">128</span>
          </div>
          <span className="bg-rose-50 text-rose-700 px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-0.5 border border-rose-100 shadow-2xs">
            ↓ 4% تراجع
          </span>
        </div>
      </div>

      {/* Older Month Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs relative transform transition hover:-translate-y-1 hover:border-teal-300 hover:shadow-md cursor-pointer opacity-80 hover:opacity-100">
        <div className="text-slate-800 font-bold text-lg mb-1">مايو 2026</div>
        <div className="text-slate-700 font-black text-2xl mb-3 tracking-tight">4,510.000 <span className="text-xs text-slate-500 font-normal">ر.ع</span></div>
        
        <div className="bg-slate-50 rounded-lg p-2.5 flex justify-between items-center text-xs border border-slate-100">
          <div className="flex flex-col gap-0.5">
             <span className="text-slate-500 text-[10px]">إجمالي الفواتير</span>
             <span className="font-bold text-slate-700 font-mono">135</span>
          </div>
          <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-0.5 border border-emerald-100 shadow-2xs">
            ↑ 8% نمو
          </span>
        </div>
      </div>
    </div>
  </div>
);


