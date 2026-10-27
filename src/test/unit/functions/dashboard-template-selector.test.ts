import { describe, expect, it } from '@jest/globals';

import { State } from '../../../main/app/case/definition';
import {
  DashboardLatestCaseUpdateTemplates,
  getDashboardLatestCaseUpdateTemplate,
} from '../../../main/functions/util/dashboard-template-selector';

describe('getDashboardLatestCaseUpdateTemplate', () => {
  it('returns represented template when user is represented', () => {
    expect(getDashboardLatestCaseUpdateTemplate(true, State.CLOSE)).toBe(
      DashboardLatestCaseUpdateTemplates.REPRESENTED
    );
  });

  it('returns closed template when case state is close and user is not represented', () => {
    expect(getDashboardLatestCaseUpdateTemplate(false, State.CLOSE)).toBe(
      DashboardLatestCaseUpdateTemplates.CLOSED
    );
  });

  it('returns active template for non-closed states when user is not represented', () => {
    expect(getDashboardLatestCaseUpdateTemplate(false, State.ORDER_MADE)).toBe(
      DashboardLatestCaseUpdateTemplates.ACTIVE
    );
  });

  it('returns active template when case state is missing and user is not represented', () => {
    expect(getDashboardLatestCaseUpdateTemplate(false, undefined)).toBe(
      DashboardLatestCaseUpdateTemplates.ACTIVE
    );
  });
});
