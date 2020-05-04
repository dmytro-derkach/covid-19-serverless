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
  };
};

module.exports = normalizedResponse;
