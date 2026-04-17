require("dotenv").config();
import config from 'config';

const GOVUK_NOTIFY_API_KEY = config.get<string>('govNotify.apiKey');
const FINREM_CITIZEN_UI_TEMPLATE_ID = config.get<string>('govNotify.templateId');
const NotifyClient = require("notifications-node-client").NotifyClient;

interface EmailNotification {
  caseReferenceNumber: string;
  accessCode: string;
  user: string;
  email: string;
}

export async function notifyInvalidAccessCode(data: EmailNotification): Promise<void> {
  if (!GOVUK_NOTIFY_API_KEY) {
    throw new Error("GOV Notify API key not configured");
  }

  if (!FINREM_CITIZEN_UI_TEMPLATE_ID) {
    throw new Error("GOV Notify rejection template ID not configured");
  }

  const notifyClient = new NotifyClient(GOVUK_NOTIFY_API_KEY);

  await notifyClient.sendEmail(FINREM_CITIZEN_UI_TEMPLATE_ID, "abcd@HMCTS.NET", {
    personalisation: {
      "caseReferenceNumber": data.caseReferenceNumber,
      "user": data.user,
      "accessCode": data.accessCode
    },
    reference: `media-rejection-${Date.now()}`
  });
}
