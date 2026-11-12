/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import Logo from './Logo';
import { Mail, Phone, Calendar, BadgeAlert, Layers, ShieldCheck } from 'lucide-react';

interface AboutSectionProps {
  systemSettings?: any;
}

export default function AboutSection({ systemSettings }: AboutSectionProps) {
  const companyName = systemSettings?.companyName || 'مركز سند الريادة للخدمات';
  const companySubtitle = systemSettings?.companySubtitle || 'المنصة الرقمية الموحدة لإدارة العمليات والموارد';
  const companyLogo = systemSettings?.companyLogo;

  return (
    <div className="max-w-xl mx-auto text-right font-sans" dir="rtl" id="about-section">
      <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-xs flex flex-col items-center space-y-6">
        
        {/* Core Logo and Brand Title */}
        <Logo 
          size="lg" 
          customLogoUrl={companyLogo} 
          customCompanyName={companyName}
          customSubtitle={companySubtitle}
        />

        <div className="text-center space-y-1">
          <h3 className="text-lg font-black text-slate-800">نظام إدارة الفواتير والمحاسبة الذكي</h3>
          <p className="text-xs text-slate-400">الإصدار الخاص بـ {companySubtitle} - {companyName}</p>
        </div>

        <hr className="w-full border-slate-100" />

        {/* System info details */}
        <div className="w-full space-y-4 text-xs text-slate-600">
          
          {/* Release Date */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-100 rounded-2xl">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-teal-50 text-teal-600 rounded-xl">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-slate-800 block">نسخة البرنامج الصادرة</span>
                <span className="text-[10px] text-slate-400">تاريخ إصدار وبناء النظام</span>
              </div>
            </div>
            <span className="font-mono font-bold text-slate-700 bg-white border border-slate-200/50 py-1 px-3 rounded-lg shadow-2xs">
              27 / 06 / 2026
            </span>
          </div>

          {/* Designer */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-100 rounded-2xl">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-slate-800 block">مصمم ومطور النظام</span>
                <span className="text-[10px] text-slate-400 font-sans">البريد الإلكتروني المعتمد للدعم</span>
              </div>
            </div>
            <a 
              href="mailto:alriyada.oman@gmail.com"
              className="font-mono font-semibold text-blue-600 hover:underline bg-white border border-slate-200/50 py-1 px-3 rounded-lg shadow-2xs"
            >
              alriyada.oman@gmail.com
            </a>
          </div>

          {/* Support HotLine */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-100 rounded-2xl">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-slate-800 block">الخط الساخن للدعم الفني</span>
                <span className="text-[10px] text-slate-400">التواصل السريع للاستشارات البرمجية</span>
              </div>
            </div>
            <a 
              href="tel:98299425"
              className="font-mono font-black text-emerald-600 hover:scale-105 transition-transform bg-white border border-slate-200/50 py-1 px-3 rounded-lg shadow-2xs flex items-center gap-1"
            >
              98299425
            </a>
          </div>

          {/* Security stamp */}
          <div className="flex items-center gap-3 p-4 bg-teal-500/5 border border-teal-500/10 rounded-2xl text-slate-500 leading-relaxed text-[11px] font-sans">
            <ShieldCheck className="w-5 h-5 text-teal-600 shrink-0" />
            <span>
              نظام معتمد مشفر للتخزين المحلي وحماية حسابات المعاملات. تم تهيئة وضبط النظام لتلبية معايير مكاتب سند لتخليص المعاملات والتوثيق بسلطنة عُمان.
            </span>
          </div>

          {/* System Description Text */}
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-600 leading-relaxed text-[11px] text-justify font-sans">
            تُعدّ المنصة الرقمية الموحدة لإدارة العمليات والموارد البشرية (نظام الداخلي المتكامل ) حلاً تقنياً متطوراً ونظاماً مالياً ومحاسبياً وإدارياً شاملاً للمشاريع الخدمية ، صُمم خصيصاً لتنظيم سير العمل وتسهيل العمليات التشغيلية الداخلية اليومية للمؤسسات، الشركات، مراكز خدمة العملاء، ومكاتب سند وتعقيب المعاملات. , توفر المنصة بيئة عمل مركزية متطورة تدمج بدقة وسرعة بين إدارة العمليات والفواتير والموظفين والعملاء بكفاءة عالية , بدءاً من حفظ بياناتهم وتتبع تعاملاتهم بكل سهولة، وصولاً إلى الإدارة المالية المرنة التي تشمل إصدار الفواتير الضريبية المبسطة بمرونة عالية وتتبع الدفعات وتطبيق الخصومات وتصديرها— وبين إدارة الموارد البشرية وتتخلص في تنظيم شؤون الموظفين وإدارة الفروع المتعددة للمؤسسة، وتخصيص أدوار وصلاحيات المستخدمين بدقة ومرونة عالية. كما تتميز المنصة بتوفير نظام متكامل للتذاكر والدعم الإداري الداخلي لمعالجة طلبات الموظفين اليومية بيسر وسهولة، مثل طلبات الإجازات، الدعم الفني، الشكاوى، والاحتياجات الإدارية واللوجستية والنثريات. ولضمان أعلى مستويات الأمان والموثوقية واستمرارية الأعمال، تشتمل المنصة على مركز متطور لحفظ البيانات واستعادتها وتصديرها بصيغ متعددة مثل ملفات إكسل ، مع دعم ميزة النسخ الاحتياطي التلقائي والآمن عبر السحاب، يرافقها نظام شامل للتقارير المالية والرسوم البيانية التفاعلية وسجل دقيق وكامل لكافة الأنشطة، مما يضمن كفاءة تشغيلية متناهية، وشفافية كاملة، وموثوقية عالية في أداء الأعمال والمهام اليومية.
          </div>
        </div>

        <div className="text-[9px] text-slate-400 pt-2 text-center w-full">
          جميع الحقوق محفوظة لصالح المنصة الرقمية الموحدة لإدارة العمليات والموارد - مركز سند الريادة للخدمات © 2026
        </div>
      </div>
    </div>
  );
}
