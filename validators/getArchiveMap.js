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
        stateName: {
          type: "string",
          minLength: 1,
        },
        cityName: {
          type: "string",
        },
      },
    },
  },
};

module.exports = () => validator({ inputSchema });
