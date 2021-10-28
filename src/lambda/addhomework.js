import { jwtExtract } from "../helpers/jwt-helper";
import { createClient } from "../helpers/db-helper";
import { hasValues } from "../helpers/validation-helper";

export async function handler(event) {
    const payload = jwtExtract(event.headers.cookie);
    const req = JSON.parse(event.body);
    if (!payload) {
        return {
            statusCode: 401,
            body: JSON.stringify({msg: "Unauthorized"})
        }
    }
    if (event.httpMethod != "POST" || new Date(req.dueTime) < new Date() || !hasValues(req, ["name", "dueTime", "subject", "group"])) {
        console.log(event.body);
        return {
            statusCode: 400,
            body: JSON.stringify({msg: "Bad request", request: event})
        }
    }
    const dbClient = createClient();
    let errorStatusCode = 500;
    try {
        await dbClient.connect();
        const homeworks = dbClient.homeworksCollection();
        const users = dbClient.usersCollection();
        const nameOfUser = (await users.findOne({username: payload.username}, {user: 1}));
        console.log(nameOfUser)
        await homeworks.insertOne(Object.assign(req, {
            "user": payload.username,
            "dueTime": new Date(req.dueTime),
            "createTime": new Date(),
        }));
        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({msg: "Success", input: {"name": req.name, "dueTime": req.dueTime}})
        }
    } catch (err) {
        return {
            statusCode: errorStatusCode,
            body: JSON.stringify({msg: err})
        }
    } finally {
        dbClient.close();
    }
}