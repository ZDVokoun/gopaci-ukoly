import MongoDB from "mongodb";
const { ObjectId } = MongoDB;
import { createClient } from "../helpers/db-helper.mjs";
import { jwtExtract } from "../helpers/jwt-helper.mjs";



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
        const username = payload.username;

        await dbClient.connect();
        const homeworks = dbClient.homeworksCollection();
        const users = dbClient.usersCollection();
        const comments = dbClient.commentsCollection();
        let data = [];
        
        if (event.queryStringParameters.id) {
            const id = event.queryStringParameters.id;
            const userList = await users.find({}, {username: 1, user: 1}).toArray();
            const homeworkComments = (await comments.find({homework: id}).toArray())
                .map(item => Object.assign(item, {userFullName: userList.find(user => item.user === user.username)["user"]}));
            const rawData = await homeworks.findOne({_id: new ObjectId(id)})
            
            data = Object.assign(rawData, {userFullName: userList.find(user => rawData.user === user.username)["user"], comments: homeworkComments});
        } else {
            const userGroups = (await users.findOne({ username: username })).groups;
            const rawData = await homeworks.find({dueTime : { $gt:new Date() }}).toArray();
            data = rawData.filter(item => userGroups.some(group => item.group === group)).map(item => ({id: item._id,name: item.name, dueTime: item.dueTime, voluntary: item.voluntary, subject: item.subject}))
        }

        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        }
    } catch (err) {
        console.error(err);
        return {
            statusCode: errorStatusCode,
            body: JSON.stringify({msg: err.message})
        }
    } finally {
        dbClient.close();
    }
}