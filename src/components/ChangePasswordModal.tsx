import React, { useState } from 'react';
import { User } from '../types';
import { X, Lock, KeyRound } from 'lucide-react';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser: User;
  isAdminReset?: boolean;
  onUpdatePassword: (userId: string, newPassword: string, currentPassword?: string) => Promise<string | null>;
}

export default function ChangePasswordModal({ isOpen, onClose, targetUser, isAdminReset = false, onUpdatePassword }: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!isAdminReset && !currentPassword) {
      setError('أدخل كلمة المرور الحالية');
      return;
    }

    if (newPassword.length < 6) {
      setError('يجب أن لا تقل كلمة المرور الجديدة عن 6 خانات');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('كلمات المرور الجديدة غير متطابقة');
      return;
    }

    setBusy(true);
    const err = await onUpdatePassword(targetUser.id, newPassword, isAdminReset ? undefined : currentPassword);
    setBusy(false);
    if (err) {
      setError(/wrong current/i.test(err) ? 'كلمة المرور الحالية غير صحيحة' : 'تعذّر تغيير كلمة المرور: ' + err);
      return;
    }
    setSuccess(true);
    
    setTimeout(() => {
      onClose();
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccess(false);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col text-right" dir="rtl">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-teal-600" />
            <h3 className="font-bold text-slate-800">تغيير كلمة المرور {isAdminReset && `(${targetUser.name})`}</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && <div className="text-xs p-2 bg-rose-50 text-rose-600 border border-rose-100 rounded-lg">{error}</div>}
          {success && <div className="text-xs p-2 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg">تم تحديث كلمة المرور بنجاح!</div>}

          {!isAdminReset && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">كلمة المرور الحالية</label>
              <input
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-sm"
                required
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">كلمة المرور الجديدة</label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-sm"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">تأكيد كلمة المرور الجديدة</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-sm"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 mt-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold rounded-xl transition-all shadow-sm shadow-teal-600/10 flex items-center justify-center gap-2"
          >
            <Lock className="w-4 h-4" />
            تحديث البيانات
          </button>
        </form>
      </div>
    </div>
  );
}
