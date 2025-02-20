import { DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb";
import { After, Before, Given, Then, When } from "@cucumber/cucumber";
import { strict as assert } from "assert";
import sinon from "sinon";

let dynamoDb: DynamoDBClient;
let sendStub: sinon.SinonStub;

let characterResponse: any;
let characterId: string;

Before(function () {
  dynamoDb = new DynamoDBClient({});
  sendStub = sinon.stub(dynamoDb, "send");
});

After(function () {
  sinon.restore();
});

Given("there is a character with ID {string}", async function (id) {
  characterId = id;

  sendStub.withArgs(sinon.match.instanceOf(QueryCommand)).resolves({
    Items: [
      {
        id: { S: `character-${characterId}` },
        name: { S: "Luke Skywalker" },
        height: { S: "172" },
        mass: { S: "77" },
        hair_color: { S: "blond" },
        skin_color: { S: "fair" },
        eye_color: { S: "blue" },
        birth_year: { S: "19BBY" },
        gender: { S: "male" },
        advice: { S: "Use the Force, Luke!" },
      },
    ],
  });
});

When("I retrieve the character data", async function () {
  const queryCommand = new QueryCommand({
    TableName: "Characters",
    KeyConditionExpression: "id = :id",
    ExpressionAttributeValues: {
      ":id": { S: `character-${characterId}` },
    },
  });

  characterResponse = await dynamoDb.send(queryCommand);
});

Then("I should receive the character information", function () {
  assert(characterResponse.Items?.length > 0, "No character found");
  const character = characterResponse.Items[0];
  assert.strictEqual(character.name.S, "Luke Skywalker");
  assert.strictEqual(character.advice.S, "Use the Force, Luke!");
  assert(sendStub.calledOnce, "DynamoDB send() was not called");
});
