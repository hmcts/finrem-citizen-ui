import { describe, expect, it } from '@jest/globals';

import nunjucksEnv from '../nunjucks';

describe('View divorce case component tests', () => {
  it('should be rendered correctly', () => {
    const divorceCase =
      '{% from "macros/view-divorce-case.njk" import viewDivorceCase %}{{ viewDivorceCase("1230987") }}';
    const output = nunjucksEnv.renderString(divorceCase).trim();

    expect(output).toContain('View my divorce case (opens in a new tab)');
    expect(output).toContain('href="https://www.apply-divorce.service.gov.uk/"');
    expect(output).toContain('<h2 class="govuk-heading-m">I want to...</h2>');
  });
});
