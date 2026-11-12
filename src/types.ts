/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type CustomerType = 'individual' | 'entity'; // فرد | منشأة
export type CustomerStatus = 'active' | 'late' | 'closed'; // نشط | متأخر | مغلق

export interface Customer {
  id: string;
  type: CustomerType;
  name: string;
  phone: string;
  civilId?: string; // الرقم المدني (للأفراد)
  registrationNumber?: string; // رقم السجل التجاري (للمنشآت)
  ownerName?: string; // اسم صاحب المنشأة (للمنشآت)
  status: CustomerStatus;
  createdAt: string;
  registeredBy?: string; // User who registered the customer
  closedAt?: string;
  branchId?: string; // الفرع الذي سُجل فيه العميل
}

export type InvoiceStatus = 'draft' | 'paid' | 'unpaid' | 'partially_paid'; // مسودة | مدفوعة | غير مدفوعة | مدفوعة جزئياً

export interface InvoiceItem {
  id: string;
  serviceName: string;
  quantity: number;
  price: number;
  discount: number;
  employeeName: string;
  total: number;
  createdAt?: string; // تاريخ تسجيل البند (غير قابل للتعديل)
}

export type PaymentMethod = 'cash' | 'pos' | 'transfer';

export interface Payment {
  id: string;
  amount: number;
  date: string;
  recordedBy: string;
  notes?: string;
  method?: PaymentMethod;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  items: InvoiceItem[];
  discount?: number; // legacy global discount
  downPayment: number; // المبلغ المقدم المدفوع
  totalAmount: number; // الإجمالي النهائي بعد الخصم
  remainingAmount: number; // المبلغ المتبقي (الإجمالي - المقدم)
  payments?: Payment[]; // سجل الدفعات الجزئية
  status: InvoiceStatus;
  createdAt: string;
  closingDate?: string; // تاريخ إغلاق الفاتورة
  createdBy?: string; // اسم المستخدم الذي قام بإنشاء الفاتورة في البداية
  lastModifiedBy: string; // اسم المستخدم الذي قام بالتعديل الأخير
  lastModifiedAt: string;
  isLocked?: boolean; // قفل التعديل للفاتورة
  originalDocsReceived?: boolean;
  originalDocsReceivedAt?: string;
  originalDocsReceivedBy?: string;
  originalDocsReceivedHistory?: { status: boolean; changedAt: string; changedBy: string }[];
  modificationHistory?: { modifiedAt: string; modifiedBy: string; action: string }[];
  customerExtraText?: string; // نص إضافي يظهر بعد اسم العميل
  branchId?: string; // الفرع الذي أنشئت فيه الفاتورة
}

export interface DeletedInvoice {
  id: string;
  invoice: Invoice;
  deletedBy: string;
  deletedAt: string;
}

export type UserRole = 'admin' | 'hr' | 'staff' | 'accountant' | 'external_support_tech' | 'external_support_admin' | 'temp_visitor' | 'trainee'; // مدير النظام | مدير موارد بشرية | موظف | محاسب مالي | فني دعم خارجي | إداري دعم خارجي | زائر مؤقت

export interface UserPermissions {
  createInvoice: boolean;
  editInvoice: boolean;
  deleteInvoice: boolean;
  manageCustomers: boolean;
  closeAccounts: boolean;
  viewReports: boolean;
  manageUsers: boolean;
  editServices: boolean;
  deleteServices: boolean;
  manageTickets?: boolean;
  viewActivityLogs: boolean;
  manageWarnings?: boolean;
  inputTicketAmount?: boolean; // إدخال مبالغ التذاكر
  viewTicketAmount?: boolean; // رؤية مبالغ التذاكر
  manageTicketAmount?: boolean; // legacy compatibility
}

export interface Branch {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  username: string;
  password?: string;
  role: UserRole;
  permissions: UserPermissions;
  isActive: boolean;
  branchId?: string; // الفرع المرتبط بالموظف
  branches?: Branch[]; // قائمة الفروع المخصصة (فقط لكائن الإعدادات الخاص بالفروع)
  ticketTypes?: string[]; // قائمة أنواع الطلبات المخصصة للتذاكر (فقط لكائن الإعدادات الخاص بالتذاكر)
  phoneNumber?: string;
  hireDate?: string;
  socialInsuranceNumber?: string;
  socialInsuranceSalary?: number;
  bankData?: string;
  notes?: string;
  ticketTypePlaceholders?: Record<string, string>; // تلميحات أنواع التذاكر (فقط لكائن الإعدادات الخاص بالتذاكر)
  ticketManagers?: Record<string, string[]>; // مدراء أنواع التذاكر (فقط لكائن الإعدادات الخاص بالتذاكر)
  custodyCategories?: { id: string; name: string; subTypes: string[] }[]; // For custodies_config
  
  // Profile Data
  avatarUrl?: string;
  jobTitle?: string;
  fullName?: string; // الإسم الثلاثي
  address?: string;
  seatNumber?: string;
  contactNumber?: string;
  maritalStatus?: string;
  workAgreement?: string;
  workAgreementFiles?: {name: string, url: string}[];
  level?: 'Level - 1' | 'Level - 2' | 'Level - 3' | 'Level - 4' | 'Level - 5';
  custodies?: { category: string; subType: string; details?: string; dateAssigned?: string }[];
  employeeId?: string;
  joinDate?: string;
  registrationDate?: string; // تاريخ التسجيل بالنظام
  idCardFiles?: {name: string, url: string}[];
  documentUpdatedAt?: string; // تاريخ آخر تحديث للمستندات
  bylawUpdatedAt?: string; // تاريخ آخر تحديث للائحة
  bylawFileUrl?: string; // رابط أو ملف اللائحة التنظيمية
  qualifications?: string;
  qualificationFiles?: {name: string, url: string}[];
  idCardUrl?: string;
  relativePhone?: string;
  shift?: 'صباحي (Morning)' | 'مسائي (Evening)' | 'متغير, مرن, هجين';
  checkInTime?: string;
  checkOutTime?: string;
  shiftNotes?: string;
  bankName?: string;
  bankAccount?: string;
  workNature?: 'موظف ثابت دوام كامل (Full-Time)' | 'موظف دوام جزئي/موسمي (Part-Time)' | 'موظف احتياطي / مؤقت' | 'موظف عمل عن بعد (Online)' | 'موظف ملغي / مستقيل';

