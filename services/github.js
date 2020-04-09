const { GITHUB_REPOSITORY } = require("@constants");
const { getGithubAuth } = require("@vars");
const axios = require("axios");

const apiRepoLink = `https://api.github.com/repos/${GITHUB_REPOSITORY}`;
const apiCommitHashPath = "/commits/{branch}?path={path}&per_page=1";
const apiContentPath = "/contents/{path}?ref={branch}";

const getLastCommitHash = async (path, branch = "master") => {
  const options = {
    auth: getGithubAuth(),
  };
  const link = `${apiRepoLink}${apiCommitHashPath
    .replace("{branch}", branch)
    .replace("{path}", encodeURIComponent(path))}`;
  return await axios.get(link, options);
};

const getContentByPath = async (path, branch = "master") => {
  const options = {
    auth: getGithubAuth(),
  };
  const link = `${apiRepoLink}${apiContentPath
    .replace("{branch}", encodeURIComponent(branch))
    .replace("{path}", path)}`;
  const response = await axios.get(link, options);
  const buff = new Buffer.from(response.data.content, "base64");
  return buff.toString("utf-8");
};

module.exports = {
  getLastCommitHash,
  getContentByPath,
};
