import 'express-session';

import { Application, Request, Response } from 'express';

import { JourneyData, StepId, steps } from '../journey/config';

declare module 'express-session' {
  interface SessionData {
    journeyData?: JourneyData;
  }
}

const SESSION_KEY = 'journeyData';

function getData(req: Request): JourneyData {
  return req.session?.[SESSION_KEY] ?? {};
}

function setData(req: Request, data: JourneyData): void {
  if (req.session) {
    req.session[SESSION_KEY] = data;
  }
}

export default function setupJourneyRoute(app: Application): void {
  app.get('/journey/:stepId', (req: Request, res: Response) => {
    const step = steps[req.params.stepId as StepId];
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

  app.post('/journey/:stepId', (req: Request, res: Response) => {
    const step = steps[req.params.stepId as StepId];
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
      return res.redirect(`/journey/${nextStep}`);
    }

    res.redirect(`/journey/${req.params.stepId}`);
  });

  app.get('/journey', (req: Request, res: Response) => {
    res.redirect('/journey/step1');
  });
}
