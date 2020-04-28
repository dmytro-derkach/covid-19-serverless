const validator = require("@middy/validator");

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
              _id: { type: "string" },
              commitSHA: { type: "string" },
              changedCommits: {
                type: "array",
                items: {
                  type: "string",
                },
                minItems: 1,
              },
            },
            required: ["_id", "commitSHA", "changedCommits"],
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
