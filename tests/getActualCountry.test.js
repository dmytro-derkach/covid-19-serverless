process.env.ENV = "test";
process.env.DATABASE_NAME = "test2";
require("./mockSSM");
const {
  connectDatabase,
  disconnectDatabase,
  dropDatabase,
} = require("./mockDb");
const omit = require("lodash.omit");
const mongoose = require("mongoose");
const ParserSession = require("@models/parserSession");
const ActualAll = require("@models/actualAll");
const { handler } = require("../handlers/getActualCountry");

let sessionId, lastSessionId, archiveSessionId;
const prevAlls = [
  {
    city: "test",
    state: "test",
    country: "test1",
    lastUpdate: new Date().toJSON(),
    lat: "test",
    long: "test",
    confirmed: 100,
    deaths: 200,
    recovered: 300,
    active: 400,
    commitSHA: "test",
  },
  {
    city: "test1",
    state: "test1",
    country: "test1",
    lastUpdate: new Date().toJSON(),
    lat: "test",
    long: "test",
    confirmed: 10,
    deaths: 20,
    recovered: 30,
    active: 40,
    commitSHA: "test",
  },
];
const lastAlls = [
  {
    city: "test1",
    state: "test1",
    country: "test",
    lastUpdate: new Date().toJSON(),
    lat: "test",
    long: "test",
    confirmed: 10,
    deaths: 200,
    recovered: 30,
    active: 400,
    commitSHA: "test1",
  },
  {
    city: "test",
    state: "test",
    country: "test",
    lastUpdate: new Date().toJSON(),
    lat: "test",
    long: "test",
    confirmed: 100,
    deaths: 20,
    recovered: 300,
    active: 40,
    commitSHA: "test1",
  },
];

beforeAll(async (done) => {
  await dropDatabase();
  done();
});

afterAll(async (done) => {
  await dropDatabase();
  done();
});

const prepareDb = async () => {
  await connectDatabase();
  sessionId = (
    await ParserSession.create({
      type: ParserSession.ACTUAL_SESSION,
      commitSHA: "test",
      isProcessed: true,
      isProcessing: false,
      isUsing: false,
    })
  )._id;
  lastSessionId = (
    await ParserSession.create({
      type: ParserSession.ACTUAL_SESSION,
      commitSHA: "test1",
      isProcessed: true,
      isProcessing: false,
      isUsing: false,
    })
  )._id;
  archiveSessionId = (
    await ParserSession.create({
      type: ParserSession.ARCHIVE_SESSION,
      commitSHA: "test2",
      isProcessed: true,
      isProcessing: false,
      isUsing: false,
    })
  )._id;
  await ActualAll.insertMany(prevAlls);
  await ActualAll.insertMany(lastAlls);
  await disconnectDatabase();
};

test("Test clean db response", async (done) => {
  const event = {
    httpMethod: "GET",
    pathParameters: { countryName: "test" },
  };

  handler(event, {}, (err, response) => {
    if (err) return done(err);
    const body = JSON.parse(response.body);
    expect(body).toHaveProperty("statusCode", 404);
    done();
  });
});

test("Test headers", async (done) => {
  const event = {
    httpMethod: "GET",
    pathParameters: { countryName: "test" },
  };

  handler(event, {}, async (err, response) => {
    if (err) return done(err);
    expect(response.headers).toHaveProperty(
      "Content-Type",
      "application/json; charset=utf-8"
    );
    expect(response.headers).toHaveProperty("Access-Control-Allow-Origin");
    done();
  });
});

