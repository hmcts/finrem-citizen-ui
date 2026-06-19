import type { Application, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { LoggerInstance } from 'winston';

import { CaseRole, CitizenUploadDocument, ListValue } from '../app/case/definition';
import { AppRequest } from '../app/controller/AppRequest';
import { DocumentManagerController } from '../app/document/DocumentManagerController';
import type {
  PreviouslyUploadedDocument,
  PreviouslyUploadedDocumentsCaseData,
} from '../app/document/PreviouslyUploadedDocumentClient';
import { RouteNames } from '../common-constants';
import { getCombinedPDFFormat, getDocumentRenameFormat,getSelectedDocumentTypesForDisplay, shouldAutoRename, shouldCombineIntoPDF, toDocumentTypeKey } from '../functions/util/documentUtil';
import { oidcMiddleware } from '../middleware';
import { UploadStepId, uploadSteps } from '../upload-journey/config';

const previouslyUploadedDocumentsRoute = `${RouteNames.uploadJourney}/previously-uploaded-documents`;
const documentIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

function getUploadedFilesByCombinedFormat(req: Request): Record<string, { id: string; filename: string; url: string; displayFilename: string; originalDocumentType: string }[]> {
  const uploadedDocuments = req.session.documents?.documentDetails || [];
  const uploadedFilesByCombinedFormat: Record<string, { id: string; filename: string; url: string; displayFilename: string; originalDocumentType: string }[]> = {};

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

    // Extract document ID from URL and construct download route
    const documentUrl = doc.value?.DocumentLink?.document_url || '';
    const extractedDocumentId = documentUrl.split('/').pop() || '';
    const downloadUrl = extractedDocumentId ? `/documents/${extractedDocumentId}/download` : '';

    // Group by combined PDF format if applicable, otherwise by original document type
    const groupKey = shouldCombineIntoPDF(kebabCase)
      ? getCombinedPDFFormat(kebabCase)
      : kebabCase;

    if (!uploadedFilesByCombinedFormat[groupKey]) {
      uploadedFilesByCombinedFormat[groupKey] = [];
    }
    uploadedFilesByCombinedFormat[groupKey].push({
      id: doc.id || '',
      filename: originalFilename,
      url: downloadUrl,
      displayFilename: originalFilename,
      originalDocumentType: kebabCase,
    });
  });

  return uploadedFilesByCombinedFormat;
}

