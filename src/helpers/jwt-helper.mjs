import jwt from "jsonwebtoken";
import cookie from "cookie";

const publicKey = `-----BEGIN PUBLIC KEY-----
MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAp6CiQvzPfky4XIzSOvGN
1yY74gwoqF54HJ2bnQavoEj1r5SpudC3E3ovI7sKsWpf/7dzN8CQxU6tGAdrrk6g
kqQnb3a6H864A+aLWr3khUjrWDmByKgjjHy4D4qAN/R2ZyWy5rfQvl1Yvoz9on4d
30kLJP1Y/hSA6nZ3H9Cel15clLfCsa3OPz0sQr0St94Ry/IPE+LtEzTyqOLZY+L3
uR9PRnF3kilUWdVOyGoQ7RbWKzCq/EK4nS/eqetqP9BkGd6Sflmc7+tASz3a1KOQ
fVu0mlwZk6oy+S5HiVC6UTT5mXd1X2v8D395eNDJnpaNmo/V/XISK2A19XdiS3Xp
S01S6sBfgCXjx1+u8ZxunMMIh1IHKJSBAjsV3llckCIX50UY/tFuSKcRaz3gluhl
TDpC0ICy7KKdfLXD9WVFGiVDoyPCFZASaEhHgt4RwH32aPNNg4sZQQ4VEzV/gau7
MTE392SPlhKwS9HHohwLi+lPBolkNpZq82D7vkOs2ncwXA3YSL0pRQqRPk9expdP
CBs/RjsLp46wLpfxD/qIirzP9AWCUdfz+9dcBYhpzQi2AjISJT0VsGeHcEsjVw7r
XC0v68O2BlS4iAk8uWwyoJN9FG1VCaFwr4bnZRTpIlxGixqSX92xrAAdh3Vq5fty
CEjxz7JLe40FlJgawrs2xLECAwEAAQ==
-----END PUBLIC KEY-----`;

function createJwtCookie(userId, username) {
    const secretKey = 
        "-----BEGIN RSA PRIVATE KEY-----\n" +
        process.env.JWT_SECRET_KEY +
        "\n-----END RSA PRIVATE KEY-----";
    
    const token = jwt.sign({userId, username}, secretKey, {
        algorithm: "RS256",
        expiresIn: "10 days"
    })
    const jwtCookie = cookie.serialize("jwt", token, {
        secure: process.env.NETLIFY_DEV !== "true",
        httpOnly: true,
        path: "/"
    })
    return jwtCookie;
}
function clearCookie() {
    return "jwt=deleted; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
}
function jwtExtract(jwtcookie) {
    const cookies = jwtcookie && cookie.parse(jwtcookie);
    if (!cookies || !cookies.jwt) return;
    try {
        const payload = jwt.verify(cookies.jwt, publicKey);
        return { userId: payload.userId, username: payload.username };
    } catch (err) {
        return;
    }
}

export { createJwtCookie, clearCookie, jwtExtract, publicKey };