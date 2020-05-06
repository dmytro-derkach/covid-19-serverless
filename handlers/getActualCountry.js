require("module-alias/register");
const middy = require("@middy/core");
const httpErrorHandler = require("@middy/http-error-handler");
const httpHeaderNormalizer = require("@middy/http-header-normalizer");
const httpEventNormalizer = require("@middy/http-event-normalizer");
const normalizedResponse = require("@middlewares/normalizedResponse");
const warmup = require("@middlewares/warmup");
const loadSession = require("@middlewares/loadSession");
const validator = require("@validators/getActualCountry");
const { getActualCountry } = require("@services/rest");

const loadSSM = require("@middlewares/loadSSM");
const connectDb = require("@middlewares/connectDb");

const processHandler = async (event, context) => {
  return {
    statusCode: 200,
    body: await getActualCountry(context, event),
  };
};

const handler = middy(processHandler)
  .use(warmup())
  .use(httpEventNormalizer())
  .use(validator())
  .use(loadSSM())
  .use(connectDb())
  .use(httpHeaderNormalizer())
  .use(loadSession())
  .use(httpErrorHandler({ logger: null }))
  .use(normalizedResponse());

module.exports = { handler };
