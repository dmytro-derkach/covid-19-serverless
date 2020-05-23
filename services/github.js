const { GITHUB_REPOSITORY } = require("@constants");
const { getGithubAuth } = require("@vars");
const axios = require("axios");
const get = require("lodash.get");

const apiRepoLink = "https://api.github.com/repos/";
const apiCommitHashPath = "/commits?path={path}&sha={branch}&per_page=1";
const apiContentPath = "/contents/{path}?ref={branch}";

const getLastCommitHash = async (
  path,
  branch = "master",
  repository = GITHUB_REPOSITORY
) => {
  const options = {
    auth: getGithubAuth(),
  };
  const apiLink = `${apiRepoLink}${repository}`;
  const link = `${apiLink}${apiCommitHashPath
    .replace("{branch}", encodeURIComponent(branch))
    .replace("{path}", encodeURIComponent(path))}`;
  const response = await axios.get(link, options);
  return get(response, "data[0].sha");
};

const getContentByPath = async (
  path,
  branch = "master",
  repository = GITHUB_REPOSITORY
) => {
  const options = {
    auth: getGithubAuth(),
  };
  const apiLink = `${apiRepoLink}${repository}`;
  const link = `${apiLink}${apiContentPath
    .replace("{branch}", encodeURIComponent(branch))
    .replace("{path}", path)}`;
  const response = await axios.get(link, options);
  const buff = new Buffer.from(response.data.content, "base64");
  return buff.toString("utf-8");
};

const getPathContent = async (
  path,
  branch = "master",
  repository = GITHUB_REPOSITORY
) => {
  const options = {
    auth: getGithubAuth(),
  };
  const apiLink = `${apiRepoLink}${repository}`;
  const link = `${apiLink}${apiContentPath
    .replace("{branch}", encodeURIComponent(branch))
    .replace("{path}", path)}`;
  return (await axios.get(link, options)).data;
};

module.exports = {
  getLastCommitHash,
  getContentByPath,
  getPathContent,
};
