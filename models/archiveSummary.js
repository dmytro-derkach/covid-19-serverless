const mongoose = require("mongoose");

const archiveSummarySchema = new mongoose.Schema(
  {
    confirmed: { type: Number },
    deaths: { type: Number },
    recovered: { type: Number },
    active: { type: Number },
    affectedCountries: { type: Number },
    commitSHA: { type: String, required: true },
    casesDate: { type: String, required: true },
  },
  { timestamps: true, versionKey: false }
);

archiveSummarySchema.statics = {
  saveData(data) {
    return ArchiveSummary.create(data);
  },

  removeByCommits(commits) {
    return ArchiveSummary.deleteMany({ commitSHA: { $in: commits } });
  },
};

archiveSummarySchema.methods = {};

const ArchiveSummary = mongoose.model("ArchiveSummary", archiveSummarySchema);

module.exports = ArchiveSummary;
