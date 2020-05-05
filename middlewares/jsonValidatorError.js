const jsonValidatorErrorMiddleware = () => ({
  onError: async (handler) => {
    const { error } = handler;
    if (typeof error.statusCode === "number") {
      handler.response = {
        body: JSON.stringify({
          message: error.message,
          statusCode: error.statusCode,
        }),
        statusCode: error.statusCode,
      };
    } else {
      handler.response = {
        body: JSON.stringify({
          message: "Internal server error",
          statusCode: 500,
        }),
        statusCode: 500,
      };
    }
    console.error(error);
    return;
  },
});

module.exports = jsonValidatorErrorMiddleware;
