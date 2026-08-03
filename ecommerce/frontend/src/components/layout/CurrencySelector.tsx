'use client';

import { useState, useRef, useEffect } from 'react';
import { useCurrencyStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Globe } from 'lucide-react';

const CURRENCIES = [
  { code: 'GBP', symbol: '£', rate: 1, name: 'British Pound' },
  { code: 'USD', symbol: '$', rate: 1.27, name: 'US Dollar' },
  { code: 'EUR', symbol: '€', rate: 1.17, name: 'Euro' },
  { code: 'AUD', symbol: 'A$', rate: 1.95, name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', rate: 1.72, name: 'Canadian Dollar' },
  { code: 'LKR', symbol: 'Rs', rate: 385.00, name: 'Sri Lankan Rupee' },
];

export default function CurrencySelector({ iconColor }: { iconColor: string }) {
  const { currency, setCurrency } = useCurrencyStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (code: string, symbol: string, rate: number) => {
    setCurrency(code, symbol, rate);
    setIsOpen(false);
  };

  return (
    <div className="relative hidden md:block" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 p-2 transition-colors hover:text-brand-gold ${iconColor} ${isOpen ? 'text-brand-gold' : ''}`}
        aria-label="Select Currency"
      >
        <Globe strokeWidth={1.5} size={18} />
        <span className="text-xs font-bold">{currency}</span>
        <ChevronDown size={12} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-3 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[110]"
          >
            <div className="p-2">
              <div className="px-4 py-3 mb-1 border-b border-gray-50 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Currency</span>
              </div>
              
              <div className="flex flex-col gap-1 max-h-60 overflow-y-auto custom-scrollbar">
                {CURRENCIES.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => handleSelect(c.code, c.symbol, c.rate)}
                    className={`flex items-center justify-between px-4 py-2.5 rounded-xl transition-all ${
                      currency === c.code 
                        ? 'bg-brand-gold/10 text-brand-gold font-bold' 
                        : 'hover:bg-gray-50 text-gray-700 hover:text-brand-dark'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-5 text-center text-sm">{c.symbol}</span>
                      <span className="text-sm font-medium">{c.code}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
