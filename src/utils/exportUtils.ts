import { Branch } from '../types';
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Invoice, Customer, ActivityLog, User, Ticket, MailMessage, PrivateMessage, Warning } from '../types';

// Helper to convert arrays to CSV with UTF-8 BOM support for perfect Arabic translation in Excel
export function exportToCSV(headers: string[], rows: string[][], filename: string) {
  const csvContent = [
    headers.join(','),
    ...rows.map(row => 
      row.map(value => {
        // Escape quotes and wrap in quotes if there is a comma or quote
        const stringVal = value ? String(value) : '';
        const cleanVal = stringVal.replace(/"/g, '""');
        return `"${cleanVal}"`;
      }).join(',')
    )
  ].join('\n');

  // Inject UTF-8 BOM to force Excel to read Arabic correctly
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Function to download ALL system data in a single multi-section CSV file
export function exportAllDataCSV(
  invoices: Invoice[],
  customers: Customer[],
  logs: ActivityLog[],
  users: User[],
  tickets: Ticket[] = [],
  warnings: Warning[] = [],
  mails: MailMessage[] = [],
  privateMessages: PrivateMessage[] = []
) {
  let content = '\uFEFF'; // Start with UTF-8 BOM
  
  // Section 1: Customers
  content += '--- 1. بيانات العملاء (CUSTOMERS) ---\n';
  const customerHeaders = ['المعرف', 'النوع', 'الاسم', 'الهاتف', 'الرقم المدني / السجل التجاري', 'اسم المالك', 'الحالة', 'تاريخ الإنشاء'];
  content += customerHeaders.join(',') + '\n';
  customers.forEach(c => {
    const row = [
      c.id,
      c.type === 'individual' ? 'فرد' : 'منشأة',
      c.name,
      c.phone,
      c.type === 'individual' ? (c.civilId || '') : (c.registrationNumber || ''),
      c.ownerName || '',
      c.status === 'active' ? 'نشط' : c.status === 'late' ? 'متأخر' : 'مغلق',
      c.createdAt
    ];
    content += row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',') + '\n';
  });
  
  content += '\n\n';
  
  // Section 2: Invoices
  content += '--- 2. بيانات الفواتير (INVOICES) ---\n';
  const invoiceHeaders = ['رقم الفاتورة', 'العميل', 'المبلغ الإجمالي', 'الخصم', 'المقدم المدفوع', 'المبلغ المتبقي', 'الحالة', 'تاريخ الإنشاء', 'الموظف'];
  content += invoiceHeaders.join(',') + '\n';
  invoices.forEach(inv => {
    const customerName = customers.find(c => c.id === inv.customerId)?.name || 'عميل غير معروف';
    const row = [
      inv.invoiceNumber,
      customerName,
      inv.totalAmount.toFixed(3),
      (inv.discount || 0).toFixed(3),
      inv.downPayment.toFixed(3),
      inv.remainingAmount.toFixed(3),
      inv.status === 'paid' ? 'مدفوعة' : inv.status === 'unpaid' ? 'غير مدفوعة' : inv.status === 'partially_paid' ? 'مدفوعة جزئياً' : 'مسودة',
      inv.createdAt,
      inv.lastModifiedBy
    ];
    content += row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',') + '\n';
  });

  content += '\n\n';

  // Section 3: Users
  content += '--- 3. بيانات المستخدمين والصلاحيات (USERS & ROLES) ---\n';
  const userHeaders = ['الاسم', 'اسم المستخدم', 'الدور/الصلاحية', 'الحالة'];
  content += userHeaders.join(',') + '\n';
  users.forEach(u => {
    const row = [
      u.name,
      u.username,
      u.role === 'admin' ? 'مدير النظام' : 'موظف',
      u.isActive ? 'نشط' : 'معطل'
    ];
    content += row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',') + '\n';
  });

  content += '\n\n';

  // Section 4: Activity Logs
  content += '--- 4. سجل الأنشطة والعمليات (ACTIVITY LOGS) ---\n';
  const logHeaders = ['المستخدم', 'العملية / الإجراء', 'الوقت والتاريخ'];
  content += logHeaders.join(',') + '\n';
  logs.forEach(l => {
    const row = [
      l.username,
      l.action,
      l.timestamp
    ];
    content += row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',') + '\n';
  });

  content += '\n\n';

  // Section 5: Tickets
  content += '--- 5. التذاكر (TICKETS) ---\n';
  const ticketHeaders = ['رقم التذكرة', 'العنوان', 'النوع', 'الحالة', 'الموظف'];
  content += ticketHeaders.join(',') + '\n';
  tickets.forEach(t => {
    const row = [
      t.ticketNumber,
      t.title,
      t.type,
      t.status,
      t.employeeName
    ];
    content += row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',') + '\n';
  });

  content += '\n\n';

  // Section 6: Warnings
  content += '--- 6. الإنذارات (WARNINGS) ---\n';
  const warningHeaders = ['رقم الإنذار', 'الموظف', 'النوع', 'الدرجة', 'المرسل'];
  content += warningHeaders.join(',') + '\n';
  warnings.forEach(w => {
    const row = [
      w.warningNumber,
      w.employeeName,
      w.typeName,
      w.degree,
      w.senderName
    ];
    content += row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',') + '\n';
  });

  content += '\n\n';

  // Section 7: Mail
  content += '--- 7. البريد الوارد/المرسل (MAIL) ---\n';
  const mailHeaders = ['الموضوع', 'المرسل', 'المستلم', 'مقروء', 'التاريخ'];
  content += mailHeaders.join(',') + '\n';
  mails.forEach(m => {
    const receiver = users.find(u => u.id === m.receiverId)?.name || m.receiverId;
    const row = [
      m.subject,
      m.senderName,
      receiver,
      m.isRead ? 'نعم' : 'لا',
      new Date(m.createdAt).toLocaleDateString('ar-OM')
    ];
    content += row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',') + '\n';
  });

  content += '\n\n';

  // Section 8: Private Messages
  content += '--- 8. الرسائل الخاصة (PRIVATE CHATS) ---\n';
  const pmHeaders = ['من', 'إلى', 'الرسالة', 'التاريخ'];
  content += pmHeaders.join(',') + '\n';
  privateMessages.forEach(m => {
    const sender = users.find(u => u.id === m.senderId)?.name || m.senderId;
    const receiver = users.find(u => u.id === m.receiverId)?.name || m.receiverId;
    const row = [
      sender,
      receiver,
      m.content,
      new Date(m.createdAt).toLocaleString('ar-OM')
    ];
    content += row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',') + '\n';
  });

  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `كامل_بيانات_المنصة_الرقمية_الموحدة_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Function to download ALL system data in a beautifully formatted multi-sheet Excel workbook (SpreadsheetML)
export function exportAllDataExcel(
  invoices: Invoice[],
  customers: Customer[],
  services: any[],
  users: User[],
  logs: ActivityLog[],
  tickets: any[] = [],
  warnings: any[] = [],
  mails: any[] = [],
  privateMessages: any[] = [],
  deletedInvoices: any[] = []
) {
  // Simple XML entity escaper helper to prevent corrupting the Excel XML syntax
  const escapeXml = (unsafe: any): string => {
    if (unsafe === null || unsafe === undefined) return '';
    return String(unsafe)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
      .replace(/\n/g, '&#10;');
  };

  const timestampStr = new Date().toLocaleString('ar-OM', { hour12: true });

  let xml = `<?xml version="1.0" encoding="utf-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
  <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
    <Author>المنصة الرقمية الموحدة لإدارة العمليات والموارد - مركز سند الريادة للخدمات</Author>
    <LastAuthor>المنصة الرقمية الموحدة لإدارة العمليات والموارد - مركز سند الريادة للخدمات</LastAuthor>
    <Created>${new Date().toISOString()}</Created>
  </DocumentProperties>
  <Styles>
    <Style ss:ID="Default" ss:Name="Normal">
      <Alignment ss:Vertical="Top" ss:Horizontal="Right" ss:WrapText="1"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
      </Borders>
      <Font ss:FontName="Segoe UI" ss:Size="10" ss:Color="#1E293B"/>
      <Interior/>
      <NumberFormat/>
      <Protection/>
    </Style>
    <Style ss:ID="Header">
      <Font ss:FontName="Segoe UI" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/>
      <Interior ss:Color="#0F766E" ss:Pattern="Solid"/>
      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#0F766E"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#0F766E"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#0F766E"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#0F766E"/>
      </Borders>
    </Style>
    <Style ss:ID="Title">
      <Font ss:FontName="Segoe UI" ss:Size="16" ss:Bold="1" ss:Color="#0F766E"/>
      <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
      <Borders/>
    </Style>
    <Style ss:ID="SubTitle">
      <Font ss:FontName="Segoe UI" ss:Size="10" ss:Color="#64748B"/>
      <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
      <Borders/>
    </Style>
    <Style ss:ID="CellBold">
      <Font ss:FontName="Segoe UI" ss:Size="10" ss:Bold="1" ss:Color="#1E293B"/>
    </Style>
    <Style ss:ID="CellMoney">
      <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
      <NumberFormat ss:Format="#,##0.000"/>
    </Style>
    <Style ss:ID="CellNumber">
      <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
    </Style>
  </Styles>
  
  <Worksheet ss:Name="1. سجل العملاء">
    <Table ss:DefaultColumnWidth="120">
      <Column ss:Width="100"/>
      <Column ss:Width="80"/>
      <Column ss:Width="180"/>
      <Column ss:Width="100"/>
      <Column ss:Width="140"/>
      <Column ss:Width="140"/>
      <Column ss:Width="80"/>
      <Column ss:Width="120"/>
      <Row ss:Height="30">
        <Cell ss:MergeAcross="7" ss:StyleID="Title"><Data ss:Type="String">سجل عملاء المنصة الرقمية الموحدة لإدارة العمليات والموارد - مركز سند الريادة للخدمات</Data></Cell>
      </Row>
      <Row ss:AutoFitHeight="1">
        <Cell ss:MergeAcross="7" ss:StyleID="SubTitle"><Data ss:Type="String">تم تصدير التقرير في: ${timestampStr} | إجمالي العملاء: ${customers.length}</Data></Cell>
      </Row>
      <Row ss:Height="25">
        <Cell ss:StyleID="Header"><Data ss:Type="String">المعرف (ID)</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">نوع العميل</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">الاسم الكامل</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">رقم الهاتف</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">رقم المدني / السجل التجاري</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">اسم المالك</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">الحالة</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">تاريخ التسجيل</Data></Cell>
      </Row>
      ${customers.map(c => `
      <Row ss:AutoFitHeight="1">
        <Cell><Data ss:Type="String">${escapeXml(c.id)}</Data></Cell>
        <Cell><Data ss:Type="String">${c.type === 'individual' ? 'فرد' : 'منشأة'}</Data></Cell>
        <Cell ss:StyleID="CellBold"><Data ss:Type="String">${escapeXml(c.name)}</Data></Cell>
        <Cell ss:StyleID="CellNumber"><Data ss:Type="String">${escapeXml(c.phone)}</Data></Cell>
        <Cell><Data ss:Type="String">${c.type === 'individual' ? escapeXml(c.civilId || '-') : escapeXml(c.registrationNumber || '-')}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(c.ownerName || '-')}</Data></Cell>
        <Cell><Data ss:Type="String">${c.status === 'active' ? 'نشط' : c.status === 'late' ? 'متأخر' : 'مغلق'}</Data></Cell>
        <Cell><Data ss:Type="String">${c.createdAt ? new Date(c.createdAt).toLocaleDateString('ar-OM') : '-'}</Data></Cell>
      </Row>
      `).join('')}
    </Table>
  </Worksheet>

  <Worksheet ss:Name="2. سجل الفواتير">
    <Table ss:DefaultColumnWidth="120">
      <Column ss:Width="100"/>
      <Column ss:Width="180"/>
      <Column ss:Width="250"/>
      <Column ss:Width="100"/>
      <Column ss:Width="100"/>
      <Column ss:Width="100"/>
      <Column ss:Width="100"/>
      <Column ss:Width="100"/>
      <Column ss:Width="120"/>
      <Column ss:Width="120"/>
      <Row ss:Height="30">
        <Cell ss:MergeAcross="9" ss:StyleID="Title"><Data ss:Type="String">سجل فواتير المنصة الرقمية الموحدة لإدارة العمليات والموارد - مركز سند الريادة للخدمات</Data></Cell>
      </Row>
      <Row ss:AutoFitHeight="1">
        <Cell ss:MergeAcross="9" ss:StyleID="SubTitle"><Data ss:Type="String">تم تصدير التقرير في: ${timestampStr} | إجمالي الفواتير: ${invoices.length}</Data></Cell>
      </Row>
      <Row ss:Height="25">
        <Cell ss:StyleID="Header"><Data ss:Type="String">رقم الفاتورة</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">العميل</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">البنود والخدمات التفصيلية</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">المبلغ الإجمالي</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">الخصم</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">المقدم المدفوع</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">المبلغ المتبقي</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">الحالة</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">تاريخ الفاتورة</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">بواسطة</Data></Cell>
      </Row>
      ${invoices.map(inv => {
        const customerName = customers.find(c => c.id === inv.customerId)?.name || 'غير معروف';
        const itemsSummary = inv.items ? inv.items.map(item => `${item.serviceName} (${item.quantity} × ${item.price.toFixed(3)})`).join(' | ') : '-';
        return `
      <Row ss:AutoFitHeight="1">
        <Cell ss:StyleID="CellBold"><Data ss:Type="String">${escapeXml(inv.invoiceNumber)}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(customerName)}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(itemsSummary)}</Data></Cell>
        <Cell ss:StyleID="CellMoney"><Data ss:Type="Number">${inv.totalAmount}</Data></Cell>
        <Cell ss:StyleID="CellMoney"><Data ss:Type="Number">${inv.discount || 0}</Data></Cell>
        <Cell ss:StyleID="CellMoney"><Data ss:Type="Number">${inv.downPayment}</Data></Cell>
        <Cell ss:StyleID="CellMoney"><Data ss:Type="Number">${inv.remainingAmount}</Data></Cell>
        <Cell><Data ss:Type="String">${inv.status === 'paid' ? 'مدفوعة كاملة' : inv.status === 'partially_paid' ? 'مدفوعة جزئياً' : inv.status === 'unpaid' ? 'غير مدفوعة' : 'مسودة'}</Data></Cell>
        <Cell><Data ss:Type="String">${inv.createdAt ? new Date(inv.createdAt).toLocaleDateString('ar-OM') : '-'}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(inv.createdBy || '-')}</Data></Cell>
      </Row>
        `;
      }).join('')}
    </Table>
  </Worksheet>

  <Worksheet ss:Name="3. تفاصيل بنود الفواتير">
    <Table ss:DefaultColumnWidth="120">
      <Column ss:Width="100"/>
      <Column ss:Width="180"/>
      <Column ss:Width="200"/>
      <Column ss:Width="80"/>
      <Column ss:Width="100"/>
      <Column ss:Width="100"/>
      <Column ss:Width="140"/>
      <Column ss:Width="100"/>
      <Row ss:Height="30">
        <Cell ss:MergeAcross="7" ss:StyleID="Title"><Data ss:Type="String">تفاصيل بنود وخدمات الفواتير</Data></Cell>
      </Row>
      <Row ss:AutoFitHeight="1">
        <Cell ss:MergeAcross="7" ss:StyleID="SubTitle"><Data ss:Type="String">تم تصدير التقرير في: ${timestampStr}</Data></Cell>
      </Row>
      <Row ss:Height="25">
        <Cell ss:StyleID="Header"><Data ss:Type="String">رقم الفاتورة</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">العميل</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">اسم الخدمة / البند</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">الكمية</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">سعر الوحدة</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">الخصم على البند</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">الموظف المنفذ</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">المجموع الصافي</Data></Cell>
      </Row>
      ${invoices.flatMap(inv => {
        const customerName = customers.find(c => c.id === inv.customerId)?.name || 'غير معروف';
        if (!inv.items || inv.items.length === 0) return [];
        return inv.items.map(item => `
      <Row ss:AutoFitHeight="1">
        <Cell ss:StyleID="CellBold"><Data ss:Type="String">${escapeXml(inv.invoiceNumber)}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(customerName)}</Data></Cell>
        <Cell ss:StyleID="CellBold"><Data ss:Type="String">${escapeXml(item.serviceName)}</Data></Cell>
        <Cell ss:StyleID="CellNumber"><Data ss:Type="Number">${item.quantity}</Data></Cell>
        <Cell ss:StyleID="CellMoney"><Data ss:Type="Number">${item.price}</Data></Cell>
        <Cell ss:StyleID="CellMoney"><Data ss:Type="Number">${item.discount || 0}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(item.employeeName || '-')}</Data></Cell>
        <Cell ss:StyleID="CellMoney"><Data ss:Type="Number">${item.total}</Data></Cell>
      </Row>
        `);
      }).join('')}
    </Table>
  </Worksheet>

  <Worksheet ss:Name="4. دليل الخدمات">
    <Table ss:DefaultColumnWidth="120">
      <Column ss:Width="120"/>
      <Column ss:Width="250"/>
      <Column ss:Width="120"/>
      <Row ss:Height="30">
        <Cell ss:MergeAcross="2" ss:StyleID="Title"><Data ss:Type="String">دليل الخدمات المضافة المعتمدة بالنظام</Data></Cell>
      </Row>
      <Row ss:AutoFitHeight="1">
        <Cell ss:MergeAcross="2" ss:StyleID="SubTitle"><Data ss:Type="String">تم تصدير التقرير في: ${timestampStr} | إجمالي الخدمات: ${services.length}</Data></Cell>
      </Row>
      <Row ss:Height="25">
        <Cell ss:StyleID="Header"><Data ss:Type="String">المعرف (ID)</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">اسم الخدمة</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">السعر الافتراضي</Data></Cell>
      </Row>
      ${services.map(s => `
      <Row ss:AutoFitHeight="1">
        <Cell><Data ss:Type="String">${escapeXml(s.id)}</Data></Cell>
        <Cell ss:StyleID="CellBold"><Data ss:Type="String">${escapeXml(s.name)}</Data></Cell>
        <Cell ss:StyleID="CellMoney"><Data ss:Type="Number">${s.defaultPrice ? Number(s.defaultPrice) : 0}</Data></Cell>
      </Row>
      `).join('')}
    </Table>
  </Worksheet>

  <Worksheet ss:Name="5. سجل الموظفين">
    <Table ss:DefaultColumnWidth="120">
      <Column ss:Width="100"/>
      <Column ss:Width="180"/>
      <Column ss:Width="140"/>
      <Column ss:Width="120"/>
      <Column ss:Width="100"/>
      <Row ss:Height="30">
        <Cell ss:MergeAcross="4" ss:StyleID="Title"><Data ss:Type="String">سجل الموظفين والمستخدمين المصرحين</Data></Cell>
      </Row>
      <Row ss:AutoFitHeight="1">
        <Cell ss:MergeAcross="4" ss:StyleID="SubTitle"><Data ss:Type="String">تم تصدير التقرير في: ${timestampStr} | إجمالي المستخدمين: ${users.filter(u => !u.id.endsWith('_config')).length}</Data></Cell>
      </Row>
      <Row ss:Height="25">
        <Cell ss:StyleID="Header"><Data ss:Type="String">المعرف (ID)</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">الاسم الكامل</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">اسم المستخدم</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">الدور والصلاحية</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">حالة الحساب</Data></Cell>
      </Row>
      ${users.filter(u => !u.id.endsWith('_config')).map(u => `
      <Row ss:AutoFitHeight="1">
        <Cell><Data ss:Type="String">${escapeXml(u.id)}</Data></Cell>
        <Cell ss:StyleID="CellBold"><Data ss:Type="String">${escapeXml(u.name)}</Data></Cell>
        <Cell ss:StyleID="CellNumber"><Data ss:Type="String">${escapeXml(u.username)}</Data></Cell>
        <Cell><Data ss:Type="String">${u.role === 'admin' ? 'مدير النظام' : 'موظف'}</Data></Cell>
        <Cell><Data ss:Type="String">${u.isActive ? 'نشط' : 'معطل'}</Data></Cell>
      </Row>
      `).join('')}
    </Table>
  </Worksheet>

  <Worksheet ss:Name="6. سجل العمليات والأنشطة">
    <Table ss:DefaultColumnWidth="120">
      <Column ss:Width="100"/>
      <Column ss:Width="140"/>
      <Column ss:Width="180"/>
      <Column ss:Width="300"/>
      <Column ss:Width="180"/>
      <Row ss:Height="30">
        <Cell ss:MergeAcross="4" ss:StyleID="Title"><Data ss:Type="String">سجل العمليات والأنشطة بالنظام</Data></Cell>
      </Row>
      <Row ss:AutoFitHeight="1">
        <Cell ss:MergeAcross="4" ss:StyleID="SubTitle"><Data ss:Type="String">تم تصدير التقرير في: ${timestampStr} | إجمالي العمليات: ${logs.length}</Data></Cell>
      </Row>
      <Row ss:Height="25">
        <Cell ss:StyleID="Header"><Data ss:Type="String">المعرف (ID)</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">المستخدم / الموظف</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">نوع العملية</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">تفاصيل الإجراء</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">الوقت والتاريخ</Data></Cell>
      </Row>
      ${logs.map(l => `
      <Row ss:AutoFitHeight="1">
        <Cell><Data ss:Type="String">${escapeXml(l.id)}</Data></Cell>
        <Cell ss:StyleID="CellBold"><Data ss:Type="String">${escapeXml(l.username)}</Data></Cell>
        <Cell ss:StyleID="CellBold"><Data ss:Type="String">${escapeXml(l.action)}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(l.details || '-')}</Data></Cell>
        <Cell><Data ss:Type="String">${l.timestamp ? new Date(l.timestamp).toLocaleString('ar-OM', { hour12: true }) : '-'}</Data></Cell>
      </Row>
      `).join('')}
    </Table>
  </Worksheet>

  <Worksheet ss:Name="7. سجل التذاكر">
    <Table ss:DefaultColumnWidth="120">
      <Column ss:Width="100"/>
      <Column ss:Width="150"/>
      <Column ss:Width="200"/>
      <Column ss:Width="100"/>
      <Column ss:Width="300"/>
      <Column ss:Width="100"/>
      <Column ss:Width="150"/>
      <Row ss:Height="30">
        <Cell ss:MergeAcross="6" ss:StyleID="Title"><Data ss:Type="String">سجل تذاكر الدعم والطلبات</Data></Cell>
      </Row>
      <Row ss:AutoFitHeight="1">
        <Cell ss:MergeAcross="6" ss:StyleID="SubTitle"><Data ss:Type="String">تم تصدير التقرير في: ${timestampStr} | إجمالي التذاكر: ${tickets.length}</Data></Cell>
      </Row>
      <Row ss:Height="25">
        <Cell ss:StyleID="Header"><Data ss:Type="String">المعرف (ID)</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">رقم التذكرة</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">العنوان</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">النوع</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">التفاصيل</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">الحالة</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">الموظف المعني</Data></Cell>
      </Row>
      ${tickets.map(t => `
      <Row ss:AutoFitHeight="1">
        <Cell><Data ss:Type="String">${escapeXml(t.id)}</Data></Cell>
        <Cell ss:StyleID="CellBold"><Data ss:Type="String">${escapeXml(t.ticketNumber)}</Data></Cell>
        <Cell ss:StyleID="CellBold"><Data ss:Type="String">${escapeXml(t.title)}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(t.type)}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(t.details)}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(t.status)}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(t.employeeName || '-')}</Data></Cell>
      </Row>
      `).join('')}
    </Table>
  </Worksheet>

  <Worksheet ss:Name="8. سجل الإنذارات والمخالفات">
    <Table ss:DefaultColumnWidth="120">
      <Column ss:Width="100"/>
      <Column ss:Width="150"/>
      <Column ss:Width="150"/>
      <Column ss:Width="150"/>
      <Column ss:Width="200"/>
      <Column ss:Width="100"/>
      <Column ss:Width="100"/>
      <Column ss:Width="150"/>
      <Column ss:Width="150"/>
      <Row ss:Height="30">
        <Cell ss:MergeAcross="8" ss:StyleID="Title"><Data ss:Type="String">سجل الإنذارات والمخالفات</Data></Cell>
      </Row>
      <Row ss:AutoFitHeight="1">
        <Cell ss:MergeAcross="8" ss:StyleID="SubTitle"><Data ss:Type="String">تم تصدير التقرير في: ${timestampStr} | إجمالي الإنذارات: ${warnings.length}</Data></Cell>
      </Row>
      <Row ss:Height="25">
        <Cell ss:StyleID="Header"><Data ss:Type="String">رقم الإنذار</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">الموظف</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">نوع المخالفة</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">البند الفرعي (التفاصيل)</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">نص الإنذار (ملاحظات)</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">الدرجة</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">الحالة</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">المرسل</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">تاريخ الإنذار</Data></Cell>
      </Row>
      ${warnings.map(w => `
      <Row ss:AutoFitHeight="1">
        <Cell ss:StyleID="CellBold"><Data ss:Type="String">${escapeXml(w.warningNumber)}</Data></Cell>
        <Cell ss:StyleID="CellBold"><Data ss:Type="String">${escapeXml(w.employeeName)}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(w.typeName)}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(w.subTypeName || '-')}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(w.details || '-')}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(w.degree)}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(w.status === 'new' ? 'جديد' : w.status === 'read' ? 'مقروء' : w.status === 'appealed' ? 'تم الرد/التماس' : 'مغلق')}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(w.senderName)}</Data></Cell>
        <Cell><Data ss:Type="String">${w.createdAt ? new Date(w.createdAt).toLocaleDateString('ar-OM') : '-'}</Data></Cell>
      </Row>
      `).join('')}
    </Table>
  </Worksheet>

  <Worksheet ss:Name="9. البريد الصادر والوارد">
    <Table ss:DefaultColumnWidth="120">
      <Column ss:Width="250"/>
      <Column ss:Width="150"/>
      <Column ss:Width="150"/>
      <Column ss:Width="100"/>
      <Column ss:Width="150"/>
      <Row ss:Height="30">
        <Cell ss:MergeAcross="4" ss:StyleID="Title"><Data ss:Type="String">سجل البريد الداخلي للمنصة</Data></Cell>
      </Row>
      <Row ss:AutoFitHeight="1">
        <Cell ss:MergeAcross="4" ss:StyleID="SubTitle"><Data ss:Type="String">تم تصدير التقرير في: ${timestampStr} | إجمالي الرسائل: ${mails.length}</Data></Cell>
      </Row>
      <Row ss:Height="25">
        <Cell ss:StyleID="Header"><Data ss:Type="String">الموضوع</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">المرسل</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">المستلم</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">مقروء</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">تاريخ الإرسال</Data></Cell>
      </Row>
      ${mails.map(m => {
        const receiver = users.find(u => u.id === m.receiverId)?.name || m.receiverId;
        return `
      <Row ss:AutoFitHeight="1">
        <Cell ss:StyleID="CellBold"><Data ss:Type="String">${escapeXml(m.subject)}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(m.senderName)}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(receiver)}</Data></Cell>
        <Cell><Data ss:Type="String">${m.isRead ? 'نعم' : 'لا'}</Data></Cell>
        <Cell><Data ss:Type="String">${m.createdAt ? new Date(m.createdAt).toLocaleString('ar-OM', { hour12: true }) : '-'}</Data></Cell>
      </Row>
        `;
      }).join('')}
    </Table>
  </Worksheet>

  <Worksheet ss:Name="10. سجل الرسائل الخاصة">
    <Table ss:DefaultColumnWidth="120">
      <Column ss:Width="150"/>
      <Column ss:Width="150"/>
      <Column ss:Width="300"/>
      <Column ss:Width="150"/>
      <Row ss:Height="30">
        <Cell ss:MergeAcross="3" ss:StyleID="Title"><Data ss:Type="String">سجل المحادثات والرسائل الخاصة</Data></Cell>
      </Row>
      <Row ss:AutoFitHeight="1">
        <Cell ss:MergeAcross="3" ss:StyleID="SubTitle"><Data ss:Type="String">تم تصدير التقرير في: ${timestampStr} | إجمالي الرسائل: ${privateMessages.length}</Data></Cell>
      </Row>
      <Row ss:Height="25">
        <Cell ss:StyleID="Header"><Data ss:Type="String">المرسل</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">المستلم</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">الرسالة</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">تاريخ الإرسال</Data></Cell>
      </Row>
      ${privateMessages.map(m => {
        const sender = users.find(u => u.id === m.senderId)?.name || m.senderId;
        const receiver = users.find(u => u.id === m.receiverId)?.name || m.receiverId;
        return `
      <Row ss:AutoFitHeight="1">
        <Cell ss:StyleID="CellBold"><Data ss:Type="String">${escapeXml(sender)}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(receiver)}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(m.content)}</Data></Cell>
        <Cell><Data ss:Type="String">${m.createdAt ? new Date(m.createdAt).toLocaleString('ar-OM', { hour12: true }) : '-'}</Data></Cell>
      </Row>
        `;
      }).join('')}
    </Table>
  </Worksheet>

  <Worksheet ss:Name="11. إعدادات الفروع">
    <Table ss:DefaultColumnWidth="120">
      <Column ss:Width="100"/>
      <Column ss:Width="200"/>
      <Column ss:Width="150"/>
      <Column ss:Width="150"/>
      <Column ss:Width="250"/>
      <Row ss:Height="30">
        <Cell ss:MergeAcross="4" ss:StyleID="Title"><Data ss:Type="String">إعدادات الفروع المتعددة</Data></Cell>
      </Row>
      <Row ss:Height="25">
        <Cell ss:StyleID="Header"><Data ss:Type="String">المعرف</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">اسم الفرع</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">رقم الهاتف</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">البريد الإلكتروني</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">العنوان</Data></Cell>
      </Row>
      ${(() => {
        const branchUser = users.find(u => u.id === 'branches_config');
        const branches = branchUser?.branches || [];
        return branches.map((b: any) => `
      <Row ss:AutoFitHeight="1">
        <Cell><Data ss:Type="String">${escapeXml(b.id)}</Data></Cell>
        <Cell ss:StyleID="CellBold"><Data ss:Type="String">${escapeXml(b.name)}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(b.phone || '-')}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(b.email || '-')}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(b.address || '-')}</Data></Cell>
      </Row>
        `).join('');
      })()}
    </Table>
  </Worksheet>

  <Worksheet ss:Name="12. إعدادات التذاكر">
    <Table ss:DefaultColumnWidth="150">
      <Column ss:Width="200"/>
      <Column ss:Width="300"/>
      <Column ss:Width="150"/>
      <Row ss:Height="30">
        <Cell ss:MergeAcross="2" ss:StyleID="Title"><Data ss:Type="String">إعدادات التذاكر والطلبات الداخلية</Data></Cell>
      </Row>
      <Row ss:Height="25">
        <Cell ss:StyleID="Header"><Data ss:Type="String">نوع التذكرة / الطلب</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">التلميح (Placeholder)</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">المدير المسؤول</Data></Cell>
      </Row>
      ${(() => {
        const ticketUser = users.find(u => u.id === 'tickets_config');
        const types = ticketUser?.ticketTypes || [];
        const placeholders = ticketUser?.ticketTypePlaceholders || {};
        const managers = ticketUser?.ticketManagers || {};
        return types.map((type: string) => `
      <Row ss:AutoFitHeight="1">
        <Cell ss:StyleID="CellBold"><Data ss:Type="String">${escapeXml(type)}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(placeholders[type] || '-')}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml((managers[type] || []).map((mid: string) => users.find(u => u.id === mid)?.name).filter(Boolean).join('، ') || 'بدون مدير')}</Data></Cell>
      </Row>
        `).join('');
      })()}
    </Table>
  </Worksheet>

  <Worksheet ss:Name="13. أنواع الإنذارات">
    <Table ss:DefaultColumnWidth="150">
      <Column ss:Width="200"/>
      <Column ss:Width="350"/>
      <Column ss:Width="300"/>
      <Column ss:Width="100"/>
      <Row ss:Height="30">
        <Cell ss:MergeAcross="3" ss:StyleID="Title"><Data ss:Type="String">أنواع الإنذارات والمخالفات</Data></Cell>
      </Row>
      <Row ss:Height="25">
        <Cell ss:StyleID="Header"><Data ss:Type="String">نوع المخالفة</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">البنود والتفاصيل الفرعية</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">الوصف والتفاصيل</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">الدرجة الافتراضية</Data></Cell>
      </Row>
      ${(() => {
        const warningUser = users.find(u => u.id === 'warnings_config');
        const warningTypes = warningUser?.warningTypes || [];
        return warningTypes.map((wt: any) => {
          const subOptionsStr = wt.subOptions && wt.subOptions.length > 0 
            ? wt.subOptions.map((opt: any) => opt.name).join(' | ') 
            : 'لا توجد بنود فرعية';
          return `
      <Row ss:AutoFitHeight="1">
        <Cell ss:StyleID="CellBold"><Data ss:Type="String">${escapeXml(wt.name)}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(subOptionsStr)}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(wt.description || '-')}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(wt.degree || '-')}</Data></Cell>
      </Row>
        `;
        }).join('');
      })()}
    </Table>
  </Worksheet>

  <Worksheet ss:Name="14. الفواتير المحذوفة (سلة المحذوفات)">
    <Table ss:DefaultColumnWidth="120">
      <Column ss:Width="100"/>
      <Column ss:Width="180"/>
      <Column ss:Width="100"/>
      <Column ss:Width="150"/>
      <Column ss:Width="150"/>
      <Row ss:Height="30">
        <Cell ss:MergeAcross="4" ss:StyleID="Title"><Data ss:Type="String">سجل الفواتير المحذوفة (سلة المحذوفات)</Data></Cell>
      </Row>
      <Row ss:Height="25">
        <Cell ss:StyleID="Header"><Data ss:Type="String">رقم الفاتورة</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">العميل</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">المبلغ</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">تاريخ الحذف</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">بواسطة (الحذف)</Data></Cell>
      </Row>
      ${(() => {
        return deletedInvoices.map((inv: any) => `
      <Row ss:AutoFitHeight="1">
        <Cell ss:StyleID="CellBold"><Data ss:Type="String">${escapeXml(inv.invoiceNumber)}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(inv.customerName || 'غير معروف')}</Data></Cell>
        <Cell ss:StyleID="CellMoney"><Data ss:Type="Number">${inv.totalAmount || 0}</Data></Cell>
        <Cell><Data ss:Type="String">${inv.deletedAt ? new Date(inv.deletedAt).toLocaleString('ar-OM') : '-'}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(inv.deletedBy || '-')}</Data></Cell>
      </Row>
        `).join('');
      })()}
    </Table>
  </Worksheet>

  <Worksheet ss:Name="15. إعدادات النظام">
    <Table ss:DefaultColumnWidth="250">
      <Column ss:Width="200"/>
      <Column ss:Width="300"/>
      <Row ss:Height="30">
        <Cell ss:MergeAcross="1" ss:StyleID="Title"><Data ss:Type="String">إعدادات النظام العامة</Data></Cell>
      </Row>
      <Row ss:Height="25">
        <Cell ss:StyleID="Header"><Data ss:Type="String">الإعداد</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">القيمة</Data></Cell>
      </Row>
      ${(() => {
        const sysUser = users.find(u => u.id === 'system_settings_config');
        const sysConfig = sysUser?.systemSettings || {};
        return `
      <Row ss:AutoFitHeight="1">
        <Cell><Data ss:Type="String">اسم المركز / المؤسسة</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml((sysConfig as any).centerName || 'مركز سند الريادة للخدمات')}</Data></Cell>
      </Row>
      <Row ss:AutoFitHeight="1">
        <Cell><Data ss:Type="String">الرقم الضريبي (إن وجد)</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml((sysConfig as any).taxNumber || '')}</Data></Cell>
      </Row>
      <Row ss:AutoFitHeight="1">
        <Cell><Data ss:Type="String">رقم هاتف المركز</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml((sysConfig as any).centerPhone || '')}</Data></Cell>
      </Row>
      <Row ss:AutoFitHeight="1">
        <Cell><Data ss:Type="String">عنوان المركز</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml((sysConfig as any).centerAddress || '')}</Data></Cell>
      </Row>
      <Row ss:AutoFitHeight="1">
        <Cell><Data ss:Type="String">نص تذييل الفاتورة</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml((sysConfig as any).invoiceFooterText || '')}</Data></Cell>
      </Row>
      <Row ss:AutoFitHeight="1">
        <Cell><Data ss:Type="String">طباعة سريعة للفواتير</Data></Cell>
        <Cell><Data ss:Type="String">${(sysConfig as any).fastPrint ? 'مفعل' : 'معطل'}</Data></Cell>
      </Row>
      <Row ss:AutoFitHeight="1">
        <Cell><Data ss:Type="String">إضافة عميل جديد تلقائياً</Data></Cell>
        <Cell><Data ss:Type="String">${(sysConfig as any).enableNewCustomer === false ? 'معطل' : 'مفعل'}</Data></Cell>
      </Row>
        `;
      })()}
    </Table>
  </Worksheet>
