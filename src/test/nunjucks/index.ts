import { offsetDate } from '../../main/functions/task-list/calculate-offset-date';
import { taskListFormItems } from '../../main/functions/task-list/task-list-form-items';
import { taskListWarningMessage } from '../../main/functions/task-list/task-list-warning-message';
import { taskStatus } from '../../main/functions/task-list/task-status';

const path = require('path');

const nunjucks = require('nunjucks');

const nunjucksEnv = nunjucks.configure(path.join(__dirname, '../../main/views'));
nunjucksEnv.addFilter('offsetDate', offsetDate);
nunjucksEnv.addFilter('taskStatus', taskStatus);
nunjucksEnv.addFilter('taskListWarningMessage', taskListWarningMessage);
nunjucksEnv.addFilter('taskListFormItems', taskListFormItems);

export default nunjucksEnv;
