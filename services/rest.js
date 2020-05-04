const ActualSummary = require("@models/actualSummary");

const getActualSummary = async (context) => {
  const { parserSession } = context;
  return await ActualSummary.findOneByCommit(parserSession.commitSHA).select(
    "confirmed deaths recovered affectedCountries updatedAt -_id"
  );
};

module.exports = {
  getActualSummary,
};
