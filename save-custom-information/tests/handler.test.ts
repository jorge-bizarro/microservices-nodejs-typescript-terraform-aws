import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { mockClient } from "aws-sdk-client-mock";
import { handler } from "../src/handler";

import "aws-sdk-client-mock-jest";

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

describe("Lambda handler", () => {
    beforeEach(() => {
        dynamoMock.reset();
    });

    it("debería guardar la información correctamente", async () => {
        dynamoMock.on(PutItemCommand).resolves({});

        const mockProxyEvent: APIGatewayProxyEvent = {
            ...mockEvent,
            body: JSON.stringify({ key: "value" }),
        };

        const response = await handler(mockProxyEvent, mockContext);

        expect(response.statusCode).toBe(200);
        expect(JSON.parse(response.body)).toEqual({ message: "Information saved successfully" });

        expect(dynamoMock).toHaveReceivedCommandWith(PutItemCommand, {
            TableName: process.env.CUSTOM_TABLE_NAME,
            Item: expect.any(Object),
        });
    });

    it("debería manejar errores de DynamoDB correctamente", async () => {
        dynamoMock.on(PutItemCommand).rejects(new Error("DynamoDB failed"));

        const mockProxyEvent: APIGatewayProxyEvent = {
            ...mockEvent,
            body: JSON.stringify({ key: "value" }),
        };

        const response = await handler(mockEvent as APIGatewayProxyEvent, mockContext as Context);

        expect(response.statusCode).toBe(500);
        expect(JSON.parse(response.body)).toHaveProperty("error", "Error saving information");
    });
});
