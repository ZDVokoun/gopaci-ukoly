import { jwtExtract } from "../helpers/jwt-helper";
import { createClient } from "../helpers/db-helper";

export async function handler(event) {
    const payload = jwtExtract(event.headers.cookie);
    if (payload) {/*
        if (event.queryStringParameters.username) {
            const dbClient = createClient();
            try {
                await dbClient.connect()
                const data = await dbClient.usersCollection().findOne({"username": event.queryStringParameters.username}, {"username": 1, "user": 1})
                return {
                    statusCode: 200,
                    headers: {
                    "Content-Type": "application/json",
                    },
                    body: JSON.stringify(data)
                }    
            } catch (err) {
                return {
                    statusCode: 500,
                    body: {msg: err}
                }
            } finally {
                dbClient.close()
            }
        }*/
        return {
            statusCode: 200,
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        }
    } else {
        return {
            statusCode: 401,
            body: JSON.stringify({ msg: "Unauthorized" }),
        }
    }
}