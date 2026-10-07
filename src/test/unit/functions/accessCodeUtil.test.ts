import { describe, expect, it } from '@jest/globals';

import {
  EVENT_TYPE,
} from '../../../main/app/case/case-type';
import {
  AccessCodeCollection,
  CaseRole,
  FinremCaseData,
  YesOrNo,
} from '../../../main/app/case/definition';
import {
  AccessCodesByCitizenRole,
  buildLinkingEventPayload,
  findMatchingAccessCode,
  getAccessCodeCaseField,
  getCaseAccessCodesByRole,
  getEmailCaseField,
  getLinkingEventType,
  validateAccessCodeFormat,
} from '../../../main/functions/util/accessCodeUtil';

describe('validateAccessCodeFormat', () => {
  it('returns error when access code is empty', () => {
    expect(validateAccessCodeFormat(undefined)?.accessCode).toBe('Enter your access code');
    expect(validateAccessCodeFormat('')?.accessCode).toBe('Enter your access code');
    expect(validateAccessCodeFormat('   ')?.accessCode).toBe('Enter your access code');
  });

  it('returns error when access code is wrong length', () => {
    expect(validateAccessCodeFormat('ABC123')?.accessCode).toBe('Access code must be 8 characters');
    expect(validateAccessCodeFormat('ABC123456')?.accessCode).toBe('Access code must be 8 characters');
  });

  it('returns error when access code contains invalid characters', () => {
    expect(validateAccessCodeFormat('ABC-1234')?.accessCode).toBe('Access code must only include letters a-z, and numbers 0-9');
  });

  it('returns null for valid access codes', () => {
    expect(validateAccessCodeFormat('A1BCDE23')).toBeNull();
    expect(validateAccessCodeFormat('  ABC12345  ')).toBeNull();
  });
});

describe('findMatchingAccessCode', () => {
  const caseAccessCodesByRole: AccessCodesByCitizenRole = {
    [CaseRole.APPLICANT]: [
      {
        id: '1',
        value: {
          accessCode: 'AAAA1111',
          isValid: YesOrNo.YES,
        },
      },
    ],
    [CaseRole.RESPONDENT]: [
      {
        id: '2',
        value: {
          accessCode: 'BBBB2222',
          isValid: YesOrNo.YES,
        },
      },
    ],
  };

  it('finds matching applicant access code', () => {
    const result = findMatchingAccessCode(caseAccessCodesByRole, 'AAAA1111');
    expect('match' in result).toBe(true);
    if ('match' in result) {
      expect(result.role).toBe(CaseRole.APPLICANT);
      expect(result.match.value.accessCode).toBe('AAAA1111');
    }
  });

  it('finds matching respondent access code', () => {
    const result = findMatchingAccessCode(caseAccessCodesByRole, 'BBBB2222');
    expect('match' in result).toBe(true);
    if ('match' in result) {
      expect(result.role).toBe(CaseRole.RESPONDENT);
      expect(result.match.value.accessCode).toBe('BBBB2222');
    }
  });

  it('returns not-match error when access code does not exist', () => {
    const result = findMatchingAccessCode(caseAccessCodesByRole, 'CCCC3333');
    expect('errors' in result).toBe(true);
    if ('errors' in result) {
      expect(result.errors.accessCode).toBe('Access code does not match case number');
    }
  });

  it('returns used-code error when matching code is invalid', () => {
    const usedCodesByRole: AccessCodesByCitizenRole = {
      [CaseRole.APPLICANT]: [
        {
          id: '1',
          value: {
            accessCode: 'AAAA1111',
            isValid: YesOrNo.NO,
          },
        },
      ],
      [CaseRole.RESPONDENT]: [],
    };

    const result = findMatchingAccessCode(usedCodesByRole, 'AAAA1111');
    expect('errors' in result).toBe(true);
    if ('errors' in result) {
      expect(result.errors.accessCode).toBe('The access code you entered has already been used, you should contact the court.');
    }
  });
});

