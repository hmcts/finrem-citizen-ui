import { State } from '../../app/case/definition';

export const DashboardLatestCaseUpdateTemplates = {
  REPRESENTED: 'represented',
  CLOSED: 'closed',
  ACTIVE: 'active',
} as const;

export type DashboardLatestCaseUpdateTemplate =
  (typeof DashboardLatestCaseUpdateTemplates)[keyof typeof DashboardLatestCaseUpdateTemplates];

export function getDashboardLatestCaseUpdateTemplate(
  isRepresented: boolean, caseState: string | undefined
): DashboardLatestCaseUpdateTemplate {
  if (isRepresented) {
    return DashboardLatestCaseUpdateTemplates.REPRESENTED;
  }

  if (caseState === State.CLOSE) {
    return DashboardLatestCaseUpdateTemplates.CLOSED;
  }

  return DashboardLatestCaseUpdateTemplates.ACTIVE;
}
