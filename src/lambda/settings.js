import { jwtExtract } from "../helpers/jwt-helper";
import { createClient } from "../helpers/db-helper";
import { passesWhitelist } from "../helpers/validation-helper";

export async function handler(event) {
  const dbClient = createClient();
  let errorStatusCode = 500;
  try {
    const payload = jwtExtract(event.headers.cookie);
    if (!payload) {
      errorStatusCode = 401;
      throw new Error("Unauthorized")
    }
    const valueWhitelist = ["notifyAbout", "mutedUsers"];
    const username = payload.username;
    await dbClient.connect();
    const users = dbClient.usersCollection();
    const req = JSON.parse(event.body || "{}");
    if (event.httpMethod === "POST" && typeof req === "object" && req.settings && passesWhitelist(req.settings, valueWhitelist)) {
      await users.updateOne({username: username}, { $set: req.settings })
      return {
        statusCode: 200,
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({msg: "Success"})
      }
    } else if (event.httpMethod === "GET") {
      const fromDatabase = (await users.findOne({username: username}, { password: 0, hashedPassword: 0 }))
      const results = Object.fromEntries(Object.entries(fromDatabase).filter(([key, value]) => valueWhitelist.includes(key)))
      return {
        statusCode: 200,
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(results)
      }
    } else {
      errorStatusCode = 400
      throw new Error("Bad request")
    }
  } catch (err) {
    console.error(err)
    return {
      statusCode: errorStatusCode,
      body: JSON.stringify({ msg: err.message })
    }
  } finally {
    dbClient.close();
  }
}
