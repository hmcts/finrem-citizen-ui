import { describe, expect, it } from '@jest/globals';

import nunjucksEnv from '../../nunjucks';

describe('Task list title message component tests', () => {
  it('should be rendered correctly', () => {
    const component =
      '{% from "macros/task-list/title-message.njk" import titleMessage %}{{ titleMessage("2026-01-22") }}';
    const output = nunjucksEnv.renderString(component).trim();

    expect(output).toContain('Documents to submit before your hearing on 22 January 2026');
    expect(output).toContain(
      "You must complete and submit all the documents listed below by the stated dates. Once submitted, the documents will be added to your case, ready for the judge to review at your hearing. The related task on this list will be marked as 'done'."
    );
  });
});
