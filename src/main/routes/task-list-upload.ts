import fs from 'fs';
import path from 'path';

import { Application } from 'express';

export default (app: Application): void => {
  // Task List Dashboard
  app.get('/task-list-upload-dashboard', (req, res, next) => {
    try {
      const filePath = path.join(__dirname, '../models/tasklist.json');
      const data = fs.readFileSync(filePath, 'utf-8');
      res.render('task-list-upload-dashboard', JSON.parse(data));
    } catch (err) {
      next(err);
      res.render('error', {});
    }
  });
};
