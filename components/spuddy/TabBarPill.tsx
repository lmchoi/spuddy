import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
                onPress={onPress}
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

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    paddingTop: 8,
    paddingHorizontal: 14,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 6,
    backgroundColor: C.card,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 12,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },
  tabButtonActive: {
    backgroundColor: C.card2,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: C.text,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: C.hit,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2,
    shadowColor: C.hit,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.33,
    shadowRadius: 12,
    elevation: 6,
  },
});
