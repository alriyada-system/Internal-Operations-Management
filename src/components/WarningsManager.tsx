import React, { useState } from 'react';
import { User, WarningType, WarningDegree } from '../types';
import { ShieldAlert, Plus, Trash2, Edit2, Save, X, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

interface WarningsManagerProps {
  users: User[];
  onUpdateConfig: (updatedTypes: WarningType[]) => void;
  currentUser: User | null;
}

export default function WarningsManager({ users, onUpdateConfig, currentUser }: WarningsManagerProps) {
  const configUser = users.find(u => u.id === 'warnings_config');
  const warningTypes: WarningType[] = configUser?.warningTypes || [
    { id: 'wt-1', name: 'مخالفات الحضور والانضباط الزمني', degree: 'low', subOptions: [
      { id: 'wto-1', name: 'تأخير عن الدوام' },
      { id: 'wto-2', name: 'انصراف مبكر' }
    ]}
  ];

  const [types, setTypes] = useState<WarningType[]>(warningTypes);
  
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDegree, setEditDegree] = useState<WarningDegree>('low');
  
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeDegree, setNewTypeDegree] = useState<WarningDegree>('low');

  const [newSubOptionNames, setNewSubOptionNames] = useState<Record<string, string>>({});

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

  const saveConfig = (newTypes: WarningType[]) => {
    setTypes(newTypes);
    onUpdateConfig(newTypes);
  };

  const handleAddType = () => {
    if(!newTypeName.trim()) return;
    const nameVal = newTypeName.trim();
    const degreeLabel = newTypeDegree === 'high' ? 'عالية' : newTypeDegree === 'medium' ? 'متوسطة' : 'منخفضة';
    askConfirmation({
      title: 'تأكيد إضافة نوع إنذار جديد',
      message: `هل أنت متأكد من إضافة نوع الإنذار "${nameVal}" بدرجة خطورة (${degreeLabel})؟`,
      confirmLabel: 'تأكيد الإضافة',
      cancelLabel: 'إلغاء التراجع',
      onConfirm: () => {
        const newType: WarningType = {
          id: `wt-${Date.now()}`,
          name: nameVal,
          degree: newTypeDegree,
          subOptions: []
        };
        saveConfig([...types, newType]);
        setNewTypeName('');
        toast.success(`تمت إضافة نوع الإنذار "${nameVal}" بنجاح`);
      }
    });
  };

  const handleDeleteType = (id: string) => {
    const targetType = types.find(t => t.id === id);
    askConfirmation({
      title: 'تأكيد حذف نوع الإنذار',
      message: `هل أنت متأكد من حذف نوع الإنذار "${targetType?.name || ''}" وجميع خياراته الفرعية؟`,
      confirmLabel: 'نعم، حذف النوع',
      cancelLabel: 'إلغاء التراجع',
      isDestructive: true,
      onConfirm: () => {
        saveConfig(types.filter(t => t.id !== id));
        toast.success(`تم حذف نوع الإنذار بنجاح`);
      }
    });
  };

  const handleStartEdit = (type: WarningType) => {
    setIsEditing(type.id);
    setEditName(type.name);
    setEditDegree(type.degree);
  };

  const handleSaveEdit = (id: string) => {
    if(!editName.trim()) return;
    const targetType = types.find(t => t.id === id);
    const updatedName = editName.trim();
    askConfirmation({
      title: 'تأكيد تعديل نوع الإنذار',
      message: `هل أنت متأكد من حفظ التعديلات على نوع الإنذار "${targetType?.name}"؟`,
      confirmLabel: 'حفظ التعديلات',
      cancelLabel: 'إلغاء التراجع',
      onConfirm: () => {
        saveConfig(types.map(t => t.id === id ? { ...t, name: updatedName, degree: editDegree } : t));
        setIsEditing(null);
        toast.success('تم حفظ التعديلات بنجاح');
      }
    });
  };

  const handleAddSubOption = (typeId: string) => {
    const val = newSubOptionNames[typeId]?.trim();
    if(!val) return;
    const targetType = types.find(t => t.id === typeId);
    askConfirmation({
      title: 'تأكيد إضافة خيار فرعي',
      message: `هل ترغب في إضافة الخيار الفرعي "${val}" إلى "${targetType?.name}"؟`,
      confirmLabel: 'تأكيد وإضافة',
      cancelLabel: 'إلغاء التراجع',
      onConfirm: () => {
        saveConfig(types.map(t => {
          if(t.id === typeId) {
            return {
              ...t,
              subOptions: [...t.subOptions, { id: `wto-${Date.now()}`, name: val }]
            };
          }
          return t;
        }));
        setNewSubOptionNames({...newSubOptionNames, [typeId]: ''});
        toast.success(`تمت إضافة الخيار الفرعي "${val}" بنجاح`);
      }
    });
  };

  const handleDeleteSubOption = (typeId: string, subId: string) => {
    const targetType = types.find(t => t.id === typeId);
    const targetSub = targetType?.subOptions.find(o => o.id === subId);
    askConfirmation({
      title: 'تأكيد حذف الخيار الفرعي',
      message: `هل أنت متأكد من رغبتك في حذف الخيار الفرعي "${targetSub?.name || ''}"؟`,
      confirmLabel: 'نعم، حذف الخيار',
      cancelLabel: 'إلغاء التراجع',
      isDestructive: true,
      onConfirm: () => {
        saveConfig(types.map(t => {
          if(t.id === typeId) {
            return { ...t, subOptions: t.subOptions.filter(o => o.id !== subId) };
          }
          return t;
        }));
        toast.success('تم حذف الخيار الفرعي بنجاح');
      }
    });
  };

  if(!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'hr')) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-6">
      <div className="bg-rose-50 border-b border-rose-100 p-4 flex items-center gap-2">
        <ShieldAlert className="w-5 h-5 text-rose-600" />
        <h3 className="font-bold text-rose-800">إدارة أنواع الإنذارات والمخالفات</h3>
      </div>
      
      <div className="p-4 space-y-6">
        {/* Add new type */}
        <div className="flex flex-col sm:flex-row gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
          <input 
            type="text" 
            placeholder="اسم نوع الإنذار (مثال: مخالفات سلوكية)" 
            className="flex-1 px-3 py-2 border rounded-lg text-sm"
            value={newTypeName}
            onChange={e => setNewTypeName(e.target.value)}
          />
          <select 
            value={newTypeDegree} 
            onChange={e => setNewTypeDegree(e.target.value as WarningDegree)}
            className="px-3 py-2 border rounded-lg text-sm bg-white"
          >
            <option value="low">منخفضة</option>
            <option value="medium">متوسطة</option>
            <option value="high">عالية</option>
          </select>
          <button onClick={handleAddType} className="bg-rose-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
            <Plus className="w-4 h-4" /> إضافة
          </button>
        </div>

        {/* List of types */}
        <div className="space-y-4 max-h-[400px] overflow-y-auto pl-1 pr-1 custom-scrollbar">
          {types.map(type => (
            <div key={type.id} className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-50 p-3 flex justify-between items-center border-b border-slate-200">
                {isEditing === type.id ? (
                  <div className="flex gap-2 items-center flex-1 ml-4">
                    <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="px-2 py-1 border rounded text-sm flex-1" />
                    <select value={editDegree} onChange={e => setEditDegree(e.target.value as WarningDegree)} className="px-2 py-1 border rounded text-sm bg-white">
                      <option value="low">منخفضة</option>
                      <option value="medium">متوسطة</option>
                      <option value="high">عالية</option>
                    </select>
                    <button onClick={() => handleSaveEdit(type.id)} className="text-emerald-600 p-1 hover:bg-emerald-50 rounded"><Save className="w-4 h-4" /></button>
                    <button onClick={() => setIsEditing(null)} className="text-slate-400 p-1 hover:bg-slate-200 rounded"><X className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <div className="flex gap-4 items-center">
                    <span className="font-bold text-sm text-slate-800">{type.name}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      type.degree === 'high' ? 'bg-rose-100 text-rose-700' :
                      type.degree === 'medium' ? 'bg-amber-100 text-amber-700' :
                      'bg-emerald-100 text-emerald-700'
                    }`}>
                      {type.degree === 'high' ? 'عالية' : type.degree === 'medium' ? 'متوسطة' : 'منخفضة'}
                    </span>
                  </div>
                )}
                
                {isEditing !== type.id && (
                  <div className="flex gap-2">
                    <button onClick={() => handleStartEdit(type)} className="text-slate-400 hover:text-blue-600 p-1"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => handleDeleteType(type.id)} className="text-slate-400 hover:text-rose-600 p-1"><Trash2 className="w-4 h-4" /></button>
                  </div>
                )}
              </div>
              <div className="p-3 bg-white space-y-2">
                {type.subOptions.map(opt => (
                  <div key={opt.id} className="flex justify-between items-center bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                    <span className="text-sm text-slate-600">{opt.name}</span>
                    <button onClick={() => handleDeleteSubOption(type.id, opt.id)} className="text-rose-400 hover:text-rose-600"><X className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
                <div className="flex gap-2 mt-2">
                  <input 
                    type="text" 
                    placeholder="إضافة خيار فرعي جديد..." 
                    className="flex-1 px-3 py-1.5 border rounded-lg text-xs"
                    value={newSubOptionNames[type.id] || ''}
                    onChange={e => setNewSubOptionNames({...newSubOptionNames, [type.id]: e.target.value})}
                    onKeyDown={e => e.key === 'Enter' && handleAddSubOption(type.id)}
                  />
                  <button onClick={() => handleAddSubOption(type.id)} className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-200">
                    إضافة
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Confirmation Modal */}
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
                  <ShieldAlert className="w-6 h-6" />
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
