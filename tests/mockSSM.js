jest.mock("@middlewares/loadSSM", () => () => ({
  before: async () => null,
}));
