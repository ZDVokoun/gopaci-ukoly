import serverlessExpress from "@vendia/serverless-express";
import app from "./gateway/app"

let serverlessExpressInstance

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

export { handler };
