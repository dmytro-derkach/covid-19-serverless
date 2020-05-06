const mongoose = require("mongoose");

const archiveSummarySchema = new mongoose.Schema(
  {
    confirmed: { type: Number },
    deaths: { type: Number },
    recovered: { type: Number },
    active: { type: Number },
    confirmed_delta: { type: Number },
    deaths_delta: { type: Number },
    recovered_delta: { type: Number },
    active_delta: { type: Number },
    affectedCountries: { type: Number },
    commitSHA: { type: String, required: true },
    casesDate: { type: String, required: true },
  },
  { timestamps: true, versionKey: false }
);

archiveSummarySchema.index({ casesDate: 1 });
archiveSummarySchema.index({ commitSHA: 1 });

archiveSummarySchema.statics = {
  saveData(data) {
    return ArchiveSummary.create(data);
  },

  removeByCommits(commits, additionalCond) {
    return ArchiveSummary.deleteMany({
      commitSHA: { $in: commits },
      ...additionalCond,
    });
  },

  findDataByCommit(commitSHA, additionalCond = {}) {
    return ArchiveSummary.find({ commitSHA, ...additionalCond });
  },

  findDataByCommits(commits, additionalCond = {}) {
    return ArchiveSummary.find({
      commitSHA: { $in: commits },
      ...additionalCond,
    });
  },

  findOneByCommit(commitSHA, additionalCond = {}) {
    return ArchiveSummary.findOne({ commitSHA, ...additionalCond });
  },
};

archiveSummarySchema.methods = {
  updateData(data) {
    Object.assign(this, data);
    return this.save();
  },
};

const ArchiveSummary = mongoose.model("ArchiveSummary", archiveSummarySchema);

module.exports = ArchiveSummary;
