import { SymbolView } from 'expo-symbols';
import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';

// App is dark-mode only — hardcode the palette rather than reading colorScheme.
const TAB_BG = '#08080E';
const TAB_ACTIVE = '#39FF82';
const TAB_INACTIVE = '#5C5C88';
const TAB_BORDER = '#1C1C2A';
const ADD_COLOR = '#39FF82';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: TAB_ACTIVE,
        tabBarInactiveTintColor: TAB_INACTIVE,
        tabBarStyle: {
          backgroundColor: TAB_BG,
          borderTopColor: TAB_BORDER,
          borderTopWidth: 1,
        },
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
                tintColor={TAB_BG}
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
    backgroundColor: ADD_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
});
