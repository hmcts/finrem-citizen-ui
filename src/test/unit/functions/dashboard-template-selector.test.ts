import { describe, expect, it } from '@jest/globals';

import { State } from '../../../main/app/case/definition';
import {
  DashboardLatestUpdateTemplates,
  getDashboardLatestCaseUpdateTemplate,
} from '../../../main/functions/util/dashboard-template-selector';

describe('getDashboardLatestCaseUpdateTemplate', () => {
  it('returns represented template when user is represented', () => {
    expect(getDashboardLatestCaseUpdateTemplate(true, State.CLOSE)).toBe(
      DashboardLatestUpdateTemplates.REPRESENTED
    );
  });

  it('returns closed template when case state is close and user is not represented', () => {
    expect(getDashboardLatestCaseUpdateTemplate(false, State.CLOSE)).toBe(
      DashboardLatestUpdateTemplates.CLOSED
    );
  });

  it('returns active template for non-closed states when user is not represented', () => {
    expect(getDashboardLatestCaseUpdateTemplate(false, State.ORDER_MADE)).toBe(
      DashboardLatestUpdateTemplates.ACTIVE
    );
  });

  it('returns active template when case state is missing and user is not represented', () => {
    expect(getDashboardLatestCaseUpdateTemplate(false, undefined)).toBe(
      DashboardLatestUpdateTemplates.ACTIVE
    );
  });
});