</Workbook>
`;

  const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `بيانات_المنصة_الرقمية_الموحدة_الشاملة_${new Date().toISOString().slice(0, 10)}.xls`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Function to download a fully responsive, beautiful, interactive OFFLINE HTML app backup
export function exportToOfflineHTML(
  invoices: Invoice[],
  customers: Customer[],
  services: any[],
  users: User[],
  logs: ActivityLog[]
) {
  const timestampStr = new Date().toLocaleString('ar-OM', { hour12: true });
  
  // Calculate stats for offline view
  const totalSales = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalDues = invoices.reduce((sum, inv) => sum + inv.remainingAmount, 0);
  const totalReceived = invoices.reduce((sum, inv) => sum + inv.downPayment, 0);
  const totalDiscounts = invoices.reduce((sum, inv) => sum + (inv.discount || 0), 0);
  
  const escapeHtml = (unsafe: string): string => {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  const htmlContent = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>المنصة الرقمية الموحدة لإدارة العمليات والموارد - مركز سند الريادة للخدمات - نسخة ويب للطوارئ</title>
  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- Arabic Font Cairo -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
  
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            sans: ['Cairo', 'sans-serif'],
          }
        }
      }
    }
  </script>
  
  <style>
    body {
      font-family: 'Cairo', sans-serif;
      background-color: #f8fafc;
    }
    @media print {
      .no-print { display: none !important; }
      .print-card {
        border: none !important;
        box-shadow: none !important;
        padding: 0 !important;
        background: white !important;
      }
      body {
        background-color: white !important;
      }
    }
    .custom-scrollbar::-webkit-scrollbar {
      width: 4px;
      height: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: #f1f5f9;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 99px;
    }
  </style>
</head>
<body class="text-slate-800 antialiased min-h-screen flex flex-col">

  <!-- TOP HEADER -->
  <header class="bg-gradient-to-r from-teal-800 to-slate-900 text-white shadow-md no-print">
    <div class="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-teal-500 rounded-2xl flex items-center justify-center font-black text-white text-lg shadow-md shadow-teal-500/20">
          ر
        </div>
        <div>
          <h1 class="text-base font-black leading-tight">المنصة الرقمية الموحدة لإدارة العمليات والموارد - مركز سند الريادة للخدمات</h1>
          <p class="text-[10px] text-teal-300">نسخة ويب سحابية أرشيفية متكاملة غير متصلة بالإنترنت (Offline)</p>
        </div>
      </div>
      
      <div class="flex items-center gap-2.5 text-xs">
        <span class="bg-teal-700/60 text-teal-200 px-3 py-1.5 rounded-full font-bold">
          تاريخ التصدير: \${timestampStr}
        </span>
        <button onclick="window.print()" class="bg-teal-500 hover:bg-teal-600 px-4 py-1.5 rounded-xl text-white font-bold cursor-pointer transition-all">
          طباعة التقرير الشامل
        </button>
      </div>
    </div>
  </header>

  <!-- NAVIGATION TABS -->
  <nav class="bg-white border-b border-slate-100 shadow-3xs sticky top-0 z-40 no-print">
    <div class="max-w-7xl mx-auto px-4 flex gap-1 overflow-x-auto custom-scrollbar">
      <button onclick="switchTab('dashboard')" id="tab-dashboard" class="px-5 py-4 border-b-2 border-teal-600 text-teal-700 font-extrabold text-xs shrink-0 flex items-center gap-1.5 transition-all">
        📊 لوحة التحكم والإحصائيات
      </button>
      <button onclick="switchTab('invoices')" id="tab-invoices" class="px-5 py-4 border-b-2 border-transparent text-slate-500 hover:text-slate-800 font-bold text-xs shrink-0 flex items-center gap-1.5 transition-all">
        📄 الفواتير والسندات (\${invoices.length})
      </button>
      <button onclick="switchTab('customers')" id="tab-customers" class="px-5 py-4 border-b-2 border-transparent text-slate-500 hover:text-slate-800 font-bold text-xs shrink-0 flex items-center gap-1.5 transition-all">
        👥 كشوفات حساب العملاء (\${customers.length})
      </button>
      <button onclick="switchTab('services')" id="tab-services" class="px-5 py-4 border-b-2 border-transparent text-slate-500 hover:text-slate-800 font-bold text-xs shrink-0 flex items-center gap-1.5 transition-all">
        💼 دليل الخدمات (\${services.length})
      </button>
      <button onclick="switchTab('users')" id="tab-users" class="px-5 py-4 border-b-2 border-transparent text-slate-500 hover:text-slate-800 font-bold text-xs shrink-0 flex items-center gap-1.5 transition-all">
        👤 طاقم الموظفين (\${users.length})
      </button>
      <button onclick="switchTab('logs')" id="tab-logs" class="px-5 py-4 border-b-2 border-transparent text-slate-500 hover:text-slate-800 font-bold text-xs shrink-0 flex items-center gap-1.5 transition-all">
        📝 سجل العمليات (\${logs.length})
      </button>
    </div>
  </nav>

  <!-- MAIN BODY WRAPPER -->
  <main class="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">

    <!-- TAB: DASHBOARD -->
    <div id="view-dashboard" class="space-y-6">
      
      <!-- Quick Metric Counters -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 no-print">
        <div class="bg-white border border-slate-100 p-5 rounded-3xl shadow-3xs space-y-2">
          <span class="text-[10px] text-slate-400 font-bold block">إجمالي مبيعات الفواتير</span>
          <span class="text-xl font-black text-teal-600 block">\${totalSales.toFixed(3)} ر.ع</span>
          <div class="h-1 w-full bg-teal-50 rounded-full overflow-hidden">
            <div class="h-full bg-teal-500 w-3/4"></div>
          </div>
        </div>
        <div class="bg-white border border-slate-100 p-5 rounded-3xl shadow-3xs space-y-2">
          <span class="text-[10px] text-slate-400 font-bold block">المبالغ المحصلة فعلياً</span>
          <span class="text-xl font-black text-emerald-600 block">\${totalReceived.toFixed(3)} ر.ع</span>
          <div class="h-1 w-full bg-emerald-50 rounded-full overflow-hidden">
            <div class="h-full bg-emerald-500 w-4/5"></div>
          </div>
        </div>
        <div class="bg-white border border-slate-100 p-5 rounded-3xl shadow-3xs space-y-2">
          <span class="text-[10px] text-slate-400 font-bold block">الديون والمتبقي للتحصيل</span>
          <span class="text-xl font-black text-amber-600 block">\${totalDues.toFixed(3)} ر.ع</span>
          <div class="h-1 w-full bg-amber-50 rounded-full overflow-hidden">
            <div class="h-full bg-amber-500 w-1/4"></div>
          </div>
        </div>
        <div class="bg-white border border-slate-100 p-5 rounded-3xl shadow-3xs space-y-2">
          <span class="text-[10px] text-slate-400 font-bold block">إجمالي الخصومات الممنوحة</span>
          <span class="text-xl font-black text-rose-600 block">\${totalDiscounts.toFixed(3)} ر.ع</span>
          <div class="h-1 w-full bg-rose-50 rounded-full overflow-hidden">
            <div class="h-full bg-rose-500 w-1/12"></div>
          </div>
        </div>
      </div>

      <!-- Quick welcome block -->
      <div class="bg-teal-50 border border-teal-100 p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div class="space-y-1 text-center md:text-right">
          <h3 class="text-sm font-black text-teal-800">أرشيف الطوارئ للريادة للخدمات السريعة</h3>
          <p class="text-[11px] text-teal-700 leading-relaxed">
            تم توليد هذه الصفحة التفاعلية لتشغيلها بشكل مستقل تماماً على أي جهاز كمبيوتر أو جوال دون الحاجة للاتصال بخادم الإنترنت. تمنحك إمكانية البحث الفوري، فرز الفواتير، عرض كشوف الحسابات للعملاء والطباعة السريعة.
          </p>
        </div>
        <div class="px-4 py-2 bg-white/80 backdrop-blur-xs border border-teal-200/50 rounded-2xl text-[10px] text-teal-800 font-bold font-mono">
          إصدار أرشيفي: v3.0 Offline
        </div>
      </div>

      <!-- Visual stats representation using CSS layouts -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="bg-white border border-slate-100 p-6 rounded-3xl shadow-3xs space-y-4">
          <h4 class="text-xs font-bold text-slate-800 border-b border-slate-50 pb-2">📊 هيكل تسوية الفواتير الحالية</h4>
          <div class="space-y-3 pt-2 text-xs">
            <div>
              <div class="flex justify-between text-[11px] text-slate-500 font-bold mb-1">
                <span>فواتير مسددة بالكامل</span>
                <span>\${invoices.filter(i => i.status === 'paid').length} فواتير</span>
              </div>
              <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div class="bg-emerald-500 h-full" style="width: \${invoices.length ? (invoices.filter(i => i.status === 'paid').length / invoices.length * 100) : 0}%"></div>
              </div>
            </div>
            <div>
              <div class="flex justify-between text-[11px] text-slate-500 font-bold mb-1">
                <span>فواتير مدفوعة جزئياً (ذمم مدينة)</span>
                <span>\${invoices.filter(i => i.status === 'partially_paid').length} فواتير</span>
              </div>
              <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div class="bg-amber-500 h-full" style="width: \${invoices.length ? (invoices.filter(i => i.status === 'partially_paid').length / invoices.length * 100) : 0}%"></div>
              </div>
            </div>
            <div>
              <div class="flex justify-between text-[11px] text-slate-500 font-bold mb-1">
                <span>فواتير غير مدفوعة نهائياً</span>
                <span>\${invoices.filter(i => i.status === 'unpaid').length} فواتير</span>
              </div>
              <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div class="bg-rose-500 h-full" style="width: \${invoices.length ? (invoices.filter(i => i.status === 'unpaid').length / invoices.length * 100) : 0}%"></div>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white border border-slate-100 p-6 rounded-3xl shadow-3xs flex flex-col justify-between">
          <div class="space-y-2">
            <h4 class="text-xs font-bold text-slate-800 border-b border-slate-50 pb-2">ℹ️ دليل الإرشادات السريعة</h4>
            <ul class="text-[11px] text-slate-500 space-y-2 list-disc list-inside">
              <li>استخدم شريط التصفح العلوي للتنقل بسلاسة بين الأقسام المختلفة.</li>
              <li>في تبويب الفواتير، يمكنك البحث برقم الفاتورة أو اسم العميل، والضغط على زر العين لمعاينة الفاتورة كاملة مع إمكانية طباعتها فوراً.</li>
              <li>في تبويب العملاء، سيظهر لك ملخص كشف الحساب لكل عميل مع المبالغ المستحقة عليه وتاريخ آخر حركة.</li>
              <li>تذكر أن هذا الملف مستقل ومصمم كأرشيف دائم يمكنك الاحتفاظ به كمرجع تاريخي.</li>
            </ul>
          </div>
          <div class="text-[10px] text-slate-400 text-center mt-4">
            المنصة الرقمية الموحدة لإدارة العمليات والموارد - مركز سند الريادة للخدمات © 2026 | تطوير ودعم فني معتمد بسلطنة عمان
          </div>
        </div>
      </div>

    </div>

    <!-- TAB: INVOICES -->
    <div id="view-invoices" class="space-y-4 hidden">
      
      <!-- Filter controls -->
      <div class="bg-white border border-slate-100 p-4 rounded-2xl shadow-3xs flex flex-col sm:flex-row gap-3 items-center justify-between no-print">
        <div class="relative w-full sm:w-72">
          <input type="text" id="invoice-search" oninput="filterInvoices()" placeholder="البحث برقم الفاتورة أو اسم العميل..." class="w-full p-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-teal-500/10 focus:border-teal-500 rounded-xl text-xs">
        </div>
        <div class="flex gap-2 w-full sm:w-auto">
          <select id="invoice-status-filter" onchange="filterInvoices()" class="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 w-full sm:w-40">
            <option value="all">كل حالات السداد</option>
            <option value="paid">مدفوعة بالكامل</option>
            <option value="partially_paid">مدفوعة جزئياً</option>
            <option value="unpaid">غير مدفوعة</option>
          </select>
        </div>
      </div>

      <!-- Invoices Table -->
      <div class="bg-white border border-slate-100 rounded-3xl shadow-3xs overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-right text-xs">
            <thead class="bg-slate-50 text-slate-500 font-bold">
              <tr>
                <th class="p-4">رقم الفاتورة</th>
                <th class="p-4">اسم العميل</th>
                <th class="p-4">المبلغ الإجمالي</th>
                <th class="p-4">المدفوع المقدم</th>
                <th class="p-4">المبلغ المتبقي</th>
                <th class="p-4">الحالة</th>
                <th class="p-4">التاريخ والوقت</th>
                <th class="p-4 text-center no-print">عرض وتفاصيل</th>
              </tr>
            </thead>
            <tbody id="invoices-tbody">
              <!-- Rendered via Javascript -->
            </tbody>
          </table>
        </div>
      </div>

    </div>

    <!-- TAB: CUSTOMERS -->
    <div id="view-customers" class="space-y-4 hidden">
      
      <!-- Filter controls -->
      <div class="bg-white border border-slate-100 p-4 rounded-2xl shadow-3xs flex flex-col sm:flex-row gap-3 items-center justify-between no-print">
        <div class="relative w-full sm:w-72">
          <input type="text" id="customer-search" oninput="filterCustomers()" placeholder="البحث باسم العميل أو رقم الهاتف..." class="w-full p-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-teal-500/10 focus:border-teal-500 rounded-xl text-xs">
        </div>
      </div>

      <!-- Customers Grid -->
      <div id="customers-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <!-- Rendered via Javascript -->
      </div>

    </div>

    <!-- TAB: SERVICES -->
    <div id="view-services" class="space-y-4 hidden">
      <div class="bg-white border border-slate-100 rounded-3xl shadow-3xs overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-right text-xs">
            <thead class="bg-slate-50 text-slate-500 font-bold">
              <tr>
                <th class="p-4">المعرف</th>
                <th class="p-4">اسم الخدمة المعتمدة</th>
                <th class="p-4">السعر الافتراضي (ر.ع)</th>
              </tr>
            </thead>
            <tbody id="services-tbody">
              <!-- Rendered via Javascript -->
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- TAB: USERS -->
    <div id="view-users" class="space-y-4 hidden">
      <div class="bg-white border border-slate-100 rounded-3xl shadow-3xs overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-right text-xs">
            <thead class="bg-slate-50 text-slate-500 font-bold">
              <tr>
                <th class="p-4">الاسم الكامل</th>
                <th class="p-4">اسم المستخدم</th>
                <th class="p-4">الصلاحية</th>
                <th class="p-4">الحالة</th>
              </tr>
            </thead>
            <tbody id="users-tbody">
              <!-- Rendered via Javascript -->
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- TAB: LOGS -->
    <div id="view-logs" class="space-y-4 hidden">
      <div class="bg-white border border-slate-100 rounded-3xl shadow-3xs overflow-hidden">
        <div class="overflow-x-auto max-h-[500px] custom-scrollbar">
          <table class="w-full text-right text-xs">
            <thead class="bg-slate-50 text-slate-500 font-bold sticky top-0">
              <tr>
                <th class="p-4">الموظف</th>
                <th class="p-4">الإجراء والعملية</th>
                <th class="p-4">تفاصيل العملية</th>
                <th class="p-4">الوقت والتاريخ</th>
              </tr>
            </thead>
            <tbody id="logs-tbody">
              <!-- Rendered via Javascript -->
            </tbody>
          </table>
        </div>
      </div>
    </div>

  </main>

  <!-- INVOICE PREVIEW MODAL -->
  <div id="invoice-modal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 hidden no-print">
    <div class="bg-white w-full max-w-2xl rounded-3xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
      <!-- Header -->
      <div class="bg-teal-800 text-white p-4 flex justify-between items-center shrink-0">
        <h4 class="text-xs font-black" id="modal-invoice-title">تفاصيل الفاتورة #INV</h4>
        <button onclick="closeInvoiceModal()" class="text-white hover:text-slate-200 cursor-pointer text-sm font-bold bg-teal-700/60 p-1.5 px-3 rounded-lg">إغلاق ×</button>
      </div>
      
      <!-- Scrollable Receipt Body -->
      <div class="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6" id="modal-receipt-body">
        <!-- Rendered dynamically -->
      </div>
      
      <!-- Footer actions -->
      <div class="bg-slate-50 p-4 border-t border-slate-100 flex justify-end gap-2 shrink-0">
        <button onclick="printInvoiceFromModal()" class="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl cursor-pointer shadow-xs transition-all">طباعة الفاتورة 🖨️</button>
        <button onclick="closeInvoiceModal()" class="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs px-5 py-2.5 rounded-xl cursor-pointer transition-all">إغلاق نافذة المعاينة</button>
      </div>
    </div>
  </div>

  <!-- ABOUT PROGRAMMER FOOTER -->
  <footer class="bg-slate-900 text-slate-400 border-t border-slate-800 py-8 no-print mt-12">
    <div class="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-right">
      <div class="space-y-1.5">
        <h5 class="text-xs font-black text-white">المنصة الرقمية الموحدة لإدارة العمليات والموارد - مركز سند الريادة للخدمات</h5>
        <p class="text-[10px] text-slate-500">نظام الإدارة المالية والمحاسبية وإصدار الفواتير الضريبية المبسطة.</p>
      </div>
      
      <div class="text-[10px] space-y-1">
        <p class="text-slate-300"><strong>مطور البرنامج المصمم:</strong> المنصة الرقمية الموحدة لإدارة العمليات والموارد - مركز سند الريادة للخدمات</p>
        <p><strong>الدعم الفني والخط الساخن:</strong> 98299425 | <strong>بريد فني:</strong> alriyada.oman@gmail.com</p>
        <p><strong>حقوق الطبع والترخيص:</strong> مرخص ومعتمد للاستخدام مكاتب سند لتخليص المعاملات بسلطنة عُمان</p>
      </div>
    </div>
  </footer>

  <!-- EMBEDDED REAL-TIME DATA -->
  <script>
    const dbInvoices = \${JSON.stringify(invoices)};
    const dbCustomers = \${JSON.stringify(customers)};
    const dbServices = \${JSON.stringify(services)};
    const dbUsers = \${JSON.stringify(users)};
    const dbLogs = \${JSON.stringify(logs)};
    
    let activeModalInvoice = null;

    // Switch between tabs
    function switchTab(tabId) {
      const views = ['dashboard', 'invoices', 'customers', 'services', 'users', 'logs'];
      views.forEach(v => {
        const viewEl = document.getElementById('view-' + v);
        const tabEl = document.getElementById('tab-' + v);
        if (v === tabId) {
          viewEl.classList.remove('hidden');
          tabEl.className = "px-5 py-4 border-b-2 border-teal-600 text-teal-700 font-extrabold text-xs shrink-0 flex items-center gap-1.5 transition-all";
        } else {
          viewEl.classList.add('hidden');
          tabEl.className = "px-5 py-4 border-b-2 border-transparent text-slate-500 hover:text-slate-800 font-bold text-xs shrink-0 flex items-center gap-1.5 transition-all";
        }
      });
    }

    // Populate Invoices Table
    function renderInvoices(itemsList) {
      const tbody = document.getElementById('invoices-tbody');
      tbody.innerHTML = '';
      
      if (itemsList.length === 0) {
        tbody.innerHTML = \`<tr><td colspan="8" class="p-8 text-center text-slate-400 font-bold">لا توجد فواتير مطابقة لخيارات البحث!</td></tr>\`;
        return;
      }
      
      itemsList.forEach(inv => {
        const cust = dbCustomers.find(c => c.id === inv.customerId);
        const customerName = cust ? cust.name : 'عميل غير معروف';
        
        let statusBadge = '';
        if (inv.status === 'paid') {
          statusBadge = '<span class="bg-emerald-50 text-emerald-700 font-bold px-2 py-1 rounded-md text-[10px]">مدفوعة</span>';
        } else if (inv.status === 'partially_paid') {
          statusBadge = '<span class="bg-amber-50 text-amber-700 font-bold px-2 py-1 rounded-md text-[10px]">مدفوعة جزئياً</span>';
        } else {
          statusBadge = '<span class="bg-rose-50 text-rose-700 font-bold px-2 py-1 rounded-md text-[10px]">غير مدفوعة</span>';
        }
        
        const dateStr = inv.createdAt ? new Date(inv.createdAt).toLocaleString('ar-OM') : '-';
        
        const tr = document.createElement('tr');
        tr.className = "border-b border-slate-100 hover:bg-slate-50/50";
        tr.innerHTML = \`
          <td class="p-4 font-bold text-slate-950">\${inv.invoiceNumber}</td>
          <td class="p-4 font-bold text-slate-700">\${customerName}</td>
          <td class="p-4 font-mono font-bold text-slate-900">\${inv.totalAmount.toFixed(3)} ر.ع</td>
          <td class="p-4 font-mono text-slate-500">\${inv.downPayment.toFixed(3)} ر.ع</td>
          <td class="p-4 font-mono font-bold text-amber-600">\${inv.remainingAmount.toFixed(3)} ر.ع</td>
          <td class="p-4">\${statusBadge}</td>
          <td class="p-4 text-slate-400 font-mono text-[10px]">\${dateStr}</td>
          <td class="p-4 text-center no-print">
            <button onclick="viewInvoiceDetails('\${inv.id}')" class="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold rounded-lg cursor-pointer transition-all">🔍 عرض الفاتورة</button>
          </td>
        \`;
        tbody.appendChild(tr);
      });
    }

    // Filter Invoices
    function filterInvoices() {
      const query = document.getElementById('invoice-search').value.toLowerCase();
      const status = document.getElementById('invoice-status-filter').value;
      
      const filtered = dbInvoices.filter(inv => {
        const cust = dbCustomers.find(c => c.id === inv.customerId);
        const customerName = cust ? cust.name.toLowerCase() : '';
        const num = inv.invoiceNumber.toLowerCase();
        
        const matchesSearch = customerName.includes(query) || num.includes(query);
        const matchesStatus = (status === 'all') || (inv.status === status);
        
        return matchesSearch && matchesStatus;
      });
      
      renderInvoices(filtered);
    }

    // Populate Customers Grid with Account Balances
    function renderCustomers(itemsList) {
      const grid = document.getElementById('customers-grid');
      grid.innerHTML = '';
      
      if (itemsList.length === 0) {
        grid.innerHTML = \`<div class="col-span-full p-8 text-center bg-white border border-slate-100 rounded-3xl text-slate-400 font-bold">لا يوجد عملاء مطابقين للبحث!</div>\`;
        return;
      }
      
      itemsList.forEach(c => {
        // Find invoices for this customer
        const custInvoices = dbInvoices.filter(inv => inv.customerId === c.id);
        const totalAmount = custInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
        const totalPaid = custInvoices.reduce((sum, inv) => sum + inv.downPayment, 0);
        const totalRemaining = custInvoices.reduce((sum, inv) => sum + inv.remainingAmount, 0);
        
        const div = document.createElement('div');
        div.className = "bg-white border border-slate-100 p-5 rounded-3xl shadow-3xs space-y-4";
        div.innerHTML = \`
          <div class="flex justify-between items-start border-b border-slate-50 pb-3">
            <div>
              <h5 class="font-black text-xs text-slate-900">\${c.name}</h5>
              <span class="text-[10px] text-slate-400 block mt-0.5">الهاتف: \${c.phone} | \${c.type === 'individual' ? 'أفراد' : 'شركات'}</span>
            </div>
            <span class="text-[9px] bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full font-bold">\${c.status === 'active' ? 'نشط' : 'متأخر'}</span>
          </div>
          
          <div class="grid grid-cols-3 gap-2 text-center text-[10px]">
            <div class="bg-slate-50 p-2 rounded-xl">
              <span class="text-slate-400 block text-[8px] font-bold">المعاملات</span>
              <span class="font-bold text-slate-700 block mt-0.5">\${custInvoices.length}</span>
            </div>
            <div class="bg-emerald-50/50 p-2 rounded-xl">
              <span class="text-emerald-500 block text-[8px] font-bold">المسدد</span>
              <span class="font-bold text-emerald-700 block mt-0.5 font-mono">\${totalPaid.toFixed(3)}</span>
            </div>
            <div class="bg-amber-50/50 p-2 rounded-xl">
              <span class="text-amber-500 block text-[8px] font-bold">المستحق المتبقي</span>
              <span class="font-bold text-amber-700 block mt-0.5 font-mono">\${totalRemaining.toFixed(3)}</span>
            </div>
          </div>
        \`;
        grid.appendChild(div);
      });
    }

    // Filter Customers
    function filterCustomers() {
      const query = document.getElementById('customer-search').value.toLowerCase();
      const filtered = dbCustomers.filter(c => {
        return c.name.toLowerCase().includes(query) || c.phone.includes(query);
      });
      renderCustomers(filtered);
    }

    // Populate Services Table
    function renderServices() {
      const tbody = document.getElementById('services-tbody');
      tbody.innerHTML = '';
      dbServices.forEach(s => {
        const tr = document.createElement('tr');
        tr.className = "border-b border-slate-100 hover:bg-slate-50/50";
        tr.innerHTML = \`
          <td class="p-4 font-mono text-slate-400 text-[10px]">\${s.id}</td>
          <td class="p-4 font-bold text-slate-800">\${s.name}</td>
          <td class="p-4 font-mono font-bold text-teal-600">\${Number(s.defaultPrice || 0).toFixed(3)} ر.ع</td>
        \`;
        tbody.appendChild(tr);
      });
    }

    // Populate Users Table
    function renderUsers() {
      const tbody = document.getElementById('users-tbody');
      tbody.innerHTML = '';
      dbUsers.forEach(u => {
        const roleStr = u.role === 'admin' ? 'مدير النظام 🛡️' : 'موظف 👤';
        const activeStr = u.isActive ? '<span class="text-emerald-600 font-bold">نشط</span>' : '<span class="text-rose-500 font-bold">معطل</span>';
        const tr = document.createElement('tr');
        tr.className = "border-b border-slate-100 hover:bg-slate-50/50";
        tr.innerHTML = \`
          <td class="p-4 font-bold text-slate-800">\${u.name}</td>
          <td class="p-4 font-mono font-bold text-slate-600">\${u.username}</td>
          <td class="p-4 font-bold text-slate-700">\${roleStr}</td>
          <td class="p-4">\${activeStr}</td>
        \`;
        tbody.appendChild(tr);
      });
    }

    // Populate Logs Table
    function renderLogs() {
      const tbody = document.getElementById('logs-tbody');
      tbody.innerHTML = '';
      dbLogs.forEach(l => {
        const dateStr = l.timestamp ? new Date(l.timestamp).toLocaleString('ar-OM') : '-';
        const tr = document.createElement('tr');
        tr.className = "border-b border-slate-100 hover:bg-slate-50/50 text-[11px]";
        tr.innerHTML = \`
          <td class="p-4 font-bold text-slate-800">\${l.username}</td>
          <td class="p-4 font-bold text-teal-700">\${l.action}</td>
          <td class="p-4 text-slate-500">\${l.details || '-'}</td>
          <td class="p-4 text-slate-400 font-mono">\${dateStr}</td>
        \`;
        tbody.appendChild(tr);
      });
    }

    // Modal view invoice details
    function viewInvoiceDetails(invId) {
      const inv = dbInvoices.find(i => i.id === invId);
      if (!inv) return;
      
      activeModalInvoice = inv;
      const cust = dbCustomers.find(c => c.id === inv.customerId);
      const customerName = cust ? cust.name : 'عميل غير معروف';
      
      document.getElementById('modal-invoice-title').innerText = 'تفاصيل الفاتورة ' + inv.invoiceNumber;
      
      let itemsHtml = '';
      if (inv.items && inv.items.length > 0) {
        inv.items.forEach(item => {
          itemsHtml += \`
            <tr class="border-b border-slate-100 text-slate-700">
              <td class="p-3 font-bold text-right">\${item.serviceName}</td>
              <td class="p-3 font-mono text-center">\${item.quantity}</td>
              <td class="p-3 font-mono text-center">\${item.price.toFixed(3)} ر.ع</td>
              <td class="p-3 font-mono text-center">\${(item.discount || 0).toFixed(3)} ر.ع</td>
              <td class="p-3 text-center">\${item.employeeName || '-'}</td>
              <td class="p-3 font-mono font-black text-teal-700 text-left">\${item.total.toFixed(3)} ر.ع</td>
            </tr>
          \`;
        });
      } else {
        itemsHtml = \`<tr><td colspan="6" class="p-4 text-center text-slate-400">لا توجد بنود تفصيلية لهذه الفاتورة</td></tr>\`;
      }
      
      const dateStr = inv.createdAt ? new Date(inv.createdAt).toLocaleString('ar-OM') : '-';
      
      const bodyEl = document.getElementById('modal-receipt-body');
      bodyEl.innerHTML = \`
        <!-- RECEIPT BRANDING -->
        <div class="flex flex-col items-center justify-center text-center space-y-2 border-b border-dashed border-slate-200 pb-4">
          <div class="w-12 h-12 bg-teal-800 rounded-3xl flex items-center justify-center font-black text-white text-xl">ر</div>
          <h2 class="text-sm font-black text-slate-900">المنصة الرقمية الموحدة لإدارة العمليات والموارد</h2>
          <p class="text-[10px] text-teal-700 font-bold mt-1">مركز سند الريادة للخدمات</p>
          <p class="text-[10px] text-slate-400">المركز المالي وتخليص المعاملات والطباعة المعتمدة بسلطنة عُمان</p>
        </div>

        <!-- DETAILS ROW -->
        <div class="grid grid-cols-2 gap-4 text-xs text-slate-600 bg-slate-50 p-4 rounded-2xl">
          <div>
            <span class="block text-slate-400 font-bold text-[10px]">رقم الفاتورة:</span>
            <strong class="text-slate-900">\${inv.invoiceNumber}</strong>
          </div>
          <div>
            <span class="block text-slate-400 font-bold text-[10px]">تاريخ ووقت الفاتورة:</span>
            <span class="font-mono">\${dateStr}</span>
          </div>
          <div>
            <span class="block text-slate-400 font-bold text-[10px]">العميل الكريم:</span>
            <strong class="text-slate-900">\${customerName}</strong>
          </div>
          <div>
            <span class="block text-slate-400 font-bold text-[10px]">موظف الإصدار:</span>
            <span>\${inv.createdBy || '-'}</span>
          </div>
        </div>

        <!-- ITEMS TABLE -->
        <div class="border border-slate-100 rounded-2xl overflow-hidden">
          <table class="w-full text-xs text-right">
            <thead class="bg-slate-50 font-bold text-slate-500">
              <tr>
                <th class="p-3 text-right">اسم الخدمة والبند</th>
                <th class="p-3 text-center">الكمية</th>
                <th class="p-3 text-center">سعر الوحدة</th>
                <th class="p-3 text-center">خصم البند</th>
                <th class="p-3 text-center">الموظف</th>
                <th class="p-3 text-left">المجموع الصافي</th>
              </tr>
            </thead>
            <tbody>
              \${itemsHtml}
            </tbody>
          </table>
        </div>

        <!-- SUMMARY CALCULATION -->
        <div class="bg-teal-50/50 p-4 rounded-2xl border border-teal-100/50 text-xs text-slate-600 space-y-2">
          <div class="flex justify-between">
            <span>المجموع الإجمالي للفاتورة قبل الخصم:</span>
            <span class="font-mono font-bold">\${inv.totalAmount.toFixed(3)} ر.ع</span>
          </div>
          <div class="flex justify-between text-rose-600">
            <span>الخصم العام الممنوح:</span>
            <span class="font-mono font-bold">\${(inv.discount || 0).toFixed(3)}- ر.ع</span>
          </div>
          <div class="flex justify-between text-emerald-700 font-bold">
            <span>المبلغ الصافي النهائي:</span>
            <span class="font-mono font-extrabold">\${(inv.totalAmount - (inv.discount || 0)).toFixed(3)} ر.ع</span>
          </div>
          <hr class="border-teal-100/40">
          <div class="flex justify-between text-teal-900 font-bold">
            <span>المبلغ المقدم المدفوع (المحصل):</span>
            <span class="font-mono font-extrabold">\${inv.downPayment.toFixed(3)} ر.ع</span>
          </div>
          <div class="flex justify-between text-amber-700 font-bold">
            <span>المبلغ المستحق المتبقي (الذمة):</span>
            <span class="font-mono font-extrabold">\${inv.remainingAmount.toFixed(3)} ر.ع</span>
          </div>
        </div>
      \`;
      
      document.getElementById('invoice-modal').classList.remove('hidden');
    }

    function closeInvoiceModal() {
      document.getElementById('invoice-modal').classList.add('hidden');
      activeModalInvoice = null;
    }

    function printInvoiceFromModal() {
      if (!activeModalInvoice) return;
      window.print();
    }

    // Initialize all tables
    window.onload = function() {
      renderInvoices(dbInvoices);
      renderCustomers(dbCustomers);
      renderServices();
      renderUsers();
      renderLogs();
    };
  </script>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `المنصة_أرشيف_ويب_تفاعلي_${new Date().toISOString().slice(0, 10)}.html`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Function to download filtered invoices in a beautifully formatted multi-sheet Excel workbook (SpreadsheetML)
export function exportInvoicesToExcel(
  invoices: Invoice[],
  customers: Customer[],
  branchesList: any[] = []
) {
  const escapeXml = (unsafe: any): string => {
    if (unsafe === null || unsafe === undefined) return '';
    return String(unsafe)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
      .replace(/\n/g, '&#10;');
  };

  const timestampStr = new Date().toLocaleString('ar-OM', { hour12: true });

  const getBranchName = (branchId?: string): string => {
    if (!branchId) return 'الفرع الرئيسي';
    const br = branchesList.find(b => b.id === branchId);
    return br ? br.name : branchId;
  };

  let xml = `<?xml version="1.0" encoding="utf-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
  <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
    <Author>المنصة الرقمية الموحدة لإدارة العمليات والموارد - مركز سند الريادة للخدمات</Author>
    <LastAuthor>المنصة الرقمية الموحدة لإدارة العمليات والموارد - مركز سند الريادة للخدمات</LastAuthor>
    <Created>${new Date().toISOString()}</Created>
  </DocumentProperties>
  <Styles>
    <Style ss:ID="Default" ss:Name="Normal">
      <Alignment ss:Vertical="Top" ss:Horizontal="Right" ss:WrapText="1"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
      </Borders>
      <Font ss:FontName="Segoe UI" ss:Size="10" ss:Color="#1E293B"/>
      <Interior/>
      <NumberFormat/>
      <Protection/>
    </Style>
    <Style ss:ID="Header">
      <Font ss:FontName="Segoe UI" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/>
      <Interior ss:Color="#0F766E" ss:Pattern="Solid"/>
      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#0F766E"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#0F766E"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#0F766E"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#0F766E"/>
      </Borders>
    </Style>
    <Style ss:ID="Title">
      <Font ss:FontName="Segoe UI" ss:Size="16" ss:Bold="1" ss:Color="#0F766E"/>
      <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
      <Borders/>
    </Style>
    <Style ss:ID="SubTitle">
      <Font ss:FontName="Segoe UI" ss:Size="10" ss:Color="#64748B"/>
      <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
      <Borders/>
    </Style>
    <Style ss:ID="CellBold">
      <Font ss:FontName="Segoe UI" ss:Size="10" ss:Bold="1" ss:Color="#1E293B"/>
    </Style>
    <Style ss:ID="CellMoney">
      <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
      <NumberFormat ss:Format="#,##0.000"/>
    </Style>
    <Style ss:ID="CellNumber">
      <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
    </Style>
  </Styles>
  
  <Worksheet ss:Name="1. الفواتير المفلترة">
    <Table ss:DefaultColumnWidth="120">
      <Column ss:Width="100"/>
      <Column ss:Width="180"/>
      <Column ss:Width="250"/>
      <Column ss:Width="100"/>
      <Column ss:Width="100"/>
      <Column ss:Width="100"/>
      <Column ss:Width="100"/>
      <Column ss:Width="100"/>
      <Column ss:Width="120"/>
      <Column ss:Width="150"/>
      <Column ss:Width="120"/>
      <Column ss:Width="100"/>
      <Row ss:Height="30">
        <Cell ss:MergeAcross="11" ss:StyleID="Title"><Data ss:Type="String">سجل الفواتير المفلترة - المنصة الرقمية الموحدة لإدارة العمليات والموارد - مركز سند الريادة للخدمات</Data></Cell>
      </Row>
      <Row ss:AutoFitHeight="1">
        <Cell ss:MergeAcross="11" ss:StyleID="SubTitle"><Data ss:Type="String">تم تصدير التقرير المفلتر في: ${timestampStr} | عدد الفواتير المفلترة: ${invoices.length}</Data></Cell>
      </Row>
      <Row ss:Height="25">
        <Cell ss:StyleID="Header"><Data ss:Type="String">رقم الفاتورة</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">العميل</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">البنود والخدمات التفصيلية</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">المبلغ الإجمالي</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">الخصم</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">المقدم المدفوع</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">المبلغ المتبقي</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">الحالة</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">الفرع</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">ملاحظات العميل</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">تاريخ الفاتورة</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">بواسطة</Data></Cell>
      </Row>
      ${invoices.map(inv => {
        const customerName = customers.find(c => c.id === inv.customerId)?.name || 'غير معروف';
        const itemsSummary = inv.items ? inv.items.map(item => `${item.serviceName} (${item.quantity} × ${item.price.toFixed(3)})`).join(' | ') : '-';
        const branchName = getBranchName(inv.branchId);
        return `
      <Row ss:AutoFitHeight="1">
        <Cell ss:StyleID="CellBold"><Data ss:Type="String">${escapeXml(inv.invoiceNumber)}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(customerName)}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(itemsSummary)}</Data></Cell>
        <Cell ss:StyleID="CellMoney"><Data ss:Type="Number">${inv.totalAmount}</Data></Cell>
        <Cell ss:StyleID="CellMoney"><Data ss:Type="Number">${inv.discount || 0}</Data></Cell>
        <Cell ss:StyleID="CellMoney"><Data ss:Type="Number">${inv.downPayment}</Data></Cell>
        <Cell ss:StyleID="CellMoney"><Data ss:Type="Number">${inv.remainingAmount}</Data></Cell>
        <Cell><Data ss:Type="String">${inv.status === 'paid' ? 'مدفوعة كاملة' : inv.status === 'partially_paid' ? 'مدفوعة جزئياً' : inv.status === 'unpaid' ? 'غير مدفوعة' : 'مسودة'}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(branchName)}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(inv.customerExtraText || '-')}</Data></Cell>
        <Cell><Data ss:Type="String">${inv.createdAt ? new Date(inv.createdAt).toLocaleDateString('ar-OM') : '-'}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(inv.createdBy || '-')}</Data></Cell>
      </Row>
        `;
      }).join('')}
    </Table>
  </Worksheet>

  <Worksheet ss:Name="2. تفاصيل البنود المفلترة">
    <Table ss:DefaultColumnWidth="120">
      <Column ss:Width="100"/>
      <Column ss:Width="180"/>
      <Column ss:Width="200"/>
      <Column ss:Width="80"/>
      <Column ss:Width="100"/>
      <Column ss:Width="100"/>
      <Column ss:Width="140"/>
      <Column ss:Width="100"/>
      <Row ss:Height="30">
        <Cell ss:MergeAcross="7" ss:StyleID="Title"><Data ss:Type="String">تفاصيل بنود وخدمات الفواتير المفلترة</Data></Cell>
      </Row>
      <Row ss:AutoFitHeight="1">
        <Cell ss:MergeAcross="7" ss:StyleID="SubTitle"><Data ss:Type="String">تم تصدير التقرير المفلتر في: ${timestampStr}</Data></Cell>
      </Row>
      <Row ss:Height="25">
        <Cell ss:StyleID="Header"><Data ss:Type="String">رقم الفاتورة</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">العميل</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">اسم الخدمة / البند</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">الكمية</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">سعر الوحدة</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">الخصم على البند</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">الموظف المنفذ</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">المجموع الصافي</Data></Cell>
      </Row>
      ${invoices.flatMap(inv => {
        const customerName = customers.find(c => c.id === inv.customerId)?.name || 'غير معروف';
        if (!inv.items || inv.items.length === 0) return [];
        return inv.items.map(item => `
      <Row ss:AutoFitHeight="1">
        <Cell ss:StyleID="CellBold"><Data ss:Type="String">${escapeXml(inv.invoiceNumber)}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(customerName)}</Data></Cell>
        <Cell ss:StyleID="CellBold"><Data ss:Type="String">${escapeXml(item.serviceName)}</Data></Cell>
        <Cell ss:StyleID="CellNumber"><Data ss:Type="Number">${item.quantity}</Data></Cell>
        <Cell ss:StyleID="CellMoney"><Data ss:Type="Number">${item.price}</Data></Cell>
        <Cell ss:StyleID="CellMoney"><Data ss:Type="Number">${item.discount || 0}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(item.employeeName || '-')}</Data></Cell>
        <Cell ss:StyleID="CellMoney"><Data ss:Type="Number">${item.total}</Data></Cell>
      </Row>
        `);
      }).join('')}
    </Table>
  </Worksheet>
