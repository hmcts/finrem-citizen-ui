import nunjucksEnv from '../nunjucks';

const { expect } = require('chai');

describe('Getting help component tests', function () {
  it('should be rendered email correctly', function () {
    const gettingHelp = '{% from "macros/getting-help.njk" import gettingHelp %}{{ gettingHelp("test@test.com") }}';
    const output = nunjucksEnv.renderString(gettingHelp).trim();

    expect(output).contains('test@test.com');
    expect(output).contains('mailto:test@test.com');
  });

  it('should be rendered telephone correctly', function () {
    const gettingHelp = '{% from "macros/getting-help.njk" import gettingHelp %}{{ gettingHelp("test@test.com") }}';
    const output = nunjucksEnv.renderString(gettingHelp).trim();

    expect(output).contains('0300 123 5577<br>Monday to Friday, 8.30am to 5pm.');
  });

  it('should be rendered call charges correctly', function () {
    const gettingHelp = '{% from "macros/getting-help.njk" import gettingHelp %}{{ gettingHelp("test@test.com") }}';
    const output = nunjucksEnv.renderString(gettingHelp).trim();

    expect(output).contains('Find out about call charges (opens in a new tab)');
    expect(output).contains('href="https://www.gov.uk/call-charges');
  });
});
