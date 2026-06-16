import type { Application, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { LoggerInstance } from 'winston';

import { CitizenUploadDocument, ListValue } from '../app/case/definition';
import { AppRequest } from '../app/controller/AppRequest';
import { DocumentManagerController } from '../app/document/DocumentManagerController';
import { RouteNames } from '../common-constants';
import { getDocumentRenameFormat,getSelectedDocumentTypesForDisplay, shouldAutoRename } from '../functions/util/documentUtil';
import { oidcMiddleware } from '../middleware';
import { UploadStepId, uploadSteps } from '../upload-journey/config';

function getUploadedFilesByType(req: Request): Record<string, { id: string; filename: string; url: string; displayFilename: string }[]> {
  const uploadedDocuments = req.session.documents?.documentDetails || [];
  const uploadedFilesByType: Record<string, { id: string; filename: string; url: string; displayFilename: string }[]> = {};

  uploadedDocuments.forEach(doc => {
    // DocumentType is stored as enum value (e.g., "Chronology")
    // Convert to kebab-case to match template expectations (e.g., "chronology")
    const enumValue = doc.value?.DocumentType || '';
    const kebabCase = enumValue
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/\//g, '-')  // Replace slashes with hyphens
      .replace(/[():,]/g, '')  // Remove parentheses, colons, and commas
      .replace(/-+/g, '-');  // Collapse multiple hyphens into one

    const originalFilename = doc.value?.DocumentFileName || '';

    // Check if this document type should be auto-renamed
    const displayFilename = shouldAutoRename(kebabCase)
      ? generateRenamedFilename(kebabCase, originalFilename, req.session.caseUserName)
      : originalFilename;

    // Extract document ID from URL and construct download route
    const documentUrl = doc.value?.DocumentLink?.document_url || '';
    const extractedDocumentId = documentUrl.split('/').pop() || '';
    const downloadUrl = extractedDocumentId ? `/documents/${extractedDocumentId}/download` : '';

    if (!uploadedFilesByType[kebabCase]) {
      uploadedFilesByType[kebabCase] = [];
    }
    uploadedFilesByType[kebabCase].push({
      id: doc.id || '',
      filename: originalFilename,
      url: downloadUrl,
      displayFilename,
    });
  });

  return uploadedFilesByType;
}

function generateRenamedFilename(documentTypeValue: string, originalFilename: string, caseUserName?: string): string {
  const format = getDocumentRenameFormat(documentTypeValue);
  if (!format) {
    return originalFilename;
  }

  // Extract file extension
  const extension = originalFilename.substring(originalFilename.lastIndexOf('.'));

  // Generate date string DD-MM-YYYY
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  const dateStr = `${day}-${month}-${year}`;

  // Format: UserName-DocumentType-DD-MM-YYYY.ext
  const userName = caseUserName || 'UserName';
  return `${userName}-${format}-${dateStr}${extension}`;
}

export default function setupUploadJourneyRoute(app: Application): void {
  app.post(`${RouteNames.uploadJourney}/document-type-selection/add`, oidcMiddleware, (req: Request, res: Response) => {
    if (!req.session.DocumentSelection) {
      req.session.DocumentSelection = {};
    }

    const documentDetails = req.session.DocumentSelection.documentDetails || [];

    const newDocument: ListValue<Partial<CitizenUploadDocument>> = {
      id: uuidv4(),
      value: {
        DocumentType: req.body.value,
      },
    };

    documentDetails.push(newDocument);
    req.session.DocumentSelection.documentDetails = documentDetails;

    // Map to display format for frontend
    const displayDocs = getSelectedDocumentTypesForDisplay(req);

    res.json({ success: true, documents: displayDocs });
  });

  app.delete(`${RouteNames.uploadJourney}/document-type-selection/remove/:index`, oidcMiddleware, (req: Request, res: Response) => {
    const documentDetails = req.session.DocumentSelection?.documentDetails || [];
    const indexParam = Array.isArray(req.params.index) ? req.params.index[0] : req.params.index;
    const index = parseInt(indexParam, 10);

    if (index >= 0 && index < documentDetails.length) {
      documentDetails.splice(index, 1);

      if (req.session.DocumentSelection) {
        req.session.DocumentSelection.documentDetails = documentDetails;
      }
    }

    // Map to display format for frontend
    const displayDocs = getSelectedDocumentTypesForDisplay(req);

    res.json({ success: true, documents: displayDocs });
  });

  app.get(
    `${RouteNames.uploadJourney}/previously-uploaded-documents`,
    oidcMiddleware,
    async (req: Request, res: Response, next) => {
      const logger: LoggerInstance = console as unknown as LoggerInstance;
      const documentManagerController = new DocumentManagerController(logger);

      try {
        if (!req.session.caseNumber) {
          throw new Error('No case number in session');
        }

        const response =
          await documentManagerController.previouslyUploadedDocuments(
            req as unknown as AppRequest,
            res,
            req.session.caseNumber
          );

        const caseData = response?.case_details?.case_data;
        const documents =
          caseData?.citizenApplicantDocument ??
          caseData?.citizenRespondentDocument ??
          [];

        const documentRows = documents.map(document => {
          const value = document.value;
          const documentLink = value?.DocumentLink;
          const documentId = getDocumentIdFromUrl(documentLink?.document_url);
          return [
            {
              text: documentLink?.upload_timestamp
                ? formatUploadDate(documentLink.upload_timestamp)
                : '',
            },
            {
              text: value?.DocumentType ?? '',
            },
            {
              html: documentId
                ? `<a class="govuk-link" href="${RouteNames.documentDownload.replace(':documentId', documentId)}">${value?.DocumentFileName ?? documentLink?.document_filename}</a>`
                : value?.DocumentFileName ?? '',
            },
          ];
        });

        res.render('upload-journey/previously-uploaded-documents', {
          documentRows,
        });
      } catch (error) {
        next(error);
      }
    }
  );

  app.get(`${RouteNames.uploadJourney}/:stepId`, oidcMiddleware, (req: Request, res: Response) => {
    const step = uploadSteps[req.params.stepId as UploadStepId];
    if (!step) {
      return res.status(404).send('Step not found');
    }

    const previousStep = step.previous ? step.previous() : null;

    // Map DocumentSelection to display format
    const selectedDocumentTypes = getSelectedDocumentTypesForDisplay(req);

    // Get FDR value from session
    const fdrHearing = req.session.DocumentSelection?.isFinancialDisputeResolution;

    // Get uploaded documents grouped by document type
    const uploadedFilesByType = getUploadedFilesByType(req);

    // Get upload errors from session
    const uploadErrors = req.session.uploadErrors || {};
    delete req.session.uploadErrors;

    res.render(step.template, {
      data: { selectedDocumentTypes, uploadedFiles: uploadedFilesByType },
      errors: uploadErrors,
      values: { selectedDocumentTypes, fdrHearing },
      previousStep,
      email: 'FRCexample@justice.gov.uk',
      caseUserName: req.session.caseUserName,
      shouldAutoRename,
      getDocumentRenameFormat,
    });
  });

  app.post(`${RouteNames.uploadJourney}/:stepId`, oidcMiddleware, (req: Request, res: Response) => {
    const step = uploadSteps[req.params.stepId as UploadStepId];
    if (!step) {
      return res.status(404).send('Step not found');
    }

    const errors = step.validate ? step.validate(req.body, req) : {};
    if (Object.keys(errors).length > 0) {
      const previousStep = step.previous ? step.previous() : null;

      // Map DocumentSelection to display format
      const selectedDocumentTypes = getSelectedDocumentTypesForDisplay(req);

      const fdrHearing = req.body.fdrHearing
        ? req.body.fdrHearing === 'true'
        : undefined;

      // Get uploaded documents grouped by document type
      const uploadedFilesByType = getUploadedFilesByType(req);

      return res.render(step.template, {
        data: { selectedDocumentTypes, uploadedFiles: uploadedFilesByType },
        errors,
        values: { selectedDocumentTypes, fdrHearing },
        previousStep,
        email: 'FRCexample@justice.gov.uk',
        caseUserName: req.session.caseUserName,
        shouldAutoRename,
        getDocumentRenameFormat,
      });
    }

    // Save FDR hearing answer to DocumentSelection
    if (req.body.fdrHearing) {
      if (!req.session.DocumentSelection) {
        req.session.DocumentSelection = {};
      }
      req.session.DocumentSelection.isFinancialDisputeResolution = req.body.fdrHearing === 'true';
    }

    const nextStep = step.next ? step.next() : null;
    const redirectUrl = nextStep
      ? `${RouteNames.uploadJourney}/${nextStep}`
      : `${RouteNames.uploadJourney}/${req.params.stepId}`;

    req.session.save((err) => {
      if (err) {
        throw err;
      }
      res.redirect(redirectUrl);
    });
  });

  app.get(RouteNames.uploadJourney, oidcMiddleware, (req: Request, res: Response) => {
    res.redirect(`${RouteNames.uploadJourney}/before-you-start`);
  });

}

function getDocumentIdFromUrl(documentUrl?: string): string | undefined {
  return documentUrl?.split('/documents/')[1];
}

function formatUploadDate(timestamp: string): string {
  const date = new Date(timestamp);

  const formatted = date.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return formatted
    .replace(',', ' at')
    .replace(' am', 'am')
    .replace(' pm', 'pm');
}
