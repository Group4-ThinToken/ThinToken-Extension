const path = require("path");

module.exports = {
  entry: "./src/index.tsx",
  mode: "production",

  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  output: {
    filename: "content.js",
    path: path.resolve(__dirname, "..", "extension"),
  },
};
