jest.mock('posthog-react-native', () => {
  const instance = { debug: jest.fn() };
  return jest.fn(() => instance);
});

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: {
      extra: {
        posthogProjectToken: 'test-token',
        posthogHost: 'https://eu.i.posthog.com',
      },
    },
  },
}));

import PostHog from 'posthog-react-native';

describe('posthog config', () => {
  beforeAll(() => {
    require('../src/config/posthog');
  });

  it('initialises with eu host and token from config', () => {
    expect(PostHog).toHaveBeenCalledWith(
      'test-token',
      expect.objectContaining({
        host: 'https://eu.i.posthog.com',
        disabled: false,
      }),
    );
  });

  it('disables the client when token is absent', () => {
    jest.resetModules();
    jest.doMock('posthog-react-native', () => {
      const instance = { debug: jest.fn() };
      return jest.fn(() => instance);
    });
    jest.doMock('expo-constants', () => ({
      __esModule: true,
      default: { expoConfig: { extra: {} } },
    }));

    const Ph = require('posthog-react-native');
    require('../src/config/posthog');

    expect(Ph).toHaveBeenCalledWith(
      'placeholder_key',
      expect.objectContaining({ disabled: true }),
    );
  });
});
