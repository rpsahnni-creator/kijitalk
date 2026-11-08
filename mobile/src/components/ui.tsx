import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Link, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FeatureIcon, type FeatureIconName } from './FeatureIcon';
import { useAuthStore } from '@/stores/authStore';

export const BRAND = {
  crimson: '#dc143c',
  crimsonDark: '#990f2e',
  green: '#006400',
  yellow: '#ffff00',
  yellowSoft: '#ffff33',
  slate: '#94a3b8',
};

/** Crimson top bar with yellow "Welcome", logo and profile avatar. */
export function AppHeader({ title = 'Welcome' }: { title?: string }) {
  const insets = useSafeAreaInsets();
  const profile = useAuthStore((s) => s.profile);
  const initial = profile?.displayName?.trim()?.[0]?.toUpperCase() ?? 'K';

  return (
    <View
      className="flex-row items-center gap-3 bg-brand-600 px-4 pb-3"
      style={{ paddingTop: insets.top + 10, borderBottomWidth: 3, borderBottomColor: BRAND.yellow }}
    >
      <View className="h-9 w-9 items-center justify-center rounded-xl bg-white/20 p-1">
        <Image source={require('../../assets/logo.png')} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
      </View>
      <Text className="text-base font-bold text-white">KijiTalk</Text>
      <Text className="flex-1 text-center text-lg font-extrabold" style={{ color: BRAND.yellowSoft }} numberOfLines={1}>
        {title}
      </Text>
      <Link href="/(tabs)/settings" asChild>
        <TouchableOpacity
          accessibilityLabel="Profile and settings"
          className="h-9 w-9 items-center justify-center rounded-full bg-white"
          style={{ borderWidth: 2, borderColor: BRAND.yellow }}
        >
          <Text className="text-sm font-bold text-brand-700">{initial}</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}

/** DarkGreen heading with a crimson underline — the home-grid section style. */
export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <View className="mb-3">
      <Text className="text-xl font-bold text-leaf-700 dark:text-leaf-400">{children}</Text>
      <View className="mt-1 h-[3px] flex-row overflow-hidden rounded-full">
        <View className="flex-[2] bg-brand-600" />
        <View className="flex-[3] bg-brand-200" />
      </View>
    </View>
  );
}

interface TileProps {
  icon: FeatureIconName;
  label: string;
  href?: Href;
  onPress?: () => void;
  badge?: number | string | null;
}

/** Illustrated icon with a label underneath, four to a row. */
export function FeatureTile({ icon, label, href, onPress, badge }: TileProps) {
  const body = (
    <TouchableOpacity
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="w-1/4 items-center px-1 py-2.5"
      activeOpacity={0.7}
    >
      <View>
        <FeatureIcon name={icon} size={52} />
        {badge !== undefined && badge !== null && badge !== 0 && (
          <View
            className="absolute -left-2 -top-1 rounded-full bg-brand-600 px-1.5 py-0.5"
            style={{ borderWidth: 2, borderColor: '#fff' }}
          >
            <Text className="text-[10px] font-bold text-white">{badge}</Text>
          </View>
        )}
      </View>
      <Text className="mt-1.5 text-center text-[12px] font-semibold leading-4 text-slate-800 dark:text-slate-200" numberOfLines={2}>
        {label}
      </Text>
    </TouchableOpacity>
  );
  if (href) {
    return (
      <Link href={href} asChild>
        {body}
      </Link>
    );
  }
  return body;
}

/** "Design By: Kiji Technology" crimson footer strip. */
export function BrandFooter() {
  return (
    <View className="relative overflow-hidden bg-brand-700">
      <View className="absolute -bottom-8 -right-6 h-20 w-20 rounded-full" style={{ backgroundColor: BRAND.yellow }} />
      <View className="absolute -left-4 -top-6 h-12 w-12 rounded-full bg-leaf-700" />
      <Text className="px-4 py-3.5 text-center text-sm text-white">
        <Text className="font-bold" style={{ color: BRAND.yellowSoft }}>
          Design By:
        </Text>{' '}
        Kiji Technology
      </Text>
    </View>
  );
}
