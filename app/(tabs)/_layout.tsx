import { SymbolView } from 'expo-symbols';
import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme].tint,
        headerShown: useClientOnlyValue(false, true),
      }}>
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: 'chart.line.uptrend.xyaxis', android: 'trending_up', web: 'trending_up' }}
              tintColor={color}
              size={28}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: '',
          tabBarIcon: () => (
            <View style={styles.addButton}>
              <SymbolView
                name={{ ios: 'plus', android: 'add', web: 'add' }}
                tintColor="#fff"
                size={28}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: 'gearshape', android: 'settings', web: 'settings' }}
              tintColor={color}
              size={28}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  addButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.light.tint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
});
