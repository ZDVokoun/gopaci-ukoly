import express from "express"
import { createClient } from "./helpers/db-helper.js";
import bcrypt from "bcryptjs";
import { createJwtCookie, jwtExtract } from "./helpers/jwt-helper.js";
import cookieParser from "cookie-parser";
import { hasValues, passesWhitelist } from "./helpers/validation-helper.js";
import { sendNotifications } from "./helpers/push-helper.js"
import { ObjectId } from "mongodb";

const app = express();
let db = createClient();

app.initializeDB = () => {
  return new Promise((resolve, reject) => db.connect().then(() => resolve("Connected")).catch(err => reject(err)))
}

/*
 * Async error handling
 */
const asyncHandler = fn => (req, res, next) => {
  return Promise
    .resolve(fn(req, res, next))
    .catch(next)
}

function toAsyncRouter(router) {
  const methods = [ 'get', 'post', 'delete', "put" ]
  for (let key in router) {
    if (methods.includes(key)) {
      let method = router[key]
      router[key] = (path, ...callbacks) => method.call(router, path, ...callbacks.map(cb => asyncHandler(cb)))
    }
  }
  return router
}

const router = toAsyncRouter(express.Router())

/*
 * Error creator
 */
function err(status, msg) {
  let err = new Error(msg);
  err.status = status;
  return err;
}

/*
 * Logging middleware
 */
function log(req, res, next) {
  const loggingLogic = (req,res,next) => {
    return new Promise(async (resolve, reject) => {
      const err = req.error;
      const obj = req.toLog;
      const toLog = {
        IP: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        time: new Date(),
        method: req.method,
        url: req.url,
        status: res.statusCode,
        "user-agent": req.headers["user-agent"],
        username: req.payload && req.payload.username
      }
      let errMessage;
      let dest;
      if (err && err.status === 500) {
        try {
          console.error(`[${toLog.time.toString().split(" (")[0]}] ${toLog.method + ":" + toLog.url} ${err.message}`)
          await db.errorsCollection().insertOne(toLog);
          resolve()
        } catch (error) {
          console.error("Database error occured: " + error.message)
          resolve("Database error occured:")
        }
      }
      try {
        console.log(`[${toLog.IP} ${toLog.time.toString().split(" (")[0]}] ${toLog.method + ":" + toLog.url} ${toLog.status}`)
        await db.activityCollection().insertOne(toLog);
        resolve()
      } catch (error) {
        console.error("Database error occured: " + error.message)
        resolve("Database error occured:")
      }
    })
  }
  res.on("finish", () => {
    loggingLogic(req,res,next)
  })
  next()
}


app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

/*
 * Check if user is authorized before accessing content
 */
app.use('/api/content', (req, res, next) => {
  req.payload = jwtExtract(req.cookies);
  if (!req.payload) {
    throw (err(401, "Unauthorized"))
  }
  next()
})

router.post('/api/auth/login', async (req, res, next) => {
  const { username, password } = req.body;

  // Check if user exists
  const existingUser = await db.usersCollection().findOne({ username });
  if (existingUser === null) throw (err(401, "Invalid password or username"))

  // Check hashes
  const passwordHash = existingUser.password;
  const matches = await bcrypt.compare(password, passwordHash);
  if (!matches) throw (err(401, "Invalid password or username"))

  // Creating JWT cookie
  const userId = existingUser._id;
  const jwtCookie = createJwtCookie(userId, username);
  // await log({successful: true}, req)

  res.set('Set-Cookie', jwtCookie)
  res.json({id: userId, username})
  next()
})

/*
 * Changes password
 */
router.post('/api/auth/changepassword', async (req, res, next) => {
  const { password, newPassword } = req.body;

  const existingUser = await db.usersCollection().findOne({ username: req.payload.username }).catch(next);
  const matches = await bcrypt.compare(password, existingUser.password).catch(next);
  if (!matches) throw (err(401, "Unauthorized"))

  const passwordHash = await bcrypt.hash(newPassword, 10).catch(next);
  await db.usersCollection().updateOne({ username: req.payload.username }, {$set: {password: passwordHash}});

  res.json({ msg: "Success" })
  next()
})

