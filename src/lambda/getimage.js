import { ObjectId } from "mongodb";
import { createClient } from "../helpers/db-helper.js";
import { jwtExtract } from "../helpers/jwt-helper.js";

export async function handler(event) {
    let errorStatusCode = 500;
    const dbClient = createClient();
    const payload = jwtExtract(event.headers.cookie);
    const id = event.queryStringParameters.id;
    try {
        if (event.httpMethod !== "GET" && !id) {
            errorStatusCode = 400;
            throw new Error("Bad request");
        } 
        if (!payload) {
            errorStatusCode = 401;
            throw new Error("Unauthorized")
        }
        await dbClient.connect();
        const images = dbClient.imagesCollection();
        const {type, content} = await images.findOne({_id: new ObjectId(id)});

        return {
            statusCode: 200,
            headers: {
                "Content-Type": type
            },
            body: content.toString("base64"),
            isBase64Encoded: true
        }
    } catch (err) {
        console.error(err);
        return {
            statusCode: errorStatusCode,
            body: JSON.stringify({msg: String(err)})
        }
    } finally {
        dbClient.close();
    }
}
