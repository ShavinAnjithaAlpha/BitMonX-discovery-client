/**
 * @file index.js
 * @description This file is the entry point for the BitMonX service.
 * It initializes the service by registering with the discovery service and
 * starting the heart beat process.
 * @requires sendHeartBeat
 * @requires registerInDiscovery
 * @requires fetch_health
 * @requires read_config
 * @exports initBitMonX
 * @author Shavin Anjitha
 */

const sendHeartBeat = require('./discovery/heartbeat');
const registerInDiscovery = require('./discovery/register');
const { fetch_health } = require('./health/controller');
require('./events/exit.event');

/**
 * Initialize the BitMonX service
 * @param {Object} app - The express app object
 * @description This function initializes the BitMonX client service by registering with the discovery service
 * and starting the heart beat process. It also creates a route for the health check url on the app.
 * @returns {void}
 * @exports initBitMonX
 * @example
 * const express = require('express');
 * const app = express();
 * const initBitMonX = require('./src/index');
 * initBitMonX(app);
 * app.listen(3000);
 */
function initBitMonX(app) {
  // create a route for the health check url on the app
  app.get('/bitmonx/health', (req, res) => {
    fetch_health(req, res);
  });

  // register the servivce with the discovery service
  // get the config from the config json file
  const config = require('./read_config');
  // get the discovery service url from the config
  const discovery_host = config.discovery.server.host;
  const discovery_port = config.discovery.server.port;

  const max_attempts = config.discovery.meta.max_attempts || 5;
  const retry_interval = config.discovery.meta.retry_interval || 1000;

  registerInDiscovery(
    config,
    discovery_host,
    discovery_port,
    max_attempts,
    retry_interval,
    () => {
      // initiate the heart beat signalling process
      sendHeartBeat();
    },
  );
}

module.exports = initBitMonX;
