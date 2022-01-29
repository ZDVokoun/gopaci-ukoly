import express from "express"
import { createClient } from "../../helpers/db-helper.js";
import bcrypt from "bcryptjs";
import { createJwtCookie, jwtExtract } from "../../helpers/jwt-helper.js";
import cookieParser from "cookie-parser";
import { hasValues, passesWhitelist } from "../../helpers/validation-helper.js";
import { sendNotifications } from "../../helpers/push-helper.js"
import { ObjectId } from "mongodb";
// import { getCurrentInvoke } from "@vendia/serverless-express"

const app = express();
let db = createClient();
let payload = {};

app.initializeDB = () => {
  return new Promise((resolve, reject) => db.connect().then(() => resolve("Connected")).catch(err => reject(err)))
}

function err(status, msg) {
  let err = new Error(msg);
  err.status = status;
  return err;
}

function log(req, res, next) {
  const err = req.error;
  const obj = req.toLog;
  return new Promise(async (resolve, reject) => {
    const toLog = {
      ...obj,
      IP: req.headers["x-bb-ip"],
      time: new Date(),
      method: req.method,
      url: req.url,
      status: req.status,
      "user-agent": req.headers["user-agent"]
    }
    if (err) {
      console.error(`[${toLog.IP} ${toLog.time.toLocaleString}] ${toLog.method + ":" + toLog.url} ${toLog.status}`)
      return
    }
    console.log(`[${toLog.IP} ${toLog["user-agent"]} ${toLog.time.toLocaleString}] ${toLog.method + ":" + toLog.url} ${toLog.status}`)
    // return db[dest]().insertOne(toLog);
  })
}


app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

/*
 * Check if user is authorized before accessing content
 */
app.use('/api/content', (req, res, next) => {
  payload = jwtExtract(req.cookies);
  if (!payload) {
    next(err(401, "Unauthorized"))
  }
  next()
})

/*
 * Connect to the database
app.use(['/api/auth/login', '/api/auth/changepassword', '/api/content'] , async (req, res, next) => {
  await db.connect()
  next();
})
 */

app.get(['/api/hello', '/api/helloworld'], (req, res) => {
  res.json({msg: "Hello world!"});
})

app.post('/api/auth/login', async (req, res, next) => {
  const { username, password } = req.body;

  // Check if user exists
  const existingUser = await db.usersCollection().findOne({ username });
  if (existingUser === null) next(err(401, "Invalid password or username"))

  // Check hashes
  const passwordHash = existingUser.hashedPassword || existingUser.password;
  const matches = await bcrypt.compare(password, passwordHash);
  if (!matches) next(err(401, "Invalid password or username"))

  // Creating JWT cookie
  const userId = existingUser._id;
  const jwtCookie = createJwtCookie(userId, username);
  // await log({successful: true}, req)

  db.close();
  res.set('Set-Cookie', jwtCookie)
  res.json({id: userId, username})
})

/*
 * Changes password
 */
app.post('/api/auth/changepassword', async (req, res, next) => {
  const { password, newPassword } = req.body;

  const existingUser = await db.usersCollection().findOne({ username: payload.username });
  const matches = await bcrypt.compare(password, existingUser.password);
  if (!matches) next(err(401, "Unauthorized"))

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await db.usersCollection().updateOne({ username: payload.username }, {$set: {password: passwordHash}});

  res.json({ msg: "Success" })
})

/*
 * Logouts user (remove JWT cookie)
 */
app.get('/api/auth/logout', (req, res) => {
  res.clearCookie();
  res.json({ msg: "Logged out successfully" })
})

/*
 * Adds homework
 */
app.post('/api/content/homework', async (req, res, next) => {
  // Value checking
  const requiredValues = ["name", "dueTime", "subject", "group"];
  const valueWhitelist = ["name", "dueTime", "subject", "group", "description", "voluntary", "preciseTime", "type"];
  if (
    new Date(req.dueTime) < new Date()
      || !hasValues(req, requiredValues)
      || !passesWhitelist(req, valueWhitelist)
  ) next(err(400, "Bad request"))

  // Get subject name for push notification
  const subject = (await db.subjectsCollection().findOne({shortcut: req.subject}, {name: 1})).name

  // Get list of push subscriptions and filter them
  const subscriptions = (await db.usersCollection().find({
    subscriptions: { $exists: true },
    groups: {$in: [req.group]},
    notifyAbout: { $in: ["homeworks"] },
    username: { $not: {$regex: payload.username} }
  }, {subscriptions: 1}).toArray()).map(item => item.subscriptions).flat(2)

  // Get full name of user from database
  const fullName = (await db.usersCollection().findOne({username: payload.username}, {user: 1})).user

  // Insert homework
  const { insertedId } = await db.homeworksCollection().insertOne(Object.assign(req, {
    "user": payload.username,
    "dueTime": new Date(req.dueTime),
    "createTime": new Date(),
  }))

  // Send notification
  await sendNotifications(`Nový úkol "${req.name}" zveřejněn`, `Uživatelem ${fullName} na předmět ${subject}`, `/homework/${insertedId.toString()}`, subscriptions)

  res.json({msg: "Success"})

})

