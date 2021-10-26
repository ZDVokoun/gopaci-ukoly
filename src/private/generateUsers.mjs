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

const userList = [
    {name: "Ondřej Sedláček", groups: ["Aj2", "S1", "whole", "Hv", "Nj"]},
    {name: "Tereza Korčeková", groups: ["Aj1", "S1", "whole", "Vv", "Fj"]},
    {name: "Vít Stružka", groups: ["Aj2", "S2", "whole", "Hv", "Nj"]},
    {name: "Matyáš Urban", groups: ["Aj2", "S1", "whole", "Hv", "Fj"]},
];

const dbClient = createClient(`***REMOVED***`);
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
        const insertion = await users.insertOne({
            username,
            user: user.name,
            password: passwordHash,
            groups: user.groups
        })
        generated.push(Object.assign(insertion, {password, user: user.name}));
    }
    console.log(JSON.stringify(generated));
} catch (err) {
    console.error(err);
} finally {
    dbClient.close();
}
