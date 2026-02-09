import config from 'config';
import { Application } from 'express';

import { PropertiesVolume } from '../../../main/modules/properties-volume';

jest.mock('@hmcts/properties-volume', () => ({
  addTo: jest.fn(),
}));

describe('modules/properties-volume', () => {
  let propertiesVolume: any;

  beforeEach(() => {
    propertiesVolume = require('@hmcts/properties-volume');
    jest.clearAllMocks();
  });

  it('should not call addTo in development environment', () => {
    const app = { locals: { ENV: 'development' } } as unknown as Application;
    const pv = new PropertiesVolume();
    pv.enableFor(app);

    expect(propertiesVolume.addTo).not.toHaveBeenCalled();
  });

  it('should call addTo in non-development environment', () => {
    const app = { locals: { ENV: 'production' } } as unknown as Application;
    const pv = new PropertiesVolume();
    pv.enableFor(app);

    expect(propertiesVolume.addTo).toHaveBeenCalledWith(config);
  });

  it('should set appInsights secret when it exists in config', () => {
    const app = { locals: { ENV: 'production' } } as unknown as Application;

    // Temporarily set the secret
    const originalHas = config.has;
    const originalGet = config.get;
    jest.spyOn(config, 'has').mockImplementation((path: string) => {
      if (path === 'secrets.rpe.AppInsightsInstrumentationKey') return true;
      return originalHas.call(config, path);
    });
    jest.spyOn(config, 'get').mockImplementation((path: string) => {
      if (path === 'secrets.rpe.AppInsightsInstrumentationKey') return 'test-instrumentation-key';
      return originalGet.call(config, path);
    });

    const pv = new PropertiesVolume();
    pv.enableFor(app);

    expect(propertiesVolume.addTo).toHaveBeenCalled();

    jest.restoreAllMocks();
  });
});
