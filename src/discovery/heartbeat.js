/**
 * @fileoverview This file contains the implementation of the heartbeat signal to the discovery server
 * @author Shavin Anjitha
 */

const fetch = require('node-fetch');
const { getServiceId, getInstanceId } = require('../instance.details');
const registerInDiscovery = require('./register');

const DEFAULT_HEARTBEAT_INTERVAL = 10000;

/**
 * Send a heartbeat signal to the discovery server
 * @param {string} url - The URL of the discovery server
 * @param {number} retries - The number of retries to attempt
 * @returns {Promise<Object>} The response from the discovery server
 * @throws {Error} If the HTTP request fails
 */
async function heartBeatWithRetry(url, retries = 3) {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 1000,
    });

    if (!response.ok) throw new Error(`HTTP error: status: ${response.status}`);
    return await response.json();
  } catch (err) {
    if (retries > 0) {
      return heartBeatWithRetry(url, retries - 1);
    } else {
      throw err;
    }
  }
}

/**
 * Send a heartbeat signal to the discovery server
 * @description This function sends a heartbeat signal to the discovery server
 * @returns {void}
 * @throws {Error} If the HTTP request fails
 */
function sendHeartBeat() {
  // get the heratbeat interval from the configurations
  const config = require('../read_config');
  const interval =
    config.service?.heartbeat?.interval ?? DEFAULT_HEARTBEAT_INTERVAL;

  // disovery server
  const discovery_host = config.discovery.server.host;
  const discovery_port = config.discovery.server.port;
  const discovery_url = `http://${discovery_host}:${discovery_port}/bitmonx/heartbeat?serviceId=${getServiceId()}&instanceId=${getInstanceId()}`;

  // create a periodic tasks that can send the heartbeat signal to the discovery server
  const heartbeatTask = setInterval(() => {
    // send the heartbeat signal through the REST api of the discovery server as a POST request
    heartBeatWithRetry(discovery_url)
      .then((data) => {})
      .catch((err) => {
        // try to reregistered in the discovery server if available
        registerInDiscovery(
          config,
          discovery_host,
          discovery_port,
          config.discovery.meta.max_attempts,
          config.discovery.meta.retry_interval,
          () => {
            // initiate the heart beat signalling process
            sendHeartBeat();
          },
        );
        // clear the heartbeat task
        clearInterval(heartbeatTask);
        return;
      });
  }, interval);
}

module.exports = sendHeartBeat;
