import { jwtExtract } from "../helpers/jwt-helper";
import { createClient } from "../helpers/db-helper";

export async function handler(event) {
  const req = JSON.parse(event.body);
  const dbClient = createClient();
  let errorStatusCode = 500;
  try {
    if (event.httpMethod !== "POST" || typeof req !== "object" || !req.subscription) {
      errorStatusCode = 400
      throw new Error("Bad request")
    }
    const payload = jwtExtract(event.headers.cookie);
    if (!payload) {
      errorStatusCode = 401;
      throw new Error("Unauthorized")
    }
    const username = payload.username;

    await dbClient.connect();
    const users = dbClient.usersCollection();
    await users.updateOne({username: username}, { $pull: { subscriptions: req.subscription } });

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({msg: "Success"})
    }
  } catch (err) {
    return {
      statusCode: errorStatusCode,
      body: JSON.stringify({ msg: err.message })
    }
  } finally {
    dbClient.close();
  }
}
