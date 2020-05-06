const validator = require("@middy/validator");

const inputSchema = {
  type: "object",
  properties: {
    pathParameters: {
      type: "object",
      properties: {
        countryName: {
          type: "string",
          minLength: 1,
        },
      },
    },
  },
};

module.exports = () => validator({ inputSchema });
