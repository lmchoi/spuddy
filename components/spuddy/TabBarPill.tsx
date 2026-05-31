import { View, TouchableOpacity, Text } from 'react-native';
import { styles } from './TabBarPill.styles';
import { SymbolView } from 'expo-symbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { C } from './palette';

type RouteKey = 'progress' | 'add' | 'settings';

// Minimal slice of BottomTabBarProps that we actually use.
// (expo-router bundles @react-navigation/bottom-tabs internally and does not
// re-export BottomTabBarProps from the public entry point.)
interface TabBarProps {
  state: {
    index: number;
    routes: readonly { key: string; name: string }[];
  };
  navigation: {
    emit(event: {
      type: 'tabPress';
      target: string;
      canPreventDefault: true;
    }): { defaultPrevented: boolean };
    navigate(name: string): void;
  };
}

const ICONS = {
  progress: { ios: 'chart.line.uptrend.xyaxis', android: 'trending_up',  web: 'trending_up'  },
  add:      { ios: 'plus',                       android: 'add',           web: 'add'           },
  settings: { ios: 'gearshape',                  android: 'settings',      web: 'settings'      },
} as const;

const LABELS: Record<RouteKey, string> = {
  progress: 'Progress',
  add:      '',
  settings: 'Settings',
};

export function TabBarPill({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={styles.pill}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const key = route.name as RouteKey;
          if (!(key in ICONS)) return null;
          const isAdd = key === 'add';

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          if (isAdd) {
            return (
              <TouchableOpacity
                key={route.key}
                onPress={() => router.push('/select-day')}
                accessibilityRole="button"
                accessibilityLabel="Add workout"
                accessibilityState={{ selected: isFocused }}
                style={styles.addButton}
              >
                <SymbolView name={ICONS.add} tintColor={C.bg} size={22} />
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              accessibilityRole="button"
              accessibilityState={{ selected: isFocused }}
              accessibilityLabel={LABELS[key]}
              style={[styles.tabButton, isFocused && styles.tabButtonActive]}
            >
              <SymbolView
                name={ICONS[key]}
                tintColor={isFocused ? C.hit : C.sub}
                size={20}
              />
              {isFocused && <Text style={styles.label}>{LABELS[key]}</Text>}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
