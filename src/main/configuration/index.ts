import * as propertiesVolume from '@hmcts/properties-volume';
import config from 'config';

import { ENVIRONMENT, PROTOCOL } from './references';

const DEVELOPMENT = 'development';
const HTTP = 'http';

export const initialiseSecrets = ():void => {
  propertiesVolume.addTo(config);
};

initialiseSecrets();

export const getEnvironment = ():string | undefined => process.env.NODE_CONFIG_ENV;

export const getConfigValue = <T = string>(reference: string): T => config.get(reference);

export const hasConfigValue = (reference: string): boolean => config.has(reference);

export const showFeature = (feature: string): boolean => config.get(`feature.${feature}`);

export const environmentCheckText = () =>
  `NODE_CONFIG_ENV is set as ${process.env.NODE_CONFIG_ENV} therefore we are using the ${config.get(ENVIRONMENT)} config.`;

export const getProtocol = (): string => getEnvironment() === DEVELOPMENT ? HTTP : getConfigValue(PROTOCOL);
