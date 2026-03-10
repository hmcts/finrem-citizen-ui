import axios, { AxiosInstance } from 'axios';
import config from 'config';

const { Logger } = require('@hmcts/nodejs-logging');

const logger = Logger.getLogger('caseService');

interface UserCaseResponse {
  hasLinkedCase: boolean;
  caseId?: string;
}

class CaseService {
  private readonly client: AxiosInstance;

  constructor() {
    const baseURL = config.get<string>('services.case.url');
    const timeout = config.get<number>('services.case.timeout') || 10000;

    this.client = axios.create({
      baseURL,
      timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async checkUserHasLinkedCase(userId: string): Promise<boolean> {
    try {
      const response = await this.client.get<UserCaseResponse>(
        `/users/${userId}/linked-case`
      );
      return response.data.hasLinkedCase;
    } catch (error) {
      logger.error('Error checking linked case:', error);
      // Return false on error to allow user to proceed with entering case number
      return false;
    }
  }
}

export default new CaseService();
