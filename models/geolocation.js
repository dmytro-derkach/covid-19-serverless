const mongoose = require("mongoose");

const geolocationSchema = new mongoose.Schema(
  {
    city: { type: String },
    state: { type: String },
    country: { type: String },
    lastUpdate: { type: Date },
    lat: { type: String },
    long: { type: String },
    population: { type: Number, default: null },
    commitSHA: { type: String, required: true },
  },
  { timestamps: true, versionKey: false }
);

geolocationSchema.statics = {
  saveData(data) {
    return Geolocation.insertMany(data);
  },

  findAllByCommit(commitSHA, additionalCond = {}) {
    return Geolocation.find({ commitSHA, ...additionalCond });
  },

  removeByCommits(commits) {
    return Geolocation.deleteMany({ commitSHA: { $in: commits } });
  },
};

geolocationSchema.methods = {};

const Geolocation = mongoose.model("Geolocation", geolocationSchema);

module.exports = Geolocation;