/*
 * Updates certaion homework
 */
app.put('/api/content/homework/:id', async (req, res, next) => {
  const id = req.params.id;

  // Value checking
  const requiredValues = ["name", "dueTime", "subject", "group"];
  const valueWhitelist = ["name", "dueTime", "subject", "group", "description", "voluntary", "preciseTime", "type"];
  if (
    new Date(req.dueTime) < new Date()
      || !hasValues(req, requiredValues)
      || !passesWhitelist(req, valueWhitelist)
  ) next(err(400, "Bad request"))

  // Check if user posted the homework
  const homework = await db.homeworksCollection().findOne({_id: new ObjectId(id)})
  if (homework.user !== payload.username) next(err(403, "Forbidden"))

  // Get subject name for push notification
  const subject = (await db.subjectsCollection().findOne({shortcut: req.subject}, {name: 1})).name

  // Get list of push subscriptions and filter them
  const subscriptions = (await db.usersCollection().find({
    subscriptions: { $exists: true },
    groups: {$in: [req.group]},
    notifyAbout: { $in: ["homeworks"] },
    username: { $not: {$regex: payload.username} }
  }, {subscriptions: 1}).toArray()).map(item => item.subscriptions).flat(2)

  // Get full name of user from database
  const fullName = (await db.usersCollection().findOne({username: payload.username}, {user: 1})).user

  // Update homework
  const insertion = {...req, "dueTime": new Date(req.dueTime), "lastModified": new Date()};
  await db.homeworksCollection().updateOne({_id: new ObjectId(id)}, {$set: insertion})

  // Send notification
  await sendNotifications(`Úkol "${req.name}" aktualizován`, `Uživatelem ${fullName} na předmět ${subject}`, `/homework/${id}`, subscriptions)

  res.json({ msg: "Success" })
})

/*
 * Get list of homeworks
 */
app.get('/api/content/homeworks', async (req, res, next) => {
  let data = [];

  // Get groups where user is a member
  const userGroups =
        (await db.usersCollection().findOne({ username: payload.username })).groups;

  // Get homeworks from the database
  const rawData =
        await db.homeworksCollection().find({dueTime : { $gt:new Date() }}).toArray();

  // Get all done documents of user
  const doneHomeworks = (await db.doneCollection().find(
    {user: payload.username, undone: undefined}
  ).toArray());

  // Filter homeworks
  data = rawData
    .filter(item => userGroups.some(group => item.group === group))
    .map(item => ({
      id: item._id,
      name: item.name,
      dueTime: item.dueTime,
      voluntary: item.voluntary,
      subject: item.subject,
      type: item.type,
      done: doneHomeworks.some(done => done.homework === item._id.toHexString())
    }))
  res.json(data);
})

/*
 * Get homework with certain id
 */
app.get('/api/content/homework/:id', async (req, res, next) => {
  let result = [];
  const id = req.params.id;

  // Get homework document from the database
  const rawData = await db.homeworksCollection().findOne({_id: new ObjectId(id)})
  if (!rawData) next(err(404, "Not found"))

  // Get array of username - user's full name pairs
  const userList = await db.usersCollection().find({}, { username: 1, user: 1 }).toArray();

  // Check if homework is checked as done
  const isDone = Boolean(await db.doneCollection().findOne({
    user: payload.username,
    homework: id,
    undone: undefined
  }));

  // Get list of comments for homework
  const homeworkComments = (await db.commentsCollection().find({ homework: id }).toArray())
      .map(item => Object.assign(item, {
        userFullName: userList.find(user => item.user === user.username)["user"]
      }));
  // Get full name of subject from the database
  const subjectFullName = (await db.subjectsCollection().findOne(
    {shortcut: rawData.subject},
    {name: 1}
  )).name

  result = Object.assign(rawData, {
    userFullName: userList.find(user => rawData.user === user.username)["user"],
    subjectFullName,
    comments: homeworkComments,
    done: isDone
  });
  res.json(result)
})

