const mongoose = require("mongoose");

const actualSummarySchema = new mongoose.Schema(
  {
    confirmed: { type: Number },
    deaths: { type: Number },
    recovered: { type: Number },
    active: { type: Number },
    affectedCountries: { type: Number },
    commitSHA: { type: String, required: true },
  },
  { timestamps: true, versionKey: false }
);

actualSummarySchema.statics = {
  saveData(data) {
    return ActualSummary.create(data);
  },

  removeByCommits(commits) {
    return ActualSummary.deleteMany({ commitSHA: { $in: commits } });
  },

  findOneByCommit(commitSHA, additionalCond = {}) {
    return ActualSummary.findOne({ commitSHA, ...additionalCond });
  },
};

actualSummarySchema.methods = {};

const ActualSummary = mongoose.model("ActualSummary", actualSummarySchema);

module.exports = ActualSummary;
