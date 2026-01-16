import nunjucksEnv from '../../nunjucks';

const { expect } = require('chai');

describe('Task list item component tests', function () {
  it('should be rendered item status as Done correctly', function () {
    const component =
      '{% from "macros/task-list/task-list-item.njk" import taskListItem %}{{ taskListItem("Property Valuation", "/property-valuation", "Done") }}';
    const output = nunjucksEnv.renderString(component).trim();

    expect(output).contains('Done');
    expect(output).contains('<strong class="govuk-tag govuk-tag--green">');
    expect(output).contains('<a class="govuk-link govuk-task-list__link" href=/property-valuation>');
    expect(output).contains('Property Valuation');
  });

  it('should be rendered item status as Not started yet correctly', function () {
    const component =
      '{% from "macros/task-list/task-list-item.njk" import taskListItem %}{{ taskListItem("Property Valuation", "/property-valuation", "Not started yet") }}';
    const output = nunjucksEnv.renderString(component).trim();

    expect(output).contains('Not started yet');
    expect(output).contains('<strong class="govuk-tag govuk-tag--red">');
    expect(output).contains('<a class="govuk-link govuk-task-list__link" href=/property-valuation>');
    expect(output).contains('Property Valuation');
  });

  it('should be rendered item status as Optional correctly', function () {
    const component =
      '{% from "macros/task-list/task-list-item.njk" import taskListItem %}{{ taskListItem("Property Valuation", "/property-valuation", "Optional") }}';
    const output = nunjucksEnv.renderString(component).trim();

    expect(output).contains('Optional');
    expect(output).contains('<strong class="govuk-tag govuk-tag--blue">');
    expect(output).contains('<a class="govuk-link govuk-task-list__link" href=/property-valuation>');
    expect(output).contains('Property Valuation');
  });

  it('should be rendered item status as Available correctly', function () {
    const component =
      '{% from "macros/task-list/task-list-item.njk" import taskListItem %}{{ taskListItem("Property Valuation", "/property-valuation", "Available") }}';
    const output = nunjucksEnv.renderString(component).trim();

    expect(output).contains('Available');
    expect(output).contains('<strong class="govuk-tag govuk-tag--blue">');
    expect(output).contains('<a class="govuk-link govuk-task-list__link" href=/property-valuation>');
    expect(output).contains('Property Valuation');
  });
});
