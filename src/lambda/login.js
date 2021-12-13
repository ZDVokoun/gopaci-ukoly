import { createClient } from "../helpers/db-helper";
import bcrypt from "bcryptjs";
import { createJwtCookie } from "../helpers/jwt-helper";

export async function handler(event) {
    if (event.httpMethod !== "POST") {
        return {
            statusCode: 400,
            body: JSON.stringify("Bad Request")
        }
    }

    const dbClient = createClient();
    let errorStatusCode = 500;
    try {
        await dbClient.connect();
        const users = dbClient.usersCollection();
        const logins = dbClient.loginsCollection();
        const { username, password } = JSON.parse(event.body);
        const existingUser = await users.findOne({ username });
        if (existingUser == null) {
            await logins.insertOne({
                "successful": false,
                "error": "Bad username",
                "IP": event.headers["x-bb-ip"],
                "user-agent": event.headers["user-agent"],
                "time": new Date()
            });
            errorStatusCode = 401;
            throw new Error("Invalid password or username");
        }
        const passwordHash = existingUser.hashedPassword || existingUser.password;
        const matches = await bcrypt.compare(password, passwordHash);
        if (!matches) {
            await logins.insertOne({
                "successful": false,
                "error": "Bad password",
                username,
                "IP": event.headers["x-bb-ip"],
                "user-agent": event.headers["user-agent"],
                "time": new Date()
            });
            errorStatusCode = 401;
            throw new Error("Invalid password or username");
        }
        const userId = existingUser._id;
        const jwtCookie = createJwtCookie(userId, username);

        await logins.insertOne({
            "successful": true,
            username,
            "IP": event.headers["x-bb-ip"],
            "user-agent": event.headers["user-agent"],
            "time": new Date()
        });

        return {
            statusCode: 200,
            headers: {
                "Set-Cookie": jwtCookie,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({id: userId, username})
        }
    } catch (err) {
        console.error(err);
        return {
            statusCode: errorStatusCode,
            body: JSON.stringify({msg: err.message, input: event})
        }
    } finally {
        dbClient.close();
    }
}
