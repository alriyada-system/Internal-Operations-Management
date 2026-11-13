import toast from 'react-hot-toast';
import React, { useState, useEffect } from 'react';
import Logo from './Logo';
import { 
  Printer, BookOpen, LayoutDashboard, FileText, Users, Lock, Database, MessageSquare, HelpCircle,
  Keyboard, MousePointer2, MousePointerClick, Sparkles, ArrowRight, ArrowLeft, CheckCircle2, ShieldCheck, Phone, Mail,
  Calendar, Layers, ChevronLeft, BookOpenText, BadgeAlert, Ticket, Image as ImageIcon, Info, AlertTriangle,
  Settings, BarChart, Trash2, History, Activity, CreditCard, TrendingDown, Wallet, Calculator, MapPin, Download, Upload, RefreshCcw, Briefcase
} from 'lucide-react';
import { 
  DashboardMockup, StatsMockup, InvoiceFormMockup, HoverTableMockup, PDFLandscapeMockup, 
  TicketsTableMockup, TooltipMockup, ClosingReportMockup, TicketChatMockup, ChatMailMockup, ProfileSectionMockup,
  DailyFinancialInputsMockup, DayOperationsModalMockup, MonthlyChartsMockup,
  ReportFiltersMockup, InteractiveCardsMockup
} from './GuideMockups';

interface GuideChapter {
  id: string;
  title: string;
  icon: React.ReactNode;
  subtitle: string;
}

