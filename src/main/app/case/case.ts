import { AccessCodeCollection, FinremCaseData, State } from './definition';

export const formFieldsToCaseMapping: Partial<Record<keyof Case, keyof FinremCaseData>> = {};

export function formatCase<OutputFormat extends Record<string, unknown>>(
  fields: FieldFormats,
  data: Partial<Case> | FinremCaseData
): OutputFormat {
  const result: Record<string, unknown> = {};

  for (const field of Object.keys(data)) {
    const mappedField = fields[field];

    if (typeof mappedField === 'string') {
      result[mappedField] = (data as Record<string, unknown>)[field];
    }
  }

  return result as OutputFormat;
}

export type FieldFormats = Record<string, string | ((value: AnyObject) => AnyObject)>;

export interface Case {
  applicantAccessCode: AccessCodeCollection;
  respondentAccessCode: AccessCodeCollection;
}

export interface CaseWithId extends Case {
  id: string;
  state: State;
}

export enum Checkbox {
  Checked = 'checked',
  Unchecked = '',
}

export interface CaseDate {
  year: string;
  month: string;
  day: string;
}

export enum LanguagePreference {
  English = 'english',
  Welsh = 'welsh',
}

export interface UploadedFile {
  id: string;
  name: string;
}

export interface CaseWithId extends Case {
  id: string;
  state: State;
}

export type AnyObject = Record<string, unknown>;

