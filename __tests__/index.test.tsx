import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import Index from '../app/index';
import { getDB } from '@/src/db';
import { hasAnySessions } from '@/src/storage';

jest.mock('@/src/db', () => ({ getDB: jest.fn().mockResolvedValue({}) }));
jest.mock('@/src/storage', () => ({
  hasAnySessions: jest.fn(),
}));
jest.mock('expo-router', () => ({
  router: { replace: jest.fn() },
}));

beforeEach(() => {
  (router.replace as jest.Mock).mockClear();
  (getDB as jest.Mock).mockResolvedValue({});
});

describe('Index redirect', () => {
  it('redirects to settings when no sessions exist', async () => {
    (hasAnySessions as jest.Mock).mockResolvedValue(false);
    render(<Index />);
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/(tabs)/settings'));
  });

  it('redirects to progress when sessions exist', async () => {
    (hasAnySessions as jest.Mock).mockResolvedValue(true);
    render(<Index />);
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/(tabs)/progress'));
  });

  it('falls back to settings on DB error', async () => {
    (getDB as jest.Mock).mockRejectedValue(new Error('db failed'));
    render(<Index />);
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/(tabs)/settings'));
  });
});
