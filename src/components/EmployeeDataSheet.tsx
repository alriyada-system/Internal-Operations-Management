import React, { useState, useRef, useEffect } from 'react';
import { User, Branch } from '../types';
import { Search, Download, Printer, Filter, RotateCcw, ChevronDown, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import * as printUtils from '../utils/printUtils';
import { exportEmployeesToExcel } from '../utils/exportUtils';

function MultiSelectFilter({
  label,
  options,
  selectedValues,
  onChange
}: {
  label: string;
  options: { value: string; label: string }[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isAllSelected = selectedValues.length === 0 || selectedValues.includes('all');

  const handleToggleOption = (value: string) => {
    if (value === 'all') {
      onChange(['all']);
      return;
    }
    let newValues = selectedValues.filter(v => v !== 'all');
    if (newValues.includes(value)) {
      newValues = newValues.filter(v => v !== value);
    } else {
      newValues = [...newValues, value];
    }
    if (newValues.length === 0) {
      onChange(['all']);
    } else {
      onChange(newValues);
    }
  };

  const displayText = isAllSelected 
    ? label 
    : `${label} (${selectedValues.length})`;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white flex items-center justify-between text-slate-700 truncate cursor-pointer"
      >
        <span className="truncate">{displayText}</span>
        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 mr-1" />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-1 right-0 left-0 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-2 space-y-1 max-h-60 overflow-y-auto">
          <div
            onClick={() => handleToggleOption('all')}
            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
              isAllSelected ? 'bg-indigo-50 text-indigo-700 font-bold' : 'hover:bg-slate-50 text-slate-700'
            }`}
          >
            <input
              type="checkbox"
              checked={isAllSelected}
              onChange={() => {}}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span>{label} (الكل)</span>
          </div>
          {options.map(opt => {
            const isSelected = !isAllSelected && selectedValues.includes(opt.value);
            return (
              <div
                key={opt.value}
                onClick={() => handleToggleOption(opt.value)}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                  isSelected ? 'bg-indigo-50 text-indigo-700 font-bold' : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => {}}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="truncate">{opt.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const ResizableTh = ({ children, className, minWidth = 100, initialWidth = 'auto', ...props }: any) => {
  const [width, setWidth] = React.useState<number | 'auto'>(initialWidth);
  const thRef = useRef<HTMLTableCellElement>(null);
  
  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.pageX;
    const startWidth = thRef.current?.getBoundingClientRect().width || 0;
    
    const doDrag = (dragEvent: MouseEvent) => {
      const newWidth = startWidth + (startX - dragEvent.pageX);
      setWidth(Math.max(minWidth, newWidth));
    };
    
    const stopDrag = () => {
      document.removeEventListener('mousemove', doDrag);
      document.removeEventListener('mouseup', stopDrag);
    };
    
    document.addEventListener('mousemove', doDrag);
    document.addEventListener('mouseup', stopDrag);
  };

  return (
    <th 
      ref={thRef} 
      className={`relative ${className}`}
      style={{ width: width === 'auto' ? 'auto' : `${width}px`, minWidth: width === 'auto' ? `${minWidth}px` : `${width}px` }}
      {...props}
    >
      {children}
      <div 
        onMouseDown={startResize}
        className="absolute top-0 left-0 w-2 h-full cursor-col-resize hover:bg-teal-500 z-10 transition-colors"
        title="تغيير عرض العمود"
      />
    </th>
  );
};

interface EmployeeDataSheetProps {
  users: User[];
  branches: Branch[];
}

const formatTime12Hour = (timeStr?: string) => {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':');
  let h = parseInt(hours, 10);
  const ampm = h >= 12 ? 'م' : 'ص';
  h = h % 12;
  h = h ? h : 12;
  return `${h}:${minutes} ${ampm}`;
};

export default function EmployeeDataSheet({ users, branches }: EmployeeDataSheetProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranches, setSelectedBranches] = useState<string[]>(['all']);
  const [selectedLevels, setSelectedLevels] = useState<string[]>(['all']);
  const [selectedWorkNatures, setSelectedWorkNatures] = useState<string[]>(['all']);
  const [selectedShifts, setSelectedShifts] = useState<string[]>(['all']);
  const [selectedMaritalStatuses, setSelectedMaritalStatuses] = useState<string[]>(['all']);
  const [selectedRoles, setSelectedRoles] = useState<string[]>(['all']);

  const [sortColumn, setSortColumn] = useState<string>('employeeId');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const defaultColumnOrder = [
    'employeeId', 'fullName', 'branchId', 'jobTitle', 'level', 'workNature',
    'shift', 'phoneNumber', 'hireDate', 'seatNumber', 'address', 'maritalStatus',
    'relativePhone', 'qualifications', 'workAgreement', 'skills', 'bankData'
  ];
  const [columnOrder, setColumnOrder] = useState<string[]>(defaultColumnOrder);
  const [draggedColId, setDraggedColId] = useState<string | null>(null);
  const [dragOverColId, setDragOverColId] = useState<string | null>(null);
  
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };
  
  const SortIcon = ({ column }: { column: string }) => {
    if (sortColumn !== column) return <ArrowUpDown className="w-3 h-3 ml-1 text-slate-300 group-hover:text-slate-400 transition-colors shrink-0" />;
    return sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 ml-1 text-indigo-500 shrink-0" /> : <ArrowDown className="w-3 h-3 ml-1 text-indigo-500 shrink-0" />;
  };

  const getBranchName = (branchId?: string) => {
    if (!branchId) return 'غير محدد';
    const branch = branches.find(b => b.id === branchId);
    return branch ? branch.name : 'غير محدد';
  };

  const filteredUsers = React.useMemo(() => {
    const filtered = users.filter(u => {
      if (u.id.endsWith('_config') || u.username?.endsWith('_system')) return false;
      
      const matchesSearch = searchTerm === '' || 
        (u.fullName && u.fullName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (u.name && u.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (u.employeeId && u.employeeId.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (u.jobTitle && u.jobTitle.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (u.contactNumber && u.contactNumber.includes(searchTerm));

      const matchesBranch = selectedBranches.includes('all') || (u.branchId && selectedBranches.includes(u.branchId));
      const matchesLevel = selectedLevels.includes('all') || (u.level && selectedLevels.includes(u.level));
      const matchesWorkNature = selectedWorkNatures.includes('all') || (u.workNature && selectedWorkNatures.includes(u.workNature));
      const matchesShift = selectedShifts.includes('all') || (u.shift && selectedShifts.some(s => u.shift?.includes(s)));
      const matchesMarital = selectedMaritalStatuses.includes('all') || (u.maritalStatus && selectedMaritalStatuses.includes(u.maritalStatus));
      const matchesRole = selectedRoles.includes('all') || (u.role && selectedRoles.includes(u.role));

      return matchesSearch && matchesBranch && matchesLevel && matchesWorkNature && matchesShift && matchesMarital && matchesRole;
    });

    return filtered.sort((a, b) => {
      let valA: any = a[sortColumn as keyof User];
      let valB: any = b[sortColumn as keyof User];

      if (sortColumn === 'fullName') {
        valA = a.fullName || a.name || '';
        valB = b.fullName || b.name || '';
      } else if (sortColumn === 'branchId') {
        valA = getBranchName(a.branchId);
        valB = getBranchName(b.branchId);
      } else if (sortColumn === 'hireDate') {
        valA = a.joinDate || '';
        valB = b.joinDate || '';
      } else if (sortColumn === 'phoneNumber') {
        valA = a.contactNumber || '';
        valB = b.contactNumber || '';
      } else if (sortColumn === 'qualifications') {
        valA = a.qualifications || '';
        valB = b.qualifications || '';
      } else if (sortColumn === 'bankData') {
        valA = a.bankName || '';
        valB = b.bankName || '';
      }

      if (valA === undefined || valA === null) valA = '';
      if (valB === undefined || valB === null) valB = '';

      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }
      
      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [users, searchTerm, selectedBranches, selectedLevels, selectedWorkNatures, selectedShifts, selectedMaritalStatuses, selectedRoles, sortColumn, sortDirection]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedBranches(['all']);
    setSelectedLevels(['all']);
    setSelectedWorkNatures(['all']);
    setSelectedShifts(['all']);
    setSelectedMaritalStatuses(['all']);
    setSelectedRoles(['all']);
  };

  const getSkills = (user: User) => {
    return (user.skills && user.skills.length > 0) ? user.skills.join('، ') : '—';
  };

  const exportToCSV = () => {
    exportEmployeesToExcel(filteredUsers, branches);
  };

  const columnDefs: Record<string, {
    label: string;
    minWidth?: number;
    initialWidth?: number | 'auto';
    renderHeader: () => React.ReactNode;
    renderCell: (user: User) => React.ReactNode;
  }> = {
    employeeId: {
      label: 'الرقم الوظيفي',
      minWidth: 80,
      initialWidth: 80,
      renderHeader: () => (
        <button onClick={() => handleSort('employeeId')} className="flex items-center w-full justify-between hover:text-indigo-600 group focus:outline-none">
          <span>الرقم الوظيفي</span><SortIcon column="employeeId" />
        </button>
      ),
      renderCell: (u) => <td className="px-2 py-3 font-medium text-slate-900 text-xs w-[50px] max-w-[50px] overflow-hidden text-ellipsis">{u.employeeId || '—'}</td>
    },
    fullName: {
      label: 'الإسم الثلاثي',
      minWidth: 150,
      renderHeader: () => (
        <button onClick={() => handleSort('fullName')} className="flex items-center w-full justify-between hover:text-indigo-600 group focus:outline-none">
          <span>الإسم الثلاثي</span><SortIcon column="fullName" />
        </button>
      ),
      renderCell: (u) => <td className="px-4 py-3 text-slate-800 font-bold">{u.fullName || u.name || '—'}</td>
    },
    branchId: {
      label: 'الفرع',
      minWidth: 120,
      renderHeader: () => (
        <button onClick={() => handleSort('branchId')} className="flex items-center w-full justify-between hover:text-indigo-600 group focus:outline-none">
          <span>الفرع</span><SortIcon column="branchId" />
        </button>
      ),
      renderCell: (u) => <td className="px-4 py-3 text-slate-600">{getBranchName(u.branchId)}</td>
    },
    jobTitle: {
      label: 'المسمى الوظيفي',
      minWidth: 120,
      renderHeader: () => (
        <button onClick={() => handleSort('jobTitle')} className="flex items-center w-full justify-between hover:text-indigo-600 group focus:outline-none">
          <span>المسمى الوظيفي</span><SortIcon column="jobTitle" />
        </button>
      ),
      renderCell: (u) => <td className="px-4 py-3 text-slate-600">{u.jobTitle || (u.role === 'admin' ? 'مدير' : u.role === 'hr' ? 'موارد بشرية' : 'موظف')}</td>
    },
    level: {
      label: 'المستوى',
      minWidth: 100,
      renderHeader: () => (
        <button onClick={() => handleSort('level')} className="flex items-center w-full justify-between hover:text-indigo-600 group focus:outline-none">
          <span>المستوى</span><SortIcon column="level" />
        </button>
      ),
      renderCell: (u) => <td className="px-4 py-3 text-slate-600">{u.level || '—'}</td>
    },
    workNature: {
      label: 'طبيعة الدوام',
      minWidth: 150,
      renderHeader: () => (
        <button onClick={() => handleSort('workNature')} className="flex items-center w-full justify-between hover:text-indigo-600 group focus:outline-none">
          <span>طبيعة الدوام</span><SortIcon column="workNature" />
        </button>
      ),
      renderCell: (u) => <td className="px-4 py-3 text-slate-600">{u.workNature || '—'}</td>
    },
    shift: {
      label: 'فترة المناوبة',
      minWidth: 120,
      renderHeader: () => (
        <button onClick={() => handleSort('shift')} className="flex items-center w-full justify-between hover:text-indigo-600 group focus:outline-none">
          <span>فترة المناوبة</span><SortIcon column="shift" />
        </button>
      ),
      renderCell: (u) => <td className="px-4 py-3 text-slate-600">{u.shift ? `${u.shift}${u.checkInTime ? ' (' + formatTime12Hour(u.checkInTime) + (u.checkOutTime ? ' - ' + formatTime12Hour(u.checkOutTime) : '') + ')' : ''}${u.shiftNotes ? ' - ' + u.shiftNotes : ''}` : '—'}</td>
    },
    phoneNumber: {
      label: 'رقم التواصل',
      minWidth: 120,
      renderHeader: () => (
        <button onClick={() => handleSort('phoneNumber')} className="flex items-center w-full justify-between hover:text-indigo-600 group focus:outline-none">
          <span>رقم التواصل</span><SortIcon column="phoneNumber" />
        </button>
      ),
      renderCell: (u) => <td className="px-4 py-3 text-slate-600">{u.contactNumber || '—'}</td>
    },
    hireDate: {
      label: 'تاريخ التعيين',
      minWidth: 100,
      renderHeader: () => (
        <button onClick={() => handleSort('hireDate')} className="flex items-center w-full justify-between hover:text-indigo-600 group focus:outline-none">
          <span>تاريخ التعيين</span><SortIcon column="hireDate" />
        </button>
      ),
      renderCell: (u) => <td className="px-4 py-3 text-slate-600">{u.joinDate || '—'}</td>
    },
    seatNumber: {
      label: 'رقم المقعد',
      minWidth: 120,
      renderHeader: () => (
        <button onClick={() => handleSort('seatNumber')} className="flex items-center w-full justify-between hover:text-indigo-600 group focus:outline-none">
          <span>رقم المقعد</span><SortIcon column="seatNumber" />
        </button>
      ),
      renderCell: (u) => <td className="px-4 py-3 text-slate-600">{u.seatNumber || '—'}</td>
    },
    address: {
      label: 'العنوان',
      minWidth: 150,
      renderHeader: () => (
        <button onClick={() => handleSort('address')} className="flex items-center w-full justify-between hover:text-indigo-600 group focus:outline-none">
          <span>العنوان</span><SortIcon column="address" />
        </button>
      ),
      renderCell: (u) => <td className="px-4 py-3 text-slate-600 max-w-[200px] truncate" title={u.address}>{u.address || '—'}</td>
    },
    maritalStatus: {
      label: 'الحالة الإجتماعية',
      minWidth: 120,
      renderHeader: () => (
        <button onClick={() => handleSort('maritalStatus')} className="flex items-center w-full justify-between hover:text-indigo-600 group focus:outline-none">
          <span>الحالة الإجتماعية</span><SortIcon column="maritalStatus" />
        </button>
      ),
      renderCell: (u) => <td className="px-4 py-3 text-slate-600">{u.maritalStatus || '—'}</td>
    },
    relativePhone: {
      label: 'رقم أحد الأقارب',
      minWidth: 120,
      renderHeader: () => (
        <button onClick={() => handleSort('relativePhone')} className="flex items-center w-full justify-between hover:text-indigo-600 group focus:outline-none">
          <span>رقم أحد الأقارب</span><SortIcon column="relativePhone" />
        </button>
      ),
      renderCell: (u) => <td className="px-4 py-3 text-slate-600">{u.relativePhone || '—'}</td>
    },
    qualifications: {
      label: 'المؤهلات والخبرات',
      minWidth: 180,
      renderHeader: () => (
        <button onClick={() => handleSort('qualifications')} className="flex items-center w-full justify-between hover:text-indigo-600 group focus:outline-none">
          <span>المؤهلات والخبرات</span><SortIcon column="qualifications" />
        </button>
      ),
      renderCell: (u) => <td className="px-4 py-3 text-slate-600 max-w-[200px] truncate" title={u.qualifications}>{u.qualifications || '—'}</td>
    },
    workAgreement: {
      label: 'اتفاقية العمل',
      minWidth: 150,
      renderHeader: () => (
        <button onClick={() => handleSort('workAgreement')} className="flex items-center w-full justify-between hover:text-indigo-600 group focus:outline-none">
          <span>اتفاقية العمل</span><SortIcon column="workAgreement" />
        </button>
      ),
      renderCell: (u) => <td className="px-4 py-3 text-slate-600 max-w-[150px] truncate" title={u.workAgreement}>{u.workAgreement || '—'}</td>
    },
    skills: {
      label: 'المهارات',
      minWidth: 180,
      renderHeader: () => (
        <button onClick={() => handleSort('skills')} className="flex items-center w-full justify-between hover:text-indigo-600 group focus:outline-none">
          <span>المهارات</span><SortIcon column="skills" />
        </button>
      ),
      renderCell: (u) => <td className="px-4 py-3 text-slate-600 max-w-[200px] truncate" title={getSkills(u)}>{getSkills(u)}</td>
    },
    bankData: {
      label: 'البيانات البنكية',
      minWidth: 150,
      renderHeader: () => (
        <button onClick={() => handleSort('bankData')} className="flex items-center w-full justify-between hover:text-indigo-600 group focus:outline-none">
          <span>البيانات البنكية</span><SortIcon column="bankData" />
        </button>
      ),
      renderCell: (u) => <td className="px-4 py-3 text-slate-600">{u.bankName || u.bankAccount ? `${u.bankName || ''} - ${u.bankAccount || ''}` : '—'}</td>
    },
  };

  const handlePrint = () => {
    const printContent = `
      <style>
        @page { size: landscape; }
      </style>
      <div dir="rtl" style="font-family: 'Tajawal', sans-serif; padding: 20px;">
        <h2 style="text-align: center; margin-bottom: 20px;">كشف بيانات الموظفين</h2>
        <table style="width: 100%; border-collapse: collapse; font-size: 11px;" border="1">
          <thead>
            <tr style="background-color: #f8fafc;">
              <th style="padding: 6px;">الرقم الوظيفي</th>
              <th style="padding: 6px;">الإسم الثلاثي</th>
              <th style="padding: 6px;">الفرع</th>
              <th style="padding: 6px;">المسمى الوظيفي</th>
              <th style="padding: 6px;">طبيعة الدوام</th>
              <th style="padding: 6px;">فترة المناوبة</th>
              <th style="padding: 6px;">رقم التواصل</th>
              <th style="padding: 6px;">العنوان</th>
              <th style="padding: 6px;">الحالة الإجتماعية</th>
              <th style="padding: 6px;">المؤهلات والخبرات</th>
              <th style="padding: 6px;">اتفاقية العمل</th>
              <th style="padding: 6px;">المهارات</th>
              <th style="padding: 6px;">البيانات البنكية</th>
            </tr>
          </thead>
          <tbody>
            ${filteredUsers.map(u => `
              <tr>
                <td style="padding: 6px;">${u.employeeId || '—'}</td>
                <td style="padding: 6px;">${u.fullName || u.name || '—'}</td>
                <td style="padding: 6px;">${getBranchName(u.branchId)}</td>
                <td style="padding: 6px;">${u.jobTitle || '—'}</td>
                <td style="padding: 6px;">${u.workNature || '—'}</td>
                <td style="padding: 6px;">${u.shift ? `${u.shift}${u.checkInTime ? ' (' + formatTime12Hour(u.checkInTime) + (u.checkOutTime ? ' - ' + formatTime12Hour(u.checkOutTime) : '') + ')' : ''}${u.shiftNotes ? ' - ' + u.shiftNotes : ''}` : '—'}</td>
                <td style="padding: 6px;">${u.contactNumber || '—'}</td>
                <td style="padding: 6px;">${u.address || '—'}</td>
                <td style="padding: 6px;">${u.maritalStatus || '—'}</td>
                <td style="padding: 6px;">${u.qualificationss || '—'}</td>
                <td style="padding: 6px;">${u.workAgreement || '—'}</td>
                <td style="padding: 6px;">${getSkills(u)}</td>
                <td style="padding: 6px;">${u.bankName || u.bankAccount ? `${u.bankName || ''} - ${u.bankAccount || ''}` : '—'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
    printUtils.printHTML(printContent);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h3 className="text-lg font-bold text-slate-800">كشف بيانات الموظفين</h3>
        
        <div className="flex gap-2">
          <button 
            onClick={exportToCSV}
            className="flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-sm font-bold transition-colors"
          >
            <Download className="w-4 h-4" />
            تصدير Excel
          </button>
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-sm font-bold transition-colors"
          >
            <Printer className="w-4 h-4" />
            طباعة PDF
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4">
          <div className="relative md:col-span-2 xl:col-span-2">
            <Search className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="بحث بالاسم، الرقم الوظيفي، المسمى الوظيفي..."
              className="w-full pl-4 pr-9 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative">
            <MultiSelectFilter
              label="جميع الفروع"
              options={branches.map(b => ({ value: b.id, label: b.name }))}
              selectedValues={selectedBranches}
              onChange={setSelectedBranches}
            />
          </div>
          <div className="relative">
            <MultiSelectFilter
              label="جميع المستويات"
              options={[
                { value: 'Level - 1', label: 'Level - 1' },
                { value: 'Level - 2', label: 'Level - 2' },
                { value: 'Level - 3', label: 'Level - 3' },
                { value: 'Level - 4', label: 'Level - 4' },
                { value: 'Level - 5', label: 'Level - 5' },
              ]}
              selectedValues={selectedLevels}
              onChange={setSelectedLevels}
            />
          </div>
          <div className="relative">
            <MultiSelectFilter
              label="جميع أنواع الدوام"
              options={[
                { value: 'موظف ثابت دوام كامل (Full-Time)', label: 'دوام كامل' },
                { value: 'موظف دوام جزئي/موسمي (Part-Time)', label: 'دوام جزئي' },
                { value: 'موظف احتياطي / مؤقت', label: 'مؤقت' },
                { value: 'موظف عمل عن بعد (Online)', label: 'عمل عن بعد' },
                { value: 'موظف ملغي / مستقيل', label: 'مستقيل' },
              ]}
              selectedValues={selectedWorkNatures}
              onChange={setSelectedWorkNatures}
            />
          </div>
          <div className="relative">
            <MultiSelectFilter
              label="جميع المناوبات"
              options={[
                { value: 'صباحي (Morning)', label: 'صباحي' },
                { value: 'مسائي (Evening)', label: 'مسائي' },
                { value: 'متغير, مرن, هجين', label: 'متغير/مرن' },
              ]}
              selectedValues={selectedShifts}
              onChange={setSelectedShifts}
            />
          </div>
          <div className="relative">
            <MultiSelectFilter
              label="جميع الصلاحيات"
              options={[
                { value: 'admin', label: 'مدير النظام' },
                { value: 'hr', label: 'مدير موارد بشرية' },
                { value: 'staff', label: 'موظف' },
                { value: 'accountant', label: 'محاسب مالي' },
                { value: 'external_support_tech', label: 'فني دعم خارجي' },
                { value: 'external_support_admin', label: 'إداري دعم خارجي' },
                { value: 'temp_visitor', label: 'زائر مؤقت' },
              ]}
              selectedValues={selectedRoles}
              onChange={setSelectedRoles}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4">
          <div className="relative md:col-span-1 xl:col-span-1">
            <MultiSelectFilter
              label="الحالة الاجتماعية"
              options={[
                { value: 'أعزب', label: 'أعزب' },
                { value: 'متزوج', label: 'متزوج' },
              ]}
              selectedValues={selectedMaritalStatuses}
              onChange={setSelectedMaritalStatuses}
            />
          </div>
          <div className="flex md:col-span-2 xl:col-span-5 justify-end">
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-2 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-sm font-bold transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              إعادة تعيين التصفية
            </button>
          </div>
        </div>
      </div>


      <div className="overflow-x-auto rounded-xl border border-slate-200 custom-scrollbar pb-2">
        <table className="w-full text-sm text-right whitespace-nowrap">
          <thead className="bg-slate-50 text-slate-600 font-medium select-none">
            <tr>
              {columnOrder.map(colId => {
                const col = columnDefs[colId];
                if (!col) return null;
                return (
                  <ResizableTh 
                    key={colId}
                    initialWidth={col.initialWidth || 'auto'}
                    minWidth={col.minWidth || 100}
                    draggable
                    onDragStart={(e: React.DragEvent) => {
                      e.dataTransfer.setData('text/plain', colId);
                      setDraggedColId(colId);
                    }}
                    onDragOver={(e: React.DragEvent) => {
                      e.preventDefault();
                      setDragOverColId(colId);
                    }}
                    onDragLeave={() => {
                      if (dragOverColId === colId) setDragOverColId(null);
                    }}
                    onDrop={(e: React.DragEvent) => {
                      e.preventDefault();
                      if (!draggedColId || draggedColId === colId) return;
                      const newOrder = [...columnOrder];
                      const fromIdx = newOrder.indexOf(draggedColId);
                      const toIdx = newOrder.indexOf(colId);
                      if (fromIdx !== -1 && toIdx !== -1) {
                        newOrder.splice(fromIdx, 1);
                        newOrder.splice(toIdx, 0, draggedColId);
                        setColumnOrder(newOrder);
                      }
                      setDraggedColId(null);
                      setDragOverColId(null);
                    }}
                    className={`px-3 py-2 border-b border-slate-200 cursor-move transition-colors ${
                      dragOverColId === colId ? 'bg-indigo-100 border-indigo-400' : 'hover:bg-slate-100'
                    }`}
                  >
                    {col.renderHeader()}
                  </ResizableTh>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredUsers.length > 0 ? (
              filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                  {columnOrder.map(colId => {
                    const col = columnDefs[colId];
                    if (!col) return null;
                    return (
                      <React.Fragment key={colId}>
                        {col.renderCell(user)}
                      </React.Fragment>
                    );
                  })}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columnOrder.length} className="px-4 py-8 text-center text-slate-500">
                  لا توجد بيانات مطابقة للبحث
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
