import { jwtExtract } from "../helpers/jwt-helper.js";
import { createClient } from "../helpers/db-helper.js";
import bcrypt from "bcryptjs";

export async function handler(event) {
    let errorStatusCode = 500;
    const dbClient = createClient();
    const payload = jwtExtract(event.headers.cookie);
    try {
        if (event.httpMethod !== "POST") {
            errorStatusCode = 400;
            throw new Error("Bad request");
        } 
        if (!payload) {
            errorStatusCode = 401;
            throw new Error("Unauthorized");
        }
        await dbClient.connect();
        const users = dbClient.usersCollection();
        const { password, newPassword } = JSON.parse(event.body);

        const existingUser = await users.findOne({ username: payload.username });
        const matches = await bcrypt.compare(password, existingUser.password);
        if (!matches) {
            errorStatusCode = 401;
            throw new Error("Unauthorized");
        }

        const passwordHash = await bcrypt.hash(newPassword, 10);
        await users.updateOne({ username: payload.username }, {$set: {password: passwordHash}});

        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({msg: "Success"})
        }
    } catch (err) {
        console.error(err);
        return {
            statusCode: errorStatusCode,
            body: JSON.stringify({msg: String(err)})
        }
    } finally {
        dbClient.close();
    }
}
