import { useId } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, LinearGradient, Path, Stop } from 'react-native-svg';

/** Kiki, the AI tutor — same character as the web app, in the crimson/green/yellow palette. */
export function KikiFace({ size = 48 }: { size?: number }) {
  // Unique gradient ids so several avatars on one screen don't clash on web.
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const hair = `kikiHair${uid}`;
  const skin = `kikiSkin${uid}`;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 2,
        borderColor: '#ffff00',
        overflow: 'hidden',
        backgroundColor: '#ffffe6',
      }}
      accessibilityLabel="Kiki"
    >
      <Svg viewBox="0 0 100 100" width="100%" height="100%">
        <Defs>
          <LinearGradient id={hair} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#f02a52" />
            <Stop offset="1" stopColor="#990f2e" />
          </LinearGradient>
          <LinearGradient id={skin} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#ffe9c7" />
            <Stop offset="1" stopColor="#ffd59a" />
          </LinearGradient>
        </Defs>
        <Ellipse cx="50" cy="58" rx="32" ry="30" fill={`url(#${skin})`} />
        <Path d="M18 42 C22 18, 78 18, 82 42 C84 28, 72 12, 50 12 C28 12, 16 28, 18 42 Z" fill={`url(#${hair})`} />
        <Circle cx="38" cy="54" r="4" fill="#1e293b" />
        <Circle cx="62" cy="54" r="4" fill="#1e293b" />
        <Circle cx="39" cy="53" r="1.5" fill="#fff" />
        <Circle cx="63" cy="53" r="1.5" fill="#fff" />
        <Path d="M42 66 Q50 74 58 66" stroke="#990f2e" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <Ellipse cx="32" cy="62" rx="5" ry="3" fill="#ff91a7" opacity="0.55" />
        <Ellipse cx="68" cy="62" rx="5" ry="3" fill="#ff91a7" opacity="0.55" />
        <Circle cx="78" cy="22" r="3" fill="#ffff00" />
        <Circle cx="22" cy="28" r="2" fill="#006400" opacity="0.8" />
      </Svg>
    </View>
  );
}
