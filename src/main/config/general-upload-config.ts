import type { Request } from 'express';

import { UploadStepNames, ViewNames } from '../common-constants';
import { toDocumentTypeKey } from '../functions/util/documentUtil';

export type UploadStepId = typeof UploadStepNames[keyof typeof UploadStepNames];

export type UploadStep = {
  template: string;
  validate?: (body: Record<string, unknown>, req?: Request) => Record<string, string>;
  next?: (body?: Record<string, unknown>) => UploadStepId | null;
  previous?: (req?: Request) => UploadStepId | null;
};

export const uploadSteps: Record<UploadStepId, UploadStep> = {

  [UploadStepNames.BeforeYouStart]: {
    template: 'generalUpload/before-you-start',
    next: () => UploadStepNames.Confidentiality,
    previous: () => null,
  },

  [UploadStepNames.PUD]: {
    template: 'generalUpload/previously-uploaded-documents',
    next: () => null,
    previous: () => ViewNames.Dashboard,
  },

  [UploadStepNames.Confidentiality]: {
    template: 'generalUpload/confidentiality',
    next: () => UploadStepNames.FDR,
    previous: () => UploadStepNames.BeforeYouStart,
  },

  [UploadStepNames.FDR]: {
    template: 'generalUpload/fdr',
    validate: (body: Record<string, unknown>) => {
      const errors: Record<string, string> = {};
      if (!body.fdrHearing) {
        errors.fdrHearing = 'Select yes if you are uploading these documents for a Financial Dispute Resolution hearing';
      }
      return errors;
    },
    next: () => UploadStepNames.DocumentTypeSelection,
    previous: () => UploadStepNames.Confidentiality,
  },

  [UploadStepNames.DocumentTypeSelection]: {
    template: 'generalUpload/document-type-selection',
    validate: (body: Record<string, unknown>, req?: Request) => {
      const errors: Record<string, string> = {};

      const documentDetails = req?.session?.DocumentSelection?.documentDetails;
      if (!documentDetails || documentDetails.length === 0) {
        errors.documents = 'You must select what you want to upload';
      }

      return errors;
    },
    next: () => UploadStepNames.UploadDocuments,
    previous: (req?: Request) => {
      const referrer = req?.session?.DocumentSelection?.documentTypeSelectionReferrer;
      return referrer || UploadStepNames.FDR;
    },
  },

  [UploadStepNames.UploadDocuments]: {
    template: 'generalUpload/upload-documents',
    validate: (body: Record<string, unknown>, req?: Request) => {
      const errors: Record<string, string> = {};

      const selectedDocTypes = req?.session?.DocumentSelection?.documentDetails || [];
      const uploadedDocs = req?.session?.documents?.documentDetails || [];

      // Uploaded files store DocumentType as the enum value (e.g. "Bank statements"),
      // while selected types store the kebab-case value (e.g. "bank-statements").
      // Normalise both to the kebab-case key before comparing.
      const uploadedDocTypeSet = new Set(
        uploadedDocs
          .map(doc => (doc.value?.DocumentType ? toDocumentTypeKey(doc.value.DocumentType) : ''))
          .filter(Boolean)
      );

      selectedDocTypes.forEach(selectedDoc => {
        const docType = selectedDoc.value?.DocumentType;
        if (docType && !uploadedDocTypeSet.has(docType)) {
          errors[docType] = 'You must upload at least one file before continuing';
          errors.upload = 'You must upload at least one file before continuing';
        }
      });

      return errors;
    },
    next: () => UploadStepNames.CheckUpload,
    previous: () => UploadStepNames.DocumentTypeSelection,
  },

  [UploadStepNames.CheckUpload]: {
    template: 'generalUpload/check-upload',
    validate: (body: Record<string, unknown>) => {
      const errors: Record<string, string> = {};
      if (!body.uploadMore) {
        errors.uploadMore = 'Select yes if you want to upload any other documents';
      }
      return errors;
    },
    next: (body?: Record<string, unknown>) => {
      if (body?.uploadMore === 'yes') {
        return UploadStepNames.DocumentTypeSelection;
      }
      return UploadStepNames.SendToOtherParty;
    },
    previous: () => UploadStepNames.UploadDocuments,
  },

  [UploadStepNames.SendToOtherParty]: {
    template: 'generalUpload/send-to-other-party',
    validate: (body: Record<string, unknown>) => {
      const errors: Record<string, string> = {};
      if (body.understand !== 'yes') {
        errors.understand = "You must select 'I understand' before continuing";
      }
      return errors;
    },
    next: () => UploadStepNames.Confirmation,
    previous: () => UploadStepNames.CheckUpload,
  },

  [UploadStepNames.Confirmation]: {
    template: 'generalUpload/confirmation',
    next: () => null,
    previous: () => UploadStepNames.SendToOtherParty,
  }

};
