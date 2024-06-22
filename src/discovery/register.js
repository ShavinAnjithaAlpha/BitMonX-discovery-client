const { setServiceId, setInstanceId } = require('../instance.details');
const sendHeartBeat = require('./heartbeat');

function registerInDiscovery(
  config,
  discovery_host,
  discovery_port,
  max_attempts,
  retry_interval,
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

      // initiate the heartbeat signalling process
      sendHeartBeat();
      return;
    })
    .catch((err) => {
      const timeout = setTimeout(() => {
        console.log('Retrying to register the service...');
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
          attempts,
        );

        return clearTimeout(timeout);
      }, retry_interval);
    });
}

module.exports = registerInDiscovery;