</Workbook>
  `;

  const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `فواتير_المنصة_الرقمية_الموحدة_مفلترة_${new Date().toISOString().slice(0, 10)}.xls`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Function to download filtered tickets in a beautifully formatted multi-sheet Excel workbook (SpreadsheetML)
export function exportTicketsToExcel(
  tickets: Ticket[],
  branchesList: any[] = []
) {
  const escapeXml = (unsafe: any): string => {
    if (unsafe === null || unsafe === undefined) return '';
    return String(unsafe)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
      .replace(/\n/g, '&#10;');
  };

  const timestampStr = new Date().toLocaleString('ar-OM', { hour12: true });

  const getBranchName = (branchId?: string): string => {
    if (!branchId) return 'الفرع الرئيسي';
    const br = branchesList.find(b => b.id === branchId);
    return br ? br.name : branchId;
  };

  let xml = `<?xml version="1.0" encoding="utf-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
  <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
    <Author>المنصة الرقمية الموحدة لإدارة العمليات والموارد - مركز سند الريادة للخدمات</Author>
    <LastAuthor>المنصة الرقمية الموحدة لإدارة العمليات والموارد - مركز سند الريادة للخدمات</LastAuthor>
    <Created>${new Date().toISOString()}</Created>
  </DocumentProperties>
  <Styles>
    <Style ss:ID="Default" ss:Name="Normal">
      <Alignment ss:Vertical="Top" ss:Horizontal="Right" ss:WrapText="1"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
      </Borders>
      <Font ss:FontName="Segoe UI" ss:Size="10" ss:Color="#1E293B"/>
      <Interior/>
      <NumberFormat/>
      <Protection/>
    </Style>
    <Style ss:ID="Header">
      <Font ss:FontName="Segoe UI" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/>
      <Interior ss:Color="#0D9488" ss:Pattern="Solid"/>
      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#0D9488"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#0D9488"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#0D9488"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#0D9488"/>
      </Borders>
    </Style>
    <Style ss:ID="Title">
      <Font ss:FontName="Segoe UI" ss:Size="16" ss:Bold="1" ss:Color="#0D9488"/>
      <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
      <Borders/>
    </Style>
    <Style ss:ID="SubTitle">
      <Font ss:FontName="Segoe UI" ss:Size="10" ss:Color="#64748B"/>
      <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
      <Borders/>
    </Style>
    <Style ss:ID="CellBold">
      <Font ss:FontName="Segoe UI" ss:Size="10" ss:Bold="1" ss:Color="#1E293B"/>
    </Style>
    <Style ss:ID="CellNumber">
      <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
    </Style>
  </Styles>
  
  <Worksheet ss:Name="1. طلبات التذاكر المفلترة">
    <Table ss:DefaultColumnWidth="120">
      <Column ss:Width="100"/>
      <Column ss:Width="150"/>
      <Column ss:Width="200"/>
      <Column ss:Width="300"/>
      <Column ss:Width="120"/>
      <Column ss:Width="100"/>
      <Column ss:Width="100"/>
      <Column ss:Width="150"/>
      <Column ss:Width="150"/>
      <Column ss:Width="120"/>
      <Column ss:Width="100"/>
      <Column ss:Width="80"/>
      <Row ss:Height="30">
        <Cell ss:MergeAcross="11" ss:StyleID="Title"><Data ss:Type="String">سجل طلبات الدعم والتذاكر المفلترة - المنصة الرقمية الموحدة لإدارة العمليات والموارد - مركز سند الريادة للخدمات</Data></Cell>
      </Row>
      <Row ss:AutoFitHeight="1">
        <Cell ss:MergeAcross="11" ss:StyleID="SubTitle"><Data ss:Type="String">تم تصدير التقرير المفلتر في: ${timestampStr} | عدد التذاكر المفلترة: ${tickets.length}</Data></Cell>
      </Row>
      <Row ss:Height="25">
        <Cell ss:StyleID="Header"><Data ss:Type="String">رقم التذكرة</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">نوع وموضوع الطلب</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">عنوان الطلب</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">تفاصيل الطلب</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">مقدم الطلب</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">الفرع</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">المبلغ (ر.ع)</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">الحالة</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">تاريخ التقديم</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">آخر تحديث</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">مغلق بواسطة</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">عدد الردود</Data></Cell>
      </Row>
      ${tickets.map(t => {
        const branchName = getBranchName(t.branchId);
        const statusStr = t.status === 'completed' ? 'مكتمل ومغلق' : t.status === 'processing' ? 'قيد المعالجة' : 'جديد معلق';
        const repliesCount = t.messages ? t.messages.length : 0;
        const amountStr = t.amount !== undefined && t.amount !== null ? Number(t.amount).toFixed(3) : '-';
        return `
      <Row ss:AutoFitHeight="1">
        <Cell ss:StyleID="CellBold"><Data ss:Type="String">${escapeXml(t.ticketNumber)}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(t.type)}</Data></Cell>
        <Cell ss:StyleID="CellBold"><Data ss:Type="String">${escapeXml(t.title)}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(t.details)}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(t.employeeName)}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(branchName)}</Data></Cell>
        <Cell ss:StyleID="CellNumber"><Data ss:Type="String">${amountStr}</Data></Cell>
        <Cell><Data ss:Type="String">${statusStr}</Data></Cell>
        <Cell><Data ss:Type="String">${t.createdAt ? new Date(t.createdAt).toLocaleString('ar-OM') : '-'}</Data></Cell>
        <Cell><Data ss:Type="String">${t.updatedAt ? new Date(t.updatedAt).toLocaleString('ar-OM') : '-'}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(t.closedByName || '-')}</Data></Cell>
        <Cell ss:StyleID="CellNumber"><Data ss:Type="Number">${repliesCount}</Data></Cell>
      </Row>
        `;
      }).join('')}
    </Table>
  </Worksheet>

  <Worksheet ss:Name="2. تفاصيل الردود والتعليقات">
    <Table ss:DefaultColumnWidth="120">
      <Column ss:Width="100"/>
      <Column ss:Width="180"/>
      <Column ss:Width="120"/>
      <Column ss:Width="100"/>
      <Column ss:Width="300"/>
      <Column ss:Width="150"/>
      <Column ss:Width="150"/>
      <Row ss:Height="30">
        <Cell ss:MergeAcross="6" ss:StyleID="Title"><Data ss:Type="String">تفاصيل الردود والتعليقات على التذاكر المفلترة</Data></Cell>
      </Row>
      <Row ss:AutoFitHeight="1">
        <Cell ss:MergeAcross="6" ss:StyleID="SubTitle"><Data ss:Type="String">تم تصدير سجل الردود في: ${timestampStr}</Data></Cell>
      </Row>
      <Row ss:Height="25">
        <Cell ss:StyleID="Header"><Data ss:Type="String">رقم التذكرة</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">موضوع الطلب / العنوان</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">اسم المرسل</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">الدور</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">نص الرد / التعليق</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">تاريخ الرد</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">المرفق</Data></Cell>
      </Row>
      ${tickets.flatMap(t => {
        if (!t.messages || t.messages.length === 0) return [];
        return t.messages.map(msg => {
          let senderRoleStr = 'موظف';
          if (msg.senderRole === 'admin') senderRoleStr = 'مدير النظام';
          else if (msg.senderRole === 'hr') senderRoleStr = 'الموارد البشرية HR';
          
          const attachmentStr = msg.attachmentUrl ? (msg.attachmentName || 'ملف مرفق') : '-';
          return `
      <Row ss:AutoFitHeight="1">
        <Cell ss:StyleID="CellBold"><Data ss:Type="String">${escapeXml(t.ticketNumber)}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(t.title)}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(msg.senderName)}</Data></Cell>
        <Cell><Data ss:Type="String">${senderRoleStr}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(msg.content || '(مرفق فقط)')}</Data></Cell>
        <Cell><Data ss:Type="String">${msg.createdAt ? new Date(msg.createdAt).toLocaleString('ar-OM') : '-'}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(attachmentStr)}</Data></Cell>
      </Row>
          `;
        });
      }).join('')}
    </Table>
  </Worksheet>
