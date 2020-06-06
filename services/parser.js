const moment = require("moment");
const {
  getLastCommitHash,
  getContentByPath,
  getPathContent,
} = require("@services/github");
const {
  ACTUAL_CASES_PATH,
  ACTUAL_DATA_BRANCH,
  ARCHIVE_CASES_PATH,
  ARCHIVE_DATA_BRANCH,
  ACTUAL_CASES_COUNTY_PATH,
  DATE_FORMAT,
  GEOLOCATION_TABLE_PATH,
  GEOLOCATION_DATA_BRANCH,
} = require("@constants");
const PathCommit = require("@models/pathCommit");
const ParserSession = require("@models/parserSession");
const Geolocation = require("@models/geolocation");
const ActualAll = require("@models/actualAll");
const ActualCountries = require("@models/actualCountries");
const ActualSummary = require("@models/actualSummary");
const ArchiveAll = require("@models/archiveAll");
const ArchiveCountries = require("@models/archiveCountries");
const ArchiveSummary = require("@models/archiveSummary");
const { sendMessageToSQS, sendMessagesToSQS } = require("@services/queue");
const {
  processActualDataByUkraine,
  saveActualDataByUkraine,
  removeUnusedActualUkraineData,
  processArchiveUkraineData,
  saveArchiveDataByUkraine,
  updateArchiveUkraineRootCommit,
} = require("@services/ukraine");
const { parseCSV } = require("@services/csv");
const {
  actualDataParserQueueUrl,
  archiveDataParserQueueUrl,
  archiveSessionCreatorQueueUrl,
  archiveDeltasCalculatorQueueUrl,
  archiveDeltasSessionMarkerQueueUrl,
  geolocationDataParserQueueUrl,
} = require("@vars");
const { getDateByPath } = require("@services/utils");

const CONCURRENCY = 100;

const checkAndStartActualSession = async () => {
  const commitSHA = await getLastCommitHash(
    ACTUAL_CASES_PATH,
    ACTUAL_DATA_BRANCH
  );
  if (
    !(await PathCommit.findDataByCommit({
      path: ACTUAL_CASES_PATH,
      branch: ACTUAL_DATA_BRANCH,
      commitSHA,
    }))
  ) {
    await sendMessageToSQS(actualDataParserQueueUrl, { commitSHA });
  }
};

const checkAndStartArchiveSession = async () => {
  if (
    (await ParserSession.getLastProcessedSession(
      ParserSession.GEOLOCATION_SESSION
    )) &&
    !(
      await ParserSession.getUnprocessedSessions(
        ParserSession.ARCHIVE_SESSION,
        true
      )
    ).length
  ) {
    const commitSHA = await getLastCommitHash(
      ARCHIVE_CASES_PATH,
      ARCHIVE_DATA_BRANCH
    );
    if (
      !(await PathCommit.findDataByCommit({
        path: ARCHIVE_CASES_PATH,
        branch: ARCHIVE_DATA_BRANCH,
        commitSHA,
      }))
    ) {
      await sendMessageToSQS(archiveSessionCreatorQueueUrl, { commitSHA });
    }
  }
};

const parseAndSaveActualData = async (payload) => {
  const actualAll = await processAllActualData(payload.commitSHA);
  const actualCountries = await processActualDataByCountries(payload.commitSHA);
  const actualUkraine = await processActualDataByUkraine(payload.commitSHA);
  await ActualAll.saveData(actualAll);
  await ActualCountries.saveData(actualCountries.cases);
  await ActualSummary.saveData(actualCountries.summary);
  await saveActualDataByUkraine(actualUkraine);
  await PathCommit.saveCommit({
    commitSHA: payload.commitSHA,
    path: ACTUAL_CASES_PATH,
    branch: ACTUAL_DATA_BRANCH,
    isProcessed: true,
  });
  await ParserSession.createSession({
    type: ParserSession.ACTUAL_SESSION,
    commitSHA: payload.commitSHA,
    isProcessed: true,
  });
  await removeUnusedActualData();
};

