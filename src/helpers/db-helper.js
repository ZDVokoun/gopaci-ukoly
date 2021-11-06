import { MongoClient } from "mongodb";

const dbName = "gopaci-ukoly";
export function createClient(url = `mongodb+srv://spravce:${process.env.MONGODB_PASSWORD}@cluster0.u4fbx.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`) {
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
    
    return client;
}