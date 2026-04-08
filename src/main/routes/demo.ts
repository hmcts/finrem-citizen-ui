import { Application } from 'express';

import { ViewNames } from '../common-constants';

export default (app: Application): void => {
  app.get('/demo/autocomplete', (req, res) => {
    res.render(ViewNames.AutocompleteDemo);
  });
};
