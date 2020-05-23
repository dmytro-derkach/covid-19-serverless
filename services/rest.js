const moment = require("moment");
const { DATE_FORMAT } = require("@constants");
const ActualSummary = require("@models/actualSummary");
const ActualCountries = require("@models/actualCountries");
const ActualAll = require("@models/actualAll");
const ArchiveSummary = require("@models/archiveSummary");
const ArchiveCountries = require("@models/archiveCountries");
const ArchiveAll = require("@models/archiveAll");
const PathCommit = require("@models/pathCommit");

const getActualSummary = async (context) => {
  const { parserSession } = context;
  return await ActualSummary.findOneByCommit(parserSession.commitSHA).select(
    "-_id -commitSHA -createdAt"
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

const getActualCountry = async (context, event) => {
  const { parserSession } = context;
  const commits = (
    await PathCommit.findByRootCommit(parserSession.commitSHA)
  ).map((el) => el.commitSHA);
  commits.push(parserSession.commitSHA);
  let {
    pathParameters: { countryName, sortBy = "confirmed" },
  } = event;
  countryName = decodeURIComponent(countryName);
  if (sortBy === "alphabetic") {
    sortBy = {
      city: 1,
      state: 1,
    };
  } else {
    sortBy = {
      [sortBy]: -1,
    };
  }
  return await ActualAll.findDataByCommits(commits, {
    country: countryName,
  })
    .sort(sortBy)
    .select("-_id -commitSHA");
};

const getActualMap = async (context) => {
  const { parserSession } = context;
  return await ActualAll.findAllByCommit(parserSession.commitSHA, {
    lat: { $ne: "" },
    long: { $ne: "" },
  }).select("-_id -commitSHA");
};

const getArchiveSummary = async (context) => {
  const { parserSession } = context;
  const commits = (
    await PathCommit.findByRootCommit(parserSession.commitSHA)
  ).map((el) => el.commitSHA);
  return (
    await ArchiveSummary.findDataByCommits(commits).select(
      "-_id -commitSHA -createdAt -updatedAt"
    )
  )
    .map((el) => ({
      ...el.toJSON(),
      casesTimestamp: moment(el.casesDate, DATE_FORMAT).valueOf(),
    }))
    .sort((a, b) => a.casesTimestamp - b.casesTimestamp);
};

const getArchiveCountry = async (context, event) => {
  const { parserSession } = context;
  let {
    pathParameters: { countryName },
  } = event;
  countryName = decodeURIComponent(countryName);
  const commits = (
    await PathCommit.findByRootCommit(parserSession.commitSHA)
  ).map((el) => el.commitSHA);
  return (
    await ArchiveCountries.findDataByCommits(commits, {
      country: countryName,
    }).select("-_id -commitSHA -createdAt -updatedAt")
  )
    .map((el) => ({
      ...el.toJSON(),
      casesTimestamp: moment(el.casesDate, DATE_FORMAT).valueOf(),
    }))
    .sort((a, b) => a.casesTimestamp - b.casesTimestamp);
};

const getArchiveMap = async (context, event) => {
  const { parserSession } = context;
  let {
    pathParameters: { countryName, stateName, cityName = "" },
  } = event;
  countryName = decodeURIComponent(countryName);
  stateName = decodeURIComponent(stateName);
  cityName = decodeURIComponent(cityName);
  const commits = (
    await PathCommit.findByRootCommit(parserSession.commitSHA)
  ).map((el) => el.commitSHA);
  return (
    await ArchiveAll.findDataByCommits(commits, {
      country: countryName,
      state: stateName,
      city: cityName,
    }).select("-_id -commitSHA -createdAt -updatedAt")
  )
    .map((el) => ({
      ...el.toJSON(),
      casesTimestamp: moment(el.casesDate, DATE_FORMAT).valueOf(),
    }))
    .sort((a, b) => a.casesTimestamp - b.casesTimestamp);
};

module.exports = {
  getActualSummary,
  getActualCountries,
  getActualCountry,
  getActualMap,
  getArchiveSummary,
  getArchiveCountry,
  getArchiveMap,
};
