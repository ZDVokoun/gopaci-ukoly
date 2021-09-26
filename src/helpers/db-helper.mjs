import MongoDB from "mongodb";
const MongoClient = MongoDB.MongoClient;
const dbName = "gopaci-ukoly";
function createClient() {
    const client = new MongoClient(
        `mongodb://127.0.0.1:27017`,
        { useNewUrlParser: true, useUnifiedTopology: true }
    )

    client.usersCollection = function() {return this.db(dbName).collection("users");};
    client.loginsCollection = function() {return this.db(dbName).collection("logins");};
    return client;
}
export { createClient };