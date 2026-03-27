import { ReplacementAction } from '../types/replacement-action';
import { DateHelper } from './DateHelper';
import { envTestData } from './test_data/EnvTestDataConfig';

/**
 * Express pilot participating court replacement
 */
export const EXPRESS_PILOT_PARTICIPATING_COURT_REPLACEMENT: ReplacementAction[] = [
  {
    action: 'insert',
    key: 'regionList',
    value: 'midlands'
  },
  {
    action: 'insert',
    key: 'midlandsFRCList',
    value: 'birmingham'
  },
  {
    action: 'insert',
    key: 'birminghamCourtList',
    value: envTestData.EXPRESS_PILOT_COURT_ID
  }
];

/**
 * Estimated assets under 1M replacement
 */
export const ESTIMATED_ASSETS_UNDER_1M: ReplacementAction[] = [
  {
    action: 'insert',
    key: 'estimatedAssetsChecklist',
    value: 'underOneMillion'
  }
];

/**
 * Application issue date replacement factory
 */
export const APPLICATION_ISSUE_DATE = (date: string): ReplacementAction[] => [
  {
    action: 'insert',
    key: 'issueDate',
    value: date
  }
];

/**
 * Hearing date replacement factory
 */
export const HEARING_DATE = (date: string): ReplacementAction[] => [
  {
    action: 'insert',
    key: 'hearingDate',
    value: date
  }
];

/**
 * General application refer to judge list data
 */
export const REFER_LIST_DATA = (generalApplicationId: string): ReplacementAction[] => [
  {
    action: 'insert',
    key: 'generalApplicationReferList.value.code',
    value: generalApplicationId
  }
];

/**
 * General application outcome list data
 */
export const OUTCOME_LIST_DATA = (generalApplicationId: string): ReplacementAction[] => [
  {
    action: 'insert',
    key: 'generalApplicationOutcomeList.value.code',
    value: generalApplicationId
  }
];

/**
 * General application directions list data
 */
export const DIRECTIONS_LIST_DATA = (generalApplicationId: string): ReplacementAction[] => [
  {
    action: 'insert',
    key: 'generalApplicationDirectionsList.value.code',
    value: generalApplicationId
  }
];

/**
 * Draft order document details
 */
export const DRAFT_ORDER_DETAILS = async (): Promise<Record<string, string>> => ({
  hearingDate: await DateHelper.getHearingDateTwelveWeeksLaterInISOFormat(),
  courtOrderDate: await DateHelper.getHearingDateTwelveWeeksLaterInISOFormat(),
  documentUrl: envTestData.DOCUMENT_URL,
  documentBinaryUrl: envTestData.DOCUMENT_BINARY_URL,
  uploadTimestamp: await DateHelper.getCurrentTimestamp()
});
