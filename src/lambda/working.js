import { createClient } from "../helpers/db-helper";

export async function handler(event) {
  const dbClient = createClient();
  let errorStatusCode = 500;
  try {
    await dbClient.connect();
    await dbClient.db("admin").command({ping: 1});
    return {
      statusCode: 200,
      body: "Success"
    }
  } catch (err) {
    return {
      statusCode: errorStatusCode,
      body: "Error occured"
    }
  } finally {
    dbClient.close()
  }
}
