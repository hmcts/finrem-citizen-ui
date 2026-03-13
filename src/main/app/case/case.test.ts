import {
  type Case,
  type CaseDate,
  type CaseWithId,
  Checkbox,
  type FieldFormats,
  LanguagePreference,
  type UploadedFile,
  formFieldsToCaseMapping,
  formatCase,
} from './case';
import { type AccessCodeCollection, type AccessCodeEntry, YesOrNo } from './definition';

const entry = (code: string): AccessCodeEntry => ({
  accessCode: code,
  createdAt: '2024-01-01',
  validUntil: '2024-12-31',
  isValid: YesOrNo.YES,
});

const collection = (id: string, code: string): AccessCodeCollection => ({
  id,
  value: entry(code),
});

describe('formatCase', () => {
  it('works when the input is FinremCaseData-shaped object (arrays of access codes)', () => {
    const fields: FieldFormats = {
      applicantAccessCodes: 'mapped_applicant_codes',
      respondentAccessCodes: 'mapped_respondent_codes',
    };

    const data = {
      applicantAccessCodes: [collection('a1', '111')],
      respondentAccessCodes: [collection('r1', '222')],
    } as Record<string, unknown>;

    const result = formatCase<Record<string, unknown>>(fields, data);

    expect(result).toEqual({
      mapped_applicant_codes: [collection('a1', '111')],
      mapped_respondent_codes: [collection('r1', '222')],
    });
  });

  it('maps fields using string targets and ignores unmapped keys for Case', () => {
    const fields: FieldFormats = {
      applicantAccessCode: 'applicant_access_code',
      respondentAccessCode: 'respondent_access_code',
    };

    const data: Partial<Case> = {
      applicantAccessCode: collection('a1', 'AAA111'),
      respondentAccessCode: collection('r1', 'BBB222'),
    };

    const result = formatCase<Record<string, unknown>>(fields, data);

    expect(result).toEqual({
      applicant_access_code: collection('a1', 'AAA111'),
      respondent_access_code: collection('r1', 'BBB222'),
    });
  });
});

describe('formFieldsToCaseMapping', () => {
  it('is defined and empty', () => {
    expect(typeof formFieldsToCaseMapping).toBe('object');
    expect(Object.keys(formFieldsToCaseMapping)).toHaveLength(0);
  });
});

describe('Types and enums', () => {
  it('Checkbox enum values', () => {
    expect(Checkbox.Checked).toBe('checked');
    expect(Checkbox.Unchecked).toBe('');
  });

  it('LanguagePreference enum values', () => {
    expect(LanguagePreference.English).toBe('english');
    expect(LanguagePreference.Welsh).toBe('welsh');
  });

  it('CaseDate structure', () => {
    const d: CaseDate = { year: '2024', month: '06', day: '01' };
    expect(d).toEqual({ year: '2024', month: '06', day: '01' });
  });

  it('UploadedFile structure', () => {
    const f: UploadedFile = { id: 'file-1', name: 'doc.pdf' };
    expect(f).toEqual({ id: 'file-1', name: 'doc.pdf' });
  });

  it('CaseWithId structure', () => {
    const c: CaseWithId = {
      id: '123',
      state: 'SomeState' as unknown as CaseWithId['state'],
      applicantAccessCode: collection('a1', 'ABC'),
      respondentAccessCode: collection('r1', 'DEF'),
    };

    expect(c.id).toBe('123');
  });
});
