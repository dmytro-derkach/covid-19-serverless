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
    confirmed_delta: { type: Number },
    deaths_delta: { type: Number },
    recovered_delta: { type: Number },
    active_delta: { type: Number },
    commitSHA: { type: String, required: true },
    casesDate: { type: String, required: true },
  },
  { timestamps: true, versionKey: false }
);

archiveAllSchema.index({ casesDate: 1 });
archiveAllSchema.index({ commitSHA: 1 });

archiveAllSchema.statics = {
  saveData(data) {
    return ArchiveAll.insertMany(data);
  },

  removeByCommits(commits, additionalCond) {
    return ArchiveAll.deleteMany({
      commitSHA: { $in: commits },
      ...additionalCond,
    });
  },

  findDataByCommit(commitSHA, additionalCond = {}) {
    return ArchiveAll.find({ commitSHA, ...additionalCond });
  },

  findOneByCommit(commitSHA, additionalCond = {}) {
    return ArchiveAll.findOne({ commitSHA, ...additionalCond });
  },
};

archiveAllSchema.methods = {
  updateData(data) {
    Object.assign(this, data);
    return this.save();
  },
};

const ArchiveAll = mongoose.model("ArchiveAll", archiveAllSchema);

module.exports = ArchiveAll;
