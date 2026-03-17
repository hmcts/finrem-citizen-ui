import { Application, Request, Response } from 'express';

export default function setupEnterAccessCodeRoute(app: Application): void {
  app.get('/enter-access-code', (req: Request, res: Response) => {
    res.render('enter-access-code');
  });
}
