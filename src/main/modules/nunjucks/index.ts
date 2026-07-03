import * as express from 'express';
import * as nunjucks from 'nunjucks';
import * as path from 'path';

import { offsetDate } from '../../functions/task-list/calculate-offset-date';
import { taskListFormItems } from '../../functions/task-list/task-list-form-items';
import { taskListWarningMessage } from '../../functions/task-list/task-list-warning-message';
import { taskStatus } from '../../functions/task-list/task-status';

const FEEDBACK_SURVEY_BASE_URL = 'https://www.smartsurvey.co.uk/s/CFR_feedback/?pageurl=';

const formatCaseNumber = (caseNumber: string): string => {
  if (!caseNumber) {
    return '';
  }
  return caseNumber.replace(/(\d{4})(?=\d)/g, '$1-');
};

const getHeaderValue = (header: string | string[] | undefined): string | undefined => {
  const value = Array.isArray(header) ? header[0] : header;

  return value?.split(',')[0].trim();
};

const getCurrentUrl = (req: express.Request): URL => {
  const forwardedProtocol = getHeaderValue(req.headers['x-forwarded-proto']);
  const forwardedHost = getHeaderValue(req.headers['x-forwarded-host']);
  const protocol = forwardedProtocol || req.protocol || 'http';
  const host = forwardedHost || req.get('host') || 'localhost:3100';

  return new URL(req.originalUrl || req.url || '/', `${protocol}://${host}`);
};

export const buildFeedbackSurveyUrl = (req: express.Request): string =>
  `${FEEDBACK_SURVEY_BASE_URL}${encodeURIComponent(getCurrentUrl(req).href)}`;

export const addNunjucksLocals: express.RequestHandler = (req, res, next) => {
  res.locals.pagePath = req.path;
  res.locals.feedbackSurveyUrl = buildFeedbackSurveyUrl(req);
  next();
};

export class Nunjucks {
  constructor(public developmentMode: boolean) {
    this.developmentMode = developmentMode;
  }

  enableFor(app: express.Express): void {
    app.set('view engine', 'njk');
    const govukTemplates = path.dirname(require.resolve('govuk-frontend/package.json')) + '/dist';
    const viewsPath = path.join(__dirname, '..', '..', 'views');

    const env = nunjucks.configure([govukTemplates, viewsPath], {
      autoescape: true,
      watch: this.developmentMode,
      express: app,
    });

    env.addFilter('offsetDate', offsetDate);
    env.addFilter('taskStatus', taskStatus);
    env.addFilter('taskListWarningMessage', taskListWarningMessage);
    env.addFilter('taskListFormItems', taskListFormItems);
    env.addFilter('formatCaseNumber', formatCaseNumber);

    app.use(addNunjucksLocals);
  }
}
