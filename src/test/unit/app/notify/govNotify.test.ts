import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import config from 'config';
import { NotifyClient } from 'notifications-node-client';

let sendEmailSpy: jest.SpiedFunction<NotifyClient['sendEmail']>;

jest.mock('config', () => ({
  get: jest.fn((key: string) => {
    const values: Record<string, string> = {
      'secrets.finrem.GOV-UK-NOTIFICATION-KEY': 'test-api-key',
    };
    return values[key] ?? '';
  }),
}));

import { sendNotification } from '../../../../main/app/notify/govNotify';

const personalisation = {
  caseReferenceNumber: '1234-5678-0123-4567',
  name: 'Test User',
  uploadTime: '03/07/2026, 17:00:00 BST',
  courtName: 'Birmingham Court',
  courtEmail: 'birmingham@hmcts.net',
};

describe('sendNotification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sendEmailSpy = jest.spyOn(NotifyClient.prototype, 'sendEmail').mockResolvedValue({} as never);
  });

  it('sends email with correct template ID, recipient and personalisation', async () => {
    await sendNotification('test-template-id', 'test@hmcts.net', personalisation);

    expect(sendEmailSpy).toHaveBeenCalledWith(
      'test-template-id',
      'test@hmcts.net',
      expect.objectContaining({ personalisation })
    );
  });

  it('throws when template ID is empty', async () => {
    await expect(sendNotification('', 'test@hmcts.net', personalisation)).rejects.toThrow('Template ID not configured');
  });

  it('throws when GOV Notify API key is missing', async () => {
    const configGetMock = config.get as unknown as jest.Mock;
    configGetMock.mockReturnValueOnce('');

    await expect(
      sendNotification('test-template-id', 'test@hmcts.net', personalisation)
    ).rejects.toThrow('GOV Notify API key not configured');
  });

  it('adds a deterministic notification reference prefix', async () => {
    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(1_735_123_456_789);

    await sendNotification('test-template-id', 'test@hmcts.net', personalisation);

    expect(sendEmailSpy).toHaveBeenCalledWith(
      'test-template-id',
      'test@hmcts.net',
      expect.objectContaining({
        reference: 'finrem-notification-1735123456789',
      })
    );

    nowSpy.mockRestore();
  });

  it('throws when sendEmail fails', async () => {
    sendEmailSpy.mockRejectedValue(new Error('Notify API error') as never);

    await expect(sendNotification('test-template-id', 'test@hmcts.net', personalisation)).rejects.toThrow('Notify API error');
  });
});
