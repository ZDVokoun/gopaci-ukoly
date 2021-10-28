import bcrypt from "bcryptjs";
import { createClient } from "../helpers/db-helper.js";
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
    // { name: 'Barčanská Sandra', groups: [ 'whole', "Aj1", "Fj", "S1", "Vv" ] },
    // { name: 'Bednářová Adéla', groups: [ 'whole', "Vv", "Aj1", "Nj" ] },
    // { name: 'Brzezná Karolína', groups: [ 'whole', "Vv", "Aj1", "Fj" ] },
    // { name: 'Buršík Karel', groups: [ 'whole', "Aj1", "Hv", "Fj" ] },
    // { name: 'Buršík Vít', groups: [ 'whole', "Aj2", "Nj" ] },
    // { name: 'Čtyroká Eva', groups: [ 'whole', "Aj1", "Hv", "Nj" ] },
    // { name: 'Galbavá Laura', groups: [ 'whole', "Aj1", "Vv", "Fj" ] },
    // { name: 'Haňkovská Veronika', groups: [ 'whole', "Aj1", "Vv", "Fj" ] },
    // { name: 'Holeček Ondřej', groups: [ 'whole', "Aj1", "Nj" ] },
    // { name: 'Ježková Lucie', groups: [ 'whole', "Aj1", "Vv", "Nj" ] },
    // { name: 'Kándl Matěj', groups: [ 'whole', "Aj2", "Hv", "Fj" ] },
    // { name: 'Kočí Dominika', groups: [ 'whole', "Aj1", "Vv", "Fj" ] },
    // { name: 'Lukavská Eliška', groups: [ 'whole', "Aj2", "Vv", "Nj" ] },
    // { name: 'Mack Tadeáš', groups: [ 'whole', "Aj1", "Nj" ] },
    // { name: 'Pavlová Júlia', groups: [ 'whole', "Aj2", "Hv", "Fj" ] },
    // { name: 'Průhová Lucie', groups: [ 'whole', "Aj2", "Vv", "Fj" ] },
    // { name: 'Putz Otakar', groups: [ 'whole', "Aj1", "Vv", "Fj", "S2" ] },
    // { name: 'Putz Tobiáš', groups: [ 'whole', "Aj1", "Fj", "S1" ] },
    // { name: 'Růžička Jakub', groups: [ 'whole', "Aj1", "Hv", "Nj" ] },
    // { name: 'Sedláčková Barbora', groups: [ 'whole', "Aj2", "Nj", "S2" ] },
    // { name: 'Sladká Anežka', groups: [ 'whole', "Aj2", "Nj", "S1" ] },
    // { name: 'Součková Adéla', groups: [ 'whole', "Aj2", "Hv", "Fj" ] },
    // { name: 'Strejčková Adéla', groups: [ 'whole', "Aj2", "Vv", "Nj" ] },
    // { name: 'Šrámek Kristián', groups: [ 'whole', "Aj2", "Hv", "Nj", "S1" ] },
    // { name: 'Weiss David', groups: [ 'whole', "Aj2", "Hv", "Nj" ] },
    // { name: 'Zemanová Izabela', groups: [ 'whole', "Aj2", "Vv", "Nj", "S1" ] }
];

const dbClient = createClient(`mongodb+srv://spravce:***REMOVED***@cluster0.u4fbx.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`);
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
