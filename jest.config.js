// Testăm logica pură (utils) în Node, cu transformare Babel a modulelor ES.
module.exports = {
  testEnvironment: "node",
  transform: { "^.+\\.[jt]sx?$": "babel-jest" },
  testMatch: ["**/src/**/__tests__/**/*.test.js", "**/scripts/__tests__/**/*.test.js"],
};