/*
 * Logouts user (remove JWT cookie)
 */
router.get('/api/auth/logout', (req, res) => {
  res.clearCookie();
  res.json({ msg: "Logged out successfully" })
  next()
})

/*
 * Adds homework
 */
router.post('/api/content/homework', async (req, res, next) => {
  // Value checking
  const requiredValues = ["name", "dueTime", "subject", "group"];
  const valueWhitelist = ["name", "dueTime", "subject", "group", "description", "voluntary", "preciseTime", "type"];
  if (
    new Date(req.dueTime) < new Date()
      || !hasValues(req, requiredValues)
      || !passesWhitelist(req, valueWhitelist)
  ) throw (err(400, "Bad request"))

  // Get subject name for push notification
  const subject = (await db.subjectsCollection().findOne({shortcut: req.subject}, {name: 1})).name

  // Get list of push subscriptions and filter them
  const subscriptions = (await db.usersCollection().find({
    subscriptions: { $exists: true },
    groups: {$in: [req.group]},
    notifyAbout: { $in: ["homeworks"] },
    username: { $not: {$regex: req.payload.username} }
  }, {subscriptions: 1}).toArray()).map(item => item.subscriptions).flat(2)

  // Get full name of user from database
  const fullName = (await db.usersCollection().findOne({username: req.payload.username}, {user: 1}).catch(next)).user

  // Insert homework
  const { insertedId } = await db.homeworksCollection().insertOne(Object.assign(req, {
    "user": req.payload.username,
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
router.put('/api/content/homework/:id', async (req, res, next) => {
  const id = req.params.id;

  // Value checking
  const requiredValues = ["name", "dueTime", "subject", "group"];
  const valueWhitelist = ["name", "dueTime", "subject", "group", "description", "voluntary", "preciseTime", "type"];
  if (
    new Date(req.dueTime) < new Date()
      || !hasValues(req, requiredValues)
      || !passesWhitelist(req, valueWhitelist)
  ) throw (err(400, "Bad request"))

  // Check if user posted the homework
  const homework = await db.homeworksCollection().findOne({_id: new ObjectId(id)})
  if (homework.user !== req.payload.username) throw (err(403, "Forbidden"))

  // Get subject name for push notification
  const subject = (await db.subjectsCollection().findOne({shortcut: req.subject}, {name: 1})).name

  // Get list of push subscriptions and filter them
  const subscriptions = (await db.usersCollection().find({
    subscriptions: { $exists: true },
    groups: {$in: [req.group]},
    notifyAbout: { $in: ["homeworks"] },
    username: { $not: {$regex: req.payload.username} }
  }, {subscriptions: 1}).toArray()).map(item => item.subscriptions).flat(2)

  // Get full name of user from database
  const fullName = (await db.usersCollection().findOne({username: req.payload.username}, {user: 1})).user

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
router.get('/api/content/homeworks', async (req, res, next) => {
  let data = [];

  // Get groups where user is a member
  const userGroups =
        (await db.usersCollection().findOne({ username: req.payload.username })).groups;

  // Get homeworks from the database
  const rawData =
        await db.homeworksCollection().find({dueTime : { $gt:new Date() }}).toArray();

  // Get all done documents of user
  const doneHomeworks = (await db.doneCollection().find(
    {user: req.payload.username, undone: undefined}
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
router.get('/api/content/homework/:id', async (req, res, next) => {
  let result = [];
  const id = req.params.id;

  // Get homework document from the database
  const rawData = await db.homeworksCollection().findOne({_id: new ObjectId(id)})
  if (!rawData) throw (err(404, "Not found"))

  // Get array of username - user's full name pairs
  const userList = await db.usersCollection().find({}, { username: 1, user: 1 }).toArray();

  // Check if homework is checked as done
  const isDone = Boolean(await db.doneCollection().findOne({
    user: req.payload.username,
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
router.put('/api/content/done/:id', async (req, res, next) => {
  const id = req.params.id;
  // Check if homework is already checked as done
  const isDone = await db.doneCollection().findOne({
    homework: id,
    user: req.payload.username,
    undone: undefined
  })
  // Set homework for user as done
  if (!isDone) {
    await db.doneCollection().insertOne({
      homework: id,
      user: req.payload.username,
      time: new Date()
    })
  }
  res.json({ msg: "Success" })
})

/*
 * Unchecks the homework
 */
router.delete('/api/content/done/:id', async (req, res, next) => {
  const id = req.params.id;

  // Updates document to uncheck the homework
  await db.doneCollection().updateOne({
    homework: id,
    user: req.payload.username,
    undone: undefined
  }, {$set: {undone: true}})

  res.json({ msg: "Success" })
})

router.post('/api/content/comment', async (req, res, next) => {
  // Get homework
  const homework =
        await db.homeworksCollection().findOne({_id: ObjectId(req.body.homework)})

  // Get push subscriptions
  const subscriptions =
    (await db.usersCollection().find({
      subscriptions: { $exists: true },
      groups: {$in: [homework.group]},
      notifyAbout: {$in: ["comments"]},
      mutedUser: { $not: { $in: [req.payload.username] } },
      username: { $not: {$regex: req.payload.username} }
    }, {subscriptions: 1}).toArray()).map(item => item.subscriptions).flat(2)

  // Get user's full name
  const fullName = (await db.usersCollection().findOne(
    { username: req.payload.username },
    {user: 1})).user;

  // Insert comment
  const { insertedId } = await db.commentsCollection().insertOne(Object.assign(req, {
    user: req.payload.username,
    createDate: new Date()
  }))

  // Send push notification
  await sendNotifications(`Přidán nový komentář na úkol "${homework.name}" od uživatele ${fullName}`, "", `/homework/${req.homework}#${insertedId.toString()}`, subscriptions)

  res.json({ msg: "Success" })
})

/*
 * Returns array of subjects
 */
router.get('/api/content/subjects', async (req, res, next) => {
  let result = await db.subjectsCollection().find({}).toArray();
  res.json(result)
})

/*
 * Returns image from the database
 */
router.get('/api/content/images/:id', async (req, res, next) => {
  const id = req.params.id
  const {type, content} = await db.imagesCollection().findOne({_id: new ObjectId(id)});

  res.set("Content-Type", type)
  res.end(content.buffer)
})

/*
 * Inserts images to the database uploaded in base64 format
 */
router.post('/api/content/images', async (req, res, next) => {
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
router.post('/api/settings', async (req, res, next) => {
  const valueWhitelist = ["notifyAbout", "mutedUsers"];
  if (typeof req.body !== "object" && !req.body.settings && !passesWhitelist(req.settings, valueWhitelist))
    throw (err(400, "Bad request"))

  await db.usersCollection().updateOne({username: req.payload.username}, { $set: req.settings })

  res.json({ msg: "Success" })
})

/*
 * Get user preferences
 */
router.get('/api/settings', async (req, res, next) => {
  const valueWhitelist = ["notifyAbout", "mutedUsers"];

  const fromDatabase = (await db.usersCollection().findOne({username: req.payload.username}, { password: 0, hashedPassword: 0 }))

  const results = Object.fromEntries(Object.entries(fromDatabase).filter(([key, value]) => valueWhitelist.includes(key)))
  res.json(results)
})

/*
 * Adds push subscription
 */
router.post('/api/settings/push', async (req, res, next) => {
  await db.usersCollection().updateOne(
    {username: req.payload.username},
    { $addToSet: {subscriptions: req.subscription} }
  )

  res.json({msg: "Success"})
})

/*
 * Removes sent push subscription
 */
router.delete('/api/settings/push', async (req, res, next) => {
  await db.usersCollection().updateOne(
    {username: req.payload.username},
    { $pull: { subscriptions: req.body.subscription } }
  );

  res.json({ msg: "Success" })
})

app.use(log)
app.use(router)

app.use(function(err, req, res, next){
  req.error = err;
  res.status(err.status || 500);
  res.send(err.message);
},log);


export default app;