const processAllActualData = async (commitSHA) => {
  const data = await getContentByPath(ACTUAL_CASES_PATH, ACTUAL_DATA_BRANCH);
  const items = parseCSV(data);
  let cases = [];
  for (let i = 0; i < items.length; i++) {
    const element = items[i];
    const payload = {
      city: element.city,
      state: element.state,
      country: element.country,
      lastUpdate: new Date(`${element.lastUpdate}+00`),
      lat: element.lat,
      long: element.long,
      confirmed: Number(element.confirmed),
      deaths: Number(element.deaths),
      recovered: Number(element.recovered),
      commitSHA,
    };
    payload.active = payload.confirmed - payload.deaths - payload.recovered;
    cases.push(payload);
  }
  return cases;
};

const processActualDataByCountries = async (commitSHA) => {
  const data = await getContentByPath(
    ACTUAL_CASES_COUNTY_PATH,
    ACTUAL_DATA_BRANCH
  );
  const items = parseCSV(data);
  let cases = [];
  let summary = {
    confirmed: 0,
    deaths: 0,
    recovered: 0,
    active: 0,
    commitSHA,
  };
  for (let i = 0; i < items.length; i++) {
    const element = items[i];
    const payload = {
      country: element.country,
      lastUpdate: new Date(`${element.lastUpdate}+00`),
      lat: element.lat,
      long: element.long,
      confirmed: Number(element.confirmed),
      deaths: Number(element.deaths),
      recovered: Number(element.recovered),
      commitSHA,
    };
    payload.active = payload.confirmed - payload.deaths - payload.recovered;
    cases.push(payload);
    summary.confirmed += payload.confirmed;
    summary.deaths += payload.deaths;
    summary.recovered += payload.recovered;
    summary.active += payload.active;
  }
  summary.affectedCountries = cases.length;
  return { cases, summary };
};

const createArchiveSession = async (payload) => {
  const geolocationSession = await ParserSession.getLastProcessedSession(
    ParserSession.GEOLOCATION_SESSION
  );
  if (geolocationSession) {
    await geolocationSession.updateSession({ isUsing: true });
    const pathContent = await getPathContent(
      ARCHIVE_CASES_PATH,
      ARCHIVE_DATA_BRANCH
    );
    await PathCommit.saveCommit({
      commitSHA: payload.commitSHA,
      path: ARCHIVE_CASES_PATH,
      branch: ARCHIVE_DATA_BRANCH,
      isProcessed: true,
    });
    const createdDate = new Date();
    const pathCommits = pathContent
      .filter((el) => el.name.indexOf(".csv") !== -1)
      .map((el) => ({
        commitSHA: "",
        path: el.path,
        branch: ARCHIVE_DATA_BRANCH,
        isProcessed: false,
        rootCommits: [payload.commitSHA],
        createdAt: createdDate,
        updatedAt: createdDate,
      }));
    const savedCommits = await PathCommit.saveData(pathCommits);
    await ParserSession.createSession({
      type: ParserSession.ARCHIVE_SESSION,
      commitSHA: payload.commitSHA,
      isProcessed: false,
    });
    await sendMessagesToSQS(
      archiveDataParserQueueUrl,
      savedCommits.map((el) => ({
        _id: el._id,
        geolocationCommitSHA: geolocationSession.commitSHA,
      }))
    );
  }
};

const parseAndSaveArchiveData = async (payload) => {
  const pathCommit = await PathCommit.getById(payload._id);
  const commitSHA = await getLastCommitHash(pathCommit.path, pathCommit.branch);
  const { geolocationCommitSHA } = payload;
  const commit = await PathCommit.findDataByCommit({
    path: pathCommit.path,
    branch: pathCommit.branch,
    commitSHA,
  });
  if (commit) {
    await commit.appendRootCommit(pathCommit.rootCommits[0]);
    await updateArchiveUkraineRootCommit(pathCommit);
    await pathCommit.removeCommit();
  } else {
    const archiveData = await processArchiveData(
      pathCommit.path,
      commitSHA,
      geolocationCommitSHA
    );
    const archiveUkraine = await processArchiveUkraineData(pathCommit);
    await ArchiveAll.saveData(archiveData.cases);
    await ArchiveCountries.saveData(archiveData.countries);
    await ArchiveSummary.saveData(archiveData.summary);
    await saveArchiveDataByUkraine(archiveUkraine, commitSHA);
    await pathCommit.updateCommit({ isProcessed: true, commitSHA });
  }
};

