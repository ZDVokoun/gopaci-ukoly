import { createClient } from "../helpers/db-helper";
import { jwtExtract } from "../helpers/jwt-helper";

export async function handler(event) {
    let errorStatusCode = 500;
    const dbClient = createClient();
    try {
        if (event.httpMethod != "GET") {
            errorStatusCode = 400;
            throw new Error("Bad request");
        }
        const payload = jwtExtract(event.headers.cookie);
        if (!payload) {
            errorStatusCode = 401;
            throw new Error("Unauthorized");
        }

        await dbClient.connect();
        const subjects = dbClient.subjectsCollection();
        let data = await subjects.find({}).toArray();

        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        }
    } catch (err) {
        return {
            statusCode: errorStatusCode,
            body: JSON.stringify({msg: err.message})
        }
    } finally {
        dbClient.close();
    }
}