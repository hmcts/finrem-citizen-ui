import fs from 'fs';
import path from 'path';

import { Application } from 'express';

import { oidcMiddleware } from '../middleware';

const taskListUpload = (app: Application): void => {
  app.get('/task-list-upload-dashboard', oidcMiddleware, (req, res, next) => {
    try {
      const filePath = path.join(__dirname, '../models/tasklist.json');
      const data = fs.readFileSync(filePath, 'utf-8');
      res.render('task-list-upload-dashboard', JSON.parse(data));
    } catch (err) {
      next(err);
    }
  });
};
export default taskListUpload;