  // Performance Data
  skills?: string[];
  providedServices?: string[];
  capableServices?: string[];
  talents?: string[];
  
  // Financial Data
  monthlySalary?: number;
  loans?: number;
  
  // Settings for warnings config
  warningTypes?: WarningType[];
  
  // System Wide Settings
  systemSettings?: {
    idleHours: number;
    enableNewInvoice: boolean;
    enableNewTicket: boolean;
    enableNewWarning: boolean;
    enableNewCustomer: boolean;
    enableCloseAccounts: boolean;
    requireCustomerPhone?: boolean;
    requireCustomerCivilId?: boolean;
    lateInvoicePeriod?: '1_week' | '2_weeks' | '3_weeks' | '1_month' | '2_months' | '3_months';
    enableLateInvoiceAlert?: boolean;
    // Core Company Details (البيانات الأساسية للشركة)
    companyName?: string;
    companyNameEn?: string;
    companyCrNumber?: string;
    companyLogo?: string;
    companyPhone?: string;
    companyEmail?: string;
    companyAddress?: string;
    companySubtitle?: string;
  };
}

export type WarningDegree = 'low' | 'medium' | 'high'; // منخفضة | متوسطة | عالية

export interface WarningTypeOption {
  id: string;
  name: string;
}

export interface WarningType {
  id: string;
  name: string;
  subOptions: WarningTypeOption[];
  degree: WarningDegree;
}

export type WarningStatus = 'new' | 'read' | 'appealed' | 'closed';

export interface WarningMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  content: string;
  createdAt: string;
  imageUrl?: string;
  fileUrl?: string;
  fileName?: string;
}

export interface Warning {
  id: string;
  warningNumber: string; // WRN-1001
  employeeId: string;
  employeeName: string;
  branchId?: string;
  typeId: string;
  typeName: string;
  subTypeId: string;
  subTypeName: string;
  degree: WarningDegree;
  details: string;
  imageUrl?: string;
  fileUrl?: string;
  fileName?: string;
  senderId: string;
  senderName: string;
  status: WarningStatus;
  createdAt: string;
  updatedAt: string;
  messages: WarningMessage[];
  unreadByEmployee?: boolean;
  unreadByAdmin?: boolean;
  lastEditedBy?: string;
  isLocked?: boolean;
  lockedBy?: string;
  lockedAt?: string;
}

export interface MailAttachment {
  name: string;
  url: string;
  type: string;
}

export interface MailMessage {
  id: string;
  threadId?: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  subject: string;
  content: string;
  createdAt: string;
  isRead: boolean;
  readAt?: string;
  attachments?: MailAttachment[];
  isDraft?: boolean;
  isDeleted?: boolean;
  deletedBySender?: boolean;
  deletedByReceiver?: boolean;
}

export interface PrivateMessage {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  content: string;
  createdAt: string;
  isRead?: boolean;
  readAt?: string;
  attachmentName?: string;
  attachmentUrl?: string;
}

export interface ActivityLog {
  id: string;
  userId?: string;
  username: string;
  action: string;
  timestamp: string;
  details?: string;
  branchId?: string; // الفرع الذي تمت فيه العملية
}

export interface Service {
  id: string;
  name: string;
  defaultPrice: number;
}

export type TicketStatus = 'new' | 'processing' | 'completed';

export interface TicketMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'employee' | 'hr' | 'admin';
  content: string;
  createdAt: string;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentType?: 'image' | 'file' | string;
}

export interface TicketAmountHistoryItem {
  id: string;
  amount: number;
  previousAmount?: number;
  changedById: string;
  changedByName: string;
  changedAt: string;
}

export interface TicketOperationLogItem {
  id: string;
  action: string;
  details?: string;
  performedById: string;
  performedByName: string;
  performedByRole?: string;
  timestamp: string;
  type?: 'creation' | 'status_change' | 'amount_change' | 'edit' | 'close' | 'message';
}

export interface Ticket {
  id: string;
  ticketNumber: string; // e.g. "TCK-1001"
  title: string;
  type: string; // e.g. 'إجازة' | 'راتب' | 'طلب إداري' | 'أخرى'
  details: string;
  amount?: number; // المبلغ المالي
  lastAmountEditedBy?: string; // اسم المستخدم الذي قام بآخر تعديل للمبلغ
  lastAmountEditedById?: string;
  lastAmountEditedAt?: string; // تاريخ آخر تعديل للمبلغ
  amountHistory?: TicketAmountHistoryItem[]; // سجل تعديلات المبلغ
  status: TicketStatus;
  employeeId: string;
  employeeName: string;
  branchId?: string;
  createdAt: string;
  updatedAt: string;
  messages: TicketMessage[];
  closedBy?: string;
  closedByName?: string;
  closedAt?: string;
  processingBy?: string;
  processingByName?: string;
  processingAt?: string;
  operationsLog?: TicketOperationLogItem[]; // سجل العمليات والإجراءات المنفذة على التذكرة
  unreadByEmployee?: boolean;
  unreadByHr?: boolean;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentType?: 'image' | 'file' | string;
}


