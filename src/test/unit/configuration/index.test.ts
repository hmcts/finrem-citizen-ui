import config from 'config';

import {
  environmentCheckText,
  getConfigValue,
  getEnvironment,
  getProtocol,
  hasConfigValue,
  initialiseSecrets,
  showFeature,
} from '../../../main/configuration';

jest.mock('@hmcts/properties-volume', () => ({
  addTo: jest.fn(),
}));

describe('configuration/index', () => {
  const originalEnv = process.env.NODE_CONFIG_ENV;

  afterEach(() => {
    process.env.NODE_CONFIG_ENV = originalEnv;
  });

  describe('initialiseSecrets', () => {
    it('should call propertiesVolume.addTo with config', () => {
      const propertiesVolume = require('@hmcts/properties-volume');
      initialiseSecrets();
      expect(propertiesVolume.addTo).toHaveBeenCalledWith(config);
    });
  });

  describe('getEnvironment', () => {
    it('should return NODE_CONFIG_ENV value', () => {
      process.env.NODE_CONFIG_ENV = 'test';
      expect(getEnvironment()).toBe('test');
    });

    it('should return undefined when NODE_CONFIG_ENV is not set', () => {
      delete process.env.NODE_CONFIG_ENV;
      expect(getEnvironment()).toBeUndefined();
    });
  });

  describe('getConfigValue', () => {
    it('should return config value for a given reference', () => {
      const result = getConfigValue<string>('environment');
      expect(typeof result).toBe('string');
      expect(result).toBeTruthy();
    });
  });

  describe('hasConfigValue', () => {
    it('should return true for existing config keys', () => {
      expect(hasConfigValue('environment')).toBe(true);
    });

    it('should return false for non-existing config keys', () => {
      expect(hasConfigValue('nonExistentKey')).toBe(false);
    });
  });

  describe('showFeature', () => {
    it('should return the feature flag value', () => {
      const result = showFeature('helmetEnabled');
      expect(typeof result).toBe('boolean');
    });
  });

  describe('environmentCheckText', () => {
    it('should return text with NODE_CONFIG_ENV and environment config', () => {
      process.env.NODE_CONFIG_ENV = 'test';
      const text = environmentCheckText();
      expect(text).toContain('NODE_CONFIG_ENV is set as test');
      expect(text).toContain('config');
    });
  });

  describe('getProtocol', () => {
    it('should return http for development environment', () => {
      process.env.NODE_CONFIG_ENV = 'development';
      expect(getProtocol()).toBe('http');
    });

    it('should return config protocol value for non-development environment', () => {
      process.env.NODE_CONFIG_ENV = 'test';
      const result = getProtocol();
      expect(result).toBe('https');
    });
  });
});
