import * as path from 'node:path';

import { SESSION, xuiNode } from '@hmcts/rpx-xui-node-lib';
import * as bodyParserModule from 'body-parser';
import * as cookieParserModule from 'cookie-parser';
import * as expressModule from 'express';
import * as helmetModule from 'helmet';

import { HTTPError } from './HttpError';
import { getFinremMiddleware } from './auth';
import { environmentCheckText, getConfigValue, getEnvironment, showFeature } from './configuration';
import { FEATURE_HELMET_ENABLED, FEATURE_REDIS_ENABLED, HELMET, SESSION_SECRET } from './configuration/references';
import { Nunjucks } from './modules/nunjucks';
// eslint-disable-next-line import/order
import { PropertiesVolume } from './modules/properties-volume';

import healthRoute from './routes/health';
import homeRoute from './routes/home';
import infoRoute from './routes/info';
import taskListUploadRoute from './routes/task-list-upload';

const express = expressModule.default || expressModule;
const helmet = helmetModule.default || helmetModule;
const bodyParser = bodyParserModule.default || bodyParserModule;
const cookieParser = cookieParserModule.default || cookieParserModule;

const { Logger } = require('@hmcts/nodejs-logging');

export const app = express();
const logger = Logger.getLogger('app');

const env = process.env.NODE_ENV;
app.locals.ENV = env;

if (getEnvironment()) {
  logger.info(environmentCheckText());
}

new PropertiesVolume().enableFor(app);

if (showFeature(FEATURE_HELMET_ENABLED)) {
  logger.info('Helmet enabled');
  const helmetConfig = getConfigValue(HELMET);
  if (helmetConfig && typeof helmetConfig === 'object') {
    app.use(helmet(helmetConfig));
  } else {
    app.use(helmet());
  }
  app.use(helmet.hidePoweredBy());
  app.disable('x-powered-by');
}

app.use(cookieParser(getConfigValue(SESSION_SECRET)));

app.use(bodyParser.json({ limit: '5mb' }));
app.use(bodyParser.urlencoded({ limit: '5mb', extended: true }));

app.use(getFinremMiddleware());

new Nunjucks(env === 'development').enableFor(app);

if (showFeature(FEATURE_REDIS_ENABLED)) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  xuiNode.on(SESSION.EVENT.REDIS_CLIENT_READY, (redisClient: any) => {
    logger.info('Redis client ready');
    app.locals.redisClient = redisClient;
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  xuiNode.on(SESSION.EVENT.REDIS_CLIENT_ERROR, (error: any) => {
    logger.error('Redis client error:', error);
  });
}

const publicPath = path.join(__dirname, 'public');
app.use(expressModule.static(publicPath));

const govukFrontendPath = path.dirname(require.resolve('govuk-frontend/package.json')) + '/dist/govuk';
app.use('/assets', expressModule.static(govukFrontendPath + '/assets'));

homeRoute(app);
healthRoute(app);
infoRoute(app);
taskListUploadRoute(app);

app.use((req: expressModule.Request, res: expressModule.Response, next: expressModule.NextFunction) => {
  next(new HTTPError(`Not Found: ${req.method} ${req.originalUrl}`, 404));
});

app.use((err: HTTPError, req: expressModule.Request, res: expressModule.Response) => {
  logger.error(`Error: ${err.message}`);
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: env === 'development' ? err : {},
  });
});

export default app;
