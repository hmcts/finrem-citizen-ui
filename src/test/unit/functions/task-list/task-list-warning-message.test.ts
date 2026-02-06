import { taskListWarningMessage } from '../../../../main/functions/task-list/task-list-warning-message';

describe('taskListWarningMessage tests', () => {
  function firstHearingDate(offset: number) {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');

    const formatted = `${yyyy}-${mm}-${dd}`;
    return formatted;
  }

  it('should return false: no warning message expected', () => {
    const documents = [
      'financial_statement_e_e1_e2.pdf',
      'financial_evidence_for_your_form_e.pdf',
      'questionaire.pdf',
      'property_valuation.pdf',
      'potential_borrowing_capacity.pdf',
      'future_housing_needs.pdf',
      'chronology.pdf',
      'statement_of_issues.pdf',
      'response_to_the_notice_of_a_first_appointment_g.pdf',
      'non_court_dispute_resolution_fms.pdf',
      'composite_case_summary_es1.pdf',
      'composite_schedule_of_assets_and_income_es2.pdf',
      'statement_of_costs_incurred_h.pdf',
      'hearing_bundle.pdf',
      'position_statement_for_the_hearing.pdf',
    ];
    const warningMessage = taskListWarningMessage(firstHearingDate(35), documents);
    expect(warningMessage).toBe(false);
  });

  it('should return false: no warning message expected', () => {
    const warningMessage = taskListWarningMessage(firstHearingDate(45), []);
    expect(warningMessage).toBe(false);
  });

  it('should return true: warning message expected', () => {
    const documents = [
      'financial_statement_e_e1_e2.pdf',
      'financial_evidence_for_your_form_e.pdf',
      'questionaire.pdf',
      'property_valuation.pdf',
      'potential_borrowing_capacity.pdf',
      'future_housing_needs.pdf',
      'chronology.pdf',
      'statement_of_issues.pdf',
      'response_to_the_notice_of_a_first_appointment_g.pdf',
      'non_court_dispute_resolution_fms.pdf',
      'composite_case_summary_es1.pdf',
      'composite_schedule_of_assets_and_income_es2.pdf',
      'statement_of_costs_incurred_h.pdf',
      'hearing_bundle.pdf'
    ];
    const warningMessage = taskListWarningMessage(firstHearingDate(1), documents);
    expect(warningMessage).toBe(false);
  });

});
