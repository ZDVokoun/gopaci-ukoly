import serverlessExpress from "@vendia/serverless-express";
import app from "./gateway/app"
// import { createClient } from "../helpers/db-helper.js";


let serverlessExpressInstance

/*
function asyncTask () {
  return new Promise((resolve, reject) => dbClient.connect().then(() => resolve("Connected")).catch(err => reject(err)))
}*/

async function setup (event, context) {
  const asyncValue = await app.initializeDB();
  console.log(asyncValue)
  serverlessExpressInstance = serverlessExpress({ app })
  return serverlessExpressInstance({...event, requestContext: context}, context)
}

function handler (event, context) {
  if (serverlessExpressInstance) return serverlessExpressInstance({...event, requestContext: context}, context)

  return setup(event, context)
}

// const handler = (event, context) =>
//       serverlessExpress({ app })({...event, requestContext: context}, context)
export { handler };
