import React, { useState } from 'react';
import { User } from '../types';
import { Briefcase, Plus, Trash2, Edit2, Save, X, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

interface CustodyCategory {
  id: string;
  name: string;
  subTypes: string[];
}

interface CustodyManagerProps {
  users: User[];
  onUpdateConfig: (updatedCategories: CustodyCategory[]) => void;
  currentUser: User | null;
}

export default function CustodyManager({ users, onUpdateConfig, currentUser }: CustodyManagerProps) {
  const configUser = users.find(u => u.id === 'custodies_config');
  
  const defaultCategories: CustodyCategory[] = [
    {
      id: 'cc-1',
      name: 'العهد التقنية والإلكترونية',
      subTypes: [
        'أجهزة الحاسوب وملحقاتها: أجهزة حاسوب محمول أو مكتبي، شاشات إضافية، لوحة مفاتيح، فأرة',
        'أجهزة الاتصال: هواتف ذكية، شرائح اتصال (SIM)، أجهزة اتصال لاسلكي',
        'الأجهزة الميدانية والمساندة: أجهزة لوحية (Tablets)، قارئات باركود، طابعات محمولة',
        'مفاتيح الأمان الرقمية: مفاتيح مشفرة (USB Security Keys) للوصول للأنظمة'
      ]
    },
    {
      id: 'cc-2',
      name: 'عهد النقل والمواصلات',
      subTypes: [
        'سيارات العمل: سيارات ميدانية للمبيعات والصيانة، أو سيارات إدارية',
        'بطاقات التنقل والوقود: بطاقات تعبئة الوقود، بطاقات دفع رسوم الطرق والمواقف'
      ]
    },
    {
      id: 'cc-3',
      name: 'العهد المالية',
      subTypes: [
        'السلفة النثرية (Petty Cash): مبالغ مالية لتغطية المصاريف التشغيلية اليومية والطارئة',
        'بطاقات المشتريات: بطاقات ائتمانية مؤسسية مخصصة لمشتريات الشركة'
      ]
    },
    {
      id: 'cc-4',
      name: 'عهد الأمان وحق الدخول',
      subTypes: [
        'بطاقات الهوية والدخول: بطاقات الدخول الذكية وشارات التعريف (ID Badges)',
        'المفاتيح الفيزيائية: مفاتيح المكاتب، الخزائن، والمستودعات'
      ]
    },
    {
      id: 'cc-5',
      name: 'عهد السلامة والزي الموحد',
      subTypes: [
        'الزي الموحد (Uniform): ملابس العمل الرسمية الخاصة بالشركة',
        'معدات الحماية الشخصية (PPE): خوذة الأمان، أحذية السلامة (Safety Shoes)، النظارات الواقية'
      ]
    },
    {
      id: 'cc-6',
      name: 'العهد والتجهيزات التخصصية',
      subTypes: [
        'معدات إعلامية وتسويقية: كاميرات احترافية، إضاءات، ومعدات تصوير',
        'أجهزة فحص وهندسة: أجهزة القياس والفحص الميداني للمهندسين والفنيين',
        'تجهيزات العمل من المنزل: أثاث مكتبي وأجهزة إضافية للعمل عن بُعد',
        'أخرى'
      ]
    }
  ];

  const categories: CustodyCategory[] = configUser?.custodyCategories || defaultCategories;
  
  const [cats, setCats] = useState<CustodyCategory[]>(categories);
  
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  
  const [newCatName, setNewCatName] = useState('');
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

  const saveConfig = (newCats: CustodyCategory[]) => {
    setCats(newCats);
    onUpdateConfig(newCats);
  };

  const handleAddCategory = () => {
    if(!newCatName.trim()) return;
    const nameVal = newCatName.trim();
    askConfirmation({
      title: 'تأكيد إضافة تصنيف عهدة جديد',
      message: `هل أنت متأكد من رغبتك في إضافة تصنيف العهدة "${nameVal}"؟`,
      confirmLabel: 'تأكيد الإضافة',
      cancelLabel: 'إلغاء التراجع',
      onConfirm: () => {
        const newCat: CustodyCategory = {
          id: `cc-${Date.now()}`,
          name: nameVal,
          subTypes: []
        };
        saveConfig([...cats, newCat]);
        setNewCatName('');
        toast.success(`تمت إضافة تصنيف العهدة "${nameVal}" بنجاح`);
      }
    });
  };

  const handleDeleteCategory = (id: string) => {
    const targetCat = cats.find(c => c.id !== id ? false : true) && cats.find(c => c.id === id);
    askConfirmation({
      title: 'تأكيد حذف تصنيف العهدة',
      message: `هل أنت متأكد من حذف تصنيف العهدة "${targetCat?.name || ''}" وكافة بنوده الفرعية؟`,
      confirmLabel: 'نعم، حذف التصنيف',
      cancelLabel: 'إلغاء التراجع',
      isDestructive: true,
      onConfirm: () => {
        saveConfig(cats.filter(c => c.id !== id));
        toast.success('تم حذف تصنيف العهدة بنجاح');
      }
    });
  };

  const handleStartEdit = (cat: CustodyCategory) => {
    setIsEditing(cat.id);
    setEditName(cat.name);
  };

  const handleSaveEdit = (id: string) => {
    if(!editName.trim()) return;
    const targetCat = cats.find(c => c.id === id);
    const updatedName = editName.trim();
    askConfirmation({
      title: 'تأكيد تعديل تصنيف العهدة',
      message: `هل أنت متأكد من حفظ التعديلات على "${targetCat?.name}"؟`,
      confirmLabel: 'حفظ التعديلات',
      cancelLabel: 'إلغاء التراجع',
      onConfirm: () => {
        saveConfig(cats.map(c => c.id === id ? { ...c, name: updatedName } : c));
        setIsEditing(null);
        toast.success('تم حفظ التعديلات بنجاح');
      }
    });
  };

  const handleAddSubOption = (catId: string) => {
    const val = newSubOptionNames[catId]?.trim();
    if(!val) return;
    const targetCat = cats.find(c => c.id === catId);
    askConfirmation({
      title: 'تأكيد إضافة بند عهدة فرعي',
      message: `هل ترغب في إضافة البند الفرعي "${val}" إلى تصنيف "${targetCat?.name}"؟`,
      confirmLabel: 'تأكيد وإضافة',
      cancelLabel: 'إلغاء التراجع',
      onConfirm: () => {
        saveConfig(cats.map(c => {
          if(c.id === catId) {
            return {
              ...c,
              subTypes: [...c.subTypes, val]
            };
          }
          return c;
        }));
        setNewSubOptionNames({...newSubOptionNames, [catId]: ''});
        toast.success(`تمت إضافة بند العهدة الفرعي بنجاح`);
      }
    });
  };

  const handleDeleteSubOption = (catId: string, subName: string) => {
    askConfirmation({
      title: 'تأكيد حذف بند العهدة الفرعي',
      message: `هل أنت متأكد من رغبتك في حذف البند الفرعي "${subName}"؟`,
      confirmLabel: 'نعم، حذف البند',
      cancelLabel: 'إلغاء التراجع',
      isDestructive: true,
      onConfirm: () => {
        saveConfig(cats.map(c => {
          if(c.id === catId) {
            return { ...c, subTypes: c.subTypes.filter(s => s !== subName) };
          }
          return c;
        }));
        toast.success('تم حذف بند العهدة الفرعي بنجاح');
      }
    });
  };

  if(!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'hr')) return null;

  return (
    <div id="settings-custody-section" className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-6">
      <div className="bg-teal-50 border-b border-teal-100 p-4 flex items-center gap-2">
        <Briefcase className="w-5 h-5 text-teal-600" />
        <h3 className="font-bold text-teal-800">إعدادات العهد وأنواعها</h3>
      </div>
      
      <div className="p-4 space-y-6">
        {/* Add new category */}
        <div className="flex flex-col sm:flex-row gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
          <input 
            type="text" 
            placeholder="اسم فئة العهدة (مثال: العهد التقنية)" 
            className="flex-1 px-3 py-2 border rounded-lg text-sm"
            value={newCatName}
            onChange={e => setNewCatName(e.target.value)}
          />
          <button onClick={handleAddCategory} className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
            <Plus className="w-4 h-4" /> إضافة فئة
          </button>
        </div>

        {/* List of categories */}
        <div className="space-y-4 max-h-[400px] overflow-y-auto px-3 py-2 custom-scrollbar">
          {cats.map(cat => (
            <div key={cat.id} className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-50 p-3 flex justify-between items-center border-b border-slate-200">
                {isEditing === cat.id ? (
                  <div className="flex gap-2 items-center flex-1 ml-4">
                    <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="px-2 py-1 border rounded text-sm flex-1" />
                    <button onClick={() => handleSaveEdit(cat.id)} className="text-emerald-600 p-1 hover:bg-emerald-50 rounded"><Save className="w-4 h-4" /></button>
                    <button onClick={() => setIsEditing(null)} className="text-slate-400 p-1 hover:bg-slate-200 rounded"><X className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <div className="flex gap-4 items-center">
                    <span className="font-bold text-sm text-slate-800">{cat.name}</span>
                  </div>
                )}
                
                {isEditing !== cat.id && (
                  <div className="flex gap-2">
                    <button onClick={() => handleStartEdit(cat)} className="text-slate-400 hover:text-blue-600 p-1"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => handleDeleteCategory(cat.id)} className="text-slate-400 hover:text-rose-600 p-1"><Trash2 className="w-4 h-4" /></button>
                  </div>
                )}
              </div>
              <div className="p-3 bg-white space-y-2">
                {cat.subTypes.map((sub, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                    <span className="text-sm text-slate-600">{sub}</span>
                    <button onClick={() => handleDeleteSubOption(cat.id, sub)} className="text-rose-400 hover:text-rose-600"><X className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
                <div className="flex gap-2 mt-2">
                  <input 
                    type="text" 
                    placeholder="إضافة نوع عهدة فرعية (مثال: أجهزة حاسوب: لابتوب، شاشة...)" 
                    className="flex-1 px-3 py-1.5 border rounded-lg text-xs"
                    value={newSubOptionNames[cat.id] || ''}
                    onChange={e => setNewSubOptionNames({...newSubOptionNames, [cat.id]: e.target.value})}
                    onKeyDown={e => e.key === 'Enter' && handleAddSubOption(cat.id)}
                  />
                  <button onClick={() => handleAddSubOption(cat.id)} className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-200">
                    إضافة بند فرعي
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
