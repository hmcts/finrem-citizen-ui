import nunjucksEnv from '../../nunjucks';

const { expect } = require('chai');

describe('Task list warning message component tests', function () {
  it('should show warning message', function () {
    const component =
      '{% from "macros/task-list/warning-message.njk" import warningMessage %}{{ warningMessage("2026-01-22", []) }}';
    const output = nunjucksEnv.renderString(component).trim();

    expect(output).to.not.be.empty;
    expect(output).contains('id="task-list-warning-message"');
    expect(output).contains(
      'One or more of your tasks are overdue. You must complete\n' +
        '    and upload your completed documents as soon as possible. If you do not submit your documents, you may be\n' +
        "    ordered to pay the other party's legal costs."
    );
  });

  it('should not show warning message', function () {
    const component =
      '{% from "macros/task-list/warning-message.njk" import warningMessage %}{{ warningMessage("2026-01-22", "[\n' +
      "      'financial_statement_e_e1_e2.pdf',\n" +
      "      'financial_evidence_for_your_form_e.pdf',\n" +
      "      'questionaire.pdf',\n" +
      "      'property_valuation.pdf',\n" +
      "      'potential_borrowing_capacity.pdf',\n" +
      "      'future_housing_needs.pdf',\n" +
      "      'chronology.pdf',\n" +
      "      'statement_of_issues.pdf',\n" +
      "      'response_to_the_notice_of_a_first_appointment_g.pdf',\n" +
      "      'non_court_dispute_resolution_fms.pdf',\n" +
      "      'composite_case_summary_es1.pdf',\n" +
      "      'composite_schedule_of_assets_and_income_es2.pdf',\n" +
      "      'statement_of_costs_incurred_h.pdf',\n" +
      "      'hearing_bundle.pdf',\n" +
      "      'position_statement_for_the_hearing.pdf',\n" +
      '    ]") }}';
    const output = nunjucksEnv.renderString(component).trim();

    expect(output).to.be.empty;
  });
});
