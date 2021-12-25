import { jwtExtract } from "../helpers/jwt-helper";
import { createClient } from "../helpers/db-helper";
import { hasValues, passesWhitelist } from "../helpers/validation-helper";
import { ObjectId } from "mongodb";
import { sendNotifications } from "../helpers/push-helper"

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
    const valueWhitelist = ["name", "dueTime", "subject", "group", "description", "voluntary", "preciseTime", "type"];
    if (event.httpMethod !== "POST" || new Date(req.dueTime) < new Date() || !hasValues(req, requiredValues) || !passesWhitelist(req, valueWhitelist)) {
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
        const subjects = dbClient.subjectsCollection();
        const subject = (await subjects.findOne({shortcut: req.subject}, {name: 1})).name
        const subscriptions = (await users.find({ subscriptions: { $exists: true }, groups: {$in: [req.group]} }, {subscriptions: 1}).toArray()).map(item => item.subscriptions).flat(2)
        const fullName = (await users.findOne({username: payload.username}, {user: 1})).user
        if (event.queryStringParameters.id) {
            const id = event.queryStringParameters.id;
            const insertion = {...req, "dueTime": new Date(req.dueTime), "lastModified": new Date()};
            await homeworks.updateOne({_id: new ObjectId(id)}, {$set: insertion})
            sendNotifications(`Úkol "${req.name}" aktualizován`, `Uživatelem ${fullName} na předmět ${subject}`, `/homework/${id}`, subscriptions)
        } else {
            const { insertedId } = await homeworks.insertOne(Object.assign(req, {
                "user": payload.username,
                "dueTime": new Date(req.dueTime),
                "createTime": new Date(),
            }))
            sendNotifications(`Nový úkol "${req.name}" zveřejněn`, `Uživatelem ${fullName} na předmět ${subject}`, `/homework/${insertedId.toString()}`, subscriptions)
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
