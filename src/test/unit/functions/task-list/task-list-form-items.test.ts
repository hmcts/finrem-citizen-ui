import { taskListFormItems } from '../../../../main/functions/task-list/task-list-form-items';

describe('taskListFormItems tests', () => {

  it('should be defined fasttrack form items', () => {
    const fasttrack = taskListFormItems('fasttrack');
    expect(fasttrack).toBeDefined();
  });

  it('should be defined express form items', () => {
    const express = taskListFormItems('express');
    expect(express).toBeDefined();
  });

  it('should be defined standard form items', () => {
    const standard = taskListFormItems('undefined');
    expect(standard).toBeDefined();
  });

});
