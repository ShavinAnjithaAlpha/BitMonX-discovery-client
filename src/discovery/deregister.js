/**
 * Deregister a service from the discovery server
 * @param {string} service_id - The service id of the service
 * @param {string} instance_id - The instance id of the service
 * @returns {void}
 * @example
 * const deregister = require('./deregister');
 * deregister('service_id', 'instance_id');
 * @description This function deregisters a service from the discovery server.
 * @exports deregister
 * @requires fetch
 * @requires read_config
 * @requires path
 */
function deregister(service_id, instance_id) {
  // read the config from the cofing.json file
  const config = require('../read_config');
  const host = config.discovery.server.host;
  const port = config.discovery.server.port;

  fetch(
    `http://${host}:${port}/bitmonx/deregister?serviceId=${service_id}&instanceId=${instance_id}`,
    {
      method: 'DLELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    },
  )
    .then((res) => {
      console.log('service deregistered successfully');
      return;
    })
    .catch((err) => {
      console.log('Could not deregister the service');
    });
}

module.exports = deregister;
