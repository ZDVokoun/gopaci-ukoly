import { jwtExtract } from "../helpers/jwt-helper";
import { createClient } from "../helpers/db-helper";
import { hasValues, passesWhitelist } from "../helpers/validation-helper";
import { ObjectId } from "mongodb";

export async function handler(event) {
    const payload = jwtExtract(event.headers.cookie);
    const req = JSON.parse(event.body);
    if (!payload) {
        return {
            statusCode: 401,
            body: JSON.stringify({msg: "Unauthorized"})
        }
    }
    const requiredValues = ["name", "dueTime", "subject", "group"];
    const valueWhitelist = ["name", "dueTime", "subject", "group", "description", "voluntary", "preciseTime"];
    if (event.httpMethod != "POST" || new Date(req.dueTime) < new Date() || !hasValues(req, requiredValues) || !passesWhitelist(req, valueWhitelist)) {
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
        if (event.queryStringParameters.id) {
            const id = event.queryStringParameters.id;
            const insertion = {...req, "dueTime": new Date(req.dueTime), "lastModified": new Date()};
            await homeworks.updateOne({_id: new ObjectId(id)}, {$set: insertion})
        } else {
            await homeworks.insertOne(Object.assign(req, {
                "user": payload.username,
                "dueTime": new Date(req.dueTime),
                "createTime": new Date(),
            }))
        }
        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({msg: "Success"})
        }
    } catch (err) {
        console.log(err)
        return {
            statusCode: errorStatusCode,
            body: JSON.stringify({msg: err})
        }
    } finally {
        dbClient.close();
    }
}