/**
 * Defines actions for modifying JSON payloads
 */
export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export interface ReplacementAction {
  action: 'insert' | 'delete' | 'replace';
  key: string;
  value?: JsonValue;
}
