import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export default function AdminSelect({
    value,
    onChange,
    options,
    placeholder = 'Select option',
    className = ''
}) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(opt => opt.value === value);
    const isFiltered = value !== '';

    return (
        <div ref={containerRef} className={`relative inline-block text-left ${className}`}>
            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center justify-between gap-3 px-3 py-2.5 min-w-[130px] w-full rounded-xl border-1 text-sm font-medium transition-all outline-none select-none ${isFiltered
                    ? 'bg-blue-50/80 border-blue-200 text-blue-700 hover:bg-blue-100/70 hover:border-blue-300'
                    : 'bg-slate-50 border-slate-200/90 text-slate-700 hover:bg-white hover:border-blue-500'
                    }`}
            >
                <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
                <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${isFiltered ? 'text-blue-600' : 'text-gray-400'} ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute left-0 right-auto mt-1.5 min-w-full w-max bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="max-h-56 overflow-y-auto hide-scrollbar">
                        {options.map((option) => {
                            const isSelected = value === option.value;
                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => {
                                        onChange(option.value);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full flex items-center justify-between gap-3 px-3.5 py-2 text-[13px] text-left transition-colors ${isSelected
                                        ? 'bg-blue-50/80 text-blue-700 font-semibold'
                                        : 'text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    <span className="whitespace-nowrap">{option.label}</span>
                                    {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
