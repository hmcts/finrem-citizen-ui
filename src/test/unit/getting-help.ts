import { describe, expect, it } from '@jest/globals';

import nunjucksEnv from '../nunjucks';

describe('Getting help component tests', () => {
  it('should be rendered email correctly', () => {
    const gettingHelp = '{% from "macros/getting-help.njk" import gettingHelp %}{{ gettingHelp("test@test.com") }}';
    const output = nunjucksEnv.renderString(gettingHelp).trim();

    expect(output).toContain('test@test.com');
    expect(output).toContain('mailto:test@test.com');
  });

  it('should be rendered telephone correctly', () => {
    const gettingHelp = '{% from "macros/getting-help.njk" import gettingHelp %}{{ gettingHelp("test@test.com") }}';
    const output = nunjucksEnv.renderString(gettingHelp).trim();

    expect(output).toContain('0300 123 5577<br>Monday to Friday, 8.30am to 5pm.');
  });

  it('should be rendered call charges correctly', () => {
    const gettingHelp = '{% from "macros/getting-help.njk" import gettingHelp %}{{ gettingHelp("test@test.com") }}';
    const output = nunjucksEnv.renderString(gettingHelp).trim();

    expect(output).toContain('Find out about call charges (opens in a new tab)');
    expect(output).toContain('href="https://www.gov.uk/call-charges');
  });
});
