/**
 * Read the config file from the current working directory
 * and return the parsed JSON object
 * @author Shavin Anjitha
 */

const path = require('path');
const fs = require('fs');

const CONFIG_FILE_NAME = 'bitmonx.config.json';

/**
 * Read the config file from the current working directory
 *
 * BitMonX discovery client configure itself and find the discovery server using these configurations in the config file.
 *
 * exit the process if the config file is not found
 * @returns {Object} The parsed JSON object from the config file
 */
function readConfig(logger = null) {
  const cwd = process.cwd();

  const configPath = path.join(cwd, CONFIG_FILE_NAME);
  // check if the config file exists
  if (!fs.existsSync(configPath)) {
    if (logger) {
      logger.error(`[bitmonx] Config file not found at ${configPath}`);
    }
    throw new Error(`Config file not found at ${configPath}`);
  }

  // read the config file
  const config = fs.readFileSync(configPath);
  // parse the config file as JSON
  return JSON.parse(config);
}

module.exports = (logger = null) => readConfig(logger);
