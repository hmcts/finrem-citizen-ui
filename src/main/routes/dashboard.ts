import { Application, Request, Response } from 'express';

export default (app: Application): void => {
  app.get('/dashboard', (req: Request, res: Response) => {
    res.render('dashboard');
  });
};
