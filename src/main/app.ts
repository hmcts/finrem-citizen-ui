import * as bodyParser from 'body-parser';
import config from 'config';
import cookieParser from 'cookie-parser';
import express from 'express';
import RateLimit from 'express-rate-limit';
import { glob } from 'glob';
import * as path from 'path';

import { ViewNames } from './common-constants';
import { contactEmailMiddleware, globalErrorHandler } from './middleware';
import { AppInsights } from './modules/appinsights';
import { Helmet } from './modules/helmet';
import { Nunjucks } from './modules/nunjucks';
import { OIDCModule } from './modules/oidc';
import { PropertiesVolume } from './modules/properties-volume';
import { Session } from './modules/session';

const { Logger } = require('@hmcts/nodejs-logging');

const { setupDev } = require('./development');

const env = process.env.NODE_ENV || 'development';
const developmentMode = env === 'development';

export const app = express();
app.locals.ENV = env;

const logger = Logger.getLogger('app');

new PropertiesVolume().enableFor(app);
new AppInsights().enable();
new Nunjucks(developmentMode).enableFor(app);
new Helmet(developmentMode).enableFor(app);

const rateLimitWindowMs = Number(config.get('rateLimitWindowMs')) || 900000; // 900000ms = 15 minutes
logger.info('rateLimitWindowMs is set to', rateLimitWindowMs);

const limiter = RateLimit({
  windowMs: rateLimitWindowMs,
  max: 100,
});

app.get('/favicon.ico', limiter, (req, res) => {
  res.sendFile(path.join(__dirname, '/public/assets/images/favicon.ico'));
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache, max-age=0, must-revalidate, no-store');
  next();
});

new Session().enableFor(app);
new OIDCModule().enableFor(app);

// Add contact email to all templates via res.locals
app.use(contactEmailMiddleware);

glob
  .sync(__dirname + '/routes/**/*.+(ts|js)')
  .map(filename => require(filename))
  .forEach(route => route.default(app));

setupDev(app, developmentMode);

app.use((req, res) => {
  res.status(404);
  res.render(ViewNames.NotFound);
});

app.use(globalErrorHandler);
