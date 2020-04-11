const mongoose = require("mongoose");

const archiveCountriesSchema = new mongoose.Schema(
  {
    country: { type: String },
    lastUpdate: { type: Date },
    confirmed: { type: Number },
    deaths: { type: Number },
    recovered: { type: Number },
    active: { type: Number },
    commitSHA: { type: String, required: true },
    casesDate: { type: String, required: true },
  },
  { timestamps: true, versionKey: false }
);

archiveCountriesSchema.statics = {
  saveData(data) {
    return ArchiveCountries.insertMany(data);
  },

  removeByCommits(commits) {
    return ArchiveCountries.deleteMany({ commitSHA: { $in: commits } });
  },
};

archiveCountriesSchema.methods = {};

const ArchiveCountries = mongoose.model(
  "ArchiveCountries",
  archiveCountriesSchema
);

module.exports = ArchiveCountries;
