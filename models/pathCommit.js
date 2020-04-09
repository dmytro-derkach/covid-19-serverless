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

pathCommitSchema.statics = {
  findDataByCommit({ path, branch, commitSHA }) {
    return PathCommit.findOne({ path, branch, commitSHA });
  },

  async saveCommit({ path, branch, commitSHA, isProcessed }) {
    let data = await PathCommit.findOne({ path, branch });
    if (!data) {
      data = new PathCommit({ path, branch });
    }
    data.commitSHA = commitSHA;
    data.isProcessed = isProcessed;
    return data.save();
  },
};

pathCommitSchema.methods = {};

const PathCommit = mongoose.model("PathCommit", pathCommitSchema);

module.exports = PathCommit;