export default function UserGuideSection({ systemSettings }: { systemSettings?: any } = {}) {
  const [activeChapter, setActiveChapter] = useState<string>('intro');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [mobileShowContent, setMobileShowContent] = useState(false);

  const chapters: GuideChapter[] = [
    { id: 'intro', title: 'المقدمة والترحيب', icon: <BookOpenText className="w-4 h-4" />, subtitle: 'نظام مركز سند الريادة المتكامل' },
    { id: 'dashboard', title: 'لوحة القيادة والمؤشرات', icon: <LayoutDashboard className="w-4 h-4" />, subtitle: 'متابعة الأداء اليومي والإحصائيات' },
    { id: 'invoices', title: 'نظام الفواتير المبسطة', icon: <FileText className="w-4 h-4" />, subtitle: 'إنشاء الفواتير وإدارة المديونيات' },
    { id: 'closing', title: 'الإغلاق المالي والتقارير', icon: <Lock className="w-4 h-4" />, subtitle: 'مطابقة الصندوق والتقرير الشهري' },
    { id: 'reports', title: 'التقارير والتحليلات', icon: <BarChart className="w-4 h-4" />, subtitle: 'تحليل الأداء المالي والتشغيلي' },
    { id: 'tickets', title: 'الدعم الإداري والتذاكر', icon: <Ticket className="w-4 h-4" />, subtitle: 'طلبات الإجازات والشؤون الإدارية' },
    { id: 'chat_mail', title: 'قسم البريد والدردشة الخاصة', icon: <MessageSquare className="w-4 h-4" />, subtitle: 'التواصل الداخلي والمراسلات بين الموظفين' },
    { id: 'profile', title: 'قسم الملف الشخصي بكافة أجزائه', icon: <Users className="w-4 h-4" />, subtitle: 'البيانات الشخصية، الإنذارات، الأمان والأداء' },
    { id: 'database', title: 'مركز إدارة قواعد البيانات', icon: <Database className="w-4 h-4" />, subtitle: 'النسخ الاحتياطي واستعادة البيانات' },
    { id: 'trash', title: 'سلة المحذوفات', icon: <Trash2 className="w-4 h-4" />, subtitle: 'استعادة السجلات المحذوفة' },
    { id: 'settings', title: 'إعدادات النظام والتحكم', icon: <Settings className="w-4 h-4" />, subtitle: 'تخصيص الخيارات وإدارة المستخدمين' },
    { id: 'shortcuts', title: 'دليل التفاعل والاختصارات', icon: <Keyboard className="w-4 h-4" />, subtitle: 'طرق التحكم وتسهيل العمل السريع' },
    { id: 'support', title: 'الدعم الفني والمطور', icon: <HelpCircle className="w-4 h-4" />, subtitle: 'معلومات التواصل وتراخيص النظام' },
  ];

  const handleDownloadPDF = () => {
    setIsGeneratingPDF(true);
    setTimeout(() => {
      const element = document.getElementById('guide-content-panel');
      if (!element) {
        setIsGeneratingPDF(false);
        return;
      }

      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error("الرجاء السماح بالنوافذ المنبثقة (Pop-ups) لطباعة الدليل");
        setIsGeneratingPDF(false);
        return;
      }

      const html = `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <base href="${window.location.origin}">
          <title>دليل المستخدم - ${chapters.find(c => c.id === activeChapter)?.title}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&family=Tajawal:wght@400;500;700&display=swap" rel="stylesheet">
          <style>
            body { 
              font-family: 'Cairo', 'Tajawal', sans-serif; 
              padding: 40px; 
              background: white; 
              color: #1e293b;
              line-height: 1.6;
            }
            h1, h2, h3, h4, h5, h6 { 
              page-break-after: avoid; 
              break-after: avoid; 
            }
            p, li, blockquote, pre { 
              page-break-inside: avoid; 
              break-inside: avoid; 
            }
            div, section, table, tr, .bg-teal-50\\/50, .bg-amber-50, .bg-slate-50, .bg-slate-900, .bg-teal-50\\/40, .border, .rounded-2xl { 
              page-break-inside: avoid; 
              break-inside: avoid; 
            }
            ul, ol { 
              page-break-inside: auto; 
            }
            thead { 
              display: table-header-group; 
            }
            @media print {
              @page { 
                margin: 1.5cm 1.2cm; 
                size: A4 portrait; 
              }
              body { 
                -webkit-print-color-adjust: exact; 
                print-color-adjust: exact; 
                color-adjust: exact;
                padding: 0; 
              }
              .no-print { 
                display: none !important; 
              }
            }
          </style>
        </head>
        <body>
          <div class="max-w-4xl mx-auto">
            ${element.innerHTML}
          </div>
          <script>
            setTimeout(() => { window.print(); window.close(); }, 1000);
          </script>
        </body>
        </html>
      `;

      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
      setIsGeneratingPDF(false);
    }, 100);
  };

  const handleDownloadAllPDF = () => {
    setIsGeneratingPDF(true);
    setTimeout(() => {
      const element = document.getElementById('guide-all-content-panel');
      if (!element) {
        setIsGeneratingPDF(false);
        return;
      }

      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error("الرجاء السماح بالنوافذ المنبثقة (Pop-ups) لطباعة الدليل");
        setIsGeneratingPDF(false);
        return;
      }

      // Generate Table of Contents
      const tocHtml = `
        <div class="chapter-page max-w-4xl mx-auto bg-white mb-8 pb-8 border-b border-slate-200">
          <h1 class="text-3xl font-black text-slate-800 mb-6 text-center border-b border-slate-100 pb-4">فهرس المحتويات</h1>
          <div class="space-y-3 bg-slate-50 p-6 rounded-2xl border border-slate-200">
            ${chapters.map((c, i) => `
              <a href="#section-${c.id}" class="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 no-underline hover:border-teal-300 transition-all text-slate-800 break-inside-avoid shadow-sm block w-full text-right" onclick="setTimeout(function(){document.getElementById('section-${c.id}').scrollIntoView();}, 100);">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-sm shrink-0">
                    ${i + 1}
                  </div>
                  <div class="font-bold">
                    ${c.title}
                  </div>
                </div>
                <span class="text-teal-600 text-xs font-bold bg-teal-50 px-3 py-1 rounded-full shrink-0 hidden sm:inline-block">
                  انتقال للصفحة
                </span>
              </a>
            `).join('')}
          </div>
        </div>
      `;

      const introElement = document.getElementById('section-intro');
      const introHtml = introElement ? introElement.outerHTML : '';
      
      const restHtml = chapters
        .filter(c => c.id !== 'intro')
        .map(c => {
          const el = document.getElementById(`section-${c.id}`);
          return el ? el.outerHTML : '';
        })
        .join('');

      const html = `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <base href="${window.location.origin}">
          <title>دليل المستخدم الشامل</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&family=Tajawal:wght@400;500;700&display=swap" rel="stylesheet">
          <style>
            body { 
              font-family: 'Cairo', 'Tajawal', sans-serif; 
              padding: 40px; 
              background: white; 
              color: #1e293b;
              line-height: 1.5;
            }
            h1, h2, h3, h4, h5, h6 { 
              page-break-after: avoid; 
              break-after: avoid; 
            }
            p, li, blockquote, pre { 
              page-break-inside: avoid; 
              break-inside: avoid; 
            }
            div, section, table, tr, .bg-teal-50\\/50, .bg-amber-50, .bg-slate-50, .bg-slate-900, .bg-teal-50\\/40, .border, .rounded-2xl { 
              page-break-inside: avoid; 
              break-inside: avoid; 
            }
            ul, ol { 
              page-break-inside: auto; 
            }
            thead { 
              display: table-header-group; 
            }
            /* Smooth scrolling for anchor links */
            html {
              scroll-behavior: smooth;
            }
            @media print {
              @page { 
                margin: 1.2cm 1cm; 
                size: A4 portrait; 
              }
              body { 
                -webkit-print-color-adjust: exact; 
                print-color-adjust: exact; 
                color-adjust: exact;
                padding: 0; 
                font-size: 0.85rem !important; /* Reduce base font size */
              }
              .no-print { 
                display: none !important; 
              }
              .chapter-page { 
                page-break-before: always; 
                break-before: page;
                padding-top: 0.5cm; 
              }
              .chapter-page:first-child { 
                page-break-before: auto; 
                break-before: auto;
                padding-top: 0; 
              }
              /* Specific size reductions for print to save pages */
              h1 { font-size: 1.5rem !important; }
              h2 { font-size: 1.25rem !important; margin-bottom: 0.5rem !important; }
              h3 { font-size: 1.1rem !important; margin-bottom: 0.5rem !important; }
              h4 { font-size: 1rem !important; margin-bottom: 0.5rem !important; }
              p, li, th, td { font-size: 0.8rem !important; }
              .p-6, .p-8 { padding: 12px !important; } /* Reduce padding */
              .space-y-8 > * + * { margin-top: 1rem !important; }
              .space-y-6 > * + * { margin-top: 0.75rem !important; }
              .space-y-4 > * + * { margin-top: 0.5rem !important; }
              svg { width: 1.25rem !important; height: 1.25rem !important; } /* Smaller icons */
              .w-8.h-8 { width: 1.5rem !important; height: 1.5rem !important; } /* Smaller circular badges */
              .w-12.h-12 { width: 2rem !important; height: 2rem !important; } 
              .text-3xl { font-size: 1.5rem !important; }
              .text-2xl { font-size: 1.25rem !important; }
              .text-xl { font-size: 1.1rem !important; }
              .text-lg { font-size: 1rem !important; }
            }
          </style>
        </head>
        <body>
          <div class="max-w-4xl mx-auto">
            ${introHtml}
            ${tocHtml}
            ${restHtml}
          </div>
          <script>
            setTimeout(() => { window.print(); }, 1500);
          </script>
        </body>
        </html>
      `;

      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
      setIsGeneratingPDF(false);
    }, 100);
  };

  const handleDownloadWord = () => {
    setIsGeneratingPDF(true);
    setTimeout(() => {
      // Generate Table of Contents
      const tocHtml = `
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 20px;">فهرس المحتويات</h1>
        </div>
        <ul style="list-style-type: none; padding: 0;">
          ${chapters.map((c, i) => `
            <li style="margin-bottom: 10px; padding: 10px; border-bottom: 1px solid #ccc;">
              <strong>${i + 1}. ${c.title}</strong>
            </li>
          `).join('')}
        </ul>
      `;

      const introElement = document.getElementById('section-intro');
      const introHtml = introElement ? introElement.innerHTML : '';
      
      const coverHtml = `
        <div style="text-align: center; margin-bottom: 50px;">
          <img src="${window.location.origin}${import.meta.env.BASE_URL}main-interface.png" alt="واجهة النظام الرئيسية" style="width: 100%; max-width: 800px; border: 1px solid #ccc; margin-bottom: 20px;" />
          <p style="text-align: justify; line-height: 1.6; font-size: 14px;">
            توفر المنصة بيئة عمل مركزية تدمج بدقة وسرعة بين:
          </p>
        </div>
      `;

      const restHtml = chapters
        .filter(c => c.id !== 'intro')
        .map(c => {
          const el = document.getElementById(`section-${c.id}`);
          return el ? el.innerHTML : '';
        })
        .join('<br clear="all" style="page-break-before:always" />');

      const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' " +
            "xmlns:w='urn:schemas-microsoft-com:office:word' " +
            "xmlns='http://www.w3.org/TR/REC-html40'>" +
            "<head><meta charset='utf-8'><base href='" + window.location.origin + "'><title>دليل المستخدم</title></head><body>";
      const footer = "</body></html>";
      
      const sourceHTML = header + `<div dir="rtl" style="font-family: Arial, sans-serif; text-align: right;">` + coverHtml + `<br clear="all" style="page-break-before:always" />` + introHtml + `<br clear="all" style="page-break-before:always" />` + tocHtml + `<br clear="all" style="page-break-before:always" />` + restHtml + `</div>` + footer;
      
      const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
      const fileDownload = document.createElement("a");
      document.body.appendChild(fileDownload);
      fileDownload.href = source;
      fileDownload.download = 'User_Guide.doc';
      fileDownload.click();
      document.body.removeChild(fileDownload);
      setIsGeneratingPDF(false);
    }, 100);
  };

  useEffect(() => {
    window.addEventListener('download-word', handleDownloadWord);
    window.addEventListener('download-pdf-all', handleDownloadAllPDF);
    return () => {
      window.removeEventListener('download-word', handleDownloadWord);
      window.removeEventListener('download-pdf-all', handleDownloadAllPDF);
    };
  }, []);

  const renderContent = (currentChapterId: string = activeChapter) => {
    switch (currentChapterId) {
      case 'intro':
        return (
          <div className="space-y-8 animate-in fade-in duration-500 print:space-y-6">
            <div className="text-center space-y-4 pb-8 border-b border-slate-100 chapter-page break-inside-avoid">
              <Logo 
                size="lg" 
                className="mx-auto" 
                customLogoUrl={systemSettings?.companyLogo} 
                customCompanyName={systemSettings?.companyName}
                customSubtitle={systemSettings?.companySubtitle}
              />
              <h1 className="text-3xl font-black text-slate-800">دليل المستخدم الشامل</h1>
              <h2 className="text-xl font-bold text-teal-600">{systemSettings?.companyName || 'نظام مركز سند الريادة المتكامل'}</h2>
              <p className="text-slate-500 max-w-2xl mx-auto leading-relaxed">
                {systemSettings?.companySubtitle || 'المنصة الرقمية الموحدة لإدارة العمليات، الحسابات، الموارد البشرية، والتذاكر لشركات ومكاتب سند لتخليص المعاملات.'}
              </p>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm break-inside-avoid">
              <div className="p-4 bg-slate-50 flex flex-col items-center">
                 <img src={`${window.location.origin}${import.meta.env.BASE_URL}main-interface.png`} alt="واجهة النظام الرئيسية" className="w-full max-w-4xl rounded-xl border border-slate-200 shadow-sm mb-6 object-contain" />
              </div>
            </div>


            
            <div className="bg-teal-50/50 rounded-2xl p-6 border border-teal-100 break-inside-avoid">
              <h3 className="text-lg font-bold text-teal-800 mb-4 flex items-center gap-2">
                <Info className="w-5 h-5" />
                مقدمة عن النظام (النظرة العامة)
              </h3>
              <p className="text-slate-700 leading-relaxed text-sm mb-4 text-justify">
                تُعدّ المنصة الرقمية الموحدة لإدارة العمليات والموارد البشرية (نظام الداخلي المتكامل ) حلاً تقنياً متطوراً ونظاماً مالياً ومحاسبياً وإدارياً شاملاً للمشاريع الخدمية ، صُمم خصيصاً لتنظيم سير العمل وتسهيل العمليات التشغيلية الداخلية اليومية للمؤسسات، الشركات، مراكز خدمة العملاء، ومكاتب سند وتعقيب المعاملات. , توفر المنصة بيئة عمل مركزية متطورة تدمج بدقة وسرعة بين إدارة العمليات والفواتير والموظفين والعملاء بكفاءة عالية , بدءاً من حفظ بياناتهم وتتبع تعاملاتهم بكل سهولة، وصولاً إلى الإدارة المالية المرنة التي تشمل إصدار الفواتير الضريبية المبسطة بمرونة عالية وتتبع الدفعات وتطبيق الخصومات وتصديرها— وبين إدارة الموارد البشرية وتتخلص في تنظيم شؤون الموظفين وإدارة الفروع المتعددة للمؤسسة، وتخصيص أدوار وصلاحيات المستخدمين بدقة ومرونة عالية. كما تتميز المنصة بتوفير نظام متكامل للتذاكر والدعم الإداري الداخلي لمعالجة طلبات الموظفين اليومية بيسر وسهولة، مثل طلبات الإجازات، الدعم الفني، الشكاوى، والاحتياجات الإدارية واللوجستية والنثريات. ولضمان أعلى مستويات الأمان والموثوقية واستمرارية الأعمال، تشتمل المنصة على مركز متطور لحفظ البيانات واستعادتها وتصديرها بصيغ متعددة مثل ملفات إكسل ، مع دعم ميزة النسخ الاحتياطي التلقائي والآمن عبر السحاب، يرافقها نظام شامل للتقارير المالية والرسوم البيانية التفاعلية وسجل دقيق وكامل لكافة الأنشطة، مما يضمن كفاءة تشغيلية متناهية، وشفافية كاملة، وموثوقية عالية في أداء الأعمال والمهام اليومية.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
                <div className="bg-white p-4 rounded-xl border border-slate-200">
                  <h4 className="font-bold text-teal-700 mb-2 flex items-center gap-2"><Wallet className="w-4 h-4"/> الإدارة المالية والفوترة</h4>
                  <p className="text-xs text-slate-600">إصدار الفواتير الضريبية المبسطة بمرونة عالية، تتبع الدفعات النقدية والبنكية، تطبيق الخصومات، وإدارة الديون المعلقة.</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200">
                  <h4 className="font-bold text-teal-700 mb-2 flex items-center gap-2"><Users className="w-4 h-4"/> شؤون الفروع والموظفين</h4>
                  <p className="text-xs text-slate-600">تنظيم الفروع المتعددة للمؤسسة، إضافة الموظفين ونقلهم، وتخصيص أدوارهم وصلاحياتهم بدقة (التحكم الموديولي).</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200">
                  <h4 className="font-bold text-teal-700 mb-2 flex items-center gap-2"><MessageSquare className="w-4 h-4"/> نظام التذاكر والدعم</h4>
                  <p className="text-xs text-slate-600">معالجة معاملات الموظفين اليومية بيسر (طلبات الإجازات، السلف، الدعم الفني) مع محادثة مباشرة داخل كل تذكرة.</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200">
                  <h4 className="font-bold text-teal-700 mb-2 flex items-center gap-2"><ShieldCheck className="w-4 h-4"/> الأمان والتقارير</h4>
                  <p className="text-xs text-slate-600">حفظ البيانات، نسخ احتياطي، نظام شامل للتقارير المالية والرسوم البيانية، وسجل دقيق للأنشطة والمساءلة (Audit Log).</p>
                </div>
              </div>
              <ul className="space-y-3 text-slate-700 leading-relaxed text-sm">
                <li className="flex items-start gap-2">
                  <div className="mt-1 w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0" />
                  <p><strong>أسلوب تعليمي مبسط:</strong> هذا الدليل مكتوب بلغة واضحة ومباشرة لتناسب جميع المستخدمين، سواء كنت تستخدم النظام لأول مرة أو ترغب في استكشاف الميزات المتقدمة.</p>
                </li>
                <li className="flex items-start gap-2">
                  <div className="mt-1 w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0" />
                  <p><strong>أمثلة عملية واقعية:</strong> كل قسم يحتوي على "سيناريو عملي" يحاكي بيئة العمل الحقيقية في مكاتب سند لضمان الفهم الكامل للتطبيق ولتسريع عملية تدريب الموظفين الجدد.</p>
                </li>
              </ul>
            </div>
          </div>
        );
      
      case 'dashboard':
        return (
          <div className="space-y-8 animate-in fade-in duration-500 print:space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4 chapter-page break-inside-avoid">
              <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
                <LayoutDashboard className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-3xl font-black text-slate-800">الرئيسية: لوحة القيادة والمؤشرات (Dashboard)</h2>
                <p className="text-slate-500 text-sm mt-0.5">مركز التحكم السريع ونظرة شاملة على أداء المكتب المالي والتشغيلي</p>
              </div>
            </div>
            
            <div className="bg-teal-50/40 rounded-2xl p-6 border border-teal-100/60 leading-relaxed text-slate-700 break-inside-avoid">
              <h3 className="text-xl font-bold text-teal-800 mb-2 flex items-center gap-2">
                <Info className="w-6 h-6 text-teal-600" />
                الهدف من الشاشة الرئيسية
              </h3>
              <p className="text-sm">
                توفر لوحة القيادة (Dashboard) <strong>ملخصاً بصرياً وفورياً</strong> لصحة العمل. بمجرد دخولك للنظام، ستعرف فوراً إجمالي إيرادات اليوم، النقد المتوفر في الدرج، والمبالغ المعلقة (الديون)، دون الحاجة للغوص في السجلات التفصيلية أو الحسابات اليدوية.
              </p>
            </div>

            <div className="space-y-8">
              
              {/* SECTION 1: Top Statistics Cards */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 break-inside-avoid">
                <div className="flex items-center gap-2 text-teal-800 border-b border-slate-100 pb-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600 font-extrabold text-lg">1</div>
                  <h4 className="font-bold text-xl">البطاقات الإحصائية العلوية (المؤشرات السريعة)</h4>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  في أعلى الشاشة، ستجد 4 بطاقات ملونة رئيسية. هذه البطاقات تتحدث تلقائياً مع كل فاتورة أو سند قبض يتم إصداره.
                </p>
                
                <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-4 text-center my-4">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-slate-100 rounded-xl">
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 text-right">
                      <div className="flex justify-between items-start mb-2">
                        <div className="text-slate-500 text-xs font-bold">إجمالي المبيعات</div>
                        <div className="bg-blue-100 text-blue-600 p-1.5 rounded-lg"><Activity className="w-4 h-4" /></div>
                      </div>
                      <div className="text-2xl font-black text-slate-800">450.00 <span className="text-xs text-slate-400 font-normal">ر.ع</span></div>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 text-right">
                      <div className="flex justify-between items-start mb-2">
                        <div className="text-slate-500 text-xs font-bold">إيداع اليوم (في الدرج)</div>
                        <div className="bg-emerald-100 text-emerald-600 p-1.5 rounded-lg"><Wallet className="w-4 h-4" /></div>
                      </div>
                      <div className="text-2xl font-black text-emerald-600">320.00 <span className="text-xs text-slate-400 font-normal">ر.ع</span></div>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 text-right">
                      <div className="flex justify-between items-start mb-2">
                        <div className="text-slate-500 text-xs font-bold">التحويلات البنكية</div>
                        <div className="bg-indigo-100 text-indigo-600 p-1.5 rounded-lg"><CreditCard className="w-4 h-4" /></div>
                      </div>
                      <div className="text-2xl font-black text-slate-800">100.00 <span className="text-xs text-slate-400 font-normal">ر.ع</span></div>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-rose-200 bg-rose-50/30 text-right">
                      <div className="flex justify-between items-start mb-2">
                        <div className="text-slate-500 text-xs font-bold">المبالغ غير المدفوعة</div>
                        <div className="bg-rose-100 text-rose-600 p-1.5 rounded-lg"><TrendingDown className="w-4 h-4" /></div>
                      </div>
                      <div className="text-2xl font-black text-rose-600">30.00 <span className="text-xs text-slate-400 font-normal">ر.ع</span></div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 text-sm">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                    <h5 className="font-bold text-slate-800 flex items-center gap-2"><Activity className="w-4 h-4 text-blue-600" /> إجمالي المبيعات</h5>
                    <p className="text-slate-600">يمثل قيمة كل الفواتير التي صدرت اليوم، سواء دفعها العملاء أم لا. (هو المؤشر العام لنشاط المكتب).</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                    <h5 className="font-bold text-slate-800 flex items-center gap-2"><Wallet className="w-4 h-4 text-emerald-600" /> إيداع اليوم (نقداً)</h5>
                    <p className="text-slate-600">المبلغ الفعلي الذي يجب أن يكون داخل <strong>درج النقود (الكاشير)</strong> الآن. يتضمن الدفعات النقدية الكاملة والجزئية.</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                    <h5 className="font-bold text-slate-800 flex items-center gap-2"><CreditCard className="w-4 h-4 text-indigo-600" /> التحويلات البنكية</h5>
                    <p className="text-slate-600">المبالغ التي تم دفعها عبر بطاقة البنك (جهاز نقاط البيع) أو التحويل المباشر لحساب المكتب.</p>
                  </div>
                  <div className="bg-rose-50 p-4 rounded-xl border border-rose-200 space-y-2">
                    <h5 className="font-bold text-rose-900 flex items-center gap-2"><TrendingDown className="w-4 h-4 text-rose-600" /> غير مدفوع (الديون)</h5>
                    <p className="text-rose-800 font-medium">الخطر המالي: يمثل المبالغ التي صدرت بها فواتير لكن العميل لم يدفعها (أو دفع جزءاً منها). يجب متابعتها.</p>
                  </div>
                </div>
              </div>

              {/* SECTION 2: Charts and Tables */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 break-inside-avoid">
                <div className="flex items-center gap-2 text-teal-800 border-b border-slate-100 pb-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600 font-extrabold text-lg">2</div>
                  <h4 className="font-bold text-xl">الرسوم البيانية وسجل النشاطات</h4>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  تحت البطاقات، ستجد رسوماً بيانية توضح أداء المكتب خلال الأسبوع أو الشهر، بالإضافة إلى جدول يظهر أحدث الفواتير التي تم إصدارها لتتبع النشاط الأخير.
                </p>
                
                <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-4 text-center my-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                     <div className="col-span-2 border border-slate-100 rounded-lg p-4 flex flex-col items-center justify-center h-48 bg-slate-50/50">
                        <div className="flex items-end gap-2 h-24 w-full px-4 border-b border-slate-300">
                          <div className="w-1/6 bg-blue-200 h-1/3 rounded-t-sm"></div>
                          <div className="w-1/6 bg-blue-300 h-1/2 rounded-t-sm"></div>
                          <div className="w-1/6 bg-blue-400 h-3/4 rounded-t-sm"></div>
                          <div className="w-1/6 bg-blue-500 h-full rounded-t-sm"></div>
                          <div className="w-1/6 bg-blue-300 h-2/3 rounded-t-sm"></div>
                          <div className="w-1/6 bg-blue-600 h-4/5 rounded-t-sm"></div>
                        </div>
                        <div className="text-xs text-slate-400 mt-2">رسم بياني يوضح الإيرادات آخر 7 أيام</div>
                     </div>
                     <div className="col-span-1 border border-slate-100 rounded-lg p-2 text-right text-xs">
                        <div className="font-bold text-slate-700 mb-2 border-b pb-1">أحدث الفواتير</div>
                        <div className="flex justify-between py-1 border-b border-slate-50 text-slate-600"><span>#1042 العميل أحمد</span><span className="text-emerald-600">15.00 ر.ع</span></div>
                        <div className="flex justify-between py-1 border-b border-slate-50 text-slate-600"><span>#1043 العميل سعيد</span><span className="text-emerald-600">45.00 ر.ع</span></div>
                        <div className="flex justify-between py-1 border-b border-slate-50 text-slate-600"><span>#1044 العميل محمد</span><span className="text-amber-600">10.00 ر.ع</span></div>
                     </div>
                  </div>
                </div>
              </div>

              {/* SECTION 3: Practical Scenario */}
              <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-200 mt-6 break-inside-avoid">
                <h3 className="font-bold text-xl text-indigo-900 mb-3 flex items-center gap-2">
                  <BadgeAlert className="w-6 h-6 text-indigo-600" />
                  سيناريو عملي واقعي (كيف تقرأ الشاشة؟)
                </h3>
                <div className="bg-white p-4 rounded-xl border border-indigo-100 text-sm text-slate-700 leading-relaxed">
                  <p className="mb-2"><strong>الموقف:</strong> في الساعة 1:00 ظهراً، نظر مدير المكتب إلى الشاشة الرئيسية (Dashboard) ولاحظ الآتي:</p>
                  <ul className="list-disc list-inside space-y-1 mb-4 pr-4">
                    <li>المبيعات: 100 ر.ع</li>
                    <li>إيداع اليوم: 60 ر.ع</li>
                    <li>التحويلات البنكية: 20 ر.ع</li>
                    <li>المبالغ غير المدفوعة: 20 ر.ع</li>
                  </ul>
                  <p><strong>التحليل والإجراء المباشر:</strong></p>
                  <p className="text-indigo-800 font-medium">المدير يعرف الآن دون أن يسأل الموظفين أنه إذا فتح درج النقود (الكاشير) يجب أن يجد بداخله <strong>60 ريالاً نقداً</strong>. كما يعرف أن هناك <strong>20 ريالاً</strong> يجب تحصيلها لاحقاً (ديون)، وأن هناك <strong>20 ريالاً</strong> دخلت حساب البنك. المجموع هو 100 ريال (إجمالي المبيعات). الشاشة توفر رقابة مالية لحظية وتمنع أي تلاعب.</p>
                </div>
              </div>

              {/* SECTION 4: Important Alerts */}
              <div className="bg-rose-50 p-6 rounded-xl border border-rose-100 flex gap-4 items-start break-inside-avoid">
                <AlertTriangle className="w-8 h-8 text-rose-600 shrink-0 animate-pulse" />
                <div>
                  <h3 className="text-lg font-bold text-rose-800 mb-3">تنبيهات هامة وأخطاء شائعة جداً</h3>
                  <div className="bg-white p-4 rounded-lg border border-rose-200">
                    <strong className="text-rose-900 block mb-1">❌ الخطأ الشائع: مطابقة الصندوق بالرقم الخطأ</strong>
                    <p className="text-slate-700 text-sm">يقوم بعض الموظفين بمطابقة النقد الموجود في الدرج مع بطاقة "إجمالي المبيعات". هذا خطأ فادح وسيظهر دائماً أن هناك عجز! <strong>الصحيح دائماً:</strong> طابق النقد في الصندوق مع بطاقة <strong>"إيداع اليوم"</strong> ذات اللون الأخضر فقط.</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        );

      case 'invoices':
        return (
          <div className="space-y-8 animate-in fade-in duration-500 print:space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4 chapter-page break-inside-avoid">
              <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-3xl font-black text-slate-800">إدارة الفواتير (نظام الفوترة المبسط)</h2>
                <p className="text-slate-500 text-sm mt-0.5">الدليل الشامل لإصدار الفواتير، إدارة حالات الدفع، وتتبع المستحقات خطوة بخطوة</p>
              </div>
            </div>
            
            <div className="bg-teal-50/40 rounded-2xl p-6 border border-teal-100/60 leading-relaxed text-slate-700 break-inside-avoid">
              <h3 className="text-xl font-bold text-teal-800 mb-2 flex items-center gap-2">
                <Info className="w-6 h-6 text-teal-600" />
                مقدمة: الهدف من قسم الفواتير
              </h3>
              <p className="text-sm">
                يعتبر قسم الفواتير <strong>العصب المالي</strong> للمكتب. من خلاله يتم تسجيل كافة معاملات العملاء اليومية بدقة، إصدار الفواتير الضريبية (أو العادية) بشكل احترافي، وتتبع المبالغ المدفوعة والمتبقية (الديون) بشكل آلي لضمان سلامة الإيرادات وعدم ضياع أي مستحقات مالية للمكتب.
              </p>
            </div>

            <div className="space-y-8">
              
              {/* SECTION 1: Navigating to Invoices */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 break-inside-avoid">
                <div className="flex items-center gap-2 text-teal-800 border-b border-slate-100 pb-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600 font-extrabold text-lg">1</div>
                  <h4 className="font-bold text-xl">الوصول إلى واجهة الفواتير</h4>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  للبدء في التعامل مع الفواتير، يجب عليك أولاً التوجه إلى الواجهة المخصصة. يتم ذلك من خلال القائمة الجانبية الرئيسية للنظام.
                </p>
                
                <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-4 text-center my-4">
                  <div className="bg-slate-900 w-64 mx-auto p-4 rounded-xl text-right flex flex-col gap-2">
                    <div className="text-slate-400 text-xs mb-2">القائمة الرئيسية</div>
                    <div className="flex items-center gap-3 p-2 text-slate-300 hover:bg-slate-800 rounded"><LayoutDashboard className="w-4 h-4" /> <span>الرئيسية</span></div>
                    <div className="flex items-center gap-3 p-2 bg-teal-500/20 text-teal-400 border-r-2 border-teal-400 rounded"><FileText className="w-4 h-4" /> <span>الفواتير</span></div>
                    <div className="flex items-center gap-3 p-2 text-slate-300 hover:bg-slate-800 rounded"><Users className="w-4 h-4" /> <span>العملاء</span></div>
                  </div>
                </div>
              </div>

              {/* SECTION 2: Invoice Creation Modal Detailed */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 break-inside-avoid">
                <div className="flex items-center gap-2 text-teal-800 border-b border-slate-100 pb-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600 font-extrabold text-lg">2</div>
                  <h4 className="font-bold text-xl">نافذة "إصدار فاتورة جديدة" (شرح مفصل)</h4>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  عند النقر على زر <strong>"إنشاء فاتورة جديدة"</strong>، ستظهر لك نافذة منبثقة (Modal) تحتوي على كافة الخانات المطلوبة لإصدار الفاتورة. تم تصميم هذه النافذة لتكون سريعة وسهلة الاستخدام لتسريع خدمة العملاء.
                </p>
                
                <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-4 text-center my-4">
                  <div className="bg-white border border-slate-200 rounded-xl shadow-lg max-w-2xl mx-auto overflow-hidden text-right">
                    <div className="bg-slate-800 text-white p-4 flex justify-between items-center">
                       <span className="font-bold">إنشاء فاتورة جديدة</span>
                       <span className="text-slate-400">✕</span>
                    </div>
                    <div className="p-6 space-y-5 text-sm">
                      <div className="space-y-1">
                        <label className="text-slate-700 font-bold text-xs">اسم العميل (إلزامي)</label>
                        <div className="border border-slate-300 rounded-lg p-2 flex justify-between text-slate-500 bg-slate-50"><span>ابحث عن عميل سابق أو أضف جديد...</span><span>🔍</span></div>
                      </div>
                      
                      <div className="border border-teal-100 rounded-lg p-4 bg-teal-50/30 space-y-3 relative">
                        <div className="absolute top-2 left-2 text-rose-500 font-bold cursor-pointer">✕</div>
                        <div className="grid grid-cols-12 gap-3">
                          <div className="col-span-8 space-y-1">
                            <label className="text-slate-700 font-bold text-xs">وصف الخدمة / البند</label>
                            <input type="text" className="w-full border border-slate-300 rounded p-1.5 bg-white" placeholder="مثال: تجديد سجل تجاري" value="تجديد سجل تجاري" readOnly />
                          </div>
                          <div className="col-span-4 space-y-1">
                            <label className="text-slate-700 font-bold text-xs">السعر (ر.ع)</label>
                            <input type="text" className="w-full border border-slate-300 rounded p-1.5 bg-white text-left font-mono" value="45.000" readOnly />
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-teal-600 font-bold text-xs flex items-center gap-1 cursor-pointer hover:text-teal-700"><div className="w-5 h-5 bg-teal-100 rounded flex items-center justify-center">+</div> إضافة بند آخر</div>
                      
                      <div className="border-t border-slate-200 pt-4 grid grid-cols-2 gap-4 items-center">
                        <div>
                          <label className="text-slate-700 font-bold text-xs mb-1 block">حالة الدفع</label>
                          <div className="border border-slate-300 rounded-lg p-2 bg-white flex justify-between items-center text-amber-600 font-bold">
                            <span>مدفوع جزئياً</span><span>▼</span>
                          </div>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-center">
                          <div className="text-xs text-slate-500">الإجمالي</div>
                          <div className="text-xl font-black text-slate-800">45.000 <span className="text-xs font-normal">ر.ع</span></div>
                        </div>
                      </div>
                      
                      <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 grid grid-cols-2 gap-3">
                         <div className="space-y-1">
                            <label className="text-amber-900 font-bold text-xs">المبلغ المستلم (ر.ع)</label>
                            <input type="text" className="w-full border border-amber-300 rounded p-1.5 bg-white text-left font-mono" value="20.000" readOnly />
                          </div>
                          <div className="space-y-1">
                            <label className="text-amber-900 font-bold text-xs">المتبقي كدين (ر.ع)</label>
                            <div className="w-full border border-transparent rounded p-1.5 bg-transparent text-left font-mono font-bold text-rose-600">25.000</div>
                          </div>
                      </div>
                      
                      <div className="flex gap-2 justify-end pt-2">
                        <button className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-bold">إلغاء</button>
                        <button className="px-4 py-2 bg-teal-600 text-white rounded-lg font-bold flex items-center gap-2"><CheckCircle2 className="w-4 h-4"/> حفظ الفاتورة</button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div className="space-y-3">
                    <h5 className="font-bold text-teal-800 border-b border-slate-100 pb-2">1. بيانات العميل</h5>
                    <p className="text-sm text-slate-600">
                      <strong>البحث الذكي:</strong> بمجرد كتابة أول حروف من اسم العميل، سيقترح النظام الأسماء المسجلة مسبقاً لتوفير الوقت. إذا كان العميل جديداً، استمر بالكتابة وسيتم حفظه تلقائياً.
                    </p>
                  </div>
                  <div className="space-y-3">
                    <h5 className="font-bold text-teal-800 border-b border-slate-100 pb-2">2. بنود الفاتورة (الخدمات)</h5>
                    <p className="text-sm text-slate-600">
                      يمكنك إضافة بند واحد أو عدة بنود في نفس الفاتورة باستخدام زر <strong>(إضافة بند آخر +)</strong>. تأكد من كتابة وصف واضح للخدمة (مثل: طباعة رسالة، تجديد ترخيص) والمبلغ بدقة.
                    </p>
                  </div>
                  <div className="space-y-3 md:col-span-2">
                    <h5 className="font-bold text-teal-800 border-b border-slate-100 pb-2">3. حالات الدفع (مهم جداً)</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2 text-sm">
                      <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg">
                        <div className="font-bold text-emerald-800 mb-1 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> مدفوع بالكامل</div>
                        <p className="text-emerald-700 text-xs">استلمت كامل المبلغ نقداً أو بالبطاقة. لا توجد ديون.</p>
                      </div>
                      <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg">
                        <div className="font-bold text-amber-800 mb-1 flex items-center gap-1"><AlertTriangle className="w-4 h-4" /> مدفوع جزئياً</div>
                        <p className="text-amber-700 text-xs">استلمت جزءاً (عربون/مقدم). النظام سيطلب إدخال المبلغ المستلم ليحسب المتبقي كدين.</p>
                      </div>
                      <div className="bg-rose-50 border border-rose-200 p-3 rounded-lg">
                        <div className="font-bold text-rose-800 mb-1 flex items-center gap-1"><Settings className="w-4 h-4" /> غير مدفوع</div>
                        <p className="text-rose-700 text-xs">العميل لم يدفع شيئاً. يسجل كامل المبلغ كمديونية عليه.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 3: Practical Scenario for Invoices */}
              <div className="bg-indigo-50 rounded-2xl p-6 sm:p-8 border border-indigo-200 mt-10 break-inside-avoid relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-200/40 rounded-full blur-3xl -mr-10 -mt-10"></div>
                <h3 className="font-bold text-2xl text-indigo-900 mb-5 flex items-center gap-3 border-b border-indigo-200/50 pb-4 relative z-10">
                  <BadgeAlert className="w-7 h-7 text-indigo-600 animate-bounce" />
                  سيناريو عملي واقعي (إصدار فاتورة لعميل في مكتب سند)
                </h3>
                
                <div className="bg-white p-5 rounded-xl border border-indigo-200 shadow-sm mb-8 relative z-10 text-right">
                  <p className="text-base text-slate-800 leading-relaxed font-medium">
                    <strong>السيناريو:</strong> حضر العميل "سعيد العامري" لمكتب سند لتجديد سجله التجاري. تكلفة التجديد الإجمالية هي <strong className="text-indigo-700">45 ريالاً</strong>. العميل دفع <strong className="text-emerald-600">20 ريالاً نقداً</strong> ووعد بدفع المبلغ المتبقي بعد يومين عند استلام الوثائق المطبوعة. كيف يقوم الموظف بتسجيل هذه العملية بشكل صحيح؟
                  </p>
                </div>

                <div className="space-y-6 text-sm text-slate-700 relative z-10 before:absolute before:right-[23px] before:top-4 before:bottom-4 before:w-1 before:bg-indigo-200/70">
                  
                  <div className="flex gap-4 sm:gap-6 relative z-10 text-right group">
                    <div className="w-12 h-12 rounded-full bg-indigo-500 text-white font-black text-xl flex items-center justify-center shrink-0 shadow-md ring-4 ring-indigo-100 group-hover:scale-110 transition-transform">1</div>
                    <div className="bg-white p-5 border border-indigo-100 rounded-xl flex-1 shadow-sm group-hover:border-indigo-300 transition-colors">
                      <h5 className="font-bold text-indigo-900 text-lg mb-2">فتح النافذة وتحديد العميل</h5>
                      <p className="text-sm text-slate-600 leading-relaxed">يضغط الموظف على زر "إنشاء فاتورة جديدة". في خانة العميل، يكتب "سعيد العامري".</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4 sm:gap-6 relative z-10 text-right group">
                    <div className="w-12 h-12 rounded-full bg-indigo-500 text-white font-black text-xl flex items-center justify-center shrink-0 shadow-md ring-4 ring-indigo-100 group-hover:scale-110 transition-transform">2</div>
                    <div className="bg-white p-5 border border-indigo-100 rounded-xl flex-1 shadow-sm group-hover:border-indigo-300 transition-colors">
                      <h5 className="font-bold text-indigo-900 text-lg mb-2">إدخال الخدمة والسعر</h5>
                      <p className="text-sm text-slate-600 leading-relaxed">في البند الأول، يكتب الوصف: "تجديد سجل تجاري"، ويدخل السعر: "45".</p>
                    </div>
                  </div>

                  <div className="flex gap-4 sm:gap-6 relative z-10 text-right group">
                    <div className="w-12 h-12 rounded-full bg-indigo-500 text-white font-black text-xl flex items-center justify-center shrink-0 shadow-md ring-4 ring-indigo-100 group-hover:scale-110 transition-transform">3</div>
                    <div className="bg-white p-5 border border-indigo-100 rounded-xl flex-1 shadow-sm group-hover:border-indigo-300 transition-colors">
                      <h5 className="font-bold text-indigo-900 text-lg mb-2">ضبط الدفع الجزئي (الخطوة الأهم)</h5>
                      <p className="text-sm text-slate-600 leading-relaxed">من قائمة <strong>حالة الدفع</strong>، يختار <strong>"مدفوع جزئياً"</strong>. سيظهر حقل جديد يطلب إدخال "المبلغ المستلم"، فيكتب فيه <strong>"20"</strong>. النظام تلقائياً سيعرض أن المتبقي كدين هو <strong>"25"</strong>.</p>
                    </div>
                  </div>

                  <div className="flex gap-4 sm:gap-6 relative z-10 text-right group">
                    <div className="w-12 h-12 rounded-full bg-indigo-500 text-white font-black text-xl flex items-center justify-center shrink-0 shadow-md ring-4 ring-indigo-100 group-hover:scale-110 transition-transform">4</div>
                    <div className="bg-white p-5 border border-indigo-100 rounded-xl flex-1 shadow-sm group-hover:border-indigo-300 transition-colors">
                      <h5 className="font-bold text-indigo-900 text-lg mb-2">الحفظ والنتائج التلقائية</h5>
                      <div className="text-sm text-slate-600 leading-relaxed">بمجرد الضغط على "حفظ الفاتورة"، يقوم النظام بثلاثة إجراءات تلقائية ومخفية عن الموظف:
                        <ul className="list-disc list-inside mt-2 text-indigo-700 font-medium space-y-1">
                          <li>إضافة 20 ريالاً في تقرير <strong>"إيداع اليوم"</strong>.</li>
                          <li>إنشاء مديونية بقيمة 25 ريالاً في ملف العميل "سعيد العامري".</li>
                          <li>توليد فاتورة رسمية توضح المبلغ الإجمالي، المدفوع، والمتبقي جاهزة للطباعة للعميل.</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* SECTION 4: Important Alerts */}
              <div className="bg-rose-50 p-6 rounded-xl border border-rose-100 flex gap-4 items-start break-inside-avoid">
                <AlertTriangle className="w-8 h-8 text-rose-600 shrink-0 animate-pulse" />
                <div>
                  <h3 className="text-lg font-bold text-rose-800 mb-3">تنبيهات هامة وأخطاء شائعة جداً</h3>
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-lg border border-rose-200">
                      <strong className="text-rose-900 block mb-1">❌ الخطأ الشائع الأول: التلاعب بحالات الدفع</strong>
                      <p className="text-slate-700 text-sm">قيام الموظف باختيار حالة "مدفوع بالكامل" لعميل دفع جزءاً من المبلغ فقط (بقصد تعديلها لاحقاً). هذا سيسبب عجزاً فورياً في صندوق المكتب عند الإغلاق اليومي لأن النظام سيتوقع وجود كامل المبلغ نقداً في الدرج.</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-rose-200">
                      <strong className="text-rose-900 block mb-1">💡 نصيحة ذهبية: الطباعة قبل الحفظ</strong>
                      <p className="text-slate-700 text-sm">استخدم زر "الطباعة المبدئية" قبل اعتماد הפاتورة لتقديمها للعميل لمراجعة التكاليف، خاصة في المعاملات المعقدة التي تحتوي على رسوم حكومية وخدمات تخليص متعددة.</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        );

      case 'closing':
        return (
          <div className="space-y-8 animate-in fade-in duration-500 print:space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4 chapter-page break-inside-avoid">
              <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
                <Calculator className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-3xl font-black text-slate-800">الإغلاق المالي والتقارير الشهرية</h2>
                <p className="text-slate-500 text-sm mt-0.5">عملية تصفية الحسابات اليومية وتصدير التقارير الإدارية بشكل دقيق</p>
              </div>
            </div>
            
            <div className="bg-teal-50/40 rounded-2xl p-6 border border-teal-100/60 leading-relaxed text-slate-700 break-inside-avoid">
              <h3 className="text-xl font-bold text-teal-800 mb-2 flex items-center gap-2">
                <Info className="w-6 h-6 text-teal-600" />
                الهدف من عملية الإغلاق
              </h3>
              <p className="text-sm">
                الإغلاق المالي هو <strong>عملية المطابقة النهائية</strong> في نهاية يوم العمل. تهدف إلى التأكد من أن المبالغ النقدية الفعلية الموجودة في درج المكتب والمبالغ المحولة لحساب البنك تتطابق تماماً مع ما تم تسجيله من فواتير في النظام طوال اليوم، لضمان عدم وجود عجز أو فائض غير مبرر.
              </p>
            </div>

            <div className="space-y-8">
              
              {/* SECTION 1: Daily Closing */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 break-inside-avoid">
                <div className="flex items-center gap-2 text-teal-800 border-b border-slate-100 pb-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600 font-extrabold text-lg">1</div>
                  <h4 className="font-bold text-xl">خطوات الإغلاق اليومي للصندوق</h4>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  يجب القيام بهذه الخطوة في نهاية كل يوم عمل (أو عند تسليم الوردية بين الموظفين).
                </p>
                
                <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-4 text-center my-4">
                  <div className="bg-white border border-slate-200 rounded-xl shadow-sm max-w-xl mx-auto overflow-hidden text-right">
                    <div className="p-5 space-y-4 text-sm">
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-center flex justify-between items-center">
                        <span className="text-slate-500 font-bold">إجمالي المبيعات المسجلة:</span>
                        <span className="text-xl font-black text-slate-800">100.00 ر.ع</span>
                      </div>
                      
                      <div className="space-y-3 pt-2">
                        <div className="space-y-1">
                          <label className="text-slate-700 font-bold text-xs">المبلغ النقدي الفعلي في الدرج</label>
                          <input type="text" className="w-full border border-emerald-300 rounded p-2 bg-emerald-50 text-left font-mono focus:outline-none" value="80.000" readOnly />
                        </div>
                        <div className="space-y-1">
                          <label className="text-slate-700 font-bold text-xs">مجموع إيصالات البنك (نقاط البيع)</label>
                          <input type="text" className="w-full border border-indigo-300 rounded p-2 bg-indigo-50 text-left font-mono focus:outline-none" value="20.000" readOnly />
                        </div>
                        <div className="space-y-1">
                          <label className="text-slate-700 font-bold text-xs">المصاريف النثرية (إن وجدت)</label>
                          <input type="text" className="w-full border border-slate-300 rounded p-2 bg-white text-left font-mono" value="0.000" readOnly />
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-slate-200">
                        <div className="bg-emerald-100 text-emerald-800 p-3 rounded-lg text-center font-bold flex items-center justify-center gap-2">
                          <CheckCircle2 className="w-5 h-5" />
                          الصندوق مطابق تماماً
                        </div>
                        <button className="w-full mt-3 px-4 py-3 bg-teal-600 text-white rounded-lg font-bold text-center">اعتماد الإغلاق وترحيل البيانات</button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div className="space-y-3">
                    <h5 className="font-bold text-teal-800 border-b border-slate-100 pb-2">كيف تعمل المطابقة؟</h5>
                    <ol className="list-decimal list-inside text-sm text-slate-600 space-y-1">
                      <li>قم بعد الأوراق النقدية بيدك وأدخل المجموع في النظام.</li>
                      <li>اجمع إيصالات ماكينة البنك وأدخلها.</li>
                      <li>النظام سيقوم أوتوماتيكياً بجمع الرقمين ومقارنتهما مع إجمالي הפواتير الصادرة اليوم (ناقصاً الديون).</li>
                      <li>إذا كان هناك فرق (عجز أو زيادة)، سيرفض النظام الاعتماد حتى توضح السبب.</li>
                    </ol>
                  </div>
                  <div className="space-y-3">
                    <h5 className="font-bold text-teal-800 border-b border-slate-100 pb-2">ترحيل البيانات</h5>
                    <p className="text-sm text-slate-600">
                      عند النقر على "اعتماد الإغلاق"، يتم <strong>تجميد</strong> بيانات اليوم ولا يمكن تعديل الفواتير السابقة، وتُرحل المجاميع مباشرة إلى صفحة التقارير الشهرية لتكوين الإحصائيات العامة للإدارة.
                    </p>
                  </div>
                </div>
              </div>

              {/* SECTION 2: Monthly Reports & PDF */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 break-inside-avoid">
                <div className="flex items-center gap-2 text-teal-800 border-b border-slate-100 pb-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600 font-extrabold text-lg">2</div>
                  <h4 className="font-bold text-xl">التقارير الشهرية وتصدير PDF الاحترافي</h4>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  يجمع النظام بيانات الإغلاقات اليومية ويكون تقريراً شهرياً شاملاً، جاهزاً للطباعة أو المشاركة مع المحاسبين والشركاء بشكل رسمي (Landscape PDF).
                </p>
                
                <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-4 text-center my-4">
                  <div className="bg-white border border-slate-300 rounded-sm shadow-xl mx-auto w-full max-w-3xl aspect-[1.414/1] relative overflow-hidden flex flex-col p-8 ">
                    {/* Simulated A4 Landscape page */}
                    <div className="flex justify-between items-end border-b-2 border-slate-800 pb-4 mb-6">
                      <div className="text-right">
                        <div className="text-2xl font-black text-slate-900">التقرير המالي الشامل</div>
                        <div className="text-sm text-slate-500">مكتب سند للخدمات • يوليو 2026</div>
                      </div>
                      <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center text-xs text-slate-400">شعار</div>
                    </div>
                    <div className="grid grid-cols-4 gap-4 mb-6">
                      <div className="bg-slate-100 p-3 rounded text-center border border-slate-200"><div className="text-xs text-slate-500">إجمالي الإيرادات</div><div className="font-bold">4,500 ر.ع</div></div>
                      <div className="bg-slate-100 p-3 rounded text-center border border-slate-200"><div className="text-xs text-slate-500">النقد (الكاش)</div><div className="font-bold text-emerald-600">3,000 ر.ع</div></div>
                      <div className="bg-slate-100 p-3 rounded text-center border border-slate-200"><div className="text-xs text-slate-500">التحويلات البنكية</div><div className="font-bold text-indigo-600">1,200 ر.ع</div></div>
                      <div className="bg-slate-100 p-3 rounded text-center border border-slate-200"><div className="text-xs text-slate-500">الديون المتبقية</div><div className="font-bold text-rose-600">300 ر.ع</div></div>
                    </div>
                    <div className="flex-1 bg-slate-50 rounded border border-slate-200 p-4 relative">
                      <div className="absolute inset-x-4 top-1/2 border-t border-slate-200 border-dashed"></div>
                      <div className="absolute inset-x-4 top-1/4 border-t border-slate-200 border-dashed"></div>
                      <div className="absolute inset-x-4 top-3/4 border-t border-slate-200 border-dashed"></div>
                      <div className="flex justify-around items-end h-full pt-4">
                        <div className="w-8 bg-teal-400 h-1/4 rounded-t-sm z-10"></div>
                        <div className="w-8 bg-teal-400 h-2/4 rounded-t-sm z-10"></div>
                        <div className="w-8 bg-teal-400 h-3/4 rounded-t-sm z-10"></div>
                        <div className="w-8 bg-teal-400 h-full rounded-t-sm z-10"></div>
                        <div className="w-8 bg-teal-400 h-1/2 rounded-t-sm z-10"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 3: Practical Scenario */}
              <div className="bg-indigo-50 rounded-2xl p-6 sm:p-8 border border-indigo-200 mt-10 break-inside-avoid relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-200/40 rounded-full blur-3xl -mr-10 -mt-10"></div>
                <h3 className="font-bold text-2xl text-indigo-900 mb-5 flex items-center gap-3 border-b border-indigo-200/50 pb-4 relative z-10">
                  <BadgeAlert className="w-7 h-7 text-indigo-600 animate-bounce" />
                  سيناريو عملي واقعي (تسليم الوردية والإغلاق)
                </h3>
                
                <div className="bg-white p-5 rounded-xl border border-indigo-200 shadow-sm mb-6 relative z-10 text-right">
                  <p className="text-base text-slate-800 leading-relaxed font-medium">
                    <strong>السيناريو:</strong> في الساعة 9:00 مساءً، أنهى الموظف "محمد" مناوبته. أراد إغلاق الصندوق. يخبره النظام أن <strong>مبيعاته النقدية المسجلة هي 150 ريالاً</strong>، والمبيعات بالبطاقة 50 ريالاً.
                  </p>
                </div>

                <div className="space-y-4 text-sm text-slate-700 relative z-10 pl-6">
                  <ul className="list-disc list-inside space-y-3">
                    <li>قام محمد بفتح درج النقود وعد الأوراق بيده فوجد <strong>140 ريالاً فقط</strong>.</li>
                    <li>أدخل محمد "140" في حقل "نقداً بالصندوق". أظهر النظام رسالة تحذير باللون الأحمر: <strong>(يوجد عجز 10 ريالات)</strong> ورفض اعتماد الإغلاق.</li>
                    <li>تذكر محمد فوراً أنه خلال היום قام أحد العملاء بدفع 10 ريالات، لكن محمد نسي إصدار فاتورة له في زحمة العمل.</li>
                    <li>قام محمد بالعودة لقسم הפواتير، أصدر فاتورة بالـ 10 ريالات المتأخرة، ثم عاد لشاشة الإغلاق. الآن أصبح المطلوب 150 ريالاً والنقد 150 ريالاً. ظهرت رسالة خضراء (الصندوق مطابق). واعتمد الإغلاق بنجاح.</li>
                  </ul>
                  <div className="mt-4 p-3 bg-indigo-100 text-indigo-800 rounded-lg font-bold border border-indigo-200">
                    النتيجة: النظام منع الموظف من إنهاء عمله بوجود خطأ مالي، وأجبره على تذكر الفاتورة المنسية، مما حفظ إيرادات المكتب.
                  </div>
                </div>
              </div>

              {/* SECTION 4: Important Alerts */}
              <div className="bg-rose-50 p-6 rounded-xl border border-rose-100 flex gap-4 items-start break-inside-avoid">
                <AlertTriangle className="w-8 h-8 text-rose-600 shrink-0 animate-pulse" />
                <div>
                  <h3 className="text-lg font-bold text-rose-800 mb-3">تنبيهات هامة وأخطاء شائعة جداً</h3>
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-lg border border-rose-200">
                      <strong className="text-rose-900 block mb-1">❌ الخطأ الشائع: إغلاق الصندوق قبل إنهاء الفواتير</strong>
                      <p className="text-slate-700 text-sm">عمل الإغلاق المالي قبل إدخال جميع فواتير اليوم. الإغلاق يجب أن يكون <strong>الخطوة الأخيرة حرفياً</strong> قبل مغادرة المكتب.</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-rose-200">
                      <strong className="text-rose-900 block mb-1">🔒 تنبيه الصلاحيات:</strong>
                      <p className="text-slate-700 text-sm">لا يمكن التعديل على الإغلاق المالي اليومي بعد اعتماده، يرجى تحري الدقة والمطابقة الكاملة. التعديل يحتاج لصلاحيات مسؤول النظام.</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        );

      case 'tickets':
        return (
          <div className="space-y-8 animate-in fade-in duration-500 print:space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4 chapter-page break-inside-avoid">
              <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-3xl font-black text-slate-800">نظام التذاكر والدعم الإداري</h2>
                <p className="text-slate-500 text-sm mt-0.5">التواصل الداخلي، طلبات الإجازات، الدعم الفني، والمشتريات</p>
              </div>
            </div>
            
            <div className="bg-teal-50/40 rounded-2xl p-6 border border-teal-100/60 leading-relaxed text-slate-700 break-inside-avoid">
              <h3 className="text-xl font-bold text-teal-800 mb-2 flex items-center gap-2">
                <Info className="w-6 h-6 text-teal-600" />
                الهدف من نظام التذاكر
              </h3>
              <p className="text-sm">
                نظام التذاكر (Ticketing System) هو القناة الرسمية الوحيدة للتواصل بين الموظفين والإدارة. يهدف إلى توثيق كافة الطلبات (إجازة، سلفة، صيانة جهاز، طلب أدوات مكتبية) بدلاً من الاعتماد على الرسائل الشفوية أو تطبيقات المراسلة الخارجية، مما يضمن حفظ حقوق الجميع وتسريع عملية الرد والاعتماد.
              </p>
            </div>

            <div className="space-y-8">
              
              {/* SECTION 1 */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 break-inside-avoid">
                <div className="flex items-center gap-2 text-teal-800 border-b border-slate-100 pb-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600 font-extrabold text-lg">1</div>
                  <h4 className="font-bold text-xl">إنشاء تذكرة جديدة ومتابعة الحالات</h4>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  واجهة التذاكر بسيطة جداً. تتكون من زر لإنشاء طلب جديد، وجدول يعرض كافة طلباتك السابقة وحالتها الحالية لتكون على اطلاع دائم بما يحدث لطلبك.
                </p>
                
                <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-4 text-center my-4">
                  <div className="bg-white border border-slate-200 rounded-xl shadow-sm text-right overflow-hidden max-w-2xl mx-auto">
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                      <h5 className="font-bold text-slate-800">طلباتي السابقة</h5>
                      <button className="bg-teal-600 text-white px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2">+ تذكرة دعم جديدة</button>
                    </div>
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                        <tr><th className="p-3 resize-x overflow-auto">رقم</th><th className="p-3 resize-x overflow-auto">النوع</th><th className="p-3 resize-x overflow-auto">العنوان</th><th className="p-3 resize-x overflow-auto">الحالة</th></tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        <tr><td className="p-3 font-mono">#102</td><td className="p-3">إجازة سنوية</td><td className="p-3">طلب إجازة لمدة 3 أيام للظروف</td><td className="p-3"><span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-xs font-bold">مكتمل ومغلق</span></td></tr>
                        <tr><td className="p-3 font-mono">#105</td><td className="p-3">صيانة ودعم</td><td className="p-3">طابعة الفرع لا تعمل بشكل جيد</td><td className="p-3"><span className="bg-amber-100 text-amber-700 px-2 py-1 rounded text-xs font-bold">قيد المعالجة</span></td></tr>
                        <tr><td className="p-3 font-mono">#108</td><td className="p-3">مشتريات</td><td className="p-3">نحتاج أوراق A4 و حبر أسود</td><td className="p-3"><span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs font-bold">بانتظار الرد</span></td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                  <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg text-center">
                    <div className="text-slate-500 font-bold mb-1 text-sm bg-slate-200 inline-block px-2 py-0.5 rounded">بانتظار الرد</div>
                    <p className="text-xs text-slate-600 mt-2">التذكرة وصلت للإدارة ولم يتم فتحها أو الرد عليها بعد.</p>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-center">
                    <div className="text-amber-700 font-bold mb-1 text-sm bg-amber-200 inline-block px-2 py-0.5 rounded">قيد المعالجة</div>
                    <p className="text-xs text-slate-600 mt-2">الإدارة اطلعت على الطلب وتعمل على حله (مثال: طلب الفني للصيانة).</p>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg text-center">
                    <div className="text-emerald-700 font-bold mb-1 text-sm bg-emerald-200 inline-block px-2 py-0.5 rounded">مكتمل ومغلق</div>
                    <p className="text-xs text-slate-600 mt-2">تم تنفيذ الطلب بنجاح وتم إغلاق التذكرة نهائياً.</p>
                  </div>
                </div>
              </div>

              {/* SECTION 2 */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 break-inside-avoid">
                <div className="flex items-center gap-2 text-teal-800 border-b border-slate-100 pb-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600 font-extrabold text-lg">2</div>
                  <h4 className="font-bold text-xl">المحادثة المباشرة داخل التذكرة (Live Chat)</h4>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  عند النقر على أي تذكرة في الجدول، سيفتح لك <strong>صندوق محادثة (شات)</strong> يشبه تطبيقات المراسلة. هنا يمكنك التحدث مع الإدارة حول هذا الطلب تحديداً.
                </p>
                
                <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-4 text-center my-4">
                  <div className="bg-slate-100 border border-slate-300 rounded-xl max-w-sm mx-auto shadow-inner text-right flex flex-col h-64 overflow-hidden print:border-slate-800 print:shadow-none">
                     <div className="bg-white p-3 border-b border-slate-200 shadow-sm z-10 flex justify-between items-center">
                       <div><div className="font-bold text-sm text-slate-800">تذكرة #105: صيانة ودعم</div><div className="text-xs text-slate-500">طابعة الفرع لا تعمل</div></div>
                       <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                     </div>
                     <div className="flex-1 p-4 space-y-4 overflow-hidden relative">
                       <div className="absolute inset-0 opacity-[0.03]" style={{backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '10px 10px'}}></div>
                       <div className="flex justify-start relative z-10">
                         <div className="bg-white border border-slate-200 rounded-2xl rounded-tr-sm p-3 shadow-sm max-w-[85%] text-sm text-slate-700">السلام عليكم، الطابعة تسحب الورق وتتوقف فجأة.</div>
                       </div>
                       <div className="flex justify-end relative z-10">
                         <div className="bg-teal-600 text-white rounded-2xl rounded-tl-sm p-3 shadow-sm max-w-[85%] text-sm">وعليكم السلام، تم إبلاغ شركة الصيانة، سيزوركم مهندس غداً صباحاً.</div>
                       </div>
                     </div>
                     <div className="bg-white p-2 border-t border-slate-200 flex gap-2">
                       <input type="text" className="flex-1 bg-slate-100 rounded-full px-4 text-sm border-none focus:ring-0" placeholder="اكتب ردك هنا..." readOnly />
                       <button className="bg-teal-600 text-white w-10 h-10 rounded-full flex items-center justify-center shrink-0">⬆️</button>
                     </div>
                  </div>
                </div>
              </div>

              {/* SECTION 3: Practical Scenario */}
              <div className="bg-indigo-50 rounded-2xl p-6 sm:p-8 border border-indigo-200 mt-10 break-inside-avoid relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-200/40 rounded-full blur-3xl -mr-10 -mt-10"></div>
                <h3 className="font-bold text-2xl text-indigo-900 mb-5 flex items-center gap-3 border-b border-indigo-200/50 pb-4 relative z-10">
                  <BadgeAlert className="w-7 h-7 text-indigo-600 animate-bounce" />
                  سيناريو عملي واقعي (طلب سلفة مالية)
                </h3>
                
                <div className="space-y-4 text-sm text-slate-700 relative z-10 pl-6 text-right">
                  <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 font-bold flex items-center justify-center shrink-0">1</div>
                    <p>يحتاج الموظف "سالم" إلى سلفة طارئة. يفتح <strong>"تذكرة جديدة"</strong>، يختار نوع التذكرة <strong>"شؤون مالية/سلف"</strong> ويكتب في الوصف: "أرجو الموافقة على سلفة 50 ريال تخصم من راتب الشهر القادم."</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 font-bold flex items-center justify-center shrink-0">2</div>
                    <p>بمجرد الحفظ، يظهر إشعار فوري في شاشة الإدارة. يفتح المدير التذكرة ويكتب في المحادثة: <strong>"تمت الموافقة، يمكنك أخذ المبلغ من درج الكاشير وتسجيله كمصروف نثري في الإغلاق اليومي."</strong></p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 font-bold flex items-center justify-center shrink-0">3</div>
                    <p>يرى سالم الرد فوراً بدون تحديث الصفحة. يقوم المدير بتغيير حالة التذكرة إلى <strong>"مكتمل ومغلق"</strong>.</p>
                  </div>
                  <div className="mt-4 p-3 bg-indigo-100 text-indigo-800 rounded-lg font-bold border border-indigo-200 text-center">
                    النتيجة: تم توثيق طلب السلفة، والموافقة عليها، وإعطاء التعليمات، كل ذلك في دقيقة واحدة وبشكل مسجل لا يمكن إنكاره لاحقاً.
                  </div>
                </div>
              </div>

            </div>
          </div>
        );

      case 'reports':
        return (
          <div className="space-y-8 animate-in fade-in duration-500 print:space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4 chapter-page break-inside-avoid">
              <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
                <BarChart className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-3xl font-black text-slate-800">صفحة التقرير الشهري وجدول المدخلات المالية اليومية</h2>
                <p className="text-slate-500 text-sm mt-0.5">الدليل التوضيحي المكتمل للتحليلات المالية، جدول الحركة اليومية، وفحص عمليات كل يوم</p>
              </div>
            </div>
            
            <div className="bg-teal-50/40 rounded-2xl p-6 border border-teal-100/60 leading-relaxed text-slate-700 break-inside-avoid">
              <h3 className="text-xl font-bold text-teal-800 mb-2 flex items-center gap-2">
                <Info className="w-6 h-6 text-teal-600" />
                مقدمة عن صفحة التقرير الشهري
              </h3>
              <p className="text-sm">
                تُعتبر <strong>صفحة التقرير الشهري</strong> المحرك المالي الرئيسي والقلب النابض لنظام مركز سند. تمنح الإدارة والمحاسبين رؤية بصرية دقيقة وموثوقة لجميع الإيرادات النقدية والبنكية والمصاريف اليومية خلال الشهر. تهدف الصفحة إلى تجميع مبيعات كافة الفروع والموظفين، ومطابقة حركة الصندوق، وتوفير أداة حفر عميق (Drill-Down) للاطلاع على فواتير وعمليات أي يوم محدد بضغطة زر واحدة.
              </p>
            </div>

            <div className="space-y-8">

              {/* SECTION 1: Filters */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5 break-inside-avoid">
                <div className="flex items-center gap-2 text-teal-800 border-b border-slate-100 pb-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600 font-extrabold text-lg">1</div>
                  <h4 className="font-bold text-xl">التصفية وتحديد النطاق الزمني (Filters & Date Range)</h4>
                </div>
                
                <p className="text-sm text-slate-600 leading-relaxed">
                  الخطوة الأولى لقراءة التقارير وتدقيقها هي اختيار الفترة الزمنية والفرع المطلوبين بدقة. يوفر شريط الفلترة العلوي وصولاً سريعاً لتخصيص البيانات المعروضة وتصديرها بصيغ رسمية.
                </p>

                <div className="my-6">
                  <div className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-teal-600" />
                    صورة توضيحية احترافية لشريط الفلترة وتحديد النطاق الزمني:
                  </div>
                  <ReportFiltersMockup />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-slate-700">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                    <h5 className="font-bold text-slate-800 flex items-center gap-2 text-base">
                      <Calendar className="w-5 h-5 text-teal-600" />
                      تحديد الشهر (النطاق الزمني)
                    </h5>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      يسمح لك بالتنقل السلس بين السجلات التاريخية. بمجرد اختيار شهر معين (مثال: يوليو 2026)، يتم تحديث كافة الرسوم البيانية، الجداول، والمؤشرات الرقمية أسفل الصفحة فوراً لتطابق هذا الشهر.
                    </p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                    <h5 className="font-bold text-slate-800 flex items-center gap-2 text-base">
                      <MapPin className="w-5 h-5 text-indigo-600" />
                      تصفية الفروع
                    </h5>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      يمكنك من عزل الأرباح وتحديد مصدرها. استعرض مبيعات "الفرع الرئيسي" فقط، أو اختر "جميع الفروع" للحصول على النظرة الشمولية لإجمالي دخل المكتب بجميع أذرعه.
                    </p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                    <h5 className="font-bold text-slate-800 flex items-center gap-2 text-base">
                      <FileText className="w-5 h-5 text-emerald-600" />
                      تصدير لبرنامج Excel
                    </h5>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      يولد ملف إكسل احترافي يحتوي على جميع المدخلات اليومية. يعتبر الأداة المفضلة للمحاسبين لإجراء عمليات رياضية متقدمة أو أرشفة النسخ الاحتياطية.
                    </p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                    <h5 className="font-bold text-slate-800 flex items-center gap-2 text-base">
                      <Download className="w-5 h-5 text-rose-600" />
                      طباعة التقرير (PDF)
                    </h5>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      يصدر كشفاً رسمياً بتنسيق A4 مناسب للطباعة الورقية. يحمل ترويسة المكتب الرسمية وملخص الحركات للإدارة والملاك واعتمادات التدقيق.
                    </p>
                  </div>
                </div>
              </div>

              {/* SECTION 2: Interactive Cards */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5 break-inside-avoid">
                <div className="flex items-center gap-2 text-teal-800 border-b border-slate-100 pb-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600 font-extrabold text-lg">2</div>
                  <h4 className="font-bold text-xl">البطاقات التفاعلية لملخص الأشهر (Interactive Cards)</h4>
                </div>
                
                <p className="text-sm text-slate-600 leading-relaxed">
                  تعمل هذه البطاقات كشريط قيادة سريع الاستجابة (Dashboard). بدلاً من البحث في القوائم المنسدلة، يمكنك ببساطة النقر على بطاقة الشهر لقراءة تفاصيله، مع رؤية واضحة ومباشرة للمؤشرات الحيوية.
                </p>

                <div className="my-6">
                  <div className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-teal-600" />
                    صورة توضيحية احترافية للبطاقات التفاعلية لملخص الأشهر السابقة والحالية:
                  </div>
                  <InteractiveCardsMockup />
                </div>

                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4 text-sm text-slate-700 mt-2">
                  <h5 className="font-bold text-teal-800 text-base flex items-center gap-2">
                    <MousePointerClick className="w-5 h-5 text-teal-600" />
                    ماذا توفر لك هذه البطاقات؟
                  </h5>
                  <ul className="space-y-2.5 text-xs sm:text-sm list-disc list-inside text-slate-700 leading-relaxed">
                    <li><strong>التفاعل بالضغط (Click to Filter):</strong> تعمل البطاقات كأزرار تصفية بصرية. البطاقة المميزة بإطار بارز (محدد حالياً) هي التي يتم عرض جداولها وتقاريرها حالياً. اضغط على بطاقة "يونيو" لتنتقل جميع رسومات وجداول الصفحة فوراً لعرض ذلك الشهر.</li>
                    <li><strong>إجمالي الإيرادات (Total Revenue):</strong> يُعرض الرقم الأهم وهو الإجمالي المالي المحقق للشهر بخط كبير وواضح، ليكون أول ما تقع عليه عين المالك.</li>
                    <li><strong>كثافة الفواتير (Invoice Volume):</strong> لمعرفة حجم الجهد المبذول وليس فقط العائد المالي (مثلاً: 142 فاتورة).</li>
                    <li><strong>مؤشرات النمو والتراجع (Trend Indicators):</strong> شارات ملونة ذكية تقارن أداء الشهر الحالي بسابقه تلقائياً. يظهر <strong>نمو ↑ (أخضر)</strong> إذا كانت المبيعات أفضل، ويظهر <strong>تراجع ↓ (أحمر)</strong> للفت الانتباه إذا انخفضت المبيعات للبدء في إجراءات المعالجة.</li>
                  </ul>
                </div>
              </div>

              {/* SECTION 3: Daily Financial Inputs Table */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5 break-inside-avoid">
                <div className="flex items-center gap-2 text-teal-800 border-b border-slate-100 pb-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600 font-extrabold text-lg">3</div>
                  <h4 className="font-bold text-xl">جدول المدخلات المالية اليومية (Daily Financial Inputs Table)</h4>
                </div>
                
                <p className="text-sm text-slate-600 leading-relaxed">
                  يُعد هذا الجدول الجزء الأكثر أهمية واستخداماً في الصفحة. يعرض التفنيد المالي اليومي الكامل لكل أيام الشهر، محددة بالتاريخ واسم اليوم، حيث يتم تجميع الحركة المالية أوتوماتيكياً من إغلاقات وفواتير اليوم.
                </p>

                {/* System Mockup for the Daily Financial Inputs Table */}
                <div className="my-6">
                  <div className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-teal-600" />
                    صورة توضيحية احترافية مقتبسة من جدول المدخلات المالية اليومية بالنظام:
                  </div>
                  <DailyFinancialInputsMockup />
                </div>

                <div className="space-y-4 pt-2">
                  <h5 className="font-bold text-slate-800 text-base border-b border-slate-100 pb-2">
                    شرح مفصل لجميع أعمدة ومكونات الجدول:
                  </h5>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-700">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                      <div className="font-bold text-teal-900 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-teal-600"></span>
                        1. عمود التاريخ واليوم (Date & Day Name)
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed pr-4">
                        يعرض رقم اليوم والشهر مقترناً باسم اليوم باللغة العربية (مثل: 15 يوليو - الأربعاء). يساعد الإدارة على معرفة أيام الذروة وأيام الإجازات الأسبوعية وتتبع الحركة التاريخية.
                      </p>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-800"></span>
                        2. عمود إجمالي الفواتير (Total Daily Invoices)
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed pr-4">
                        يمثل المجموع الكلي لقيم جميع الفواتير التي تم إصدارها خلال ذلك اليوم. يعتبر المؤشر القياسي لإنتاجية العمل قبل خصم المصاريف أو الديون.
                      </p>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                      <div className="font-bold text-emerald-900 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                        3. المقبوضات النقدية (الكاش بالصندوق)
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed pr-4">
                        المبالغ النقدية الكاش الورقية والمعدنية التي تم تسليمها من العملاء ودخلت مباشرة في درج المكتب الكاشير.
                      </p>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                      <div className="font-bold text-indigo-900 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                        4. التحويلات البنكية والبطاقات (Bank POS)
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed pr-4">
                        الإيرادات غير النقدية التي حُولت مباشرة إلى حساب المكتب في البنك (مثل تطبيق بنك مسقط) أو عبر أجهزة الدفع الآلي بالبطاقات (POS Terminals).
                      </p>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                      <div className="font-bold text-rose-900 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
                        5. المصاريف النثرية والعهد (Daily Expenses)
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed pr-4">
                        أي مبالغ تم صرفها من الكاشير لمصروفات المكاتب التشغيلية (أوراق، حبر، ضيافة، صيانات طارئة) وتم توثيقها في إغلاق ذلك اليوم.
                      </p>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                      <div className="font-bold text-amber-900 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span>
                        6. حالة المطابقة والإغلاق اليومي (Status Badge)
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed pr-4">
                        شارة ملونة توضح الموقوف المالي لليوم:
                        <br />
                        • <strong className="text-emerald-700">✅ مطابق ومغلق:</strong> تم مطابقة الكاش والبنك واعتمد الإغلاق.
                        <br />
                        • <strong className="text-amber-700">⏳ غير مغلق:</strong> لا تزال هناك فواتير نشطة لم يتم مطابقة صندوقها بعد.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 4: Inspecting Specific Day Operations */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5 break-inside-avoid">
                <div className="flex items-center gap-2 text-teal-800 border-b border-slate-100 pb-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600 font-extrabold text-lg">4</div>
                  <h4 className="font-bold text-xl">ميزة تحديد يوم معين والاطلاع على كافة عمليات ذلك اليوم (Drill-Down)</h4>
                </div>

                <p className="text-sm text-slate-600 leading-relaxed">
                  من أهم المميزات النوعية في النظام هي إمكانية <strong>الضغط على أي يوم في الجدول</strong> أو النقر على زر <strong className="text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">🔍 عرض عمليات اليوم</strong>. فور الضغط، تنبثق شاشة تفصيلية مكبرة (Modal/Drawer) تظهر كشف الحساب والدفتر الكامل لذلك اليوم تحديداً.
                </p>

                {/* System Mockup for Day Operations Popup */}
                <div className="my-6">
                  <div className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-teal-600" />
                    صورة توضيحية احترافية مقتبسة لنافذة تفاصيل كشف عمليات اليوم المحدد:
                  </div>
                  <DayOperationsModalMockup />
                </div>

                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4 text-sm text-slate-700">
                  <h5 className="font-bold text-teal-800 text-base flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-teal-600" />
                    ماذا تتيح لك نافذة تفاصيل اليوم؟
                  </h5>
                  <ul className="space-y-2.5 text-xs sm:text-sm list-disc list-inside text-slate-700 leading-relaxed">
                    <li><strong>كشف شامل بجميع الفواتير:</strong> استعراض كل فاتورة صدرت في هذا اليوم مع أرقام الفواتير المتسلسلة (مثل #INV-1042).</li>
                    <li><strong>التوقيت الدقيق:</strong> معرفة الوقت بالساعة والدقيقة الذي صُدرت فيه كل فاتورة (مثل 10:15 ص).</li>
                    <li><strong>اسم العميل والخدمة:</strong> معرفة العميل المستفيد (مؤسسة أو فرد) وتصنيف المعاملة (طباعة، تخليص، ترجمة).</li>
                    <li><strong>تفنيد طريقة الدفع:</strong> معرفة ما إذا كانت الفاتورة دُفعت كاش، أو عبر تحويل بنكي (بنك مسقط)، أو بطاقة شبكة POS.</li>
                    <li><strong>تبويبات الفلترة السريعة:</strong> يمكنك الضغط على تبويب <em>"كاش"</em> لعرض فواتير الكاش فقط، أو <em>"بنك مسقط"</em> لعرض التحويلات البنكية فقط لمطابقتها مع تطبيق البنك على هاتفك.</li>
                    <li><strong>شريط المجاميع السفلية:</strong> إظهار صافي المبيعات النقدية والبنكية والإجمالي الدقيق لهذا اليوم بشكل مستقل.</li>
                  </ul>
                </div>
              </div>

              {/* SECTION 5: Interactive Charts Explanation */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5 break-inside-avoid">
                <div className="flex items-center gap-2 text-teal-800 border-b border-slate-100 pb-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600 font-extrabold text-lg">5</div>
                  <h4 className="font-bold text-xl">شرح الرسوم البيانية والتحليلات البصرية للشهر</h4>
                </div>

                <p className="text-sm text-slate-600 leading-relaxed">
                  لتحويل البيانات الرقمية المعقدة إلى معرفة سهلة الاستيعاب، يقدم التقرير الشهري رسوماً بيانية تفاعلية تدعم التمرير بالماوس (Hover Effects) لإظهار التفاصيل.
                </p>

                {/* System Mockup for Charts */}
                <div className="my-6">
                  <div className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-teal-600" />
                    صورة توضيحية احترافية مقتبسة للرسوم البيانية والتحليلات البصرية:
                  </div>
                  <MonthlyChartsMockup />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-700">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                    <h5 className="font-bold text-slate-800 flex items-center gap-2 text-base">
                      <BarChart className="w-5 h-5 text-teal-600" />
                      1. رسم مؤشر نمو المبيعات اليومية (Daily Revenue Bar Chart)
                    </h5>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      يعرض أعمدة بيانية صاعدة لكل أيام الشهر. العمود الأطول يمثل يوم أوج النشاط التجاري (القمة). عند تحريك الماوس فوق أي عمود يظهر صندوق معلومات شفاف يحتوي على إجمالي الدخل المالي المنجز في هذا اليوم بالتحديد.
                    </p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                    <h5 className="font-bold text-slate-800 flex items-center gap-2 text-base">
                      <Activity className="w-5 h-5 text-indigo-600" />
                      2. مخطط توزيع المبيعات حسب نوع الخدمة (Service Donut Chart)
                    </h5>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      مخطط دائرى ملون يوضح نسب مساهمة الخدمات المختلفة في الدخل الإجمالي (مثلاً: خدمات التخليص 45%، خدمات الطباعة 40%، خدمات الترجمة 15%). يتيح للإدارة معرفة أكثر الخدمات ربحية للتركيز عليها.
                    </p>
                  </div>
                </div>
              </div>

              {/* SECTION 6: Practical Scenario */}
              <div className="bg-amber-50 rounded-2xl p-6 sm:p-8 border border-amber-200 mt-10 break-inside-avoid relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200/40 rounded-full blur-3xl -mr-10 -mt-10"></div>
                <h3 className="font-bold text-2xl text-amber-900 mb-5 flex items-center gap-3 border-b border-amber-200/50 pb-4 relative z-10">
                  <Sparkles className="w-7 h-7 text-amber-600 animate-pulse" />
                  سيناريو عملي واقعي (تدقيق مبيعات منتصف الشهر وتحديد يوم معين)
                </h3>
                
                <div className="bg-white p-5 rounded-xl border border-amber-200 shadow-sm mb-6 relative z-10 text-right">
                  <p className="text-base text-slate-800 leading-relaxed font-medium">
                    <strong>السيناريو الواقعي:</strong> في منتصف شهر يوليو، لاحظ مالك مكتب سند أن إجمالي مبيعات البنك في حسابه أعلى بكثير من النقد، وأراد التأكد من عمليات يوم <strong>15 يوليو</strong> تحديداً ومطابقة تحويلات بنك مسقط المعلقة مع فواتير المكتب المطبوعة. كيف يتم ذلك خطوة بخطوة في النظام؟
                  </p>
                </div>

                <div className="space-y-4 text-sm text-slate-700 relative z-10 pl-6">
                  <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-2xs space-y-2">
                    <div className="font-bold text-amber-900 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-xs">1</span>
                      الدخول والتصفية
                    </div>
                    <p className="text-xs text-slate-600 pr-8">
                      يتوجه صاحب العمل إلى قائمة <strong>التقارير الشهريّة</strong>، ويحدد الشهر الحالي "يوليو 2026" والفرع "فرع البريمي".
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-2xs space-y-2">
                    <div className="font-bold text-amber-900 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-xs">2</span>
                      تحديد يوم 15 يوليو من جدول المدخلات المالية
                    </div>
                    <p className="text-xs text-slate-600 pr-8">
                      ينزل لجدول <strong>المدخلات المالية اليومية</strong>، ويبحث عن صف تاريخ "15 يوليو (الأربعاء)". يجد المجموع 245.000 ر.ع مقسمة إلى (120 كاش و 125 بنك/بطاقة).
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-2xs space-y-2">
                    <div className="font-bold text-amber-900 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-xs">3</span>
                      النقر للاطلاع على عمليات اليوم واختيار فلتر البنك
                    </div>
                    <p className="text-xs text-slate-600 pr-8">
                      ينقر المالك على زر <strong>"🔍 عرض عمليات اليوم"</strong> في صف 15 يوليو. تفتح النافذة المنبثقة الشاملة. يضغط المالك على تبويب <strong>"بنك مسقط"</strong> فتظهر الفواتير التي دُفعت تحويلاً فقط.
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-2xs space-y-2">
                    <div className="font-bold text-amber-900 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">4</span>
                      التصدير والنتيجة
                    </div>
                    <p className="text-xs text-slate-600 pr-8">
                      يطابق المالك الفاتورة #INV-1042 للعميل "شركة المدار" بقيمة 45 ر.ع مع إشعار البنك على الهاتف فوراً. بعد الاطمئنان، يغلق النافذة وينقر على زر <strong>"تصدير كـ Excel"</strong> للاحتفاظ بالسجل.
                    </p>
                  </div>

                  <div className="mt-4 p-3 bg-amber-100 text-amber-800 rounded-lg font-bold border border-amber-200 text-center text-xs">
                    النتيجة: تمت عملية التدقيق المالي وفحص الفواتير اليومية بدقة وشفافية متناهية خلال أقل من دقيقتين.
                  </div>
                </div>
              </div>

            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-8 animate-in fade-in duration-500 print:space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4 chapter-page break-inside-avoid">
              <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
                <Settings className="w-6 h-6 animate-spin-slow" />
              </div>
              <div>
                <h2 className="text-3xl font-black text-slate-800">إعدادات النظام والتحكم المتقدمة</h2>
                <p className="text-slate-500 text-sm mt-0.5">التحكم في الهيكل التنظيمي للمؤسسة، الفروع، صلاحيات الموظفين، والتذاكر الداخلية</p>
              </div>
            </div>
            
            <div className="bg-teal-50/40 rounded-2xl p-6 border border-teal-100/60 leading-relaxed text-slate-700 break-inside-avoid">
              <h3 className="text-xl font-bold text-teal-800 mb-2 flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-teal-600" />
                مقدمة: فلسفة التحكم المركزي في نظام سـند
              </h3>
              <p className="text-sm">
                تُعتبر لوحة الإعدادات بمثابة <strong>"برج المراقبة"</strong> للنظام بأكمله. تم تصميم هذا القسم ليمنح الإدارة العليا السيطرة الكاملة والمرونة المطلقة في تعديل سلوك النظام دون الحاجة لتدخل برمجي. سواء كنت ترغب في افتتاح فرع جديد، تعيين مسؤول عن تذاكر الصيانة واللوجستيات، تتبع تحركات الموظفين عبر الفروع، أو اختبار مستويات الأمان بصفتك مديراً، فإن هذا الدليل يوفر لك تفصيلاً دقيقاً لكل صندوق وخيار.
              </p>
            </div>

            <div className="space-y-8">
              
              {/* SECTION 1 */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 break-inside-avoid">
                <div className="flex items-center gap-2 text-teal-800 border-b border-slate-100 pb-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600 font-extrabold text-lg">1</div>
                  <h4 className="font-bold text-xl">محاكي اختبار الموظفين والصلاحيات</h4>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  يقع هذا الصندوق في الجزء العلوي لتسهيل مهمة المشرفين والمدراء. يتيح لك <strong>التقمص اللحظي</strong> لشخصية أي موظف مسجل بالنظام لمعاينة ما يراه، واختبار مدى فعالية الصلاحيات الممنوحة له وكأنه يستخدم جهازه الشخصي.
                </p>
                <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-4 text-center my-4">
                  <div className="bg-white p-3 rounded-lg border border-slate-200 inline-block text-right text-xs mx-auto shadow-sm w-full max-w-md">
                    <div className="bg-teal-800 text-white p-2 rounded flex justify-between items-center mb-3">
                      <span className="font-bold text-sm">وضع المحاكاة النشط</span>
                      <span className="bg-teal-600 px-2 py-0.5 rounded text-[10px]">مسؤول النظام</span>
                    </div>
                    <div className="space-y-2">
                       <div className="flex items-center gap-2 p-2 border border-teal-500 rounded bg-teal-50">
                         <div className="w-3 h-3 rounded-full bg-teal-500 animate-pulse"></div>
                         <div><div className="font-bold text-teal-900 text-sm">أحمد العبري</div><div className="text-[11px] text-teal-600">الفرع الرئيسي</div></div>
                       </div>
                       <div className="flex items-center gap-2 p-2 border border-slate-200 rounded">
                         <div className="w-3 h-3 rounded-full bg-slate-300"></div>
                         <div><div className="font-bold text-slate-700 text-sm">مريم البلوشي</div><div className="text-[11px] text-slate-400">فرع صلالة</div></div>
                       </div>
                    </div>
                  </div>
                </div>
                <div className="bg-teal-50 p-4 rounded-xl border border-teal-100 flex gap-3 items-start">
                  <Info className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-bold text-teal-800 mb-1">مثال تطبيقي:</h3>
                    <p className="text-slate-700 text-sm leading-relaxed">
                      قبل إعطاء الصلاحيات لموظف الاستقبال الجديد، يقوم المدير باختيار اسمه من المحاكي، للتأكد من أن تقارير المبيعات الشهرية الخاصة بالموظفين الآخرين مخفية عنه تماماً.
                    </p>
                  </div>
                </div>
              </div>

              {/* SECTION 2 */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 break-inside-avoid">
                <div className="flex items-center gap-2 text-teal-800 border-b border-slate-100 pb-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600 font-extrabold text-lg">2</div>
                  <h4 className="font-bold text-xl">إدارة المستخدمين وصلاحيات الوصول التفصيلية</h4>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  التحكم الموديولي (Modular Control) يعطيك أزرار تشغيل/إيقاف لكل ميزة في النظام. بدلاً من الصلاحيات الجامدة، يمكنك تخصيص ما يراه وما لا يراه كل مستخدم بشكل فردي من خلال جدول واضح.
                </p>
                <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-4 text-center my-4">
                  <div className="overflow-x-auto bg-white border border-slate-200 rounded-lg shadow-sm">
                    <table className="w-full text-right border-collapse text-xs sm:text-sm">
                      <thead className="bg-slate-100 text-slate-700 font-bold">
                        <tr>
                          <th className="p-3 border-b border-slate-200 resize-x overflow-auto">الموظف</th>
                          <th className="p-3 border-b border-slate-200 resize-x overflow-auto">إصدار الفواتير</th>
                          <th className="p-3 border-b border-slate-200 resize-x overflow-auto">حذف السجلات</th>
                        </tr>
                      </thead>
                      <tbody className="text-slate-600">
                        <tr>
                          <td className="p-3 border-b border-slate-100 font-bold text-slate-800">علي الهنائي</td>
                          <td className="p-3 border-b border-slate-100"><span className="text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full font-bold inline-flex items-center gap-1">✅ مفعل</span></td>
                          <td className="p-3 border-b border-slate-100"><span className="text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full font-bold inline-flex items-center gap-1">✅ مفعل</span></td>
                        </tr>
                        <tr>
                          <td className="p-3 font-bold text-slate-800">فاطمة الشكيلية</td>
                          <td className="p-3"><span className="text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full font-bold inline-flex items-center gap-1">✅ مفعل</span></td>
                          <td className="p-3"><span className="text-rose-700 bg-rose-100 px-3 py-1 rounded-full font-bold inline-flex items-center gap-1">❌ معطل</span></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* SECTION 3 */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 break-inside-avoid">
                <div className="flex items-center gap-2 text-teal-800 border-b border-slate-100 pb-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600 font-extrabold text-lg">3</div>
                  <h4 className="font-bold text-xl">إدارة الفروع المتعددة ونقل الموظفين ديناميكياً</h4>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  إذا كان مكتبك يمتلك عدة فروع، يمكنك إدارة عناوينها وأرقام التواصل الخاصة بها لطباعتها تلقائياً على ترويسة فواتير الفرع. والأهم هو إمكانية <strong>نقل الموظفين بين الفروع</strong> بضغطة زر وتوجيه تقاريرهم المستقبلية للفرع الجديد.
                </p>
                <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-4 text-center my-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="bg-white p-4 rounded-xl border border-slate-200 text-right shadow-sm text-sm">
                       <h5 className="font-bold text-slate-800 mb-3 border-b border-slate-100 pb-2">إضافة فرع جديد</h5>
                       <div className="space-y-3">
                         <div className="bg-slate-50 border border-slate-200 p-2 rounded text-slate-600">اسم الفرع: فرع الخوض</div>
                         <div className="bg-slate-50 border border-slate-200 p-2 rounded text-slate-600">العنوان: شارع السلطان قابوس...</div>
                         <div className="bg-teal-600 text-white text-center rounded p-2 font-bold cursor-pointer">حفظ بيانات الفرع</div>
                       </div>
                     </div>
                     <div className="bg-white p-4 rounded-xl border border-slate-200 text-right shadow-sm text-sm">
                       <h5 className="font-bold text-slate-800 mb-3 border-b border-slate-100 pb-2">نقل موظف لفرع آخر</h5>
                       <div className="space-y-3">
                         <div className="bg-slate-50 border border-slate-200 p-2 rounded text-slate-600 flex justify-between items-center"><span>الموظف:</span> <strong className="text-slate-800">سالم (محاسب)</strong></div>
                         <div className="bg-slate-50 border border-slate-200 p-2 rounded text-slate-600 flex justify-between items-center"><span>الفرع المستهدف:</span> <strong className="text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">فرع الخوض ▼</strong></div>
                         <div className="bg-indigo-600 text-white text-center rounded p-2 font-bold cursor-pointer">تنفيذ عملية النقل</div>
                       </div>
                     </div>
                  </div>
                </div>
              </div>

              {/* SECTION 4 */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 break-inside-avoid">
                <div className="flex items-center gap-2 text-teal-800 border-b border-slate-100 pb-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600 font-extrabold text-lg">4</div>
                  <h4 className="font-bold text-xl">إضافة مستخدم جديد للنظام (التسجيل الآمن)</h4>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  يضمن هذا النموذج إنشاء ملف شخصي متكامل للموظف الجديد، مع تأكيد عدم تكرار "اسم المستخدم" لضمان تسجيل الدخول السلس دون تداخلات تقنية.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-slate-700 bg-slate-50 p-5 border border-slate-200 rounded-xl">
                  <div className="flex gap-2 items-start"><div className="w-1.5 h-1.5 bg-teal-500 rounded-full mt-2 shrink-0"></div><div><strong>الاسم الكامل:</strong> الاسم الرسمي الذي يظهر للعملاء على الفواتير المطبوعة.</div></div>
                  <div className="flex gap-2 items-start"><div className="w-1.5 h-1.5 bg-teal-500 rounded-full mt-2 shrink-0"></div><div><strong>اسم المستخدم (Username):</strong> المعرف الفريد بالإنجليزية للدخول (مثل Ali2023).</div></div>
                  <div className="flex gap-2 items-start"><div className="w-1.5 h-1.5 bg-teal-500 rounded-full mt-2 shrink-0"></div><div><strong>كلمة المرور:</strong> مشفرة لحماية الحساب من الاختراق المتبادل.</div></div>
                  <div className="flex gap-2 items-start"><div className="w-1.5 h-1.5 bg-teal-500 rounded-full mt-2 shrink-0"></div><div><strong>الفرع الافتراضي:</strong> موقع العمل الرئيسي الذي تُسجل عليه فواتير الموظف.</div></div>
                </div>
              </div>

              {/* SECTION 5 */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 break-inside-avoid">
                <div className="flex items-center gap-2 text-teal-800 border-b border-slate-100 pb-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600 font-extrabold text-lg">5</div>
                  <h4 className="font-bold text-xl">إعدادات التذاكر والطلبات الداخلية</h4>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  إدارة شاملة لدورة حياة الطلبات الداخلية (إجازات، دعم فني، مشتريات). تتيح لك إعادة ترتيب أقسام التذاكر عبر ميزة <strong>السحب والإفلات (Drag & Drop)</strong> لرفع الأهمية، وتعيين مديرين مسؤولين (Ticket Managers) للرد على فئات محددة من التذاكر.
                </p>
                <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-4 text-center my-4">
                  <div className="bg-white border border-slate-200 rounded-xl max-w-md mx-auto overflow-hidden shadow-sm text-right">
                     <div className="p-3 border-b border-slate-100 flex items-center justify-between cursor-move hover:bg-slate-50 transition-colors">
                       <div className="flex items-center gap-3"><span className="text-slate-400 cursor-grab">☰</span> <span className="text-sm font-bold text-slate-700">تذاكر الدعم الفني وتقنية المعلومات</span></div>
                       <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-1 rounded">المرتبة 1</span>
                     </div>
                     <div className="p-3 border-b border-slate-100 flex items-center justify-between cursor-move bg-teal-50/50 border-l-4 border-l-teal-500 transition-colors">
                       <div className="flex items-center gap-3"><span className="text-teal-500 cursor-grab">☰</span> <span className="text-sm font-bold text-teal-900">طلبات الإجازات والسلف المباشرة</span></div>
                       <span className="text-[10px] text-teal-600 font-bold bg-teal-100 px-2 py-1 rounded border border-teal-200">المرتبة 2 (يتم سحبها للأعلى)</span>
                     </div>
                     <div className="p-3 flex items-center justify-between cursor-move hover:bg-slate-50 transition-colors">
                       <div className="flex items-center gap-3"><span className="text-slate-400 cursor-grab">☰</span> <span className="text-sm font-bold text-slate-700">الصيانة والمشتريات المكتبية</span></div>
                       <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-1 rounded">المرتبة 3</span>
                     </div>
                  </div>
                </div>

                <div className="mt-8 border-t border-slate-100 pt-6">
                  <h5 className="font-bold text-teal-800 mb-3 text-lg flex items-center gap-2">
                    <Users className="w-5 h-5 text-teal-600" />
                    إدارة مدراء الطلبات حسب نوع الطلب (Ticket Managers)
                  </h5>
                  <p className="text-sm text-slate-600 leading-relaxed mb-4 text-justify">
                    تتيح لك هذه الميزة الحيوية تخصيص مسؤولين (مدراء) محددين لكل نوع من أنواع التذاكر والطلبات الداخلية بدقة ومرونة. بدلاً من أن تصل جميع طلبات الموظفين للإدارة العليا أو لمدير واحد، يمكنك توجيه كل طلب بشكل آلي للمسؤول المباشر المختص، مما يسرع دورة العمل، يضمن خصوصية وسرية المعلومات، ويرفع من كفاءة الاستجابة.
                  </p>
                  
                  <ul className="text-sm text-slate-700 space-y-3 mb-6 list-disc list-inside">
                    <li><strong>التوجيه الذكي للموارد البشرية:</strong> يمكن توجيه <em>طلبات الإجازات</em> أو <em>تقارير التأخير</em> تلقائياً إلى مدير الموارد البشرية (HR).</li>
                    <li><strong>الاستجابة التقنية المباشرة:</strong> يتم توجيه <em>تذاكر الدعم الفني وتقنية المعلومات</em> مباشرة لفريق الـ IT لحل الأعطال بسرعة دون تدخل إداري.</li>
                    <li><strong>الاعتمادات المالية:</strong> يتم توجيه <em>طلبات السلف، العهد المباشرة، والمشتريات</em> للمدير المالي لمراجعتها واعتمادها.</li>
                  </ul>

                  <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-4 sm:p-6 text-center">
                    <p className="text-xs text-slate-500 mb-4 font-semibold text-right flex items-center gap-2"><Sparkles className="w-4 h-4 text-amber-500"/> واجهة تخصيص مدراء التذاكر من النظام</p>
                    <div className="bg-white border border-slate-200 rounded-xl mx-auto overflow-hidden shadow-sm text-right">
                      {/* Header */}
                      <div className="bg-slate-50 border-b border-slate-200 p-4 flex justify-between items-center">
                        <div className="font-bold text-slate-700 text-sm">تخصيص مدراء التذاكر والطلبات</div>
                        <button className="bg-teal-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow-sm">حفظ التغييرات</button>
                      </div>
                      
                      {/* Request Type 1 */}
                      <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                        <div>
                          <div className="font-bold text-slate-800 text-sm flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                            طلبات الإجازات والسلف
                          </div>
                          <div className="text-xs text-slate-500 mt-1.5 pr-4">المسؤول عن مراجعة واعتماد إجازات الموظفين وسلفهم</div>
                        </div>
                        <div className="min-w-[220px]">
                          <div className="w-full bg-white border border-slate-200 hover:border-teal-400 rounded-lg p-2.5 flex items-center justify-between cursor-pointer shadow-sm transition-colors">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center font-bold text-xs">م</div>
                              <span className="text-sm text-slate-700 font-medium">مدير الموارد البشرية (HR)</span>
                            </div>
                            <div className="text-slate-400 text-xs">▼</div>
                          </div>
                        </div>
                      </div>

                      {/* Request Type 2 */}
                      <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                        <div>
                          <div className="font-bold text-slate-800 text-sm flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                            تذاكر الدعم الفني وتقنية المعلومات
                          </div>
                          <div className="text-xs text-slate-500 mt-1.5 pr-4">المسؤول عن صيانة الأجهزة وحل المشاكل التقنية للأنظمة</div>
                        </div>
                        <div className="min-w-[220px]">
                          <div className="w-full bg-white border border-slate-200 hover:border-teal-400 rounded-lg p-2.5 flex items-center justify-between cursor-pointer shadow-sm transition-colors">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-xs">IT</div>
                              <span className="text-sm text-slate-700 font-medium">فريق الدعم الفني (IT)</span>
                            </div>
                            <div className="text-slate-400 text-xs">▼</div>
                          </div>
                        </div>
                      </div>
                      
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 6 */}
              <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-lg space-y-4 break-inside-avoid border border-slate-800">
                <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                  <div className="w-10 h-10 bg-teal-500/20 text-teal-400 rounded-xl flex items-center justify-center font-black text-xl">
                    6
                  </div>
                  <h4 className="font-bold text-xl text-teal-400">سجل الأنشطة والمساءلة (Audit & Activity Logs)</h4>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  يسجل النظام كل نقرة وحركة يقوم بها أي مستخدم لضمان أعلى درجات الشفافية. لا يستطيع أي موظف تعديل هذا السجل، وهو المرجع النهائي لأي تدقيق مالي أو إداري لمعرفة "من قام بماذا ومتى".
                </p>
                <div className="bg-slate-950 p-5 rounded-xl border border-slate-800/80 font-mono text-xs sm:text-sm text-emerald-400 space-y-3 shadow-inner mt-4">
                  <div className="border-b border-slate-900/50 pb-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    <span className="text-slate-400 bg-slate-900 px-2 py-1 rounded w-fit">[12:15:23 PM] أحمد العبري</span>
                    <span className="text-teal-400">إنشاء فاتورة جديدة بقيمة 120 ريال</span>
                  </div>
                  <div className="border-b border-slate-900/50 pb-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    <span className="text-slate-400 bg-slate-900 px-2 py-1 rounded w-fit">[12:18:41 PM] مريم البلوشي</span>
                    <span className="text-amber-400">تعديل حالة الدفع للفاتورة #1029</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    <span className="text-slate-400 bg-slate-900 px-2 py-1 rounded w-fit">[12:22:10 PM] ميريل الكلباني</span>
                    <span className="text-rose-400">حذف مسودة فاتورة غير مسجلة بالخطأ</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Practical Scenario Detailed */}
            <div className="bg-amber-50 rounded-2xl p-6 sm:p-8 border border-amber-200 mt-10 break-inside-avoid relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200/40 rounded-full blur-3xl -mr-10 -mt-10"></div>
              <h3 className="font-bold text-2xl text-amber-900 mb-5 flex items-center gap-3 border-b border-amber-200/50 pb-4 relative z-10">
                <Sparkles className="w-7 h-7 text-amber-600 animate-pulse" />
                سيناريو عملي واقعي متكامل (من واقع مكاتب سند)
              </h3>
              
              <div className="bg-white p-5 rounded-xl border border-amber-200 shadow-sm mb-8 relative z-10 text-right">
                <p className="text-base text-slate-800 leading-relaxed font-medium">
                  <strong>السيناريو:</strong> مكتب "سند للخدمات" قرر افتتاح فرع جديد باسم <strong className="text-amber-700">"فرع البريمي"</strong>. قام المكتب بتعيين موظف جديد ليعمل فيه باسم <strong className="text-amber-700">"سعيد الكعبي"</strong>. الإدارة تريد من سعيد أن يمتلك صلاحية <u className="decoration-amber-400 decoration-2 underline-offset-4">إصدار الفواتير فقط</u>، دون أن يتمكن من حذفها، ودون السماح له بمشاهدة التقارير المالية لفرعه. كيف يتم ذلك برمجياً بخطوات مبسطة في إعدادات النظام؟
                </p>
              </div>

              <div className="space-y-6 text-sm text-slate-700 relative z-10 before:absolute before:right-[23px] before:top-4 before:bottom-4 before:w-1 before:bg-amber-200/70">
                
                <div className="flex gap-4 sm:gap-6 relative z-10 text-right group">
                  <div className="w-12 h-12 rounded-full bg-amber-500 text-white font-black text-xl flex items-center justify-center shrink-0 shadow-md ring-4 ring-amber-100 group-hover:scale-110 transition-transform">1</div>
                  <div className="bg-white p-5 border border-amber-100 rounded-xl flex-1 shadow-sm group-hover:border-amber-300 transition-colors">
                    <h5 className="font-bold text-amber-900 text-lg mb-2">تأسيس الفرع واعتماده مالياً</h5>
                    <p className="text-sm text-slate-600 leading-relaxed">اذهب إلى صندوق <strong>"إدارة الفروع"</strong>، اضغط "إضافة فرع"، اكتب الاسم "فرع البريمي" وأدخل العنوان ورقم التواصل للفرع. بمجرد الحفظ، سيتم اعتماده كفرع رسمي للإيرادات وتخصيص ترويسة فواتير خاصة به.</p>
                  </div>
                </div>
                
                <div className="flex gap-4 sm:gap-6 relative z-10 text-right group">
                  <div className="w-12 h-12 rounded-full bg-amber-500 text-white font-black text-xl flex items-center justify-center shrink-0 shadow-md ring-4 ring-amber-100 group-hover:scale-110 transition-transform">2</div>
                  <div className="bg-white p-5 border border-amber-100 rounded-xl flex-1 shadow-sm group-hover:border-amber-300 transition-colors">
                    <h5 className="font-bold text-amber-900 text-lg mb-2">تسجيل الموظف وربطه بالفرع</h5>
                    <p className="text-sm text-slate-600 leading-relaxed">اذهب لصندوق <strong>"إضافة مستخدم جديد"</strong>، أدخل بيانات سعيد وحدد الفرع الافتراضي له "فرع البريمي" من القائمة المنسدلة. الآن أصبح مسجلاً وجاهزاً للعمل.</p>
                  </div>
                </div>

                <div className="flex gap-4 sm:gap-6 relative z-10 text-right group">
                  <div className="w-12 h-12 rounded-full bg-amber-500 text-white font-black text-xl flex items-center justify-center shrink-0 shadow-md ring-4 ring-amber-100 group-hover:scale-110 transition-transform">3</div>
                  <div className="bg-white p-5 border border-amber-100 rounded-xl flex-1 shadow-sm group-hover:border-amber-300 transition-colors">
                    <h5 className="font-bold text-amber-900 text-lg mb-2">تقنين الصلاحيات (المنع والسماح)</h5>
                    <p className="text-sm text-slate-600 leading-relaxed">من جدول <strong>"إدارة المستخدمين"</strong>، ابحث عن اسم سعيد. قم بالنقر لإلغاء تفعيل أزرار "حذف السجلات" و"رؤية تقارير مالية" لتصبح <span className="text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded">حمراء اللون (معطل)</span> مع إبقاء زر الفواتير مفعلاً.</p>
                  </div>
                </div>

                <div className="flex gap-4 sm:gap-6 relative z-10 text-right group">
                  <div className="w-12 h-12 rounded-full bg-teal-500 text-white font-black text-xl flex items-center justify-center shrink-0 shadow-md ring-4 ring-teal-100 group-hover:scale-110 transition-transform">4</div>
                  <div className="bg-white p-5 border border-teal-200 rounded-xl flex-1 shadow-sm bg-teal-50/40 group-hover:border-teal-400 transition-colors">
                    <h5 className="font-bold text-teal-800 text-lg mb-2">التأكيد النهائي عبر (وضع المحاكاة)</h5>
                    <p className="text-sm text-slate-700 leading-relaxed">تذهب لصندوق <strong>"محاكي الموظفين"</strong> بالأعلى، تختار حساب "سعيد". ستتحول شاشتك فوراً لما سيراه سعيد بالضبط. ستلاحظ اختفاء أزرار الحذف واختفاء صفحة التقارير من شاشتك تماماً. تأكدت من صحة العمل، الآن يمكنك "إنهاء وضع المحاكاة".</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Design Tips */}
            <div className="bg-rose-50 p-6 rounded-2xl border border-rose-200 flex gap-4 items-start break-inside-avoid mt-8">
              <div className="p-3 bg-white rounded-full shadow-sm">
                <AlertTriangle className="w-8 h-8 text-rose-600 animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-rose-800 mb-3 border-b border-rose-200/50 pb-2">إرشادات هامة لأمن النظام والحماية</h3>
                <ul className="list-disc list-inside text-rose-950 text-sm space-y-3 leading-relaxed">
                  <li><strong>صلاحيات الحذف:</strong> يجب أن تقتصر على المدراء العامين حصراً لمنع تسريب الإيرادات أو حذف فواتير مدفوعة.</li>
                  <li><strong>صياغة أسماء المستخدمين:</strong> تجنب تماماً استخدام المسافات أو الرموز الخاصة في اسم المستخدم (Username) لتفادي أخطاء الدخول المتكررة.</li>
                  <li><strong>تنبيه المحاكاة:</strong> تذكر دائماً الضغط على زر <span className="bg-white px-2 py-0.5 rounded border border-rose-200 font-bold">إنهاء وضع المحاكاة</span> باللون الأحمر أعلى الشاشة عند الانتهاء لضمان عودتك لصلاحياتك الكاملة كمدير نظام.</li>
                </ul>
              </div>
            </div>
          </div>
        );

      case 'chat_mail':
        return (
          <div className="space-y-8 animate-in fade-in duration-500 print:space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4 chapter-page break-inside-avoid">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-3xl font-black text-slate-800">قسم البريد والدردشة الخاصة (التواصل الداخلي)</h2>
                <p className="text-slate-500 text-sm mt-0.5">منظومة التواصل الآمن والمراسلات المباشرة بين الموظفين والإدارة</p>
              </div>
            </div>
            
            <div className="bg-indigo-50/40 rounded-2xl p-6 border border-indigo-100/60 leading-relaxed text-slate-700 break-inside-avoid">
              <h3 className="text-xl font-bold text-indigo-900 mb-2 flex items-center gap-2">
                <Info className="w-6 h-6 text-indigo-600" />
                الهدف من نظام البريد والدردشة الداخلي
              </h3>
              <p className="text-sm">
                يوفر قسم التواصل بيئة محصنة وموثوقة لتبادل المراسلات والمستندات وإيصالات التحويل البنكي بين الموظفين والإدارة في كافة الفروع دون الحاجة لاستخدام تطبيقات خارجية، مما يضمن أرشفة كافة الحوارات المرتبطة بالعمل وسرعة اتخاذ القرارات.
              </p>
            </div>

            <div className="space-y-8">
              
              {/* SECTION 1: Private Chat */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 break-inside-avoid">
                <div className="flex items-center gap-2 text-indigo-900 border-b border-slate-100 pb-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-extrabold text-lg">1</div>
                  <h4 className="font-bold text-xl">الدردشة الخاصة المباشرة (Private Chat)</h4>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  تسمح الدردشة الخاصة بالتواصل اللحظي الفوري مع أي موظف في المؤسسة. وتتكون من جزأين رئيسيين:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4 text-sm">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                    <h5 className="font-bold text-slate-800 flex items-center gap-2"><Users className="w-4 h-4 text-indigo-600" /> القائمة الجانبية والمحادثات</h5>
                    <ul className="list-disc list-inside space-y-1 text-slate-600 text-xs">
                      <li><strong>أداة "+ محادثة جديدة":</strong> قائمة منسدلة قابلة للبحث الذكي لاختيار أي موظف وبدء محادثة فورية معه.</li>
                      <li><strong>بحث المحادثات:</strong> تصفية المحادثات القائمة حسب اسم الموظف.</li>
                      <li><strong>مؤشر المحادثة:</strong> إظهار صورة الموظف، المسمى الوظيفي، وتاريخ ومعاينة آخر رسالة مرسلة.</li>
                    </ul>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                    <h5 className="font-bold text-slate-800 flex items-center gap-2"><MessageSquare className="w-4 h-4 text-indigo-600" /> شاشة المحادثة وصندوق الإرسال</h5>
                    <ul className="list-disc list-inside space-y-1 text-slate-600 text-xs">
                      <li><strong>فقاعات المحادثة الملونة:</strong> تظهر الرسائل الصادرة باللون البنفسجي المريح والواردة باللون الأبيض.</li>
                      <li><strong>زر المرفقات (Paperclip):</strong> إرفاق الصور والمستندات مع زر لإلغاء المرفق قبل الإرسال.</li>
                      <li><strong>زر حذف المحادثة:</strong> يظهر حصرياً لمدير النظام (Admin) مع نافذة تأكيد الأمان.</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* SECTION 2: Email Inbox */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 break-inside-avoid">
                <div className="flex items-center gap-2 text-indigo-900 border-b border-slate-100 pb-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-extrabold text-lg">2</div>
                  <h4 className="font-bold text-xl">صندوق البريد الإلكتروني الداخلي (Inbox)</h4>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  يُستخدم الموديول المخصص للبريد الإلكتروني الداخلي لإرسال المراسلات الرسمية والتقارير التي تتطلب توثيقاً وموضوعاً محدداً.
                </p>

                <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-4 my-4">
                  <ChatMailMockup />
                </div>

                <div className="space-y-4 text-sm text-slate-700">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <h5 className="font-bold text-slate-800 mb-2 flex items-center gap-2"><Mail className="w-4 h-4 text-indigo-600" /> مميزات نموذج كتابة رسالة جديدة (Compose Mail):</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                        <strong className="text-indigo-900 block mb-1">المستلم والموضوع</strong>
                        قائمة منسدلة قابلة للبحث لاختيار الموظف المستلم وحقل مخصص لموضوع الرسالة.
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                        <strong className="text-indigo-900 block mb-1">📋 لصق الصور المباشر (Paste Image)</strong>
                        يمكنك نسخ أي صورة أو لقطة شاشة ولصقها فوراً بحافظة النظام (Ctrl+V) لتصبح مرفقاً تلقائياً!
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                        <strong className="text-indigo-900 block mb-1">😊 منتقي الرموز التعبيرية (Emoji Picker)</strong>
                        لوحة تفاعلية تضم 15 رمزاً تعبيرياً لإضفاء المرونة والوضوح على الرسائل الإدارية.
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                        <strong className="text-indigo-900 block mb-1">📎 المرفقات المتعددة</strong>
                        دعم رفع ملفات متعددة ومستندات وصور مع شارات توضيح لكل ملف وزر حذف قبل الإرسال.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 3: Practical Scenario */}
              <div className="bg-indigo-50 rounded-2xl p-6 sm:p-8 border border-indigo-200 mt-8 break-inside-avoid relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-200/40 rounded-full blur-3xl -mr-10 -mt-10"></div>
                <h3 className="font-bold text-2xl text-indigo-900 mb-5 flex items-center gap-3 border-b border-indigo-200/50 pb-4 relative z-10">
                  <Sparkles className="w-7 h-7 text-indigo-600 animate-pulse" />
                  سيناريو عملي واقعي (تأكيد التحويلات المالية)
                </h3>
                
                <div className="bg-white p-5 rounded-xl border border-indigo-100 shadow-sm mb-6 relative z-10 text-right text-sm text-slate-800 leading-relaxed">
                  <p>
                    <strong>الموقف:</strong> قامت موظفة الاستقبال "مريم" بتخليص معاملة تجديد سجل تجاري لعميل، وقام العميل بدفع المبلغ بقيمة <strong className="text-indigo-700">45 ريالاً</strong> عبر تحويل بنكي مباشر. مريم تريد تأكيد القيد المالي مع المحاسب "أحمد".
                  </p>
                </div>

                <div className="space-y-4 text-sm text-slate-700 relative z-10 text-right">
                  <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0">1</div>
                    <p>تفتح مريم قسم <strong>"البريد والدردشة"</strong> وتختار تبويب <strong>"صندوق البريد"</strong>، ثم تضغط على زر <strong className="text-indigo-600">"+ رسالة جديدة"</strong>.</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0">2</div>
                    <p>تختار المحاسب "أحمد العبري" من القائمة المنسدلة، وتكتب الموضوع "تأكيد إيصال تحويل السجل التجاري"، وتقوم بلصق لقطة شاشة إيصال البنك مباشرة داخل خانة المحتوى عبر <code className="bg-slate-100 text-indigo-600 px-2 py-0.5 rounded">Ctrl+V</code>، ثم تضغط <strong>"إرسال"</strong>.</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0">3</div>
                    <p>يستلم المحاسب أحمد الرسالة في صندوق البريد الوارد، ويقوم بفتح تبويب <strong>"الدردشة الخاصة"</strong> للرد الفوري على مريم: "تم التحقق وتأكيد استلام المبلغ في كشف البنك".</p>
                  </div>
                </div>
              </div>

              {/* Design & Safety Notes */}
              <div className="bg-amber-50 p-6 rounded-2xl border border-amber-200 flex gap-4 items-start break-inside-avoid">
                <AlertTriangle className="w-8 h-8 text-amber-600 shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-bold text-amber-900 mb-2">إرشادات وأمن التواصل الداخلي</h3>
                  <ul className="list-disc list-inside text-amber-900 text-sm space-y-1.5 leading-relaxed">
                    <li><strong>سرية الرسائل:</strong> جميع الرسائل الخاصة والبريد مؤرشفة ومحفوظة ضمن قاعدة البيانات الموحدة للمؤسسة.</li>
                    <li><strong>صلاحيات الحذف:</strong> تقتصر إمكانية مسح المحادثات والرسائل البريدية على مدراء النظام لضمان الشفافية.</li>
                  </ul>
                </div>
              </div>

            </div>
          </div>
        );

      case 'profile':
        return (
          <div className="space-y-8 animate-in fade-in duration-500 print:space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4 chapter-page break-inside-avoid">
              <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-3xl font-black text-slate-800">قسم الملف الشخصي والموارد البشرية (Profile & HR)</h2>
                <p className="text-slate-500 text-sm mt-0.5">الدليل الكامل لإدارة بيانات الموظف، سجل المخالفات والإنذارات، المستندات الرسمية، والأمان</p>
              </div>
            </div>
            
            <div className="bg-teal-50/40 rounded-2xl p-6 border border-teal-100/60 leading-relaxed text-slate-700 break-inside-avoid">
              <h3 className="text-xl font-bold text-teal-800 mb-2 flex items-center gap-2">
                <Info className="w-6 h-6 text-teal-600" />
                الهدف من قسم الملف الشخصي
              </h3>
              <p className="text-sm">
                يمثل هذا القسم الهوية الرقمية الشاملة لكل موظف في منصة سند. فهو يجمع بين حفظ البيانات الوظيفية والشخصية، إدارة المستندات والعقود الرسمية، متابعة سجل الإنذارات والمخالفات وفق اللائحة التنظيمية، استعراض المبيعات والأداء المالي للموظف، وتأمين الحساب وتغيير كلمات المرور بسهولة.
              </p>
            </div>

            <div className="space-y-8">
              
              {/* SECTION 1: Header and User Switcher */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 break-inside-avoid">
                <div className="flex items-center gap-2 text-teal-800 border-b border-slate-100 pb-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600 font-extrabold text-lg">1</div>
                  <h4 className="font-bold text-xl">رأس الصفحة وأداة التبديل بين الموظفين (Admin/HR View)</h4>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  في أعلى واجهة الملف الشخصي، يظهر هيدر عريض أنيق بلون داكن يعرض صورة الموظف واسمه ومسماه الوظيفي. 
                  للمدراء ومسؤولي الموارد البشرية (Admin / HR)، تتوفر <strong>قائمة منسدلة ذكية</strong> تتيح اختيار أي موظف في النظام لمعاينة ملفه الشخصي كاملاً، إضافة إنذارات له، أو إدارة مستنداته الرسمية.
                </p>
                
                <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-4 my-4">
                  <ProfileSectionMockup />
                </div>
              </div>

              {/* SECTION 2: Detailed Tabs Breakdown */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6 break-inside-avoid">
                <div className="flex items-center gap-2 text-teal-800 border-b border-slate-100 pb-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600 font-extrabold text-lg">2</div>
                  <h4 className="font-bold text-xl">شرح تبوابات وأجزاء الملف الشخصي الخمسة</h4>
                </div>

                <div className="space-y-6 text-sm text-slate-700">
                  {/* Tab 1 */}
                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-3">
                    <h5 className="font-bold text-teal-800 text-base flex items-center gap-2">
                      <Users className="w-5 h-5 text-teal-600" /> 1. تبويب "معلوماتي الشخصية" (Personal Information)
                    </h5>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      يعرض جميع البيانات الوظيفية والشخصية المسجلة للموظف في جدول شبكي منظم:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 text-xs">
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200"><strong>الإسم الثلاثي & المسمى:</strong> الاسم الكامل والرتبة الوظيفية المعتمدة.</div>
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200"><strong>الفرع & الرقم الوظيفي:</strong> الفرع التابع له الموظف ورقم القيد الوظيفي.</div>
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200"><strong>تاريخ التعيين والتسجيل:</strong> تاريخ الالتحاق وتاريخ التسجيل بالنظام.</div>
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200"><strong>رقم التواصل والجهة:</strong> الهواتف المسجلة ورقم أحد الأقارب للطوارئ.</div>
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200"><strong>رقم المقعد / الجهاز:</strong> رقم المحطة أو الكاونتر المخصص للموظف.</div>
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200"><strong>الصورة الشخصية:</strong> زر الكاميرا لرفع وتحديث صورة الموظف الرمزية.</div>
                    </div>
                    <div className="bg-teal-50 p-3 rounded-lg border border-teal-100 text-xs">
                      <strong className="text-teal-900 block mb-1">📁 إدارة المرفقات والمستندات الرسمية:</strong>
                      يتيح هذا التبويب رفع مستندات "اتفاقية العمل"، "البطاقة الشخصية"، و"المؤهلات العلمية" بصيغ (PDF, Word, Images). يمكن للمدير/HR إضافة ملفات جديدة أو حذف الملفات السابقة، ويقوم النظام تلقائياً بتسجيل تاريخ أحدث تحديث للمستندات!
                    </div>
                  </div>

                  {/* Tab 2 */}
                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-3">
                    <h5 className="font-bold text-rose-800 text-base flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-rose-600" /> 2. تبويب "الإنذارات والمخالفات" (Warnings & Violations)
                    </h5>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      نظام إداري متكامل لإدارة الجزاءات وضبط الانضباط الإداري وفق قانون العمل العُماني واللائحة التنظيمية للمؤسسة:
                    </p>
                    <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-700">
                      <li><strong>صندوق التنويه واللائحة التنظيمية:</strong> يتضمن توضيحاً قانونياً مع زر <span className="text-amber-800 font-bold">"رفع/تحديث اللائحة"</span> المتاح للإدارة لإرفاق أحدث نسخة من لائحة المخالفات وتاريخ التحديث.</li>
                      <li><strong>شريط الفلترة والبحث المتقدم:</strong> إمكانية البحث الفوري بالنص، والفلترة حسب نوع المخالفة، ودرجة الخطورة (<span className="text-emerald-600 font-bold">منخفضة</span>، <span className="text-amber-600 font-bold">متوسطة</span>، <span className="text-rose-600 font-bold">عالية</span>)، والفلترة حسب الموظف.</li>
                      <li><strong>أداة الفرز الذكي (Table Sorting):</strong> إمكانية النقر على أوراق الجدول لفرز البيانات تصاعدياً وتنازلياً حسب الرقم، الموظف، النوع، الدرجة، والتاريخ.</li>
                      <li><strong>زر "إصدار إنذار جديد":</strong> متاح للمدراء وHR لفتح نافذة اختيار الموظف، نوع المخالفة الرئيسي والفرعي، درجة الخطورة، وتفاصيل السلوك.</li>
                      <li><strong>نافذة محادثة الإنذار (Warning Chat Modal):</strong> عند النقر على <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-bold">عرض التفاصيل</span>، تفتح نافذة شات مخصصة تسمح للموظف بتقديم توضيح وإفادة كتابية، وللإدارة بالرد التفاعلي وإرفاق ملف اللائحة.</li>
                    </ul>
                  </div>

                  {/* Tab 3, 4, 5 */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                      <h6 className="font-bold text-slate-800 flex items-center gap-1.5"><Wallet className="w-4 h-4 text-emerald-600" /> 3. تبويب "حسابي"</h6>
                      <p className="text-slate-600">يعرض الراتب الشهري، إجمالي مبيعات الموظف بالفواتير، معدل النمو، والقروض/السلف القائمة، مع رسم بياني تفاعلي لمبيعات الأسابيع.</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                      <h6 className="font-bold text-slate-800 flex items-center gap-1.5"><Briefcase className="w-4 h-4 text-blue-600" /> 4. المهارات والخبرات</h6>
                      <p className="text-slate-600">استعراض السيرة الذاتية والمهارات الفنية والإدارية للموظف والشهادات المعتمدة.</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                      <h6 className="font-bold text-slate-800 flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-teal-600" /> 5. الأمان وحماية الحساب</h6>
                      <p className="text-slate-600">يتضمن زر <span className="text-teal-700 font-bold">"تغيير كلمة المرور"</span> المباشر لفتح نافذة إدخال كلمة المرور الجديدة وتأمين الحساب.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 3: Practical Scenario */}
              <div className="bg-amber-50 rounded-2xl p-6 sm:p-8 border border-amber-200 mt-8 break-inside-avoid relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200/40 rounded-full blur-3xl -mr-10 -mt-10"></div>
                <h3 className="font-bold text-2xl text-amber-900 mb-5 flex items-center gap-3 border-b border-amber-200/50 pb-4 relative z-10">
                  <BadgeAlert className="w-7 h-7 text-amber-600 animate-pulse" />
                  سيناريو عملي واقعي (إصدار ومناقشة إنذار وظيفي)
                </h3>
                
                <div className="bg-white p-5 rounded-xl border border-amber-200 shadow-sm mb-6 relative z-10 text-right text-sm text-slate-800 leading-relaxed">
                  <p>
                    <strong>السيناريو:</strong> الموظف "سعيد الكعبي" في فرع البريمي تأخر عن الحضور لمكتب سند لمدة ساعتين في بداية الدوام الرسمي دون تقديم إشعار أولي للإدارة.
                  </p>
                </div>

                <div className="space-y-4 text-sm text-slate-700 relative z-10 text-right">
                  <div className="bg-white p-4 rounded-xl border border-amber-100 shadow-sm flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-500 text-white font-bold flex items-center justify-center shrink-0">1</div>
                    <p>تفتح مسؤول الموارد البشرية (HR) قسم <strong>"الملف الشخصي"</strong>، وتختار الموظف "سعيد الكعبي" من القائمة المنسدلة العلوية، ثم تنتقل لتبويب <strong>"الإنذارات والمخالفات"</strong>.</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-amber-100 shadow-sm flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-500 text-white font-bold flex items-center justify-center shrink-0">2</div>
                    <p>تضغط على زر <strong>"إصدار إنذار جديد"</strong>، وتحدد النوع الرئيسي "مخالفات الحضور والانضباط"، والفرعي "تأخير عن الدوام"، ودرجة الإنذار "متوسطة"، وتكتب التوضيح ثم تضغط <strong>"إرسال الإنذار"</strong>.</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-amber-100 shadow-sm flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-500 text-white font-bold flex items-center justify-center shrink-0">3</div>
                    <p>يستلم سعيد شارة تنبيه حمراء متحرّكة على تبويب الإنذارات. يفتح سعيد الإنذار ويضغط <strong>"عرض التفاصيل"</strong> ليكتب إفادته: "أعتذر عن التأخير بسبب عطل مفاجئ بالمركبة وتم إرفاق تقرير الصيانة"، فتقوم مسؤول الموارد البشرية بمراجعة الرد وتأكيد التسوية.</p>
                  </div>
                </div>
              </div>

              {/* Security & Confidentiality */}
              <div className="bg-rose-50 p-6 rounded-2xl border border-rose-200 flex gap-4 items-start break-inside-avoid">
                <ShieldCheck className="w-8 h-8 text-rose-600 shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-bold text-rose-900 mb-2">أمن السرية وحماية بيانات الموظفين</h3>
                  <p className="text-rose-900 text-sm leading-relaxed">
                    تعتبر وثائق العقود والمستندات الرسمية والبطاقات الشخصية وسجلات الراتب والإنذارات بيانات عالية السرية. يمنع النظام تماماً الوصول إليها من قبل الموظفين الآخرين، وتقتصر رؤيتها والتعديل عليها حصرياً على صاحب الحساب والمدراء المعتمدين (Admin / HR).
                  </p>
                </div>
              </div>

            </div>
          </div>
        );

      case 'database':
        return (
          <div className="space-y-8 animate-in fade-in duration-500 print:space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4 chapter-page break-inside-avoid">
              <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-3xl font-black text-slate-800">مركز إدارة قواعد البيانات</h2>
                <p className="text-slate-500 text-sm mt-0.5">مركز الحماية والأمان لحفظ بيانات المؤسسة واستعادتها</p>
              </div>
            </div>
            
            <div className="bg-teal-50/40 rounded-2xl p-6 border border-teal-100/60 leading-relaxed text-slate-700 break-inside-avoid">
              <h3 className="text-xl font-bold text-teal-800 mb-2 flex items-center gap-2">
                <Info className="w-6 h-6 text-teal-600" />
                الهدف من مركز قواعد البيانات
              </h3>
              <p className="text-sm">
                بيانات المكتب هي أهم أصوله. يضمن مركز إدارة قواعد البيانات سلامة وموثوقية معلوماتك بشكل كامل. من خلال هذه الشاشة، يمكنك أخذ نسخ احتياطية (Backups) شاملة لكافة السجلات المالية والإدارية يدوياً، واستعادتها بضغطة زر عند الضرورة أو عند نقل النظام لجهاز جديد، بالإضافة إلى إمكانية أرشفة البيانات القديمة لتسريع النظام.
              </p>
            </div>

            <div className="space-y-8">
              
              {/* SECTION 1 */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 break-inside-avoid">
                <div className="flex items-center gap-2 text-teal-800 border-b border-slate-100 pb-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600 font-extrabold text-lg">1</div>
                  <h4 className="font-bold text-xl">النسخ الاحتياطي اليدوي (Manual Backup)</h4>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  على الرغم من وجود نسخ احتياطي سحابي تلقائي، يُنصح دائماً بأخذ نسخة محلية (ملف) والاحتفاظ بها في قرص صلب خارجي (فلاش أو هارديسك).
                </p>
                
                <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-4 text-center my-4">
                  <div className="flex justify-center gap-4 mt-2">
                    <button className="bg-teal-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-sm"><Download className="w-5 h-5"/> تحميل نسخة كاملة (Backup)</button>
                    <button className="bg-white border border-slate-300 text-slate-700 px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-sm"><Upload className="w-5 h-5"/> استعادة من ملف (Restore)</button>
                  </div>
                </div>
              </div>

              {/* SECTION 2: Practical Scenario */}
              <div className="bg-indigo-50 rounded-2xl p-6 sm:p-8 border border-indigo-200 mt-10 break-inside-avoid relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-200/40 rounded-full blur-3xl -mr-10 -mt-10"></div>
                <h3 className="font-bold text-2xl text-indigo-900 mb-5 flex items-center gap-3 border-b border-indigo-200/50 pb-4 relative z-10">
                  <BadgeAlert className="w-7 h-7 text-indigo-600 animate-pulse" />
                  سيناريو عملي واقعي (تغيير جهاز الكمبيوتر الرئيسي)
                </h3>
                
                <div className="space-y-4 text-sm text-slate-700 relative z-10 pl-6 text-right">
                  <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 font-bold flex items-center justify-center shrink-0">1</div>
                    <p>قرر المالك شراء جهاز كمبيوتر جديد للمكتب. قبل فصل الجهاز القديم، دخل إلى "مركز إدارة قواعد البيانات" وضغط زر <strong>"تحميل نسخة كاملة"</strong>.</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 font-bold flex items-center justify-center shrink-0">2</div>
                    <p>تم تنزيل ملف مشفر بحجم صغير (مثلاً: <code className="bg-slate-100 text-indigo-600 px-2 py-0.5 rounded text-xs">backup-2026-07-16.sened</code>). قام بنقل هذا الملف إلى فلاش (USB).</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 font-bold flex items-center justify-center shrink-0">3</div>
                    <p>في الجهاز الجديد، فتح النظام، دخل للمركز، واختار <strong>"استعادة من ملف"</strong>، وحدد الملف من الفلاش. خلال ثوانٍ، عادت كافة الفواتير والإعدادات والموظفين كما كانت بالضبط.</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        );

      case 'trash':
        return (
          <div className="space-y-8 animate-in fade-in duration-500 print:space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4 chapter-page break-inside-avoid">
              <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-3xl font-black text-slate-800">سلة المحذوفات</h2>
                <p className="text-slate-500 text-sm mt-0.5">شبكة الأمان للملفات المحذوفة وإدارة المساحة</p>
              </div>
            </div>
            
            <div className="bg-teal-50/40 rounded-2xl p-6 border border-teal-100/60 leading-relaxed text-slate-700 break-inside-avoid">
              <h3 className="text-xl font-bold text-teal-800 mb-2 flex items-center gap-2">
                <Info className="w-6 h-6 text-teal-600" />
                آلية عمل الحذف المؤقت
              </h3>
              <p className="text-sm">
                في نظامنا، لا يوجد شيء اسمه "حذف نهائي عن طريق الخطأ". تعمل سلة المحذوفات كشبكة أمان (Soft Delete). عند قيام أي موظف بحذف فاتورة أو تذكرة أو حتى سجل عميل، يختفي من الواجهة الرئيسية وينتقل فوراً إلى هنا. يمكنك مراجعة هذه العناصر واستعادتها بضغطة زر، أو تفريغ السلة نهائياً لتوفير مساحة التخزين.
              </p>
            </div>

            <div className="space-y-8">
              {/* SECTION 1 */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 break-inside-avoid">
                <div className="flex items-center gap-2 text-teal-800 border-b border-slate-100 pb-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600 font-extrabold text-lg">1</div>
                  <h4 className="font-bold text-xl">استعراض العناصر واستعادتها</h4>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  واجهة السلة تشبه جدول الفواتير العادي، لكن الأزرار تختلف لتتيح لك خياري "استعادة" أو "حذف نهائي".
                </p>
                
                <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-4 text-center my-4">
                  <div className="bg-white border border-slate-200 rounded-xl shadow-sm text-right overflow-hidden max-w-2xl mx-auto opacity-75">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                        <tr><th className="p-3 resize-x overflow-auto">رقم المرجع</th><th className="p-3 resize-x overflow-auto">النوع</th><th className="p-3 resize-x overflow-auto">تاريخ الحذف</th><th className="p-3 text-left resize-x overflow-auto">إجراء</th></tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        <tr className="hover:bg-slate-50">
                           <td className="p-3 font-mono">INV-1092</td>
                           <td className="p-3">فاتورة طباعة</td>
                           <td className="p-3 text-slate-500">منذ ساعتين</td>
                           <td className="p-3 flex justify-end gap-2">
                             <button className="bg-teal-100 text-teal-700 px-3 py-1.5 rounded text-xs font-bold hover:bg-teal-200 flex items-center gap-1"><RefreshCcw className="w-3 h-3"/> استعادة</button>
                             <button className="bg-rose-100 text-rose-700 px-3 py-1.5 rounded text-xs font-bold hover:bg-rose-200"><Trash2 className="w-3 h-3"/></button>
                           </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* SECTION 2: Practical Scenario */}
              <div className="bg-amber-50 rounded-2xl p-6 sm:p-8 border border-amber-200 mt-10 break-inside-avoid relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200/40 rounded-full blur-3xl -mr-10 -mt-10"></div>
                <h3 className="font-bold text-2xl text-amber-900 mb-5 flex items-center gap-3 border-b border-amber-200/50 pb-4 relative z-10">
                  <BadgeAlert className="w-7 h-7 text-amber-600 animate-bounce" />
                  سيناريو عملي واقعي (الخطأ البشري)
                </h3>
                
                <div className="space-y-4 text-sm text-slate-700 relative z-10 pl-6 text-right">
                  <div className="bg-white p-4 rounded-xl border border-amber-100 shadow-sm flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 font-bold flex items-center justify-center shrink-0">1</div>
                    <p>أثناء فترة الذروة وزحمة العملاء، قام موظف الاستقبال "محمود" بحذف الفاتورة رقم <span className="font-mono bg-slate-100 px-1 rounded">INV-1092</span> بالخطأ بدلاً من طباعتها.</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-amber-100 shadow-sm flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 font-bold flex items-center justify-center shrink-0">2</div>
                    <p>أصيب العميل بالتوتر خوفاً من ضياع معاملته. قام محمود فوراً بفتح شريط التنقل الجانبي، والذهاب إلى <strong>"سلة المحذوفات"</strong>.</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-amber-100 shadow-sm flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 font-bold flex items-center justify-center shrink-0">3</div>
                    <p>وجد الفاتورة في أعلى القائمة، ضغط على زر <strong>"استعادة"</strong> الأخضر. عادت الفاتورة فوراً إلى شاشة الفواتير ليتمكن من استكمال طباعتها بنجاح.</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        );

      case 'shortcuts':
        return (
          <div className="space-y-8 animate-in fade-in duration-500 print:space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4 chapter-page break-inside-avoid">
              <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
                <MousePointer2 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-3xl font-black text-slate-800">دليل التفاعل والاختصارات الذكية</h2>
                <p className="text-slate-500 text-sm mt-0.5">كيفية استخدام النظام كالمحترفين لتسريع وتيرة العمل</p>
              </div>
            </div>
            
            <div className="bg-teal-50/40 rounded-2xl p-6 border border-teal-100/60 leading-relaxed text-slate-700 break-inside-avoid">
              <h3 className="text-xl font-bold text-teal-800 mb-2 flex items-center gap-2">
                <Info className="w-6 h-6 text-teal-600" />
                أهمية الاختصارات
              </h3>
              <p className="text-sm">
                تم تصميم هذا النظام لتقليل استخدام الماوس قدر الإمكان للموظفين الذين يدخلون بيانات كثيرة طوال اليوم. حفظك لهذه الاختصارات سيوفر لك ثوانٍ ثمينة في كل فاتورة، مما يعني إنجازاً أسرع لعملائك.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs break-inside-avoid">
              <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center gap-2 font-bold text-slate-700">
                <MousePointer2 className="w-5 h-5 text-teal-600" />
                طرق التفاعل عبر الماوس (Mouse Interactions)
              </div>
              <div className="p-0">
                <table className="w-full text-sm text-right">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="p-4 border-b border-slate-200 w-1/3 resize-x overflow-auto">الحركة / الإجراء</th>
                      <th className="p-4 border-b border-slate-200 resize-x overflow-auto">النتيجة والاستخدام</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-bold text-slate-700">النقر مرة واحدة (Click)</td>
                      <td className="p-4 text-slate-600">لتحديد صف في جدول الفواتير أو فتح تفاصيل تذكرة دعم. يتغير لون الصف للإشارة إلى تحديده.</td>
                    </tr>
                    <tr className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-bold text-slate-700">التمرير (Hover)</td>
                      <td className="p-4 text-slate-600">مرر الماوس فوق أزرار الإجراءات (الطباعة، التعديل) لظهور المربع الوصفي الأسود (Tooltip) مع تأثير تكبير ناعم.</td>
                    </tr>
                    <tr className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-bold text-slate-700">النقر المزدوج (Double Click)</td>
                      <td className="p-4 text-slate-600">في التقرير الشهري، النقر المزدوج على يوم معين يفتح نافذة تفاصيل عمليات ذلك اليوم بشكل مكبر.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-4 border-2 border-dashed border-slate-300 rounded-xl p-4 text-center break-inside-avoid">
              <HoverTableMockup />
              <TooltipMockup />
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs mt-8 break-inside-avoid">
              <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center gap-2 font-bold text-slate-700">
                <Keyboard className="w-5 h-5 text-indigo-600" />
                اختصارات لوحة المفاتيح (Keyboard Shortcuts)
              </div>
              <div className="p-0">
                <table className="w-full text-sm text-right">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="p-4 border-b border-slate-200 w-1/3 resize-x overflow-auto">الاختصار</th>
                      <th className="p-4 border-b border-slate-200 resize-x overflow-auto">الإجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 text-left font-mono font-bold text-indigo-600">Esc</td>
                      <td className="p-4 text-slate-600">إغلاق أي نافذة منبثقة (Modal) فوراً دون الحاجة لاستخدام الماوس لحفظ الوقت.</td>
                    </tr>
                    <tr className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 text-left font-mono font-bold text-indigo-600">Enter</td>
                      <td className="p-4 text-slate-600">تأكيد الحفظ السريع عند الانتهاء من ملء النماذج، أو إرسال رسالة في شات الدعم الداخلي.</td>
                    </tr>
                    <tr className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 text-left font-mono font-bold text-indigo-600">Tab</td>
                      <td className="p-4 text-slate-600">التنقل السريع بين حقول الإدخال عند كتابة بيانات الفاتورة لتسريع عملية الإصدار للعميل.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'support':
        return (
          <div className="space-y-8 flex flex-col justify-between border-4 border-double border-teal-800 p-8 rounded-2xl animate-in fade-in duration-500 print:space-y-6 chapter-page break-inside-avoid">
            <div className="text-center space-y-6 break-inside-avoid">
              <Logo 
                size="lg" 
                className="mx-auto" 
                customLogoUrl={systemSettings?.companyLogo} 
                customCompanyName={systemSettings?.companyName}
                customSubtitle={systemSettings?.companySubtitle}
              />
              <div>
                <h2 className="text-2xl font-black text-teal-800">مطور ومصمم النظام والدعم الفني المعتمد</h2>
                <p className="text-sm text-slate-500 mt-2">الإصدار الخاص بـ {systemSettings?.companySubtitle || 'المنصة الرقمية الموحدة لإدارة العمليات والموارد'} - {systemSettings?.companyName || 'مركز سند الريادة للخدمات'}</p>
              </div>
            </div>
            
            <hr className="border-slate-200 my-6" />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 break-inside-avoid">
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col items-center text-center space-y-3">
                <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
                  <Calendar className="w-6 h-6" />
                </div>
                <span className="text-sm font-bold text-slate-800 block">نسخة البرنامج الصادرة</span>
                <span className="font-mono font-bold text-sm text-teal-600">يوليو 2026</span>
              </div>
              
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col items-center text-center space-y-3">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                  <Mail className="w-6 h-6" />
                </div>
                <span className="text-sm font-bold text-slate-800 block">مصمم ومطور النظام</span>
                <a href="mailto:alriyada.oman@gmail.com" className="font-mono text-sm text-blue-600 hover:underline">
                  alriyada.oman@gmail.com
                </a>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col items-center text-center space-y-3">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Phone className="w-6 h-6" />
                </div>
                <span className="text-sm font-bold text-slate-800 block">الخط الساخن للدعم</span>
                <a href="tel:98299425" className="font-mono text-lg font-black text-emerald-600 hover:scale-105 transition-transform">
                  98299425
                </a>
              </div>
            </div>

            <div className="mt-8 flex items-start gap-4 p-5 bg-teal-50 border border-teal-100 rounded-2xl break-inside-avoid">
              <ShieldCheck className="w-8 h-8 text-teal-600 shrink-0 mt-1" />
              <p className="text-slate-700 leading-relaxed text-sm text-justify">
                نظام معتمد مشفر للتخزين المحلي وحماية حسابات المعاملات. تم تهيئة وضبط النظام لتلبية معايير مكاتب سند لتخليص المعاملات والتوثيق بسلطنة عُمان. لضمان أعلى مستويات الأمان والموثوقية واستمرارية الأعمال، تشتمل المنصة على مركز متطور لحفظ البيانات واستعادتها وتصديرها مع ميزة النسخ الاحتياطي التلقائي السحابي المدمج.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col lg:flex-row gap-6">
      {/* Sidebar Navigation */}
      <div className={`w-full lg:w-80 bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden flex flex-col shrink-0 ${mobileShowContent ? 'hidden lg:flex' : 'flex'}`}>
        <div className="p-4 bg-slate-50 border-b border-slate-100">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-teal-600" />
            فهرس الدليل
          </h2>
        </div>
        <div className="overflow-y-auto flex-1 p-2 space-y-1">
          {chapters.map((chapter) => {
            const isActive = activeChapter === chapter.id;
            return (
              <button
                key={chapter.id}
                onClick={() => {
                  setActiveChapter(chapter.id);
                  setMobileShowContent(true);
                }}
                className={`w-full flex items-start gap-3 p-3 rounded-xl text-right transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-teal-50 border-teal-200 text-teal-800 border shadow-sm'
                    : 'hover:bg-slate-50 border border-transparent text-slate-600'
                }`}
              >
                <div className={`mt-0.5 p-1.5 rounded-lg ${isActive ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-500'}`}>
                  {chapter.icon}
                </div>
                <div className="flex-1">
                  <h3 className={`text-sm font-bold ${isActive ? 'text-teal-800' : 'text-slate-700'}`}>
                    {chapter.title}
                  </h3>
                  <p className={`text-[10px] mt-1 ${isActive ? 'text-teal-600/80' : 'text-slate-400'}`}>
                    {chapter.subtitle}
                  </p>
                </div>
                {isActive && <ChevronLeft className="w-4 h-4 text-teal-500 self-center" />}
              </button>
            );
          })}
        </div>
        <div className="p-4 border-t border-slate-100 bg-slate-50 space-y-2">
          <button
            onClick={handleDownloadPDF}
            disabled={isGeneratingPDF}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white p-2.5 rounded-xl font-bold text-sm transition-all duration-200 cursor-pointer disabled:cursor-not-allowed hover:shadow-md"
          >
            <Printer className="w-4 h-4" />
            {isGeneratingPDF ? 'جاري التحضير...' : 'طباعة وتحميل هذا القسم PDF'}
          </button>
          <button
            onClick={handleDownloadAllPDF}
            disabled={isGeneratingPDF}
            className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white p-2.5 rounded-xl font-bold text-sm transition-all duration-200 cursor-pointer disabled:cursor-not-allowed hover:shadow-md"
          >
            <Printer className="w-4 h-4" />
            {isGeneratingPDF ? 'جاري التحضير...' : 'تحميل PDF لجميع أقسام الدليل'}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`flex-1 bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden flex-col relative ${mobileShowContent ? 'flex' : 'hidden lg:flex'}`}>
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileShowContent(false)}
              className="lg:hidden p-2 -mr-2 text-teal-700 hover:bg-teal-50 rounded-xl transition-colors cursor-pointer flex items-center gap-1 font-bold text-sm"
              title="الرجوع للفهرس"
            >
              <span>← الفهرس</span>
            </button>
            <h2 className="text-base sm:text-lg font-black text-slate-800 flex items-center gap-2">
              {chapters.find(c => c.id === activeChapter)?.icon}
              {chapters.find(c => c.id === activeChapter)?.title}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const currentIndex = chapters.findIndex(c => c.id === activeChapter);
                if (currentIndex > 0) setActiveChapter(chapters[currentIndex - 1].id);
              }}
              disabled={activeChapter === chapters[0].id}
              className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              title="الصفحة السابقة"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                const currentIndex = chapters.findIndex(c => c.id === activeChapter);
                if (currentIndex < chapters.length - 1) setActiveChapter(chapters[currentIndex + 1].id);
              }}
              disabled={activeChapter === chapters[chapters.length - 1].id}
              className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              title="الصفحة التالية"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Content Panel (This is what gets printed for single section) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 relative">
          <div id="guide-content-panel" className="max-w-4xl mx-auto bg-white" dir="rtl">
            {renderContent()}
          </div>
        </div>
      </div>

      {/* Hidden Panel for all chapters PDF */}
      <div id="guide-all-content-panel" className="hidden" dir="rtl">
        {chapters.map(c => (
          <div key={c.id} id={`section-${c.id}`} className="chapter-page max-w-4xl mx-auto bg-white mb-8 pb-8 border-b border-slate-200 last:border-0">
            <h1 className="text-2xl font-black text-slate-800 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center gap-2">
              {c.icon}
              {c.title}
            </h1>
            {renderContent(c.id)}
          </div>
        ))}
      </div>
    </div>
  );
}
