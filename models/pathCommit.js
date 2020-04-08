const mongoose = require("mongoose");

const pathCommitSchema = new mongoose.Schema(
  {
    path: { type: String, required: true },
    branch: { type: String, required: true },
    commitSHA: { type: String, required: true },
    isProcessed: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false }
);

pathCommitSchema.statics = {};

pathCommitSchema.methods = {};

const PathCommit = mongoose.model("PathCommit", pathCommitSchema);

module.exports = PathCommit;
