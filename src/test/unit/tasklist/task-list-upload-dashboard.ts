import fs from 'fs';
import path from 'path';

import { describe, expect, it } from '@jest/globals';

import nunjucksEnv from '../../nunjucks';

describe('Task List Upload Dashboard Tests', () => {
  const filePath = path.join(__dirname, '../../data/task-list.json');
  const data = fs.readFileSync(filePath, 'utf-8');
  const parsedData = JSON.parse(data);

  it('Should render the documents to submit before your hearing on date correctly', () => {
    const res = nunjucksEnv.render('task-list-upload-dashboard.njk', parsedData);
    expect(res).toContain('Documents to submit before your hearing on 28 January 2026');
  });

  it('Should render You must complete and submit all of the documents title message correctly', () => {
    const res = nunjucksEnv.render('task-list-upload-dashboard.njk', parsedData);
    expect(res).toContain('You must complete and submit all the documents listed below by the stated dates');
  });

  it('Should render 35 days offset correctly', () => {
    const res = nunjucksEnv.render('task-list-upload-dashboard.njk', parsedData);
    expect(res).toContain('By 24 December 2025');
    expect(res).toContain('Financial statement (Form E, E1 or E2)');
    expect(res).toContain('Financial evidence for your Form E');
  });

  it('Should render 14 days offset correctly', () => {
    const res = nunjucksEnv.render('task-list-upload-dashboard.njk', parsedData);
    expect(res).toContain('By 14 January 2026');
    expect(res).toContain('Questionaire');
    expect(res).toContain('Property valuation');
    expect(res).toContain('Potential borrowing capacity');
    expect(res).toContain('Future housing needs');
    expect(res).toContain('Chronology');
    expect(res).toContain('Statement of issues');
    expect(res).toContain('Response to the notice of a first appointment (Form G)');
  });

  it('Should render 7 days offset correctly', () => {
    const res = nunjucksEnv.render('task-list-upload-dashboard.njk', parsedData);
    expect(res).toContain('By 21 January 2026');
    expect(res).toContain('Non-court dispute resolution (Form FMS)');
  });

  it('Should render 2 days offset correctly', () => {
    const res = nunjucksEnv.render('task-list-upload-dashboard.njk', parsedData);
    expect(res).toContain('By 26 January 2026');
    expect(res).toContain('Composite case summary (ES1)');
    expect(res).toContain('Composite schedule of assets and income (ES2)');
    expect(res).toContain('Statement of costs incurred (Form H)');
    expect(res).toContain('Hearing bundle');
    expect(res).toContain('Position statement for the hearing');
  });

  it('Should render View my divorce case correctly', () => {
    const res = nunjucksEnv.render('task-list-upload-dashboard.njk', parsedData);
    expect(res).toContain('View my divorce case (opens in a new tab)');
  });

  it('Should render Getting help correctly', () => {
    const res = nunjucksEnv.render('task-list-upload-dashboard.njk', parsedData);
    expect(res).toContain('Getting help');
  });

  it('Should render email correctly', () => {
    const res = nunjucksEnv.render('task-list-upload-dashboard.njk', parsedData);
    expect(res).toContain('FRCexample@justice.gov.uk');
  });

  it('Should render telephone correctly', () => {
    const res = nunjucksEnv.render('task-list-upload-dashboard.njk', parsedData);
    expect(res).toContain('0300 123 5577');
  });
});
