const expressFormItems = require('../../views/config/task-list/express-items.json');
const fastTrackFormItems = require('../../views/config/task-list/fast-track-items.json');
const standardFormItems = require('../../views/config/task-list/standard-form-c-items.json');

export const taskListFormItems: (formType: string) => NonNullable<unknown>[] = (formType: string) => {
  if (formType === 'fasttrack') {
    return fastTrackFormItems;
  } else if (formType === 'express') {
    return expressFormItems;
  } else {
    return standardFormItems;
  }
};
