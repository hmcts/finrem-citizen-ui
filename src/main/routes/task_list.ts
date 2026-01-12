import { Application } from 'express';
export default (app: Application): void => {
  // Task List Dashboard
  app.get('/task-list-dashboard', (req, res, next) => {
    try {
      res.render('task-list-dashboard');
    } catch (err) {
      next(err);
      res.render('error', {});
    }
  });
};
