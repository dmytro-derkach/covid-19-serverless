const { SSM_PATH } = require("@constants");
const { ssm } = require("middy/middlewares");

module.exports = () =>
  ssm({
    cache: true,
    paths: {
      APP: SSM_PATH,
    },
  });
