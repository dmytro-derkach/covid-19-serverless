const mongoose = require("mongoose");

const ACTUAL_SESSION = "actual";
const ARCHIVE_SESSION = "archive";

const sessionTypes = [ACTUAL_SESSION, ARCHIVE_SESSION];

const parserSessionSchema = new mongoose.Schema(
  {
    type: { type: String, enum: sessionTypes, required: true },
    commitSHA: { type: String, required: true },
    isProcessed: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false }
);

parserSessionSchema.statics = {
  ACTUAL_SESSION,
  ARCHIVE_SESSION,

  createSession({ type, commitSHA, isProcessed }) {
    return ParserSession.create({ type, commitSHA, isProcessed });
  },

  getDeprecatedlSessions({ type }) {
    return ParserSession.find({ type }).sort({ createdAt: -1 }).skip(2).exec();
  },

  removeByCommits(commits) {
    return ParserSession.deleteMany({ commitSHA: { $in: commits } });
  },
};

parserSessionSchema.methods = {};

const ParserSession = mongoose.model("ParserSession", parserSessionSchema);

module.exports = ParserSession;
