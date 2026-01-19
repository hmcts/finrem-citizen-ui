import fs from 'fs';
import path from 'path';

import nunjucksEnv from '../../nunjucks';

const { expect } = require('chai');

describe('Task List Upload Dashboard Tests', () => {
  const filePath = path.join(__dirname, '../../data/task-list.json');
  const data = fs.readFileSync(filePath, 'utf-8');

  it('Should render the documents to submit before your hearing on date correctly', () => {
    const res = nunjucksEnv.render('task-list-upload-dashboard.njk', JSON.parse(data));
    expect(res).to.contain('Documents to submit before your hearing on 28 January 2026');
  });

  it('Should render You must complete and submit all of the documents title message correctly', () => {
    const res = nunjucksEnv.render('task-list-upload-dashboard.njk', JSON.parse(data));
    expect(res).to.contain('You must complete and submit all the documents listed below by the stated dates');
  });

  it('Should render 35 days offset correctly', () => {
    const res = nunjucksEnv.render('task-list-upload-dashboard.njk', JSON.parse(data));
    expect(res).to.contain('By 24 December 2025');
    expect(res).to.contain('Financial statement (Form E, E1 or E2)');
    expect(res).to.contain('Financial evidence for your Form E');
  });

  it('Should render 14 days offset correctly', () => {
    const res = nunjucksEnv.render('task-list-upload-dashboard.njk', JSON.parse(data));
    expect(res).to.contain('By 14 January 2026');
    expect(res).to.contain('Questionaire');
    expect(res).to.contain('Property valuation');
    expect(res).to.contain('Potential borrowing capacity');
    expect(res).to.contain('Future housing needs');
    expect(res).to.contain('Chronology');
    expect(res).to.contain('Statement of issues');
    expect(res).to.contain('Response to the notice of a first appointment (Form G)');
  });

  it('Should render 7 days offset correctly', () => {
    const res = nunjucksEnv.render('task-list-upload-dashboard.njk', JSON.parse(data));
    expect(res).to.contain('By 21 January 2026');
    expect(res).to.contain('Non-court dispute resolution (Form FMS)');
  });

  it('Should render 2 days offset correctly', () => {
    const res = nunjucksEnv.render('task-list-upload-dashboard.njk', JSON.parse(data));
    expect(res).to.contain('By 26 January 2026');
    expect(res).to.contain('Composite case summary (ES1)');
    expect(res).to.contain('Composite schedule of assets and income (ES2)');
    expect(res).to.contain('Statement of costs incurred (Form H)');
    expect(res).to.contain('Hearing bundle');
    expect(res).to.contain('Position statement for the hearing');
  });

  it('Should render View my divorce case correctly', () => {
    const res = nunjucksEnv.render('task-list-upload-dashboard.njk', JSON.parse(data));
    expect(res).to.contain('View my divorce case (opens in a new tab)');
  });

  it('Should render Getting help correctly', () => {
    const res = nunjucksEnv.render('task-list-upload-dashboard.njk', JSON.parse(data));
    expect(res).to.contain('Getting help');
  });

  it('Should render email correctly', () => {
    const res = nunjucksEnv.render('task-list-upload-dashboard.njk', JSON.parse(data));
    expect(res).to.contain('FRCexample@justice.gov.uk');
  });

  it('Should render telephone correctly', () => {
    const res = nunjucksEnv.render('task-list-upload-dashboard.njk', JSON.parse(data));
    expect(res).to.contain('0300 123 5577');
  });
});
