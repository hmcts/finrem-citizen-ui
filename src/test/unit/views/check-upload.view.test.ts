import { describe, expect, it } from '@jest/globals';
import nunjucks from 'nunjucks';
import path from 'path';

const govukTemplates = path.join(
    path.dirname(require.resolve('govuk-frontend/package.json')),
    'dist'
);
const viewsPath = path.resolve(process.cwd(), 'src/main/views');

const env = nunjucks.configure([govukTemplates, viewsPath], {
    autoescape: true,
    noCache: true,
});

describe('check-upload view', () => {
    it('renders only the Loan statement heading for a combined document group.  It shows hint text about combined files.', () => {
        const html = env.render('generalUpload/check-upload.njk', {
            data: {
                documentGroups: [
                    {
                        groupKey: 'SupportingFinancialDocuments',
                        label: 'Loan statement',
                        willCombine: true,
                        files: [
                            {
                                id: 'file-1',
                                filename: 'loan-statement.pdf',
                                displayFilename: 'loan-statement.pdf',
                                url: '/documents/file-1/download',
                            },
                            {
                                id: 'file-2',
                                filename: 'p45.pdf',
                                displayFilename: 'p45.pdf',
                                url: '/documents/file-2/download',
                            },
                            {
                                id: 'file-3',
                                filename: 'p60.pdf',
                                displayFilename: 'p60.pdf',
                                url: '/documents/file-3/download',
                            },
                        ],
                    },
                ],
            },
            errors: {},
            values: {},
        });

        expect(html).toContain(
            '<h3 class="govuk-heading-m govuk-!-margin-top-6">Loan statement</h3>'
        );
        expect(html).not.toContain(
            '<h3 class="govuk-heading-m govuk-!-margin-top-6">P45</h3>'
        );

        expect(html).not.toContain(
            '<h3 class="govuk-heading-m govuk-!-margin-top-6">P60</h3>'
        );

        expect(html).toContain('These documents will be combined into one document called')
        expect(html).toContain('loan-statement.pdf');
        expect(html).toContain('p45.pdf');
        expect(html).toContain('p60.pdf');
    });
    it('renders separate headings without combining text for uncombined document groups.  No hint text about combined files is shown', () => {
        const html = env.render('generalUpload/check-upload.njk', {
            data: {
                documentGroups: [
                    {
                        groupKey: 'loan-statement',
                        label: 'Loan statement',
                        willCombine: false,
                        files: [
                            {
                                id: 'file-1',
                                filename: 'loan-statement.pdf',
                                displayFilename: 'loan-statement.pdf',
                                url: '/documents/file-1/download',
                            },
                        ],
                    },
                    {
                        groupKey: 'p45',
                        label: 'P45',
                        willCombine: false,
                        files: [
                            {
                                id: 'file-2',
                                filename: 'p45.pdf',
                                displayFilename: 'p45.pdf',
                                url: '/documents/file-2/download',
                            },
                        ],
                    },
                    {
                        groupKey: 'p60',
                        label: 'P60',
                        willCombine: false,
                        files: [
                            {
                                id: 'file-3',
                                filename: 'p60.pdf',
                                displayFilename: 'p60.pdf',
                                url: '/documents/file-3/download',
                            },
                        ],
                    },
                ],
            },
            errors: {},
            values: {},
        });

        expect(html).toContain(
            '<h3 class="govuk-heading-m govuk-!-margin-top-6">Loan statement</h3>'
        );
        expect(html).toContain(
            '<h3 class="govuk-heading-m govuk-!-margin-top-6">P45</h3>'
        );
        expect(html).toContain(
            '<h3 class="govuk-heading-m govuk-!-margin-top-6">P60</h3>'
        );

        expect(html).not.toContain(
            'These documents will be combined into one document called'
        );

        expect(html).toContain('loan-statement.pdf');
        expect(html).toContain('p45.pdf');
        expect(html).toContain('p60.pdf');
    });
});