require("module-alias/register");
const middy = require("@middy/core");
const httpErrorHandler = require("@middy/http-error-handler");
const httpHeaderNormalizer = require("@middy/http-header-normalizer");
const httpEventNormalizer = require("@middy/http-event-normalizer");
const normalizedResponse = require("@middlewares/normalizedResponse");
const warmup = require("@middlewares/warmup");
const loadSession = require("@middlewares/loadSession");
const ParserSession = require("@models/parserSession");
const { getArchiveSummary } = require("@services/rest");

const loadSSM = require("@middlewares/loadSSM");
const connectDb = require("@middlewares/connectDb");

const processHandler = async (event, context) => {
  return {
    statusCode: 200,
    body: await getArchiveSummary(context),
  };
};

const handler = middy(processHandler)
  .use(warmup())
  .use(httpEventNormalizer())
  .use(loadSSM())
  .use(connectDb())
  .use(httpHeaderNormalizer())
  .use(loadSession(ParserSession.ARCHIVE_SESSION))
  .use(httpErrorHandler({ logger: null }))
  .use(normalizedResponse());

module.exports = { handler };
