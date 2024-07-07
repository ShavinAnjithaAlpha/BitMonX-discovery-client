const { EventEmitter } = require('events');
const { waterfall, series } = require('async');
var _ = require('lodash');
const sendHeartBeat = require('./discovery/heartbeat');
const registerInDiscovery = require('./discovery/register');
const { fetch_health } = require('./health/controller');
const Logger = require('./logger');

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

const default_callback = () => {};

class BitMonX extends EventEmitter {
  constructor(config = {}) {
    super();
    // create a logger
    this.logger = config.logger || new Logger();
    this.logger.debug('[bitmonx] start the bitmonx client');

    // read the config from the config json file
    this.config = require('./read_config');
    const defaultConfig = require('./default_config');
    // merge the config file's configuration with the default configuration
    this.config = _.merge({}, defaultConfig, this.config);
    // request middleware
    this.requestMiddleware =
      config.requestMiddleware ||
      function (options, callback) {
        callback(options);
      };

    // initialize the local service registry
    this.registry = {};
  }

  /*
   * function to get the instance ID fetched when register the app itself with the discovery server
   */
  getInstanceId() {
    if (this.instanceId) {
      return this.instanceId;
    }
    return null;
  }

  /*
   * funciton to get service ID fetched when register the app itself with the discovery server
   */
  getServiceId() {
    if (this.serviceId) {
      return this.serviceId;
    }

    return null;
  }

  // method to start the service // register with the discovery service and start the heart beat mechanism
  init(app, callback = default_callback) {
    // first register with the discovery service
    // and then start the heartbeat process
    series(
      [
        // register in the duscovery service first
        (callback) => {
          this.registerInDiscovery((err) => {
            if (err) {
              return callback(err);
            }
            // start the heartbeat process
            callback(null);
          });
        },

        // start the heartbeat process
        (callback) => {
          this.startHeartBeatProcess();
          callback(null);
        },

        // start the registry fetching process
        (callback) => {
          this.startFetchRegistryProcess();
          callback(null);
        },

        // start the health endpoint on the app
        (callback) => {
          try {
            this.generateHealthEndPoint(app);
            callback(null);
          } catch (err) {
            callback(err);
          }
        },
      ],

      // handle the error or success of the registration and heartbeat process
      (err, ...rest) => {
        if (err) {
          this.logger.error('[bitmonx] Error starting the bitmonx client', err);
          return;
        }

        this.logger.info('[bitmonx] bitmonx client started successfully');
        this.emit('started');
        // call the callback
        callback(err, ...rest);
      },
    );
  }

  // method to stop the service // deregister with the discovery service and stop the heart beat mechanism
  stop(callback = default_callback) {
    // first stop the heartbeat process with the discovery server
    clearInterval(this.heartBeatInterval);
    // deregister with the discovery server
    this.registerInDiscovery(callback);
  }

  // register with the discovery server
  registerInDiscovery(callback = default_callback) {
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

          this.serviceId = response.serviceId;
          this.instanceId = response.instanceId;
          // emit the registered event with service and instance id of the app
          this.emit('registered', response.serviceId, response.instanceId);
          return callback(null);
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

  deregisterInDiscovery(callback = default_callback) {
    // make the deregister request to the discovery server
    const url = `/bitmonx/deregister?serviceId=${this.serviceId}&instanceId=${this.instanceId}`;
    this.request(url, { method: 'DELETE' }, (err, response, statusCode) => {
      if (err || statusCode >= 500) {
        this.logger.error(
          `[bitmonx] Error deregistering service in discovery server: ${err}`,
        );
        return callback(err);
      }

      this.logger.info(
        `[bitmonx] Deregistered service in discovery server: ${statusCode}`,
      );

      // emit the deregistered event
      this.emit('deregistered');
      // call the callback function
      callback(null, response);
    });
  }

  reRegisterInDiscovery(callback = default_callback) {
    // first clear the heartbeat process
    if (this.heartBeatInterval) clearInterval(this.heartBeatInterval);
    // clear the registry fecthing interval if exists
    if (this.fetchRegistryInterval) clearInterval(this.fetchRegistryInterval);
    // then reregister in the discovery service and start heartbeat process again
    series(
      [
        // register in disocvery
        (callback) => {
          this.registerInDiscovery((err) => {
            if (err) {
              return callback(err);
            }
            return callback(null);
          });
        },

        // start the heartbeat process again
        (callback) => {
          this.startHeartBeatProcess();
          callback(null);
        },

        // start the registry fetching process
        (callback) => {
          this.startFetchRegistryProcess();
          callback(null);
        },
      ],

      // handle the error or success of the registration and heartbeat process
      (err, ...rest) => {
        if (err) {
          this.logger.error('[bitmonx] Error starting the bitmonx client', err);
          return;
        }

        this.logger.info('[bitmonx] bitmonx client started successfully');
        this.emit('started');
        // call the callback
        callback(err, ...rest);
      },
    );
  }

  // start heartbeat process
  startHeartBeatProcess() {
    const url = `/bitmonx/heartbeat?serviceId=${this.serviceId}&instanceId=${this.instanceId}`;

    this.logger.info('[bitmonx]: heartbeat process started');
    // start the heartbeat process with tht server
    this.heartBeatInterval = setInterval(() => {
      this._heartBeat(url, (err, response) => {});
    }, this.config.service.heartbeat.interval);
  }

  _heartBeat(url, callback = default_callback) {
    // make the heartbeat request to the discovery server
    this.request(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      },
      (err, response, statusCode) => {
        if (err || statusCode >= 500) {
          this.logger.error(
            `[bitmonx] Error making heartbeat with the discovery server`,
            err,
          );
          // reregister with the discovery server
          this.reRegisterInDiscovery();
          return callback(err);
        } else if (statusCode >= 400) {
          this.logger.warn(
            `[bitmonx] Invalid heratbeat response with the dicovery server, statusCode: ${statusCode}, response: `,
            response,
          );
          // reregister in discovery again
          this.reRegisterInDiscovery();
          return callback(err);
        }

        // heartbeat is successfull
        this.logger.debug('[bitmonx] heartbeat with the discovery server');
        // emit the heartbeat event
        this.emit('heartbeat');
        // call the callback function
        callback(null, response);
      },
    );
  }

