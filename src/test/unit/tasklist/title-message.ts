import nunjucksEnv from '../../nunjucks';

const { expect } = require('chai');

describe('Task list title message component tests', function () {
  it('should be rendered correctly', function () {
    const component =
      '{% from "macros/task-list/title-message.njk" import titleMessage %}{{ titleMessage("2026-01-22") }}';
    const output = nunjucksEnv.renderString(component).trim();

    expect(output).contains('Documents to submit before your hearing on 22 January 2026');
    expect(output).contains(
      "You must complete and submit all the documents listed below by the stated dates. Once submitted, the documents will be added to your case, ready for the judge to review at your hearing. The related task on this list will be marked as 'done'."
    );
  });
});
