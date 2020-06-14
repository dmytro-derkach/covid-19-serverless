const omit = require("lodash.omit");

const randomInteger = (min, max) => {
  let rand = min - 0.5 + Math.random() * (max - min + 1);
  return Math.round(rand);
};

const sort = (data, field, alphabeticField = null) => {
  const sortAlphabetic = () => {
    if (typeof alphabeticField === "string") {
      return data
        .sort((a, b) => a.sort - b.sort)
        .sort((a, b) => a[alphabeticField].localeCompare(b[alphabeticField]))
        .map((el) => omit(el, ["commitSHA", "sort"]));
    } else if (Array.isArray(alphabeticField)) {
      let result = data.sort((a, b) => a.sort - b.sort);
      alphabeticField
        .reverse()
        .map(
          (field) =>
            (result = result.sort((a, b) => a[field].localeCompare(b[field])))
        );
      return result.map((el) => omit(el, ["commitSHA", "sort"]));
    }
  };

  if (field === "alphabetic") {
    return sortAlphabetic();
  } else {
    return data
      .sort((a, b) => a.sort - b.sort)
      .sort((a, b) => b[field] - a[field])
      .map((el) => omit(el, ["commitSHA", "sort"]));
  }
};

module.exports = {
  randomInteger,
  sort,
};
