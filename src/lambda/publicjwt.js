import { publicKey } from "../helpers/jwt-helper"

export async function handler() {
    return {
        statusCode: 200,
        headers: {
            "Content-Type": "text/plain"
        },
        body: publicKey
    }
}