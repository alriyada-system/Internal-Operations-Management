import React, { useState, useRef, useEffect, useMemo } from 'react';
import { X, Check, ChevronDown, Search } from 'lucide-react';

export interface DropdownOption {
  label: string;
  value: string;
}

interface Props {
  placeholder: string;
  selectedValues: string[];
  onChange: (values: string[]) => void;
  options: (string | DropdownOption)[];
  className?: string;
}

export const SearchableMultiSelectDropdown = ({ 
  placeholder, 
  selectedValues = [], 
  onChange, 
  options = [], 
  className = '' 
}: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Normalize all options to { label, value }
  const normalizedOptions: DropdownOption[] = useMemo(() => {
    return options.map(opt => {
      if (typeof opt === 'string') {
        return { label: opt, value: opt };
      }
      return opt;
    });
  }, [options]);

  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return normalizedOptions;
    const term = searchTerm.toLowerCase();
    return normalizedOptions.filter(opt => 
      opt.label.toLowerCase().includes(term) || opt.value.toLowerCase().includes(term)
    );
  }, [normalizedOptions, searchTerm]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleOption = (val: string) => {
    if (selectedValues.includes(val)) {
      onChange(selectedValues.filter(v => v !== val));
    } else {
      onChange([...selectedValues, val]);
    }
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  // Find label for a given value
  const getLabelForValue = (val: string) => {
    const found = normalizedOptions.find(o => o.value === val);
    return found ? found.label : val;
  };

  return (
    <div className={`relative select-none text-right ${className}`} ref={wrapperRef} dir="rtl">
      {/* Trigger Box */}
      <div 
        className="w-full bg-slate-50 border border-slate-200/90 hover:border-slate-300 rounded-xl px-2.5 py-1.5 text-xs focus-within:ring-2 focus-within:ring-teal-500/20 focus-within:border-teal-500 outline-none cursor-pointer min-h-[34px] flex items-center justify-between transition-all"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            setTimeout(() => inputRef.current?.focus(), 50);
          }
        }}
      >
        <div className="flex flex-wrap items-center gap-1 flex-1 overflow-hidden">
          {selectedValues.length === 0 ? (
            <span className="text-slate-400 font-bold truncate text-[11px]">{placeholder}</span>
          ) : selectedValues.length <= 2 ? (
            selectedValues.map(value => (
              <span 
                key={value} 
                className="bg-teal-50 text-teal-800 border border-teal-200/70 text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1 shrink-0 max-w-[120px] truncate"
                title={getLabelForValue(value)}
              >
                <span className="truncate">{getLabelForValue(value)}</span>
                <button 
                  type="button"
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    handleToggleOption(value); 
                  }}
                  className="hover:text-rose-600 transition-colors cursor-pointer shrink-0"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            ))
          ) : (
            <div className="flex items-center gap-1">
              <span className="bg-teal-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-2xs">
                {selectedValues.length} محددة
              </span>
              <button 
                type="button"
                onClick={handleClearAll}
                className="text-slate-400 hover:text-rose-600 text-[10px] font-bold p-0.5 transition-colors cursor-pointer"
                title="مسح كافة التحديدات"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 text-slate-400 mr-1 shrink-0 pointer-events-none">
          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180 text-teal-600' : ''}`} />
        </div>
      </div>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute z-50 w-full min-w-[200px] mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-64 overflow-hidden flex flex-col text-right animate-in fade-in zoom-in-95 duration-100">
          {/* Search bar inside popover */}
          <div className="p-2 border-b border-slate-100 bg-slate-50/50 flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              placeholder="اكتب للبحث السريع..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-transparent text-xs font-bold text-slate-700 outline-none placeholder:text-slate-400"
            />
            {searchTerm && (
              <button 
                type="button"
                onClick={() => setSearchTerm('')} 
                className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Quick actions (Select all / Clear) */}
          <div className="px-2.5 py-1 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-500">
            <button
              type="button"
              onClick={() => {
                const allValues = normalizedOptions.map(o => o.value);
                onChange(allValues);
              }}
              className="text-teal-600 hover:underline cursor-pointer"
            >
              تحديد الكل
            </button>
            <button
              type="button"
              onClick={() => onChange([])}
              className="text-slate-500 hover:text-rose-600 cursor-pointer"
            >
              مسح ({selectedValues.length})
            </button>
          </div>

          {/* Options list with Checkboxes */}
          <div className="overflow-y-auto max-h-48 divide-y divide-slate-50 p-1">
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-center text-[11px] text-slate-400 font-bold">
                لا توجد نتائج مطابقة للبحث
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = selectedValues.includes(opt.value);
                return (
                  <div
                    key={opt.value}
                    onClick={() => handleToggleOption(opt.value)}
                    className={`w-full text-right px-2.5 py-2 text-xs font-bold rounded-lg cursor-pointer flex items-center justify-between transition-colors ${
                      isSelected 
                        ? 'bg-teal-50/80 text-teal-900 font-black' 
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}} // controlled via container click
                        className="w-3.5 h-3.5 rounded text-teal-600 focus:ring-teal-500 border-slate-300 pointer-events-none cursor-pointer"
                      />
                      <span className="truncate">{opt.label}</span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-teal-600 shrink-0" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