  generateHealthEndPoint(app) {
    // start the health endpoint with the parsed app which is either express or core http server
    if (
      typeof app === 'function' &&
      app.hasOwnProperty('get') &&
      app.hasOwnProperty('use')
    ) {
      app.get('/bitmonx/health', (req, res) => {
        fetch_health(req, res);
      });
    } else if (
      typeof app === 'object' &&
      app.hasOwnProperty('get') &&
      app.hasOwnProperty('use')
    ) {
      app.get('/bitmonx/health', (req, res) => {
        fetch_health(req, res);
      });
    } else if (
      typeof app === 'object' &&
      app.hasOwnProperty('on') &&
      app.hasOwnProperty('emit')
    ) {
      app.on('request', (req, res) => {
        if (req.url === '/bitmonx/health') {
          fetch_health(req, res);
        }
      });
    } else {
      this.logger.error(
        '[bitmonx] Invalid app object. Cannot start health endpoint',
      );
      throw new Error('Invalid app object');
    }
  }

  startFetchRegistryProcess() {
    this.logger.info('[bitmonx]: registry fetching process started');
    this.fetchRegistryInterval = setInterval(() => {
      this.fetchRegistry((err, response) => {
        if (err) {
          // try to reregister with the discovery server
          return this.reRegisterInDiscovery();
        }
        // emit the event
        this.emit('registryFetched', response);
      });
    }, this.config.discovery.meta.fetch_registry_interval);
  }

  fetchRegistry(callback = default_callback) {
    // make a request to the discovery server to load the registry infomation to local memory
    this.request(
      '/bitmonx/registry',
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },
      (err, response, statusCode) => {
        if (err || statusCode >= 500) {
          this.logger.error(
            `error fetching registry from the discovery server `,
          );
          return callback(err);
        } else if (statusCode >= 400) {
          this.logger.warn(
            `invalid response while fethching registry with status code: ${statusCode} and response: ${response}`,
          );
          return callback(null, response);
        } else {
          // successfull registry fetching
          // update the local registry cache
          this.registry = response;
          callback(null, response);
        }
      },
    );
  }

  /*
   * Method to make a request to the discovery server
   * @param {string} endpoint - The endpoint to make the request to
   * @param {Object} options - The request options
   * @param {Function} callback - The callback function to call after the request is made
   * @param {boolean} json - A flag to indicate if the response should be parsed as json
   * @param {number} retryAttemp - The number of times to retry the request
   * @returns {void}
   */
  request(
    endpoint,
    options,
    callback = default_callback,
    json = true,
    retryAttempt = 0,
  ) {
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
        (options, callback) => {
          // extract the info from the options
          const host = this.config.discovery.server.host;
          const port = this.config.discovery.server.port;
          const protocol = this.config.discovery.server.protocol || 'http';
          // generate the base url
          const baseUrl = `${protocol}://${host}:${port}`;
          // generate the url
          const url = `${baseUrl}${endpoint}`;

          // now perform the request
          fetch(url, options)
            .then((response) => {
              const statusCode = response.status;
              if (json) {
                response.json().then((json) => {
                  callback(null, json, statusCode);
                });
              } else {
                response.text().then((text) => {
                  callback(null, text, statusCode);
                });
              }
            })
            .catch((err) => {
              callback(err);
            });
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
          retryAttempt < this.config.discovery.meta.max_attempts
        ) {
          // make the request again
          // with the retry delay specify in the configuration
          const nextRetryDelay =
            this.config.discovery.meta.retry_interval * (retryAttempt + 1);
          this.logger.warn(
            `[bitmonx] Retrying request to discovery server in ${nextRetryDelay}ms`,
          );
          setTimeout(() => {
            this.request(endpoint, options, callback, json, retryAttempt + 1);
          }, nextRetryDelay);
          return;
        }

        // else call the callback function
        callback(err, response, statusCode);
      },
    );
  }
}

module.exports = { initBitMonX, BitMonX };
