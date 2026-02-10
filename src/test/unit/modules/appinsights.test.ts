jest.mock('applicationinsights', () => {
  const mockStart = jest.fn();
  const mockSetSendLiveMetrics = jest.fn(() => ({ start: mockStart }));
  const mockSetup = jest.fn(() => ({ setSendLiveMetrics: mockSetSendLiveMetrics }));
  return {
    setup: mockSetup,
    defaultClient: {
      context: {
        tags: {} as Record<string, string>,
        keys: {
          cloudRole: 'cloudRole',
        },
      },
      trackTrace: jest.fn(),
    },
  };
});

jest.mock('config', () => {
  let instrumentationKey = '';
  return {
    __esModule: true,
    default: {
      get: jest.fn((path: string) => {
        if (path === 'appInsights.instrumentationKey') {
          return instrumentationKey;
        }
        return '';
      }),
      _setInstrumentationKey: (key: string) => {
        instrumentationKey = key;
      },
    },
  };
});

import config from 'config';

import { AppInsights } from '../../../main/modules/appinsights';

describe('modules/appinsights', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not setup appInsights when instrumentation key is empty', () => {
    (config as any)._setInstrumentationKey('');
    const appInsightsModule = require('applicationinsights');

    const ai = new AppInsights();
    ai.enable();

    expect(appInsightsModule.setup).not.toHaveBeenCalled();
  });

  it('should setup appInsights when instrumentation key is provided', () => {
    (config as any)._setInstrumentationKey('test-key');
    const appInsightsModule = require('applicationinsights');

    const ai = new AppInsights();
    ai.enable();

    expect(appInsightsModule.setup).toHaveBeenCalledWith('test-key');
    expect(appInsightsModule.defaultClient.context.tags['cloudRole']).toBe('finrem-citizen-ui');
    expect(appInsightsModule.defaultClient.trackTrace).toHaveBeenCalledWith({
      message: 'App insights activated',
    });
  });
});