</Workbook>
  `;

  const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `تذاكر_المنصة_الرقمية_الموحدة_مفلترة_${new Date().toISOString().slice(0, 10)}.xls`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}


export function exportMonthlyReportToExcel(monthlyData: any[], totals: any, monthName: string, year: number, chartBase64?: string) {
  const escapeXml = (unsafe: string) => {
    return String(unsafe).replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
        default: return c;
      }
    });
  };

  const xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
  <Styles>
    <Style ss:ID="Default" ss:Name="Normal">
      <Alignment ss:Vertical="Bottom"/>
      <Borders/>
      <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#000000"/>
      <Interior/>
      <NumberFormat/>
      <Protection/>
    </Style>
    <Style ss:ID="Header">
      <Font ss:FontName="Segoe UI" ss:Size="12" ss:Bold="1" ss:Color="#FFFFFF"/>
      <Interior ss:Color="#0D9488" ss:Pattern="Solid"/>
      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#0D9488"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#0D9488"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#0D9488"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#0D9488"/>
      </Borders>
    </Style>
    <Style ss:ID="Total">
      <Font ss:FontName="Segoe UI" ss:Size="12" ss:Bold="1" ss:Color="#FFFFFF"/>
      <Interior ss:Color="#1E293B" ss:Pattern="Solid"/>
      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#1E293B"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#1E293B"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#1E293B"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#1E293B"/>
      </Borders>
    </Style>
    <Style ss:ID="Title">
      <Font ss:FontName="Segoe UI" ss:Size="16" ss:Bold="1" ss:Color="#0D9488"/>
      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
    </Style>
    <Style ss:ID="Center">
      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
      </Borders>
    </Style>
    <Style ss:ID="NumberFormat">
      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
      </Borders>
      <NumberFormat ss:Format="0.000"/>
    </Style>
  </Styles>
  <Worksheet ss:Name="التقرير الشهري">
    <Table ss:DefaultColumnWidth="120">
      <Column ss:Width="150"/>
      <Column ss:Width="120"/>
      <Column ss:Width="120"/>
      <Column ss:Width="120"/>
      <Column ss:Width="120"/>
      <Column ss:Width="150"/>
      <Row ss:Height="30">
        <Cell ss:MergeAcross="5" ss:StyleID="Title"><Data ss:Type="String">${escapeXml('التقرير الشهري التفصيلي - ' + monthName + ' ' + year)}</Data></Cell>
      </Row>
      <Row ss:AutoFitHeight="1">
        <Cell ss:MergeAcross="5"><Data ss:Type="String"></Data></Cell>
      </Row>
      <Row ss:Height="25">
        <Cell ss:StyleID="Header"><Data ss:Type="String">التاريخ واليوم</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">مجموع إيداع اليوم</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">المدفوع</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">غير المدفوع</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">مدفوع جزئياً</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">إجمالي المبيعات</Data></Cell>
      </Row>
      ${monthlyData.map(row => `
      <Row>
        <Cell ss:StyleID="Center"><Data ss:Type="String">${escapeXml(row.dateFormatted)}</Data></Cell>
        <Cell ss:StyleID="${row.deposit > 0 ? 'NumberFormat' : 'Center'}"><Data ss:Type="${row.deposit > 0 ? 'Number' : 'String'}">${row.deposit > 0 ? row.deposit : '-'}</Data></Cell>
        <Cell ss:StyleID="${row.paid > 0 ? 'NumberFormat' : 'Center'}"><Data ss:Type="${row.paid > 0 ? 'Number' : 'String'}">${row.paid > 0 ? row.paid : '-'}</Data></Cell>
        <Cell ss:StyleID="${row.unpaid > 0 ? 'NumberFormat' : 'Center'}"><Data ss:Type="${row.unpaid > 0 ? 'Number' : 'String'}">${row.unpaid > 0 ? row.unpaid : '-'}</Data></Cell>
        <Cell ss:StyleID="${row.partial > 0 ? 'NumberFormat' : 'Center'}"><Data ss:Type="${row.partial > 0 ? 'Number' : 'String'}">${row.partial > 0 ? row.partial : '-'}</Data></Cell>
        <Cell ss:StyleID="${row.total > 0 ? 'NumberFormat' : 'Center'}"><Data ss:Type="${row.total > 0 ? 'Number' : 'String'}">${row.total > 0 ? row.total : '-'}</Data></Cell>
      </Row>
      `).join('')}
      <Row ss:Height="25">
        <Cell ss:StyleID="Total"><Data ss:Type="String">المجموع النهائي</Data></Cell>
        <Cell ss:StyleID="Total"><Data ss:Type="Number">${totals.deposit}</Data></Cell>
        <Cell ss:StyleID="Total"><Data ss:Type="Number">${totals.paid}</Data></Cell>
        <Cell ss:StyleID="Total"><Data ss:Type="Number">${totals.unpaid}</Data></Cell>
        <Cell ss:StyleID="Total"><Data ss:Type="Number">${totals.partial}</Data></Cell>
        <Cell ss:StyleID="Total"><Data ss:Type="Number">${totals.total}</Data></Cell>
      </Row>
    </Table>
    <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
      <DisplayRightToLeft/>
    </WorksheetOptions>
  </Worksheet>
</Workbook>`;

  const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `التقرير_الشهري_المنصة_الرقمية_${monthName}_${year}.xls`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportMonthlyStatementToExcel(invoices: any[], customers: any[], monthName: string, year: number) {
  const escapeXml = (unsafe: string) => {
    return unsafe.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
        default: return c;
      }
    });
  };

  const getCustomerName = (customerId: string) => {
    const customer = customers.find((c: any) => c.id === customerId);
    return customer ? customer.name : 'عميل غير معروف';
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid': return 'مدفوعة';
      case 'partially_paid': return 'مدفوع جزئياً';
      case 'unpaid': return 'غير مدفوعة';
      default: return 'مسودة';
    }
  };

  const xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
  <Styles>
    <Style ss:ID="Default" ss:Name="Normal">
      <Alignment ss:Vertical="Bottom"/>
      <Borders/>
      <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#000000"/>
      <Interior/>
      <NumberFormat/>
      <Protection/>
    </Style>
    <Style ss:ID="Header">
      <Font ss:FontName="Segoe UI" ss:Size="12" ss:Bold="1" ss:Color="#FFFFFF"/>
      <Interior ss:Color="#0D9488" ss:Pattern="Solid"/>
      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#0D9488"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#0D9488"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#0D9488"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#0D9488"/>
      </Borders>
    </Style>
    <Style ss:ID="Title">
      <Font ss:FontName="Segoe UI" ss:Size="16" ss:Bold="1" ss:Color="#0D9488"/>
      <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
    </Style>
  </Styles>
  <Worksheet ss:Name="الكشف الشهري">
    <Table ss:DefaultColumnWidth="120">
      <Column ss:Width="100"/>
      <Column ss:Width="100"/>
      <Column ss:Width="150"/>
      <Column ss:Width="250"/>
      <Column ss:Width="100"/>
      <Column ss:Width="100"/>
      <Column ss:Width="100"/>
      <Column ss:Width="100"/>
      <Row ss:Height="30">
        <Cell ss:MergeAcross="7" ss:StyleID="Title"><Data ss:Type="String">${escapeXml('كشف المدخلات المالية التفصيلي - ' + monthName + ' ' + year)}</Data></Cell>
      </Row>
      <Row ss:Height="25">
        <Cell ss:StyleID="Header"><Data ss:Type="String">رقم الفاتورة</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">التاريخ</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">العميل</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">بنود المعاملات</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">المبلغ الإجمالي</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">المدفوع</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">المتبقي</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">الحالة</Data></Cell>
      </Row>
      ${invoices.map(inv => `
      <Row>
        <Cell><Data ss:Type="String">${escapeXml(inv.invoiceNumber)}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(new Date(inv.createdAt).toLocaleDateString('ar-OM'))}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(getCustomerName(inv.customerId))}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(inv.items.map((i: any) => i.quantity + 'x ' + i.serviceName).join(', '))}</Data></Cell>
        <Cell><Data ss:Type="Number">${inv.totalAmount}</Data></Cell>
        <Cell><Data ss:Type="Number">${inv.downPayment}</Data></Cell>
        <Cell><Data ss:Type="Number">${inv.remainingAmount}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(getStatusLabel(inv.status))}</Data></Cell>
      </Row>
      `).join('')}
    </Table>
  </Worksheet>
