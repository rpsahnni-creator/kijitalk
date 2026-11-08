/**
 * Colourful illustrated icons for every KijiTalk feature, drawn in the brand
 * palette: Crimson (#DC143C), DarkGreen (#006400) and Yellow (#FFFF00).
 * Each icon is a 64×64 flat illustration with a dark outline and soft shadow.
 */

export type FeatureIconName =
  | 'home'
  | 'progress'
  | 'chat'
  | 'call'
  | 'voice'
  | 'roleplay'
  | 'debate'
  | 'lessons'
  | 'courses'
  | 'premium'
  | 'settings'
  | 'profile'
  | 'leaderboard'
  | 'badges'
  | 'idea'
  | 'streak'
  | 'calendar'
  | 'help';

const C = '#DC143C'; // crimson
const CD = '#990F2E'; // deep crimson
const CL = '#FF91A7'; // light crimson
const G = '#006400'; // dark green
const GM = '#22A127'; // mid green
const GL = '#B2EAB3'; // light green
const Y = '#FFFF00'; // yellow
const YD = '#E5E500'; // deep yellow
const YL = '#FFFF99'; // light yellow
const O = '#1F2937'; // outline
const W = '#FFFFFF';
const SKIN = '#FFE0B8';

const stroke = { stroke: O, strokeWidth: 2, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };

function Shadow() {
  return <ellipse cx="32" cy="58" rx="20" ry="3" fill="#000" opacity="0.1" />;
}

