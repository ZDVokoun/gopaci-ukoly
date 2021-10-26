import { createClient } from "../helpers/db-helper.mjs";
import { jwtExtract } from "../helpers/jwt-helper.mjs";
import { parseMultipartForm } from "../helpers/multipart-helper.mjs";

export async function handler(event) {
    let errorStatusCode = 500;
    const dbClient = createClient();
    const payload = jwtExtract(event.headers.cookie);
    try {
        if (event.httpMethod != "POST") {
            errorStatusCode = 400;
            throw new Error("Bad request");
        } 
        if (!payload) {
            errorStatusCode = 401;
            throw new Error("Unauthorized")
        }
        await dbClient.connect();
        const images = dbClient.imagesCollection()
        let data = JSON.parse(event.body);
        let insertion = await images.insertMany(data.map(item => {return {...item, uploadDate: new Date(), content: Buffer.from(item.content, "base64")}}));

        return {
            statusCode: 200,
            body: JSON.stringify(Object.values(insertion.insertedIds))
        }
    } catch (err) {
        console.error(err);
        return {
            statusCode: errorStatusCode,
            body: JSON.stringify({msg: new String(err)})
        }
    } finally {
        dbClient.close();
    }
}