/*
 * Sets the homework as done
 */
app.put('/api/content/done/:id', async (req, res, next) => {
  const id = req.params.id;
  // Check if homework is already checked as done
  const isDone = await db.doneCollection().findOne({
    homework: id,
    user: payload.username,
    undone: undefined
  })
  // Set homework for user as done
  if (!isDone) {
    await db.doneCollection().insertOne({
      homework: id,
      user: payload.username,
      time: new Date()
    })
  }
  res.json({ msg: "Success" })
})

/*
 * Unchecks the homework
 */
app.delete('/api/content/done/:id', async (req, res, next) => {
  const id = req.params.id;

  // Updates document to uncheck the homework
  await db.doneCollection().updateOne({
    homework: id,
    user: payload.username,
    undone: undefined
  }, {$set: {undone: true}})

  res.json({ msg: "Success" })
})

app.post('/api/content/comment', async (req, res, next) => {
  // Get homework
  const homework =
        await db.homeworksCollection().findOne({_id: ObjectId(req.body.homework)})

  // Get push subscriptions
  const subscriptions =
    (await db.usersCollection().find({
      subscriptions: { $exists: true },
      groups: {$in: [homework.group]},
      notifyAbout: {$in: ["comments"]},
      mutedUser: { $not: { $in: [payload.username] } },
      username: { $not: {$regex: payload.username} }
    }, {subscriptions: 1}).toArray()).map(item => item.subscriptions).flat(2)

  // Get user's full name
  const fullName = (await db.usersCollection().findOne(
    { username: payload.username },
    {user: 1})).user;

  // Insert comment
  const { insertedId } = await db.commentsCollection().insertOne(Object.assign(req, {
    user: payload.username,
    createDate: new Date()
  }))

  // Send push notification
  await sendNotifications(`Přidán nový komentář na úkol "${homework.name}" od uživatele ${fullName}`, "", `/homework/${req.homework}#${insertedId.toString()}`, subscriptions)

  res.json({ msg: "Success" })
})

/*
 * Returns array of subjects
 */
app.get('/api/content/subjects', async (req, res, next) => {
  let result = await db.subjectsCollection().find({}).toArray();
  res.json(result)
})

/*
 * Returns image from the database
 */
app.get('/api/content/images/:id', async (req, res, next) => {
  const id = req.params.id
  const {type, content} = await db.imagesCollection().findOne({_id: new ObjectId(id)});

  res.set("Content-Type", type)
  res.end(content.buffer)
})

/*
 * Inserts images to the database uploaded in base64 format
 */
app.post('/api/content/images', async (req, res, next) => {
  // Upload multiple images
  let insertion = await db.imagesCollection().insertMany(
    req.body.map(item => {return {
      ...item,
      uploadDate: new Date(),
      content: Buffer.from(item.content, "base64")
    }}));

  // Return ids of images to use in comments
  res.json(Object.values(insertion.insertedIds))
})

/*
 * Changes user preferences
 */
app.post('/api/settings', async (req, res, next) => {
  const valueWhitelist = ["notifyAbout", "mutedUsers"];
  if (typeof req.body !== "object" && !req.body.settings && !passesWhitelist(req.settings, valueWhitelist))
    next(err(400, "Bad request"))

  await db.usersCollection().updateOne({username: payload.username}, { $set: req.settings })

  res.json({ msg: "Success" })
})

/*
 * Get user preferences
 */
app.get('/api/settings', async (req, res, next) => {
  const valueWhitelist = ["notifyAbout", "mutedUsers"];

  const fromDatabase = (await db.usersCollection().findOne({username: payload.username}, { password: 0, hashedPassword: 0 }))

  const results = Object.fromEntries(Object.entries(fromDatabase).filter(([key, value]) => valueWhitelist.includes(key)))
  res.json(results)
})

/*
 * Adds push subscription
 */
app.post('/api/settings/push', async (req, res, next) => {
  await db.usersCollection().updateOne(
    {username: payload.username},
    { $addToSet: {subscriptions: req.subscription} }
  )

  res.json({msg: "Success"})
})

/*
 * Removes sent push subscription
 */
app.delete('/api/settings/push', async (req, res, next) => {
  await db.usersCollection().updateOne(
    {username: payload.username},
    { $pull: { subscriptions: req.body.subscription } }
  );

  res.json({ msg: "Success" })
})

app.use(function(err, req, res, next){
  res.status(err.status || 500);
  res.send(err);
});


export default app;
