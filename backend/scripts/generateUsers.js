import bcrypt from "bcryptjs";
import { createClient } from "../gateway/helpers/db-helper.js";
import generatePassword from "password-generator";
import { readFile } from "fs/promises";

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
    let [surname, name] = removeDiacritics(string).split(" ");
    return `${surname}.${name[0]}`.toLowerCase();
}

const userList = await readFile(process.argv[2]).then(data => JSON.parse(data))

const dbClient = createClient();
try {
    let generated = [];
    await dbClient.connect();
    const users = dbClient.usersCollection();
    for (let user of userList) {
        const username = toUsername(user.name);
        const existingUser = await users.findOne({ username });
        if (existingUser !== null) continue;
        const password = generatePassword(12, false);
        const passwordHash = await bcrypt.hash(password, 10);
        await users.insertOne({
            username,
            user: user.name,
            password: passwordHash,
            groups: user.groups
        })
        generated.push(Object.assign({password, user: username}));
    }
    console.log(JSON.stringify(generated));
} catch (err) {
    console.error(err);
} finally {
    dbClient.close();
}
