import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import Index from '../app/index';
import { getDB } from '@/src/db';
import { hasAnySessions } from '@/src/storage';
import { findActiveDraft } from '@/src/sessionDraft';

jest.mock('@/src/db', () => ({ getDB: jest.fn().mockResolvedValue({}) }));
jest.mock('@/src/storage', () => ({
  hasAnySessions: jest.fn(),
}));
jest.mock('expo-router', () => ({
  router: { replace: jest.fn() },
}));
jest.mock('@/src/sessionDraft', () => ({
  findActiveDraft: jest.fn().mockResolvedValue(null),
}));

beforeEach(() => {
  (router.replace as jest.Mock).mockClear();
  (getDB as jest.Mock).mockClear();
  (getDB as jest.Mock).mockResolvedValue({});
  (findActiveDraft as jest.Mock).mockResolvedValue(null);
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

  it('routes to log-session when an active draft is found', async () => {
    (findActiveDraft as jest.Mock).mockResolvedValue({ programId: 3, dayIndex: 1 });
    render(<Index />);
    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith('/log-session?programId=3&dayIndex=1')
    );
  });

  it('does not call getDB when an active draft is found', async () => {
    (findActiveDraft as jest.Mock).mockResolvedValue({ programId: 3, dayIndex: 1 });
    render(<Index />);
    await waitFor(() => expect(router.replace).toHaveBeenCalled());
    expect(getDB).not.toHaveBeenCalled();
  });

  it('falls back to settings when findActiveDraft rejects', async () => {
    (findActiveDraft as jest.Mock).mockRejectedValue(new Error('storage error'));
    render(<Index />);
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/(tabs)/settings'));
  });
});
