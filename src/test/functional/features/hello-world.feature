Feature: Initial Functional test

    Scenario: The home page loads
        When I go to '/health'
        Then the page should include 'buildInfo'
