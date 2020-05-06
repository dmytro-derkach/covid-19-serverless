const normalizedResponse = () => {
  return {
    after: (handler, next) => {
      const { body, headers, ...other } = handler.response;
      handler.response = {
        body: JSON.stringify(body),
        headers: { ...headers, "Content-Type": "application/json" },
        ...other,
      };
      next();
    },

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
            message: "Internal server error!",
            statusCode: 500,
          }),
          statusCode: 500,
        };
      }
      console.error(error);
    },
  };
};

module.exports = normalizedResponse;
