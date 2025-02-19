import { DynamoDBClient, QueryCommand, ScanCommand } from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";
import { mockClient } from "aws-sdk-client-mock";
import { handler } from "../src/handler";

const dynamoMock = mockClient(DynamoDBClient);

const mockEvent = {
  resource: "",
  path: "",
  httpMethod: "GET",
  headers: {},
  multiValueHeaders: {},
  queryStringParameters: {
    limit: "5",
    lastKey: encodeURIComponent(JSON.stringify({ id: "123" })),
  },
  multiValueQueryStringParameters: null,
  pathParameters: null,
  stageVariables: null,
  requestContext: {
    accountId: "",
    apiId: "",
    authorizer: null,
    protocol: "",
    httpMethod: "GET",
    identity: {
      accessKey: null,
      accountId: null,
      apiKey: null,
      caller: null,
      cognitoAuthenticationProvider: null,
      cognitoAuthenticationType: null,
      cognitoIdentityId: null,
      cognitoIdentityPoolId: null,
      principalOrgId: null,
      sourceIp: "",
      user: null,
      userAgent: "",
      userArn: null,
      apiKeyId: null,
      clientCert: null
    },
    path: "",
    stage: "",
    requestId: "test-request-id",
    requestTimeEpoch: Date.now(),
    resourceId: "",
    resourcePath: "",
  },
  body: null,
  isBase64Encoded: false,
};

const mockContext = {
  callbackWaitsForEmptyEventLoop: false,
  functionName: "",
  functionVersion: "",
  invokedFunctionArn: "",
  memoryLimitInMB: "128",
  awsRequestId: "test-request-id",
  logGroupName: "",
  logStreamName: "",
  getRemainingTimeInMillis: () => 10000,
  done: () => { },
  fail: () => { },
  succeed: () => { },
};

describe("Lambda Handler", () => {
  beforeEach(() => {
    dynamoMock.reset();
  });

  it("should return paginated results", async () => {

    dynamoMock.on(ScanCommand).resolves({ Count: 50 });
    dynamoMock.on(QueryCommand).resolves({
      Items: [marshall({ id: "1", name: "Luke Skywalker", created_at: Date.now() })],
      LastEvaluatedKey: marshall({ id: "1" })
    });

    const response = await handler(mockEvent, mockContext);
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.data).toHaveLength(1);
    expect(body.paginacion.totalDePaginas).toBeGreaterThan(0);
  });

  it("should handle errors gracefully", async () => {
    dynamoMock.on(ScanCommand).rejects(new Error("DynamoDB Error"));

    const response = await handler(mockEvent, mockContext);
    expect(response.statusCode).toBe(500);
    expect(response.body).toContain("Error fetching characters");
  });
});
