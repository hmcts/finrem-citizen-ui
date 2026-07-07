require('dotenv').config();
import config from 'config';

const NotifyClient = require('notifications-node-client').NotifyClient;

export async function sendNotification(
  templateId: string,
  recipientEmail: string,
  personalisation: Record<string, unknown>
): Promise<void> {
  const GOVUK_NOTIFY_API_KEY = config.get<string>('secrets.finrem.GOV-UK-NOTIFICATION-KEY');

  if (!GOVUK_NOTIFY_API_KEY) {
    throw new Error('GOV Notify API key not configured');
  }

  if (!templateId) {
    throw new Error('Template ID not configured');
  }

  const notifyClient = new NotifyClient(GOVUK_NOTIFY_API_KEY);

  await notifyClient.sendEmail(templateId, recipientEmail, {
    personalisation,
    reference: `finrem-notification-${Date.now()}`
  });
}
