import axios from 'axios';
import config from 'config';
import { authenticator } from 'otplib';

const { Logger } = require('@hmcts/nodejs-logging');

const logger = Logger.getLogger('service-auth-token');
let token: string;

export const getTokenFromApi = (): void => {
  logger.info('Refreshing service auth token');

  const url: string = config.get('services.authProvider.url') + '/lease';
  const microservice: string = config.get('services.authProvider.microservice');
  const secret: string = config.get('services.authProvider.secret');
  const oneTimePassword = authenticator.generate(secret);
  const body = { microservice, oneTimePassword };

console.log("microservice name::", microservice)
  console.log("secret name::", secret)
  axios
    .post(url, body)
    .then(response => {
      token = response.data;
      console.log('Token:', token); // 👈 console log added here
    })
    .catch(err => console.log(err.response?.status, err.response?.data));

};

export const initAuthToken = (): void => {
  getTokenFromApi();
  setInterval(getTokenFromApi, 1000 * 60 * 60);
};

export const getServiceAuthToken = (): string => {
  getTokenFromApi();
  setInterval(getTokenFromApi, 1000 * 60 * 60);
  return token;
};
