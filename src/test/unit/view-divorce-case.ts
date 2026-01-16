import nunjucksEnv from '../nunjucks';

const { expect } = require('chai');

describe('View divorce case component tests', function () {
  it('should be rendered correctly', function () {
    const divorceCase =
      '{% from "macros/view-divorce-case.njk" import viewDivorceCase %}{{ viewDivorceCase("1230987") }}';
    const output = nunjucksEnv.renderString(divorceCase).trim();

    expect(output).contains('View my divorce case (opens in a new tab)');
    expect(output).contains('href="https://www.apply-divorce.service.gov.uk/"');
    expect(output).contains('<h2 class="govuk-heading-m">I want to...</h2>');
  });
});
