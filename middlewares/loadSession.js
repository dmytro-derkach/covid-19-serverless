const createError = require("http-errors");
const mongoose = require("mongoose");
const ParserSession = require("@models/parserSession");

const loadSessionMiddleware = (type) => ({
  before: async (handler) => {
    const {
      context,
      event: { headers = {} },
    } = handler;
    if (headers["session-id"]) {
      if (
        typeof headers["session-id"] === "number" ||
        !mongoose.Types.ObjectId.isValid(headers["session-id"])
      ) {
        throw new createError(400, "Bad session-id header!");
      }
      context.parserSession = await ParserSession.getById(
        headers["session-id"]
      );
      if (!context.parserSession || context.parserSession.type !== type) {
        throw new createError(404, "Session not found!");
      }
    } else {
      context.parserSession = await ParserSession.getLastSession(type);
    }
  },
});

module.exports = (type = ParserSession.ACTUAL_SESSION) =>
  loadSessionMiddleware(type);
