import * as path from 'node:path';

import { SESSION, xuiNode } from '@hmcts/rpx-xui-node-lib';
import * as bodyParserModule from 'body-parser';
import * as cookieParserModule from 'cookie-parser';
import * as expressModule from 'express';
import * as helmetModule from 'helmet';

import { getFinremMiddleware } from './auth';
import { environmentCheckText, getConfigValue, getEnvironment, showFeature } from './configuration';
import {
  FEATURE_HELMET_ENABLED,
  FEATURE_REDIS_ENABLED,
  HELMET,
  SESSION_SECRET,
} from './configuration/references';
import { Nunjucks } from './modules/nunjucks';
// eslint-disable-next-line import/order
import { PropertiesVolume } from './modules/properties-volume';

// Import routes
import healthRoute from './routes/health';
import homeRoute from './routes/home';
import infoRoute from './routes/info';
import taskListUploadRoute from './routes/task-list-upload';

// Handle both CommonJS and ES module exports
const express = (expressModule).default || expressModule;
const helmet = (helmetModule).default || helmetModule;
const bodyParser = (bodyParserModule).default || bodyParserModule;
const cookieParser = (cookieParserModule).default || cookieParserModule;

const { Logger } = require('@hmcts/nodejs-logging');

export const app = express();
const logger = Logger.getLogger('app');

// Set environment
const env = process.env.NODE_ENV || 'development';
app.locals.ENV = env;

// Log environment info
if (getEnvironment()) {
  logger.info(environmentCheckText());
}

// Enable properties volume for secrets
new PropertiesVolume().enableFor(app);

// Configure Helmet for security headers
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

// Cookie parser with session secret
app.use(cookieParser(getConfigValue(SESSION_SECRET)));

// Configure rpx-xui-node-lib middleware (handles session, auth, s2s)
app.use(getFinremMiddleware());

// Body parser
app.use(bodyParser.json({ limit: '5mb' }));
app.use(bodyParser.urlencoded({ limit: '5mb', extended: true }));

// Configure Nunjucks templating
new Nunjucks(env === 'development').enableFor(app);

// Redis event listeners (if Redis is enabled)
if (showFeature(FEATURE_REDIS_ENABLED)) {
  xuiNode.on(SESSION.EVENT.REDIS_CLIENT_READY, (redisClient) => {
    logger.info('Redis client ready');
    app.locals.redisClient = redisClient;
  });

  xuiNode.on(SESSION.EVENT.REDIS_CLIENT_ERROR, (error) => {
    logger.error('Redis client error:', error);
  });
}

// Static assets
const publicPath = path.join(__dirname, 'public');
app.use(expressModule.static(publicPath));

// GOV.UK Frontend assets
const govukFrontendPath = path.dirname(require.resolve('govuk-frontend/package.json')) + '/dist/govuk';
app.use('/assets', expressModule.static(govukFrontendPath + '/assets'));

// Setup routes
homeRoute(app);
healthRoute(app);
infoRoute(app);
taskListUploadRoute(app);

// Error handler
app.use((err: any, req: expressModule.Request, res: expressModule.Response) => {
  logger.error(`Error: ${err.message}`);
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: env === 'development' ? err : {},
  });
});

export default app;
