require("module-alias/register");
const middy = require("@middy/core");
const loadSSM = require("@middlewares/loadSSM");
const connectDb = require("@middlewares/connectDb");
const { checkAndStartGeolocationSession } = require("@services/parser");

const processHandler = async () => {
  await checkAndStartGeolocationSession();
  return {};
};

const handler = middy(processHandler).use(loadSSM()).use(connectDb());

module.exports = { handler };
