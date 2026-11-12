import React, { useState, useRef, useEffect } from 'react';
import { Customer, Invoice } from '../types';
import { ChevronDown } from 'lucide-react';

interface Props {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  customers: Customer[];
  invoices: Invoice[];
  className?: string;
}

export const CustomerSearchableCombobox = ({ placeholder, value, onChange, customers, invoices, className }: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value === 'all' || value === '') {
        setSearchTerm('');
    } else {
        const selectedCustomer = customers.find(c => c.id === value);
        if (selectedCustomer) {
            setSearchTerm(selectedCustomer.name);
        }
    }
  }, [value, customers]);

  const filteredCustomers = customers.filter(customer => 
      customer.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const calculateCustomerTotal = (customerId: string) => {
    return invoices
      .filter(inv => inv.customerId === customerId)
      .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
  };

  return (
    <div className={`relative ${className}`} ref={wrapperRef}>
      <div className="relative w-full">
        <input
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs focus:ring-2 focus:ring-teal-500 outline-none"
        />
        <div className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto min-w-max">
          <button
            className="w-full text-right px-3 py-1.5 text-xs hover:bg-slate-100 block font-bold text-slate-700"
            onClick={() => {
              onChange('all');
              setSearchTerm('');
              setIsOpen(false);
            }}
          >
            كافة العملاء
          </button>
          {filteredCustomers.map((customer) => {
             const totalAmount = calculateCustomerTotal(customer.id);
             return (
                <button
                  key={customer.id}
                  className="w-full text-right px-3 py-1.5 text-xs hover:bg-slate-100 flex items-center justify-between gap-4"
                  onClick={() => {
                    onChange(customer.id);
                    setSearchTerm(customer.name);
                    setIsOpen(false);
                  }}
                >
                  <span className="truncate">{customer.name}</span>
                  <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-1 rounded-full whitespace-nowrap">
                    {totalAmount.toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} د.ك
                  </span>
                </button>
              );
          })}
        </div>
      )}
    </div>
  );
};
