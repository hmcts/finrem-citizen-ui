import nunjucksEnv from '../nunjucks';

const { expect } = require('chai');

describe('Back link component tests', function () {
  it('should be rendered correctly', function () {
    const backlink = '{% from "macros/back-link.njk" import backLink %}{{ backLink("/url") }}';
    const output = nunjucksEnv.renderString(backlink).trim();

    expect(output).equals('<a href=/url class="govuk-back-link">Back</a>');
  });
});
