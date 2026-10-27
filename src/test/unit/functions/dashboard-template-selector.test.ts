import { describe, expect, it } from '@jest/globals';

import { State } from '../../../main/app/case/definition';
import {
  DashboardLatestUpdateTemplates,
  getDashboardLatestUpdateTemplate,
} from '../../../main/functions/util/dashboard-template-selector';

describe('getDashboardLatestUpdateTemplate', () => {
  it('returns represented template when user is represented', () => {
    expect(getDashboardLatestUpdateTemplate(true, State.CLOSE)).toBe(
      DashboardLatestUpdateTemplates.REPRESENTED
    );
  });

  it('returns closed template when case state is close and user is not represented', () => {
    expect(getDashboardLatestUpdateTemplate(false, State.CLOSE)).toBe(
      DashboardLatestUpdateTemplates.CLOSED
    );
  });

  it('returns active template for non-closed states when user is not represented', () => {
    expect(getDashboardLatestUpdateTemplate(false, State.ORDER_MADE)).toBe(
      DashboardLatestUpdateTemplates.ACTIVE
    );
  });

  it('returns active template when case state is missing and user is not represented', () => {
    expect(getDashboardLatestUpdateTemplate(false, undefined)).toBe(
      DashboardLatestUpdateTemplates.ACTIVE
    );
  });
});
