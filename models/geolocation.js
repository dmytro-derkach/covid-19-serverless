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

  async findOneByCommit(commitSHA, additionalCond = {}) {
    return (
      await Geolocation.aggregate([
        {
          $search: {
            compound: {
              should: Object.keys(additionalCond)
                .filter((key) => !!additionalCond[key])
                .map((key) => ({
                  search: {
                    query: additionalCond[key],
                    path: key,
                  },
                })),
            },
          },
        },
        {
          $match: {
            commitSHA,
          },
        },
        { $limit: 1 },
        {
          $project: {
            _id: 0,
            country: 1,
            state: 1,
            city: 1,
            lat: 1,
            long: 1,
            score: { $meta: "searchScore" },
          },
        },
      ]).exec()
    )[0];
  },

  removeByCommits(commits) {
    return Geolocation.deleteMany({ commitSHA: { $in: commits } });
  },
};

geolocationSchema.methods = {};

const Geolocation = mongoose.model("Geolocation", geolocationSchema);

module.exports = Geolocation;
