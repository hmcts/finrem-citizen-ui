import { Application } from 'express';

export default (app: Application): void => {
  app.get('/demo/autocomplete', (req, res) => {
    res.render('autocomplete-demo');
  });
};
