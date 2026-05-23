import { Tabs } from 'expo-router';
import { TabBarPill } from '@/components/spuddy/TabBarPill';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBarPill {...props} />}
      screenOptions={{ headerShown: false, tabBarStyle: { backgroundColor: 'transparent' } }}
    >
      <Tabs.Screen name="progress" options={{ title: 'Progress' }} />
      <Tabs.Screen name="add"      options={{ title: 'Add' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}
