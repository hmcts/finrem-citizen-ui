import { Application } from 'express';

import { RouteNames, ViewNames } from '../common-constants';

export default (app: Application): void => {
  app.get(RouteNames.demoAutocomplete, (req, res) => {
    res.render(ViewNames.AutocompleteDemo);
  });
};
