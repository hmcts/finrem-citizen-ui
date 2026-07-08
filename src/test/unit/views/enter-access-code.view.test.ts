import { describe, expect, test } from '@jest/globals';
import nunjucks from 'nunjucks';
import path from 'path';

const viewsPath = path.resolve(process.cwd(), 'src/main/views');

describe('enter-access-code view error rendering', () => {
  const alreadyUsedError =
    'The access code you entered has already been used, you should contact the court.';

  const render = (context: Record<string, unknown>) => {
    const env = nunjucks.configure(viewsPath, {
      autoescape: true,
      noCache: true,
    });

    return env.render('enter-access-code.njk', context);
  };

  test('shows error summary title, summary link and inline field error for already used access code', () => {
    const html = render({
      errors: { accessCode: alreadyUsedError },
      accessCode: 'APPCODE1',
    });

    expect(html).toContain('There is a problem');
    expect(html).toContain(`href="\#accessCode">${alreadyUsedError}</a>`);
    expect(html).toContain('id="accessCode-error" class="govuk-error-message"');
    expect(html).toContain(alreadyUsedError);
  });

  test('applies govuk error classes to the field container and input for already used access code', () => {
    const html = render({
      errors: { accessCode: alreadyUsedError },
      accessCode: 'APPCODE1',
    });

    expect(html).toContain('govuk-form-group govuk-form-group--error');
    expect(html).toContain('govuk-input govuk-input--error');
  });
});
