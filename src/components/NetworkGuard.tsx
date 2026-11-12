import React, { useState, useEffect } from 'react';
import { WifiOff, AlertTriangle } from 'lucide-react';

export default function NetworkGuard() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!isOnline) {
      const style = document.createElement('style');
      style.id = 'sys-offline-mode-styles';
      style.innerHTML = `
        /* Offline Mode Read-Only Lock */
        body.sys-offline-mode input:not([type="search"]),
        body.sys-offline-mode textarea,
        body.sys-offline-mode select {
          pointer-events: none !important;
          opacity: 0.6 !important;
          background-color: #f1f5f9 !important;
          cursor: not-allowed !important;
        }
        
        body.sys-offline-mode form button,
        body.sys-offline-mode button[type="submit"],
        body.sys-offline-mode button[class*="bg-teal-"],
        body.sys-offline-mode button[class*="bg-rose-"],
        body.sys-offline-mode button[class*="bg-emerald-"],
        body.sys-offline-mode button[class*="bg-blue-"],
        body.sys-offline-mode button[class*="bg-indigo-"],
        body.sys-offline-mode button[class*="bg-red-"] {
          pointer-events: none !important;
          opacity: 0.5 !important;
          cursor: not-allowed !important;
          filter: grayscale(80%) !important;
        }

        /* Exceptions for standard navigation tabs or close buttons */
        body.sys-offline-mode .nav-btn,
        body.sys-offline-mode .close-btn {
          pointer-events: auto !important;
          opacity: 1 !important;
          cursor: pointer !important;
          filter: none !important;
        }
      `;
      document.head.appendChild(style);
      document.body.classList.add('sys-offline-mode');

      // Intercept clicks on capture phase to ensure actions are blocked
      const interceptClick = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        
        // Block inputs completely
        if (target.closest('input:not([type="search"]), textarea, select')) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }

        // Block mutation buttons
        const button = target.closest('button');
        if (button) {
          const text = button.textContent || '';
          const type = button.getAttribute('type');
          // Arabic keywords that usually trigger a mutation/server request
          const isMutation = type === 'submit' || /إضافة|حفظ|إرسال|تعديل|حذف|اعتماد|إصدار|طلب|تحديث|تسجيل|تأكيد/i.test(text);
          const isException = /عرض|تنزيل|طباعة|تصدير|إغلاق|إلغاء/i.test(text) && type !== 'submit';

          if (isMutation && !isException) {
            e.preventDefault();
            e.stopPropagation();
          }
        }
      };

      // Block keydown for inputs
      const interceptKeydown = (e: KeyboardEvent) => {
        const target = e.target as HTMLElement;
        if (target.matches('input:not([type="search"]), textarea, select') && e.key !== 'Tab') {
          e.preventDefault();
          e.stopPropagation();
        }
      };

      document.addEventListener('click', interceptClick, true);
      document.addEventListener('keydown', interceptKeydown, true);

      return () => {
        const el = document.getElementById('sys-offline-mode-styles');
        if (el) el.remove();
        document.body.classList.remove('sys-offline-mode');
        document.removeEventListener('click', interceptClick, true);
        document.removeEventListener('keydown', interceptKeydown, true);
      };
    }
  }, [isOnline]);

  if (isOnline) return null;

  return (
    <div className="fixed top-4 left-0 right-0 z-[9999] flex justify-center p-4 pointer-events-none animate-in slide-in-from-top-4 fade-in duration-300">
      <div className="bg-rose-600/95 backdrop-blur-md text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 max-w-xl border border-rose-500/50 pointer-events-auto ring-4 ring-rose-500/20">
        <div className="p-2 bg-rose-500/50 rounded-full animate-pulse shrink-0">
          <WifiOff className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-base flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-300" />
            انقطع الاتصال بالإنترنت
          </h3>
          <p className="text-xs opacity-95 leading-relaxed mt-1 font-medium">
            النظام حالياً في <span className="bg-white/20 px-1 py-0.5 rounded text-white mx-1 font-bold">وضع القراءة فقط</span> لحماية بياناتك ومنع فقدانها. 
            تم تعطيل الإدخال والإرسال تلقائياً، يرجى الانتظار لحين عودة الاتصال.
          </p>
        </div>
      </div>
    </div>
  );
}
