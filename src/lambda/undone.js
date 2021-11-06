import { createClient } from "../helpers/db-helper";
import { jwtExtract } from "../helpers/jwt-helper";

export async function handler(event) {
    let errorStatusCode = 500;
    const dbClient = createClient();
    const payload = jwtExtract(event.headers.cookie);
    try {
        if (event.httpMethod != "GET", !event.queryStringParameters.id) {
            errorStatusCode = 400;
            throw new Error("Bad request");
        } 
        if (!payload) {
            errorStatusCode = 401;
            throw new Error("Unauthorized")
        }
        await dbClient.connect();
        await dbClient.doneCollection().updateOne({
            homework: event.queryStringParameters.id,
            user: payload.username,
            undone: undefined
        }, {$set: {undone: true}})

        return {
            statusCode: 200,
            body: JSON.stringify({msg: "Success"})
        }
    } catch (err) {
        console.error(err);
        return {
            statusCode: errorStatusCode,
            body: JSON.stringify({msg: new String(err)})
        }
    } finally {
        dbClient.close();
    }
}