import bcrypt from "bcryptjs";
import { createClient } from "../helpers/db-helper.mjs";
import generatePassword from "password-generator";

function removeDiacritics(string) {
    let result = string;
    const diacritics = {
        "á": "a",
        "é": "e",
        "ě": "e",
        "í": "i",
        "ó": "o",
        "ú": "u",
        "ů": "u",
        "ý": "y",
        "č": "c",
        "ď": "d",
        "ň": "n",
        "ř": "r",
        "š": "s",
        "ť": "t",
        "ž": "z"
    }

    for (let ch of Object.keys(diacritics)) {
        let regexp = new RegExp(`${ch}|${ch.toUpperCase()}`, "g");
        result = result.replace(regexp, diacritics[ch]);
    }
    return result;
}

function toUsername(string) {
    let [name, surname] = removeDiacritics(string).split(" ");
    return `${surname}.${name[0]}`.toLowerCase();
}

const names = [
    "Ondřej Sedláček"
];

const dbClient = createClient();
try {
    let generated = [];
    await dbClient.connect();
    const users = dbClient.usersCollection();
    for (let user of names) {
        const username = toUsername(user);
        const existingUser = await users.findOne({ username });
        if (existingUser !== null) continue;
        const password = generatePassword(12, false);
        const passwordHash = await bcrypt.hash(password, 10);
        const { insertedId } = await users.insertOne({
            username,
            password: passwordHash
        })
        generated.push({id: insertedId, name: user, username, password});
    }
    console.log(JSON.stringify(generated));
} catch (err) {
    console.error(err);
} finally {
    dbClient.close();
}