</Workbook>`;

  const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `الكشف_الشهري_${monthName}_${year}.xls`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function printMonthlyReportPDF(monthlyData: any[], totals: any, monthName: string, year: number, chartHtml?: string) {
  const html = `
    <div style="font-family: 'Tajawal', sans-serif; direction: rtl; text-align: right; padding: 20px;">
      <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #0D9488; padding-bottom: 10px;">
        <h1 style="color: #0D9488; margin: 0 0 10px 0; font-size: 24px;">التقرير الشهري التفصيلي</h1>
        <p style="margin: 0; color: #64748b; font-size: 16px;">لشهر ${monthName} ${year}</p>
        <p style="margin: 5px 0 0 0; color: #94a3b8; font-size: 12px;">تاريخ الطباعة: ${new Date().toLocaleDateString('ar-OM')}</p>
      </div>

      <div style="display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap;">
        <div style="flex: 1; min-width: 150px; padding: 15px; border-radius: 8px; background-color: #f8fafc; border: 1px solid #e2e8f0;">
          <div style="font-size: 12px; color: #64748b; margin-bottom: 5px;">إجمالي المبيعات</div>
          <div style="font-size: 20px; font-weight: bold; color: #1e293b;">${totals.total.toFixed(3)}</div>
        </div>
        <div style="flex: 1; min-width: 150px; padding: 15px; border-radius: 8px; background-color: #f0fdf4; border: 1px solid #bbf7d0;">
          <div style="font-size: 12px; color: #166534; margin-bottom: 5px;">مجموع الإيداع</div>
          <div style="font-size: 20px; font-weight: bold; color: #15803d;">${totals.deposit.toFixed(3)}</div>
        </div>
        <div style="flex: 1; min-width: 150px; padding: 15px; border-radius: 8px; background-color: #f0fdfa; border: 1px solid #ccfbf1;">
          <div style="font-size: 12px; color: #0f766e; margin-bottom: 5px;">المبلغ المدفوع</div>
          <div style="font-size: 20px; font-weight: bold; color: #0d9488;">${totals.paid.toFixed(3)}</div>
        </div>
        <div style="flex: 1; min-width: 150px; padding: 15px; border-radius: 8px; background-color: #fef2f2; border: 1px solid #fecaca;">
          <div style="font-size: 12px; color: #991b1b; margin-bottom: 5px;">غير المدفوع</div>
          <div style="font-size: 20px; font-weight: bold; color: #dc2626;">${totals.unpaid.toFixed(3)}</div>
        </div>
      </div>

      ${chartHtml ? `
        <div style="margin-bottom: 20px; text-align: center;">
          ${chartHtml}
        </div>
      ` : ''}

      <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px;">
        <thead>
          <tr>
            <th style="border: 1px solid #cbd5e1; padding: 10px; background-color: #f1f5f9; text-align: right; color: #334155;">التاريخ واليوم</th>
            <th style="border: 1px solid #cbd5e1; padding: 10px; background-color: #f1f5f9; text-align: center; color: #334155;">مجموع إيداع اليوم</th>
            <th style="border: 1px solid #cbd5e1; padding: 10px; background-color: #f1f5f9; text-align: center; color: #334155;">المدفوع</th>
            <th style="border: 1px solid #cbd5e1; padding: 10px; background-color: #f1f5f9; text-align: center; color: #334155;">غير المدفوع</th>
            <th style="border: 1px solid #cbd5e1; padding: 10px; background-color: #f1f5f9; text-align: center; color: #334155;">مدفوع جزئياً</th>
            <th style="border: 1px solid #cbd5e1; padding: 10px; background-color: #f1f5f9; text-align: center; color: #334155;">إجمالي المبيعات</th>
          </tr>
        </thead>
        <tbody>
          ${monthlyData.map(row => `
            <tr>
              <td style="border: 1px solid #e2e8f0; padding: 8px; text-align: right; font-weight: bold;">${row.dateFormatted}</td>
              <td style="border: 1px solid #e2e8f0; padding: 8px; text-align: center;">${row.deposit > 0 ? row.deposit.toFixed(3) : '-'}</td>
              <td style="border: 1px solid #e2e8f0; padding: 8px; text-align: center;">${row.paid > 0 ? row.paid.toFixed(3) : '-'}</td>
              <td style="border: 1px solid #e2e8f0; padding: 8px; text-align: center;">${row.unpaid > 0 ? row.unpaid.toFixed(3) : '-'}</td>
              <td style="border: 1px solid #e2e8f0; padding: 8px; text-align: center;">${row.partial > 0 ? row.partial.toFixed(3) : '-'}</td>
              <td style="border: 1px solid #e2e8f0; padding: 8px; text-align: center; font-weight: bold; color: #0f172a;">${row.total > 0 ? row.total.toFixed(3) : '-'}</td>
            </tr>
          `).join('')}
        </tbody>
        <tfoot>
          <tr>
            <td style="border: 1px solid #94a3b8; padding: 10px; text-align: right; font-weight: bold; background-color: #f8fafc;">المجموع النهائي</td>
            <td style="border: 1px solid #94a3b8; padding: 10px; text-align: center; font-weight: bold; background-color: #f0fdf4; color: #166534;">${totals.deposit.toFixed(3)}</td>
            <td style="border: 1px solid #94a3b8; padding: 10px; text-align: center; font-weight: bold; background-color: #f0fdfa; color: #0f766e;">${totals.paid.toFixed(3)}</td>
            <td style="border: 1px solid #94a3b8; padding: 10px; text-align: center; font-weight: bold; background-color: #fef2f2; color: #991b1b;">${totals.unpaid.toFixed(3)}</td>
            <td style="border: 1px solid #94a3b8; padding: 10px; text-align: center; font-weight: bold; background-color: #fffbeb; color: #b45309;">${totals.partial.toFixed(3)}</td>
            <td style="border: 1px solid #94a3b8; padding: 10px; text-align: center; font-weight: bold; background-color: #f8fafc; color: #0f172a; font-size: 14px;">${totals.total.toFixed(3)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  `;

  import('./printUtils').then(({ printHTML }) => {
    printHTML(html);
  });
}

export function printMonthlyStatementPDF(invoices: any[], customers: any[], monthName: string, year: number, stats: any) {

  const getCustomerName = (customerId: string) => {
    const customer = customers.find((c: any) => c.id === customerId);
    return customer ? customer.name : 'عميل غير معروف';
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid': return 'مدفوعة';
      case 'partially_paid': return 'مدفوع جزئياً';
      case 'unpaid': return 'غير مدفوعة';
      default: return 'مسودة';
    }
  };

  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <title>طباعة الكشف الشهري</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&family=Tajawal:wght@400;500;700&display=swap');
        body {
          font-family: 'Cairo', sans-serif;
          margin: 0;
          padding: 20px;
          color: #333;
        }
        .header {
          text-align: center;
          margin-bottom: 20px;
          border-bottom: 2px solid #0D9488;
          padding-bottom: 15px;
        }
        .header h1 {
          color: #0D9488;
          margin: 0 0 10px 0;
          font-size: 24px;
        }
        .header p {
          margin: 0;
          color: #64748b;
          font-size: 14px;
        }
        .stats-grid {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
        }
        .stat-card {
          flex: 1;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 10px;
          text-align: center;
          background: #f8fafc;
        }
        .stat-card h3 {
          margin: 0 0 5px 0;
          font-size: 11px;
          color: #64748b;
        }
        .stat-card p {
          margin: 0;
          font-size: 16px;
          font-weight: bold;
          color: #0f172a;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th, td {
          border: 1px solid #e2e8f0;
          padding: 10px 6px;
          text-align: center;
          font-size: 11px;
        }
        th {
          background-color: #f8fafc;
          color: #475569;
          font-weight: 700;
        }
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }
        .items-list {
          margin: 0;
          padding: 0;
          list-style: none;
          text-align: right;
          font-size: 10px;
        }
        @media print {
          @page { margin: 1cm; size: A4 landscape; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .stat-card { page-break-inside: avoid; }
          tr { page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>كشف المدخلات المالية التفصيلي</h1>
        <p>الكشف الشهري لشهر ${monthName} ${year}</p>
        <p>تاريخ الطباعة: ${new Date().toLocaleDateString('ar-OM')}</p>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <h3>إجمالي المبيعات</h3>
          <p>${stats.totalSales.toFixed(3)} ر.ع.</p>
        </div>
        <div class="stat-card">
          <h3>إجمالي الإيرادات</h3>
          <p>${stats.totalPaid.toFixed(3)} ر.ع.</p>
        </div>
        <div class="stat-card">
          <h3>الديون والمستحقات</h3>
          <p>${stats.totalUnpaid.toFixed(3)} ر.ع.</p>
        </div>
        <div class="stat-card">
          <h3>عدد المعاملات</h3>
          <p>${stats.invoiceCount} فاتورة</p>
        </div>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>رقم الفاتورة</th>
            <th>التاريخ</th>
            <th>العميل</th>
            <th style="width: 200px;">بنود المعاملات</th>
            <th>المبلغ الإجمالي</th>
            <th>المدفوع</th>
            <th>المتبقي</th>
            <th>الحالة</th>
          </tr>
        </thead>
        <tbody>
          ${invoices.map(inv => `
            <tr>
              <td class="font-bold">${inv.invoiceNumber}</td>
              <td>${new Date(inv.createdAt).toLocaleDateString('ar-OM')}</td>
              <td class="font-bold text-right">${getCustomerName(inv.customerId)}</td>
              <td>
                <ul class="items-list">
                  ${inv.items.map((i: any) => `<li>${i.quantity}x ${i.serviceName}</li>`).join('')}
                </ul>
              </td>
              <td class="font-bold">${inv.totalAmount.toFixed(3)}</td>
              <td>${inv.downPayment.toFixed(3)}</td>
              <td>${inv.remainingAmount.toFixed(3)}</td>
              <td class="font-bold">${getStatusLabel(inv.status)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </body>
    </html>
  `;

  
  import('./printUtils').then(({ printHTML }) => {
    // we only need the inner HTML, but printHTML wraps it in html/body. 
    // Since this html string already has html/body, we can just pass the inner body, or let it be.
    // Actually, printHTML takes HTML and puts it inside the body. Let's extract the body content.
    const bodyMatch = html.match(/<body>([\s\S]*?)<\/body>/i);
    const innerHtml = bodyMatch ? bodyMatch[1] : html;
    printHTML(innerHtml);
  });
}



export function exportFinancialReportsExcel(invoices: any[], customers: any[] = [], branches: any[] = []) {
  const activeInvoices = invoices.filter(inv => inv.status !== 'draft');
  const totalBilled = activeInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalPaid = activeInvoices.reduce((sum, inv) => sum + inv.downPayment, 0);
  const totalOutstanding = activeInvoices.reduce((sum, inv) => sum + inv.remainingAmount, 0);
  const draftsCount = invoices.filter(inv => inv.status === 'draft').length;

  const getCustomerName = (customerId: string) => {
    const cust = customers.find(c => c.id === customerId);
    return cust ? cust.name : 'غير محدد';
  };
  
  const getCustomerPhone = (customerId: string) => {
    const cust = customers.find(c => c.id === customerId);
    return cust ? cust.phone : '';
  };
  
  const getBranchName = (branchId?: string) => {
    if (!branchId) return 'الرئيسي';
    const branch = branches.find(b => b.id === branchId);
    return branch ? branch.name : branchId;
  };

  const getServicesDetails = (items: any[]) => {
    if (!items || !items.length) return '';
    return items.map(i => `${i.quantity}x ${i.serviceName}`).join(' | ');
  };

  const headers = ['رقم الفاتورة', 'العميل', 'رقم الهاتف', 'الفرع', 'الحالة', 'تاريخ الإصدار', 'الخدمات المقدمة', 'المبلغ الإجمالي (ر.ع.)', 'المدفوع (ر.ع.)', 'المتبقي (ر.ع.)'];
  const rows = activeInvoices.map(inv => [
    String(inv.invoiceNumber),
    getCustomerName(inv.customerId),
    getCustomerPhone(inv.customerId),
    getBranchName(inv.branchId),
    inv.status === 'paid' ? 'مدفوعة' : inv.status === 'partially_paid' ? 'مدفوع جزئياً' : 'غير مدفوعة',
    new Date(inv.createdAt).toLocaleDateString('ar-OM'),
    getServicesDetails(inv.items),
    inv.totalAmount.toFixed(3),
    inv.downPayment.toFixed(3),
    inv.remainingAmount.toFixed(3)
  ]);

  const summaryRows = [
    ['التقارير المالية والتحليلات البيانية - ملخص الأداء'],
    ['إجمالي المبالغ المفوترة', totalBilled.toFixed(3)],
    ['إجمالي المبالغ المحصلة', totalPaid.toFixed(3)],
    ['إجمالي الذمم المعلقة', totalOutstanding.toFixed(3)],
    ['عدد الفواتير الفعالة', String(activeInvoices.length)],
    ['عدد المسودات', String(draftsCount)],
    [],
    headers,
    ...rows
  ];

  const csvContent = summaryRows.map(row => 
    row.map(val => {
      const stringVal = val ? String(val) : '';
      const cleanVal = stringVal.replace(/"/g, '""');
      return `"${cleanVal}"`;
    }).join(',')
  ).join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `التقارير_المالية_الشاملة_${new Date().toISOString().split('T')[0]}.csv`;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 200);
}

export function printFinancialReportsPDF(invoices: any[], customers: any[] = [], branches: any[] = []) {
  const activeInvoices = invoices.filter(inv => inv.status !== 'draft');
  const totalBilled = activeInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalPaid = activeInvoices.reduce((sum, inv) => sum + inv.downPayment, 0);
  const totalOutstanding = activeInvoices.reduce((sum, inv) => sum + inv.remainingAmount, 0);

  const getCustomerName = (customerId: string) => {
    const cust = customers.find(c => c.id === customerId);
    return cust ? cust.name : 'غير محدد';
  };

  const getBranchName = (branchId?: string) => {
    if (!branchId) return 'الرئيسي';
    const branch = branches.find(b => b.id === branchId);
    return branch ? branch.name : branchId;
  };

  const html = `
    <div style="font-family: 'Tajawal', sans-serif; direction: rtl; text-align: right; padding: 20px;">
      <style>
        @media print {
          @page { size: A4 portrait; margin: 15mm; }
          body { -webkit-print-color-adjust: exact; margin: 0; padding: 0; }
          .page-break { page-break-before: always; }
          table { page-break-inside: auto; width: 100% !important; }
          tr { page-break-inside: avoid; page-break-after: auto; }
          thead { display: table-header-group; }
          tfoot { display: table-footer-group; }
          .chart-container { page-break-inside: avoid; }
        }
      </style>
      
      <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #0D9488; padding-bottom: 10px;">
        <h1 style="color: #0D9488; margin: 0 0 10px 0; font-size: 24px;">التقارير المالية والتحليلات البيانية</h1>
        <p style="margin: 0; color: #64748b; font-size: 16px;">ملخص الأداء المالي</p>
        <p style="margin: 5px 0 0 0; color: #94a3b8; font-size: 12px;">تاريخ الطباعة: ${new Date().toLocaleDateString('ar-OM')}</p>
      </div>

      <div style="display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: nowrap;">
        <div style="flex: 1; min-width: 150px; padding: 15px; border-radius: 8px; background-color: #f8fafc; border: 1px solid #e2e8f0;">
          <div style="font-size: 12px; color: #64748b; margin-bottom: 5px;">المبالغ الإجمالية المفوترة</div>
          <div style="font-size: 20px; font-weight: bold; color: #1e293b;">${totalBilled.toFixed(3)} ر.ع.</div>
        </div>
        <div style="flex: 1; min-width: 150px; padding: 15px; border-radius: 8px; background-color: #f0fdf4; border: 1px solid #bbf7d0;">
          <div style="font-size: 12px; color: #166534; margin-bottom: 5px;">المدفوعات والمحصل</div>
          <div style="font-size: 20px; font-weight: bold; color: #15803d;">${totalPaid.toFixed(3)} ر.ع.</div>
        </div>
        <div style="flex: 1; min-width: 150px; padding: 15px; border-radius: 8px; background-color: #fef2f2; border: 1px solid #fecaca;">
          <div style="font-size: 12px; color: #991b1b; margin-bottom: 5px;">الذمم الدائنة المتبقية</div>
          <div style="font-size: 20px; font-weight: bold; color: #dc2626;">${totalOutstanding.toFixed(3)} ر.ع.</div>
        </div>
      </div>

      <!-- Add visual chart block (SVG) -->
      <div class="chart-container" style="margin-bottom: 30px; text-align: center; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; background: #fafafa; overflow: hidden;">
        <h3 style="font-size: 14px; margin-bottom: 10px; color: #334155;">الرسم التوضيحي لهيكل الإيرادات والمستحقات</h3>
        <svg width="400" height="200" viewBox="0 0 300 200" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin: auto; max-width: 100%;">
          <!-- Axes lines -->
          <line x1="40" y1="20" x2="40" y2="160" stroke="#CBD5E1" strokeWidth="2" />
          <line x1="40" y1="160" x2="280" y2="160" stroke="#CBD5E1" strokeWidth="2" />

          <!-- Y Axis helper markings -->
          <line x1="35" y1="40" x2="280" y2="40" stroke="#F1F5F9" strokeWidth="1" />
          <line x1="35" y1="100" x2="280" y2="100" stroke="#F1F5F9" strokeWidth="1" />

          <!-- Bars -->
          <rect x="70" y="30" width="35" height="130" rx="3" fill="#3B82F6" />
          <rect x="130" y="${160 - (130 * (totalPaid / (totalBilled || 1)))}" width="35" height="${(130 * (totalPaid / (totalBilled || 1)))}" rx="3" fill="#10B981" />
          <rect x="190" y="${160 - (130 * (totalOutstanding / (totalBilled || 1)))}" width="35" height="${(130 * (totalOutstanding / (totalBilled || 1)))}" rx="3" fill="#EF4444" />

          <!-- X Axis Labels -->
          <text x="87.5" y="180" fill="#64748b" fontSize="10" textAnchor="middle" fontFamily="Tajawal">المفوتر</text>
          <text x="147.5" y="180" fill="#64748b" fontSize="10" textAnchor="middle" fontFamily="Tajawal">المحصل</text>
          <text x="207.5" y="180" fill="#64748b" fontSize="10" textAnchor="middle" fontFamily="Tajawal">المعلق</text>
        </svg>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px;">
        <thead>
          <tr>
            <th style="border: 1px solid #cbd5e1; padding: 10px; background-color: #f1f5f9; text-align: right; color: #334155; width: 12%;">التاريخ</th>
            <th style="border: 1px solid #cbd5e1; padding: 10px; background-color: #f1f5f9; text-align: center; color: #334155; width: 13%;">الفرع</th>
            <th style="border: 1px solid #cbd5e1; padding: 10px; background-color: #f1f5f9; text-align: right; color: #334155; width: 25%;">العميل</th>
            <th style="border: 1px solid #cbd5e1; padding: 10px; background-color: #f1f5f9; text-align: center; color: #334155; width: 10%;">الفاتورة</th>
            <th style="border: 1px solid #cbd5e1; padding: 10px; background-color: #f1f5f9; text-align: center; color: #334155; width: 12%;">الإجمالي</th>
            <th style="border: 1px solid #cbd5e1; padding: 10px; background-color: #f1f5f9; text-align: center; color: #334155; width: 12%;">المدفوع</th>
            <th style="border: 1px solid #cbd5e1; padding: 10px; background-color: #f1f5f9; text-align: center; color: #334155; width: 16%;">الحالة</th>
          </tr>
        </thead>
        <tbody>
          ${activeInvoices.map(inv => `
            <tr>
              <td style="border: 1px solid #e2e8f0; padding: 8px;">${new Date(inv.createdAt).toLocaleDateString('ar-OM')}</td>
              <td style="border: 1px solid #e2e8f0; padding: 8px; text-align: center;">${getBranchName(inv.branchId)}</td>
              <td style="border: 1px solid #e2e8f0; padding: 8px; font-weight: bold;">${getCustomerName(inv.customerId)}</td>
              <td style="border: 1px solid #e2e8f0; padding: 8px; text-align: center; font-family: monospace;">${inv.invoiceNumber}</td>
              <td style="border: 1px solid #e2e8f0; padding: 8px; text-align: center;">${inv.totalAmount.toFixed(3)}</td>
              <td style="border: 1px solid #e2e8f0; padding: 8px; text-align: center; color: #16a34a;">${inv.downPayment.toFixed(3)}</td>
              <td style="border: 1px solid #e2e8f0; padding: 8px; text-align: center;">${
                inv.status === 'paid' ? '<span style="color:#16a34a;">مدفوعة</span>' : 
                inv.status === 'partially_paid' ? '<span style="color:#ca8a04;">مدفوع جزئياً</span>' : '<span style="color:#dc2626;">غير مدفوعة</span>'
              }</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  import('./printUtils').then(({ printHTML }) => {
    printHTML(html);
  });
}

export function exportEmployeesToExcel(users: User[], branches: Branch[]) {
  const escapeXml = (unsafe: any) => {
    if (unsafe === null || unsafe === undefined) return '';
    return String(unsafe).replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
        default: return c;
      }
    });
  };

  const getBranchName = (branchId?: string) => {
    if (!branchId) return 'الرئيسي';
    const branch = branches.find(b => b.id === branchId);
    return branch ? branch.name : branchId;
  };

  const getSkills = (user: User) => {
    return (user.skills && user.skills.length > 0) ? user.skills.join('، ') : '—';
  };

  const formatTime12Hour = (time24: string) => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':');
    let h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'م' : 'ص';
    h = h % 12;
    h = h ? h : 12; 
    return `${h}:${minutes} ${ampm}`;
  };

  const headers = [
    'الرقم الوظيفي', 'الإسم الثلاثي', 'الفرع', 'المسمى الوظيفي', 
    'المستوى', 'طبيعة الدوام', 'فترة المناوبة', 'رقم التواصل', 
    'تاريخ التعيين', 'رقم المقعد/الجهاز', 'العنوان', 'الحالة الإجتماعية', 'رقم أحد الأقارب',
    'المؤهلات والخبرات', 'اتفاقية العمل', 'المهارات', 'البيانات البنكية'
  ];

  const rows = users.map(u => [
    u.employeeId || '—',
    u.fullName || u.name || '—',
    getBranchName(u.branchId),
    u.jobTitle || (u.role === 'admin' ? 'مدير' : u.role === 'hr' ? 'موارد بشرية' : 'موظف'),
    u.level || 'غير محدد',
    u.workNature || 'غير محدد',
    u.shift ? `${u.shift}${u.checkInTime ? ' (' + formatTime12Hour(u.checkInTime) + (u.checkOutTime ? ' - ' + formatTime12Hour(u.checkOutTime) : '') + ')' : ''}${u.shiftNotes ? ' - ' + u.shiftNotes : ''}` : 'غير محدد',
    u.contactNumber || '—',
    u.joinDate || '—',
    u.seatNumber || '—',
    u.address || '—',
    u.maritalStatus || '—',
    u.relativePhone || '—',
    u.qualifications || '—',
    u.workAgreement || '—',
    getSkills(u),
    u.bankName || u.bankAccount ? `${u.bankName || ''} - ${u.bankAccount || ''}` : '—'
  ]);

  const xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
  <Styles>
    <Style ss:ID="Default" ss:Name="Normal">
      <Alignment ss:Vertical="Bottom" ss:Horizontal="Right"/>
      <Borders/>
      <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#000000"/>
      <Interior/>
      <NumberFormat/>
      <Protection/>
    </Style>
    <Style ss:ID="Header">
      <Font ss:FontName="Segoe UI" ss:Size="12" ss:Bold="1" ss:Color="#FFFFFF"/>
      <Interior ss:Color="#0D9488" ss:Pattern="Solid"/>
      <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#0D9488"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#0D9488"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#0D9488"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#0D9488"/>
      </Borders>
    </Style>
    <Style ss:ID="DataCell">
      <Font ss:FontName="Segoe UI" ss:Size="11"/>
      <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
      </Borders>
    </Style>
  </Styles>
  <Worksheet ss:Name="كشف بيانات الموظفين">
    <Table ss:DefaultColumnWidth="120">
      <Column ss:Width="80"/>
      <Column ss:Width="150"/>
      <Column ss:Width="100"/>
      <Column ss:Width="120"/>
      <Column ss:Width="80"/>
      <Column ss:Width="100"/>
      <Column ss:Width="180"/>
      <Column ss:Width="100"/>
      <Column ss:Width="100"/>
      <Column ss:Width="100"/>
      <Column ss:Width="150"/>
      <Column ss:Width="90"/>
      <Column ss:Width="100"/>
      <Column ss:Width="150"/>
      <Column ss:Width="120"/>
      <Column ss:Width="150"/>
      <Column ss:Width="150"/>
      
      <Row ss:Height="30">
        ${headers.map(h => `<Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXml(h)}</Data></Cell>`).join('')}
      </Row>
      ${rows.map(row => `
      <Row ss:AutoFitHeight="1">
        ${row.map(cell => `<Cell ss:StyleID="DataCell"><Data ss:Type="String">${escapeXml(cell)}</Data></Cell>`).join('')}
      </Row>`).join('')}
    </Table>
    <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
      <DisplayRightToLeft>true</DisplayRightToLeft>
    </WorksheetOptions>
  </Worksheet>
</Workbook>`;

  const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `كشف_بيانات_الموظفين_${new Date().toISOString().split('T')[0]}.xls`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportCustomersExcel(customers: any[]) {
  const escapeXml = (unsafe: any): string => {
    if (unsafe === null || unsafe === undefined) return '';
    return String(unsafe)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
      .replace(/\n/g, '&#10;');
  };

  const headers = [
    'المعرف', 'الاسم', 'الهاتف', 'النوع', 'الرقم المدني / السجل التجاري', 
    'اسم صاحب المنشأة', 'الحالة', 'تاريخ التسجيل', 'تم تسجيله بواسطة', 'تاريخ الإغلاق'
  ];

  const rows = customers.map(c => [
    c.id,
    c.name,
    c.phone,
    c.type === 'individual' ? 'فرد' : 'منشأة',
    c.civilId || c.registrationNumber || '',
    c.ownerName || '',
    c.status === 'active' ? 'نشط' : (c.status === 'late' ? 'متأخر' : 'مغلق'),
    new Date(c.createdAt).toLocaleDateString('ar-OM'),
    c.registeredBy || '',
    c.closedAt ? new Date(c.closedAt).toLocaleDateString('ar-OM') : ''
  ]);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:x="urn:schemas-microsoft-com:office:excel"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:html="http://www.w3.org/TR/REC-html40">
  <Styles>
    <Style ss:ID="Default" ss:Name="Normal">
      <Alignment ss:Vertical="Center" ss:Horizontal="Center"/>
      <Borders/>
      <Font ss:FontName="Arial" x:CharSet="178" x:Family="Swiss" ss:Size="11"/>
      <Interior/>
      <NumberFormat/>
      <Protection/>
    </Style>
    <Style ss:ID="Header">
      <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
      </Borders>
      <Font ss:FontName="Arial" ss:Size="12" ss:Bold="1" ss:Color="#FFFFFF"/>
      <Interior ss:Color="#0F766E" ss:Pattern="Solid"/>
    </Style>
    <Style ss:ID="DataCell">
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
      </Borders>
    </Style>
  </Styles>
  <Worksheet ss:Name="بيانات العملاء">
    <Table>
      <Column ss:Width="80"/>
      <Column ss:Width="200"/>
      <Column ss:Width="120"/>
      <Column ss:Width="100"/>
      <Column ss:Width="150"/>
      <Column ss:Width="150"/>
      <Column ss:Width="80"/>
      <Column ss:Width="100"/>
      <Column ss:Width="120"/>
      <Column ss:Width="100"/>
      <Row ss:Height="25">
        ${headers.map(h => `<Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXml(h)}</Data></Cell>`).join('')}
      </Row>
      ${rows.map(row => `
      <Row ss:AutoFitHeight="1">
        ${row.map(cell => `<Cell ss:StyleID="DataCell"><Data ss:Type="String">${escapeXml(cell)}</Data></Cell>`).join('')}
      </Row>`).join('')}
    </Table>
    <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
      <DisplayRightToLeft>true</DisplayRightToLeft>
    </WorksheetOptions>
  </Worksheet>
</Workbook>`;

  const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `بيانات_العملاء_${new Date().toISOString().split('T')[0]}.xls`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
