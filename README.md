# microservices-nodejs-typescript-terraform-aws

![Node.js](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![AWS](https://img.shields.io/badge/AWS-%23FF9900.svg?style=for-the-badge&logo=amazon-aws&logoColor=white)
![Terraform](https://img.shields.io/badge/Terraform-%23734F96.svg?style=for-the-badge&logo=terraform&logoColor=white)
![Serverless](https://img.shields.io/badge/Serverless-%23000000.svg?style=for-the-badge&logo=serverless&logoColor=white)
![Swagger](https://img.shields.io/badge/Swagger-F7DF1E.svg?style=for-the-badge&logo=Swagger&logoColor=black)

### Features

- Integración con la API de StarWars
- Integración con la API de Advice
- Uso de Serverless Framework para el despliegue de las lambdas y aprovisionamiento de las API Gateway
- Interacción con AWS DynamoDB como base de datos de caché con un TTL de 30 minutos
- Uso de Esbuild para optimizar la compilación
- Pruebas con Jest
- Uso de Typescript para el tipado
- Logging mejorado para mejor seguimiento en AWS CloudWatch
- Rate-Limit de 100 peticiones por día con API-Key

# Endpoints

- GET /fusionados/{id}
- POST /almacenar
- GET /historial
