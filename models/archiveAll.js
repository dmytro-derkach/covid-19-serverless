const mongoose = require("mongoose");

const archiveAllSchema = new mongoose.Schema(
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
    active: { type: Number },
    commitSHA: { type: String, required: true },
    casesDate: { type: String, required: true },
  },
  { timestamps: true, versionKey: false }
);

archiveAllSchema.statics = {
  saveData(data) {
    return ArchiveAll.insertMany(data);
  },

  removeByCommits(commits) {
    return ArchiveAll.deleteMany({ commitSHA: { $in: commits } });
  },
};

archiveAllSchema.methods = {};

const ArchiveAll = mongoose.model("ArchiveAll", archiveAllSchema);

module.exports = ArchiveAll;
