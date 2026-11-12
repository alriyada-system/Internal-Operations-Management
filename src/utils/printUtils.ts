import { Invoice, Customer, DeletedInvoice, Branch } from '../types';
import { numberToWords } from './tafqeet';
// @ts-ignore
import html2pdf from 'html2pdf.js';

export const directPrintInvoice = (invoice: Invoice, customer?: Customer, deletedRecord?: DeletedInvoice, branches?: Branch[], systemSettings?: any): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    // 1. Allow the browser UI thread to paint any loading states first
    setTimeout(() => {
      try {
        const branch = branches?.find(b => b.id === (invoice.branchId || 'branch-1'));
        const branchName = systemSettings?.companyName || 'مركز سند الريادة للخدمات';
        const branchPhone = branch?.phone || systemSettings?.companyPhone || '97994259';
        const branchEmail = branch?.email || systemSettings?.companyEmail || 'sanad.oman.r3@gmail.com';
        const branchAddress = branch?.address || systemSettings?.companyAddress || 'سلطنة عُمان - إبراء';
        const branchSubName = systemSettings?.companySubtitle || 'شركائك في نجاح أعمالك .. كل الخدمات في مكان واحد';
        const companyCrNumber = systemSettings?.companyCrNumber || '1342890';
        const companyLogo = systemSettings?.companyLogo || '';
        const companyNameEn = systemSettings?.companyNameEn || 'AL-RIYADAH SAND SERVICES';

        const customerDetailsHTML = customer
          ? `
            <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; background: #f8fafc; border: 1px solid #e2e8f0; padding: 5px 12px; border-radius: 6px; margin-bottom: 8px; gap: 15px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="color: #64748b; font-size: 11px;">العميل:</span>
                <span style="font-weight: bold; color: #1e293b; font-size: 13px;">${customer.name}${invoice.customerExtraText ? ` <span style="font-weight: 600; color: #334155;">${invoice.customerExtraText}</span>` : ''}</span>
                <span style="color: #cbd5e1; font-size: 11px;">|</span>
                <span style="color: #475569; font-size: 11px;">الهاتف: ${customer.phone}</span>
              </div>
              <div style="display: flex; align-items: center; gap: 6px;">
                <span style="color: #64748b; font-size: 11px;">تفاصيل التوثيق:</span>
                <span style="font-weight: bold; color: #1e293b; font-size: 11px;">
                  ${customer.type === 'individual' ? `الرقم المدني: ${customer.civilId}` : `سجل تجاري: ${customer.registrationNumber}`}
                </span>
              </div>
            </div>
          `
          : '';

        const itemsHTML = invoice.items
          .map(
            (item, index) => `
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 4px 6px; text-align: center; color: #475569; font-size: 11px;">${index + 1}</td>
              <td style="padding: 4px 6px; text-align: right; color: #1e293b; font-size: 11px; font-weight: 500;">
                ${item.serviceName}
              </td>
              <td style="padding: 4px 6px; text-align: center; color: #1e293b; font-size: 11px;">${item.quantity}</td>
              <td style="padding: 4px 6px; text-align: center; color: #1e293b; font-size: 11px; font-family: monospace;">${item.price.toFixed(3)}</td>
              <td style="padding: 4px 6px; text-align: center; color: #e11d48; font-size: 11px; font-family: monospace;">${(item.discount || 0).toFixed(3)}</td>
              <td style="padding: 4px 6px; text-align: center; color: #1e293b; font-size: 11px; font-weight: bold; font-family: monospace;">${item.total.toFixed(3)}</td>
            </tr>
          `
          )
          .join('');

        const subtotal = invoice.items.reduce((sum, i) => sum + i.total, 0);
        const { arabic: arabicAmount, english: englishAmount } = numberToWords(invoice.totalAmount);
        
        const isPaid = invoice.totalAmount > 0 && invoice.remainingAmount <= 0;

        const paidStampHTML = isPaid ? `
          <div style="position: absolute; left: 50%; transform: translateX(-50%) rotate(-8deg); bottom: 130px; z-index: 50; pointer-events: none; opacity: 0.85;">
            <div style="border: 4px double #10b981; color: #10b981; border-radius: 50%; width: 125px; height: 125px; display: flex; flex-direction: column; align-items: center; justify-content: center; font-weight: 900; text-align: center; background: rgba(16, 185, 129, 0.02); box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.05); font-family: 'Cairo', 'Tajawal', 'Tahoma', 'Arial', sans-serif; box-sizing: border-box; padding: 5px;">
              <div style="font-size: 7px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #059669; line-height: 1; font-family: 'Inter', system-ui, sans-serif;">AL-RIYADAH FAST</div>
              <div style="font-size: 18px; font-weight: 900; margin: 3px 0; border-top: 1.5px dashed #10b981; border-bottom: 1.5px dashed #10b981; padding: 1px 4px; width: 100%; box-sizing: border-box; color: #059669; letter-spacing: normal; line-height: 1.2; font-family: 'Cairo', 'Tajawal', 'Tahoma', 'Arial', sans-serif;">✔ مدفوع</div>
              <div style="font-size: 8px; font-weight: bold; color: #059669; letter-spacing: 0.5px; line-height: 1; font-family: 'Inter', system-ui, sans-serif;">PAID IN FULL</div>
              <div style="font-size: 7px; font-family: monospace; font-weight: bold; color: #10b981; margin-top: 2px;">${new Date(invoice.lastModifiedAt || invoice.createdAt).toLocaleDateString('ar-OM')}</div>
            </div>
          </div>
        ` : '';

        const signatureHTML = invoice.status === 'draft' ? `
          <div style="border: 2px solid #8b4513; color: #8b4513; padding: 8px; border-radius: 6px; display: inline-block; transform: rotate(-5deg); font-weight: bold; font-size: 11px; text-align: center; margin-top: 5px; opacity: 0.7;">
            (غير مكتمل مسودة)<br/>
            Al-Riyadah<br/>
            <span style="font-size: 8px; color: #8b4513;">بواسطة: ${invoice.lastModifiedBy}</span>
          </div>
        ` : `
          <div style="border: 2px solid #3b82f6; color: #3b82f6; padding: 8px; border-radius: 6px; display: inline-block; transform: rotate(-5deg); font-weight: bold; font-size: 11px; text-align: center; margin-top: 5px;">
            معتمد إلكترونياً<br/>
            Al-Riyadah<br/>
            <span style="font-size: 8px; color: #64748b;">بواسطة: ${invoice.lastModifiedBy}</span>
          </div>
        `;

        let watermarkHTML = '';
        if (deletedRecord) {
          watermarkHTML = `
            <div style="position: absolute; top: 38%; left: 0; right: 0; z-index: 100; pointer-events: none; opacity: 0.07; text-align: center; transform: rotate(-28deg); transform-origin: center; font-family: 'Cairo', 'Tajawal', 'Tahoma', 'Arial', sans-serif;">
              <h1 style="font-size: 120px; font-weight: 900; color: #dc2626; margin: 0; letter-spacing: 12px; border: 15px double #dc2626; display: inline-block; padding: 10px 40px; border-radius: 20px;">محذوفة</h1>
            </div>
          `;
        } else if (invoice.status === 'draft') {
          watermarkHTML = `
            <div style="position: absolute; top: 38%; left: 0; right: 0; z-index: 100; pointer-events: none; opacity: 0.07; text-align: center; transform: rotate(-28deg); transform-origin: center; font-family: 'Cairo', 'Tajawal', 'Tahoma', 'Arial', sans-serif;">
              <h1 style="font-size: 120px; font-weight: 900; color: #64748b; margin: 0; letter-spacing: 12px; border: 15px double #64748b; display: inline-block; padding: 10px 40px; border-radius: 20px;">مسودة</h1>
            </div>
          `;
        }

        let deletedAtFormatted = '';
        if (deletedRecord && deletedRecord.deletedAt) {
          try {
            const d = new Date(deletedRecord.deletedAt);
            if (!isNaN(d.getTime())) {
              deletedAtFormatted = `${d.toLocaleDateString('ar-OM')} ${d.toLocaleTimeString('ar-OM', { hour: '2-digit', minute: '2-digit' })}`;
            } else {
              deletedAtFormatted = deletedRecord.deletedAt;
            }
          } catch (e) {
            deletedAtFormatted = deletedRecord.deletedAt || '';
          }
        }

        const deletionFooterHTML = deletedRecord ? `
          <div style="margin-top: 15px; background: #fff5f5; border: 1.5px solid #fecaca; padding: 10px 15px; border-radius: 8px; color: #991b1b; font-size: 11px; line-height: 1.5; font-family: 'Cairo', 'Tajawal', sans-serif; display: flex; align-items: center; justify-content: space-between; direction: rtl; box-sizing: border-box;">
            <span style="font-weight: bold; display: flex; align-items: center; gap: 4px;">⚠️ هذه الفاتورة محذوفة (DELETED)</span>
            <span><strong>حذفت بواسطة:</strong> ${deletedRecord.deletedBy || 'غير معروف'}</span>
            <span><strong>تاريخ ووقت الحذف:</strong> ${deletedAtFormatted}</span>
          </div>
        ` : '';

        const element = document.createElement('div');
        element.innerHTML = `
          <div dir="rtl" lang="ar" style="position: relative; font-family: 'Inter', system-ui, sans-serif; padding: 12px 25px; color: #1e293b; background-color: #ffffff;">
            ${watermarkHTML}
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
              <tr>
                <td style="text-align: right; vertical-align: top; width: 65%;">
                  <div style="margin-bottom: 6px;">
                    <h1 style="margin: 0 0 2px; color: #0f172a; font-size: 22px; font-weight: 900; font-family: 'Cairo', 'Tajawal', sans-serif;">${branchName}</h1>
                    <p style="margin: 0 0 8px; color: #0d9488; font-size: 11px; font-family: 'Cairo', 'Tajawal', sans-serif;">${branchSubName}</p>
                  </div>
                  <p style="margin: 0; font-size: 11px; color: #475569;">
                    <strong>موقع المكتب:</strong> ${branchAddress}
                  </p>
                  <p style="margin: 3px 0 0; font-size: 11px; color: #475569;">
                    <strong>التواصل:</strong> ${branchPhone} | <strong>البريد:</strong> ${branchEmail}
                  </p>
                  ${companyCrNumber ? `
                  <p style="margin: 3px 0 0; font-size: 11px; color: #0d9488; font-weight: bold;">
                    <strong>السجل التجاري:</strong> <span style="font-family: monospace;">${companyCrNumber}</span>
                  </p>
                  ` : ''}
                </td>
                <td style="text-align: left; vertical-align: top; width: 35%;">
                  <div style="display: inline-flex; flex-direction: column; align-items: center; text-align: center; float: left;">
                    ${companyLogo ? `
                      <img src="${companyLogo}" style="max-width: 60px; max-height: 60px; object-fit: contain; border-radius: 8px;" alt="${branchName}" />
                    ` : `
                      <svg style="width: 52px; height: 52px;" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                          <linearGradient id="gradientCircle" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stop-color="#1E3A8A" />
                            <stop offset="50%" stop-color="#0D9488" />
                            <stop offset="100%" stop-color="#84CC16" />
                          </linearGradient>
                          <linearGradient id="calligraphyGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                            <stop offset="0%" stop-color="#0F172A" />
                            <stop offset="100%" stop-color="#1E40AF" />
                          </linearGradient>
                        </defs>
                        <circle cx="100" cy="100" r="92" stroke="url(#gradientCircle)" stroke-width="6" fill="white" />
                        <circle cx="100" cy="100" r="82" stroke="#E2E8F0" stroke-width="1.5" stroke-dasharray="4 4" />
                        <g transform="translate(65, 30)">
                          <rect x="10" y="5" width="50" height="32" rx="4" fill="none" stroke="#0D9488" stroke-width="3" />
                          <line x1="15" y1="37" x2="55" y2="37" stroke="#0D9488" stroke-width="4" stroke-linecap="round" />
                          <line x1="35" y1="37" x2="35" y2="45" stroke="#0D9488" stroke-width="3" />
                          <line x1="25" y1="45" x2="45" y2="45" stroke="#0D9488" stroke-width="3" stroke-linecap="round" />
                          <circle cx="0" cy="5" r="2.5" fill="#1E3A8A" />
                          <circle cx="-5" cy="12" r="3" fill="#0D9488" />
                          <circle cx="5" cy="18" r="2" fill="#84CC16" />
                          <line x1="-5" y1="12" x2="10" y2="15" stroke="#0D9488" stroke-width="1" stroke-dasharray="2 2" />
                          <line x1="0" y1="5" x2="12" y2="10" stroke="#1E3A8A" stroke-width="1" stroke-dasharray="2 2" />
                        </g>
                        <g transform="translate(45, 80)">
                          <path d="M 100 20 C 120 40, 115 80, 85 90 C 65 96, 40 90, 45 70 C 48 60, 60 62, 55 52 C 50 42, 35 48, 30 35 C 25 20, 40 10, 55 15" stroke="url(#calligraphyGradient)" stroke-width="5" stroke-linecap="round" fill="none" />
                          <path d="M 15 55 C 20 80, 50 85, 75 70 C 90 60, 105 30, 95 10 C 90 0, 75 10, 80 25 C 85 40, 65 55, 45 55 C 30 55, 12 40, 15 25" stroke="#0D9488" stroke-width="4" stroke-linecap="round" fill="none" />
                          <circle cx="65" cy="78" r="4.5" fill="#84CC16" />
                          <circle cx="75" cy="74" r="4.5" fill="#84CC16" />
                          <circle cx="28" cy="10" r="4" fill="#1E3A8A" />
                          <circle cx="38" cy="12" r="4" fill="#1E3A8A" />
                        </g>
                        <path d="M 15 130 C 30 175, 85 185, 135 175 C 175 165, 185 125, 175 90" stroke="#84CC16" stroke-width="3.5" stroke-linecap="round" fill="none" />
                        <circle cx="15" cy="130" r="5" fill="#84CC16" />
                        <circle cx="28" cy="145" r="4" fill="#0D9488" />
                      </svg>
                    `}
                    <div style="margin-top: 4px; background: rgba(16, 185, 129, 0.1); color: #047857; padding: 2px 8px; border-radius: 4px; font-size: 9px; font-weight: bold; text-transform: uppercase;">
                      ${companyNameEn || branchName}
                    </div>
                    <div style="margin-top: 6px; padding: 6px 8px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 10px; color: #475569; text-align: right; width: 155px; box-sizing: border-box;">
                      <p style="margin: 0; line-height: 1.4; font-size: 10px; white-space: nowrap;">
                        <strong>تاريخ الإصدار:</strong> <span style="font-family: monospace; color: #334155;">${new Date(invoice.createdAt).toLocaleDateString('ar-OM')}</span>
                      </p>
                      <p style="margin: 3px 0 0; line-height: 1.4; font-size: 10px; white-space: nowrap;">
                        <strong>رقم الفاتورة:</strong> <span style="font-family: monospace; font-weight: bold; color: #0d9488;">${invoice.invoiceNumber}</span>
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            </table>

            ${customerDetailsHTML}

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
              <thead>
                <tr>
                  <th style="background-color: #f1f5f9; color: #475569; padding: 8px 6px; font-weight: bold; font-size: 11px; border-bottom: 2px solid #e2e8f0; width: 5%; text-align: center;">م</th>
                  <th style="background-color: #f1f5f9; color: #475569; padding: 8px 6px; font-weight: bold; font-size: 11px; border-bottom: 2px solid #e2e8f0; width: 45%; text-align: right;">تفاصيل الخدمات و المعاملات</th>
                  <th style="background-color: #f1f5f9; color: #475569; padding: 8px 6px; font-weight: bold; font-size: 11px; border-bottom: 2px solid #e2e8f0; width: 10%; text-align: center;">الكمية</th>
                  <th style="background-color: #f1f5f9; color: #475569; padding: 8px 6px; font-weight: bold; font-size: 11px; border-bottom: 2px solid #e2e8f0; width: 15%; text-align: center;">السعر (ر.ع.)</th>
                  <th style="background-color: #f1f5f9; color: #475569; padding: 8px 6px; font-weight: bold; font-size: 11px; border-bottom: 2px solid #e2e8f0; width: 10%; text-align: center;">الخصم</th>
                  <th style="background-color: #f1f5f9; color: #475569; padding: 8px 6px; font-weight: bold; font-size: 11px; border-bottom: 2px solid #e2e8f0; width: 15%; text-align: center;">الإجمالي (ر.ع.)</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHTML}
              </tbody>
            </table>

            <table style="width: 320px; margin-right: auto; border-collapse: collapse; margin-bottom: 12px;">
              <tr>
                <td style="color: #64748b; padding: 4px 0; font-size: 12px;">إجمالي البنود:</td>
                <td style="text-align: left; font-family: monospace; font-weight: 500; padding: 4px 0; font-size: 12px;">${subtotal.toFixed(3)} ر.ع.</td>
              </tr>
              ${(invoice.discount ?? 0) > 0 ? `
              <tr style="color: #059669;">
                <td style="padding: 4px 0; font-size: 12px;">خصم إضافي:</td>
                <td style="text-align: left; font-family: monospace; padding: 4px 0; font-size: 12px;">-${invoice.discount?.toFixed(3)} ر.ع.</td>
              </tr>` : ''}
              <tr style="font-weight: bold; border-top: 1px solid #e2e8f0; font-size: 13px;">
                <td style="padding-top: 6px; padding-bottom: 4px;">الإجمالي النهائي:</td>
                <td style="text-align: left; color: #0d9488; font-family: monospace; padding-top: 6px; padding-bottom: 4px;">${invoice.totalAmount.toFixed(3)} ر.ع.</td>
              </tr>
              <tr style="color: #2563eb;">
                <td style="padding: 4px 0; font-size: 12px;">المبلغ المقدم:</td>
                <td style="text-align: left; font-family: monospace; padding: 4px 0; font-size: 12px;">-${invoice.downPayment.toFixed(3)} ر.ع.</td>
              </tr>
              <tr style="font-weight: bold; color: #e11d48; border-top: 2px solid #cbd5e1; font-size: 13px;">
                <td style="padding-top: 6px; padding-bottom: 4px;">المتبقي المستحق:</td>
                <td style="text-align: left; font-family: monospace; padding-top: 6px; padding-bottom: 4px;">${invoice.remainingAmount.toFixed(3)} ر.ع.</td>
              </tr>
            </table>

            ${invoice.payments && invoice.payments.length > 0 ? `
            <div style="margin-bottom: 12px;">
              <h4 style="margin: 0 0 6px; font-size: 11px; color: #64748b;">سجل الدفعات</h4>
              <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
                <thead>
                  <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                    <th style="padding: 4px 6px; text-align: right; color: #475569;">التاريخ</th>
                    <th style="padding: 4px 6px; text-align: right; color: #475569;">المبلغ (ر.ع.)</th>
                    <th style="padding: 4px 6px; text-align: right; color: #475569;">الموظف</th>
                    <th style="padding: 4px 6px; text-align: right; color: #475569;">ملاحظات</th>
                  </tr>
                </thead>
                <tbody>
                  ${invoice.payments.map(payment => `
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                      <td style="padding: 4px 6px; font-family: monospace;">${new Date(payment.date).toLocaleDateString('ar-OM')}</td>
                      <td style="padding: 4px 6px; font-family: monospace; font-weight: bold; color: #0d9488;">${payment.amount.toFixed(3)}</td>
                      <td style="padding: 4px 6px; color: #475569;">${payment.recordedBy}</td>
                      <td style="padding: 4px 6px; color: #94a3b8; font-size: 9px;">${payment.notes || '-'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
            ` : ''}

            <div style="background: #f8fafc; border: 1px dashed #cbd5e1; padding: 6px 12px; border-radius: 6px; margin-bottom: 10px; font-size: 11px; line-height: 1.4;">
              <strong>المبلغ الإجمالي بالحروف:</strong> 
              <span style="color:#0d9488; font-weight: bold; margin-right: 4px;">${arabicAmount}</span>
              <span style="color:#64748b; font-family: 'Inter', sans-serif; font-size: 10px; margin-right: 8px;" dir="ltr">(${englishAmount})</span>
            </div>

            <div style="display: flex; justify-content: space-between; margin-top: 15px;">
              <div style="text-align: center; width: 40%;">
                <p style="margin: 0; font-size: 11px; color: #64748b;">المستلم / العميل</p>
                <div style="height: 35px; border-bottom: 1px dashed #cbd5e1;"></div>
                <p style="margin-top: 4px; font-size: 11px; font-weight: bold;">التوقيع:</p>
              </div>
              <div style="text-align: center; width: 40%;">
                <p style="margin: 0; font-size: 11px; color: #64748b;">الاعتماد الرقمي للشركة</p>
                ${signatureHTML}
              </div>
            </div>

            ${deletionFooterHTML}

            <div style="margin-top: 25px; border-top: 1px dashed #e2e8f0; padding-top: 10px; text-align: center; font-size: 10px; color: #64748b;">
              <p style="margin: 0 0 4px; font-weight: bold; color: #64748b;">شكرًا لتعاملكم مع ${branchName}</p>
              <p style="margin: 0; font-size: 8px; color: #cbd5e1;">النسخة الرقمية الصادرة من ${branchSubName} - ٢٠٢٦</p>
            </div>
            ${paidStampHTML}
          </div>
        `;

        const opt = {
          margin:       [5, 8, 5, 8] as [number, number, number, number], // top, left, bottom, right
          filename:     `فاتورة-${invoice.invoiceNumber}.pdf`,
          image:        { type: 'jpeg' as const, quality: 0.98 },
          html2canvas:  { scale: 2, useCORS: true, windowWidth: 800, scrollY: 0, scrollX: 0 },
          jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
        };

        setTimeout(() => {
          runWithOklchFix(async () => {
            try {
              const pdfWorker = html2pdf().set(opt).from(element.innerHTML);
              const blob = await pdfWorker.output('blob');
              
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `فاتورة-${invoice.invoiceNumber}.pdf`;
              a.style.display = 'none';
              document.body.appendChild(a);
              a.click();
              
              setTimeout(() => {
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
              }, 200);
              resolve();
            } catch (err) {
              console.error("PDF generation/download error, falling back to standard save:", err);
              try {
                await html2pdf().set(opt).from(element.innerHTML).save();
                resolve();
              } catch (fallbackErr) {
                console.error("PDF standard save fallback also failed:", fallbackErr);
                reject(fallbackErr);
              }
            }
          });
        }, 50);

      } catch (err) {
        console.error("Invoice print pre-processing error:", err);
        reject(err);
      }
    }, 150);
  });
};

/**
 * Prints the invoice using a hidden sandbox iframe and the browser's native print engine.
 * This is 100% reliable, works across all browsers, supports physical printing,
 * and allows saving as a vector-sharp searchable PDF.
 */
export const printInvoiceWithIframe = (invoice: Invoice, customer?: Customer, deletedRecord?: DeletedInvoice, branches?: Branch[], systemSettings?: any): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    try {
      const branch = branches?.find(b => b.id === (invoice.branchId || 'branch-1'));
      const branchName = systemSettings?.companyName || 'مركز سند الريادة للخدمات';
      const branchPhone = branch?.phone || systemSettings?.companyPhone || '97994259';
      const branchEmail = branch?.email || systemSettings?.companyEmail || 'sanad.oman.r3@gmail.com';
      const branchAddress = branch?.address || systemSettings?.companyAddress || 'سلطنة عُمان - إبراء';
      const branchSubName = systemSettings?.companySubtitle || 'شركائك في نجاح أعمالك .. كل الخدمات في مكان واحد';
      const companyCrNumber = systemSettings?.companyCrNumber || '1342890';
      const companyLogo = systemSettings?.companyLogo || '';
      const companyNameEn = systemSettings?.companyNameEn || 'AL-RIYADAH SAND SERVICES';

      const customerDetailsHTML = customer
        ? `
          <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; background: #f8fafc; border: 1px solid #e2e8f0; padding: 5px 12px; border-radius: 6px; margin-bottom: 8px; gap: 15px; direction: rtl; text-align: right;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="color: #64748b; font-size: 11px;">العميل:</span>
              <span style="font-weight: bold; color: #1e293b; font-size: 13px;">${customer.name}${invoice.customerExtraText ? ` <span style="font-weight: 600; color: #334155;">${invoice.customerExtraText}</span>` : ''}</span>
              <span style="color: #cbd5e1; font-size: 11px;">|</span>
              <span style="color: #475569; font-size: 11px;">الهاتف: ${customer.phone}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="color: #64748b; font-size: 11px;">تفاصيل التوثيق:</span>
              <span style="font-weight: bold; color: #1e293b; font-size: 11px;">
                ${customer.type === 'individual' ? `الرقم المدني: ${customer.civilId}` : `سجل تجاري: ${customer.registrationNumber}`}
              </span>
            </div>
          </div>
        `
        : '';

      const itemsHTML = invoice.items
        .map(
          (item, index) => `
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 6px 6px; text-align: center; color: #475569; font-size: 11px;">${index + 1}</td>
            <td style="padding: 6px 6px; text-align: right; color: #1e293b; font-size: 11px; font-weight: 500;">
              ${item.serviceName}
            </td>
            <td style="padding: 6px 6px; text-align: center; color: #1e293b; font-size: 11px;">${item.quantity}</td>
            <td style="padding: 6px 6px; text-align: center; color: #1e293b; font-size: 11px; font-family: monospace;">${item.price.toFixed(3)}</td>
            <td style="padding: 6px 6px; text-align: center; color: #e11d48; font-size: 11px; font-family: monospace;">${(item.discount || 0).toFixed(3)}</td>
            <td style="padding: 6px 6px; text-align: center; color: #1e293b; font-size: 11px; font-weight: bold; font-family: monospace;">${item.total.toFixed(3)}</td>
          </tr>
        `
        )
        .join('');

      const subtotal = invoice.items.reduce((sum, i) => sum + i.total, 0);
      const { arabic: arabicAmount, english: englishAmount } = numberToWords(invoice.totalAmount);
      
      const isPaid = invoice.totalAmount > 0 && invoice.remainingAmount <= 0;

      const paidStampHTML = isPaid ? `
        <div style="position: absolute; left: 50%; transform: translateX(-50%) rotate(-8deg); bottom: 130px; z-index: 50; pointer-events: none; opacity: 0.85;">
          <div style="border: 4px double #10b981; color: #10b981; border-radius: 50%; width: 125px; height: 125px; display: flex; flex-direction: column; align-items: center; justify-content: center; font-weight: 900; text-align: center; background: rgba(16, 185, 129, 0.02); box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.05); font-family: 'Cairo', 'Tajawal', 'Tahoma', 'Arial', sans-serif; box-sizing: border-box; padding: 5px;">
            <div style="font-size: 7px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #059669; line-height: 1; font-family: 'Inter', system-ui, sans-serif;">AL-RIYADAH FAST</div>
            <div style="font-size: 18px; font-weight: 900; margin: 3px 0; border-top: 1.5px dashed #10b981; border-bottom: 1.5px dashed #10b981; padding: 1px 4px; width: 100%; box-sizing: border-box; color: #059669; letter-spacing: normal; line-height: 1.2; font-family: 'Cairo', 'Tajawal', 'Tahoma', 'Arial', sans-serif;">✔ مدفوع</div>
            <div style="font-size: 8px; font-weight: bold; color: #059669; letter-spacing: 0.5px; line-height: 1; font-family: 'Inter', system-ui, sans-serif;">PAID IN FULL</div>
            <div style="font-size: 7px; font-family: monospace; font-weight: bold; color: #10b981; margin-top: 2px;">${new Date(invoice.lastModifiedAt || invoice.createdAt).toLocaleDateString('ar-OM')}</div>
          </div>
        </div>
      ` : '';

      const signatureHTML = `
        <div style="border: 2px solid #3b82f6; color: #3b82f6; padding: 8px; border-radius: 6px; display: inline-block; transform: rotate(-5deg); font-weight: bold; font-size: 11px; text-align: center; margin-top: 5px; font-family: 'Cairo', sans-serif;">
          معتمد إلكترونياً<br/>
          Al-Riyadah<br/>
          <span style="font-size: 8px; color: #64748b;">بواسطة: ${invoice.lastModifiedBy}</span>
        </div>
      `;

      const watermarkHTML = deletedRecord ? `
        <div style="position: absolute; top: 38%; left: 0; right: 0; z-index: 100; pointer-events: none; opacity: 0.07; text-align: center; transform: rotate(-28deg); transform-origin: center; font-family: 'Cairo', 'Tajawal', 'Tahoma', 'Arial', sans-serif;">
          <h1 style="font-size: 120px; font-weight: 900; color: #dc2626; margin: 0; letter-spacing: 12px; border: 15px double #dc2626; display: inline-block; padding: 10px 40px; border-radius: 20px;">محذوفة</h1>
        </div>
      ` : '';

      let deletedAtFormatted = '';
      if (deletedRecord && deletedRecord.deletedAt) {
        try {
          const d = new Date(deletedRecord.deletedAt);
          if (!isNaN(d.getTime())) {
            deletedAtFormatted = `${d.toLocaleDateString('ar-OM')} ${d.toLocaleTimeString('ar-OM', { hour: '2-digit', minute: '2-digit' })}`;
          } else {
            deletedAtFormatted = deletedRecord.deletedAt;
          }
        } catch (e) {
          deletedAtFormatted = deletedRecord.deletedAt || '';
        }
      }

      const deletionFooterHTML = deletedRecord ? `
        <div style="margin-top: 15px; background: #fff5f5; border: 1.5px solid #fecaca; padding: 10px 15px; border-radius: 8px; color: #991b1b; font-size: 11px; line-height: 1.5; font-family: 'Cairo', 'Tajawal', sans-serif; display: flex; align-items: center; justify-content: space-between; direction: rtl; box-sizing: border-box; text-align: right;">
          <span style="font-weight: bold; display: flex; align-items: center; gap: 4px;">⚠️ هذه الفاتورة محذوفة (DELETED)</span>
          <span><strong>حذفت بواسطة:</strong> ${deletedRecord.deletedBy || 'غير معروف'}</span>
          <span><strong>تاريخ ووقت الحذف:</strong> ${deletedAtFormatted}</span>
        </div>
      ` : '';

      const invoiceContent = `
        <div dir="rtl" lang="ar" style="position: relative; font-family: 'Cairo', 'Tajawal', 'Tahoma', 'Arial', sans-serif; padding: 12px 25px; color: #1e293b; background-color: #ffffff; box-sizing: border-box; width: 100%; text-align: right;">
          ${watermarkHTML}
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px; direction: rtl;">
            <tr>
              <td style="text-align: right; vertical-align: top; width: 65%;">
                <div style="margin-bottom: 6px;">
                  <h1 style="margin: 0 0 2px; color: #1e3a8a; font-size: 18px; font-family: 'Cairo', 'Tajawal', sans-serif;">${branchName}</h1>
                  <p style="margin: 0 0 8px; color: #64748b; font-size: 9px; font-family: monospace;">${branchSubName}</p>
                </div>
                <p style="margin: 0; font-size: 11px; color: #475569;">
                  <strong>موقع المكتب:</strong> ${branchAddress}
                </p>
                <p style="margin: 3px 0 0; font-size: 11px; color: #475569;">
                  <strong>التواصل:</strong> ${branchPhone} | <strong>البريد:</strong> ${branchEmail}
                </p>
                ${companyCrNumber ? `
                <p style="margin: 3px 0 0; font-size: 11px; color: #0d9488; font-weight: bold;">
                  <strong>السجل التجاري:</strong> <span style="font-family: monospace;">${companyCrNumber}</span>
                </p>
                ` : ''}
              </td>
              <td style="text-align: left; vertical-align: top; width: 35%;">
                <div style="display: inline-flex; flex-direction: column; align-items: center; text-align: center; float: left;">
                  ${companyLogo ? `
                    <img src="${companyLogo}" style="max-width: 60px; max-height: 60px; object-fit: contain; border-radius: 8px;" alt="${branchName}" />
                  ` : `
                    <svg style="width: 52px; height: 52px;" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <linearGradient id="gradientCircleIframe" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stop-color="#1E3A8A" />
                          <stop offset="50%" stop-color="#0D9488" />
                          <stop offset="100%" stop-color="#84CC16" />
                        </linearGradient>
                        <linearGradient id="calligraphyGradientIframe" x1="0%" y1="100%" x2="100%" y2="0%">
                          <stop offset="0%" stop-color="#0F172A" />
                          <stop offset="100%" stop-color="#1E40AF" />
                        </linearGradient>
                      </defs>
                      <circle cx="100" cy="100" r="92" stroke="url(#gradientCircleIframe)" stroke-width="6" fill="white" />
                      <circle cx="100" cy="100" r="82" stroke="#E2E8F0" stroke-width="1.5" stroke-dasharray="4 4" />
                      <g transform="translate(65, 30)">
                        <rect x="10" y="5" width="50" height="32" rx="4" fill="none" stroke="#0D9488" stroke-width="3" />
                        <line x1="15" y1="37" x2="55" y2="37" stroke="#0D9488" stroke-width="4" stroke-linecap="round" />
                        <line x1="35" y1="37" x2="35" y2="45" stroke="#0D9488" stroke-width="3" />
                        <line x1="25" y1="45" x2="45" y2="45" stroke="#0D9488" stroke-width="3" stroke-linecap="round" />
                        <circle cx="0" cy="5" r="2.5" fill="#1E3A8A" />
                        <circle cx="-5" cy="12" r="3" fill="#0D9488" />
                        <circle cx="5" cy="18" r="2" fill="#84CC16" />
                        <line x1="-5" y1="12" x2="10" y2="15" stroke="#0D9488" stroke-width="1" stroke-dasharray="2 2" />
                        <line x1="0" y1="5" x2="12" y2="10" stroke="#1E3A8A" stroke-width="1" stroke-dasharray="2 2" />
                      </g>
                      <g transform="translate(45, 80)">
                        <path d="M 100 20 C 120 40, 115 80, 85 90 C 65 96, 40 90, 45 70 C 48 60, 60 62, 55 52 C 50 42, 35 48, 30 35 C 25 20, 40 10, 55 15" stroke="url(#calligraphyGradientIframe)" stroke-width="5" stroke-linecap="round" fill="none" />
                        <path d="M 15 55 C 20 80, 50 85, 75 70 C 90 60, 105 30, 95 10 C 90 0, 75 10, 80 25 C 85 40, 65 55, 45 55 C 30 55, 12 40, 15 25" stroke="#0D9488" stroke-width="4" stroke-linecap="round" fill="none" />
                        <circle cx="65" cy="78" r="4.5" fill="#84CC16" />
                        <circle cx="75" cy="74" r="4.5" fill="#84CC16" />
                        <circle cx="28" cy="10" r="4" fill="#1E3A8A" />
                        <circle cx="38" cy="12" r="4" fill="#1E3A8A" />
                      </g>
                      <path d="M 15 130 C 30 175, 85 185, 135 175 C 175 165, 185 125, 175 90" stroke="#84CC16" stroke-width="3.5" stroke-linecap="round" fill="none" />
                      <circle cx="15" cy="130" r="5" fill="#84CC16" />
                      <circle cx="28" cy="145" r="4" fill="#0D9488" />
                    </svg>
                  `}
                  <div style="margin-top: 4px; background: rgba(16, 185, 129, 0.1); color: #047857; padding: 2px 8px; border-radius: 4px; font-size: 9px; font-weight: bold; text-transform: uppercase; font-family: 'Cairo', sans-serif;">
                    ${companyNameEn || branchName}
                  </div>
                  <div style="margin-top: 6px; padding: 6px 8px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 10px; color: #475569; text-align: right; width: 155px; box-sizing: border-box;">
                    <p style="margin: 0; line-height: 1.4; font-size: 10px; white-space: nowrap;">
                      <strong>تاريخ الإصدار:</strong> <span style="font-family: monospace; color: #334155;">${new Date(invoice.createdAt).toLocaleDateString('ar-OM')}</span>
                    </p>
                    <p style="margin: 3px 0 0; line-height: 1.4; font-size: 10px; white-space: nowrap;">
                      <strong>رقم الفاتورة:</strong> <span style="font-family: monospace; font-weight: bold; color: #0d9488;">${invoice.invoiceNumber}</span>
                    </p>
                  </div>
                </div>
              </td>
            </tr>
          </table>

          ${customerDetailsHTML}

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 11px; direction: rtl;">
            <thead>
              <tr style="background-color: #f1f5f9; border-bottom: 2px solid #e2e8f0;">
                <th style="padding: 8px 6px; font-weight: bold; text-align: center; width: 5%;">م</th>
                <th style="padding: 8px 6px; font-weight: bold; text-align: right; width: 45%;">تفاصيل الخدمات و المعاملات</th>
                <th style="padding: 8px 6px; font-weight: bold; text-align: center; width: 10%;">الكمية</th>
                <th style="padding: 8px 6px; font-weight: bold; text-align: center; width: 15%;">السعر (ر.ع.)</th>
                <th style="padding: 8px 6px; font-weight: bold; text-align: center; width: 10%;">الخصم</th>
                <th style="padding: 8px 6px; font-weight: bold; text-align: center; width: 15%;">الإجمالي (ر.ع.)</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHTML}
            </tbody>
          </table>

          <table style="width: 300px; margin-right: auto; border-collapse: collapse; margin-bottom: 12px; font-size: 11px; direction: rtl; text-align: right;">
            <tr>
              <td style="color: #64748b; padding: 4px 0;">إجمالي البنود:</td>
              <td style="text-align: left; font-weight: 500;">${subtotal.toFixed(3)} ر.ع.</td>
            </tr>
            ${(invoice.discount ?? 0) > 0 ? `
            <tr style="color: #059669;">
              <td style="padding: 4px 0;">خصم إضافي:</td>
              <td style="text-align: left;">-${invoice.discount?.toFixed(3)} ر.ع.</td>
            </tr>` : ''}
            <tr style="font-weight: bold; border-top: 1px solid #e2e8f0; font-size: 12px;">
              <td style="padding-top: 6px;">الإجمالي النهائي:</td>
              <td style="text-align: left; color: #0d9488;">${invoice.totalAmount.toFixed(3)} ر.ع.</td>
            </tr>
            <tr style="color: #2563eb;">
              <td style="padding: 4px 0;">المبلغ المقدم:</td>
              <td style="text-align: left;">-${invoice.downPayment.toFixed(3)} ر.ع.</td>
            </tr>
            <tr style="font-weight: bold; color: #e11d48; border-top: 2px solid #cbd5e1; font-size: 12px;">
              <td style="padding-top: 6px;">المتبقي المستحق:</td>
              <td style="text-align: left;">${invoice.remainingAmount.toFixed(3)} ر.ع.</td>
            </tr>
          </table>

          ${invoice.payments && invoice.payments.length > 0 ? `
          <div style="margin-bottom: 12px; font-size: 10px; direction: rtl; text-align: right;">
            <h4 style="margin: 0 0 4px; color: #64748b;">سجل الدفعات</h4>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                  <th style="padding: 4px 6px; text-align: right;">التاريخ</th>
                  <th style="padding: 4px 6px; text-align: right;">المبلغ (ر.ع.)</th>
                  <th style="padding: 4px 6px; text-align: right;">الموظف</th>
                </tr>
              </thead>
              <tbody>
                ${invoice.payments.map(payment => `
                  <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 4px 6px;">${new Date(payment.date).toLocaleDateString('ar-OM')}</td>
                    <td style="padding: 4px 6px; font-weight: bold; color: #0d9488;">${payment.amount.toFixed(3)}</td>
                    <td style="padding: 4px 6px;">${payment.recordedBy}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          ` : ''}

          <div style="background: #f8fafc; border: 1px dashed #cbd5e1; padding: 6px 12px; border-radius: 6px; margin-bottom: 10px; font-size: 11px; direction: rtl; text-align: right;">
            <strong>المبلغ الإجمالي بالحروف:</strong> <span style="color:#0d9488; font-weight: bold;">${arabicAmount}</span>
            <span style="color:#64748b; font-size: 9px;" dir="ltr">(${englishAmount})</span>
          </div>

          <div style="display: flex; justify-content: space-between; margin-top: 15px; direction: rtl;">
            <div style="text-align: center; width: 40%;">
              <p style="margin: 0; font-size: 11px; color: #64748b;">المستلم / العميل</p>
              <div style="height: 30px; border-bottom: 1px dashed #cbd5e1;"></div>
            </div>
            <div style="text-align: center; width: 40%;">
              <p style="margin: 0; font-size: 11px; color: #64748b;">الاعتماد الرقمي للشركة</p>
              ${signatureHTML}
            </div>
          </div>

          ${deletionFooterHTML}

          <div style="margin-top: 20px; border-top: 2px dashed #cbd5e1; padding-top: 8px; text-align: center; font-size: 9px; color: #64748b; direction: rtl;">
            <p style="margin: 0 0 2px;">شكرًا لتعاملكم مع ${branchName}</p>
            <p style="margin: 0;">النسخة الرقمية الصادرة من ${branchSubName} - 2026</p>
          </div>
          ${paidStampHTML}
        </div>
      `;

      // Create a hidden print iframe
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document || iframe.contentDocument;
      if (!doc) {
        throw new Error("Could not access iframe document");
      }

      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>فاتورة رقم ${invoice.invoiceNumber}</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap');
              body {
                font-family: 'Cairo', 'Tajawal', 'Tahoma', 'Arial', sans-serif;
                direction: rtl;
                margin: 0;
                padding: 10mm;
                background-color: #ffffff;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              @page {
                size: A4 portrait;
                margin: 0;
              }
              @media print {
                body {
                  padding: 10mm;
                }
              }
            </style>
          </head>
          <body>
            ${invoiceContent}
            
          </body>
        </html>
      `);
      doc.close();
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
          resolve();
        }, 1000);
      }, 500);
    } catch (err) {
      console.error("Iframe native print error:", err);
      reject(err);
    }
  });
};

/**
 * Safely runs a callback that uses html2canvas/html2pdf by temporarily
 * sanitizing Tailwind v4's oklch() color functions from stylesheets
 * to prevent the "Attempting to parse an unsupported color function oklch" crash.
 */
export async function runWithOklchFix<T>(callback: () => Promise<T> | T): Promise<T> {
  const tempStyles: HTMLStyleElement[] = [];
  const disabledSheets: CSSStyleSheet[] = [];

  // Helper to fetch stylesheet content with a strict timeout of 800ms to prevent hanging
  const fetchWithTimeout = async (url: string, timeoutMs = 800): Promise<string | null> => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(id);
      if (res.ok) {
        return await res.text();
      }
    } catch (e) {
      clearTimeout(id);
      console.warn(`Fetch failed for stylesheet ${url}:`, e);
    }
    return null;
  };

  const sheetPromises: Promise<void>[] = [];

  for (let i = 0; i < document.styleSheets.length; i++) {
    const sheet = document.styleSheets[i];
    try {
      const ownerNode = sheet.ownerNode;
      if (!ownerNode) continue;

      // Fast Path 1: It is a <style> element. We can read its textContent instantly!
      if (ownerNode.nodeName === "STYLE" || ownerNode.nodeName === "style") {
        const cssText = ownerNode.textContent || "";
        if (cssText.includes("oklch") || cssText.includes("oklab")) {
          // Sanitize oklch() and oklab() occurrences using a high-performance native regex.
          const sanitizedText = cssText.replace(
            /(oklch|oklab)\((?:[^()]+|\([^()]*\))*\)/g,
            "rgb(13, 148, 136)"
          );

          // Create a temporary style tag with sanitized rules
          const tempStyle = document.createElement("style");
          tempStyle.textContent = sanitizedText;
          document.head.appendChild(tempStyle);
          tempStyles.push(tempStyle);

          // Disable original sheet
          sheet.disabled = true;
          disabledSheets.push(sheet);
        }
      } 
      // Fast Path 2: It is a <link> element. If same-origin, we try to fetch it in parallel.
      else if (ownerNode.nodeName === "LINK" || ownerNode.nodeName === "link") {
        const href = (ownerNode as HTMLLinkElement).href;
        if (href && href.startsWith(window.location.origin)) {
          const p = fetchWithTimeout(href).then(cssText => {
            if (cssText) {
              if (cssText.includes("oklch") || cssText.includes("oklab")) {
                const sanitizedText = cssText.replace(
                  /(oklch|oklab)\((?:[^()]+|\([^()]*\))*\)/g,
                  "rgb(13, 148, 136)"
                );

                const tempStyle = document.createElement("style");
                tempStyle.textContent = sanitizedText;
                document.head.appendChild(tempStyle);
                tempStyles.push(tempStyle);

                sheet.disabled = true;
                disabledSheets.push(sheet);
              }
            } else {
              // Failsafe: if fetch failed or timed out, we check if it is a large stylesheet.
              // Large unsanitized sheets containing oklch MUST be disabled during PDF generation 
              // to prevent html2canvas CPU lockups / infinite loops.
              try {
                const rules = sheet.cssRules || sheet.rules;
                if (rules && rules.length > 300) {
                  console.warn(`Disabling large unsanitized stylesheet (${rules.length} rules) as a safety precaution.`);
                  sheet.disabled = true;
                  disabledSheets.push(sheet);
                }
              } catch (ruleErr) {
                // If readable but rules throw cross-origin errors, play safe and temporarily disable
                console.warn("Could not read stylesheet rules on fallback:", ruleErr);
                sheet.disabled = true;
                disabledSheets.push(sheet);
              }
            }
          });
          sheetPromises.push(p);
        }
      }
    } catch (e) {
      console.warn("Error pre-processing stylesheet:", e);
    }
  }

  // Wait for all same-origin linked stylesheets to fetch and process (max timeout bound)
  try {
    await Promise.all(sheetPromises);
  } catch (err) {
    console.error("Error waiting for parallel stylesheets:", err);
  }

  try {
    const result = await callback();
    return result;
  } finally {
    // Restore all stylesheets immediately after the PDF render completes
    setTimeout(() => {
      disabledSheets.forEach(sheet => {
        sheet.disabled = false;
      });
      tempStyles.forEach(style => {
        style.remove();
      });
    }, 400);
  }
}



export const printHTML = (htmlContent: string) => {
  const isLandscape = htmlContent.includes('size: landscape');
  const filename = 'تقرير.pdf';

  const fullHtml = `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap');
      .pdf-container {
        font-family: 'Tajawal', sans-serif;
        direction: rtl;
        background-color: #ffffff;
        padding: 10mm;
        width: ${isLandscape ? '297mm' : '210mm'};
        box-sizing: border-box;
      }
      .pdf-container table { width: 100%; border-collapse: collapse; }
      .pdf-container th, .pdf-container td { border: 1px solid #cbd5e1; padding: 8px; text-align: right; }
      .pdf-container th { background-color: #f8fafc; font-weight: 700; }
    </style>
    <div class="pdf-container">
      ${htmlContent}
    </div>
  `;

  const opt = {
    margin:       [5, 5, 5, 5] as [number, number, number, number],
    filename:     filename,
    image:        { type: 'jpeg' as const, quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true, windowWidth: isLandscape ? 1122 : 794 },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: isLandscape ? 'landscape' as const : 'portrait' as const }
  };

  runWithOklchFix(async () => {
    try {
      const pdfWorker = html2pdf().set(opt).from(fullHtml);
      const blob = await pdfWorker.output('blob');
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 200);
    } catch (err) {
      console.error("PDF generation/download error, falling back to standard save:", err);
      try {
        await html2pdf().set(opt).from(fullHtml).save();
      } catch (fallbackErr) {
        console.error("PDF standard save fallback also failed:", fallbackErr);
      }
    }
  });
};

export const printElementAsPDF = (elementId: string, filename: string, isLandscape: boolean = true) => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error("Element not found for PDF export");
    return;
  }
  
  const opt = {
    margin:       [5, 5, 5, 5] as [number, number, number, number],
    filename:     filename,
    image:        { type: 'jpeg' as const, quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true, windowWidth: isLandscape ? 1122 : 794 },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: isLandscape ? 'landscape' as const : 'portrait' as const }
  };

  runWithOklchFix(async () => {
    try {
      const pdfWorker = html2pdf().set(opt).from(element);
      const blob = await pdfWorker.output('blob');
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 200);
    } catch (err) {
      console.error("PDF generation/download error, falling back to standard save:", err);
      try {
        await html2pdf().set(opt).from(element).save();
      } catch (fallbackErr) {
        console.error("PDF standard save fallback also failed:", fallbackErr);
      }
    }
  });
};
