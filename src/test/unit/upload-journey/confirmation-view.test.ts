import { describe, expect, it } from '@jest/globals';
import fs from 'fs';
import path from 'path';

describe('Upload confirmation view contract tests', () => {
  const confirmationTemplatePath = path.join(__dirname, '../../../main/views/upload-journey/confirmation.njk');
  const confirmationTemplate = fs.readFileSync(confirmationTemplatePath, 'utf-8');

  it('should include key confirmation content for documents uploaded and what happens next', () => {
    expect(confirmationTemplate).toContain('Documents uploaded');
    expect(confirmationTemplate).toContain('What happens next');
    expect(confirmationTemplate).toContain('Your documents have been uploaded and have been saved to your case');
    expect(confirmationTemplate).toContain('ready for the judge to review at your hearing');
    expect(confirmationTemplate).toContain('You can come back anytime to upload more documents.');
    expect(confirmationTemplate).toContain('You will receive an email to confirm that the upload was successful.');
  });

  it('should include account navigation links for viewing documents and returning to dashboard', () => {
    expect(confirmationTemplate).toContain('<a href="/dashboard" class="govuk-link">They can be viewed from your account</a>');
    expect(confirmationTemplate).toContain('Close and return to your account');
  });

  it('should include back-link navigation bound to previous step and getting-help macro', () => {
    expect(confirmationTemplate).toContain('<a href="/upload/{{ previousStep }}" class="govuk-back-link');
    expect(confirmationTemplate).toContain('{{ gettingHelp(contactEmail) }}');
  });
});