function getDocumentGroupsForCheckPage(req: Request): { groupKey: string; label: string; files: { id: string; filename: string; url: string; displayFilename: string }[]; willCombine: boolean }[] {
  const filesByCombinedFormat = getUploadedFilesByCombinedFormat(req);
  const selectedDocumentTypes = getSelectedDocumentTypesForDisplay(req);

  const labelMap = new Map<string, string>();
  selectedDocumentTypes.forEach(docType => {
    labelMap.set(docType.value, docType.label);
  });

  const groups: { groupKey: string; label: string; files: { id: string; filename: string; url: string; displayFilename: string }[]; willCombine: boolean }[] = [];

  // Process each group
  Object.entries(filesByCombinedFormat).forEach(([groupKey, files]) => {
    // Check if this is a combined format or original document type
    const isCombinedFormat = files.length > 0 && shouldCombineIntoPDF(files[0].originalDocumentType);

    let label: string;
    if (isCombinedFormat) {
      // For combined formats, use the label from the first document type in the group
      label = labelMap.get(files[0].originalDocumentType) || groupKey;
    } else {
      // For non-combined, use the original document type label
      label = labelMap.get(groupKey) || groupKey;
    }

    groups.push({
      groupKey,
      label,
      files: files.map(f => ({
        id: f.id,
        filename: f.filename,
        url: f.url,
        displayFilename: f.displayFilename,
      })),
      willCombine: isCombinedFormat,
    });
  });

  return groups;
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
      // Capture the document type being removed
      const removedDocType = documentDetails[index]?.value?.DocumentType;

      // Remove from DocumentSelection
      documentDetails.splice(index, 1);

      if (req.session.DocumentSelection) {
        req.session.DocumentSelection.documentDetails = documentDetails;
      }

      // Clean up uploaded files for this document type
      if (removedDocType && req.session.documents?.documentDetails) {
        // Normalize both document types to kebab-case for comparison
        // removedDocType is already kebab-case from DocumentSelection
        // but uploaded DocumentType is an enum value, so normalize it
        const removedDocTypeKey = toDocumentTypeKey(removedDocType);
        
        req.session.documents.documentDetails = 
          req.session.documents.documentDetails.filter(doc => {
            const uploadedDocTypeKey = doc.value?.DocumentType 
              ? toDocumentTypeKey(doc.value.DocumentType)
              : '';
            return uploadedDocTypeKey !== removedDocTypeKey;
          });
      }

      // Clear upload errors for this document type
      if (removedDocType && req.session.uploadErrors) {
        delete req.session.uploadErrors[removedDocType];
      }
    }

    req.session.save((err) => {
      if (err) {
        return res.status(500).json({ success: false, error: 'Failed to save session' });
      }
      
      // Map to display format for frontend
      const displayDocs = getSelectedDocumentTypesForDisplay(req);
      res.json({ success: true, documents: displayDocs });
    });
  });

  app.get(
    previouslyUploadedDocumentsRoute,
    oidcMiddleware,
    async (req: Request, res: Response, next) => {
      const logger: LoggerInstance = console as unknown as LoggerInstance;
      const documentManagerController = new DocumentManagerController(logger);

      try {
        if (!req.session.caseNumber) {
          throw new Error('No case number in session');
        }

        const caseRole = req.session.user?.caseRole;
        if (!caseRole) {
          throw new Error('No case role in session');
        }

        const response =
          await documentManagerController.previouslyUploadedDocuments(
            req as unknown as AppRequest,
            res,
            req.session.caseNumber
          );

        const caseData = response?.case_details?.case_data;
        const documents = getPreviouslyUploadedDocumentsByRole(caseRole, caseData);

        const documentRows = documents.map(document => {
          const value = document.value;
          const documentLink = value?.DocumentLink;
          const documentId = getDocumentIdFromUrl(documentLink?.document_url);
          const fileName = value?.DocumentFileName ?? documentLink?.document_filename ?? '';
          const documentNameCell = createdocumentNameCell(documentId, fileName);

          return [
            {
              text: documentLink?.upload_timestamp
                ? formatUploadDate(documentLink.upload_timestamp)
                : '',
            },
            {
              text: value?.DocumentType ?? '',
            },
            documentNameCell,
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
    const documentGroups = req.params.stepId === 'check-upload' 
      ? getDocumentGroupsForCheckPage(req)
      : undefined;

    // Get upload errors from session
    const uploadErrors = req.session.uploadErrors || {};
    delete req.session.uploadErrors;

    res.render(step.template, {
      data: { selectedDocumentTypes, uploadedFiles: uploadedFilesByType, documentGroups },
      errors: uploadErrors,
      values: { selectedDocumentTypes, fdrHearing },
      previousStep,
      email: 'FRCexample@justice.gov.uk',
      caseUserName: req.session.caseUserName,
      shouldAutoRename,
      getDocumentRenameFormat,
      shouldCombineIntoPDF,
      getCombinedPDFFormat,
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
      const documentGroups = req.params.stepId === 'check-upload' 
        ? getDocumentGroupsForCheckPage(req)
        : undefined;

      return res.render(step.template, {
        data: { selectedDocumentTypes, uploadedFiles: uploadedFilesByType, documentGroups },
        errors,
        values: { selectedDocumentTypes, fdrHearing, uploadMore: req.body.uploadMore },
        previousStep,
        email: 'FRCexample@justice.gov.uk',
        caseUserName: req.session.caseUserName,
        shouldAutoRename,
        getDocumentRenameFormat,
        shouldCombineIntoPDF,
        getCombinedPDFFormat,
      });
    }

    // Save FDR hearing answer to DocumentSelection
    if (req.body.fdrHearing) {
      if (!req.session.DocumentSelection) {
        req.session.DocumentSelection = {};
      }
      req.session.DocumentSelection.isFinancialDisputeResolution = req.body.fdrHearing === 'true';
    }

    const nextStep = step.next ? step.next(req.body) : null;
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

function getPreviouslyUploadedDocumentsByRole(
  caseRole: CaseRole,
  caseData?: PreviouslyUploadedDocumentsCaseData
): PreviouslyUploadedDocument[] {
  if (caseRole === CaseRole.APPLICANT) {
    return caseData?.citizenApplicantDocument ?? [];
  } else if (caseRole === CaseRole.RESPONDENT) {
    return caseData?.citizenRespondentDocument ?? [];
  } else {
    throw new Error(`Unsupported case role: ${caseRole}`);
  }
}

function getDocumentIdFromUrl(documentUrl?: string): string | undefined {
  if (!documentUrl) {
    return undefined;
  }

  let pathname: string;
  try {
    pathname = new URL(documentUrl, 'http://localhost').pathname;
  } catch {
    return undefined;
  }

  const pathSegments = pathname.split('/').filter(Boolean);
  const documentsSegmentIndex = pathSegments.findIndex(segment => segment === 'documents');
  const documentId = documentsSegmentIndex >= 0
    ? pathSegments[documentsSegmentIndex + 1]
    : undefined;

  return documentId && documentIdPattern.test(documentId)
    ? documentId
    : undefined;
}

function getDocumentDownloadRoute(documentId: string): string {
  return RouteNames.documentDownload.replace(':documentId', encodeURIComponent(documentId));
}

function createdocumentNameCell(documentId: string | undefined, fileName: string): { html: string } | { text: string } {
  if (documentId && fileName) {
    return {
      html: `<a class="govuk-link" href="${getDocumentDownloadRoute(documentId)}">${escapeHtml(fileName)}</a>`,
    };
  }

  return {
    text: fileName,
  };
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
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
