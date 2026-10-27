import { State } from '../../app/case/definition';

export const DashboardLatestUpdateTemplates = {
  REPRESENTED: 'represented',
  CLOSED: 'closed',
  ACTIVE: 'active',
} as const;

export type DashboardLatestUpdateTemplate =
  (typeof DashboardLatestUpdateTemplates)[keyof typeof DashboardLatestUpdateTemplates];

export function getDashboardLatestUpdateTemplate(
  isRepresented: boolean, caseState: string | undefined
): DashboardLatestUpdateTemplate {
  if (isRepresented) {
    return DashboardLatestUpdateTemplates.REPRESENTED;
  }

  if (caseState === State.CLOSE) {
    return DashboardLatestUpdateTemplates.CLOSED;
  }

  return DashboardLatestUpdateTemplates.ACTIVE;
}
