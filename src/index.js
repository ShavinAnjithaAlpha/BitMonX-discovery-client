const { EventEmitter } = require('events');
const { waterfall } = require('async');
const sendHeartBeat = require('./discovery/heartbeat');
const registerInDiscovery = require('./discovery/register');
const { fetch_health } = require('./health/controller');
const Logger = require('./logger');
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

class BitMonX extends EventEmitter {
  constructor(config = {}) {
    super();

    // create a logger
    this.logger = config.logger || new Logger();

    this.logger.debug('[bitmonx] start the bitmonx client');

    // read the config from the config json file
    this.config = require('./read_config');

    // initialize the local service registry
    this.registry = {};
  }

  // method to start the service // register with the discovery service and start the heart beat mechanism
  init() {}

  // method to stop the service // deregister with the discovery service and stop the heart beat mechanism
  stop() {}

  // register with the discovery server
  registerInDiscovery(callback) {
    const registerTimeOut = setTimeout(() => {
      this.logger.warn(
        "Seems like it's take unusual time to register with the bitmonx discovery server." +
          'This means there is connection issue with the specified BitMonX discovery server. ' +
          'Start the application with DEBUG on for more logging.',
      );
    }, 10000);
    // register the servivce with the discovery service
    this.request(
      '/bitmonx/register',
      {
        method: 'POST',
        body: JSON.stringify(this.config.service),
        headers: {
          'Content-Type': 'application/json',
        },
      },
      (err, response, statusCode) => {
        // clear the timeout interval to prevent logging warning
        clearInterval(registerTimeOut);
        if (!err && statusCode >= 200 && statusCode < 300) {
          this.logger.info(
            `[bitmonx] registered with the discovery server successfully`,
          );
          this.logger.info(
            `[bitmonx] SERVICE ID = ${response.serviceId} & INSTANCE ID = ${response.instanceId}`,
          );

          this.serviceId = this.serviceId;
          this.instanceId = this.instanceId;
          // emit the registered event with service and instance id of the app
          this.emit('registered', response.serviceId, response.instanceId);
        } else if (err) {
          // error happens while registering in the discovery server
          this.logger.error(
            `[bitmonx] Error registering service in discovery server: ${err}`,
          );
          return callback(err);
        }

        return callback(
          new Error(
            `Error registering with discovery server: ${statusCode}, body: ${response}`,
          ),
        );
      },
    );
  }

  reregisterInDiscovery() {}

  // start heartbeat process
  startHeartBeatProcess() {}

  startFetchRegistryProcess() {}

  fetchRegistry() {}

  /*
   * Method to make a request to the discovery server
   * @param {string} endpoint - The endpoint to make the request to
   * @param {Object} options - The request options
   * @param {Function} callback - The callback function to call after the request is made
   * @param {boolean} json - A flag to indicate if the response should be parsed as json
   * @param {number} retryAttemp - The number of times to retry the request
   * @returns {void}
   */
  request(endpoint, options, callback, json = true, retryAttemp = 0) {
    // make a request to the discovery server
    waterfall(
      [
        // apply the middleware to the request options
        (callback) => {
          this.requestMiddleware(options, (newOptions) => {
            if (typeof newOptions !== 'object') {
              return callback(
                new Error('Invalid return value from the requestMiddleware'),
              );
            }
            callback(null, newOptions);
          });
        },

        // perform the request to the discovery server
        async (options, callback) => {
          try {
            // extract the info from the options
            const host = this.config.discovery.server.host;
            const port = this.config.discovery.server.port;
            const protocol = this.config.discovery.server.protocol || 'http';
            // generate the base url
            const baseUrl = `${protocol}://${host}:${port}`;
            // generate the url
            const url = `${baseUrl}${endpoint}`;

            // now perform the request
            const response = await fetch(url, options);
            const statusCode = response.status;
            if (json) {
              const json = await response.json();
              callback(null, json, statusCode);
            } else {
              callback(null, response.text(), statusCode);
            }
          } catch (err) {
            callback(err, null);
          }
        },
      ],

      // handle the response or error issued from the requets
      (err, response, statusCode) => {
        if (err)
          this.logger.error(
            '[bitmonx] Error making request to discovery server',
            err,
          );

        const invalidResponse = statusCode >= 500;
        // check if the response is invalid or the request failed and retry the request if the retry attenpts are not exhausted
        if (
          (err || invalidResponse) &&
          retryAttemp < this.config.discovery.meta.max_attempts
        ) {
          // make the request again
          // with the retry delay specify in the configuration
          const nextRetryDelay =
            this.config.discovery.meta.retry_interval * (retryAttemp + 1);
          this.logger.warn(
            `[bitmonx] Retrying request to discovery server in ${nextRetryDelay}ms`,
          );
          setTimeout(() => {
            this.request(endpoint, options, callback, json, retryAttemp + 1);
          }, nextRetryDelay);
          return;
        }

        // else call the callback function
        callback(err, response, statusCode);
      },
    );
  }
}

module.exports = initBitMonX;
