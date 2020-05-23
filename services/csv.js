const CSV = require("csv-string");

const parseCSV = (csv) => {
  const items = CSV.parse(csv);
  const headers = [
    "Admin2",
    "ProvinceState",
    "CountryRegion",
    "LastUpdate",
    "Lat",
    "Long",
    "Confirmed",
    "Deaths",
    "Recovered",
    "Population",
    "ConfirmedDelta",
    "DeathsDelta",
    "RecoveredDelta",
    "ActiveDelta",
  ];
  const headerIndexes = [];
  const results = [];
  for (const header of headers) {
    let foundIndex = -1;
    for (let i = 0; i < items[0].length; i++) {
      if (
        items[0][i]
          .toLowerCase()
          .replace(/[\s_/]/g, "")
          .indexOf(header.toLowerCase()) !== -1
      ) {
        foundIndex = i;
        break;
      }
    }
    headerIndexes.push(foundIndex);
  }
  for (let i = 1; i < items.length; i++) {
    if (items[i]) {
      const result = {};
      result.city = headerIndexes[0] > -1 ? items[i][headerIndexes[0]] : "";
      result.state = headerIndexes[1] > -1 ? items[i][headerIndexes[1]] : "";
      result.country =
        headerIndexes[2] > -1
          ? items[i][headerIndexes[2]].replace("Mainland China", "China")
          : "";
      result.lastUpdate =
        headerIndexes[3] > -1
          ? items[i][headerIndexes[3]].replace("T", " ")
          : "";
      result.lat = headerIndexes[4] > -1 ? items[i][headerIndexes[4]] : "";
      result.long = headerIndexes[5] > -1 ? items[i][headerIndexes[5]] : "";
      result.confirmed =
        headerIndexes[6] > -1 ? items[i][headerIndexes[6]] : "";
      result.deaths = headerIndexes[7] > -1 ? items[i][headerIndexes[7]] : "";
      result.recovered =
        headerIndexes[8] > -1 ? items[i][headerIndexes[8]] : "";
      result.population =
        headerIndexes[9] > -1 ? items[i][headerIndexes[9]] : "";
      result.confirmedDelta =
        headerIndexes[10] > -1 ? items[i][headerIndexes[10]] : "";
      result.deathsDelta =
        headerIndexes[11] > -1 ? items[i][headerIndexes[11]] : "";
      result.recoveredDelta =
        headerIndexes[12] > -1 ? items[i][headerIndexes[12]] : "";
      result.activeDelta =
        headerIndexes[13] > -1 ? items[i][headerIndexes[13]] : "";
      results.push(result);
    }
  }
  return results;
};

module.exports = {
  parseCSV,
};
