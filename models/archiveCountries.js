const mongoose = require("mongoose");

const archiveCountriesSchema = new mongoose.Schema(
  {
    country: { type: String },
    lastUpdate: { type: Date },
    lat: { type: String },
    long: { type: String },
    confirmed: { type: Number },
    deaths: { type: Number },
    recovered: { type: Number },
    active: { type: Number },
    confirmed_delta: { type: Number },
    deaths_delta: { type: Number },
    recovered_delta: { type: Number },
    active_delta: { type: Number },
    commitSHA: { type: String, required: true },
    casesDate: { type: String, required: true },
  },
  { timestamps: true, versionKey: false }
);

archiveCountriesSchema.index({ casesDate: 1 });
archiveCountriesSchema.index({ commitSHA: 1 });

archiveCountriesSchema.statics = {
  saveData(data) {
    return ArchiveCountries.insertMany(data);
  },

  removeByCommits(commits, additionalCond) {
    return ArchiveCountries.deleteMany({
      commitSHA: { $in: commits },
      ...additionalCond,
    });
  },

  findDataByCommit(commitSHA, additionalCond = {}) {
    return ArchiveCountries.find({ commitSHA, ...additionalCond });
  },

  findDataByCommits(commits, additionalCond = {}) {
    return ArchiveCountries.find({
      commitSHA: { $in: commits },
      ...additionalCond,
    });
  },

  findOneByCommit(commitSHA, additionalCond = {}) {
    return ArchiveCountries.findOne({ commitSHA, ...additionalCond });
  },
};

archiveCountriesSchema.methods = {
  updateData(data) {
    Object.assign(this, data);
    return this.save();
  },
};

const ArchiveCountries = mongoose.model(
  "ArchiveCountries",
  archiveCountriesSchema
);

module.exports = ArchiveCountries;
