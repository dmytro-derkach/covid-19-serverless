const mongoose = require("mongoose");

const ACTUAL_SESSION = "actual";
const ARCHIVE_SESSION = "archive";

const sessionTypes = [ACTUAL_SESSION, ARCHIVE_SESSION];

const parserSessionSchema = new mongoose.Schema(
  {
    type: { type: String, enum: sessionTypes, required: true },
    isProcessed: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false }
);

parserSessionSchema.statics = {
  ACTUAL_SESSION,
  ARCHIVE_SESSION,
};

parserSessionSchema.methods = {};

const ParserSession = mongoose.model("ParserSession", parserSessionSchema);

module.exports = ParserSession;
