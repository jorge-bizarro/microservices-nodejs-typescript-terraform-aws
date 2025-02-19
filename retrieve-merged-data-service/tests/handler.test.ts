import { DynamoDBClient, PutItemCommand, QueryCommand } from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";
import { APIGatewayProxyEvent, Context } from "aws-lambda";
import axios from "axios";
import { handler } from "../src/handler";

jest.mock("axios");
jest.mock("@aws-sdk/client-dynamodb");

const mockDynamoDB = DynamoDBClient as jest.MockedClass<typeof DynamoDBClient>;
const sendMock = jest.fn();
mockDynamoDB.prototype.send = sendMock;

const axiosMock = axios as jest.Mocked<typeof axios>;

const mockCharacterId = "1";
const mockSwapiResponse = {
  name: "Luke Skywalker",
  height: "172",
  mass: "77",
  hair_color: "Blond",
  skin_color: "Fair",
  eye_color: "Blue",
  birth_year: "19BBY",
  gender: "Male",
};
const mockAdviceResponse = { slip: { advice: "Always trust your instincts." } };

const mockEvent: APIGatewayProxyEvent = {
  resource: "",
  path: "",
  httpMethod: "GET",
  headers: {},
  multiValueHeaders: {},
  queryStringParameters: {},
  multiValueQueryStringParameters: null,
  pathParameters: { id: mockCharacterId },
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

const mockContext: Context = {
  callbackWaitsForEmptyEventLoop: false,
  functionName: "test-function",
  functionVersion: "1",
  invokedFunctionArn: "arn:aws:lambda:test",
  memoryLimitInMB: "128",
  awsRequestId: "test-request-id",
  logGroupName: "test-log-group",
  logStreamName: "test-log-stream",
  getRemainingTimeInMillis: () => 10000,
  done: jest.fn(),
  fail: jest.fn(),
  succeed: jest.fn(),
};

describe("Lambda Handler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return character from cache", async () => {
    sendMock.mockResolvedValueOnce({
      Items: [
        marshall({
          id: mockCharacterId,
          name: "Luke Skywalker",
          created_at: Date.now(),
          consejo: "Always trust your instincts.",
          id_sorted: "ALL",
          height: "172",
          mass: "77",
          hair_color: "Blond",
          skin_color: "Fair",
          eye_color: "Blue",
          birth_year: "19BBY",
          gender: "Male",
          advice: "Always trust your instincts."
        }),
      ],
    });

    const response = await handler(mockEvent, mockContext);

    expect(JSON.parse(response.body)).toEqual(
      expect.objectContaining({ nombre: "Luke Skywalker", consejo: "Always trust your instincts." })
    );
    expect(sendMock).toHaveBeenCalledWith(expect.any(QueryCommand));
    expect(sendMock).not.toHaveBeenCalledWith(expect.any(PutItemCommand));
  });

  it("should return character from SWAPI if not in cache", async () => {
    sendMock.mockResolvedValueOnce({ Items: [] }); // Simula que no hay nada en caché

    axiosMock.get
      .mockResolvedValueOnce({ status: 200, data: mockSwapiResponse }) // Mock SWAPI
      .mockResolvedValueOnce({ status: 200, data: mockAdviceResponse }); // Mock AdviceAPI

    sendMock.mockResolvedValueOnce({}); // Simula guardado en caché

    const response = await handler(mockEvent, mockContext);

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual(
      expect.objectContaining({ nombre: "Luke Skywalker", consejo: "Always trust your instincts." })
    );

    expect(sendMock).toHaveBeenCalledTimes(2); // 1 para Query, 1 para PutItem
    expect(sendMock).toHaveBeenCalledWith(expect.any(QueryCommand));
    expect(sendMock).toHaveBeenCalledWith(expect.any(PutItemCommand));
  });

  it("should return 500 if an unknown error occurs", async () => {
    sendMock.mockRejectedValueOnce(new Error("DynamoDB Error"));

    const response = await handler(mockEvent, mockContext);

    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body)).toEqual(
      expect.objectContaining({ message: "Error interno del servidor" })
    );
  });
});
