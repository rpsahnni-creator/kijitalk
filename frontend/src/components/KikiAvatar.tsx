'use client';

import { useId } from 'react';

interface KikiAvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  animated?: boolean;
  online?: boolean;
}

const sizes = {
  sm: 'h-8 w-8',
  md: 'h-12 w-12',
  lg: 'h-16 w-16',
  xl: 'h-24 w-24',
};

export function KikiAvatar({ size = 'sm', className = '', animated = false, online = true }: KikiAvatarProps) {
  // Unique gradient ids per instance — duplicate SVG ids break rendering when
  // several avatars are on screen and one of them is hidden.
  const uid = useId().replace(/:/g, '');
  const hair = `kikiHair-${uid}`;
  const skin = `kikiSkin-${uid}`;

  return (
    <div
      className={`relative shrink-0 ${sizes[size]} ${className} ${animated ? 'animate-pulse' : ''}`}
      role="img"
      aria-label="Kiki"
    >
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-brand-500 via-accent-400 to-leaf-700 p-[2px] shadow-md shadow-brand-900/10">
        <div className="relative h-full w-full overflow-hidden rounded-full bg-gradient-to-br from-accent-50 to-leaf-50">
          <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
            <defs>
              <linearGradient id={hair} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f02a52" />
                <stop offset="100%" stopColor="#990f2e" />
              </linearGradient>
              <linearGradient id={skin} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ffe9c7" />
                <stop offset="100%" stopColor="#ffd59a" />
              </linearGradient>
            </defs>
            <ellipse cx="50" cy="58" rx="32" ry="30" fill={`url(#${skin})`} />
            <path
              d="M18 42 C22 18, 78 18, 82 42 C84 28, 72 12, 50 12 C28 12, 16 28, 18 42 Z"
              fill={`url(#${hair})`}
            />
            <circle cx="38" cy="54" r="4" fill="#1e293b" />
            <circle cx="62" cy="54" r="4" fill="#1e293b" />
            <circle cx="39" cy="53" r="1.5" fill="white" />
            <circle cx="63" cy="53" r="1.5" fill="white" />
            <path d="M42 66 Q50 74 58 66" stroke="#990f2e" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <ellipse cx="32" cy="62" rx="5" ry="3" fill="#ff91a7" opacity="0.55" />
            <ellipse cx="68" cy="62" rx="5" ry="3" fill="#ff91a7" opacity="0.55" />
            <circle cx="78" cy="22" r="3" fill="#ffff00" opacity="0.95" />
            <circle cx="22" cy="28" r="2" fill="#006400" opacity="0.8" />
          </svg>
        </div>
      </div>
      {online && (
        <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-success-500 ring-2 ring-white dark:ring-slate-900" />
      )}
    </div>
  );
}
