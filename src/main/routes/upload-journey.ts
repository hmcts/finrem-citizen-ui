import type { Application, Request, Response } from 'express';

import { RouteNames } from '../common-constants';
import { oidcMiddleware } from '../middleware';
import { UploadJourneyData, UploadStepId, uploadSteps } from '../upload-journey/config';

function getData(req: Request): UploadJourneyData {
  return req.session?.uploadJourneyData ?? {};
}

function setData(req: Request, data: UploadJourneyData): void {
  if (req.session) {
    req.session.uploadJourneyData = data;
  }
}

export default function setupUploadJourneyRoute(app: Application): void {
  app.get(`${RouteNames.uploadJourney}/:stepId`, oidcMiddleware, (req: Request, res: Response) => {
    const step = uploadSteps[req.params.stepId as UploadStepId];
    if (!step) {
      return res.status(404).send('Step not found');
    }

    const data = getData(req);
    const previousStep = step.previous ? step.previous(data) : null;

    res.render(step.template, {
      data,
      errors: {},
      values: data,
      previousStep,
      cancelUrl: RouteNames.dashboard,
      email: 'FRCexample@justice.gov.uk',
    });
  });

  app.post(`${RouteNames.uploadJourney}/:stepId`, oidcMiddleware, (req: Request, res: Response) => {
    const step = uploadSteps[req.params.stepId as UploadStepId];
    if (!step) {
      return res.status(404).send('Step not found');
    }

    const data = getData(req);

    const errors = step.validate ? step.validate(req.body) : {};
    if (Object.keys(errors).length > 0) {
      const previousStep = step.previous ? step.previous(data) : null;
      return res.render(step.template, {
        data,
        errors,
        values: { ...data, ...req.body },
        previousStep,
        cancelUrl: RouteNames.dashboard,
        email: 'FRCexample@justice.gov.uk',
      });
    }

    const newData = step.persist ? step.persist(req.body, data) : data;
    setData(req, newData);

    const nextStep = step.next ? step.next(newData) : null;
    if (nextStep) {
      return res.redirect(`${RouteNames.uploadJourney}/${nextStep}`);
    }

    res.redirect(`${RouteNames.uploadJourney}/${req.params.stepId}`);
  });

  app.get(RouteNames.uploadJourney, oidcMiddleware, (req: Request, res: Response) => {
    res.redirect(`${RouteNames.uploadJourney}/before-you-start`);
  });
}