const processArchiveData = async (path, commitSHA, geolocationCommitSHA) => {
  const data = await getContentByPath(path, ARCHIVE_DATA_BRANCH);
  const items = parseCSV(data);
  const casesDate = getDateByPath(path);
  let cases = [];
  let countryCases = {};
  let countries = [];
  let summary = {
    confirmed: 0,
    deaths: 0,
    recovered: 0,
    active: 0,
    commitSHA,
    casesDate,
  };
  for (let i = 0; i < items.length; i++) {
    const element = items[i];
    const payload = {
      city: element.city,
      state: element.state,
      country: element.country,
      lastUpdate: new Date(`${element.lastUpdate}+00`),
      lat: element.lat,
      long: element.long,
      confirmed: Number(element.confirmed),
      deaths: Number(element.deaths),
      recovered: Number(element.recovered),
      commitSHA,
      casesDate,
    };
    payload.active = payload.confirmed - payload.deaths - payload.recovered;
    cases.push(payload);
    summary.confirmed += payload.confirmed;
    summary.deaths += payload.deaths;
    summary.recovered += payload.recovered;
    summary.active += payload.active;
    if (!payload.lat || !payload.long) {
      const geo = await Geolocation.findOneByCommit(geolocationCommitSHA, {
        city: payload.city,
        state: payload.state,
        country: payload.country,
      });
      if (geo) {
        payload.lat = geo.lat;
        payload.long = geo.long;
      }
    }
    if (payload.country) {
      if (!countryCases[payload.country]) {
        const coord = { lat: "", long: "" };
        if (!payload.state && !payload.city) {
          coord.lat = payload.lat;
          coord.long = payload.long;
        } else {
          const geo = await Geolocation.findOneByCommit(geolocationCommitSHA, {
            country: payload.country,
          });
          if (geo) {
            coord.lat = geo.lat;
            coord.long = geo.long;
          }
        }
        countryCases[payload.country] = {
          country: payload.country,
          lastUpdate: payload.lastUpdate,
          confirmed: payload.confirmed,
          deaths: payload.deaths,
          recovered: payload.recovered,
          active: payload.active,
          lat: coord.lat,
          long: coord.long,
          commitSHA,
          casesDate,
        };
      } else {
        const countryCase = countryCases[payload.country];
        countryCase.confirmed += payload.confirmed;
        countryCase.deaths += payload.deaths;
        countryCase.recovered += payload.recovered;
        countryCase.active += payload.active;
        if (countryCase.lastUpdate.valueOf() < payload.lastUpdate.valueOf()) {
          countryCase.lastUpdate = payload.lastUpdate;
        }
      }
    }
  }
  for (let key of Object.keys(countryCases)) {
    countries.push(countryCases[key]);
  }
  summary.affectedCountries = countries.length;
  return { summary, cases, countries };
};

const removeUnusedActualData = async () => {
  const deprecatedData = (
    await ParserSession.getDeprecatedSessions({
      type: ParserSession.ACTUAL_SESSION,
    })
  ).map((el) => el.commitSHA);
  if (deprecatedData.length) {
    await ActualAll.removeByCommits(deprecatedData);
    await ActualCountries.removeByCommits(deprecatedData);
    await ActualSummary.removeByCommits(deprecatedData);
    await removeUnusedActualUkraineData(deprecatedData);
    await ParserSession.removeByCommits(
      deprecatedData,
      ParserSession.ACTUAL_SESSION
    );
  }
};

const removeUnusedGeolocationData = async () => {
  const deprecatedData = (
    await ParserSession.getDeprecatedSessions({
      type: ParserSession.GEOLOCATION_SESSION,
    })
  ).map((el) => el.commitSHA);
  if (deprecatedData.length) {
    await Geolocation.removeByCommits(deprecatedData);
    await ParserSession.removeByCommits(
      deprecatedData,
      ParserSession.GEOLOCATION_SESSION
    );
  }
};

