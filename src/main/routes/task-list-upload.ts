import { Application } from 'express';
import fs from 'fs';
import path from 'path';

import { RouteNames, ViewNames } from '../common-constants';
import { oidcMiddleware } from '../middleware';

const taskListUpload = (app: Application): void => {
  app.get(RouteNames.taskListUpload, oidcMiddleware, (req, res, next) => {
    try {
      const filePath = path.join(__dirname, '../models/tasklist.json');
      const data = fs.readFileSync(filePath, 'utf-8');
      res.render(ViewNames.TaskListUploadDashboard, JSON.parse(data));
    } catch (err) {
      next(err);
    }
  });
};
export default taskListUpload;