const ICONS: Record<FeatureIconName, React.ReactNode> = {
  home: (
    <>
      <Shadow />
      <rect x="42" y="13" width="6" height="12" fill={CD} {...stroke} />
      <rect x="15" y="28" width="34" height="26" fill={W} {...stroke} />
      <path d="M9 31 L32 11 L55 31 Z" fill={C} {...stroke} />
      <rect x="27" y="38" width="10" height="16" rx="1.5" fill={G} {...stroke} />
      <circle cx="34.5" cy="46.5" r="1.2" fill={Y} />
      <rect x="18.5" y="33" width="7" height="7" fill={Y} {...stroke} />
      <rect x="39" y="33" width="7" height="7" fill={Y} {...stroke} />
    </>
  ),
  progress: (
    <>
      <Shadow />
      <rect x="8" y="10" width="48" height="42" rx="5" fill={W} {...stroke} />
      <rect x="15" y="34" width="8" height="12" rx="1.5" fill={Y} {...stroke} />
      <rect x="28" y="26" width="8" height="20" rx="1.5" fill={GM} {...stroke} />
      <rect x="41" y="18" width="8" height="28" rx="1.5" fill={C} {...stroke} />
      <path d="M14 28 L26 20 L36 23 L50 12" fill="none" stroke={G} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M44 11.5 L50 12 L49.5 18" fill="none" stroke={G} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  chat: (
    <>
      <Shadow />
      <path d="M8 14 a6 6 0 0 1 6 -6 h24 a6 6 0 0 1 6 6 v14 a6 6 0 0 1 -6 6 h-18 l-8 7 v-7 a6 6 0 0 1 -4 -6 Z" fill={C} {...stroke} />
      <circle cx="18" cy="21" r="2.2" fill={W} />
      <circle cx="26" cy="21" r="2.2" fill={W} />
      <circle cx="34" cy="21" r="2.2" fill={W} />
      <path d="M24 32 a5 5 0 0 1 5 -5 h22 a5 5 0 0 1 5 5 v12 a5 5 0 0 1 -5 5 h-1 v7 l-8 -7 h-13 a5 5 0 0 1 -5 -5 Z" fill={Y} {...stroke} />
      <path d="M30 36 h18 M30 42 h12" stroke={G} strokeWidth="2.5" strokeLinecap="round" />
    </>
  ),
  call: (
    <>
      <Shadow />
      <rect x="18" y="5" width="26" height="50" rx="6" fill={O} />
      <rect x="21" y="11" width="20" height="36" rx="2.5" fill={GL} />
      <rect x="27" y="7.5" width="8" height="1.8" rx="0.9" fill="#475569" />
      <circle cx="31" cy="51" r="1.8" fill="#475569" />
      <circle cx="31" cy="34" r="7" fill={G} />
      <path d="M27.8 31 c0.4 2.8 2.4 5 5.2 5.6 l1.2 -1.4 l2 1 l-0.6 2.2 c-5 0.4 -9.6 -4 -9.4 -9 l2.2 -0.6 l1 2 Z" fill={W} />
      <rect x="25" y="17" width="12" height="3" rx="1.5" fill={C} />
      <path d="M48 22 a10 10 0 0 1 0 14 M52 18 a16 16 0 0 1 0 22" fill="none" stroke={C} strokeWidth="2.8" strokeLinecap="round" />
    </>
  ),
  voice: (
    <>
      <Shadow />
      <path d="M17 26 a15 15 0 0 0 30 0" fill="none" stroke={O} strokeWidth="3" strokeLinecap="round" />
      <path d="M32 41 v10" stroke={O} strokeWidth="3" strokeLinecap="round" />
      <rect x="21" y="51" width="22" height="5" rx="2.5" fill={G} {...stroke} />
      <rect x="23" y="6" width="18" height="30" rx="9" fill={C} {...stroke} />
      <path d="M26 15 h12 M26 20 h12 M26 25 h12" stroke={W} strokeWidth="1.8" strokeLinecap="round" opacity="0.85" />
      <path d="M10 18 v8 M6 20 v4 M54 18 v8 M58 20 v4" stroke={YD} strokeWidth="2.8" strokeLinecap="round" />
    </>
  ),
  roleplay: (
    <>
      <Shadow />
      <path d="M6 56 v-6 a12 12 0 0 1 24 0 v6 Z" fill={C} {...stroke} />
      <circle cx="18" cy="27" r="8" fill={SKIN} {...stroke} />
      <path d="M10 25 a8 8 0 0 1 16 -2 q-6 -1 -9 -5 q-3 5 -7 7 Z" fill={CD} />
      <path d="M34 56 v-6 a12 12 0 0 1 24 0 v6 Z" fill={G} {...stroke} />
      <circle cx="46" cy="27" r="8" fill={SKIN} {...stroke} />
      <path d="M38 24 a8 8 0 0 1 16 0 q-8 0 -16 0 Z" fill={O} />
      <path d="M24 5 h16 a4 4 0 0 1 4 4 v6 a4 4 0 0 1 -4 4 h-6 l-3 3 v-3 h-7 a4 4 0 0 1 -4 -4 v-6 a4 4 0 0 1 4 -4 Z" fill={Y} {...stroke} />
      <path d="M27 12 h10" stroke={G} strokeWidth="2.2" strokeLinecap="round" />
    </>
  ),
  debate: (
    <>
      <Shadow />
      <path d="M14 34 h36 l-3 22 h-30 Z" fill={C} {...stroke} />
      <rect x="10" y="30" width="44" height="6" rx="2" fill={CD} {...stroke} />
      <circle cx="32" cy="45" r="5" fill={Y} {...stroke} />
      <path d="M32 42.5 l0.9 1.8 l2 0.3 l-1.45 1.4 l0.35 2 l-1.8 -0.95 l-1.8 0.95 l0.35 -2 l-1.45 -1.4 l2 -0.3 Z" fill={C} />
      <path d="M5 8 h18 a3 3 0 0 1 3 3 v8 a3 3 0 0 1 -3 3 h-10 l-4 4 v-4 h-4 a3 3 0 0 1 -3 -3 v-8 a3 3 0 0 1 3 -3 Z" fill={G} {...stroke} />
      <path d="M41 8 h18 a3 3 0 0 1 3 3 v8 a3 3 0 0 1 -3 3 h-4 v4 l-4 -4 h-10 a3 3 0 0 1 -3 -3 v-8 a3 3 0 0 1 3 -3 Z" fill={Y} {...stroke} />
      <path d="M33 6 l-5 10 h5 l-3 9 l8 -12 h-5 l3 -7 Z" fill={C} {...stroke} strokeWidth="1.5" />
    </>
  ),
  lessons: (
    <>
      <Shadow />
      <path d="M5 18 v34 q14 -4 27 2 q13 -6 27 -2 v-34 Z" fill={C} {...stroke} />
      <path d="M8 14 q12 -3 24 4 v34 q-12 -6 -24 -3 Z" fill={W} {...stroke} />
      <path d="M56 14 q-12 -3 -24 4 v34 q12 -6 24 -3 Z" fill={W} {...stroke} />
      <path d="M13 22 q7 -1 14 2 M13 29 q7 -1 14 2 M13 36 q7 -1 14 2" fill="none" stroke={G} strokeWidth="2" strokeLinecap="round" />
      <path d="M37 24 q7 -3 14 -2 M37 31 q7 -3 14 -2" fill="none" stroke={YD} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M44 12 v14 l3 -2.5 l3 2.5 v-14.5" fill={C} {...stroke} strokeWidth="1.6" />
    </>
  ),
  courses: (
    <>
      <Shadow />
      <rect x="12" y="44" width="40" height="7" rx="1.5" fill={C} {...stroke} />
      <rect x="15" y="37" width="34" height="7" rx="1.5" fill={Y} {...stroke} />
      <path d="M19 26 v9 q13 7 26 0 v-9" fill={G} {...stroke} />
      <path d="M32 8 L58 19 L32 30 L6 19 Z" fill={GM} {...stroke} />
      <path d="M32 19 L52 23 V33" fill="none" stroke={Y} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="52" cy="35" r="2.6" fill={Y} {...stroke} strokeWidth="1.5" />
      <circle cx="32" cy="19" r="2" fill={O} />
    </>
  ),
  premium: (
    <>
      <Shadow />
      <path d="M9 44 L13 18 L24 31 L32 12 L40 31 L51 18 L55 44 Z" fill={Y} {...stroke} />
      <rect x="9" y="44" width="46" height="9" rx="2.5" fill={C} {...stroke} />
      <circle cx="13" cy="17" r="3" fill={C} {...stroke} strokeWidth="1.6" />
      <circle cx="32" cy="11" r="3" fill={C} {...stroke} strokeWidth="1.6" />
      <circle cx="51" cy="17" r="3" fill={C} {...stroke} strokeWidth="1.6" />
      <path d="M32 31 l4 5 l-4 5 l-4 -5 Z" fill={G} {...stroke} strokeWidth="1.6" />
      <circle cx="19" cy="48.5" r="1.8" fill={Y} />
      <circle cx="45" cy="48.5" r="1.8" fill={Y} />
    </>
  ),
  settings: (
    <>
      <Shadow />
      <g transform="translate(46 16)">
        {[0, 60, 120, 180, 240, 300].map((a) => (
          <rect key={a} x="-2.5" y="-10" width="5" height="6" rx="1" fill={YD} stroke={O} strokeWidth="1.5" transform={`rotate(${a})`} />
        ))}
        <circle r="7" fill={Y} stroke={O} strokeWidth="1.5" />
        <circle r="2.6" fill={W} stroke={O} strokeWidth="1.5" />
      </g>
      <g transform="translate(28 36)">
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
          <rect key={a} x="-4" y="-21" width="8" height="9" rx="1.8" fill={G} stroke={O} strokeWidth="2" transform={`rotate(${a})`} />
        ))}
        <circle r="15" fill={G} stroke={O} strokeWidth="2" />
        <circle r="10" fill={GM} />
        <circle r="5.5" fill={W} stroke={O} strokeWidth="2" />
      </g>
    </>
  ),
  profile: (
    <>
      <Shadow />
      <rect x="7" y="12" width="50" height="40" rx="6" fill={W} {...stroke} />
      <path d="M7 18 a6 6 0 0 1 6 -6 h38 a6 6 0 0 1 6 6 v4 h-50 Z" fill={C} {...stroke} />
      <rect x="27" y="8" width="10" height="8" rx="2" fill={Y} {...stroke} />
      <circle cx="21" cy="33" r="6" fill={SKIN} {...stroke} />
      <path d="M12 47 a9 7 0 0 1 18 0 Z" fill={G} {...stroke} />
      <path d="M36 31 h14 M36 38 h14 M36 45 h9" stroke={O} strokeWidth="2.4" strokeLinecap="round" opacity="0.75" />
    </>
  ),
  leaderboard: (
    <>
      <Shadow />
      <path d="M18 10 h28 v12 a14 14 0 0 1 -28 0 Z" fill={Y} {...stroke} />
      <path d="M18 14 h-6 a6 6 0 0 0 7 10 M46 14 h6 a6 6 0 0 1 -7 10" fill="none" {...stroke} strokeWidth="2.5" />
      <path d="M28 35 h8 v8 h-8 Z" fill={YD} {...stroke} />
      <rect x="18" y="43" width="28" height="11" rx="2" fill={C} {...stroke} />
      <rect x="25" y="46.5" width="14" height="4" rx="1" fill={Y} />
      <path d="M32 14 l2 4 l4.4 0.6 l-3.2 3.1 l0.8 4.4 l-4 -2.1 l-4 2.1 l0.8 -4.4 l-3.2 -3.1 l4.4 -0.6 Z" fill={G} />
    </>
  ),
  badges: (
    <>
      <Shadow />
      <path d="M20 4 h9 l7 18 h-9 Z" fill={C} {...stroke} />
      <path d="M44 4 h-9 l-7 18 h9 Z" fill={G} {...stroke} />
      <circle cx="32" cy="38" r="16" fill={Y} {...stroke} />
      <circle cx="32" cy="38" r="11" fill="none" stroke={YD} strokeWidth="2.5" />
      <path d="M32 29 l2.7 5.4 l6 0.9 l-4.35 4.2 l1 6 l-5.35 -2.8 l-5.35 2.8 l1 -6 l-4.35 -4.2 l6 -0.9 Z" fill={C} {...stroke} strokeWidth="1.5" />
    </>
  ),
  idea: (
    <>
      <Shadow />
      <path d="M32 8 a16 16 0 0 1 9 29 v6 h-18 v-6 a16 16 0 0 1 9 -29 Z" fill={Y} {...stroke} />
      <path d="M27 30 q5 -8 10 0" fill="none" stroke={YD} strokeWidth="2.5" strokeLinecap="round" />
      <rect x="23" y="43" width="18" height="5" rx="1.5" fill={G} {...stroke} />
      <rect x="25" y="48" width="14" height="5" rx="2" fill={GM} {...stroke} />
      <path d="M8 22 h5 M51 22 h5 M13 9 l4 4 M51 9 l-4 4" stroke={C} strokeWidth="2.8" strokeLinecap="round" />
    </>
  ),
  streak: (
    <>
      <Shadow />
      <path d="M32 5 c4 10 16 16 16 31 a16 16 0 0 1 -32 0 c0 -8 5 -12 7 -18 c3 6 5 7 7 7 c0 -7 -2 -12 2 -20 Z" fill={C} {...stroke} />
      <path d="M32 26 c3 6 9 9 9 16 a9 9 0 0 1 -18 0 c0 -5 3 -6 5 -10 c1 3 3 4 4 4 c0 -3 -1 -6 0 -10 Z" fill={Y} />
      <ellipse cx="32" cy="46" rx="3.5" ry="4" fill={W} opacity="0.85" />
    </>
  ),
  calendar: (
    <>
      <Shadow />
      <rect x="8" y="12" width="48" height="42" rx="6" fill={W} {...stroke} />
      <path d="M8 18 a6 6 0 0 1 6 -6 h36 a6 6 0 0 1 6 6 v6 h-48 Z" fill={C} {...stroke} />
      <path d="M20 7 v10 M44 7 v10" stroke={O} strokeWidth="3" strokeLinecap="round" />
      {[0, 1, 2, 3].flatMap((col) =>
        [0, 1].map((row) => (
          <rect
            key={`${col}-${row}`}
            x={14 + col * 10}
            y={30 + row * 10}
            width="7"
            height="6"
            rx="1.5"
            fill={col === 2 && row === 0 ? Y : row === 1 && col === 1 ? GM : '#E2E8F0'}
          />
        ))
      )}
      <path d="M45.5 42 l2 2 l4 -4.5" fill="none" stroke={G} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  help: (
    <>
      <Shadow />
      <circle cx="32" cy="32" r="22" fill={W} {...stroke} />
      <path d="M32 10 a22 22 0 0 1 15.6 6.4 l-7.1 7.1 a12 12 0 0 0 -8.5 -3.5 Z" fill={C} />
      <path d="M54 32 a22 22 0 0 1 -6.4 15.6 l-7.1 -7.1 a12 12 0 0 0 3.5 -8.5 Z" fill={C} />
      <path d="M32 54 a22 22 0 0 1 -15.6 -6.4 l7.1 -7.1 a12 12 0 0 0 8.5 3.5 Z" fill={C} />
      <path d="M10 32 a22 22 0 0 1 6.4 -15.6 l7.1 7.1 a12 12 0 0 0 -3.5 8.5 Z" fill={C} />
      <circle cx="32" cy="32" r="22" fill="none" {...stroke} />
      <circle cx="32" cy="32" r="12" fill={YL} {...stroke} />
      <path d="M28.5 29 a3.5 3.5 0 1 1 5 3.2 c-1 0.5 -1.5 1.2 -1.5 2.3" fill="none" stroke={G} strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="32" cy="38.5" r="1.4" fill={G} />
    </>
  ),
};

export function FeatureIcon({
  name,
  size = 48,
  className = '',
  title,
}: {
  name: FeatureIconName;
  size?: number;
  className?: string;
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={`shrink-0 ${className}`}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {ICONS[name]}
    </svg>
  );
}
