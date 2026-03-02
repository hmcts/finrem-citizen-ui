// Generated from: src/test/functional/features/homePage.feature
import { test } from '../../../../../fixtures/fixtures.ts';

test.describe('HomePage', () => {
  test('User sees correct content on the home page', { tag: ['@PR'] }, async ({ Given, Then, homePage }) => {
    await Given('I am on the home page', null, { homePage });
    await Then('I should see correct content', null, { homePage });
  });

  test('User can click license link in footer and it opens in the same tab', async ({
    Given,
    When,
    Then,
    homePage,
    page,
  }) => {
    await Given('I am on the home page', null, { homePage });
    await When('I click on the "license" link', null, { homePage });
    await Then('I should be on the "Open Government Licence for public sector information" page', null, { page });
  });
});

// == technical section ==

test.use({
  $test: [({}, use) => use(test), { scope: 'test', box: true }],
  $uri: [({}, use) => use('src/test/functional/features/homePage.feature'), { scope: 'test', box: true }],
  $bddFileData: [({}, use) => use(bddFileData), { scope: 'test', box: true }],
});

const bddFileData = [
  // bdd-data-start
  {
    pwTestLine: 6,
    pickleLine: 4,
    tags: ['@PR'],
    steps: [
      {
        pwStepLine: 7,
        gherkinStepLine: 5,
        keywordType: 'Context',
        textWithKeyword: 'Given I am on the home page',
        stepMatchArguments: [],
      },
      {
        pwStepLine: 8,
        gherkinStepLine: 6,
        keywordType: 'Outcome',
        textWithKeyword: 'Then I should see correct content',
        stepMatchArguments: [],
      },
    ],
  },
  {
    pwTestLine: 11,
    pickleLine: 8,
    tags: [],
    steps: [
      {
        pwStepLine: 12,
        gherkinStepLine: 9,
        keywordType: 'Context',
        textWithKeyword: 'Given I am on the home page',
        stepMatchArguments: [],
      },
      {
        pwStepLine: 13,
        gherkinStepLine: 10,
        keywordType: 'Action',
        textWithKeyword: 'When I click on the "license" link',
        stepMatchArguments: [
          {
            group: {
              start: 15,
              value: '"license"',
              children: [
                { start: 16, value: 'license', children: [{ children: [] }] },
                { children: [{ children: [] }] },
              ],
            },
            parameterTypeName: 'string',
          },
        ],
      },
      {
        pwStepLine: 14,
        gherkinStepLine: 11,
        keywordType: 'Outcome',
        textWithKeyword: 'Then I should be on the "Open Government Licence for public sector information" page',
        stepMatchArguments: [
          {
            group: {
              start: 19,
              value: '"Open Government Licence for public sector information"',
              children: [
                {
                  start: 20,
                  value: 'Open Government Licence for public sector information',
                  children: [{ children: [] }],
                },
                { children: [{ children: [] }] },
              ],
            },
            parameterTypeName: 'string',
          },
        ],
      },
    ],
  },
]; // bdd-data-end
