import axios from 'axios';
import config from 'config';

const { Logger } = require('@hmcts/nodejs-logging');
const logger = Logger.getLogger('service-auth-token');

let token: string;

export const getTokenFromApi = async (): Promise<void> => {
  // Use a more defensive require
  const otplib = require('otplib');
  // Check if it's nested under .default or available directly
  const authenticator = otplib.authenticator || otplib.default?.authenticator;

  if (!authenticator) {
    logger.error('Could not find authenticator in otplib. Check library version.');
    return;
  }

  logger.info('Refreshing service auth token');

  const url: string = config.get('services.authProvider.url') + '/lease';
  const microservice: string = config.get('services.authProvider.microservice');
  const secret: string = config.get('services.authProvider.secret');

  try {
    const oneTimePassword = authenticator.generate(secret);
    const body = { microservice, oneTimePassword };

    const response = await axios.post(url, body);
    token = response.data;
  } catch (err) {
    logger.error(err.response?.status, err.response?.data);
  }
};

export const initAuthToken = (): void => {
  getTokenFromApi();
  setInterval(getTokenFromApi, 1000 * 60 * 60);
};

export const getServiceAuthToken = (): string => token;
