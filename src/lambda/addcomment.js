import { createClient } from "../helpers/db-helper";
import { jwtExtract } from "../helpers/jwt-helper";
import { hasValues } from "../helpers/validation-helper";

export async function handler(event) {
    let errorStatusCode = 500;
    const dbClient = createClient();
    const payload = jwtExtract(event.headers.cookie);
    try {
        if (event.httpMethod != "POST", !hasValues(event.body, ["msg", "homework"])) {
            errorStatusCode = 400;
            throw new Error("Bad request");
        } 
        if (!payload) {
            errorStatusCode = 401;
            throw new Error("Unauthorized")
        }
        const req = JSON.parse(event.body);
        await dbClient.connect();
        const comments = dbClient.commentsCollection();
        await comments.insertOne(Object.assign(req, {
            user: payload.username,
            createDate: new Date()
        }))

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