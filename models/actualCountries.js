const mongoose = require("mongoose");

const actualCountriesSchema = new mongoose.Schema(
  {
    country: { type: String },
    lastUpdate: { type: Date },
    lat: { type: String },
    long: { type: String },
    confirmed: { type: Number },
    deaths: { type: Number },
    recovered: { type: Number },
    active: { type: Number },
    commitSHA: { type: String, required: true },
  },
  { timestamps: true, versionKey: false }
);

actualCountriesSchema.statics = {
  saveData(data) {
    return ActualCountries.insertMany(data);
  },

  findAllByCommit(commitSHA) {
    return ActualCountries.find({ commitSHA });
  },

  removeByCommits(commits) {
    return ActualCountries.deleteMany({ commitSHA: { $in: commits } });
  },
};

actualCountriesSchema.methods = {};

const ActualCountries = mongoose.model(
  "ActualCountries",
  actualCountriesSchema
);

module.exports = ActualCountries;
