import { describe, expect, test } from '@jest/globals';

import nunjucksEnv from '../nunjucks';

describe('Back link component tests', () => {
  test('should be rendered correctly', () => {
    const backlink = '{% from "macros/back-link.njk" import backLink %}{{ backLink("/url") }}';
    const output = nunjucksEnv.renderString(backlink).trim();

    expect(output).toBe('<a href=/url class="govuk-back-link">Back</a>');
  });
});
