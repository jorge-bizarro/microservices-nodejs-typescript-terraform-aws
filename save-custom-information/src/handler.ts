import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { randomUUID } from "node:crypto";

const dynamoDb = new DynamoDBClient({ region: process.env.AWS_REGION });
const TABLE_NAME = process.env.CUSTOM_TABLE_NAME;

const log = (level: string, message: string, context: Record<string, any> = {}) => {
  console.log(JSON.stringify({
    level,
    message,
    timestamp: new Date().toISOString(),
    ...context,
  }));
};

export const handler = async (event: APIGatewayProxyEvent, ctx: Context) => {
  ctx.callbackWaitsForEmptyEventLoop = false;
  const requestId = event.requestContext.requestId;
  const context = { requestId, functionName: process.env.AWS_LAMBDA_FUNCTION_NAME };

  console.log(event.body);

  log('info', 'Guardando información personalizada', context);

  try {
    await dynamoDb.send(
      new PutItemCommand({
        TableName: TABLE_NAME,
        Item: marshall({
          id: randomUUID(),
          ...(event.body as unknown as Record<string, string>),
        })
      })
    );

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Information saved successfully",
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Error saving information", details: `${error}` }),
    };
  }
};
