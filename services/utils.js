const Path = require("path");

const getDateByPath = (path) => Path.basename(path).slice(0, -4);

module.exports = {
  getDateByPath,
};
