// SVG icon components — moved out of App.jsx unchanged.
import React from 'react';

export const Upload = ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
);
export const X = ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
);
export const Trash2 = ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
        <line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>
    </svg>
);
export const Home = ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
);
export const Plus = ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
);
export const Edit = ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
);
export const Settings = ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <polyline points="6 9 12 15 18 9"/>
    </svg>
);
export const Download = ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
);
export const CameraIcon = ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
        <circle cx="12" cy="13" r="4"/>
    </svg>
);
export const ClipboardIcon = ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
    </svg>
);

// Filled status icons for the post-trade review reflection headers. `color` sets the fill.
export const CheckCircleIcon = ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="11" fill={color}/>
        <polyline points="7 12.5 10.5 16 17 8.5" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);
export const XCircleIcon = ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="11" fill={color}/>
        <line x1="8" y1="8" x2="16" y2="16" stroke="#fff" strokeWidth="2.6" strokeLinecap="round"/>
        <line x1="16" y1="8" x2="8" y2="16" stroke="#fff" strokeWidth="2.6" strokeLinecap="round"/>
    </svg>
);
export const LightbulbIcon = ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 2a7 7 0 0 0-4 12.7c.7.5 1 1.2 1 2V18h6v-1.3c0-.8.3-1.5 1-2A7 7 0 0 0 12 2z" fill={color}/>
        <path d="M9.5 21h5" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
);
