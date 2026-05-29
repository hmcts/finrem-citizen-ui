import type { Application, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

import { CitizenUploadDocument, ListValue } from '../app/case/definition';
import { RouteNames } from '../common-constants';
import { getDocumentLabel, getSelectedDocumentTypesForDisplay } from '../functions/util/documentUtil';
import { oidcMiddleware } from '../middleware';
import { UploadStepId, uploadSteps } from '../upload-journey/config';

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
    const displayDocs = documentDetails.map(doc => ({
      id: doc.id,
      label: getDocumentLabel(doc.value?.DocumentType || ''),
      value: doc.value?.DocumentType || '',
    }));
    
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
    const displayDocs = documentDetails.map(doc => ({
      id: doc.id,
      label: getDocumentLabel(doc.value?.DocumentType || ''),
      value: doc.value?.DocumentType || '',
    }));
    
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

    res.render(step.template, {
      data: { selectedDocumentTypes },
      errors: {},
      values: { selectedDocumentTypes, fdrHearing },
      previousStep,
      email: 'FRCexample@justice.gov.uk',
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
      
      return res.render(step.template, {
        data: { selectedDocumentTypes },
        errors,
        values: { selectedDocumentTypes, fdrHearing },
        previousStep,
        email: 'FRCexample@justice.gov.uk',
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
