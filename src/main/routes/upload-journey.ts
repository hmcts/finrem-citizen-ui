import type { Application, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

import { CitizenUploadDocument, ListValue } from '../app/case/definition';
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
      ? generateRenamedFilename(kebabCase, originalFilename)
      : originalFilename;
    
    if (!uploadedFilesByType[kebabCase]) {
      uploadedFilesByType[kebabCase] = [];
    }
    uploadedFilesByType[kebabCase].push({
      id: doc.id || '',
      filename: originalFilename,
      url: doc.value?.DocumentLink?.document_url || '',
      displayFilename,
    });
  });
  
  return uploadedFilesByType;
}

function generateRenamedFilename(documentTypeValue: string, originalFilename: string): string {
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
  return `UserName-${format}-${dateStr}${extension}`;
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

    res.render(step.template, {
      data: { selectedDocumentTypes, uploadedFiles: uploadedFilesByType },
      errors: {},
      values: { selectedDocumentTypes, fdrHearing },
      previousStep,
      email: 'FRCexample@justice.gov.uk',
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
      
      // Format errors for GOV.UK error summary
      const errorList = Object.entries(errors).map(([key, message]) => ({
        text: message,
        href: `#${key}`,
      }));
      
      return res.render(step.template, {
        data: { selectedDocumentTypes, uploadedFiles: uploadedFilesByType },
        errors: errorList,
        fieldErrors: errors,
        values: { selectedDocumentTypes, fdrHearing },
        previousStep,
        email: 'FRCexample@justice.gov.uk',
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
    if (nextStep) {
      return res.redirect(`${RouteNames.uploadJourney}/${nextStep}`);
    }

    res.redirect(`${RouteNames.uploadJourney}/${req.params.stepId}`);
  });

  app.get(RouteNames.uploadJourney, oidcMiddleware, (req: Request, res: Response) => {
    res.redirect(`${RouteNames.uploadJourney}/before-you-start`);
  });
}
