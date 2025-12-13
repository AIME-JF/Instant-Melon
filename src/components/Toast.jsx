import React, { useEffect } from 'react';
import { Check } from 'lucide-react';

const Toast = ({ message, isVisible, onClose, theme }) => {
    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(onClose, 2000);
            return () => clearTimeout(timer);
        }
    }, [isVisible, onClose]);

    if (!isVisible) return null;

    const isDark = theme === 'dark';
    const bgColor = isDark ? 'bg-zinc-800' : 'bg-white';
    const textColor = isDark ? 'text-white' : 'text-zinc-900';
    const borderColor = isDark ? 'border-white/10' : 'border-black/5';

    return (
        <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-6 py-3 rounded-full shadow-xl border ${bgColor} ${textColor} ${borderColor} animate-fade-in-down`}>
            <Check size={16} className={isDark ? "text-emerald-400" : "text-emerald-600"} />
            <span className="text-sm font-medium tracking-wide">{message}</span>
        </div>
    );
};

export default Toast;
