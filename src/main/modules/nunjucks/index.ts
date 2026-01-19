import * as path from 'path';

import { offsetDate } from '../../functions/task-list/calculate-offset-date';
import { taskListFormItems } from '../../functions/task-list/task-list-form-items';
import { taskListWarningMessage } from '../../functions/task-list/task-list-warning-message';
import { taskStatus } from '../../functions/task-list/task-status';

import * as express from 'express';
import * as nunjucks from 'nunjucks';

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

    app.use((req, res, next) => {
      res.locals.pagePath = req.path;
      next();
    });
  }
}
