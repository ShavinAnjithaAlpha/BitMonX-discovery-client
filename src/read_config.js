const path = require("path");
const fs = require("fs");

function readConfig() {
  const cwd = process.cwd();

  const configPath = path.join(cwd, "config.json");
  // check if the config file exists
  if (!fs.existsSync(configPath)) {
    process.exit(1);
  }

  // read the config file
  const config = fs.readFileSync(configPath);
  // parse the config file as JSON
  return JSON.parse(config);
}

module.exports = readConfig();
