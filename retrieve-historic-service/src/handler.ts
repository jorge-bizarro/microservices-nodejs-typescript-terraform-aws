import { DynamoDBClient, QueryCommand, ScanCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { APIGatewayProxyEvent, APIGatewayProxyHandler, Context } from 'aws-lambda';
import { z } from 'zod';

const dynamoDb = new DynamoDBClient({ region: process.env.AWS_REGION });
const TABLE_NAME = process.env.CACHE_TABLE_NAME;

const swapiCharacterSchemaCache = z.object({
  name: z.string(),
  height: z.string(),
  mass: z.string(),
  hair_color: z.string(),
  skin_color: z.string(),
  eye_color: z.string(),
  birth_year: z.string(),
  gender: z.string(),
  advice: z.string(),
});

type SWAPICharacterCache = z.infer<typeof swapiCharacterSchemaCache>;

const translateFieldsToSpanishFromCache = (character: SWAPICharacterCache) => {
  return {
    nombre: character.name,
    altura: character.height,
    masa: character.mass,
    color_de_cabello: character.hair_color,
    color_de_piel: character.skin_color,
    color_de_ojos: character.eye_color,
    anio_de_nacimiento: character.birth_year,
    genero: character.gender,
    consejo: character.advice,
  };
};

const log = (level: string, message: string, context: Record<string, any> = {}) => {
  console.log(JSON.stringify({
    level,
    message,
    timestamp: new Date().toISOString(),
    ...context,
  }));
};

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent, ctx: Context) => {
  ctx.callbackWaitsForEmptyEventLoop = false;
  const requestId = event.requestContext.requestId;
  const context = { requestId, functionName: process.env.AWS_LAMBDA_FUNCTION_NAME };

  const limit = event.queryStringParameters?.limit ? parseInt(event.queryStringParameters.limit) : 10;
  const lastKey = event.queryStringParameters?.lastKey ? JSON.parse(decodeURIComponent(event.queryStringParameters.lastKey)) : undefined;

  log('info', `Buscando los personajes con limit: ${limit} y lastKey: ${JSON.stringify(lastKey)}`, context);

  const totalCountResult = await dynamoDb.send(new ScanCommand({ TableName: TABLE_NAME, Select: "COUNT" }));
  const totalCount = totalCountResult.Count || 0;
  const totalPages = Math.ceil(totalCount / limit);

  log('info', `Total de personajes: ${totalCount} y total de paginas: ${totalPages}`, context);

  try {
    const result = await dynamoDb.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: 'created_at_index',
        KeyConditionExpression: 'id_sorted = :sorted',
        ExpressionAttributeValues: {
          ':sorted': marshall('ALL'),
        },
        ScanIndexForward: false,
        Limit: limit,
        ExclusiveStartKey: marshall(lastKey)
      })
    );

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "max-age=600",
      },
      body: JSON.stringify({
        data: result
          .Items
          ?.map((item) => unmarshall(item))
          .map((item) => translateFieldsToSpanishFromCache(item as SWAPICharacterCache)) || [],
        paginacion: {
          totalDePaginas: totalPages,
          totalDeRegistros: totalCount,
          lastKey: encodeURIComponent(JSON.stringify(unmarshall(result.LastEvaluatedKey ?? {})))
        }
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Error fetching characters", details: `${error}` }),
    };
  }
};
