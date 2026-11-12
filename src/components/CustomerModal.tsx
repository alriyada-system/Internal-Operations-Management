/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Customer, CustomerType, CustomerStatus } from '../types';
import { X, User, Building, Phone, Award, ShieldAlert, BadgeCheck } from 'lucide-react';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (customer: Customer) => void;
  customerToEdit?: Customer | null;
  customers: Customer[];
  currentUsername: string;
  systemSettings?: any;
  isAdmin?: boolean;
  users?: any[];
}

export default function CustomerModal({ isOpen, onClose, onSave, customerToEdit, customers, currentUsername, systemSettings, isAdmin, users }: CustomerModalProps) {
  const [type, setType] = useState<CustomerType>('individual');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [civilId, setCivilId] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [status, setStatus] = useState<CustomerStatus>('active');
  const [error, setError] = useState('');
  const [registeredByState, setRegisteredByState] = useState('');

  useEffect(() => {
    if (customerToEdit) {
      setType(customerToEdit.type);
      setName(customerToEdit.name);
      setPhone(customerToEdit.phone);
      setCivilId(customerToEdit.civilId || '');
      setRegistrationNumber(customerToEdit.registrationNumber || '');
      setOwnerName(customerToEdit.ownerName || '');
      setStatus(customerToEdit.status);
      setRegisteredByState(customerToEdit.registeredBy || '');
    } else {
      setType('individual');
      setName('');
      setPhone('');
      setCivilId('');
      setRegistrationNumber('');
      setOwnerName('');
      setStatus('active');
      setRegisteredByState(currentUsername);
    }
    setError('');
  }, [customerToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('يرجى إدخال اسم العميل');
      return;
    }
    if (systemSettings?.requireCustomerPhone !== false && !phone.trim()) {
      setError('يرجى إدخال رقم التواصل');
      return;
    }
    if (systemSettings?.requireCustomerCivilId !== false) {
      if (type === 'individual' && !civilId.trim()) {
        setError('يرجى إدخال الرقم المدني للعميل الفرد');
        return;
      }
      if (type === 'entity') {
        if (!registrationNumber.trim()) {
          setError('يرجى إدخال رقم السجل التجاري للمنشأة');
          return;
        }
      }
    }
    if (type === 'entity') {
      if (!ownerName.trim()) {
        setError('يرجى إدخال اسم صاحب المنشأة');
        return;
      }
    }

    // Duplicate Validation
    const nameExists = customers.some(c => c.name === name.trim() && c.id !== customerToEdit?.id);
    if (nameExists) {
      setError('إسم العميل مسجل مسبقاً في النظام');
      return;
    }
    if (type === 'individual' && civilId.trim()) {
      const civilIdExists = customers.some(c => c.civilId === civilId.trim() && c.id !== customerToEdit?.id);
      if (civilIdExists) {
        setError('الرقم المدني مسجل مسبقاً لعميل آخر');
        return;
      }
    }
    if (type === 'entity' && registrationNumber.trim()) {
      const regExists = customers.some(c => c.registrationNumber === registrationNumber.trim() && c.id !== customerToEdit?.id);
      if (regExists) {
        setError('السجل التجاري مسجل مسبقاً لمنشأة أخرى');
        return;
      }
    }

    const customerData: Customer = {
      id: customerToEdit?.id || `cust-${Date.now()}`,
      type,
      name: name.trim(),
      phone: phone.trim(),
      civilId: type === 'individual' ? civilId.trim() : undefined,
      registrationNumber: type === 'entity' ? registrationNumber.trim() : undefined,
      ownerName: type === 'entity' ? ownerName.trim() : undefined,
      status,
      createdAt: customerToEdit?.createdAt || new Date().toISOString(),
      registeredBy: registeredByState || currentUsername,
      closedAt: status === 'closed' ? (customerToEdit?.closedAt || new Date().toISOString()) : undefined,
    };

    onSave(customerData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs" id="customer-modal-backdrop">
      <div 
        className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh] text-right"
        dir="rtl"
        id="customer-modal-content"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-50 text-teal-600 rounded-lg">
              {type === 'individual' ? <User className="w-5 h-5" /> : <Building className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                {customerToEdit ? 'تحديث بيانات العميل' : 'إضافة عميل جديد'}
              </h3>
              <p className="text-xs text-slate-500">أدخل معلومات العميل الفرد أو المنشأة التجارية بدقة</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            id="close-customer-modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="p-3 text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-lg font-sans">
              ⚠️ {error}
            </div>
          )}

          {/* Customer Type Choice */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 block">نوع العميل</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType('individual')}
                className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border-2 transition-all font-sans ${
                  type === 'individual'
                    ? 'border-teal-600 bg-teal-50/50 text-teal-700 font-semibold'
                    : 'border-slate-100 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <User className="w-4 h-4" />
                فرد (شخصي)
              </button>
              <button
                type="button"
                onClick={() => setType('entity')}
                className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border-2 transition-all font-sans ${
                  type === 'entity'
                    ? 'border-teal-600 bg-teal-50/50 text-teal-700 font-semibold'
                    : 'border-slate-100 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Building className="w-4 h-4" />
                منشأة (مؤسسة / شركة)
              </button>
            </div>
          </div>

          {/* Customer Name */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 block" htmlFor="cust-name-input">
              {type === 'individual' ? 'اسم العميل ثلاثي' : 'الاسم التجاري للمنشأة'}
            </label>
            <div className="relative">
              <input
                id="cust-name-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={type === 'individual' ? 'مثال: محمد بن راشد البوسعيدي' : 'مثال: شركة الريم للتجارة والمقاولات'}
                className="w-full pl-3 pr-10 py-2.5 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-800 text-sm"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Contact Number */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 block" htmlFor="cust-phone-input">
              رقم التواصل / الهاتف {systemSettings?.requireCustomerPhone !== false && <span className="text-rose-500">*</span>}
            </label>
            <div className="relative">
              <input
                id="cust-phone-input"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="مثال: 96891234567"
                className="w-full pl-3 pr-10 py-2.5 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-800 text-sm text-left font-mono"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                <Phone className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Conditional Input Fields */}
          {type === 'individual' ? (
            /* Civil ID for Individual */
            <div className="space-y-1.5 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <label className="text-sm font-semibold text-slate-700 block" htmlFor="cust-civil-input">
                الرقم المدني {systemSettings?.requireCustomerCivilId !== false && <span className="text-rose-500">*</span>}
              </label>
              <div className="relative">
                <input
                  id="cust-civil-input"
                  type="text"
                  value={civilId}
                  onChange={(e) => setCivilId(e.target.value)}
                  placeholder="أدخل الرقم المدني العماني (9 خانات)"
                  className="w-full pl-3 pr-10 py-2.5 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-800 text-sm font-mono"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                  <Award className="w-4 h-4" />
                </div>
              </div>
            </div>
          ) : (
            /* Registration Number & Owner Name for Entity */
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 block" htmlFor="cust-cr-input">
                  رقم السجل التجاري (CR Number) {systemSettings?.requireCustomerCivilId !== false && <span className="text-rose-500">*</span>}
                </label>
                <div className="relative">
                  <input
                    id="cust-cr-input"
                    type="text"
                    value={registrationNumber}
                    onChange={(e) => setRegistrationNumber(e.target.value)}
                    placeholder="أدخل رقم السجل التجاري العماني"
                    className="w-full pl-3 pr-10 py-2.5 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-800 text-sm font-mono"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                    <Award className="w-4 h-4" />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 block" htmlFor="cust-owner-input">
                  اسم صاحب المنشأة
                </label>
                <div className="relative">
                  <input
                    id="cust-owner-input"
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="أدخل الاسم الكامل لمالك المنشأة"
                    className="w-full pl-3 pr-10 py-2.5 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-800 text-sm"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Customer Status Selection */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 block">حالة العميل</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setStatus('active')}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-semibold transition-all ${
                  status === 'active'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                    : 'border-slate-100 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <BadgeCheck className="w-4 h-4 text-emerald-600" />
                نشطة
              </button>
              <button
                type="button"
                onClick={() => setStatus('late')}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-semibold transition-all ${
                  status === 'late'
                    ? 'border-amber-600 bg-amber-50 text-amber-800'
                    : 'border-slate-100 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                متأخر
              </button>
              <button
                type="button"
                onClick={() => setStatus('closed')}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-semibold transition-all ${
                  status === 'closed'
                    ? 'border-rose-600 bg-rose-50 text-rose-800'
                    : 'border-slate-100 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <X className="w-4 h-4 text-rose-600" />
                مغلقة
              </button>
            </div>
          </div>

          {isAdmin && (
            <div className="space-y-1.5 p-3 bg-slate-50 border border-slate-200 rounded-xl mt-4">
              <label className="text-sm font-semibold text-slate-700 block">تم تسجيله / تعديله بواسطة (خاص بالمدير)</label>
              <select
                value={registeredByState}
                onChange={(e) => setRegisteredByState(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-teal-500"
              >
                <option value="">-- اختر موظف --</option>
                <option value="المنصة الآلية">المنصة الآلية</option>
                {users?.map(u => (
                  <option key={u.id} value={u.name}>{u.name} ({u.username})</option>
                ))}
              </select>
            </div>
          )}

        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-5 border-t border-slate-100 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-5 py-2 text-sm font-semibold text-white bg-teal-600 rounded-xl hover:bg-teal-700 transition-colors shadow-sm shadow-teal-600/10"
          >
            {customerToEdit ? 'حفظ التعديلات' : 'إضافة العميل'}
          </button>
        </div>
      </div>
    </div>
  );
}