describe('getCaseAccessCodesByRole', () => {
  it('returns both role collections with defaults', () => {
    const caseData = {
      applicantAccessCodes: [{ id: 'a1', value: { accessCode: 'AAAA1111', isValid: YesOrNo.YES } }],
    } as unknown as FinremCaseData;

    const result = getCaseAccessCodesByRole(caseData);
    expect(result[CaseRole.APPLICANT]).toHaveLength(1);
    expect(result[CaseRole.RESPONDENT]).toEqual([]);
  });
});

describe('getEmailCaseField', () => {
  it('returns applicantEmail for applicant role', () => {
    expect(getEmailCaseField(CaseRole.APPLICANT)).toBe('applicantEmail');
  });

  it('returns respondentEmail for respondent role', () => {
    expect(getEmailCaseField(CaseRole.RESPONDENT)).toBe('respondentEmail');
  });
});

describe('getAccessCodeCaseField', () => {
  it('returns applicantAccessCodes for applicant role', () => {
    expect(getAccessCodeCaseField(CaseRole.APPLICANT)).toBe('applicantAccessCodes');
  });

  it('returns respondentAccessCodes for respondent role', () => {
    expect(getAccessCodeCaseField(CaseRole.RESPONDENT)).toBe('respondentAccessCodes');
  });
});

describe('buildLinkingEventPayload', () => {
  it('builds applicant payload and marks matched code as used', () => {
    const accessCodesForRole: AccessCodeCollection[] = [
      {
        id: '1',
        value: {
          accessCode: 'AAAA1111',
          isValid: YesOrNo.YES,
        },
      },
      {
        id: '2',
        value: {
          accessCode: 'BBBB2222',
          isValid: YesOrNo.YES,
        },
      },
    ];

    const payload = buildLinkingEventPayload({
      matchingAccessCode: { role: CaseRole.APPLICANT, match: accessCodesForRole[0] },
      caseAccessCodesByRole: {
        [CaseRole.APPLICANT]: accessCodesForRole,
        [CaseRole.RESPONDENT]: [],
      },
      userId: 'user-123',
      userEmail: 'user@example.com',
    });

    expect(payload.applicantEmail).toBe('user@example.com');
    expect(payload.applicantAccessCodes).toEqual([
      {
        id: '1',
        value: {
          accessCode: 'AAAA1111',
          isValid: YesOrNo.NO,
          userIdamID: 'user-123',
        },
      },
      {
        id: '2',
        value: {
          accessCode: 'BBBB2222',
          isValid: YesOrNo.YES,
        },
      },
    ]);
  });

  it('builds respondent payload and only updates exact matching code', () => {
    const accessCodesForRole: AccessCodeCollection[] = [
      {
        id: '1',
        value: {
          accessCode: 'AAAA1111',
          isValid: YesOrNo.YES,
        },
      },
      {
        id: '2',
        value: {
          accessCode: 'CCCC3333',
          isValid: YesOrNo.YES,
        },
      },
    ];

    const payload = buildLinkingEventPayload({
      matchingAccessCode: { role: CaseRole.RESPONDENT, match: accessCodesForRole[1] },
      caseAccessCodesByRole: {
        [CaseRole.APPLICANT]: [],
        [CaseRole.RESPONDENT]: accessCodesForRole,
      },
    });

    expect(payload.respondentEmail).toBeUndefined();
    expect(payload.respondentAccessCodes?.[0]).toEqual({
      id: '1',
      value: {
        accessCode: 'AAAA1111',
        isValid: YesOrNo.YES,
      },
    });
    expect(payload.respondentAccessCodes?.[1]).toEqual({
      id: '2',
      value: {
        accessCode: 'CCCC3333',
        isValid: YesOrNo.NO,
        userIdamID: undefined,
      },
    });
  });
});

describe('getLinkingEventType', () => {
  it('returns applicant linking event for applicant role', () => {
    expect(getLinkingEventType(CaseRole.APPLICANT)).toBe(EVENT_TYPE.LINK_APPLICANT_TO_CASE);
  });

  it('returns respondent linking event for respondent role', () => {
    expect(getLinkingEventType(CaseRole.RESPONDENT)).toBe(EVENT_TYPE.LINK_RESPONDENT_TO_CASE);
  });
});
