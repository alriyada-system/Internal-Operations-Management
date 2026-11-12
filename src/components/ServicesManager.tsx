import React, { useState } from 'react';
import { Service } from '../types';
import { Briefcase, Plus, Trash2, Edit2, Check, X, Search, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

interface ServicesManagerProps {
  services: Service[];
  setServices: React.Dispatch<React.SetStateAction<Service[]>>;
  canEditServices?: boolean;
  canDeleteServices?: boolean;
}

export default function ServicesManager({ 
  services, 
  setServices, 
  canEditServices = true,
  canDeleteServices = true 
}: ServicesManagerProps) {
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  } | null>(null);

  const askConfirmation = (opts: {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  }) => {
    setConfirmDialog({ ...opts, isOpen: true });
  };

  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newServiceName.trim()) {
      setError('يرجى إدخال اسم الخدمة');
      return;
    }

    const price = parseFloat(newServicePrice);
    if (isNaN(price) || price < 0) {
      setError('يرجى إدخال سعر صحيح للخدمة');
      return;
    }

    const sName = newServiceName.trim();
    askConfirmation({
      title: 'تأكيد إضافة خدمة جديدة',
      message: `هل ترغب في إضافة الخدمة "${sName}" بسعر افتراضي (${price.toFixed(3)} ر.ع)؟`,
      confirmLabel: 'تأكيد الإضافة',
      cancelLabel: 'إلغاء التراجع',
      onConfirm: () => {
        const newService: Service = {
          id: `srv-${Date.now()}`,
          name: sName,
          defaultPrice: price,
        };

        setServices(prev => [newService, ...prev]);
        setNewServiceName('');
        setNewServicePrice('');
        toast.success(`تمت إضافة الخدمة "${sName}" بنجاح`);
      }
    });
  };

  const handleDeleteService = (id: string) => {
    const s = services.find(item => item.id === id);
    askConfirmation({
      title: 'تأكيد حذف الخدمة نهائياً',
      message: `هل أنت متأكد من رغبتك في حذف خدمة "${s?.name || ''}" نهائياً من سجل الخدمات؟`,
      confirmLabel: 'نعم، حذف الخدمة',
      cancelLabel: 'إلغاء التراجع',
      isDestructive: true,
      onConfirm: () => {
        setServices(prev => prev.filter(item => item.id !== id));
        toast.success('تم حذف الخدمة بنجاح');
      }
    });
  };

  const startEditing = (service: Service) => {
    setEditingId(service.id);
    setEditName(service.name);
    setEditPrice(service.defaultPrice.toString());
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditName('');
    setEditPrice('');
  };

  const saveEdit = (id: string) => {
    setError('');
    
    if (!editName.trim()) {
      setError('يرجى إدخال اسم الخدمة');
      return;
    }

    const price = parseFloat(editPrice);
    if (isNaN(price) || price < 0) {
      setError('يرجى إدخال سعر صحيح للخدمة');
      return;
    }

    const updatedName = editName.trim();
    askConfirmation({
      title: 'تأكيد تعديل بيانات الخدمة',
      message: `هل أنت متأكد من حفظ التعديلات على خدمة "${updatedName}" بسعر (${price.toFixed(3)} ر.ع)؟`,
      confirmLabel: 'حفظ التعديلات',
      cancelLabel: 'إلغاء التراجع',
      onConfirm: () => {
        setServices(prev => prev.map(s => s.id === id ? { ...s, name: updatedName, defaultPrice: price } : s));
        setEditingId(null);
        toast.success('تم حفظ تعديلات الخدمة بنجاح');
      }
    });
  };

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs space-y-5">
      <div className="flex items-center gap-2">
        <Briefcase className="w-5 h-5 text-teal-600" />
        <h3 className="text-sm font-bold text-slate-800">سجل الخدمات والأسعار</h3>
      </div>
      
      {error && (
        <div className="p-2.5 text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-lg">
          ⚠️ {error}
        </div>
      )}

      {/* Add New Service Form */}
      {canEditServices && (
        <form onSubmit={handleAddService} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end p-4 bg-slate-50 border border-slate-100 rounded-xl">
          <div className="md:col-span-2 space-y-1">
            <label className="text-[10px] font-bold text-slate-500 block">اسم الخدمة أو البند</label>
            <input
              type="text"
              value={newServiceName}
              onChange={e => setNewServiceName(e.target.value)}
              placeholder="مثال: طباعة عقد إيجار"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/10 focus:border-teal-500 text-slate-800 text-xs bg-white"
            />
          </div>
          <div className="md:col-span-1 space-y-1">
            <label className="text-[10px] font-bold text-slate-500 block">السعر الافتراضي (ر.ع)</label>
            <input
              type="number"
              step="0.05"
              min="0"
              value={newServicePrice}
              onChange={e => setNewServicePrice(e.target.value)}
              placeholder="0.000"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/10 focus:border-teal-500 text-slate-800 text-xs bg-white"
            />
          </div>
          <div className="md:col-span-1">
            <button
              type="submit"
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              إضافة للسجل
            </button>
          </div>
        </form>
      )}

      {/* Services Search */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="ابحث باسم الخدمة..."
          className="w-full pl-3 pr-10 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-teal-500/10 focus:border-teal-500 text-slate-800 text-xs bg-slate-50"
        />
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </div>
      </div>

      {/* Services List */}
      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
        {services.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
          <div className="text-center p-4 text-xs text-slate-400 italic">لا توجد خدمات مسجلة بعد</div>
        ) : (
          services.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase())).map(s => (
            <div key={s.id} className="flex justify-between items-center p-3 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors">
              {editingId === s.id ? (
                <div className="flex-1 flex gap-2 items-center">
                  <input 
                    type="text" 
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 px-2 py-1 text-xs border border-slate-200 rounded-lg"
                  />
                  <input 
                    type="number" 
                    step="0.05"
                    min="0"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="w-24 px-2 py-1 text-xs border border-slate-200 rounded-lg text-center"
                  />
                  <button onClick={() => saveEdit(s.id)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg"><Check className="w-4 h-4" /></button>
                  <button onClick={cancelEditing} className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4" /></button>
                </div>
              ) : (
                <>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-800">{s.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono">السعر: {s.defaultPrice.toFixed(3)} ر.ع</span>
                  </div>
                  {(canEditServices || canDeleteServices) && (
                    <div className="flex items-center gap-1">
                      {canEditServices && (
                        <button 
                          onClick={() => startEditing(s)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="تعديل الخدمة"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                      {canDeleteServices && (
                        <button 
                          onClick={() => handleDeleteService(s.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="حذف الخدمة"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          ))
        )}
      </div>
      
      {/* Universal Confirmation Modal */}
      {confirmDialog && confirmDialog.isOpen && (
        <div 
          role="dialog" 
          aria-modal="true" 
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setConfirmDialog(null)}
        >
          <div 
            className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 p-6 space-y-4 text-right animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className={`p-2.5 rounded-xl shrink-0 ${
                confirmDialog.isDestructive 
                  ? 'bg-rose-50 text-rose-600 border border-rose-100' 
                  : 'bg-teal-50 text-teal-600 border border-teal-100'
              }`}>
                {confirmDialog.isDestructive ? (
                  <AlertTriangle className="w-6 h-6" />
                ) : (
                  <Briefcase className="w-6 h-6" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-800 leading-snug">
                  {confirmDialog.title}
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {confirmDialog.message}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  const onConfirmAction = confirmDialog.onConfirm;
                  setConfirmDialog(null);
                  onConfirmAction();
                }}
                className={`flex-1 font-bold text-xs py-2.5 px-4 rounded-xl transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5 ${
                  confirmDialog.isDestructive
                    ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200'
                    : 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-200'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{confirmDialog.confirmLabel || 'تأكيد الإجراء'}</span>
              </button>

              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2.5 px-4 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <XCircle className="w-4 h-4 text-slate-400" />
                <span>{confirmDialog.cancelLabel || 'تراجع وإلغاء'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
