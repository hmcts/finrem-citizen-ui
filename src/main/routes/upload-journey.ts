import type { Application, Request, Response } from 'express';

import { UploadJourneyData, UploadStepId, uploadSteps } from '../upload-journey/config';

declare module 'express-session' {
  interface SessionData {
    uploadJourneyData?: UploadJourneyData;
  }
}

function getData(req: Request): UploadJourneyData {
  return req.session?.uploadJourneyData ?? {};
}

function setData(req: Request, data: UploadJourneyData): void {
  if (req.session) {
    req.session.uploadJourneyData = data;
  }
}

export default function setupUploadJourneyRoute(app: Application): void {
  app.get('/upload-journey/:stepId', (req: Request, res: Response) => {
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
    });
  });

  app.post('/upload-journey/:stepId', (req: Request, res: Response) => {
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
      });
    }

    const newData = step.persist ? step.persist(req.body, data) : data;
    setData(req, newData);

    const nextStep = step.next ? step.next(newData) : null;
    if (nextStep) {
      return res.redirect(`/upload-journey/${nextStep}`);
    }

    res.redirect(`/upload-journey/${req.params.stepId}`);
  });

  app.get('/upload-journey', (req: Request, res: Response) => {
    res.redirect('/upload-journey/before-you-start');
  });
}
