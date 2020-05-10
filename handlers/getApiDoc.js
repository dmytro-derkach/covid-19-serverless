require("module-alias/register");
const middy = require("@middy/core");
const normalizedResponse = require("@middlewares/normalizedResponse");
const warmup = require("@middlewares/warmup");
const { getApiDoc } = require("@services/apidoc");

const processHandler = async () => {
  return {
    statusCode: 200,
    body: getApiDoc(),
  };
};

const handler = middy(processHandler).use(warmup()).use(normalizedResponse());

module.exports = { handler };
