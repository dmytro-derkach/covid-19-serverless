const ActualSummary = require("@models/actualSummary");
const ActualCountries = require("@models/actualCountries");

const getActualSummary = async (context) => {
  const { parserSession } = context;
  return await ActualSummary.findOneByCommit(parserSession.commitSHA).select(
    "confirmed deaths recovered affectedCountries updatedAt -_id"
  );
};

const getActualCountries = async (context, event) => {
  const { parserSession } = context;
  let {
    pathParameters: { sortBy = "confirmed" },
  } = event;
  let sortKey = -1;
  if (sortBy === "alphabetic") {
    sortBy = "country";
    sortKey = 1;
  }
  return await ActualCountries.findAllByCommit(parserSession.commitSHA)
    .sort({
      [sortBy]: sortKey,
    })
    .select("-_id -commitSHA");
};

module.exports = {
  getActualSummary,
  getActualCountries,
};