describe("db tests", () => {
  beforeAll(async (done) => {
    await prepareDb();
    done();
  });

  test("Test headers", async (done) => {
    const event = {
      httpMethod: "GET",
      pathParameters: { countryName: "test" },
    };

    handler(event, {}, (err, response) => {
      if (err) return done(err);
      expect(response.headers).toHaveProperty(
        "Content-Type",
        "application/json; charset=utf-8"
      );
      expect(response.headers).toHaveProperty("Access-Control-Allow-Origin");
      done();
    });
  });

  test("Test normal db response", async (done) => {
    const event = {
      httpMethod: "GET",
      pathParameters: { countryName: "test" },
    };

    handler(event, {}, (err, response) => {
      if (err) return done(err);
      const body = JSON.parse(response.body);
      expect(body).toEqual([
        omit(lastAlls[1], "commitSHA"),
        omit(lastAlls[0], "commitSHA"),
      ]);
      const event = {
        httpMethod: "GET",
        headers: { "session-id": lastSessionId },
        pathParameters: { countryName: "test" },
      };
      handler(event, {}, (err, response) => {
        if (err) return done(err);
        const body = JSON.parse(response.body);
        expect(body).toEqual([
          omit(lastAlls[1], "commitSHA"),
          omit(lastAlls[0], "commitSHA"),
        ]);
        done();
      });
    });
  });

  test("Test empty db response", async (done) => {
    const event = {
      httpMethod: "GET",
      pathParameters: { countryName: "test1" },
    };

    handler(event, {}, (err, response) => {
      if (err) return done(err);
      const body = JSON.parse(response.body);
      expect(body).toEqual([]);
      const event = {
        httpMethod: "GET",
        headers: { "session-id": sessionId },
        pathParameters: { countryName: "test" },
      };
      handler(event, {}, (err, response) => {
        if (err) return done(err);
        const body = JSON.parse(response.body);
        expect(body).toEqual([]);
        done();
      });
    });
  });

  test("Test sort response", async (done) => {
    const event = {
      httpMethod: "GET",
      pathParameters: { countryName: "test", sortBy: "deaths" },
    };

    handler(event, {}, (err, response) => {
      if (err) return done(err);
      const body = JSON.parse(response.body);
      expect(body).toEqual([
        omit(lastAlls[0], "commitSHA"),
        omit(lastAlls[1], "commitSHA"),
      ]);

      const event = {
        httpMethod: "GET",
        headers: { "session-id": lastSessionId },
        pathParameters: { countryName: "test", sortBy: "recovered" },
      };

      handler(event, {}, (err, response) => {
        if (err) return done(err);
        const body = JSON.parse(response.body);
        expect(body).toEqual([
          omit(lastAlls[1], "commitSHA"),
          omit(lastAlls[0], "commitSHA"),
        ]);

        const event = {
          httpMethod: "GET",
          headers: { "session-id": lastSessionId },
          pathParameters: { countryName: "test", sortBy: "alphabetic" },
        };

        handler(event, {}, (err, response) => {
          if (err) return done(err);
          const body = JSON.parse(response.body);
          expect(body).toEqual([
            omit(lastAlls[1], "commitSHA"),
            omit(lastAlls[0], "commitSHA"),
          ]);

          const event = {
            httpMethod: "GET",
            headers: { "session-id": lastSessionId },
            pathParameters: { countryName: "test", sortBy: "wrong" },
          };

          handler(event, {}, (err, response) => {
            if (err) return done(err);
            const body = JSON.parse(response.body);
            expect(body).toHaveProperty("statusCode", 400);
            done();
          });
        });
      });
    });
  });

  test("Test prev session response", async (done) => {
    const event = {
      httpMethod: "GET",
      headers: { "session-id": sessionId },
      pathParameters: { countryName: "test1" },
    };

    handler(event, {}, (err, response) => {
      if (err) return done(err);
      const body = JSON.parse(response.body);
      expect(body).toEqual([
        omit(prevAlls[0], "commitSHA"),
        omit(prevAlls[1], "commitSHA"),
      ]);
      done();
    });
  });

  test("Test bad session response", async (done) => {
    const event = {
      httpMethod: "GET",
      headers: { "Session-id": "test" },
      pathParameters: { countryName: "test" },
    };

    handler(event, {}, (err, response) => {
      if (err) return done(err);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty("statusCode", 400);
      done();
    });
  });

  test("Test not exists session response", async (done) => {
    const event = {
      httpMethod: "GET",
      headers: { "Session-Id": new mongoose.Types.ObjectId().toString() },
      pathParameters: { countryName: "test" },
    };

    handler(event, {}, (err, response) => {
      if (err) return done(err);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty("statusCode", 404);
      done();
    });
  });

  test("Test archive session response", async (done) => {
    const event = {
      httpMethod: "GET",
      headers: { "Session-Id": archiveSessionId },
      pathParameters: { countryName: "test" },
    };

    handler(event, {}, (err, response) => {
      if (err) return done(err);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty("statusCode", 404);
      done();
    });
  });
});
