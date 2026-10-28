import { State } from '../../app/case/definition';

export const DashboardLatestUpdateTemplates = {
  REPRESENTED: 'represented',
  CLOSED: 'closed',
  ACTIVE: 'active',
} as const;

export type DashboardLatestCaseUpdateTemplate =
  (typeof DashboardLatestUpdateTemplates)[keyof typeof DashboardLatestUpdateTemplates];

export function getDashboardLatestCaseUpdateTemplate(isRepresented: boolean, caseState?: string): DashboardLatestCaseUpdateTemplate {
  if (isRepresented) {
    return DashboardLatestUpdateTemplates.REPRESENTED;
  }

  if (caseState === State.CLOSE) {
    return DashboardLatestUpdateTemplates.CLOSED;
  }

  return DashboardLatestUpdateTemplates.ACTIVE;
}
