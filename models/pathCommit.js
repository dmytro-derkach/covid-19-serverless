const mongoose = require("mongoose");

const pathCommitSchema = new mongoose.Schema(
  {
    path: { type: String, required: true },
    branch: { type: String, required: true },
    commitSHA: { type: String },
    isProcessed: { type: Boolean, default: false },
    rootCommits: [{ type: String }],
    deltasCalculated: { type: Boolean, default: false },
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

  findByRootCommit(rootCommit, additionalCond = {}) {
    return PathCommit.find({
      rootCommits: rootCommit,
      ...additionalCond,
    });
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

  removeRootCommit(rootCommit) {
    const index = this.rootCommits.indexOf(rootCommit);
    if (index > -1) {
      this.rootCommits.splice(index, 1);
    }
  },

  removeCommit() {
    return this.remove();
  },

  updateCommit(commit = {}) {
    Object.assign(this, commit);
    return this.save();
  },

  getLastRootCommit() {
    return this.rootCommits[this.rootCommits.length - 1];
  },
};

const PathCommit = mongoose.model("PathCommit", pathCommitSchema);

module.exports = PathCommit;
