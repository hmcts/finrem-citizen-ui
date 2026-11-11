import { State } from '../../app/case/definition';

export const DashboardLatestUpdateTemplates = {
  REPRESENTED: 'represented',
  CLOSED: 'closed',
  ACTIVE: 'active',
} as const;

export type DashboardLatestCaseUpdateTemplate =
  (typeof DashboardLatestUpdateTemplates)[keyof typeof DashboardLatestUpdateTemplates];

/**
 * Selects which dashboard "latest update" template partial to render.
 *
 * @remarks
 * Priority order is:
 * 1. Represented users always see `represented`.
 * 2. Unrepresented users in `State.CLOSE` see `closed`.
 * 3. All other users see `active` giving access to user journeys such as general upload.
 *
 * @param isRepresented - Whether the current user is represented by a solicitor.
 * @param caseState - Current CCD case state from session case data.
 * @returns The dashboard latest update template partial name.
 */
export function getDashboardLatestCaseUpdateTemplate(isRepresented: boolean, caseState?: string): DashboardLatestCaseUpdateTemplate {
  if (isRepresented) {
    return DashboardLatestUpdateTemplates.REPRESENTED;
  }

  if (caseState === State.CLOSE) {
    return DashboardLatestUpdateTemplates.CLOSED;
  }

  return DashboardLatestUpdateTemplates.ACTIVE;
}
