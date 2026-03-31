import { describe, expect, it } from '@jest/globals';

import nunjucksEnv from '../../nunjucks';

describe('Task list item component tests', () => {
  it('should be rendered item status as Done correctly', () => {
    const component =
      '{% from "macros/task-list/task-list-item.njk" import taskListItem %}{{ taskListItem("Property Valuation", "/property-valuation", "Done") }}';
    const output = nunjucksEnv.renderString(component).trim();

    expect(output).toContain('Done');
    expect(output).toContain('<strong class="govuk-tag govuk-tag--green">');
    expect(output).toContain('<a class="govuk-link govuk-task-list__link" href=/property-valuation>');
    expect(output).toContain('Property Valuation');
  });

  it('should be rendered item status as Not started yet correctly', () => {
    const component =
      '{% from "macros/task-list/task-list-item.njk" import taskListItem %}{{ taskListItem("Property Valuation", "/property-valuation", "Not started yet") }}';
    const output = nunjucksEnv.renderString(component).trim();

    expect(output).toContain('Not started yet');
    expect(output).toContain('<strong class="govuk-tag govuk-tag--red">');
    expect(output).toContain('<a class="govuk-link govuk-task-list__link" href=/property-valuation>');
    expect(output).toContain('Property Valuation');
  });

  it('should be rendered item status as Optional correctly', () => {
    const component =
      '{% from "macros/task-list/task-list-item.njk" import taskListItem %}{{ taskListItem("Property Valuation", "/property-valuation", "Optional") }}';
    const output = nunjucksEnv.renderString(component).trim();

    expect(output).toContain('Optional');
    expect(output).toContain('<strong class="govuk-tag govuk-tag--blue">');
    expect(output).toContain('<a class="govuk-link govuk-task-list__link" href=/property-valuation>');
    expect(output).toContain('Property Valuation');
  });

  it('should be rendered item status as Available correctly', () => {
    const component =
      '{% from "macros/task-list/task-list-item.njk" import taskListItem %}{{ taskListItem("Property Valuation", "/property-valuation", "Available") }}';
    const output = nunjucksEnv.renderString(component).trim();

    expect(output).toContain('Available');
    expect(output).toContain('<strong class="govuk-tag govuk-tag--blue">');
    expect(output).toContain('<a class="govuk-link govuk-task-list__link" href=/property-valuation>');
    expect(output).toContain('Property Valuation');
  });
});