const removeUnusedArchiveData = async () => {
  const deprecatedData = (
    await ParserSession.getDeprecatedSessions({
      type: ParserSession.ARCHIVE_SESSION,
    })
  ).map((el) => el.commitSHA);
  for (const commitSHA of deprecatedData) {
    const commits = await PathCommit.findByRootCommit(commitSHA);
    for (const commit of commits) {
      commit.removeRootCommit(commitSHA);
      if (commit.rootCommits.length) {
        await commit.updateCommit();
      } else {
        await Promise.all([
          ArchiveAll.removeByCommits([commit.commitSHA], {
            casesDate: getDateByPath(commit.path),
          }),
          ArchiveCountries.removeByCommits([commit.commitSHA], {
            casesDate: getDateByPath(commit.path),
          }),
          ArchiveSummary.removeByCommits([commit.commitSHA], {
            casesDate: getDateByPath(commit.path),
          }),
          commit.removeCommit(),
        ]);
      }
    }
  }
  await ParserSession.removeByCommits(
    deprecatedData,
    ParserSession.ARCHIVE_SESSION
  );
};

const checkAndCreateDeltaSession = async () => {
  const sessions = await ParserSession.getUnprocessedSessions(
    ParserSession.ARCHIVE_SESSION
  );
  for (const session of sessions) {
    if (
      (
        await PathCommit.findByRootCommit(session.commitSHA, {
          isProcessed: false,
        })
      ).length
    ) {
      continue;
    }
    const changedCommits = await PathCommit.findByRootCommit(
      session.commitSHA,
      {
        deltasCalculated: false,
      }
    );
    const changedCommitsIds = changedCommits.map((el) => el._id);
    const messages = changedCommits.map((el) => ({
      _id: el._id,
      commitSHA: session.commitSHA,
      changedCommits: changedCommitsIds,
    }));
    await session.updateSession({ isProcessing: true });
    await ParserSession.markAsUnused(ParserSession.GEOLOCATION_SESSION);
    await sendMessagesToSQS(archiveDeltasCalculatorQueueUrl, messages);
  }
};

const calculatePathDeltas = async (payload) => {
  const { commitSHA, changedCommits } = payload;
  const pathCommit = await PathCommit.getById(payload._id);

  const calculateDeltas = async (
    model,
    cursor,
    rootCommit,
    pathCommit,
    changedCommits = []
  ) => {
    const casesDate = getDateByPath(pathCommit.path);
    const prevDate = moment(casesDate, DATE_FORMAT)
      .subtract(1, "days")
      .format(DATE_FORMAT);
    const nextDate = moment(casesDate, DATE_FORMAT)
      .add(1, "days")
      .format(DATE_FORMAT);
    const prevCommit =
      (
        await PathCommit.findByRootCommit(rootCommit, {
          path: `${pathCommit.path.slice(0, -14)}${prevDate}.csv`,
        })
      )[0] || {};
    const nextCommit =
      (
        await PathCommit.findByRootCommit(rootCommit, {
          path: `${pathCommit.path.slice(0, -14)}${nextDate}.csv`,
        })
      )[0] || {};
    await cursor.eachAsync(
      async (el) => {
        const initialDelta = {
          confirmed: 0,
          deaths: 0,
          recovered: 0,
          active: 0,
          ...(
            (await model
              .findOneByCommit(prevCommit.commitSHA, {
                city: el.city,
                state: el.state,
                country: el.country,
                casesDate: prevDate,
              })
              .select("confirmed deaths recovered active -_id")) || {
              toJSON: () => {},
            }
          ).toJSON(),
        };
        await el.updateData({
          confirmed_delta: el.confirmed - initialDelta.confirmed,
          deaths_delta: el.deaths - initialDelta.deaths,
          recovered_delta: el.recovered - initialDelta.recovered,
          active_delta: el.active - initialDelta.active,
        });
        if (
          changedCommits.length &&
          nextCommit.commitSHA &&
          !changedCommits.find((el) => el === nextCommit._id.toString())
        ) {
          const data = model
            .findOneByCommit(nextCommit.commitSHA, {
              city: el.city,
              state: el.state,
              country: el.country,
              casesDate: nextDate,
            })
            .cursor();
          await calculateDeltas(model, data, rootCommit, nextCommit);
        }
      },
      { parallel: CONCURRENCY }
    );
    await cursor.close();
  };

  const casesDate = getDateByPath(pathCommit.path);
  const jobs = [
    async () =>
      await calculateDeltas(
        ArchiveAll,
        ArchiveAll.findDataByCommit(pathCommit.commitSHA, {
          casesDate,
        }).cursor(),
        commitSHA,
        pathCommit,
        changedCommits
      ),
    async () =>
      await calculateDeltas(
        ArchiveCountries,
        ArchiveCountries.findDataByCommit(pathCommit.commitSHA, {
          casesDate,
        }).cursor(),
        commitSHA,
        pathCommit,
        changedCommits
      ),
    async () =>
      await calculateDeltas(
        ArchiveSummary,
        ArchiveSummary.findDataByCommit(pathCommit.commitSHA, {
          casesDate,
        }).cursor(),
        commitSHA,
        pathCommit,
        changedCommits
      ),
  ];
  for (const job of jobs) {
    await job();
  }
  await pathCommit.updateCommit({ deltasCalculated: true });
  await sendMessageToSQS(archiveDeltasSessionMarkerQueueUrl, { commitSHA });
};

