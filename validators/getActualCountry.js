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
        sortBy: {
          type: "string",
          pattern: "^(confirmed|deaths|recovered|active|alphabetic)$",
        },
      },
    },
  },
};

module.exports = () => validator({ inputSchema });
