import axios, { AxiosInstance } from 'axios';
import config from 'config';

import { getServiceAuthToken } from '../auth/service/get-service-auth-token';
import { DOCUMENT_TO_PDF_SERVICE_URL } from '../case/case-type';
import type { UserDetails } from '../controller/AppRequest';

export class DocumentToPdfClient {
  client: AxiosInstance;
  BASE_URL: string = config.get(DOCUMENT_TO_PDF_SERVICE_URL);

  constructor(private readonly user: UserDetails) {
    this.client = axios.create({
      baseURL: this.BASE_URL,
      headers: {
        Authorization: `Bearer ${this.user.accessToken}`,
        ServiceAuthorization: getServiceAuthToken(),
      },
    });
  }

  async convert(documentId: string): Promise<Buffer> {
    const response = await this.client.post(`/api/convert/${documentId}`, null, { responseType: 'arraybuffer' });
    if (response.status !== 200) {
      throw new Error(`Failed to convert document ${documentId} to PDF: status ${response.status}`);
    }
    return Buffer.from(response.data);
  }
}
