Feature: HomePage

@PR
  Scenario: User sees correct content on the home page
    Given I am on the home page
    Then I should see correct content

  Scenario: User can click license link in footer and it opens in the same tab
    Given I am on the home page
    When I click on the "license" link
    Then I should be on the "Open Government Licence for public sector information" page
