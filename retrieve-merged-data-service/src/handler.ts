import { DynamoDBClient, PutItemCommand, QueryCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import axios from 'axios';
import { z } from 'zod';

const dynamoDb = new DynamoDBClient({ region: process.env.AWS_REGION });
const tableName = process.env.CACHE_TABLE_NAME

const swapiCharacterSchema = z.object({
  name: z.string(),
  height: z.number(),
  mass: z.number(),
  hair_color: z.string(),
  skin_color: z.string(),
  eye_color: z.string(),
  birth_year: z.string(),
  gender: z.string(),
});

const swapiCharacterSchemaCache = z.object({
  name: z.string(),
  height: z.number(),
  mass: z.number(),
  hair_color: z.string(),
  skin_color: z.string(),
  eye_color: z.string(),
  birth_year: z.string(),
  gender: z.string(),
  advice: z.string(),
});

const adviceSchema = z.object({
  advice: z.string(),
});

type SWAPICharacter = z.infer<typeof swapiCharacterSchema>;
type Advice = z.infer<typeof adviceSchema>;
type SWAPICharacterCache = z.infer<typeof swapiCharacterSchemaCache>;

const translateFieldsToSpanish = (character: SWAPICharacter, advice: Advice) => {
  return {
    nombre: character.name,
    altura: character.height,
    masa: character.mass,
    color_de_cabello: character.hair_color,
    color_de_piel: character.skin_color,
    color_de_ojos: character.eye_color,
    anio_de_nacimiento: character.birth_year,
    genero: character.gender,
    consejo: advice.advice,
  };
};

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

export const handler = async (event: APIGatewayProxyEvent, ctx: Context): Promise<APIGatewayProxyResult> => {
  ctx.callbackWaitsForEmptyEventLoop = false;
  const requestId = event.requestContext.requestId;
  const context = { requestId, functionName: process.env.AWS_LAMBDA_FUNCTION_NAME };

  try {
    const characterId = event.pathParameters?.id;

    if (!characterId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Se requiere el ID del personaje' }),
      };
    }

    log('info', `Buscando personaje con ID: ${characterId}`, context);

    const cacheKey = `character-${characterId}`;

    const queryCommand = new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: 'id = :id',
      ExpressionAttributeValues: {
        ':id': marshall(cacheKey),
      },
    })

    const cachedItem = await dynamoDb.send(queryCommand);

    if (cachedItem.Items?.at(0)) {
      const character = unmarshall(cachedItem.Items.at(0) ?? {});
      const validatedCharacter = swapiCharacterSchemaCache.parse(character);
      const translatedCharacter = translateFieldsToSpanishFromCache(validatedCharacter);
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'max-age=600',
        },
        body: JSON.stringify(translatedCharacter),
      };
    }

    log('info', 'Personaje no encontrado en caché. Obteniendo datos de SWAPI...', context);

    const [
      swapiResponse,
      adviceResponse
    ] = await Promise.all([
      axios.get(`https://swapi.dev/api/people/${characterId}`),
      axios.get(`https://api.adviceslip.com/advice/${characterId}`)
    ])


    if (swapiResponse.status !== 200) {
      log('error', 'Personaje no encontrado en SWAPI', { ...context, status: swapiResponse.status });

      return {
        statusCode: swapiResponse.status,
        body: JSON.stringify({ message: 'Personaje no encontrado en SWAPI' }),
      };
    }

    if (adviceResponse.status !== 200) {
      log('error', 'Consejo no encontrado en AdviceAPI', { ...context, status: adviceResponse.status });

      return {
        statusCode: adviceResponse.status,
        body: JSON.stringify({ message: 'Consejo no encontrado en API de consejos' }),
      };
    }

    const characterData = swapiCharacterSchema.parse(swapiResponse.data);
    const adviceData = adviceSchema.parse(adviceResponse.data.slip);
    const ttl = Math.floor(Date.now() / 1000) + 30 * 60; // 30 minutos en segundos

    const putItemCommand = new PutItemCommand({
      TableName: tableName,
      Item: marshall({
        id: cacheKey,
        created_at: Date.now(),
        id_sorted: 'ALL',
        ...characterData,
        advice: adviceData.advice,
        ttl,
      }),
    });

    await dynamoDb.send(putItemCommand);

    log('info', 'Personaje almacenado en caché', { ...context, characterId, ttl });

    const translatedCharacter = translateFieldsToSpanish(characterData, adviceData);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'max-age=600',
      },
      body: JSON.stringify(translatedCharacter),
    };
  } catch (error) {
    log('error', 'Error en la función Lambda', { ...context, error: `${error}` });

    if (error instanceof z.ZodError) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: 'Datos inválidos',
          errors: error,
        }),
      };
    }

    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error interno del servidor', error: `${error}` }),
    };
  }
};
