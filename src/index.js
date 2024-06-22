const { fetch_health } = require('./health/controller');

let service_id = null;
let instance_id = null;

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
  );
}

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
      console.log('Service registered successfully');
      console.log(json);
      service_id = json.service_id;
      instance_id = json.instance_id;
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

module.exports = initBitMonX;
