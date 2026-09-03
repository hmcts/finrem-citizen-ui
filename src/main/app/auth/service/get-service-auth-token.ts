import axios from 'axios';
import config from 'config';
import { generate } from 'otplib';

const { Logger } = require('@hmcts/nodejs-logging');
const logger = Logger.getLogger('service-auth-token');

let token: string;

export const getTokenFromApi = async (): Promise<void> => {
  logger.info('Refreshing service auth token');

  const url: string = config.get('services.authProvider.url') + '/lease';
  const microservice: string = config.get('services.authProvider.microservice');
  const secret: string = config.get('services.authProvider.secret');
  const oneTimePassword = await generate ( { secret });

  try {
    const response = await axios.post(url, {
      microservice,
      oneTimePassword,
    });

    token = response.data;
    logger.info('Service authorisation token obtained successfully');
  } catch (error) {
    logger.error('Failed to obtain service authorisation token', error);
    throw error;
  }
};

export const initAuthToken = async (): Promise<void> => {
  await getTokenFromApi();

  setInterval(() => {
    getTokenFromApi().catch(error => {
      logger.error('Failed to refresh service authorisation token', error);
    });
  }, 1000 * 60 * 60);
};

export const getServiceAuthToken = (): string => {
  if (!token) {
    throw new Error('Service authorisation token is unavailable');
  }

  return token;
};
