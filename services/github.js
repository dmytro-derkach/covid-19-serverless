const { GITHUB_REPOSITORY } = require("@constants");
const axios = require("axios");

const apiRepoLink = `https://api.github.com/repos/${GITHUB_REPOSITORY}`;
const apiCommitHashPath = "/commits/{branch}?path={path}&per_page=1";

const getCommitHash = async (path, branch = "master") => {
  const link = `${apiRepoLink}${apiCommitHashPath
    .replace("{branch}", branch)
    .replace("{path}", encodeURIComponent(path))}`;
  return await axios.get(link);
};

module.exports = {
  getCommitHash,
};
