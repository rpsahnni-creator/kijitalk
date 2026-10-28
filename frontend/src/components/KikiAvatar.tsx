'use client';

interface KikiAvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  animated?: boolean;
}

const sizes = {
  sm: 'h-8 w-8',
  md: 'h-12 w-12',
  lg: 'h-16 w-16',
  xl: 'h-24 w-24',
};

export function KikiAvatar({ size = 'sm', className = '', animated = false }: KikiAvatarProps) {
  return (
    <div
      className={`relative shrink-0 ${sizes[size]} ${className} ${animated ? 'animate-pulse' : ''}`}
      aria-label="Kiki"
    >
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-brand-400 via-accent-400 to-brand-600 p-[2px] shadow-lg shadow-brand-300/40">
        <div className="relative h-full w-full overflow-hidden rounded-full bg-gradient-to-br from-brand-50 to-accent-50">
          <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
            <defs>
              <linearGradient id="kikiHair" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#bf2c5c" />
                <stop offset="100%" stopColor="#741b38" />
              </linearGradient>
              <linearGradient id="kikiSkin" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#fde68a" />
                <stop offset="100%" stopColor="#fdc403" />
              </linearGradient>
            </defs>
            <ellipse cx="50" cy="58" rx="32" ry="30" fill="url(#kikiSkin)" />
            <path
              d="M18 42 C22 18, 78 18, 82 42 C84 28, 72 12, 50 12 C28 12, 16 28, 18 42 Z"
              fill="url(#kikiHair)"
            />
            <circle cx="38" cy="54" r="4" fill="#1e293b" />
            <circle cx="62" cy="54" r="4" fill="#1e293b" />
            <circle cx="39" cy="53" r="1.5" fill="white" />
            <circle cx="63" cy="53" r="1.5" fill="white" />
            <path d="M42 66 Q50 74 58 66" stroke="#741b38" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <ellipse cx="32" cy="62" rx="5" ry="3" fill="#ffe58a" opacity="0.7" />
            <ellipse cx="68" cy="62" rx="5" ry="3" fill="#ffe58a" opacity="0.7" />
            <circle cx="78" cy="22" r="3" fill="#fdc403" opacity="0.9" />
            <circle cx="22" cy="28" r="2" fill="#e283a2" opacity="0.8" />
          </svg>
        </div>
      </div>
      <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-brand-400 ring-2 ring-white">
        <span className="h-1.5 w-1.5 rounded-full bg-white" />
      </span>
    </div>
  );
}
