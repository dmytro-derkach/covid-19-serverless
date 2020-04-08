const { validator } = require("middy/middlewares");

const inputSchema = {
  type: "object",
  properties: {
    Records: {
      type: "array",
      contains: {
        type: "object",
        properties: {
          body: {
            type: "object",
            properties: {
              commitSHA: { type: "string" },
            },
            required: ["commitSHA"],
          },
        },
        required: ["body"],
      },
      minItems: 1,
    },
  },
  required: ["Records"],
};

module.exports = () => validator({ inputSchema });
