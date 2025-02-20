import { APIGatewayProxyHandler } from "aws-lambda";

export const handler: APIGatewayProxyHandler = async (event) => {
  const stage = event.requestContext.stage;
  const specUrl = `/${stage}/openapi.yml`;

  const redocHtml = `
  <!DOCTYPE html>
  <html>
    <head>
      <title>API Docs</title>
      <meta charset="utf-8"/>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <script src="https://cdn.jsdelivr.net/npm/redoc@next/bundles/redoc.standalone.js"></script>
    </head>
    <body>
      <redoc spec-url="${specUrl}"></redoc>
      <script>
        Redoc.init('${specUrl}', {}, document.querySelector('redoc'))
      </script>
    </body>
  </html>
  `;

  return {
    statusCode: 200,
    headers: { "Content-Type": "text/html" },
    body: redocHtml
  };
};
