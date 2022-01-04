import { createClient } from "../helpers/db-helper";
import { ObjectId } from "mongodb";
import { jwtExtract } from "../helpers/jwt-helper";
import { hasValues } from "../helpers/validation-helper";
import { sendNotifications } from "../helpers/push-helper"

export async function handler(event) {
    let errorStatusCode = 500;
    const dbClient = createClient();
    const payload = jwtExtract(event.headers.cookie);
    try {
        if (event.httpMethod !== "POST" && !hasValues(event.body, ["msg", "homework"])) {
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
        const users = dbClient.usersCollection();
        const homeworks = dbClient.homeworksCollection();
        const homework = await homeworks.findOne({_id: ObjectId(req.homework)})
        const subscriptions =
              (await users.find({
                  subscriptions: { $exists: true },
                  groups: {$in: [homework.group]},
                  notifyAbout: {$in: ["comments"]},
                  mutedUser: { $not: { $in: [payload.username] } },
                  username: { $not: {$regex: payload.username} }
              }, {subscriptions: 1}).toArray()).map(item => item.subscriptions).flat(2)
        const fullName = (await users.findOne({ username: payload.username }, {user: 1})).user;
        const { insertedId } = await comments.insertOne(Object.assign(req, {
            user: payload.username,
            createDate: new Date()
        }))
        await sendNotifications(`Přidán nový komentář na úkol "${homework.name}" od uživatele ${fullName}`, "", `/homework/${req.homework}#${insertedId.toString()}`, subscriptions)

        return {
            statusCode: 200,
            body: JSON.stringify({msg: "Success"})
        }
    } catch (err) {
        errorStatusCode === 500 && console.error(err);
        return {
            statusCode: errorStatusCode,
            body: JSON.stringify({msg: String(err)})
        }
    } finally {
        dbClient.close();
    }
}
