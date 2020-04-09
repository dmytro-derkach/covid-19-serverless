const mongoose = require("mongoose");

const actualAllSchema = new mongoose.Schema(
  {
    city: { type: String },
    state: { type: String },
    country: { type: String },
    lastUpdate: { type: Date },
    lat: { type: String },
    long: { type: String },
    confirmed: { type: Number },
    deaths: { type: Number },
    recovered: { type: Number },
    commitSHA: { type: String, required: true },
  },
  { timestamps: true, versionKey: false }
);

actualAllSchema.statics = {
  saveData(data) {
    return ActualAll.insertMany(data);
  },

  removeByCommits(commits) {
    return ActualAll.deleteMany({ commitSHA: { $in: commits } });
  },
};

actualAllSchema.methods = {};

const ActualAll = mongoose.model("ActualAll", actualAllSchema);

module.exports = ActualAll;
