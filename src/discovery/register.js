const { setServiceId, setInstanceId } = require('../instance.details');

/**
 * Register a service with the discovery server
 * @param {Object} config - The configuration object
 * @param {string} discovery_host - The host of the discovery server
 * @param {number} discovery_port - The port of the discovery server
 * @param {number} max_attempts - The maximum number of attempts to register
 * @param {number} retry_interval - The interval between retries
 * @param {Function} callback - The callback function
 * @param {number} attempts - The number of attempts made
 * @returns {void}
 * @throws {Error} If the HTTP request fails
 * @example
 * registerInDiscovery(
 *  config,
 * discovery_host,
 * discovery_port,
 * max_attempts,
 * retry_interval,
 * callback,
 * attempts,
 * );
 * @description This function registers a service with the discovery server.
 * @exports registerInDiscovery
 */
function registerInDiscovery(
  config,
  discovery_host,
  discovery_port,
  max_attempts,
  retry_interval,
  callback,
  attempts = 0,
) {
  // register the service with the discovery server
  fetch(`http://${discovery_host}:${discovery_port}/bitmonx/register`, {
    method: 'POST',
    body: JSON.stringify(config.service),
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then((res) => res.json())
    .then((json) => {
      console.log(
        `Service registered successfully: SERVICE_ID: ${json.serviceId} INSTANCE_ID: ${json.instanceId}`,
      );
      setServiceId(json.serviceId);
      setInstanceId(json.instanceId);

      // call the callback function
      callback();
      return;
    })
    .catch((err) => {
      const timeout = setTimeout(() => {
        console.log(
          `[ATTEMPT ${attempts}] Retrying to register the service...`,
        );
        attempts += 1;
        if (attempts > max_attempts) {
          console.error('Could not register the service');
          console.error('Max attempts reached. Exiting...');
          process.exit(1);
        }
        // else call the function again
        registerInDiscovery(
          config,
          discovery_host,
          discovery_port,
          max_attempts,
          retry_interval,
          callback,
          attempts,
        );

        return clearTimeout(timeout);
      }, retry_interval);
    });
}

module.exports = registerInDiscovery;
