require("module-alias/register");
const middy = require("@middy/core");
const loadSSM = require("@middlewares/loadSSM");
const connectDb = require("@middlewares/connectDb");
const { parseAndSaveActualData } = require("@services/parser");
const validator = require("@validators/actualDataParser");
const sqsJsonBodyParser = require("@middy/sqs-json-body-parser");

const processHandler = async (event) => {
  const payload = event.Records[0].body;
  console.log("payload", payload);
  await parseAndSaveActualData(payload);
  return {};
};

const handler = middy(processHandler)
  .use(loadSSM())
  .use(connectDb())
  .use(sqsJsonBodyParser())
  .use(validator());

module.exports = { handler };
