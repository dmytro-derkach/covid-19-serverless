require("module-alias/register");
const middy = require("@middy/core");
const loadSSM = require("@middlewares/loadSSM");
const connectDb = require("@middlewares/connectDb");
const { parseAndSaveArchiveData } = require("@services/parser");
const validator = require("@validators/archiveDataParser");
const sqsJsonBodyParser = require("@middy/sqs-json-body-parser");

const processHandler = async (event) => {
  const payload = event.Records[0].body;
  console.log("payload", payload);
  await parseAndSaveArchiveData(payload);
  return {};
};

const handler = middy(processHandler)
  .use(loadSSM())
  .use(connectDb())
  .use(sqsJsonBodyParser())
  .use(validator());

module.exports = { handler };
