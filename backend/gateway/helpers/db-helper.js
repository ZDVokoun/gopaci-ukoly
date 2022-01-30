import { MongoClient } from "mongodb";

const dbName = "gopaci-ukoly";
export function createClient(url = process.env.MONGODB) {
    const client = new MongoClient(
        url,
        { useNewUrlParser: true, useUnifiedTopology: true }
    )

    client.usersCollection = function() {return this.db(dbName).collection("users");};
    client.loginsCollection = function() {return this.db(dbName).collection("logins");};
    client.homeworksCollection = function() {return this.db(dbName).collection("homeworks");};
    client.imagesCollection = function() {return this.db(dbName).collection("images");};
    client.subjectsCollection = function() {return this.db(dbName).collection("subjects");};
    client.commentsCollection = function() {return this.db(dbName).collection("comments");};
    client.doneCollection = function() {return this.db(dbName).collection("done");};
    client.errorsCollection = function() {return this.db(dbName).collection("errors");};
    client.activityCollection = function() {return this.db(dbName).collection("activity");};
    
    return client;
}
