import React from 'react';
import { View } from 'react-native';
import { TabBarPill } from './TabBarPill';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default {
  title: 'Spuddy/TabBarPill',
  component: TabBarPill,
  decorators: [
    (Story: any) => (
      <SafeAreaProvider>
        <View className="flex-1 justify-end pb-5 bg-black">
          <Story />
        </View>
      </SafeAreaProvider>
    ),
  ],
};

const mockNavigation = {
  emit: () => ({ defaultPrevented: false }),
  navigate: () => {},
};

const mockState = {
  index: 0,
  routes: [
    { key: 'progress', name: 'progress' },
    { key: 'add', name: 'add' },
    { key: 'settings', name: 'settings' },
  ],
};

export const ProgressSelected = {
  args: {
    state: mockState,
    navigation: mockNavigation,
  },
};

export const SettingsSelected = {
  args: {
    state: { ...mockState, index: 2 },
    navigation: mockNavigation,
  },
};
