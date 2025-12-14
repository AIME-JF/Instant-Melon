import React, { useEffect } from 'react';
import { Check } from 'lucide-react';

const Toast = ({ message, isVisible, onClose, theme, actionLabel, onAction }) => {
    useEffect(() => {
        if (isVisible) {
            const duration = actionLabel ? 4000 : 2000;
            const timer = setTimeout(onClose, duration);
            return () => clearTimeout(timer);
        }
    }, [isVisible, onClose, actionLabel]);

    if (!isVisible) return null;

    const isDark = theme === 'dark';
    const bgColor = isDark ? 'bg-zinc-800' : 'bg-white';
    const textColor = isDark ? 'text-white' : 'text-zinc-900';
    const borderColor = isDark ? 'border-white/10' : 'border-black/5';

    return (
        <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-3 rounded-full shadow-xl border ${bgColor} ${textColor} ${borderColor} animate-fade-in-down`}>
            <Check size={16} className={isDark ? "text-emerald-400" : "text-emerald-600"} />
            <span className="text-sm font-medium tracking-wide">{message}</span>
            {actionLabel && onAction && (
                <button
                    onClick={() => {
                        onAction();
                        onClose();
                    }}
                    className={`ml-3 px-4 py-1.5 rounded-full text-[10px] font-bold tracking-[0.1em] transition-all shadow-md active:scale-95 ${isDark ? 'bg-[#ebe8e0] text-[#1c1b1a] hover:bg-[#ffffff]' : 'bg-[#3e3c38] text-[#f2f0e9] hover:bg-[#2b2a28]'}`}
                >
                    {actionLabel}
                </button>
            )}
        </div>
    );
};

export default Toast;
