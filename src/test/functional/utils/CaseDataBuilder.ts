import { CaseTypeValue } from '../config/case-data';
import config from '../config/config';
import { ReplacementAction } from '../types/replacement-action';
import { ccdApi } from './helpers/CcdApi';

/**
 * Builder for creating CCD cases with flexible configuration
 */
export class CaseDataBuilder {
  private caseType: CaseTypeValue;
  private eventId: string;
  private payloadPath: string = '';
  private username: string = '';
  private password: string = '';
  private replacements: ReplacementAction[] = [];

  constructor(caseType: CaseTypeValue, eventId: string) {
    this.caseType = caseType;
    this.eventId = eventId;
  }

  /**
   * Use caseworker credentials
   */
  withCaseWorkerUser(): this {
    this.username = config.caseworker.username;
    this.password = config.caseworker.password;
    return this;
  }

  /**
   * Use solicitor credentials
   */
  withSolicitorUser(): this {
    this.username = config.solicitor.username;
    this.password = config.solicitor.password;
    return this;
  }

  /**
   * Use citizen credentials
   */
  withCitizenUser(): this {
    this.username = config.citizen.username;
    this.password = config.citizen.password;
    return this;
  }

  /**
   * Use custom credentials
   */
  withUser(username: string, password: string): this {
    this.username = username;
    this.password = password;
    return this;
  }

  /**
   * Set the payload JSON file path
   */
  withPayload(payloadPath: string): this {
    this.payloadPath = payloadPath;
    return this;
  }

  /**
   * Add replacements to modify the payload
   */
  addReplacements(...replacements: ReplacementAction[]): this {
    this.replacements.push(...replacements);
    return this;
  }

  /**
   * Clear all replacements
   */
  clearReplacements(): this {
    this.replacements = [];
    return this;
  }

  /**
   * Create the case in CCD
   */
  async create(): Promise<string> {
    if (!this.username || !this.password) {
      throw new Error('User credentials not set. Call withCaseWorkerUser(), withSolicitorUser(), or withUser() first.');
    }

    if (!this.payloadPath) {
      throw new Error('Payload path not set. Call withPayload() first.');
    }

    return ccdApi.createCaseInCcd(
      this.username,
      this.password,
      this.payloadPath,
      this.caseType,
      this.eventId,
      this.replacements
    );
  }
}