const checkAndMarkArchiveSession = async (payload) => {
  const { commitSHA } = payload;
  if (
    !(
      await PathCommit.findByRootCommit(commitSHA, {
        deltasCalculated: false,
      })
    ).length
  ) {
    const session = await ParserSession.getByCommitSHA(
      commitSHA,
      ParserSession.ARCHIVE_SESSION
    );
    await session.updateSession({ isProcessing: false, isProcessed: true });
    await removeUnusedArchiveData();
  }
};

const checkAndStartGeolocationSession = async () => {
  const commitSHA = await getLastCommitHash(
    GEOLOCATION_TABLE_PATH,
    GEOLOCATION_DATA_BRANCH
  );
  if (
    !(await PathCommit.findDataByCommit({
      path: GEOLOCATION_TABLE_PATH,
      branch: GEOLOCATION_DATA_BRANCH,
      commitSHA,
    }))
  ) {
    await sendMessageToSQS(geolocationDataParserQueueUrl, { commitSHA });
  } else {
    await removeUnusedGeolocationData();
  }
};

const parseAndSaveGeolocationData = async (payload) => {
  const geolocation = await processGeolocationData(payload.commitSHA);
  await Geolocation.saveData(geolocation);
  await PathCommit.saveCommit({
    commitSHA: payload.commitSHA,
    path: GEOLOCATION_TABLE_PATH,
    branch: GEOLOCATION_DATA_BRANCH,
    isProcessed: true,
  });
  await ParserSession.createSession({
    type: ParserSession.GEOLOCATION_SESSION,
    commitSHA: payload.commitSHA,
    isProcessed: true,
  });
  await removeUnusedGeolocationData();
};

const processGeolocationData = async (commitSHA) => {
  const data = await getContentByPath(
    GEOLOCATION_TABLE_PATH,
    GEOLOCATION_DATA_BRANCH
  );
  const items = parseCSV(data);
  let geolocation = [];
  for (let i = 0; i < items.length; i++) {
    const element = items[i];
    const payload = {
      city: element.city,
      state: element.state,
      country: element.country,
      lat: element.lat,
      long: element.long,
      population:
        element.population && !isNaN(element.population)
          ? Number(element.population)
          : null,
      commitSHA,
    };
    geolocation.push(payload);
  }
  return geolocation;
};

module.exports = {
  checkAndStartActualSession,
  parseAndSaveActualData,
  checkAndStartArchiveSession,
  createArchiveSession,
  parseAndSaveArchiveData,
  removeUnusedArchiveData,
  checkAndCreateDeltaSession,
  calculatePathDeltas,
  checkAndMarkArchiveSession,
  checkAndStartGeolocationSession,
  parseAndSaveGeolocationData,
};
