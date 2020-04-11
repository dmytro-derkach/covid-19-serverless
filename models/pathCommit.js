const mongoose = require("mongoose");

const pathCommitSchema = new mongoose.Schema(
  {
    path: { type: String, required: true },
    branch: { type: String, required: true },
    commitSHA: { type: String },
    isProcessed: { type: Boolean, default: false },
    rootCommits: [{ type: String }],
  },
  { timestamps: true, versionKey: false }
);

pathCommitSchema.statics = {
  findDataByCommit({ path, branch, commitSHA }) {
    return PathCommit.findOne({ path, branch, commitSHA });
  },

  getById(id) {
    return PathCommit.findById(id);
  },

  async saveCommit({ path, branch, commitSHA, isProcessed, rootCommit }) {
    let data = await PathCommit.findOne({
      path,
      branch,
    });
    if (!data) {
      data = new PathCommit({ path, branch });
    }
    if (rootCommit) {
      data.rootCommits = [rootCommit];
    }
    data.commitSHA = commitSHA;
    data.isProcessed = isProcessed;
    return data.save();
  },

  saveData(data) {
    return PathCommit.insertMany(data);
  },
};

pathCommitSchema.methods = {
  appendRootCommit(rootCommit) {
    this.rootCommits.push(rootCommit);
    return this.save();
  },

  removeCommit() {
    return this.remove();
  },

  updateCommit(commit) {
    Object.assign(this, commit);
    return this.save();
  },
};

const PathCommit = mongoose.model("PathCommit", pathCommitSchema);

module.exports = PathCommit;
