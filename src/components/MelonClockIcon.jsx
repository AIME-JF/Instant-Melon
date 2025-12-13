import React from 'react';

const MelonClockIcon = ({ size = 24, className = "", isSpinning = false }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="7" strokeOpacity="0.2" />
        <path d="M12 7V7.01" strokeWidth="3" />
        <path d="M17 12V12.01" strokeWidth="3" />
        <path d="M12 17V17.01" strokeWidth="3" />
        <path d="M7 12V12.01" strokeWidth="3" />
        <g className={isSpinning ? "animate-clock-spin" : ""} style={{ transformOrigin: "12px 12px" }}>
            <path d="M12 12L12 9" />
            <path d="M12 12L14.5 14.5" />
        </g>
    </svg>
);

export default MelonClockIcon;
