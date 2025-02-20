import { APIGatewayProxyHandler } from "aws-lambda";
import fs from "fs";
import path from "path";

export const handler: APIGatewayProxyHandler = async () => {
    console.log(process.cwd());

    const filePath = path.join(process.cwd(), "openapi.yml");

    if (!fs.existsSync(filePath)) {
        return {
            statusCode: 500,
            body: "openapi.yml no encontrado",
        };
    }

    const fileContents = fs.readFileSync(filePath, "utf8");

    return {
        statusCode: 200,
        headers: {
            "Content-Type": "text/yaml",
        },
        body: fileContents,
    };
};
