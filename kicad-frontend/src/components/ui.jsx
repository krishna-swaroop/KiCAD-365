import React, { useEffect } from 'react';
import { AlertCircle, CheckCircle2, Terminal } from 'lucide-react';

export const Button = ({ children, onClick, disabled, className = "", variant = "primary" }) => {
    const baseStyle = "px-4 py-3 text-xs font-bold uppercase tracking-wider border transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-mono select-none sharp-corners";
    const variants = {
        primary: "bg-black text-white border-black hover:bg-white hover:text-black active:translate-y-0.5",
        secondary: "bg-white text-black border-black hover:bg-black hover:text-white active:translate-y-0.5",
        ghost: "border-transparent hover:bg-gray-100 text-gray-600",
        danger: "bg-white text-red-600 border-red-600 hover:bg-red-600 hover:text-white active:translate-y-0.5"
    };
    return (
        <button onClick={onClick} disabled={disabled} className={`${baseStyle} ${variants[variant]} ${className}`}>
            {children}
        </button>
    );
};

export const Input = ({ value, onChange, placeholder, disabled }) => (
    <div className="relative w-full">
        <input
            type="text"
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full bg-white border border-black p-3 pr-10 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-black placeholder-gray-400 disabled:bg-gray-50"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <Terminal size={14} className="text-gray-400" />
        </div>
    </div>
);

export const SectionHeader = ({ title, icon: Icon, rightElement }) => (
    <div className="flex items-center justify-between border-b border-black pb-2 mb-6">
        <div className="flex items-center gap-2">
            {Icon && <Icon size={16} />}
            <h2 className="text-sm font-bold uppercase tracking-widest font-mono">{title}</h2>
        </div>
        {rightElement}
    </div>
);

export const Toast = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 5000);
        return () => clearTimeout(timer);
    }, [onClose]);
    const bg = type === 'error' ? 'bg-white border-red-600 text-red-600' : 'bg-white border-black text-black';
    const Icon = type === 'error' ? AlertCircle : CheckCircle2;
    return (
        <div className={`fixed bottom-6 right-6 p-4 border-2 flex items-center gap-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] max-w-md animate-slide-in font-mono z-50 ${bg}`}>
            <Icon size={18} />
            <span className="text-xs font-bold uppercase">{message}</span>
        </div>
    );
};
