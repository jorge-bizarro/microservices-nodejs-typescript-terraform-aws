Feature: Retrieve character data from DynamoDB

  Scenario: Successfully retrieve a character
    Given there is a character with ID "1"
    When I retrieve the character data
    Then I should receive the character information
